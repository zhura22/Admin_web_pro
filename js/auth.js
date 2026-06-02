// auth.js — FIXED & IMPROVED
// Perbaikan utama:
//   1. CSS class-based view-only (tahan render dinamis)
//   2. Hapus location.reload() — pakai renderAll() langsung
//   3. Login attempt lockout (max 5x)
//   4. Warning sebelum session timeout
//   5. Password hash sederhana (bukan plain text)
//   6. Override renderAll dilakukan SETELAH DOMContentLoaded

// ═══════════════════════════════════════════════════════════
// KONSTANTA
// ═══════════════════════════════════════════════════════════
const SESSION_TIMEOUT    = 30 * 60 * 1000;  // 30 menit
const TIMEOUT_WARNING    =  2 * 60 * 1000;  // peringatan 2 menit sebelum timeout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION   = 5 * 60 * 1000;   // lockout 5 menit setelah 5x salah
const STORAGE_SESSION    = 'kmsu_admin_session';
const STORAGE_LOCKOUT    = 'kmsu_login_lockout';

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
let currentUser         = null;
let inactivityTimer     = null;
let warningTimer        = null;
let loginAttempts       = 0;

// ═══════════════════════════════════════════════════════════
// 1. INJECT CSS VIEW-ONLY MODE
// Pendekatan class-based: tambah/hapus class di <body>
// CSS ini aktif otomatis ke semua elemen baru hasil render dinamis
// ═══════════════════════════════════════════════════════════
(function injectAuthCSS() {
    if (document.getElementById('auth-style')) return;
    const style = document.createElement('style');
    style.id    = 'auth-style';
    style.textContent = `
        /* ── VIEW-ONLY MODE ── */
        body.view-only .btn-edit,
        body.view-only .btn-del,
        body.view-only .btn-primary:not(.safe-btn),
        body.view-only .form-actions .btn-primary,
        body.view-only .subtab-toggle .btn-primary,
        body.view-only button[onclick*="openSawmillForm"],
        body.view-only button[onclick*="openOvenInputForm"],
        body.view-only button[onclick*="openProduksiForm"],
        body.view-only button[onclick*="saveBoardStock"],
        body.view-only button[onclick*="saveSezing"],
        body.view-only button[onclick*="savePenjualan"],
        body.view-only button[onclick*="resetOvenData"],
        body.view-only button[onclick*="resetAllData"],
        body.view-only #btn-save-penjualan,
        body.view-only .palet-delete-btn {
            display: none !important;
        }

        /* Tombol yang tetap aktif di view-only */
        body.view-only .btn-print,
        body.view-only .btn-secondary.subtab-btn,
        body.view-only button[onclick*="export"],
        body.view-only button[onclick*="Export"],
        body.view-only button[onclick*="renderRekap"],
        body.view-only button[onclick*="renderDashboard"],
        body.view-only button[onclick*="window.renderSezing"],
        body.view-only button[onclick*="window.renderSawmill"],
        body.view-only button[onclick*="window.renderPenjualan"],
        body.view-only #refresh-dashboard-btn,
        body.view-only .safe-btn {
            display: inline-flex !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }

        /* Input/select: hanya-baca di view-only */
        body.view-only .form-card input:not([id*="filter"]):not([id*="search"])
                                                              :not([id*="summary"]):not(.search),
        body.view-only .form-card select,
        body.view-only .form-card textarea {
            pointer-events: none;
            user-select: none;
            opacity: 0.55;
            cursor: not-allowed;
        }

        /* Filter, search, subtab tetap aktif */
        body.view-only input.search,
        body.view-only input[id*="filter"],
        body.view-only input[id*="search"],
        body.view-only input[id*="bulan"],
        body.view-only input[id*="summary"],
        body.view-only input#rekap-bulan,
        body.view-only select[id*="filter"] {
            pointer-events: auto !important;
            opacity: 1 !important;
            cursor: auto !important;
        }

        /* Watermark view-only */
        #viewer-watermark {
            position: fixed;
            bottom: 14px;
            right: 14px;
            background: rgba(10,10,8,0.85);
            color: var(--gold);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-family: var(--font-mono);
            z-index: 9999;
            border: 1px solid rgba(212,160,23,0.25);
            pointer-events: none;
            letter-spacing: 0.3px;
        }

        /* Session warning bar */
        #session-warning-bar {
            position: fixed;
            top: 62px;
            left: 0; right: 0;
            background: rgba(251,146,60,0.9);
            color: #111;
            text-align: center;
            font-size: 12px;
            font-family: var(--font-mono);
            font-weight: 700;
            padding: 8px;
            z-index: 9998;
            display: none;
        }

        /* Login modal animation */
        #admin-login-modal {
            animation: fadeIn 0.2s ease;
        }
        #admin-login-modal .modal-inner {
            animation: modalSlideIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
    `;
    document.head.appendChild(style);
})();

