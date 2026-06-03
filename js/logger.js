// logger.js — Log Aktivitas v2
// Filter, KPI, timeline card, export CSV, hapus log

// ═══════════════════════════════════════════════════════
// CONFIG: ikon & warna per modul & aksi
// ═══════════════════════════════════════════════════════
const LOG_MODUL = {
    'Kayu':     { icon:'🪵', color:'#a78bfa' },
    'Sawmill':  { icon:'⚙️', color:'#60a5fa' },
    'Oven':     { icon:'🔥', color:'var(--orange)' },
    'Produksi': { icon:'🏭', color:'var(--blue)' },
    'Sezing':   { icon:'📏', color:'var(--gold)' },
    'Penjualan':{ icon:'💰', color:'var(--green)' },
    'Order':    { icon:'📑', color:'#f472b6' },
    'Opname':   { icon:'🧮', color:'#34d399' },
    'Board Stock':{ icon:'📦', color:'#fbbf24' },
    'Data':     { icon:'🗄️', color:'var(--muted)' },
    'Backup':   { icon:'💾', color:'var(--blue)' },
    'Restore':  { icon:'📂', color:'var(--orange)' },
    'Settings': { icon:'⚙️', color:'var(--muted)' },
};

const LOG_AKSI = {
    'Simpan':   { color:'var(--green)',  bg:'rgba(62,200,122,.13)', border:'rgba(62,200,122,.28)', icon:'✅' },
    'Update':   { color:'var(--blue)',   bg:'rgba(74,158,232,.13)', border:'rgba(74,158,232,.28)', icon:'✏️' },
    'Hapus':    { color:'var(--red)',    bg:'rgba(232,80,80,.13)',  border:'rgba(232,80,80,.28)',  icon:'🗑️' },
    'Export':   { color:'#60a5fa',       bg:'rgba(96,165,250,.12)', border:'rgba(96,165,250,.25)', icon:'📥' },
    'Backup':   { color:'var(--blue)',   bg:'rgba(74,158,232,.1)',  border:'rgba(74,158,232,.2)',  icon:'💾' },
    'Restore':  { color:'var(--orange)', bg:'rgba(232,144,64,.12)', border:'rgba(232,144,64,.25)', icon:'📂' },
    'Reset':    { color:'var(--red)',    bg:'rgba(232,80,80,.1)',   border:'rgba(232,80,80,.2)',   icon:'⚠️' },
    'Isi':      { color:'var(--gold)',   bg:'rgba(212,160,23,.12)', border:'rgba(212,160,23,.25)', icon:'📥' },
    'Edit':     { color:'var(--blue)',   bg:'rgba(74,158,232,.13)', border:'rgba(74,158,232,.28)', icon:'✏️' },
    'Selesai':  { color:'var(--green)',  bg:'rgba(62,200,122,.13)', border:'rgba(62,200,122,.28)', icon:'✅' },
};

function _logAksiStyle(aksi) {
    return LOG_AKSI[aksi] || { color:'var(--muted)', bg:'rgba(154,149,144,.1)', border:'rgba(154,149,144,.2)', icon:'📌' };
}
function _logModulInfo(modul) {
    return LOG_MODUL[modul] || { icon:'📌', color:'var(--muted)' };
}

// ═══════════════════════════════════════════════════════
// CORE: logActivity
// ═══════════════════════════════════════════════════════
function logActivity(aksi, modul, detail = "") {
    if (!currentUser) return;
    if (!window.activityLog) window.activityLog = [];
    window.activityLog.push({
        id:        uid(),
        timestamp: new Date().toISOString(),
        user:      currentUser.nama,
        role:      currentUser.role,
        aksi,
        modul,
        detail
    });
    // Batasi 500 entri
    if (window.activityLog.length > 500) {
        window.activityLog = window.activityLog.slice(-500);
    }
    persistAll();
}

// ═══════════════════════════════════════════════════════
// RENDER LOG
// ═══════════════════════════════════════════════════════
window.renderLog = function () {
    _renderLogKPI();
    _renderLogList();
};

