// auth.js - mode baca saja default, admin login via tombol header, session timeout 30 menit
// username: karyamuda, password: 1234

let currentUser = null;
let inactivityTimer = null;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 menit

function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (currentUser && currentUser.role === 'admin') {
        inactivityTimer = setTimeout(logout, SESSION_TIMEOUT);
    }
}

function logout() {
    if (currentUser && currentUser.role === 'admin') {
        currentUser = null;
        sessionStorage.removeItem('adminSession');
        toast('✅ Admin logout. Kembali ke mode tampil biasa.');
        // Hapus semua perubahan mode edit dan aktifkan mode baca
        enableViewOnlyMode();
        updateHeaderForViewOnly();
        // Reload halaman untuk mereset semua state
        location.reload();
    }
}

// Aktifkan mode baca saja (semua tombol edit nonaktif)
function enableViewOnlyMode() {
    // Nonaktifkan semua input, select, textarea yang biasanya untuk input/edit
    document.querySelectorAll('input, select, textarea').forEach(el => {
        // Jangan nonaktifkan input pencarian (search) dan input bulan/daterange di filter
        if (el.id && (el.id.includes('search') || el.id.includes('filter') || el.id === 'rekap-tgl-awal' || el.id === 'rekap-tgl-akhir' || el.id.includes('summary-bulan'))) {
            // Biarkan aktif untuk filter
            return;
        }
        el.disabled = true;
        el.style.opacity = '0.6';
        el.style.cursor = 'not-allowed';
    });
    // Nonaktifkan tombol aksi utama: save, add, edit, delete, simpan, tambah, submit
    document.querySelectorAll('button[onclick*="save"], button[onclick*="add"], button[onclick*="edit"], button[onclick*="delete"], button[onclick*="Simpan"], button[onclick*="Tambah"], .btn-edit, .btn-del, .btn-primary:not(#refresh-dashboard-btn):not(#excel-export-btn):not(#json-export-btn)').forEach(el => {
        if (el && !el.closest('.subtab-toggle')?.querySelector('.btn-primary')) {
            el.disabled = true;
            el.style.opacity = '0.6';
            el.style.cursor = 'not-allowed';
        }
    });
    // Nonaktifkan tombol simpan di form sawmill, produksi, dll
    document.querySelectorAll('#btn-save-penjualan, #saveBoardStock, #saveOpname, .form-actions .btn-primary').forEach(el => {
        if (el) {
            el.disabled = true;
            el.style.opacity = '0.6';
            el.style.cursor = 'not-allowed';
        }
    });
    // Sembunyikan tombol edit/hapus di tabel
    document.querySelectorAll('.action-buttons button, .btn-edit, .btn-del').forEach(btn => {
        if (btn) btn.style.display = 'none';
    });
    // Sembunyikan tombol "Input Baru" di subtab toggle
    document.querySelectorAll('.subtab-toggle .btn-primary').forEach(btn => {
        if (btn) btn.style.display = 'none';
    });
    // Nonaktifkan tombol reset oven, export/import (opsional)
    document.querySelectorAll('#reset-oven-btn, #excel-export-btn, #json-export-btn, #theme-toggle-btn').forEach(btn => {
        if (btn) btn.disabled = true;
    });
    // Tambahkan watermark jika belum ada
    if (!document.getElementById('viewer-watermark')) {
        const watermark = document.createElement('div');
        watermark.id = 'viewer-watermark';
        watermark.style.position = 'fixed';
        watermark.style.bottom = '10px';
        watermark.style.right = '10px';
        watermark.style.backgroundColor = 'rgba(0,0,0,0.6)';
        watermark.style.color = '#ffaa00';
        watermark.style.padding = '4px 12px';
        watermark.style.borderRadius = '20px';
        watermark.style.fontSize = '11px';
        watermark.style.zIndex = '9999';
        watermark.innerHTML = '👁️ Mode Baca Saja (Login sebagai Admin untuk edit)';
        document.body.appendChild(watermark);
    }
}

// Aktifkan mode admin (semua tombol aktif, tampilkan tombol edit)
function enableAdminMode() {
    // Aktifkan semua input, select, textarea (termasuk filter)
    document.querySelectorAll('input, select, textarea, button').forEach(el => {
        el.disabled = false;
        el.style.opacity = '';
        el.style.cursor = '';
    });
    // Tampilkan tombol aksi yang disembunyikan
    document.querySelectorAll('.action-buttons button, .btn-edit, .btn-del').forEach(btn => {
        if (btn) btn.style.display = '';
    });
    document.querySelectorAll('.subtab-toggle .btn-primary').forEach(btn => {
        if (btn) btn.style.display = '';
    });
    // Aktifkan tombol export/import
    document.querySelectorAll('#reset-oven-btn, #excel-export-btn, #json-export-btn, #theme-toggle-btn').forEach(btn => {
        if (btn) btn.disabled = false;
    });
    const watermark = document.getElementById('viewer-watermark');
    if (watermark) watermark.remove();
}

function updateHeaderForViewOnly() {
    const userSpan = document.getElementById('header-user');
    if (userSpan) userSpan.textContent = '👁️ Mode Baca Saja';
    const loginBtn = document.getElementById('admin-login-btn');
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'none';
}