// ═══════════════════════════════════════════════════════════
// 2. HASH PASSWORD SEDERHANA
// Menghindari password plain text di memory/localStorage
// ═══════════════════════════════════════════════════════════
function simpleHash(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash  = (hash * 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}

// ═══════════════════════════════════════════════════════════
// 3. LOGIN LOCKOUT
// ═══════════════════════════════════════════════════════════
function isLockedOut() {
    try {
        const data = JSON.parse(sessionStorage.getItem(STORAGE_LOCKOUT) || 'null');
        if (!data) return false;
        if (Date.now() - data.time < LOCKOUT_DURATION) return true;
        sessionStorage.removeItem(STORAGE_LOCKOUT);
        loginAttempts = 0;
        return false;
    } catch { return false; }
}

function getLockoutRemaining() {
    try {
        const data = JSON.parse(sessionStorage.getItem(STORAGE_LOCKOUT) || 'null');
        if (!data) return 0;
        const remaining = LOCKOUT_DURATION - (Date.now() - data.time);
        return Math.max(0, Math.ceil(remaining / 1000));
    } catch { return 0; }
}

function setLockout() {
    sessionStorage.setItem(STORAGE_LOCKOUT, JSON.stringify({ time: Date.now() }));
}

// ═══════════════════════════════════════════════════════════
// 4. SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════
function saveSession(user) {
    const session = {
        userId:    user.id,
        nama:      user.nama,
        role:      user.role,
        timestamp: Date.now()
    };
    sessionStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
}

function clearSession() {
    sessionStorage.removeItem(STORAGE_SESSION);
}

function checkAdminSession() {
    try {
        const raw = sessionStorage.getItem(STORAGE_SESSION);
        if (!raw) return _applyViewOnly();
        const session = JSON.parse(raw);
        if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
            clearSession();
            return _applyViewOnly();
        }
        // Sesi valid — cari user di appUsers
        const user = (window.appUsers || []).find(u => u.id === session.userId);
        if (!user || user.role !== 'admin') {
            clearSession();
            return _applyViewOnly();
        }
        currentUser = user;
        _applyAdminMode();
        resetInactivityTimer();
        attachActivityListeners();
        return true;
    } catch {
        clearSession();
        return _applyViewOnly();
    }
}

// ═══════════════════════════════════════════════════════════
// 5. APPLY MODE — CSS class, bukan DOM iteration
// ═══════════════════════════════════════════════════════════
function _applyViewOnly() {
    currentUser = null;
    document.body.classList.add('view-only');
    document.body.classList.remove('admin-mode');

    // Watermark
    if (!document.getElementById('viewer-watermark')) {
        const el       = document.createElement('div');
        el.id          = 'viewer-watermark';
        el.innerHTML   = '👁️ Mode Baca Saja — Login sebagai Admin untuk edit';
        document.body.appendChild(el);
    }

    updateHeaderForViewOnly();
    return false;
}

function _applyAdminMode() {
    document.body.classList.remove('view-only');
    document.body.classList.add('admin-mode');

    const wm = document.getElementById('viewer-watermark');
    if (wm) wm.remove();

    updateHeaderForAdmin(currentUser?.nama || 'Admin');
}

