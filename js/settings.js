// settings.js — IMPROVED
// Manajemen target harian, preferensi app, backup, tema, user/shift

// ═══════════════════════════════════════════════════════════
// DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════
const DEFAULT_SETTINGS = {
    // Target harian per modul
    targetKayuHarian:    10,
    targetSawmillHarian: 8,
    targetPlanerHarian:  3,
    targetRipsawHarian:  2.5,
    targetSeriHarian:    800,
    targetPressHarian:   1000,
    targetSezingHarian:  2,

    // Standar proses
    durasiOvenHari:      7,
    rendemenTarget:      65,
    rendemenWarn:        55,
    efRipsawTarget:      80,
    efRipsawWarn:        60,
    konversiPerM3:       500,   // estimasi lbr press per m³ kayu

    // Identitas perusahaan
    namaPerusahaan:      'UD. Karya Muda Surya Utama',
    singkatanPerusahaan: 'KMSU',
    lokasiPabrik:        'Jawa Tengah',

    // Preferensi tampilan
    theme:               'dark',
    compactMode:         false,
    showAnimations:      true,

    // Backup
    lastBackup:          '',
    backupReminderHari:  7,

    // Hari libur & non-masuk (format YYYY-MM-DD, Minggu otomatis skip)
    // Sabtu dianggap masuk kerja kecuali masuk daftar ini
    hariLibur:           [],
    liburSabtu:          false,   // true = Sabtu juga libur
};

// ═══════════════════════════════════════════════════════════
// LOAD / SAVE SETTINGS
// ═══════════════════════════════════════════════════════════
function loadSettings() {
    try {
        const saved = localStorage.getItem('kmsu_settings');
        window.appSettings = saved
            ? Object.assign({}, DEFAULT_SETTINGS, JSON.parse(saved))
            : Object.assign({}, DEFAULT_SETTINGS);
    } catch {
        window.appSettings = Object.assign({}, DEFAULT_SETTINGS);
    }
}

function saveSettings() {
    try {
        localStorage.setItem('kmsu_settings', JSON.stringify(window.appSettings));
    } catch (e) {
        toast('⚠️ Gagal menyimpan pengaturan: ' + e.message);
    }
}

// Panggil saat startup
loadSettings();

// ═══════════════════════════════════════════════════════════
// RENDER HALAMAN SETTINGS
// ═══════════════════════════════════════════════════════════
window.renderSettings = function () {
    renderSettingsBackupAlert();
    renderSettingsForm();
    renderSettingsUserList();
    renderSettingsDataPanel();
};