// ── KPI Bar ──────────────────────────────────────────
function _renderLogKPI() {
    const cont = document.getElementById('log-kpi-bar');
    if (!cont) return;

    const logs   = window.activityLog || [];
    const today_ = new Date().toISOString().slice(0,10);
    const todayL = logs.filter(l => l.timestamp.startsWith(today_));
    const users  = [...new Set(logs.map(l=>l.user))].length;

    const perAksi = {};
    logs.forEach(l => { perAksi[l.aksi] = (perAksi[l.aksi]||0) + 1; });
    const topAksi = Object.entries(perAksi).sort((a,b)=>b[1]-a[1]).slice(0,3)
        .map(([k,v]) => {
            const s = _logAksiStyle(k);
            return `<span style="background:${s.bg};color:${s.color};border:1px solid ${s.border};border-radius:20px;padding:2px 10px;font-size:10px;font-weight:700;">${s.icon} ${k}: ${v}</span>`;
        }).join('');

    const perModul = {};
    logs.forEach(l => { perModul[l.modul] = (perModul[l.modul]||0) + 1; });
    const topModul = Object.entries(perModul).sort((a,b)=>b[1]-a[1]).slice(0,4)
        .map(([k,v]) => {
            const m = _logModulInfo(k);
            return `<span style="background:rgba(0,0,0,.2);color:${m.color};border:1px solid ${m.color}33;border-radius:20px;padding:2px 10px;font-size:10px;font-weight:600;">${m.icon} ${k}: ${v}</span>`;
        }).join('');

    const kpiCard = (label, value, color, sub='') => `
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-top:3px solid ${color};border-radius:10px;padding:11px 13px;">
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;font-weight:600;">${label}</div>
            <div style="font-size:20px;font-weight:800;color:${color};font-family:var(--font-mono);margin-top:4px;line-height:1.1;">${value}</div>
            ${sub?`<div style="font-size:10px;color:var(--muted);margin-top:4px;padding-top:4px;border-top:1px solid var(--border);">${sub}</div>`:''}
        </div>`;

    cont.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:12px;">
        ${kpiCard('📊 Total Log', logs.length, 'var(--gold)', users+' pengguna')}
        ${kpiCard('📅 Hari Ini',  todayL.length, 'var(--blue)', 'Aktivitas')}
        ${kpiCard('✏️ Simpan',    (perAksi['Simpan']||0), 'var(--green)',  'Entri baru')}
        ${kpiCard('🔄 Update',    (perAksi['Update']||0), 'var(--blue)',   'Edit')}
        ${kpiCard('🗑️ Hapus',    (perAksi['Hapus']||0),  'var(--red)',    'Dihapus')}
    </div>
    ${(topAksi||topModul) ? `
    <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;padding:9px 13px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;margin-bottom:14px;">
        ${topAksi?`<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;"><span style="font-size:10px;color:var(--muted);white-space:nowrap;">Top Aksi:</span>${topAksi}</div>`:''}
        ${topModul?`<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;"><span style="font-size:10px;color:var(--muted);white-space:nowrap;">Modul:</span>${topModul}</div>`:''}
    </div>` : ''}`;
}

// ── List ─────────────────────────────────────────────
function _renderLogList() {
    const cont = document.getElementById('log-list');
    if (!cont) return;

    const srch  = (document.getElementById('log-search')?.value||'').toLowerCase();
    const fMod  = document.getElementById('log-filter-modul')?.value || '';
    const fAksi = document.getElementById('log-filter-aksi')?.value  || '';
    const fFrom = document.getElementById('log-filter-from')?.value  || '';
    const fTo   = document.getElementById('log-filter-to')?.value    || '';

    let logs = [...(window.activityLog||[])].reverse(); // terbaru di atas
    if (srch)  logs = logs.filter(l =>
        (l.user||'').toLowerCase().includes(srch) ||
        (l.modul||'').toLowerCase().includes(srch) ||
        (l.detail||'').toLowerCase().includes(srch) ||
        (l.aksi||'').toLowerCase().includes(srch)
    );
    if (fMod)  logs = logs.filter(l => l.modul  === fMod);
    if (fAksi) logs = logs.filter(l => l.aksi   === fAksi);
    if (fFrom) logs = logs.filter(l => l.timestamp.slice(0,10) >= fFrom);
    if (fTo)   logs = logs.filter(l => l.timestamp.slice(0,10) <= fTo);

    const total = logs.length;
    logs = logs.slice(0, 200); // tampilkan maks 200

    if (!total) {
        cont.innerHTML = `
        <div style="text-align:center;padding:48px 20px;color:var(--muted);">
            <div style="font-size:36px;opacity:.3;margin-bottom:10px;">📭</div>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;">Tidak ada log</div>
            <div style="font-size:11px;">Coba ubah filter atau mulai menggunakan fitur</div>
        </div>`;
        return;
    }

    // Group by date
    const byDate = {};
    logs.forEach(l => {
        const d = l.timestamp.slice(0,10);
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push(l);
    });
    const dates = Object.keys(byDate).sort((a,b)=>b.localeCompare(a));

    const _fmtTime = iso => {
        try {
            const d = new Date(iso);
            return d.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
        } catch { return iso.slice(11,19); }
    };
    const _fmtDateLog = iso => {
        try {
            const d = new Date(iso + 'T00:00:00');
            return d.toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
        } catch { return iso; }
    };
    const _isToday = d => d === new Date().toISOString().slice(0,10);

    let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:3px;height:18px;background:var(--gold);border-radius:2px;display:inline-block;"></span>
            <span style="font-size:13px;font-weight:700;color:var(--text);">📜 Riwayat Aktivitas</span>
            <span style="font-size:10px;background:rgba(212,160,23,.13);color:var(--gold);border:1px solid rgba(212,160,23,.28);border-radius:20px;padding:2px 8px;font-weight:600;">${total} entri${total>200?' (200 ditampilkan)':''}</span>
        </div>
    </div>`;

    dates.forEach(d => {
        const items   = byDate[d];
        const isToday = _isToday(d);

        html += `
        <div style="margin-bottom:16px;">
            <!-- Tanggal label -->
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <div style="flex:1;height:1px;background:var(--border);"></div>
                <span style="font-size:10px;font-weight:700;color:${isToday?'var(--gold)':'var(--muted)'};text-transform:uppercase;letter-spacing:.8px;white-space:nowrap;padding:0 4px;">
                    ${isToday ? '🟢 ' : ''}${_fmtDateLog(d)} <span style="font-weight:400;opacity:.6;">(${items.length})</span>
                </span>
                <div style="flex:1;height:1px;background:var(--border);"></div>
            </div>
            <!-- Timeline entries -->
            <div style="display:flex;flex-direction:column;gap:4px;padding-left:16px;border-left:2px solid var(--border);">`;

        items.forEach(l => {
            const aksiS = _logAksiStyle(l.aksi);
            const modM  = _logModulInfo(l.modul);
            const time  = _fmtTime(l.timestamp);
            const roleBadge = l.role === 'admin'
                ? `<span style="background:rgba(212,160,23,.13);color:var(--gold);border:1px solid rgba(212,160,23,.25);border-radius:20px;padding:1px 7px;font-size:9px;font-weight:700;">👑 admin</span>`
                : `<span style="background:var(--bg3);color:var(--muted);border:1px solid var(--border);border-radius:20px;padding:1px 7px;font-size:9px;font-weight:600;">👤 ${l.role||'user'}</span>`;

            html += `
                <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 12px 8px 0;position:relative;">
                    <!-- Dot on timeline -->
                    <div style="position:absolute;left:-21px;top:13px;width:8px;height:8px;border-radius:50%;background:${aksiS.color};border:2px solid var(--bg);flex-shrink:0;"></div>

                    <!-- Waktu -->
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);white-space:nowrap;min-width:56px;padding-top:2px;">${time}</div>

                    <!-- Body -->
                    <div style="flex:1;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;border-left:3px solid ${aksiS.color};">
                        <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:${l.detail?'5px':'0'};">
                            <!-- Aksi badge -->
                            <span style="background:${aksiS.bg};color:${aksiS.color};border:1px solid ${aksiS.border};border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;">${aksiS.icon} ${l.aksi}</span>
                            <!-- Modul badge -->
                            <span style="background:rgba(0,0,0,.2);color:${modM.color};border:1px solid ${modM.color}33;border-radius:20px;padding:2px 9px;font-size:10px;font-weight:600;">${modM.icon} ${l.modul}</span>
                            <!-- User -->
                            <span style="font-size:10px;font-weight:600;color:var(--text);">👤 ${l.user||'—'}</span>
                            ${roleBadge}
                        </div>
                        ${l.detail ? `<div style="font-size:11px;color:var(--muted);font-family:var(--font-mono);padding-top:4px;border-top:1px solid var(--border);margin-top:2px;word-break:break-word;">${l.detail}</div>` : ''}
                    </div>
                </div>`;
        });

        html += `</div></div>`;
    });

    cont.innerHTML = html;
}

// ═══════════════════════════════════════════════════════
// FILTER RESET
// ═══════════════════════════════════════════════════════
window.resetLogFilter = function () {
    ['log-search','log-filter-from','log-filter-to'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    ['log-filter-modul','log-filter-aksi'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    window.renderLog();
};

// ═══════════════════════════════════════════════════════
// HAPUS LOG
// ═══════════════════════════════════════════════════════
window.clearLog = function () {
    if (!confirmDialog('Hapus seluruh log aktivitas?\nTindakan ini tidak dapat dibatalkan.')) return;
    window.activityLog = [];
    persistAll();
    window.renderLog();
    toast('🗑️ Log aktivitas dihapus');
};

// ═══════════════════════════════════════════════════════
// EXPORT CSV
// ═══════════════════════════════════════════════════════
window.exportLogCSV = function () {
    const logs = window.activityLog || [];
    if (!logs.length) { toast('⚠️ Tidak ada log untuk diexport'); return; }
    const headers = ['Timestamp','User','Role','Aksi','Modul','Detail'];
    const rows = [...logs].reverse().map(l =>
        [l.timestamp, l.user, l.role, l.aksi, l.modul, (l.detail||'').replace(/,/g,' ')].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const a   = document.createElement('a');
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `log_aktivitas_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast('📥 Log berhasil diexport');
};
