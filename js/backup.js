// ═══════════════════════════════════════════════════════════════════════
// backup.js  —  Export & Import JSON LENGKAP
// Mencakup SELURUH data: kayu, sawmill, oven, ovenHistory, produksi,
// sezing, penjualan, order, opname, boardStock, lmkb, appUsers,
// activityLog, appSettings (prodAdmin_settings + kmsu_settings)
// Versi format: 3.0
// ═══════════════════════════════════════════════════════════════════════

const BACKUP_VERSION = '3.0';

// ─── Daftar lengkap semua key data ───────────────────────────────────
const BACKUP_DATA_MAP = [
    // [ windowVar,       storageKey                  ]
    ['kayuList',        'prodAdmin_kayu'             ],
    ['sawmillList',     'prodAdmin_sawmill'          ],
    ['ovenList',        'prodAdmin_oven'             ],
    ['ovenHistoryList', 'prodAdmin_ovenHistory'      ],
    ['produksiList',    'prodAdmin_produksi'         ],
    ['sezingList',      'prodAdmin_sezing'           ],
    ['penjualanList',   'prodAdmin_penjualan'        ],
    ['orderList',       'prodAdmin_order'            ],
    ['opnameList',      'prodAdmin_opname'           ],
    ['boardStockList',  'prodAdmin_boardStock'       ],
    ['lmkbList',        'prodAdmin_lmkb'             ],
    ['appUsers',        'prodAdmin_users'            ],
    ['userList',        'prodAdmin_user'             ],
    ['activityLog',     'prodAdmin_activity'         ],
];

