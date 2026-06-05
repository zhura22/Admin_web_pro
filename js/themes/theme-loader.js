/**
 * theme-loader.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sistem tema modular KMSU Admin.
 *
 * CARA MENAMBAH TEMA BARU:
 *   1. Buat file baru: js/themes/theme-namabaru.js
 *   2. Panggil: ThemeRegistry.register({ id, name, icon, variables, body })
 *   3. Tambahkan <script src="js/themes/theme-namabaru.js"></script> di index.html
 *      (sebelum theme-loader.js, atau di antara file tema lainnya)
 *   Selesai — tidak ada file lain yang perlu diubah.
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.ThemeRegistry = (() => {
    const _themes = {};   // { id: themeDefinition }

    /** Daftarkan satu tema. Dipanggil dari masing-masing file tema. */
    function register(def) {
        if (!def.id) { console.warn('[ThemeRegistry] Tema tanpa id diabaikan.'); return; }
        _themes[def.id] = def;
    }

    /** Kembalikan semua tema terdaftar sebagai array, urutan registrasi. */
    function all() { return Object.values(_themes); }

    /** Kembalikan satu tema berdasarkan id. */
    function get(id) { return _themes[id] || null; }

    /** Kembalikan array id semua tema. */
    function ids() { return Object.keys(_themes); }

    return { register, all, get, ids };
})();

// ─────────────────────────────────────────────────────────────────────────────
// Logika apply, cycle, save, load
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Terapkan tema berdasarkan id.
 * @param {string} themeId
 * @param {boolean} [silent=false] - jika true, tidak tampilkan toast
 */
function applyTheme(themeId, silent = false) {
    const theme = ThemeRegistry.get(themeId);
    if (!theme) {
        console.warn(`[ThemeLoader] Tema "${themeId}" tidak ditemukan.`);
        return;
    }

    // 1. Terapkan CSS variables ke :root
    const root = document.documentElement;
    Object.entries(theme.variables || {}).forEach(([k, v]) => root.style.setProperty(k, v));

    // 2. Terapkan body background & body classes
    const body = theme.body || {};
    document.body.style.background           = body.bg         || '';
    document.body.style.backgroundAttachment = body.attachment  || '';

    // Hapus semua body-class tema lama, lalu pasang yang baru
    ThemeRegistry.all().forEach(t => {
        const cls = (t.body || {}).bodyClass;
        if (cls) document.body.classList.remove(cls);
    });
    // Class khusus legacy (liquid-glass dsb.)
    ['liquid-glass', 'glass-purple', 'noir'].forEach(c => document.body.classList.remove(c));

    if (body.bodyClass) document.body.classList.add(body.bodyClass);

    // 3. Bersihkan canvas/overlay dari tema sebelumnya
    ['glass-ribbon-canvas', 'noir-grain-canvas', 'noir-vignette'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    // 4. Jalankan callback opsional per tema (efek khusus, canvas, dll.)
    if (typeof theme.onApply === 'function') theme.onApply();

    // 5. Simpan ke localStorage
    localStorage.setItem('app_theme', themeId);

    // 6. Update tombol tema di header
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.innerHTML = `${theme.icon || '🎨'} Tema`;

    // 7. Update dropdown di Settings (jika terbuka)
    _updateSettingsDropdown(themeId);

    // 8. Toast notifikasi
    if (!silent && typeof toast === 'function') toast(`Tema ${theme.name} diterapkan`);
}

/** Ganti ke tema berikutnya secara berurutan (cycle). */
function cycleTheme() {
    const current  = localStorage.getItem('app_theme') || ThemeRegistry.ids()[0];
    const allIds   = ThemeRegistry.ids();
    const nextId   = allIds[(allIds.indexOf(current) + 1) % allIds.length];
    applyTheme(nextId);
}

/** Load tema tersimpan, fallback ke tema pertama yang terdaftar. */
function loadSavedTheme() {
    const saved    = localStorage.getItem('app_theme');
    const fallback = ThemeRegistry.ids()[0] || 'gold';
    applyTheme((saved && ThemeRegistry.get(saved)) ? saved : fallback, true);
}

/** Update <select id="cfg-theme"> di Settings agar daftarnya selalu up-to-date. */
function _updateSettingsDropdown(activeId) {
    const sel = document.getElementById('cfg-theme');
    if (!sel) return;
    // Rebuild options jika belum sesuai jumlah tema terdaftar
    if (sel.options.length !== ThemeRegistry.all().length) {
        sel.innerHTML = ThemeRegistry.all()
            .map(t => `<option value="${t.id}">${t.icon || ''} ${t.name}</option>`)
            .join('');
    }
    sel.value = activeId || localStorage.getItem('app_theme') || ThemeRegistry.ids()[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Inisialisasi otomatis saat DOM siap
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Tombol cycle di header
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.addEventListener('click', cycleTheme);

    // Dropdown di Settings (ganti tema langsung saat dipilih)
    document.addEventListener('change', e => {
        if (e.target && e.target.id === 'cfg-theme') applyTheme(e.target.value);
    });

    loadSavedTheme();
});

// Expose global agar settings.js lama (applyTheme()) tetap bekerja
window.applyTheme    = applyTheme;
window.cycleTheme    = cycleTheme;
window.loadSavedTheme= loadSavedTheme;