// ═══════════════════════════════════════════════════════════
// 1. BACKUP ALERT
// ═══════════════════════════════════════════════════════════
function renderSettingsBackupAlert() {
    const cont = document.getElementById('settings-backup-alert');
    if (!cont) return;

    const cfg        = window.appSettings;
    const lastBackup = cfg.lastBackup;
    const hariSejak  = lastBackup
        ? Math.floor((new Date() - new Date(lastBackup)) / 86400000)
        : null;
    const perlu      = hariSejak === null || hariSejak >= cfg.backupReminderHari;

    cont.innerHTML = perlu ? `
    <div class="alert-panel warning" style="margin-bottom:16px;">
        <span style="font-size:18px;">💾</span>
        <div>
            <div style="font-weight:700;margin-bottom:2px;">
                ${hariSejak === null ? 'Belum pernah backup data!' : `Backup terakhir ${hariSejak} hari lalu`}
            </div>
            <div style="font-size:11px;opacity:.85;">
                Disarankan backup setiap ${cfg.backupReminderHari} hari.
                Data tersimpan di browser — bisa hilang jika cache dihapus.
            </div>
        </div>
        <button class="btn btn-sm btn-primary" style="margin-left:auto;flex-shrink:0;"
            onclick="window.backupDataJSON()">💾 Backup Sekarang</button>
    </div>` : `
    <div class="alert-panel success" style="margin-bottom:16px;">
        <span>✅</span>
        <span>Backup terakhir: <b>${fmtDate(lastBackup)}</b> (${hariSejak} hari lalu)</span>
        <button class="btn btn-sm btn-secondary" style="margin-left:auto;flex-shrink:0;"
            onclick="window.backupDataJSON()">💾 Backup Lagi</button>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// 2. FORM PENGATURAN
// ═══════════════════════════════════════════════════════════
function renderSettingsForm() {
    const cont = document.getElementById('settings-form-container');
    if (!cont) return;
    const cfg = window.appSettings;

    cont.innerHTML = `
    <!-- ── IDENTITAS PERUSAHAAN ── -->
    <div class="form-card" style="margin-bottom:16px;">
        <div class="form-title">🏭 Identitas Perusahaan</div>
        <div class="grid3">
            <div class="field" style="grid-column:span 2">
                <label>Nama Perusahaan</label>
                <input type="text" id="cfg-nama-perusahaan" value="${cfg.namaPerusahaan}">
            </div>
            <div class="field">
                <label>Singkatan</label>
                <input type="text" id="cfg-singkatan" value="${cfg.singkatanPerusahaan}">
            </div>
            <div class="field">
                <label>Lokasi Pabrik</label>
                <input type="text" id="cfg-lokasi" value="${cfg.lokasiPabrik}">
            </div>
        </div>
    </div>

    <!-- ── TARGET HARIAN ── -->
    <div class="form-card" style="margin-bottom:16px;">
        <div class="form-title">🎯 Target Harian per Modul</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:14px;">
            Target ini digunakan di Dashboard dan Rekap untuk menghitung capaian harian.
        </div>
        <div class="grid3">
            ${settingField('cfg-target-kayu',    'Kayu Masuk (m³/hari)',   cfg.targetKayuHarian,    'number', 'any')}
            ${settingField('cfg-target-sawmill', 'Sawmill Vol.In (m³/hari)',cfg.targetSawmillHarian,'number', 'any')}
            ${settingField('cfg-target-planer',  'Planer Bagus (m³/hari)', cfg.targetPlanerHarian,  'number', 'any')}
            ${settingField('cfg-target-ripsaw',  'Ripsaw Input (m³/hari)', cfg.targetRipsawHarian,  'number', 'any')}
            ${settingField('cfg-target-seri',    'Seri (lbr/hari)',        cfg.targetSeriHarian,    'number')}
            ${settingField('cfg-target-press',   'Press (lbr/hari)',       cfg.targetPressHarian,   'number')}
            ${settingField('cfg-target-sezing',  'Sezing (m³/hari)',       cfg.targetSezingHarian,  'number', 'any')}
        </div>
    </div>

    <!-- ── STANDAR PROSES ── -->
    <div class="form-card" style="margin-bottom:16px;">
        <div class="form-title">⚙️ Standar Proses Produksi</div>
        <div class="grid3">
            ${settingField('cfg-durasi-oven',     'Durasi Oven Standar (hari)',    cfg.durasiOvenHari,     'number')}
            ${settingField('cfg-rendemen-target', 'Target Rendemen Sawmill (%)',   cfg.rendemenTarget,     'number')}
            ${settingField('cfg-rendemen-warn',   'Batas Warning Rendemen (%)',    cfg.rendemenWarn,       'number')}
            ${settingField('cfg-ef-ripsaw-target','Target Ef. Ripsaw (%)',         cfg.efRipsawTarget,     'number')}
            ${settingField('cfg-ef-ripsaw-warn',  'Batas Warning Ef. Ripsaw (%)', cfg.efRipsawWarn,       'number')}
            ${settingField('cfg-konversi-m3',     'Estimasi Press per m³ (lbr)',  cfg.konversiPerM3,      'number')}
        </div>
    </div>

    <!-- ── TAMPILAN ── -->
    <div class="form-card" style="margin-bottom:16px;">
        <div class="form-title">🎨 Preferensi Tampilan</div>
        <div class="grid3">
            <div class="field">
                <label>Tema</label>
                <select id="cfg-theme">
                    <option value="dark"   ${cfg.theme==='dark'  ?'selected':''}>🌑 Dark (Default)</option>
                    <option value="glass"  ${cfg.theme==='glass' ?'selected':''}>✨ Liquid Glass</option>
                </select>
            </div>
            <div class="field">
                <label>Pengingat Backup (hari)</label>
                <input type="number" id="cfg-backup-reminder" value="${cfg.backupReminderHari}" min="1" max="30">
            </div>
            <div class="field">
                <label>Animasi UI</label>
                <select id="cfg-animations">
                    <option value="true"  ${cfg.showAnimations?'selected':''}>✅ Aktif</option>
                    <option value="false" ${!cfg.showAnimations?'selected':''}>⛔ Nonaktif</option>
                </select>
            </div>
        </div>
    </div>

    <div class="form-actions" style="border-top:none;padding-top:0;">
        <button class="btn btn-secondary" onclick="window.resetSettings()">↩ Reset Default</button>
        <button class="btn btn-primary"   onclick="window.saveSettingsForm()">💾 Simpan Pengaturan</button>
    </div>

    <!-- ── HARI LIBUR & NON-MASUK ── -->
    <div class="form-card" style="margin-bottom:16px;margin-top:8px;">
        <div class="form-title">📅 Hari Libur &amp; Non-Masuk</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:14px;line-height:1.6;">
            Minggu otomatis tidak dihitung. Tambahkan libur nasional, cuti bersama, atau
            hari lain pabrik tidak beroperasi. Target harian <b>tidak</b> diakumulasikan pada hari-hari ini.
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
            <div class="field" style="margin:0;flex:1;min-width:140px;">
                <label>Sabtu</label>
                <select id="cfg-libur-sabtu">
                    <option value="false" ${!(cfg.liburSabtu)?'selected':''}>✅ Masuk Kerja</option>
                    <option value="true"  ${cfg.liburSabtu?'selected':''}>🔴 Libur</option>
                </select>
            </div>
            <div style="display:flex;gap:8px;align-items:flex-end;flex:2;min-width:220px;">
                <div class="field" style="margin:0;flex:1;">
                    <label>Tambah Tanggal Libur</label>
                    <input type="date" id="cfg-libur-tambah">
                </div>
                <button class="btn btn-secondary btn-sm" style="flex-shrink:0;height:36px;"
                    onclick="window.tambahHariLibur()">+ Tambah</button>
            </div>
        </div>
        <div id="libur-list-container"></div>
    </div>`;
    renderLiburList();
}

function settingField(id, label, value, type='text', step='') {
    return `
    <div class="field">
        <label>${label}</label>
        <input type="${type}" id="${id}" value="${value}"${step?` step="${step}"`:''}>
    </div>`;
}

window.saveSettingsForm = function () {
    const cfg = window.appSettings;

    cfg.namaPerusahaan      = document.getElementById('cfg-nama-perusahaan')?.value  || cfg.namaPerusahaan;
    cfg.singkatanPerusahaan = document.getElementById('cfg-singkatan')?.value        || cfg.singkatanPerusahaan;
    cfg.lokasiPabrik        = document.getElementById('cfg-lokasi')?.value           || cfg.lokasiPabrik;

    const rf = (id, fallback) => {
        const v = parseFloat(document.getElementById(id)?.value);
        return isNaN(v) ? fallback : v;
    };
    const ri = (id, fallback) => {
        const v = parseInt(document.getElementById(id)?.value);
        return isNaN(v) ? fallback : v;
    };

    cfg.targetKayuHarian    = rf('cfg-target-kayu',    cfg.targetKayuHarian);
    cfg.targetSawmillHarian = rf('cfg-target-sawmill', cfg.targetSawmillHarian);
    cfg.targetPlanerHarian  = rf('cfg-target-planer',  cfg.targetPlanerHarian);
    cfg.targetRipsawHarian  = rf('cfg-target-ripsaw',  cfg.targetRipsawHarian);
    cfg.targetSeriHarian    = ri('cfg-target-seri',    cfg.targetSeriHarian);
    cfg.targetPressHarian   = ri('cfg-target-press',   cfg.targetPressHarian);
    cfg.targetSezingHarian  = rf('cfg-target-sezing',  cfg.targetSezingHarian);
    cfg.durasiOvenHari      = ri('cfg-durasi-oven',    cfg.durasiOvenHari);
    cfg.rendemenTarget      = ri('cfg-rendemen-target',cfg.rendemenTarget);
    cfg.rendemenWarn        = ri('cfg-rendemen-warn',  cfg.rendemenWarn);
    cfg.efRipsawTarget      = ri('cfg-ef-ripsaw-target',cfg.efRipsawTarget);
    cfg.efRipsawWarn        = ri('cfg-ef-ripsaw-warn', cfg.efRipsawWarn);
    cfg.konversiPerM3       = ri('cfg-konversi-m3',    cfg.konversiPerM3);
    cfg.backupReminderHari  = ri('cfg-backup-reminder',cfg.backupReminderHari);
    cfg.theme               = document.getElementById('cfg-theme')?.value      || 'dark';
    cfg.showAnimations      = document.getElementById('cfg-animations')?.value !== 'false';
    cfg.liburSabtu          = document.getElementById('cfg-libur-sabtu')?.value === 'true';

    saveSettings();
    applyTheme();
    toast('✅ Pengaturan disimpan!');
    logActivity('Update', 'Settings', 'Pengaturan diperbarui');

    // Refresh dashboard & rekap agar target baru diterapkan
    renderDashboard?.();
    renderRekap?.();
    renderSettingsBackupAlert();
};

// ── Render daftar hari libur ──────────────────────────────────────
function renderLiburList() {
    const cont = document.getElementById('libur-list-container');
    if (!cont) return;
    const libur = (window.appSettings.hariLibur || []).slice().sort();
    if (!libur.length) {
        cont.innerHTML = `<div style="font-size:11px;color:var(--muted);
            padding:8px 0;">Belum ada hari libur yang ditambahkan.</div>`;
        return;
    }
    const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    cont.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${libur.map(tgl => {
            const d   = new Date(tgl + 'T00:00:00');
            const lbl = `${HARI[d.getDay()]}, ${tgl}`;
            return `<span style="background:var(--bg3);border:1px solid var(--border);
                        border-radius:20px;padding:4px 10px 4px 12px;font-size:11px;
                        color:var(--text);display:flex;align-items:center;gap:6px;">
                        📅 ${lbl}
                        <button onclick="window.hapusHariLibur('${tgl}')"
                            style="background:none;border:none;cursor:pointer;
                                   color:var(--muted);font-size:13px;padding:0;line-height:1;"
                            title="Hapus">×</button>
                    </span>`;
        }).join('')}
    </div>`;
}

window.tambahHariLibur = function () {
    const inp = document.getElementById('cfg-libur-tambah');
    const tgl = inp?.value;
    if (!tgl) { toast('⚠️ Pilih tanggal terlebih dahulu'); return; }
    const cfg = window.appSettings;
    if (!Array.isArray(cfg.hariLibur)) cfg.hariLibur = [];
    if (cfg.hariLibur.includes(tgl)) { toast('⚠️ Tanggal sudah ada dalam daftar'); return; }
    cfg.hariLibur.push(tgl);
    saveSettings();
    if (inp) inp.value = '';
    renderLiburList();
    renderDashboard?.();
    toast(`✅ ${tgl} ditambahkan ke daftar libur`);
};

window.hapusHariLibur = function (tgl) {
    const cfg = window.appSettings;
    cfg.hariLibur = (cfg.hariLibur || []).filter(t => t !== tgl);
    saveSettings();
    renderLiburList();
    renderDashboard?.();
    toast(`🗑️ ${tgl} dihapus dari daftar libur`);
};

window.resetSettings = function () {
    if (!confirmDialog('Reset semua pengaturan ke default?')) return;
    window.appSettings = Object.assign({}, DEFAULT_SETTINGS);
    saveSettings();
    renderSettings();
    toast('↩ Pengaturan direset ke default');
};

// ═══════════════════════════════════════════════════════════
// 3. MANAJEMEN USER / SHIFT
// ═══════════════════════════════════════════════════════════
function renderSettingsUserList() {
    const cont = document.getElementById('settings-user-container');
    if (!cont) return;

    if (!window.userList) window.userList = [];
    const users = window.userList;

    cont.innerHTML = `
    <div class="form-card" style="margin-bottom:16px;">
        <div class="form-title" style="justify-content:space-between;">
            <span>👷 Daftar Operator / User</span>
            <button class="btn btn-primary btn-sm" onclick="window.openUserForm()">+ Tambah</button>
        </div>
        ${!users.length
            ? '<div class="empty" style="padding:24px 0;">Belum ada user terdaftar</div>'
            : `<div class="table-wrap">
                <table>
                    <thead><tr>
                        <th>Nama</th><th>Jabatan / Shift</th><th>Kode</th><th>Status</th><th>Aksi</th>
                    </tr></thead>
                    <tbody>
                    ${users.map(u => `
                        <tr>
                            <td class="highlight">${u.nama}</td>
                            <td>${u.jabatan || '—'}</td>
                            <td><span class="badge-gold" style="font-size:10px;">${u.kode||'—'}</span></td>
                            <td>${u.aktif!==false
                                ? '<span class="badge-green">Aktif</span>'
                                : '<span class="badge-red">Nonaktif</span>'}</td>
                            <td style="display:flex;gap:5px;">
                                <button class="btn btn-edit btn-sm" onclick="window.editUser('${u.id}')">✏️</button>
                                <button class="btn btn-del btn-sm"  onclick="window.deleteUser('${u.id}')">🗑️</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>
               </div>`}
    </div>`;
}

