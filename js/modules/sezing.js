// sezing.js — REVAMPED v2
// Layout & sizing diperbaiki: Input, Daftar, Stok Board

// ═══════════════════════════════════════════════════════
// INISIALISASI
// ═══════════════════════════════════════════════════════
let penjualanEditId = null;
let sezingEditId    = null;
if (!window.boardStockList) window.boardStockList = [];
if (!window.sezingList)     window.sezingList     = [];
if (!window.penjualanList)  window.penjualanList  = [];

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function getPenjualanNetto(p) {
    return Math.max(0, (p.volume || 0) - (p.retur || 0));
}
function getHargaPerM3(p) {
    const n = getPenjualanNetto(p);
    return n > 0 ? (p.harga || 0) / n : 0;
}
function fmtRpRekap(n) {
    if (!n) return '0';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + ' M';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + ' jt';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + ' rb';
    return fmt(n);
}
function _fmtBulan(ym) {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const names = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return (names[parseInt(m)-1] || m) + ' ' + y;
}

// Ketebalan color map
const TEBAL_COLORS = {
    '6':  { bg:'rgba(251,191,36,.12)',  border:'rgba(251,191,36,.3)',  text:'#fbbf24' },
    '9':  { bg:'rgba(249,115,22,.12)',  border:'rgba(249,115,22,.3)',  text:'var(--orange)' },
    '12': { bg:'rgba(200,160,80,.13)',  border:'rgba(200,160,80,.3)',  text:'var(--gold)' },
    '15': { bg:'rgba(74,222,128,.12)',  border:'rgba(74,222,128,.3)',  text:'var(--green)' },
    '18': { bg:'rgba(96,165,250,.12)',  border:'rgba(96,165,250,.3)',  text:'#60a5fa' },
    '20': { bg:'rgba(167,139,250,.12)', border:'rgba(167,139,250,.3)', text:'#a78bfa' },
    '25': { bg:'rgba(244,114,182,.12)', border:'rgba(244,114,182,.3)', text:'#f472b6' },
    '30': { bg:'rgba(52,211,153,.12)',  border:'rgba(52,211,153,.3)',  text:'#34d399' },
};
const DEF_COLOR = { bg:'rgba(156,163,175,.1)', border:'rgba(156,163,175,.25)', text:'var(--muted)' };
function tebalColor(k) { return TEBAL_COLORS[String(k)] || DEF_COLOR; }
const TEBAL_HEX = {
    '6':'#fbbf24','9':'#f97316','12':'#d4a017','15':'#4ade80',
    '18':'#60a5fa','20':'#a78bfa','25':'#f472b6','30':'#34d399'
};

function getStokBoardRealtime() {
    let totPress = 0;
    (window.produksiList || []).forEach(p => {
        const s1 = p.shift1 || {}, s2 = p.shift2 || {};
        totPress += (s1.press || 0) + (s2.press || 0);
    });
    const totJual   = (window.penjualanList || []).reduce((a, p) => a + getPenjualanNetto(p), 0);
    const totSezing = (window.sezingList || []).reduce((a, s) => a + (s.volume || 0), 0);
    const stokLbr   = Math.max(0, totPress - totJual);
    return { totPress, totJual, totSezing, stokLbr };
}

window.getOrderTerpenuhi = function (orderId) {
    return (window.penjualanList || [])
        .filter(p => p.orderId === orderId)
        .reduce((a, p) => a + getPenjualanNetto(p), 0);
};

// ═══════════════════════════════════════════════════════
// RENDER UTAMA
// ═══════════════════════════════════════════════════════
window.renderSezing = function () {
    _initSezingInputForm();
    renderSezingKPI();
    renderSezingList();
    initBoardStockForm();
    renderBoardStockSummary();
    renderBoardStockHistory();
    refreshBoardStockOrders();
};

window.renderPenjualan = function () {
    renderPenjualanKPI();
    renderPenjualanList();
    renderPenjualanCharts();
};

// ═══════════════════════════════════════════════════════
// INIT FORM INPUT SEZING (isi dropdown Open No. & set default tanggal)
// ═══════════════════════════════════════════════════════
function _initSezingInputForm() {
    const tgl = document.getElementById('sz-tanggal');
    if (tgl && !tgl.value) tgl.value = today();

    const sel = document.getElementById('sz-openno');
    if (!sel) return;
    const existing = sel.value;
    const opts = [...new Set((window.sawmillList || []).map(s => s.openNo).filter(Boolean))]
        .map(no => `<option value="${no}">${no}</option>`).join('');
    sel.innerHTML = '<option value="">-- Pilih --</option>' + opts;
    if (existing) sel.value = existing;
}