// ─── Helper: ambil data dari window atau langsung dari localStorage ──
function _readVar(varName, storageKey) {
    if (window[varName] !== undefined) return window[varName];
    try {
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

// ─── Helper: hitung jumlah record per key ────────────────────────────
function _countRecords(val) {
    if (Array.isArray(val)) return val.length;
    if (val && typeof val === 'object') return Object.keys(val).length;
    return 0;
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT JSON LENGKAP
// ═══════════════════════════════════════════════════════════════════════
window.exportFullData = function () {
    try {
        // ── Kumpulkan semua data ──────────────────────────────────────
        const payload = {
            version:     BACKUP_VERSION,
            exportDate:  new Date().toISOString(),
            exportBy:    window.appSettings?.namaPerusahaan || 'KMSU',
            // Settings dari dua sumber disatukan
            settings: {
                prodAdmin: (() => {
                    try { return JSON.parse(localStorage.getItem('prodAdmin_settings') || 'null'); } catch { return null; }
                })(),
                kmsu: (() => {
                    try { return JSON.parse(localStorage.getItem('kmsu_settings') || 'null'); } catch { return null; }
                })() || window.appSettings || {},
            },
            data: {}
        };

        let totalRecords = 0;
        BACKUP_DATA_MAP.forEach(([varName, storageKey]) => {
            const val = _readVar(varName, storageKey);
            payload.data[varName] = val;
            totalRecords += _countRecords(val);
        });

        payload.meta = {
            totalRecords,
            recordCounts: Object.fromEntries(
                BACKUP_DATA_MAP.map(([v]) => [v, _countRecords(payload.data[v])])
            )
        };

        // ── Download ─────────────────────────────────────────────────
        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `backup_kmsu_${today()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Catat tanggal backup di settings
        if (window.appSettings) {
            window.appSettings.lastBackup = today();
            try { localStorage.setItem('kmsu_settings', JSON.stringify(window.appSettings)); } catch {}
        }

        if (typeof logActivity === 'function') logActivity('Export', 'Backup', `JSON v${BACKUP_VERSION} — ${totalRecords} record`);
        if (typeof renderSettingsBackupAlert === 'function') renderSettingsBackupAlert();

        const msg = `✅ Backup berhasil!\n` +
            BACKUP_DATA_MAP.map(([v]) => `  · ${v}: ${_countRecords(payload.data[v])} record`).join('\n');
        console.info(msg);
        toast(`✅ Backup JSON lengkap (${totalRecords} record)`);

    } catch (e) {
        console.error('Export gagal:', e);
        toast('❌ Gagal export: ' + e.message);
    }
};

// Alias agar tombol lama tetap berfungsi
window.backupDataJSON = window.exportFullData;
window.exportData     = window.exportFullData;

// ═══════════════════════════════════════════════════════════════════════
// IMPORT / RESTORE JSON
// ═══════════════════════════════════════════════════════════════════════
window.importFullData = function (file) {
    if (!file) { toast('⚠️ Tidak ada file yang dipilih'); return; }

    const reader = new FileReader();
    reader.onerror = () => toast('❌ Gagal membaca file');

    reader.onload = function (e) {
        try {
            const payload = JSON.parse(e.target.result);

            // ── Validasi format ───────────────────────────────────────
            if (!payload.version || !payload.data) {
                // Coba format lama v1.0 (settings.js backupDataJSON)
                if (payload.data === undefined && payload.settings !== undefined) {
                    toast('⚠️ Format backup lama (v1.0) tidak didukung. Gunakan backup terbaru.');
                    return;
                }
                throw new Error('File bukan backup KMSU yang valid');
            }

            const ver     = payload.version;
            const tanggal = payload.exportDate?.slice(0, 10) || '?';
            const oleh    = payload.exportBy || '?';
            const counts  = payload.meta?.recordCounts || {};
            const countStr = BACKUP_DATA_MAP
                .filter(([v]) => counts[v] > 0)
                .map(([v]) => `${v}: ${counts[v]}`)
                .join(', ');

            const konfirmasi = confirm(
                `RESTORE DATA KMSU\n\n` +
                `File  : ${file.name}\n` +
                `Versi : ${ver}\n` +
                `Tanggal export: ${tanggal}\n` +
                `Oleh  : ${oleh}\n\n` +
                `Isi   : ${countStr || '(tidak ada data)'}\n\n` +
                `⚠️  SEMUA DATA SAAT INI AKAN DITIMPA.\n` +
                `Pastikan sudah backup data terbaru dulu!\n\n` +
                `Lanjutkan restore?`
            );
            if (!konfirmasi) return;

            // ── Restore semua data ────────────────────────────────────
            BACKUP_DATA_MAP.forEach(([varName, storageKey]) => {
                const val = payload.data[varName];
                if (val !== undefined) {
                    window[varName] = val;
                    try { localStorage.setItem(storageKey, JSON.stringify(val)); } catch {}
                }
            });

            // ── Restore settings (dua key) ────────────────────────────
            if (payload.settings) {
                const kmsuSettings = payload.settings.kmsu;
                const prodSettings = payload.settings.prodAdmin;

                if (kmsuSettings) {
                    window.appSettings = typeof DEFAULT_SETTINGS !== 'undefined'
                        ? Object.assign({}, DEFAULT_SETTINGS, kmsuSettings)
                        : kmsuSettings;
                    try { localStorage.setItem('kmsu_settings', JSON.stringify(window.appSettings)); } catch {}
                }
                if (prodSettings) {
                    try { localStorage.setItem('prodAdmin_settings', JSON.stringify(prodSettings)); } catch {}
                }
            }

            // ── Pastikan oven minimal punya 7 chamber ─────────────────
            if (!window.ovenList || window.ovenList.length === 0) {
                window.ovenList = Array.from({ length: 7 }, (_, i) => ({
                    chamber: i + 1, volume: 0, tanggalMulai: '', status: 'empty'
                }));
            } else {
                const existingChambers = window.ovenList.map(o => o.chamber);
                for (let i = 1; i <= 7; i++) {
                    if (!existingChambers.includes(i))
                        window.ovenList.push({ chamber: i, volume: 0, tanggalMulai: '', status: 'empty' });
                }
                window.ovenList.sort((a, b) => a.chamber - b.chamber);
            }
            try { localStorage.setItem('prodAdmin_oven', JSON.stringify(window.ovenList)); } catch {}

            // ── Pastikan minimal ada 1 user admin ─────────────────────
            if (!window.appUsers || window.appUsers.length === 0) {
                window.appUsers = [{ id: 'adminDefault', username: 'karyamuda', password: '1234', role: 'admin', nama: 'Administrator' }];
                try { localStorage.setItem('prodAdmin_users', JSON.stringify(window.appUsers)); } catch {}
            }

            if (typeof logActivity === 'function') logActivity('Restore', 'Backup', `JSON v${ver} dari ${tanggal}`);

            toast('✅ Restore berhasil! Halaman akan dimuat ulang...');
            setTimeout(() => location.reload(), 1200);

        } catch (err) {
            console.error('Import gagal:', err);
            toast('❌ Gagal import: ' + err.message);
        }
    };

    reader.readAsText(file);
};

// Alias
window.restoreDataJSON = function (input) {
    const file = input?.files?.[0];
    if (file) window.importFullData(file);
    if (input) input.value = '';
};

// ═══════════════════════════════════════════════════════════════════════
// RESET SEMUA DATA
// ═══════════════════════════════════════════════════════════════════════
window.resetAllData = function () {
    const lanjut = confirm(
        '⚠️  HAPUS SEMUA DATA PRODUKSI?\n\n' +
        'Tindakan ini tidak bisa dibatalkan!\n' +
        'Sangat disarankan backup dulu sebelum reset.\n\n' +
        'Lanjutkan?'
    );
    if (!lanjut) return;

    // Kosongkan semua kecuali users dan settings
    BACKUP_DATA_MAP.forEach(([varName, storageKey]) => {
        if (varName === 'appUsers') return; // jangan hapus user
        window[varName] = Array.isArray(window[varName]) ? [] : {};
        try { localStorage.setItem(storageKey, JSON.stringify(window[varName])); } catch {}
    });

    // Reset oven ke 7 chamber kosong
    window.ovenList = Array.from({ length: 7 }, (_, i) => ({
        chamber: i + 1, volume: 0, tanggalMulai: '', status: 'empty'
    }));
    try { localStorage.setItem('prodAdmin_oven', JSON.stringify(window.ovenList)); } catch {}

    if (typeof logActivity === 'function') logActivity('Reset', 'Data', 'Semua data produksi direset');
    if (typeof renderAll === 'function') renderAll();
    if (typeof renderSettings === 'function') renderSettings();

    toast('🗑️ Semua data produksi dihapus');
};

// ═══════════════════════════════════════════════════════════════════════
// UI — Tab Export/Import
// ═══════════════════════════════════════════════════════════════════════
function buildBackupUI() {
    const panel = document.getElementById('tab-export');
    if (!panel) return;
    if (document.getElementById('backup-ui-root')) return;

    panel.innerHTML = `
        <div class="panel-head">
            <div>
                <h2 class="panel-title">📁 Export / Import</h2>
                <p class="panel-sub">Backup &amp; restore seluruh data produksi</p>
            </div>
        </div>

        <div id="backup-ui-root">

            <!-- ── EXPORT ─────────────────────────────────────────── -->
            <div class="form-card" style="margin-bottom:16px;">
                <div class="form-title" style="margin-bottom:16px;">💾 Export Backup JSON</div>

                <p style="font-size:12px;color:var(--muted);margin-bottom:14px;line-height:1.6;">
                    Ekspor <strong style="color:var(--text);">seluruh data</strong> ke satu file <code>.json</code>:
                    Kayu, Sawmill, Oven, Produksi, Sezing, Penjualan, Order, Opname,
                    Board Stock, LMKB, Users, Log Aktivitas, dan Pengaturan.
                </p>

                <div id="backup-record-summary"
                     style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;
                            padding:12px 14px;margin-bottom:14px;font-size:11px;
                            display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:4px 14px;">
                    <span style="color:var(--muted);">Menghitung data...</span>
                </div>

                <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                    <button class="btn btn-primary" onclick="window.exportFullData()"
                            style="display:flex;align-items:center;gap:7px;padding:0 20px;height:38px;font-weight:600;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Download Backup JSON
                    </button>
                    <span id="backup-last-info"
                          style="font-size:10px;color:var(--muted);"></span>
                </div>
            </div>

            <!-- ── IMPORT ─────────────────────────────────────────── -->
            <div class="form-card" style="margin-bottom:16px;">
                <div class="form-title" style="margin-bottom:16px;">📂 Restore dari Backup</div>

                <p style="font-size:12px;color:var(--muted);margin-bottom:14px;line-height:1.6;">
                    Pilih file <code>.json</code> backup sebelumnya.
                    <strong style="color:#f87171;">Semua data saat ini akan ditimpa.</strong>
                    Pastikan sudah backup terbaru sebelum restore.
                </p>

                <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                    <label class="btn btn-secondary"
                           style="display:flex;align-items:center;gap:7px;cursor:pointer;
                                  padding:0 20px;height:38px;font-weight:600;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Pilih File Backup
                        <input type="file" id="backup-import-file" accept=".json"
                               style="display:none"
                               onchange="if(this.files[0]) window.importFullData(this.files[0]); this.value='';">
                    </label>

                    <span style="font-size:11px;color:#f87171;">
                        ⚠️ Restore menimpa semua data yang ada
                    </span>
                </div>
            </div>

            <!-- ── RESET ──────────────────────────────────────────── -->
            <div class="form-card"
                 style="border:1px solid rgba(248,113,113,.25);background:rgba(248,113,113,.04);">
                <div class="form-title" style="margin-bottom:12px;color:#f87171;">⚠️ Zona Berbahaya</div>
                <p style="font-size:12px;color:var(--muted);margin-bottom:14px;line-height:1.6;">
                    Hapus semua data produksi (kayu, sawmill, oven, produksi, sezing, penjualan, dst).
                    Pengaturan dan data user tidak ikut terhapus.
                </p>
                <button class="btn btn-del"
                        onclick="window.resetAllData()"
                        style="display:flex;align-items:center;gap:7px;height:38px;padding:0 20px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6m4-6v6"/>
                        <path d="M9 6V4h6v2"/>
                    </svg>
                    Reset Semua Data Produksi
                </button>
            </div>

        </div>`;

    _refreshBackupSummary();
    _refreshLastBackupInfo();
}

function _refreshBackupSummary() {
    const el = document.getElementById('backup-record-summary');
    if (!el) return;
    const items = BACKUP_DATA_MAP.map(([varName, storageKey]) => {
        const val   = _readVar(varName, storageKey);
        const count = _countRecords(val);
        const label = {
            kayuList: 'Kayu', sawmillList: 'Sawmill', ovenList: 'Oven',
            ovenHistoryList: 'Oven History', produksiList: 'Produksi',
            sezingList: 'Sezing', penjualanList: 'Penjualan', orderList: 'Order',
            opnameList: 'Opname', boardStockList: 'Board Stock',
            lmkbList: 'LMKB', appUsers: 'Users (Auth)', userList: 'Users (Settings)',
            activityLog: 'Log Aktivitas',
        }[varName] || varName;
        const color = count > 0 ? 'var(--text)' : 'var(--muted)';
        return `<span style="color:${color};">${label}: <strong>${count}</strong></span>`;
    });
    el.innerHTML = items.join('');
}

function _refreshLastBackupInfo() {
    const el = document.getElementById('backup-last-info');
    if (!el) return;
    const last = window.appSettings?.lastBackup;
    el.textContent = last ? `Backup terakhir: ${last}` : 'Belum pernah backup';
}

// ─── Init ────────────────────────────────────────────────────────────
(function init() {
    function tryBuild() {
        if (document.getElementById('tab-export')) buildBackupUI();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryBuild);
    else tryBuild();
    // Fallback jika tab belum render saat load
    setTimeout(tryBuild, 800);
    setTimeout(tryBuild, 2000);
})();