window.openUserForm = function (id) {
    const item = id ? (window.userList||[]).find(u => u.id === id) : null;
    showModal(item ? '✏️ Edit User' : '+ Tambah User', `
        <div class="grid2">
            <div class="field" style="grid-column:span 2">
                <label>Nama Lengkap *</label>
                <input type="text" id="user-nama" value="${item?.nama||''}" placeholder="Nama operator">
            </div>
            <div class="field">
                <label>Jabatan / Shift</label>
                <input type="text" id="user-jabatan" value="${item?.jabatan||''}"
                    placeholder="Shift 1 / Operator Planer">
            </div>
            <div class="field">
                <label>Kode / Inisial</label>
                <input type="text" id="user-kode" value="${item?.kode||''}" placeholder="Contoh: AGS">
            </div>
            <div class="field">
                <label>No. HP</label>
                <input type="text" id="user-hp" value="${item?.hp||''}" placeholder="Opsional">
            </div>
            <div class="field">
                <label>Status</label>
                <select id="user-aktif">
                    <option value="true"  ${item?.aktif!==false?'selected':''}>✅ Aktif</option>
                    <option value="false" ${item?.aktif===false?'selected':''}>⛔ Nonaktif</option>
                </select>
            </div>
        </div>`,
        () => {
            const nama = document.getElementById('user-nama')?.value?.trim();
            if (!nama) { toast('⚠️ Nama wajib diisi!'); return false; }
            if (!window.userList) window.userList = [];

            const obj = {
                id:      item?.id || uid(),
                nama,
                jabatan: document.getElementById('user-jabatan')?.value || '',
                kode:    document.getElementById('user-kode')?.value?.toUpperCase() || '',
                hp:      document.getElementById('user-hp')?.value || '',
                aktif:   document.getElementById('user-aktif')?.value !== 'false'
            };

            if (item) {
                window.userList = window.userList.map(u => u.id === item.id ? obj : u);
            } else {
                window.userList.push(obj);
            }
            persistAll();
            renderSettingsUserList();
            toast(item ? '✅ User diperbarui' : '✅ User ditambahkan');
            return true;
        }
    );
};