// ═══════════════════════════════════════════════════════
// SEZING — KPI BAR (compact, 3+3 grid)
// ═══════════════════════════════════════════════════════
function renderSezingKPI() {
    const cont = document.getElementById('sezing-kpi-bar');
    if (!cont) return;

    const bulan   = thisMonth();
    const listBln = (window.sezingList || []).filter(s => s.tanggal?.startsWith(bulan));
    const listAll = window.sezingList || [];

    const totBln   = listBln.reduce((a, s) => a + (s.volume || 0), 0);
    const totAll   = listAll.reduce((a, s) => a + (s.volume || 0), 0);
    const hariBln  = new Set(listBln.map(s => s.tanggal)).size;
    const rataHari = hariBln > 0 ? (totBln / hariBln).toFixed(2) : '0.00';
    const stok     = getStokBoardRealtime();

    // Per ketebalan bulan ini
    const perTebal = {};
    listBln.forEach(s => { const k = s.ketebalan || '?'; perTebal[k] = (perTebal[k] || 0) + (s.volume || 0); });
    const entries  = Object.entries(perTebal).sort((a, b) => Number(a[0]) - Number(b[0]));
    const maxVol   = Math.max(...entries.map(([, v]) => v), 0.001);

    const bars = entries.map(([k, v]) => {
        const col = TEBAL_HEX[k] || 'var(--muted)';
        const w   = (v / maxVol * 100).toFixed(1);
        return `<div style="display:flex;align-items:center;gap:8px;">
            <span style="width:34px;text-align:right;font-family:var(--font-mono);font-size:10px;font-weight:700;color:${col};">${k}mm</span>
            <div style="flex:1;height:7px;background:var(--border);border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${w}%;background:${col};border-radius:4px;transition:width .4s;"></div>
            </div>
            <span style="width:60px;font-family:var(--font-mono);font-size:10px;color:var(--muted);text-align:right;">${fmtDec(v,2)} m³</span>
        </div>`;
    }).join('');

    const tebalChips = entries.map(([k, v]) => {
        const col = TEBAL_HEX[k] || 'var(--muted)';
        return `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(0,0,0,.2);color:${col};border:1px solid ${col}44;border-radius:20px;padding:3px 10px;font-size:10px;font-weight:700;font-family:var(--font-mono);">
            <span style="width:6px;height:6px;border-radius:50%;background:${col};flex-shrink:0;"></span>
            ${k}mm <span style="font-weight:400;color:var(--muted);margin-left:2px;">${fmtDec(v,2)}</span>
        </span>`;
    }).join('');

    const stokColor = stok.stokLbr > 500 ? 'var(--green)' : stok.stokLbr > 100 ? 'var(--orange)' : 'var(--red)';

    cont.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px;">
        ${_kpi('📏 Sezing Bulan Ini', fmtDec(totBln,2)+' m³', 'var(--gold)',       hariBln+' hari aktif')}
        ${_kpi('📦 Sezing All-time',  fmtDec(totAll,2)+' m³', 'var(--gold-light)', listAll.length+' sesi')}
        ${_kpi('📈 Rata-rata/Hari',   rataHari+' m³',          'var(--blue)',       'Bulan ini')}
        ${_kpi('🔩 Total Press',      fmt(stok.totPress)+' lbr','var(--orange)',    'Diproduksi')}
        ${_kpi('✅ Terjual',          fmt(stok.totJual)+' lbr', 'var(--green)',     'Netto')}
        ${_kpi('📊 Estimasi Sisa',    fmt(stok.stokLbr)+' lbr', stokColor,         'Press − Jual')}
    </div>
    ${entries.length ? `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px;">
        <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">📐 Per Ketebalan — ${_fmtBulan(bulan)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px;">${tebalChips}</div>
        <div style="display:flex;flex-direction:column;gap:5px;">${bars}</div>
    </div>` : ''}`;
}

function _kpi(label, value, color, sub) {
    return `<div style="background:var(--bg2);border:1px solid var(--gold-dim);border-top:3px solid ${color};border-radius:10px;padding:12px 14px;box-shadow:0 2px 10px rgba(0,0,0,.15);position:relative;overflow:hidden;">
        <div style="position:absolute;top:-10px;right:-10px;width:44px;height:44px;border-radius:50%;background:${color};opacity:.07;pointer-events:none;"></div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;font-weight:600;">${label}</div>
        <div style="font-size:19px;font-weight:700;color:${color};font-family:var(--font-mono);margin-top:5px;line-height:1.1;letter-spacing:-.5px;">${value}</div>
        ${sub ? `<div style="font-size:10px;color:var(--muted);margin-top:5px;padding-top:4px;border-top:1px solid var(--border);">${sub}</div>` : ''}
    </div>`;
}

// ═══════════════════════════════════════════════════════
// SEZING — INPUT FORM PREVIEW & SAVE
// ═══════════════════════════════════════════════════════
window.updateSezingPreview = function () {
    const vol = parseFloat(document.getElementById('sz-volume')?.value) || 0;
    const pcs = parseInt(document.getElementById('sz-pcs')?.value) || 0;
    const prev = document.getElementById('sz-preview');
    if (!prev) return;
    if (vol > 0 || pcs > 0) {
        prev.style.display = 'block';
        document.getElementById('sz-prev-vol').textContent  = vol.toFixed(3);
        document.getElementById('sz-prev-pcs').textContent  = pcs;
        document.getElementById('sz-prev-ratio').textContent = pcs > 0 && vol > 0 ? (vol / pcs * 1000).toFixed(2) + ' ltr/lbr' : '—';
    } else {
        prev.style.display = 'none';
    }
};

window.resetSezingForm = function () {
    ['sz-volume','sz-pcs','sz-operator','sz-keterangan'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['sz-openno','sz-ketebalan','sz-jenis'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const sh = document.getElementById('sz-shift');
    if (sh) sh.value = '1';
    const tgl = document.getElementById('sz-tanggal');
    if (tgl) tgl.value = today();
    const prev = document.getElementById('sz-preview');
    if (prev) prev.style.display = 'none';
    sezingEditId = null;
};

window.saveSezing = function () {
    const tgl = (document.getElementById('sz-tanggal')?.value || '').trim();
    const vol = parseFloat(document.getElementById('sz-volume')?.value || '');
    if (!tgl)             { toast('⚠️ Tanggal wajib diisi!'); return; }
    if (!vol || vol <= 0) { toast('⚠️ Volume wajib diisi!'); return; }

    const item = {
        id:         sezingEditId || uid(),
        tanggal:    tgl,
        openNo:     document.getElementById('sz-openno')?.value     || '',
        ketebalan:  document.getElementById('sz-ketebalan')?.value  || '',
        volume:     vol,
        pcs:        parseInt(document.getElementById('sz-pcs')?.value) || 0,
        jenis:      document.getElementById('sz-jenis')?.value      || '',
        shift:      document.getElementById('sz-shift')?.value      || '1',
        operator:   document.getElementById('sz-operator')?.value   || '',
        keterangan: document.getElementById('sz-keterangan')?.value || ''
    };

    if (!window.sezingList) window.sezingList = [];
    if (sezingEditId) {
        window.sezingList = window.sezingList.map(s => s.id === sezingEditId ? item : s);
        logActivity('Update', 'Sezing', `${fmtDec(vol,2)} m³ · ${item.ketebalan}mm`);
        toast('✅ Data sezing diperbarui!');
    } else {
        window.sezingList.push(item);
        logActivity('Simpan', 'Sezing', `${fmtDec(vol,2)} m³ · ${item.ketebalan}mm`);
        toast('✅ Sezing disimpan!');
    }

    persistAll();
    window.resetSezingForm();
    // Switch ke subtab Daftar setelah simpan
    document.querySelector('#tab-sezing .subtab-btn[data-subtab="sezing-list"]')?.click();
    renderSezing();
    renderDashboard?.();
};

window.deleteSezing = function (id) {
    if (!confirmDialog('Hapus data sezing ini?')) return;
    window.sezingList = window.sezingList.filter(s => s.id !== id);
    persistAll();
    renderSezing();
    toast('🗑️ Data sezing dihapus');
};

window.editSezing = function (id) {
    const item = (window.sezingList || []).find(s => s.id === id);
    if (!item) return;
    sezingEditId = item.id;
    _initSezingInputForm();
    // Isi field
    const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val || ''; };
    set('sz-tanggal', item.tanggal);
    set('sz-openno', item.openNo);
    set('sz-ketebalan', item.ketebalan);
    set('sz-volume', item.volume);
    set('sz-pcs', item.pcs);
    set('sz-jenis', item.jenis);
    set('sz-shift', item.shift || '1');
    set('sz-operator', item.operator);
    set('sz-keterangan', item.keterangan);
    updateSezingPreview();
    // Switch ke subtab Input
    document.querySelector('#tab-sezing .subtab-btn[data-subtab="sezing-input"]')?.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ═══════════════════════════════════════════════════════
// SEZING — DAFTAR (grouped by date, compact table rows)
// ═══════════════════════════════════════════════════════
window.renderSezingList = function () {
    const cont = document.getElementById('sezing-list-content');
    if (!cont) return;

    const from = document.getElementById('sz-filter-from')?.value  || '';
    const to   = document.getElementById('sz-filter-to')?.value    || '';
    const srch = (document.getElementById('sz-filter-search')?.value || '').toLowerCase();

    let list = sortByDateAsc(window.sezingList || []);
    if (from) list = list.filter(s => s.tanggal >= from);
    if (to)   list = list.filter(s => s.tanggal <= to);
    if (srch) list = list.filter(s =>
        (s.openNo||'').toLowerCase().includes(srch) ||
        (s.operator||'').toLowerCase().includes(srch) ||
        (s.jenis||'').toLowerCase().includes(srch) ||
        (s.ketebalan||'').toLowerCase().includes(srch)
    );

    if (!list.length) {
        cont.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--muted);">
            <div style="font-size:32px;margin-bottom:8px;opacity:.4;">📭</div>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;">Belum ada data sezing</div>
            <div style="font-size:11px;">Ubah filter atau <a href="#" onclick="document.querySelector('#tab-sezing .subtab-btn[data-subtab=sezing-input]').click();return false;" style="color:var(--gold);">tambah data baru</a></div>
        </div>`;
        return;
    }

    // Group by date
    const byDate = {};
    list.forEach(s => { if (!byDate[s.tanggal]) byDate[s.tanggal] = []; byDate[s.tanggal].push(s); });
    const dates  = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

    // Summary total
    const grandTotal  = list.reduce((a, s) => a + (s.volume||0), 0);
    const grandPcs    = list.reduce((a, s) => a + (s.pcs||0), 0);

    let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:3px;height:18px;background:var(--gold);border-radius:2px;display:inline-block;"></span>
            <span style="font-size:13px;font-weight:700;color:var(--text);">📏 Daftar Hasil Sezing</span>
            <span style="font-size:10px;background:rgba(212,160,23,.15);color:var(--gold);border:1px solid rgba(212,160,23,.3);border-radius:20px;padding:2px 8px;font-weight:600;">${list.length} entri · ${dates.length} hari</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:11px;font-family:var(--font-mono);color:var(--gold);font-weight:700;">${fmtDec(grandTotal,2)} m³</span>
            <button style="display:inline-flex;align-items:center;gap:5px;background:rgba(96,165,250,.12);color:var(--blue);border:1px solid rgba(96,165,250,.3);border-radius:6px;padding:5px 11px;font-size:11px;font-weight:600;cursor:pointer;" onclick="window.exportSezingCSV()">📥 CSV</button>
        </div>
    </div>`;

    dates.forEach(tgl => {
        const items    = byDate[tgl];
        const dayTotal = items.reduce((s, x) => s + (x.volume||0), 0);
        const dayPcs   = items.reduce((s, x) => s + (x.pcs||0), 0);
        const tebalSet = [...new Set(items.map(x => x.ketebalan).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));

        const tebalChips = tebalSet.map(k => {
            const c   = tebalColor(k);
            const vol = items.filter(x => x.ketebalan == k).reduce((s,x) => s+(x.volume||0), 0);
            return `<span style="background:${c.bg};color:${c.text};border:1px solid ${c.border};border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;font-family:var(--font-mono);white-space:nowrap;">${k}mm · ${fmtDec(vol,2)}</span>`;
        }).join('');

        html += `
        <div style="margin-bottom:12px;border:1px solid var(--border);border-radius:10px;overflow:hidden;">
            <!-- Hari header -->
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:9px 13px;background:var(--bg3);border-bottom:1px solid var(--border);">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-size:11px;font-weight:700;color:var(--text);">📅 ${fmtDate(tgl)}</span>
                    <span style="font-size:10px;color:var(--muted);">${items.length} sesi</span>
                    <div style="display:flex;flex-wrap:wrap;gap:4px;">${tebalChips}</div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
                    ${dayPcs > 0 ? `<span style="font-size:10px;color:var(--muted);"><b style="color:var(--text);">${fmt(dayPcs)}</b> pcs</span>` : ''}
                    <div style="text-align:right;">
                        <div style="font-size:15px;font-weight:800;font-family:var(--font-mono);color:var(--gold);line-height:1;">${fmtDec(dayTotal,3)}</div>
                        <div style="font-size:9px;color:var(--muted);">m³/hari</div>
                    </div>
                </div>
            </div>
            <!-- Row per sesi -->
            <div style="background:var(--bg2);">`;

        items.forEach((s, i) => {
            const c        = tebalColor(s.ketebalan);
            const isLast   = i === items.length - 1;
            const shiftBadge = s.shift == 2
                ? `<span style="background:rgba(251,146,60,.12);color:var(--orange);border:1px solid rgba(251,146,60,.25);border-radius:20px;padding:2px 7px;font-size:9px;font-weight:600;">🌙 S2</span>`
                : `<span style="background:var(--bg3);color:var(--muted);border:1px solid var(--border);border-radius:20px;padding:2px 7px;font-size:9px;font-weight:600;">🕛 S1</span>`;
            const jenisBadge = s.jenis
                ? `<span style="background:rgba(96,165,250,.12);color:var(--blue);border:1px solid rgba(96,165,250,.25);border-radius:20px;padding:2px 7px;font-size:9px;font-weight:600;">${s.jenis}</span>`
                : '';

            html += `
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:9px 13px;${!isLast?'border-bottom:1px solid var(--border);':''}">
                    <div style="display:flex;align-items:center;gap:9px;flex:1;min-width:200px;">
                        <div style="width:3px;height:32px;border-radius:2px;background:${c.text};flex-shrink:0;"></div>
                        <div>
                            <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;flex-wrap:wrap;">
                                <span style="background:${c.bg};color:${c.text};border:1px solid ${c.border};border-radius:20px;padding:2px 9px;font-size:11px;font-weight:700;font-family:var(--font-mono);">${s.ketebalan ? s.ketebalan+' mm' : '—'}</span>
                                ${jenisBadge}${shiftBadge}
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;font-size:10px;color:var(--muted);">
                                ${s.openNo    ? `<span>🔢 ${escapeHtml(s.openNo)}</span>` : ''}
                                ${s.operator  ? `<span>👤 ${escapeHtml(s.operator)}</span>` : ''}
                                ${s.keterangan? `<span style="font-style:italic;">📝 ${escapeHtml(s.keterangan)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:14px;flex-shrink:0;">
                        ${s.pcs > 0 ? `<div style="text-align:right;"><div style="font-size:12px;font-weight:700;font-family:var(--font-mono);color:var(--text);">${fmt(s.pcs)}</div><div style="font-size:9px;color:var(--muted);">pcs</div></div>` : ''}
                        <div style="text-align:right;min-width:56px;">
                            <div style="font-size:15px;font-weight:800;font-family:var(--font-mono);color:${c.text};">${fmtDec(s.volume,3)}</div>
                            <div style="font-size:9px;color:var(--muted);">m³</div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:3px;">
                            <button class="btn btn-edit btn-sm" title="Edit" onclick="window.editSezing('${s.id}')">✏️</button>
                            <button class="btn btn-del btn-sm"  title="Hapus" onclick="window.deleteSezing('${s.id}')">🗑️</button>
                        </div>
                    </div>
                </div>`;
        });

        html += `</div></div>`;
    });

    cont.innerHTML = html;
};