// ═══════════════════════════════════════════════════════════
// 6. INACTIVITY TIMER + WARNING
// ═══════════════════════════════════════════════════════════
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    hideSessionWarning();

    if (!currentUser || currentUser.role !== 'admin') return;

    // Warning 2 menit sebelum timeout
    warningTimer = setTimeout(() => {
        showSessionWarning();
    }, SESSION_TIMEOUT - TIMEOUT_WARNING);

    // Auto-logout
    inactivityTimer = setTimeout(() => {
        _performLogout(true);
    }, SESSION_TIMEOUT);
}

function showSessionWarning() {
    let bar = document.getElementById('session-warning-bar');
    if (!bar) {
        bar       = document.createElement('div');
        bar.id    = 'session-warning-bar';
        document.body.appendChild(bar);
    }
    bar.style.display = 'block';
    bar.innerHTML     = '⚠️ Sesi admin akan berakhir dalam 2 menit karena tidak ada aktivitas. ' +
        '<button onclick="resetInactivityTimer()" ' +
        'style="margin-left:10px;background:#111;color:#fb923c;border:1px solid #fb923c;' +
        'padding:2px 10px;border-radius:4px;cursor:pointer;font-size:11px;">Perpanjang Sesi</button>';
}

function hideSessionWarning() {
    const bar = document.getElementById('session-warning-bar');
    if (bar) bar.style.display = 'none';
}

function attachActivityListeners() {
    const fn     = resetInactivityTimer;
    const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];
    events.forEach(ev => {
        document.removeEventListener(ev, fn);
        document.addEventListener(ev, fn, { passive: true });
    });
}

// ═══════════════════════════════════════════════════════════
// 7. LOGOUT
// ═══════════════════════════════════════════════════════════
function _performLogout(isTimeout = false) {
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    hideSessionWarning();
    clearSession();
    currentUser = null;

    _applyViewOnly();

    if (isTimeout) {
        toast('⏱️ Sesi admin berakhir karena tidak aktif.');
    } else {
        toast('👋 Logout berhasil. Kembali ke mode baca saja.');
    }

    // Render ulang TANPA reload — cukup panggil renderAll
    if (typeof window.renderAll === 'function') {
        setTimeout(() => window.renderAll(), 100);
    }
}

window.logoutAdmin = function () {
    if (!currentUser) return;
    if (!confirm('Logout dari mode admin?')) return;
    _performLogout(false);
};

// ═══════════════════════════════════════════════════════════
// 8. HEADER UPDATE
// ═══════════════════════════════════════════════════════════
function updateHeaderForViewOnly() {
    const userSpan  = document.getElementById('header-user');
    const loginBtn  = document.getElementById('admin-login-btn');
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (userSpan)  userSpan.textContent    = '👁️ Baca Saja';
    if (loginBtn)  loginBtn.style.display  = 'inline-flex';
    if (logoutBtn) logoutBtn.style.display = 'none';
}

function updateHeaderForAdmin(nama) {
    const userSpan  = document.getElementById('header-user');
    const loginBtn  = document.getElementById('admin-login-btn');
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (userSpan)  userSpan.textContent    = `👤 ${nama}`;
    if (loginBtn)  loginBtn.style.display  = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
}