window.editUser   = id => window.openUserForm(id);
window.deleteUser = function (id) {
    if (!confirmDialog('Hapus user ini?')) return;
    window.userList = (window.userList||[]).filter(u => u.id !== id);
    persistAll();
    renderSettingsUserList();
    toast('🗑️ User dihapus');
};

// ═══════════════════════════════════════════════════════════
// 4. PANEL DATA — Backup, Restore, Reset
// ═══════════════════════════════════════════════════════════
function renderSettingsDataPanel() {
    const cont = document.getElementById('settings-data-container');
    if (!cont) return;

    // Hitung ukuran data
    const dataKeys = ['kayuList','sawmillList','ovenList','produksiList',
                      'penjualanList','orderList','sezingList','batchList','activityLog'];
    const counts   = dataKeys.map(k => `${k.replace('List','').replace('Log','')}: ${(window[k]||[]).length}`);

    const totalSize = (() => {
        try {
            const totalBytes = Object.keys(localStorage)
                .filter(k => k.startsWith('kmsu_'))
                .reduce((a, k) => a + (localStorage.getItem(k)||'').length, 0);
            return (totalBytes / 1024).toFixed(1) + ' KB';
        } catch { return '—'; }
    })();

    cont.innerHTML = `
    <div class="form-card">
        <div class="form-title">💾 Manajemen Data</div>

        <!-- Data Summary -->
        <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;
                    padding:13px 16px;margin-bottom:16px;">
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;
                        letter-spacing:.8px;margin-bottom:8px;">📊 Ringkasan Data Tersimpan</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${counts.map(c => `
                    <span style="background:var(--gold-dim);color:var(--gold);
                                 border:1px solid rgba(212,160,23,.2);padding:3px 10px;
                                 border-radius:12px;font-size:10px;font-family:var(--font-mono);">
                        ${c}
                    </span>`).join('')}
                <span style="background:var(--blue-bg);color:var(--blue);
                             border:1px solid var(--blue-border);padding:3px 10px;
                             border-radius:12px;font-size:10px;font-family:var(--font-mono);">
                    Total: ${totalSize}
                </span>
            </div>
        </div>

        <!-- Aksi Data -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
            <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:14px;">
                <div style="font-size:11px;font-weight:700;color:var(--gold);margin-bottom:8px;">
                    💾 Backup (Export JSON)</div>
                <div style="font-size:11px;color:var(--muted);margin-bottom:10px;">
                    Simpan semua data ke file JSON untuk cadangan.</div>
                <button class="btn btn-primary btn-sm btn-block" onclick="window.backupDataJSON()">
                    💾 Download Backup</button>
            </div>

            <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:14px;">
                <div style="font-size:11px;font-weight:700;color:var(--blue);margin-bottom:8px;">
                    📂 Restore (Import JSON)</div>
                <div style="font-size:11px;color:var(--muted);margin-bottom:10px;">
                    Pulihkan data dari file backup JSON.</div>
                <label class="btn btn-print btn-sm btn-block" style="cursor:pointer;">
                    📂 Pilih File Backup
                    <input type="file" accept=".json" style="display:none;"
                        onchange="window.restoreDataJSON(this)">
                </label>
            </div>

            <div style="background:var(--red-bg);border:1px solid var(--red-border);
                        border-radius:8px;padding:14px;">
                <div style="font-size:11px;font-weight:700;color:var(--red);margin-bottom:8px;">
                    ⚠️ Reset Semua Data</div>
                <div style="font-size:11px;color:var(--muted);margin-bottom:10px;">
                    Hapus seluruh data produksi. Tidak bisa dibatalkan!</div>
                <button class="btn btn-del btn-sm btn-block" onclick="window.resetAllData()">
                    🗑️ Reset Data Produksi</button>
            </div>
        </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// 5. BACKUP & RESTORE
// ═══════════════════════════════════════════════════════════
window.backupDataJSON = function () {
    const dataKeys = ['kayuList','sawmillList','ovenList','produksiList',
                      'penjualanList','orderList','sezingList','batchList',
                      'activityLog','userList'];
    const payload = {
        version:   '1.0',
        timestamp: new Date().toISOString(),
        company:   window.appSettings?.namaPerusahaan || 'KMSU',
        settings:  window.appSettings,
        data: {}
    };
    dataKeys.forEach(k => { payload.data[k] = window[k] || []; });

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `backup_kmsu_${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);

    // Catat tanggal backup
    window.appSettings.lastBackup = today();
    saveSettings();
    renderSettingsBackupAlert();
    toast('✅ Backup berhasil diunduh!');
    logActivity('Backup', 'Data', 'Semua data dibackup');
};