// ═══════════════════════════════════════════════════════
// BOARD STOCK — SUMMARY CARDS
// ═══════════════════════════════════════════════════════
function renderBoardStockSummary() {
    const cont = document.getElementById('board-stock-latest-container');
    if (!cont) return;

    const latest = getLatestBoardStock();
    if (latest.size === 0) {
        cont.innerHTML = `
        <div style="text-align:center;padding:28px 20px;background:var(--bg2);border:1px dashed var(--border);border-radius:10px;color:var(--muted);">
            <div style="font-size:26px;margin-bottom:8px;opacity:.4;">📦</div>
            <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px;">Belum ada stok board per PO</div>
            <div style="font-size:11px;">Input stok fisik menggunakan form di atas</div>
        </div>`;
        return;
    }

    // Section header
    let headerHtml = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border);">
        <span style="width:3px;height:16px;background:var(--gold);border-radius:2px;display:inline-block;"></span>
        <span style="font-size:13px;font-weight:700;color:var(--text);">📦 Stok Board Terkini per PO</span>
        <span style="font-size:10px;background:rgba(212,160,23,.15);color:var(--gold);border:1px solid rgba(212,160,23,.3);border-radius:20px;padding:2px 8px;font-weight:600;">${latest.size} PO aktif</span>
    </div>`;

    const cards = [];
    for (let [orderId, stok] of latest.entries()) {
        const order     = (window.orderList || []).find(o => o.id === orderId);
        if (!order) continue;
        const terpenuhi = window.getOrderTerpenuhi(orderId);
        const volOrder  = order.volumeOrder || 0;
        const sisa      = Math.max(0, volOrder - terpenuhi);
        const pctTerp   = volOrder > 0 ? Math.min(100, terpenuhi / volOrder * 100) : 0;
        const stokCol   = stok >= sisa ? 'var(--green)' : stok > 0 ? 'var(--orange)' : 'var(--red)';
        const lunas     = terpenuhi >= volOrder;

        const variants = (order.ketebalanVariants?.length)
            ? order.ketebalanVariants
            : order.ketebalanProduk ? [{ ketebalan: order.ketebalanProduk, volume: volOrder }] : [];
        const varChips = variants.map(v => {
            const col = TEBAL_HEX[v.ketebalan] || 'var(--gold)';
            return `<span style="background:rgba(0,0,0,.2);color:${col};border:1px solid ${col}44;border-radius:20px;padding:2px 8px;font-size:9px;font-weight:700;font-family:var(--font-mono);">${v.ketebalan||'?'}mm${variants.length>1?` <span style="font-weight:400;color:var(--muted);">${fmtDec(v.volume,2)}</span>`:''}</span>`;
        }).join('');

        const statusBadge = lunas
            ? `<span style="background:rgba(74,222,128,.15);color:var(--green);border:1px solid rgba(74,222,128,.3);border-radius:20px;padding:2px 8px;font-size:9px;font-weight:700;">✅ Lunas</span>`
            : `<span style="background:rgba(251,146,60,.15);color:var(--orange);border:1px solid rgba(251,146,60,.3);border-radius:20px;padding:2px 8px;font-size:9px;font-weight:700;">⏳ Proses</span>`;

        cards.push(`
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;padding:14px 16px;position:relative;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.12);">
            <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${stokCol},transparent);"></div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                <div>
                    <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--gold);">${escapeHtml(order.kodePO)}</div>
                    <div style="font-size:11px;color:var(--muted);margin-top:1px;">${escapeHtml(order.perusahaan||'—')}</div>
                </div>
                ${statusBadge}
            </div>
            ${varChips ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">${varChips}</div>` : ''}
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px;">
                ${_metrik('Vol. Order', fmtDec(volOrder,2)+' m³', 'var(--text)')}
                ${_metrik('Terpenuhi',  fmtDec(terpenuhi,2)+' m³', 'var(--green)')}
                ${_metrik('Stok Fisik', fmtDec(stok,2)+' m³',      stokCol)}
            </div>
            <div>
                <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--muted);margin-bottom:3px;">
                    <span>Pemenuhan Order</span>
                    <span style="color:${pctTerp>=100?'var(--green)':pctTerp>=60?'var(--orange)':'var(--red)'};">${pctTerp.toFixed(0)}%</span>
                </div>
                <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:${pctTerp.toFixed(1)}%;background:${pctTerp>=100?'var(--green)':pctTerp>=60?'var(--orange)':'var(--red)'};border-radius:3px;transition:width .5s;"></div>
                </div>
                <div style="font-size:10px;color:var(--muted);margin-top:5px;">
                    Sisa: <span style="color:${sisa>0?'var(--orange)':'var(--green)'};">${fmtDec(sisa,2)} m³</span>
                    ${stok > 0 && stok >= sisa ? '&nbsp;·&nbsp;<span style="color:var(--green);">✅ Stok cukup</span>' : stok > 0 ? `&nbsp;·&nbsp;<span style="color:var(--orange);">⚠️ Kurang ${fmtDec(sisa-stok,2)} m³</span>` : ''}
                </div>
            </div>
        </div>`);
    }

    cont.innerHTML = headerHtml + `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;">
        ${cards.join('')}
    </div>`;
}

function _metrik(label, value, color) {
    return `<div style="background:var(--bg3);border-radius:7px;padding:7px 10px;">
        <div style="font-size:9px;color:var(--muted);margin-bottom:2px;">${label}</div>
        <div style="font-size:13px;font-weight:700;color:${color};font-family:var(--font-mono);">${value}</div>
    </div>`;
}

function getLatestBoardStock() {
    const latestMap = new Map();
    const sorted    = [...(window.boardStockList || [])].sort((a, b) => (b.tanggal||'').localeCompare(a.tanggal||''));
    sorted.forEach(item => { if (!latestMap.has(item.orderId)) latestMap.set(item.orderId, item.stok); });
    return latestMap;
}

// ═══════════════════════════════════════════════════════
// BOARD STOCK — RIWAYAT (tabel ringkas)
// ═══════════════════════════════════════════════════════
function renderBoardStockHistory() {
    const cont = document.getElementById('board-stock-history');
    if (!cont) return;

    const list = [...(window.boardStockList||[])].sort((a,b)=>(b.tanggal||'').localeCompare(a.tanggal||'')).slice(0,15);
    if (!list.length) {
        cont.innerHTML = `<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;"><div style="font-size:22px;margin-bottom:6px;opacity:.4;">📋</div>Belum ada riwayat input stok.</div>`;
        return;
    }

    const rows = list.map(item => {
        const order = (window.orderList||[]).find(o => o.id === item.orderId);
        return `<tr>
            <td>${fmtDate(item.tanggal)}</td>
            <td class="highlight">${order ? escapeHtml(order.kodePO) : '—'}</td>
            <td>${order ? escapeHtml(order.perusahaan||'—') : '—'}</td>
            <td class="right" style="color:var(--gold);font-family:var(--font-mono);">${fmtDec(item.stok,2)} m³</td>
            <td style="color:var(--muted);font-size:11px;">${item.catatan||'—'}</td>
            <td><button class="btn btn-del btn-sm" onclick="window.deleteBoardStock('${item.id}')">🗑️</button></td>
        </tr>`;
    }).join('');

    cont.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-top:16px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border);">
        <span style="width:3px;height:14px;background:var(--muted);border-radius:2px;display:inline-block;"></span>
        <span style="font-size:12px;font-weight:700;color:var(--text);">📋 Riwayat Input Stok (15 Terakhir)</span>
    </div>
    <div class="table-wrap">
        <table style="font-size:12px;">
            <thead><tr><th>Tanggal</th><th>Kode PO</th><th>Perusahaan</th><th>Stok (m³)</th><th>Catatan</th><th>Aksi</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