// ═══════════════════════════════════════════════════════════
// 9. TOMBOL HEADER
// ═══════════════════════════════════════════════════════════
function addAdminButtons() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions || document.getElementById('admin-login-btn')) return;

    // User badge
    if (!document.getElementById('header-user')) {
        const span       = document.createElement('span');
        span.id          = 'header-user';
        span.className   = 'badge';
        span.textContent = '👁️ Baca Saja';
        headerActions.insertBefore(span, headerActions.firstChild);
    }

    // Tombol Login
    const loginBtn     = document.createElement('button');
    loginBtn.id        = 'admin-login-btn';
    loginBtn.className = 'btn btn-sm btn-secondary safe-btn';
    loginBtn.innerHTML = '🔐 Login Admin';
    loginBtn.onclick   = showAdminLoginModal;

    // Tombol Logout
    const logoutBtn     = document.createElement('button');
    logoutBtn.id        = 'admin-logout-btn';
    logoutBtn.className = 'btn btn-sm btn-secondary safe-btn';
    logoutBtn.innerHTML = '🚪 Logout';
    logoutBtn.onclick   = window.logoutAdmin;
    logoutBtn.style.display = 'none';

    headerActions.appendChild(loginBtn);
    headerActions.appendChild(logoutBtn);
}

// ═══════════════════════════════════════════════════════════
// 10. MODAL LOGIN
// ═══════════════════════════════════════════════════════════
function showAdminLoginModal() {
    const existing = document.getElementById('admin-login-modal');
    if (existing) existing.remove();

    // Cek lockout
    if (isLockedOut()) {
        const sisa = getLockoutRemaining();
        _showLoginError(`Terlalu banyak percobaan login. Coba lagi dalam ${sisa} detik.`);
        return;
    }

    const html = `
    <div id="admin-login-modal"
        style="position:fixed;inset:0;background:rgba(0,0,0,0.82);
               backdrop-filter:blur(4px);display:flex;align-items:center;
               justify-content:center;z-index:10001;padding:20px;">
        <div class="modal-inner"
            style="background:var(--bg2);border:1px solid var(--gold-dim);
                   border-radius:14px;padding:28px;width:340px;max-width:100%;
                   box-shadow:0 20px 60px rgba(0,0,0,0.8),0 0 0 1px rgba(212,160,23,0.1) inset;
                   position:relative;">
            <!-- Gold top accent -->
            <div style="position:absolute;top:0;left:24px;right:24px;height:1px;
                        background:linear-gradient(90deg,transparent,rgba(212,160,23,.5),transparent);"></div>

            <div style="text-align:center;margin-bottom:22px;">
                <div style="font-size:28px;margin-bottom:8px;">🔐</div>
                <div style="font-family:var(--font-mono);font-size:15px;font-weight:700;
                            color:var(--gold);">Login Administrator</div>
                <div style="font-size:11px;color:var(--muted);margin-top:4px;">
                    KMSU Admin Panel</div>
            </div>

            <!-- Error box -->
            <div id="login-error-box"
                style="display:none;background:var(--red-bg);color:var(--red);
                       border:1px solid var(--red-border);border-radius:8px;
                       padding:10px 13px;margin-bottom:14px;font-size:12px;"></div>

            <!-- Attempt indicator -->
            <div id="login-attempt-info"
                style="display:none;font-size:10px;color:var(--orange);
                       text-align:center;margin-bottom:10px;"></div>

            <div class="field" style="margin-bottom:13px;">
                <label style="font-size:10px;color:var(--muted);text-transform:uppercase;
                              letter-spacing:.8px;font-weight:700;margin-bottom:5px;display:block;">
                    Username
                </label>
                <input type="text" id="admin-username" autocomplete="username"
                    placeholder="Masukkan username"
                    style="width:100%;background:var(--input-bg);border:1px solid var(--input-border);
                           color:var(--input-color);padding:10px 13px;border-radius:6px;
                           font-size:13px;font-family:var(--font-mono);outline:none;">
            </div>

            <div class="field" style="margin-bottom:6px;">
                <label style="font-size:10px;color:var(--muted);text-transform:uppercase;
                              letter-spacing:.8px;font-weight:700;margin-bottom:5px;display:block;">
                    Password
                </label>
                <div style="position:relative;">
                    <input type="password" id="admin-password" autocomplete="current-password"
                        placeholder="Masukkan password"
                        style="width:100%;background:var(--input-bg);border:1px solid var(--input-border);
                               color:var(--input-color);padding:10px 36px 10px 13px;border-radius:6px;
                               font-size:13px;font-family:var(--font-mono);outline:none;">
                    <button onclick="_togglePasswordVisibility()"
                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);
                               background:none;border:none;color:var(--muted);cursor:pointer;
                               font-size:14px;padding:0;" id="pw-toggle" title="Tampilkan/sembunyikan">
                        👁
                    </button>
                </div>
            </div>

            <div style="display:flex;gap:8px;margin-top:18px;">
                <button class="btn btn-secondary" onclick="closeAdminModal()"
                    style="flex:1;">Batal</button>
                <button class="btn btn-primary safe-btn" id="login-submit-btn"
                    onclick="window.submitAdminLogin()" style="flex:2;">
                    🔐 Login
                </button>
            </div>

            <div style="text-align:center;margin-top:14px;font-size:10px;color:var(--muted);">
                Sesi aktif selama 30 menit tanpa aktivitas
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    // Focus username
    setTimeout(() => document.getElementById('admin-username')?.focus(), 50);

    // Enter key support
    const onEnter = e => { if (e.key === 'Enter') window.submitAdminLogin(); };
    document.getElementById('admin-username')?.addEventListener('keydown', onEnter);
    document.getElementById('admin-password')?.addEventListener('keydown', onEnter);

    // Update attempt indicator jika sudah ada percobaan sebelumnya
    if (loginAttempts > 0) {
        _updateAttemptInfo();
    }
}

window._togglePasswordVisibility = function () {
    const input = document.getElementById('admin-password');
    const btn   = document.getElementById('pw-toggle');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    if (btn) btn.textContent = input.type === 'password' ? '👁' : '🙈';
};

function _showLoginError(msg) {
    const box = document.getElementById('login-error-box');
    if (box) {
        box.style.display = 'block';
        box.textContent   = '⚠️ ' + msg;
    } else {
        // Modal belum ada — tampilkan toast
        if (typeof toast === 'function') toast('❌ ' + msg);
    }
}

function _updateAttemptInfo() {
    const el = document.getElementById('login-attempt-info');
    if (!el) return;
    const sisa = MAX_LOGIN_ATTEMPTS - loginAttempts;
    if (sisa <= 3 && sisa > 0) {
        el.style.display = 'block';
        el.textContent   = `⚠️ Percobaan tersisa: ${sisa}x sebelum terkunci`;
    }
}

window.closeAdminModal = function () {
    document.getElementById('admin-login-modal')?.remove();
};

// ═══════════════════════════════════════════════════════════
// 11. SUBMIT LOGIN — dengan lockout & hash check
// ═══════════════════════════════════════════════════════════
window.submitAdminLogin = function () {
    if (isLockedOut()) {
        _showLoginError(`Akun terkunci. Coba lagi dalam ${getLockoutRemaining()} detik.`);
        return;
    }

    const username = document.getElementById('admin-username')?.value?.trim();
    const password = document.getElementById('admin-password')?.value;

    if (!username || !password) {
        _showLoginError('Username dan password tidak boleh kosong!');
        return;
    }

    const btn = document.getElementById('login-submit-btn');
    if (btn) {
        btn.textContent    = '⏳ Memeriksa...';
        btn.disabled       = true;
    }

    // Simulasi delay kecil (anti brute force timing attack)
    setTimeout(() => {
        _doLoginCheck(username, password, btn);
    }, 300);
};

function _doLoginCheck(username, password, btn) {
    const users = window.appUsers || [];

    // Cek dengan hash dulu, fallback ke plain text untuk backward compatibility
    const hashedInput = simpleHash(username + ':' + password);
    let user = users.find(u =>
        u.role === 'admin' &&
        u.username === username &&
        (u.passwordHash === hashedInput || u.password === password)
    );

    if (user) {
        // Login berhasil
        loginAttempts = 0;
        sessionStorage.removeItem(STORAGE_LOCKOUT);

        // Upgrade ke hash jika masih plain text
        if (user.password && !user.passwordHash) {
            user.passwordHash = simpleHash(user.username + ':' + user.password);
            delete user.password;
            if (typeof persistAll === 'function') persistAll();
        }

        currentUser = user;
        saveSession(user);
        _applyAdminMode();
        resetInactivityTimer();
        attachActivityListeners();
        closeAdminModal();
        toast(`✅ Selamat datang, ${user.nama}!`);

        // Render ulang TANPA reload
        if (typeof window.renderAll === 'function') {
            setTimeout(() => window.renderAll(), 50);
        }

    } else {
        // Login gagal
        loginAttempts++;

        if (btn) {
            btn.textContent = '🔐 Login';
            btn.disabled    = false;
        }

        if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            setLockout();
            loginAttempts = 0;
            _showLoginError(
                `Terlalu banyak percobaan login. Akun terkunci selama ${LOCKOUT_DURATION / 60000} menit.`
            );
            // Nonaktifkan tombol submit
            if (btn) {
                btn.disabled    = true;
                btn.textContent = '🔒 Terkunci';
            }
        } else {
            const sisa = MAX_LOGIN_ATTEMPTS - loginAttempts;
            _showLoginError(`Username atau password salah!`);
            _updateAttemptInfo();

            // Shake animation pada password field
            const pwInput = document.getElementById('admin-password');
            if (pwInput) {
                pwInput.style.animation = 'none';
                pwInput.style.borderColor = 'var(--red)';
                setTimeout(() => {
                    pwInput.style.borderColor = '';
                }, 1500);
                pwInput.value = '';
                pwInput.focus();
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
// 12. PASTIKAN DEFAULT USER ADA
// ═══════════════════════════════════════════════════════════
function ensureDefaultUsers() {
    if (!window.appUsers) window.appUsers = [];

    const hasAdmin = window.appUsers.some(u => u.role === 'admin');
    if (!hasAdmin) {
        // Buat default admin dengan password hash
        const defaultUser = {
            id:           'admin1',
            username:     'karyamuda',
            passwordHash: simpleHash('karyamuda:1234'),
            role:         'admin',
            nama:         'Administrator KMSU'
        };
        window.appUsers.push(defaultUser);
        if (typeof persistAll === 'function') {
            try { persistAll(); } catch (e) { /* silent */ }
        }
    }
}

// ═══════════════════════════════════════════════════════════
// 13. OVERRIDE renderAll SETELAH MODULE LAIN LOAD
// Dilakukan di DOMContentLoaded agar renderAll sudah terdefinisi
// ═══════════════════════════════════════════════════════════
function patchRenderAll() {
    if (typeof window.renderAll !== 'function') return;
    if (window.renderAll._authPatched) return;

    const original         = window.renderAll;
    window.renderAll       = function (...args) {
        original.apply(this, args);
        // Re-terapkan mode setelah render selesai
        setTimeout(() => {
            if (currentUser && currentUser.role === 'admin') {
                _applyAdminMode();
            } else {
                _applyViewOnly();
            }
        }, 0);
    };
    window.renderAll._authPatched = true;
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
    // 1. Load semua data
    if (typeof loadAllData === 'function') loadAllData();

    // 2. Pastikan default user ada
    ensureDefaultUsers();

    // 3. Tambahkan tombol di header
    addAdminButtons();

    // 4. Cek session yang tersimpan
    checkAdminSession();

    // 5. Patch renderAll setelah semua module dimuat
    patchRenderAll();

    // 6. Jalankan render utama
    if (typeof initApp === 'function') {
        initApp();
    } else if (typeof renderAll === 'function') {
        renderAll();
    }

    // 7. Re-patch renderAll jika belum terdefinisi saat DOMContentLoaded
    //    (beberapa module mungkin load async)
    setTimeout(patchRenderAll, 500);
});

// ═══════════════════════════════════════════════════════════
// EXPOSE helper untuk dipakai modul lain
// ═══════════════════════════════════════════════════════════
window.isAdminMode   = () => !!(currentUser && currentUser.role === 'admin');
window.getCurrentUser= () => currentUser;