function updateHeaderForAdmin(adminName) {
    const userSpan = document.getElementById('header-user');
    if (userSpan) userSpan.textContent = `👤 ${adminName} (Admin)`;
    const loginBtn = document.getElementById('admin-login-btn');
    if (loginBtn) loginBtn.style.display = 'none';
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
}

function checkAdminSession() {
    const sessionData = sessionStorage.getItem('adminSession');
    if (sessionData) {
        const session = JSON.parse(sessionData);
        const now = Date.now();
        if (now - session.timestamp < SESSION_TIMEOUT) {
            currentUser = session.user;
            enableAdminMode();
            updateHeaderForAdmin(currentUser.nama);
            resetInactivityTimer();
            attachActivityListeners();
            return true;
        } else {
            sessionStorage.removeItem('adminSession');
        }
    }
    // Default mode baca saja
    currentUser = null;
    enableViewOnlyMode();
    updateHeaderForViewOnly();
    return false;
}

function attachActivityListeners() {
    const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];
    events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
        document.addEventListener(event, resetInactivityTimer);
    });
}

function showAdminLoginModal() {
    const existing = document.getElementById('admin-login-modal');
    if (existing) existing.remove();
    const modalHtml = `
        <div id="admin-login-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10001;">
            <div style="background:var(--bg2);border:1px solid var(--gold);border-radius:12px;padding:24px;width:340px;">
                <h3 style="color:var(--gold);margin-bottom:16px;">🔐 Login Admin</h3>
                <div class="field">
                    <label>Username</label>
                    <input type="text" id="admin-username" placeholder="karyamuda" style="width:100%;">
                </div>
                <div class="field mt8">
                    <label>Password</label>
                    <input type="password" id="admin-password" placeholder="******" style="width:100%;">
                </div>
                <div class="flex gap10" style="margin-top:20px;justify-content:flex-end;">
                    <button class="btn btn-secondary" onclick="closeAdminModal()">Batal</button>
                    <button class="btn btn-primary" onclick="submitAdminLogin()">Login</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('admin-username').focus();
}

window.closeAdminModal = function() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.remove();
};

window.submitAdminLogin = function() {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    const user = window.appUsers.find(u => u.username === username && u.password === password && u.role === 'admin');
    if (user) {
        currentUser = user;
        const session = { user: user, timestamp: Date.now() };
        sessionStorage.setItem('adminSession', JSON.stringify(session));
        enableAdminMode();
        updateHeaderForAdmin(user.nama);
        resetInactivityTimer();
        attachActivityListeners();
        closeAdminModal();
        toast(`✅ Selamat datang, ${user.nama}`);
        location.reload(); // Reload untuk memastikan semua komponen aktif
    } else {
        toast('❌ Username atau password salah!');
    }
};

function addAdminButtons() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;
    if (document.getElementById('admin-login-btn')) return;
    
    const loginBtn = document.createElement('button');
    loginBtn.id = 'admin-login-btn';
    loginBtn.className = 'btn btn-sm btn-secondary';
    loginBtn.innerHTML = '🔐 Login Admin';
    loginBtn.onclick = showAdminLoginModal;
    
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'admin-logout-btn';
    logoutBtn.className = 'btn btn-sm btn-secondary';
    logoutBtn.innerHTML = '🚪 Logout Admin';
    logoutBtn.onclick = () => { if(confirm('Logout admin?')) logout(); };
    logoutBtn.style.display = 'none';
    
    headerActions.appendChild(loginBtn);
    headerActions.appendChild(logoutBtn);
}

// Override renderAll untuk memastikan mode diterapkan setelah render
if (typeof window.renderAll === 'function') {
    const originalRenderAll = window.renderAll;
    window.renderAll = function() {
        originalRenderAll();
        if (currentUser && currentUser.role === 'admin') {
            enableAdminMode();
        } else {
            enableViewOnlyMode();
        }
    };
}

function ensureDefaultUsers() {
    if (!window.appUsers || window.appUsers.length === 0) {
        window.appUsers = [
            { id: 'admin1', username: 'karyamuda', password: '1234', role: 'admin', nama: 'Administrator' }
        ];
        if (typeof persistAll === 'function') persistAll();
        else if (typeof saveData === 'function' && STORAGE_KEYS && STORAGE_KEYS.USERS) {
            saveData(STORAGE_KEYS.USERS, window.appUsers);
        }
    } else {
        // Pastikan user karyamuda ada
        const exists = window.appUsers.some(u => u.username === 'karyamuda');
        if (!exists) {
            window.appUsers.push({ id: 'admin1', username: 'karyamuda', password: '1234', role: 'admin', nama: 'Administrator' });
            if (typeof persistAll === 'function') persistAll();
        }
    }
}

// Inisialisasi
window.addEventListener('DOMContentLoaded', () => {
    if (typeof loadAllData === 'function') loadAllData();
    ensureDefaultUsers();
    checkAdminSession();
    addAdminButtons();
    // Jalankan render utama jika belum
    if (typeof initApp === 'function') {
        initApp();
    } else if (typeof renderAll === 'function') {
        renderAll();
    }
});