// ═══════════════════════════════════════════════════════
// BOARD STOCK — FORM INPUT
// ═══════════════════════════════════════════════════════
// Helper: hanya PO yang belum selesai (terpenuhi < volumeOrder)
function _getActiveOrders() {
    return (window.orderList || []).filter(o => {
        const terpenuhi = window.getOrderTerpenuhi(o.id);
        return !(o.volumeOrder > 0 && terpenuhi >= o.volumeOrder);
    });
}

function initBoardStockForm() {
    const cont = document.getElementById('board-stock-form-container');
    if (!cont || cont.querySelector('#board-stock-order')) return;

    const orderOpts = _getActiveOrders()
        .map(o => `<option value="${o.id}">${escapeHtml(o.kodePO)} — ${escapeHtml(o.perusahaan)}</option>`)
        .join('');

    cont.innerHTML = `
    <div class="form-title" style="font-size:14px;font-weight:700;color:var(--gold);margin-bottom:6px;">📦 Input Stok Board Fisik per PO</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:14px;line-height:1.6;">Input hasil opname atau penghitungan stok fisik di gudang. Digunakan untuk memantau kesiapan pemenuhan order.</div>
    <div class="grid3">
        <div class="field">
            <label>Tanggal *</label>
            <input type="date" id="board-stock-tanggal" value="${today()}">
        </div>
        <div class="field">
            <label>Pilih PO *</label>
            <select id="board-stock-order"><option value="">-- Pilih PO --</option>${orderOpts}</select>
        </div>
        <div class="field">
            <label>Stok Fisik (m³) *</label>
            <input type="number" step="any" id="board-stock-value" placeholder="0.00">
        </div>
        <div class="field" style="grid-column:span 2">
            <label>Catatan</label>
            <input type="text" id="board-stock-catatan" placeholder="Contoh: Hasil opname gudang, setelah sortir, dll.">
        </div>
        <div class="field" style="justify-content:flex-end;">
            <button class="btn btn-primary" onclick="window.saveBoardStock()" style="margin-top:22px;">💾 Simpan Stok</button>
        </div>
    </div>`;
}