window.restoreDataJSON = function (input) {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        try {
            const payload = JSON.parse(e.target.result);

            if (!payload.data) {
                toast('⚠️ File backup tidak valid!');
                return;
            }

            if (!confirmDialog(
                `Restore dari backup ${payload.timestamp?.slice(0,10) || '?'} oleh ${payload.company || '?'}?\n` +
                'Data saat ini akan DIGANTIKAN.'
            )) return;

            const dataKeys = ['kayuList','sawmillList','ovenList','produksiList',
                              'penjualanList','orderList','sezingList','batchList',
                              'activityLog','userList'];
            dataKeys.forEach(k => {
                if (payload.data[k] !== undefined) window[k] = payload.data[k];
            });

            if (payload.settings) {
                window.appSettings = Object.assign({}, DEFAULT_SETTINGS, payload.settings);
                saveSettings();
            }

            persistAll();
            renderAll?.();
            renderSettings();
            toast('✅ Data berhasil di-restore!');
            logActivity('Restore', 'Data', `Dari backup ${payload.timestamp?.slice(0,10)}`);
        } catch (err) {
            toast('⚠️ Gagal membaca file: ' + err.message);
        }
    };
    reader.readAsText(file);
    input.value = '';
};

window.resetAllData = function () {
    if (!confirmDialog(
        '⚠️ HAPUS SEMUA DATA PRODUKSI?\n\nTindakan ini tidak bisa dibatalkan!\nDisarankan backup dulu sebelum reset.'
    )) return;

    const dataKeys = ['kayuList','sawmillList','ovenList','produksiList',
                      'penjualanList','orderList','sezingList','batchList','activityLog'];
    dataKeys.forEach(k => { window[k] = []; });
    persistAll();
    renderAll?.();
    renderSettings();
    toast('🗑️ Semua data produksi dihapus');
    logActivity('Reset', 'Data', 'Semua data direset');
};

// ═══════════════════════════════════════════════════════════
// 6. TEMA
// ═══════════════════════════════════════════════════════════
window.applyTheme = function () {
    const cfg = window.appSettings;
    document.body.classList.toggle('liquid-glass', cfg.theme === 'glass');
};

// ═══════════════════════════════════════════════════════════
// 7. INJECT CONTAINER & INIT
// ═══════════════════════════════════════════════════════════
function initSettingsContainers() {
    const tab = document.getElementById('tab-settings');
    if (!tab) return;

    const ids = [
        'settings-backup-alert',
        'settings-form-container',
        'settings-user-container',
        'settings-data-container'
    ];
    ids.forEach(id => {
        if (!document.getElementById(id)) {
            const el = document.createElement('div');
            el.id    = id;
            tab.appendChild(el);
        }
    });
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
setTimeout(() => {
    loadSettings();
    applyTheme();
    initSettingsContainers();
    renderSettings();
}, 900);