function refreshBoardStockOrders() {
    const sel = document.getElementById('board-stock-order');
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = '<option value="">-- Pilih PO --</option>' +
        _getActiveOrders().map(o =>
            `<option value="${o.id}">${escapeHtml(o.kodePO)} — ${escapeHtml(o.perusahaan)}</option>`
        ).join('');
    if (prev) sel.value = prev;
}

window.saveBoardStock = function () {
    const orderId = document.getElementById('board-stock-order')?.value;
    const stok    = parseFloat(document.getElementById('board-stock-value')?.value);
    const tgl     = document.getElementById('board-stock-tanggal')?.value || today();
    const catatan = document.getElementById('board-stock-catatan')?.value || '';
    if (!orderId)            { toast('⚠️ Pilih PO terlebih dahulu!'); return; }
    if (isNaN(stok)||stok<0) { toast('⚠️ Isi stok dengan benar!'); return; }
    window.boardStockList.push({ id: uid(), tanggal: tgl, orderId, stok, catatan });
    persistAll();
    renderBoardStockSummary();
    renderBoardStockHistory();
    document.getElementById('board-stock-value').value   = '';
    document.getElementById('board-stock-catatan').value = '';
    const order = (window.orderList||[]).find(o => o.id === orderId);
    toast(`✅ Stok ${fmtDec(stok,2)} m³ disimpan untuk ${order?.kodePO||'PO'}`);
    logActivity('Simpan','Board Stock',`${order?.kodePO}: ${fmtDec(stok,2)} m³`);
};

window.deleteBoardStock = function (id) {
    if (!confirmDialog('Hapus riwayat stok ini?')) return;
    window.boardStockList = window.boardStockList.filter(i => i.id !== id);
    persistAll();
    renderBoardStockSummary();
    renderBoardStockHistory();
    toast('🗑️ Riwayat stok dihapus');
};

// ═══════════════════════════════════════════════════════
// PENJUALAN — KPI BAR
// ═══════════════════════════════════════════════════════
function renderPenjualanKPI() {
    const cont = document.getElementById('penjualan-kpi-bar');
    if (!cont) return;

    const bulan       = thisMonth();
    const listBln     = (window.penjualanList||[]).filter(p => p.tanggal?.startsWith(bulan));
    const listAll     = window.penjualanList || [];
    const totVolBln   = listBln.reduce((a,p)=>a+(p.volume||0), 0);
    const totNettoBln = listBln.reduce((a,p)=>a+getPenjualanNetto(p), 0);
    const totHargaBln = listBln.reduce((a,p)=>a+(p.harga||0), 0);
    const totReturBln = listBln.reduce((a,p)=>a+(p.retur||0), 0);
    const totVolAll   = listAll.reduce((a,p)=>a+(p.volume||0), 0);
    const totHargaAll = listAll.reduce((a,p)=>a+(p.harga||0), 0);
    const hargaPerM3  = totNettoBln > 0 ? totHargaBln/totNettoBln : 0;
    const orderAktif  = (window.orderList||[]).filter(o => !o.lunas);
    const hariBln     = new Set(listBln.map(p=>p.tanggal)).size;

    // Top tujuan
    const perTujuan = {};
    listBln.forEach(p => {
        const t = p.tujuan || 'Lainnya';
        if (!perTujuan[t]) perTujuan[t] = { vol:0, harga:0 };
        perTujuan[t].vol   += getPenjualanNetto(p);
        perTujuan[t].harga += p.harga || 0;
    });
    const topTujuan = Object.entries(perTujuan).sort((a,b)=>b[1].vol-a[1].vol).slice(0,3)
        .map(([k,v]) => `<span style="background:rgba(96,165,250,.13);color:var(--blue);border:1px solid rgba(96,165,250,.28);border-radius:20px;padding:3px 10px;font-size:10px;font-weight:600;font-family:var(--font-mono);">${escapeHtml(k)}: ${fmtDec(v.vol,2)} m³</span>`).join('');

    cont.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px;">
        ${_kpi('💰 Netto Bulan Ini',   fmtDec(totNettoBln,2)+' m³', 'var(--green)',     'Rp '+fmtRpRekap(totHargaBln))}
        ${_kpi('📦 Bruto Bulan Ini',   fmtDec(totVolBln,2)+' m³',   'var(--gold)',      hariBln+' hari aktif')}
        ${_kpi('↩️ Retur',              fmtDec(totReturBln,2)+' m³', totReturBln>0?'var(--red)':'var(--muted)', 'Bulan ini')}
        ${_kpi('💵 Harga/m³',          'Rp '+fmtRpRekap(hargaPerM3),'var(--gold-light)','Rata-rata')}
        ${_kpi('📊 All-time',          fmtDec(totVolAll,2)+' m³',   'var(--blue)',      'Rp '+fmtRpRekap(totHargaAll))}
        ${_kpi('📑 Order Aktif',       orderAktif.length+' PO',     orderAktif.length>0?'var(--orange)':'var(--green)', orderAktif.length>0?'Belum lunas':'Semua lunas')}
    </div>
    ${topTujuan ? `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px;padding:9px 13px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;"><span style="font-size:10px;color:var(--muted);">🏆 Top Tujuan:</span>${topTujuan}</div>` : ''}`;
}

// ═══════════════════════════════════════════════════════
// PENJUALAN — DAFTAR
// ═══════════════════════════════════════════════════════
window.renderPenjualanList = function () {
    const cont = document.getElementById('penjualan-list-content');
    if (!cont) return;

    const from = document.getElementById('jual-filter-from')?.value || '';
    const to   = document.getElementById('jual-filter-to')?.value   || '';
    const srch = (document.getElementById('jual-filter-search')?.value||'').toLowerCase();

    let list = sortByDateAsc(window.penjualanList || []);
    if (from) list = list.filter(p => p.tanggal >= from);
    if (to)   list = list.filter(p => p.tanggal <= to);
    if (srch) list = list.filter(p =>
        (p.tujuan||'').toLowerCase().includes(srch) ||
        (p.truk||'').toLowerCase().includes(srch) ||
        ((window.orderList||[]).find(o=>o.id===p.orderId)?.kodePO||'').toLowerCase().includes(srch)
    );

    if (!list.length) {
        cont.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--muted);"><div style="font-size:32px;margin-bottom:8px;opacity:.5;">📭</div><div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;">Belum ada penjualan</div><div style="font-size:11px;">Ubah filter atau catat penjualan baru</div></div>`;
        return;
    }

    const rows = list.map(p => {
        const order   = (window.orderList||[]).find(o=>o.id===p.orderId);
        const netto   = getPenjualanNetto(p);
        const hPerM3  = netto > 0 ? (p.harga/netto) : 0;
        const returPct= p.volume>0 ? (p.retur/p.volume*100).toFixed(1) : '0';
        const variants= order ? ((order.ketebalanVariants?.length) ? order.ketebalanVariants : order.ketebalanProduk ? [{ketebalan:order.ketebalanProduk}] : []) : [];
        const tebalHtml= variants.length
            ? variants.map(v => { const col=TEBAL_HEX[v.ketebalan]||'var(--gold)'; return `<span style="background:rgba(0,0,0,.18);color:${col};border:1px solid ${col}44;border-radius:20px;padding:2px 7px;font-size:9px;font-weight:700;font-family:var(--font-mono);white-space:nowrap;display:inline-block;margin:1px;">${v.ketebalan}mm</span>`; }).join('')
            : '<span style="color:var(--muted);font-size:10px;">—</span>';
        return `<tr onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">
            <td>${fmtDate(p.tanggal)}</td>
            <td><div style="font-size:12px;font-weight:700;font-family:var(--font-mono);color:var(--text);">${order?escapeHtml(order.kodePO):'—'}</div><div style="font-size:10px;color:var(--muted);">${order?escapeHtml(order.perusahaan||''):''}</div></td>
            <td style="text-align:center;">${tebalHtml}</td>
            <td style="text-align:right;font-family:var(--font-mono);">${fmt(p.pcs)}</td>
            <td style="text-align:right;"><span style="font-family:var(--font-mono);color:var(--gold);">${fmtDec(p.volume,3)}</span>${p.retur>0?`<div style="font-size:9px;color:var(--red);">↩ ${fmtDec(p.retur,3)} (${returPct}%)</div>`:''}</td>
            <td style="text-align:right;font-family:var(--font-mono);font-weight:700;color:var(--green);">${fmtDec(netto,3)}</td>
            <td style="font-family:var(--font-mono);font-size:11px;">${escapeHtml(p.truk)}</td>
            <td>${escapeHtml(p.tujuan)}</td>
            <td style="text-align:right;"><div style="font-family:var(--font-mono);color:var(--green);font-weight:600;">Rp ${fmt(p.harga)}</div><div style="font-size:9px;color:var(--muted);">${fmtRpRekap(hPerM3)}/m³</div></td>
            <td><div style="display:flex;gap:4px;justify-content:center;"><button class="btn btn-edit btn-sm" title="Edit" onclick="window.editPenjualan('${p.id}')">✏️</button><button class="btn btn-del btn-sm" title="Hapus" onclick="window.deletePenjualan('${p.id}')">🗑️</button></div></td>
        </tr>`;
    }).join('');

    const grandNetto = list.reduce((a,p)=>a+getPenjualanNetto(p), 0);
    const grandHarga = list.reduce((a,p)=>a+(p.harga||0), 0);

    cont.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:3px;height:18px;background:var(--green);border-radius:2px;display:inline-block;"></span>
            <span style="font-size:13px;font-weight:700;color:var(--text);">💰 Daftar Penjualan</span>
            <span style="font-size:10px;background:rgba(74,222,128,.13);color:var(--green);border:1px solid rgba(74,222,128,.28);border-radius:20px;padding:2px 8px;font-weight:600;">${list.length} transaksi</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:11px;font-family:var(--font-mono);color:var(--green);font-weight:700;">${fmtDec(grandNetto,2)} m³ · Rp ${fmtRpRekap(grandHarga)}</span>
            <button style="display:inline-flex;align-items:center;gap:5px;background:rgba(96,165,250,.12);color:var(--blue);border:1px solid rgba(96,165,250,.3);border-radius:6px;padding:5px 11px;font-size:11px;font-weight:600;cursor:pointer;" onclick="window.exportPenjualanCSV()">📥 CSV</button>
        </div>
    </div>
    <div class="table-wrap">
        <table style="font-size:11px;">
            <thead><tr>
                <th>Tanggal</th><th>PO / Pembeli</th><th style="text-align:center;">Tebal</th>
                <th class="right">Pcs</th><th class="right">Bruto (m³)</th><th class="right">Netto (m³)</th>
                <th>No. Truk</th><th>Tujuan</th><th class="right">Harga</th><th>Aksi</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
};

// ═══════════════════════════════════════════════════════
// PENJUALAN — CHARTS
// ═══════════════════════════════════════════════════════
function renderPenjualanCharts() {
    const cont = document.getElementById('penjualan-charts-container');
    if (!cont) return;

    const bulan   = thisMonth();
    const listBln = (window.penjualanList||[]).filter(p=>p.tanggal?.startsWith(bulan));
    if (!listBln.length) { cont.innerHTML=''; return; }

    const [y,m]   = bulan.split('-').map(Number);
    const hariDlm = new Date(y,m,0).getDate();
    const labels  = Array.from({length:hariDlm},(_,i)=>String(i+1).padStart(2,'0'));
    const volHari = labels.map(d => {
        const tgl = `${bulan}-${d}`;
        return listBln.filter(p=>p.tanggal===tgl).reduce((a,p)=>a+getPenjualanNetto(p),0) || null;
    });
    const hargaHari = labels.map(d => {
        const tgl = `${bulan}-${d}`;
        return listBln.filter(p=>p.tanggal===tgl).reduce((a,p)=>a+(p.harga||0),0) || null;
    });

    const perTujuan = {};
    listBln.forEach(p => { const t=p.tujuan||'Lainnya'; perTujuan[t]=(perTujuan[t]||0)+getPenjualanNetto(p); });
    const tujuanEntries = Object.entries(perTujuan).sort((a,b)=>b[1]-a[1]);
    const totVol  = tujuanEntries.reduce((a,[,v])=>a+v, 0);
    const tColors = ['var(--gold)','var(--blue)','var(--green)','var(--orange)','var(--red)'];
    const tujuanBars = tujuanEntries.map(([k,v],i) => {
        const pct = totVol>0 ? (v/totVol*100) : 0;
        const col = tColors[i%tColors.length];
        return `<div style="margin-bottom:9px;"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;"><span style="color:var(--text);">${escapeHtml(k)}</span><span style="font-family:var(--font-mono);color:${col};">${fmtDec(v,2)} m³ (${pct.toFixed(0)}%)</span></div><div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${pct.toFixed(1)}%;background:${col};border-radius:3px;transition:width .5s;"></div></div></div>`;
    }).join('');

    cont.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-top:20px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">
        <span style="width:3px;height:16px;background:var(--blue);border-radius:2px;display:inline-block;"></span>
        <span style="font-size:13px;font-weight:700;color:var(--text);">📊 Analitik Penjualan — ${_fmtBulan(bulan)}</span>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:12px;">
        <div class="chart-wrap"><div class="chart-title">📅 Volume & Nilai Harian</div><canvas id="chart-jual-harian" height="160"></canvas></div>
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;padding:14px;"><div class="chart-title">🗺️ Distribusi per Tujuan</div>${tujuanBars||'<div style="color:var(--muted);font-size:11px;padding-top:8px;">Belum ada data</div>'}</div>
    </div>`;

    setTimeout(() => {
        const ctx = document.getElementById('chart-jual-harian');
        if (!ctx || !window.Chart) return;
        if (ctx._chartInst) ctx._chartInst.destroy();
        ctx._chartInst = new Chart(ctx, {
            data: { labels, datasets: [
                { type:'bar',  label:'Volume Netto (m³)', data:volHari,   backgroundColor:'rgba(74,222,128,.45)', borderColor:'var(--green)', borderWidth:1, borderRadius:3, yAxisID:'y',  spanGaps:true },
                { type:'line', label:'Nilai (Rp)',        data:hargaHari, borderColor:'var(--gold)', backgroundColor:'rgba(212,160,23,.08)', borderWidth:2, pointRadius:2, fill:true, tension:.3, yAxisID:'y1', spanGaps:true }
            ]},
            options: {
                responsive:true, interaction:{mode:'index',intersect:false},
                plugins:{ legend:{labels:{color:'#8a8578',font:{size:9},boxWidth:12}} },
                scales:{
                    x: { ticks:{color:'#555',font:{size:9}}, grid:{color:'rgba(255,255,255,.03)'} },
                    y: { position:'left',  ticks:{color:'#4ade80',font:{size:9}}, grid:{color:'rgba(255,255,255,.04)'}, title:{display:true,text:'m³',color:'#8a8578',font:{size:9}} },
                    y1:{ position:'right', ticks:{color:'#d4a017',font:{size:9}}, grid:{drawOnChartArea:false}, title:{display:true,text:'Rp',color:'#8a8578',font:{size:9}} }
                }
            }
        });
    }, 100);
}

// ═══════════════════════════════════════════════════════
// PENJUALAN — FORM INPUT/EDIT
// ═══════════════════════════════════════════════════════
window.populateOrderDropdown = function (selectedId) {
    const sel = document.getElementById('jual-order');
    if (!sel) return;
    const activeOrders = (window.orderList||[]).filter(o => {
        const terkirim = (window.penjualanList||[]).filter(p=>p.orderId===o.id).reduce((s,p)=>s+(parseFloat(p.volume)||0),0);
        return !(o.volumeOrder>0 && terkirim>=o.volumeOrder) || o.id===selectedId;
    });
    sel.innerHTML = '<option value="">-- Pilih PO --</option>' +
        activeOrders.map(o => `<option value="${o.id}"${o.id===selectedId?' selected':''}>${escapeHtml(o.kodePO)} — ${escapeHtml(o.perusahaan)}</option>`).join('');
};

window.resetJualForm = function () {
    ['jual-tanggal','jual-pcs','jual-volume','jual-truk','jual-tujuan','jual-harga','jual-retur'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = id==='jual-tanggal' ? today() : id==='jual-retur' ? '0' : '';
    });
    document.getElementById('jual-harga-per-m3') && (document.getElementById('jual-harga-per-m3').textContent='—');
    const ti = document.getElementById('jual-tebal-info');
    if (ti) { ti.textContent='—'; ti.style.color='var(--gold)'; }
    penjualanEditId = null;
    populateOrderDropdown(null);
};

window.fillJualForm = function (item) {
    document.getElementById('jual-tanggal').value = item.tanggal;
    document.getElementById('jual-pcs').value     = item.pcs;
    document.getElementById('jual-volume').value  = item.volume;
    document.getElementById('jual-truk').value    = item.truk;
    document.getElementById('jual-tujuan').value  = item.tujuan;
    document.getElementById('jual-harga').value   = item.harga;
    document.getElementById('jual-retur').value   = item.retur || 0;
    penjualanEditId = item.id;
    populateOrderDropdown(item.orderId||null);
    updateJualPreview();
};

window.updateJualPreview = function () {
    const vol   = parseFloat(document.getElementById('jual-volume')?.value) || 0;
    const retur = parseFloat(document.getElementById('jual-retur')?.value)  || 0;
    const harga = parseFloat(document.getElementById('jual-harga')?.value)  || 0;
    const netto = Math.max(0, vol-retur);
    const hpm3  = netto>0 ? (harga/netto) : 0;
    const el    = document.getElementById('jual-harga-per-m3');
    if (el) el.textContent = hpm3>0 ? 'Rp '+fmtRpRekap(hpm3)+'/m³' : '—';

    const orderId = document.getElementById('jual-order')?.value;
    const tiEl    = document.getElementById('jual-tebal-info');
    if (tiEl) {
        const selOrder = (window.orderList||[]).find(o=>o.id===orderId);
        if (selOrder) {
            const variants = (selOrder.ketebalanVariants?.length) ? selOrder.ketebalanVariants : selOrder.ketebalanProduk ? [{ketebalan:selOrder.ketebalanProduk,volume:selOrder.volumeOrder}] : [];
            if (variants.length) {
                tiEl.innerHTML = variants.map(v => {
                    const col = TEBAL_HEX[v.ketebalan]||'var(--gold)';
                    return `<span style="background:rgba(0,0,0,.2);color:${col};border:1px solid ${col}44;border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;font-family:var(--font-mono);display:inline-block;margin:1px;">${v.ketebalan}mm · ${fmtDec(v.volume,2)} m³</span>`;
                }).join('');
            } else {
                tiEl.innerHTML = `<span style="color:var(--muted);font-size:10px;">Tidak diatur</span>`;
            }
        } else {
            tiEl.innerHTML = `<span style="color:var(--muted);font-size:10px;">—</span>`;
        }
    }

    if (orderId && vol>0) {
        const order = (window.orderList||[]).find(o=>o.id===orderId);
        if (order) {
            let terpenuhi = window.getOrderTerpenuhi(orderId);
            if (penjualanEditId) { const old=(window.penjualanList||[]).find(p=>p.id===penjualanEditId); if(old) terpenuhi-=getPenjualanNetto(old); }
            const sisa   = Math.max(0,(order.volumeOrder||0)-terpenuhi);
            const sisaEl = document.getElementById('jual-sisa-po');
            if (sisaEl) { sisaEl.textContent=`Sisa PO: ${fmtDec(sisa,2)} m³`; sisaEl.style.color=vol>sisa?'var(--red)':'var(--green)'; }
        }
    }
};

window.savePenjualan = function () {
    const tgl    = document.getElementById('jual-tanggal')?.value;
    const pcs    = document.getElementById('jual-pcs')?.value;
    const vol    = parseFloat(document.getElementById('jual-volume')?.value) || 0;
    const truk   = document.getElementById('jual-truk')?.value?.trim();
    const tujuan = document.getElementById('jual-tujuan')?.value?.trim();
    const harga  = parseFloat(document.getElementById('jual-harga')?.value) || 0;
    const orderId= document.getElementById('jual-order')?.value;
    const retur  = parseFloat(document.getElementById('jual-retur')?.value) || 0;

    if (!tgl)    { toast('⚠️ Tanggal wajib diisi!'); return; }
    if (!pcs)    { toast('⚠️ Jumlah pcs wajib diisi!'); return; }
    if (!vol)    { toast('⚠️ Volume wajib diisi!'); return; }
    if (!truk)   { toast('⚠️ No. truk wajib diisi!'); return; }
    if (!tujuan) { toast('⚠️ Tujuan wajib diisi!'); return; }
    if (!harga)  { toast('⚠️ Harga wajib diisi!'); return; }
    if (!orderId){ toast('⚠️ Pilih PO terlebih dahulu!'); return; }

    const order = (window.orderList||[]).find(o=>o.id===orderId);
    if (order) {
        let terpenuhi = window.getOrderTerpenuhi(orderId);
        if (penjualanEditId) { const old=(window.penjualanList||[]).find(p=>p.id===penjualanEditId); if(old) terpenuhi-=getPenjualanNetto(old); }
        const sisa  = Math.max(0,(order.volumeOrder||0)-terpenuhi);
        const netto = Math.max(0,vol-retur);
        if (netto>sisa && !confirmDialog(`⚠️ Volume netto (${fmtDec(netto,2)} m³) melebihi sisa order\n(sisa: ${fmtDec(sisa,2)} m³). Tetap simpan?`)) return;
    }

    const item = { id:penjualanEditId||uid(), tanggal:tgl, pcs:parseInt(pcs)||0, volume:vol, truk, tujuan, harga, orderId, retur };
    if (!window.penjualanList) window.penjualanList = [];

    if (penjualanEditId) {
        window.penjualanList = window.penjualanList.map(p=>p.id===penjualanEditId?item:p);
        logActivity('Update','Penjualan',`${truk} → ${tujuan}`);
        toast('✅ Penjualan diperbarui!');
    } else {
        window.penjualanList.push(item);
        logActivity('Simpan','Penjualan',`${truk} → ${tujuan} · ${fmtDec(vol,2)} m³`);
        toast('✅ Penjualan disimpan!');
    }

    persistAll();
    renderPenjualan();
    updateAllOrderSummaries?.();
    renderOrder?.();
    resetJualForm();
};

window.deletePenjualan = function (id) {
    const item = (window.penjualanList||[]).find(p=>p.id===id);
    if (!confirmDialog('Hapus data penjualan ini?')) return;
    window.penjualanList = window.penjualanList.filter(p=>p.id!==id);
    persistAll();
    renderPenjualan();
    updateAllOrderSummaries?.();
    renderOrder?.();
    logActivity('Hapus','Penjualan',`${item?.truk} → ${item?.tujuan}`);
    toast('🗑️ Penjualan dihapus');
};

window.editPenjualan = function (id) {
    const item = (window.penjualanList||[]).find(p=>p.id===id);
    if (!item) return;
    fillJualForm(item);
    window.switchTab?.('penjualan');
    setTimeout(() => { document.querySelector('#tab-penjualan .subtab-btn[data-subtab="penjualan-input"]')?.click(); }, 50);
};

// ═══════════════════════════════════════════════════════
// EXPORT CSV
// ═══════════════════════════════════════════════════════
window.exportSezingCSV = function () {
    if (!(window.sezingList||[]).length) { toast('⚠️ Tidak ada data'); return; }
    const headers = ['Tanggal','Open No.','Ketebalan(mm)','Jenis','Volume(m³)','Lembar(pcs)','Shift','Operator','Keterangan'];
    const rows    = sortByDateAsc(window.sezingList).map(s => [s.tanggal,s.openNo||'',s.ketebalan||'',s.jenis||'',fmtDec(s.volume||0,3),s.pcs||0,s.shift||'1',s.operator||'',s.keterangan||''].join(','));
    _downloadCSV([headers.join(','),...rows].join('\n'), `sezing_${thisMonth()}.csv`);
    toast('📥 CSV sezing berhasil diunduh');
};

window.exportPenjualanCSV = function () {
    if (!(window.penjualanList||[]).length) { toast('⚠️ Tidak ada data'); return; }
    const headers = ['Tanggal','Kode PO','Pembeli','Pcs','Bruto(m³)','Retur(m³)','Netto(m³)','No.Truk','Tujuan','Harga(Rp)','Harga/m³'];
    const rows    = sortByDateAsc(window.penjualanList).map(p => {
        const order = (window.orderList||[]).find(o=>o.id===p.orderId);
        const netto = getPenjualanNetto(p);
        const hpm3  = netto>0 ? Math.round(p.harga/netto) : 0;
        return [p.tanggal,order?.kodePO||'',order?.perusahaan||'',p.pcs||0,fmtDec(p.volume||0,3),fmtDec(p.retur||0,3),fmtDec(netto,3),p.truk||'',p.tujuan||'',p.harga||0,hpm3].join(',');
    });
    _downloadCSV([headers.join(','),...rows].join('\n'), `penjualan_${thisMonth()}.csv`);
    toast('📥 CSV penjualan berhasil diunduh');
};

function _downloadCSV(csv, filename) {
    const a = document.createElement('a');
    a.href  = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = filename;
    a.click();
}

// ═══════════════════════════════════════════════════════
// INJECT FILTER BARS & EXTRA CONTAINERS
// ═══════════════════════════════════════════════════════
function _injectFilterBar(listId, barId, searchId, fromId, toId, renderFn, placeholder) {
    const listEl = document.getElementById(listId);
    if (!listEl || document.getElementById(barId)) return;
    const bar = document.createElement('div');
    bar.id    = barId;
    bar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;';
    bar.innerHTML = `
        <input class="search" type="text" id="${searchId}" placeholder="🔍 ${placeholder}" style="width:200px;" oninput="${renderFn}">
        <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--muted);">
            <label>Dari:</label>
            <input type="date" id="${fromId}" style="background:var(--input-bg);border:1px solid var(--input-border);color:var(--input-color);padding:6px 9px;border-radius:6px;font-size:11px;" onchange="${renderFn}">
            <label>s/d</label>
            <input type="date" id="${toId}"   style="background:var(--input-bg);border:1px solid var(--input-border);color:var(--input-color);padding:6px 9px;border-radius:6px;font-size:11px;" onchange="${renderFn}">
        </div>
        <button style="background:var(--bg3);color:var(--muted);border:1px solid var(--border);border-radius:6px;padding:5px 11px;font-size:11px;cursor:pointer;" onclick="${barId.replace('-bar','')}_reset()">↩ Reset</button>`;
    listEl.insertAdjacentElement('beforebegin', bar);
}

function injectSezingFilterBar() {
    _injectFilterBar('sezing-list-content','sz-filter-bar','sz-filter-search','sz-filter-from','sz-filter-to','window.renderSezingList()','Cari Open No. / operator...');
}
function injectJualFilterBar() {
    _injectFilterBar('penjualan-list-content','jual-filter-bar','jual-filter-search','jual-filter-from','jual-filter-to','window.renderPenjualanList()','Cari tujuan / truk / PO...');
}

window['sz-filter-bar_reset'] = function () {
    ['sz-filter-from','sz-filter-to','sz-filter-search'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    window.renderSezingList();
};
window['jual-filter-bar_reset'] = function () {
    ['jual-filter-from','jual-filter-to','jual-filter-search'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    window.renderPenjualanList();
};

function injectExtraContainers() {
    // Penjualan KPI bar
    const jualList = document.getElementById('penjualan-list-content');
    if (jualList && !document.getElementById('penjualan-kpi-bar')) {
        const el = document.createElement('div');
        el.id    = 'penjualan-kpi-bar';
        jualList.insertAdjacentElement('beforebegin', el);
    }
    // Penjualan charts container
    if (!document.getElementById('penjualan-charts-container')) {
        const el     = document.createElement('div');
        el.id        = 'penjualan-charts-container';
        const parent = jualList?.parentElement || document.getElementById('tab-penjualan');
        if (parent) parent.appendChild(el);
    }
    // Harga per m³ label
    const hargaInput = document.getElementById('jual-harga');
    if (hargaInput && !document.getElementById('jual-harga-per-m3')) {
        const el        = document.createElement('div');
        el.id           = 'jual-harga-per-m3';
        el.style.cssText= 'font-size:11px;color:var(--gold);margin-top:3px;font-family:var(--font-mono);';
        el.textContent  = '—';
        hargaInput.insertAdjacentElement('afterend', el);
        hargaInput.addEventListener('input', window.updateJualPreview);
        document.getElementById('jual-volume')?.addEventListener('input', window.updateJualPreview);
        document.getElementById('jual-retur')?.addEventListener('input',  window.updateJualPreview);
        document.getElementById('jual-order')?.addEventListener('change', window.updateJualPreview);
    }
    // Sisa PO info
    const orderSel = document.getElementById('jual-order');
    if (orderSel && !document.getElementById('jual-sisa-po')) {
        const el        = document.createElement('div');
        el.id           = 'jual-sisa-po';
        el.style.cssText= 'font-size:10px;margin-top:3px;';
        orderSel.insertAdjacentElement('afterend', el);
    }
}

// ═══════════════════════════════════════════════════════
// HOOKS: sync dengan Order module
// ═══════════════════════════════════════════════════════
if (typeof window.saveOrder === 'function') {
    const _orig = window.saveOrder;
    window.saveOrder = function () { _orig(); refreshBoardStockOrders(); renderBoardStockSummary(); renderPenjualanKPI?.(); };
}
if (typeof window.deleteOrder === 'function') {
    const _orig = window.deleteOrder;
    window.deleteOrder = function (id) { _orig(id); refreshBoardStockOrders(); renderBoardStockSummary(); renderPenjualanKPI?.(); };
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    const btnSave = document.getElementById('btn-save-penjualan');
    if (btnSave) btnSave.onclick = () => window.savePenjualan();
});

setTimeout(() => {
    injectExtraContainers();
    injectSezingFilterBar();
    injectJualFilterBar();
    renderSezing();
    renderPenjualan();
}, 500);
