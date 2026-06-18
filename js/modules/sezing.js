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
// escapeHtml — defined globally in utils.js[c]));
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
// HELPER KPI CARD (lokal)
// ═══════════════════════════════════════════════════════
function _kpi(label, value, color, sub) {
    return `<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;">
        <div style="font-size:10px;color:var(--muted);font-weight:600;margin-bottom:6px;">${label}</div>
        <div style="font-size:18px;font-weight:800;font-family:var(--font-mono);color:${color};line-height:1.1;">${value}</div>
        ${sub?`<div style="font-size:10px;color:var(--muted);margin-top:4px;">${sub}</div>`:''}
    </div>`;
}

// ═══════════════════════════════════════════════════════
// SEZING — INIT FORM INPUT
// ═══════════════════════════════════════════════════════
function _initSezingInputForm() {
    const szTgl = document.getElementById('sz-tanggal');
    if (szTgl && !szTgl.value) szTgl.value = today();

    const sel = document.getElementById('sz-openno');
    if (sel) {
        const openNos = [...new Set((window.sawmillList || []).map(s => s.openNo).filter(Boolean))].sort().reverse();
        const currentVal = sel.value;
        sel.innerHTML = '<option value="">-- Pilih --</option>' +
            openNos.map(n => `<option value="${escapeHtml(n)}"${n===currentVal?' selected':''}>${escapeHtml(n)}</option>`).join('');
    }
}

window.updateSezingPreview = function () {
    const vol  = parseFloat(document.getElementById('sz-volume')?.value) || 0;
    const pcs  = parseInt(document.getElementById('sz-pcs')?.value) || 0;
    const prev = document.getElementById('sz-preview');
    if (!prev) return;
    if (vol > 0 || pcs > 0) {
        prev.style.display = 'block';
        document.getElementById('sz-prev-vol').textContent   = fmtDec(vol, 3);
        document.getElementById('sz-prev-pcs').textContent   = fmt(pcs);
        document.getElementById('sz-prev-ratio').textContent = (vol > 0 && pcs > 0)
            ? fmtDec(vol / pcs * 1000, 2) + ' ltr/lbr' : '—';
    } else {
        prev.style.display = 'none';
    }
};

window.resetSezingForm = function () {
    ['sz-tanggal','sz-volume','sz-operator','sz-keterangan'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = id === 'sz-tanggal' ? today() : '';
    });
    const pcsEl = document.getElementById('sz-pcs');
    if (pcsEl) pcsEl.value = '';
    ['sz-openno','sz-jenis'].forEach(id => {
        const el = document.getElementById(id); if (el) el.selectedIndex = 0;
    });
    const szKet = document.getElementById('sz-ketebalan'); if (szKet) szKet.value = '';
    const shiftEl = document.getElementById('sz-shift');
    if (shiftEl) shiftEl.value = '1';
    sezingEditId = null;
    const prev = document.getElementById('sz-preview');
    if (prev) prev.style.display = 'none';
};

window.saveSezing = function () {
    const tgl      = document.getElementById('sz-tanggal')?.value;
    const openNo   = document.getElementById('sz-openno')?.value;
    const keteb    = document.getElementById('sz-ketebalan')?.value;
    const vol      = parseFloat(document.getElementById('sz-volume')?.value) || 0;
    const pcs      = parseInt(document.getElementById('sz-pcs')?.value) || 0;
    const jenis    = document.getElementById('sz-jenis')?.value;
    const shift    = document.getElementById('sz-shift')?.value || '1';
    const operator = document.getElementById('sz-operator')?.value?.trim();
    const ket      = document.getElementById('sz-keterangan')?.value?.trim();

    if (!tgl) { toast('⚠️ Tanggal wajib diisi!'); return; }
    if (!vol) { toast('⚠️ Volume wajib diisi!'); return; }

    const item = {
        id: sezingEditId || uid(),
        tanggal: tgl, openNo: openNo||'', ketebalan: keteb||'',
        volume: vol, pcs, jenis: jenis||'', shift,
        operator: operator||'', keterangan: ket||''
    };

    if (!window.sezingList) window.sezingList = [];
    if (sezingEditId) {
        window.sezingList = window.sezingList.map(s => s.id === sezingEditId ? item : s);
        logActivity?.('Update', 'Sezing', `${fmtDec(vol,3)} m³ · ${keteb||'—'}mm`);
        toast('✅ Data sezing diperbarui!');
    } else {
        window.sezingList.push(item);
        logActivity?.('Simpan', 'Sezing', `${fmtDec(vol,3)} m³ · ${keteb||'—'}mm`);
        toast('✅ Sezing disimpan!');
    }
    persistAll();
    sezingEditId = null;
    window.resetSezingForm();
    window.renderSezing?.();
    document.querySelector('#tab-sezing .subtab-btn[data-subtab="sezing-list"]')?.click();
};

window.deleteSezing = function (id) {
    if (!confirmDialog?.('Hapus data sezing ini?')) return;
    window.sezingList = (window.sezingList||[]).filter(s => s.id !== id);
    persistAll();
    window.renderSezing?.();
    toast('🗑️ Data sezing dihapus');
};

window.editSezing = function (id) {
    const item = (window.sezingList||[]).find(s => s.id === id);
    if (!item) return;
    _initSezingInputForm();
    const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val ?? ''; };
    set('sz-tanggal', item.tanggal); set('sz-openno', item.openNo);
    set('sz-ketebalan', item.ketebalan); set('sz-volume', item.volume);
    set('sz-pcs', item.pcs); set('sz-jenis', item.jenis);
    set('sz-shift', item.shift||'1'); set('sz-operator', item.operator);
    set('sz-keterangan', item.keterangan);
    sezingEditId = item.id;
    window.updateSezingPreview();
    window.switchTab?.('sezing');
    setTimeout(() => {
        document.querySelector('#tab-sezing .subtab-btn[data-subtab="sezing-input"]')?.click();
        window.scrollTo({ top:0, behavior:'smooth' });
    }, 50);
};

// ═══════════════════════════════════════════════════════
// SEZING — KPI BAR
// ═══════════════════════════════════════════════════════
function renderSezingKPI() {
    const cont = document.getElementById('sezing-kpi-bar');
    if (!cont) return;

    const list    = window.sezingList || [];
    const bulan   = thisMonth();
    const listBln = list.filter(s => s.tanggal?.startsWith(bulan));

    const totVolAll = list.reduce((a,s) => a+(s.volume||0), 0);
    const totVolBln = listBln.reduce((a,s) => a+(s.volume||0), 0);
    const totPcsBln = listBln.reduce((a,s) => a+(s.pcs||0), 0);
    const hariBln   = new Set(listBln.map(s => s.tanggal)).size;

    const perTebal = {};
    listBln.forEach(s => {
        const k = s.ketebalan || '—';
        if (!perTebal[k]) perTebal[k] = 0;
        perTebal[k] += s.volume || 0;
    });
    const tebalEntries = Object.entries(perTebal).sort((a,b) => b[1]-a[1]);
    const maxTebal     = Math.max(...tebalEntries.map(([,v])=>v), 0.001);

    const tebalBars = tebalEntries.map(([k,v]) => {
        const col = tebalColor(k);
        const w   = (v / maxTebal * 100).toFixed(1);
        return `<div style="display:flex;align-items:center;gap:8px;">
            <span style="width:50px;font-size:10px;color:${col.text};font-weight:700;">${escapeHtml(k)} mm</span>
            <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${w}%;background:${col.border};border-radius:3px;transition:width .5s;"></div>
            </div>
            <span style="width:70px;text-align:right;font-family:var(--font-mono);font-size:10px;color:${col.text};">${fmtDec(v,3)} m³</span>
        </div>`;
    }).join('');

    cont.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;">
        ${_kpi('📏 Vol. Sezing Bulan Ini', fmtDec(totVolBln,3)+' m³', 'var(--gold)', hariBln+' hari aktif')}
        ${_kpi('📦 Jumlah Lembar', fmt(totPcsBln)+' pcs', 'var(--blue)', 'Bulan ini')}
        ${_kpi('📊 Kumulatif All-time', fmtDec(totVolAll,3)+' m³', 'var(--green)', list.length+' entri total')}
        ${_kpi('🏭 Sesi Bulan Ini', listBln.length+' sesi', 'var(--orange)', listBln.length>0&&totVolBln>0 ? fmtDec(totVolBln/listBln.length,3)+' m³/sesi' : '—')}
    </div>
    ${tebalBars ? `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px;">
        <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">📐 Distribusi Ketebalan — ${_fmtBulan(bulan)}</div>
        <div style="display:flex;flex-direction:column;gap:6px;">${tebalBars}</div>
    </div>` : ''}`;
}

// ═══════════════════════════════════════════════════════
// SEZING — DAFTAR
// ═══════════════════════════════════════════════════════
window.renderSezingList = function () {
    const cont = document.getElementById('sezing-list-content');
    if (!cont) return;

    const bulan = localStorage.getItem('sz_filter_month') || (() => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; })();
    const srch = (document.getElementById('sz-filter-search')?.value||'').toLowerCase();

    let list = sortByDateAsc(window.sezingList || []);
    if (bulan !== 'all') list = list.filter(s => s.tanggal?.startsWith(bulan));
    if (srch) list = list.filter(s =>
        (s.openNo||'').toLowerCase().includes(srch) ||
        (s.operator||'').toLowerCase().includes(srch) ||
        (s.ketebalan||'').toLowerCase().includes(srch) ||
        (s.jenis||'').toLowerCase().includes(srch)
    );

    if (!list.length) {
        cont.innerHTML = `
        <div style="text-align:center;padding:48px 20px;color:var(--muted);">
            <div style="font-size:36px;margin-bottom:10px;opacity:.35;">📭</div>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;">Belum ada data sezing</div>
            <div style="font-size:11px;">Ubah filter atau <a href="#" onclick="document.querySelector('#tab-sezing .subtab-btn[data-subtab=sezing-input]').click();return false;" style="color:var(--gold);">catat sezing baru</a></div>
        </div>`;
        return;
    }

    const byDate = {};
    list.forEach(s => { if (!byDate[s.tanggal]) byDate[s.tanggal]=[]; byDate[s.tanggal].push(s); });
    const dates    = Object.keys(byDate).sort((a,b) => b.localeCompare(a));
    const grandVol = list.reduce((a,s)=>a+(s.volume||0), 0);
    const grandPcs = list.reduce((a,s)=>a+(s.pcs||0), 0);

    let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;padding:11px 14px;background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
            <span style="width:3px;height:20px;background:var(--gold);border-radius:2px;flex-shrink:0;display:inline-block;"></span>
            <div>
                <div style="font-size:13px;font-weight:700;color:var(--text);">📏 Daftar Sezing</div>
                <div style="font-size:10px;color:var(--muted);margin-top:1px;">${list.length} entri · ${dates.length} hari · ${fmt(grandPcs)} pcs</div>
            </div>
        </div>
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
            <div style="text-align:right;">
                <div style="font-size:15px;font-weight:800;font-family:var(--font-mono);color:var(--gold);line-height:1.1;">${fmtDec(grandVol,3)} m³</div>
                <div style="font-size:10px;color:var(--muted);">Total volume</div>
            </div>
            <button style="display:inline-flex;align-items:center;gap:5px;background:rgba(96,165,250,.12);color:var(--blue);border:1px solid rgba(96,165,250,.3);border-radius:7px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;" onclick="window.exportSezingCSV()">📥 Export CSV</button>
        </div>
    </div>`;

    dates.forEach(tgl => {
        const items  = byDate[tgl];
        const dayVol = items.reduce((a,s)=>a+(s.volume||0), 0);
        const dayPcs = items.reduce((a,s)=>a+(s.pcs||0), 0);

        const tebalChips = [...new Set(items.map(s=>s.ketebalan).filter(Boolean))].map(k => {
            const col = tebalColor(k);
            return `<span style="background:${col.bg};color:${col.text};border:1px solid ${col.border};border-radius:20px;padding:2px 8px;font-size:9px;font-weight:700;">${k}mm</span>`;
        }).join('');

        html += `
        <div style="margin-bottom:10px;border:1px solid var(--border);border-radius:10px;overflow:hidden;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:9px 13px;background:var(--bg3);border-bottom:1px solid var(--border);">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-size:12px;font-weight:700;color:var(--text);">📅 ${fmtDate(tgl)}</span>
                    <span style="font-size:10px;color:var(--muted);">${items.length} sesi</span>
                    <div style="display:flex;flex-wrap:wrap;gap:4px;">${tebalChips}</div>
                </div>
                <div style="display:flex;align-items:center;gap:14px;flex-shrink:0;">
                    <div style="text-align:right;"><div style="font-size:10px;color:var(--muted);">${fmt(dayPcs)} pcs</div></div>
                    <div style="text-align:right;min-width:60px;">
                        <div style="font-size:16px;font-weight:800;font-family:var(--font-mono);color:var(--gold);line-height:1.1;">${fmtDec(dayVol,3)}</div>
                        <div style="font-size:9px;color:var(--muted);">m³</div>
                    </div>
                </div>
            </div>
            <div style="background:var(--bg2);">`;

        items.forEach((s, i) => {
            const isLast = i === items.length - 1;
            const col    = tebalColor(s.ketebalan);
            html += `
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:10px 13px;${!isLast?'border-bottom:1px solid var(--border);':''}">
                    <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:200px;">
                        <div style="width:3px;height:36px;border-radius:2px;background:${col.border};flex-shrink:0;opacity:.8;"></div>
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap;">
                                ${s.ketebalan?`<span style="background:${col.bg};color:${col.text};border:1px solid ${col.border};border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700;">${s.ketebalan}mm</span>`:''}
                                ${s.jenis?`<span style="font-size:10px;font-weight:600;color:var(--text);">${escapeHtml(s.jenis)}</span>`:''}
                                ${s.openNo?`<span style="font-size:9px;color:var(--muted);font-family:var(--font-mono);">${escapeHtml(s.openNo)}</span>`:''}
                            </div>
                            <div style="display:flex;align-items:center;gap:10px;font-size:10px;color:var(--muted);flex-wrap:wrap;">
                                ${s.operator?`<span>👤 ${escapeHtml(s.operator)}</span>`:''}
                                <span>Shift ${s.shift||'1'}</span>
                                ${s.keterangan?`<span>📝 ${escapeHtml(s.keterangan)}</span>`:''}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:14px;flex-shrink:0;">
                        <div style="text-align:right;">
                            <div style="font-size:16px;font-weight:800;font-family:var(--font-mono);color:${col.text};line-height:1.1;">${fmtDec(s.volume,3)}</div>
                            <div style="font-size:9px;color:var(--muted);">${fmt(s.pcs)} pcs</div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:3px;">
                            <button class="btn btn-edit btn-sm" title="Edit" onclick="window.editSezing('${s.id}')">✏️</button>
                            <button class="btn btn-del  btn-sm" title="Hapus" onclick="window.deleteSezing('${s.id}')">🗑️</button>
                        </div>
                    </div>
                </div>`;
        });
        html += `</div></div>`;
    });

    cont.innerHTML = html;
};

// ═══════════════════════════════════════════════════════
// STOK BOARD — FORM INPUT
// ═══════════════════════════════════════════════════════

// Helper: cek apakah PO sudah selesai (volume terpenuhi >= volumeOrder)
function isPOSelesai(order) {
    if (!order || !order.volumeOrder || order.volumeOrder <= 0) return false;
    const terpenuhi = (window.penjualanList || [])
        .filter(p => p.orderId === order.id)
        .reduce((a, p) => a + getPenjualanNetto(p), 0);
    return terpenuhi >= order.volumeOrder;
}

// Helper: ambil varian ketebalan dari order
function getOrderVariants(order) {
    if (!order) return [];
    if (order.ketebalanVariants && order.ketebalanVariants.length)
        return order.ketebalanVariants;
    if (order.ketebalanProduk)
        return [{ ketebalan: order.ketebalanProduk, volume: order.volumeOrder || 0 }];
    return [{ ketebalan: '', volume: order.volumeOrder || 0 }];
}

// Render box input stok per ketebalan secara dinamis
window.onBsOrderChange = function () {
    const orderId = document.getElementById('bs-order')?.value;
    const order   = (window.orderList || []).find(o => o.id === orderId);
    const cont    = document.getElementById('bs-ketebalan-inputs');
    if (!cont) return;

    if (!order) {
        cont.innerHTML = `
        <div class="field">
            <label>Stok Board (m³) *</label>
            <input type="number" step="any" class="bs-stok-input" data-ketebalan="" placeholder="0.000">
        </div>`;
        return;
    }

    const variants = getOrderVariants(order);

    if (variants.length <= 1) {
        // Satu ketebalan — satu box input saja
        const k = variants[0]?.ketebalan || '';
        const col = tebalColor(k);
        cont.innerHTML = `
        <div class="field">
            <label>Stok Board${k ? ` <span style="background:${col.bg};color:${col.text};border:1px solid ${col.border};border-radius:20px;padding:1px 7px;font-size:9px;font-weight:700;">${k}mm</span>` : ''} (m³) *</label>
            <input type="number" step="any" class="bs-stok-input" data-ketebalan="${escapeHtml(k)}" placeholder="0.000">
        </div>`;
    } else {
        // Multi-ketebalan — box per varian
        cont.innerHTML = variants.map(v => {
            const k   = v.ketebalan || '';
            const col = tebalColor(k);
            return `
            <div class="field">
                <label>Stok Board <span style="background:${col.bg};color:${col.text};border:1px solid ${col.border};border-radius:20px;padding:1px 7px;font-size:9px;font-weight:700;">${k}mm</span> (m³)</label>
                <input type="number" step="any" class="bs-stok-input" data-ketebalan="${escapeHtml(k)}" placeholder="0.000"
                    title="Target: ${fmtDec(v.volume || 0, 3)} m³">
                <div style="font-size:9px;color:var(--muted);margin-top:2px;">Target order: ${fmtDec(v.volume || 0, 3)} m³</div>
            </div>`;
        }).join('');
    }
};

function initBoardStockForm() {
    const cont = document.getElementById('board-stock-form-container');
    if (!cont) return;

    // Hanya tampilkan PO yang BELUM selesai
    const orders       = window.orderList || [];
    const activeOrders = orders.filter(o => !isPOSelesai(o));
    const orderOptions = activeOrders.map(o => {
        const variants = getOrderVariants(o);
        const tebalLabel = variants.length > 1
            ? variants.map(v => v.ketebalan ? v.ketebalan + 'mm' : '?').join(' + ')
            : (variants[0]?.ketebalan ? variants[0].ketebalan + 'mm' : '');
        return `<option value="${o.id}">${escapeHtml(o.kodePO||'')} — ${escapeHtml(o.perusahaan||'')}${tebalLabel ? ' ['+tebalLabel+']' : ''}</option>`;
    }).join('');

    cont.innerHTML = `
    <div class="form-title">📦 Input Stok Board</div>
    <div class="grid3">
        <div class="field"><label>Tanggal *</label><input type="date" id="bs-tanggal" value="${today()}"></div>
        <div class="field" style="grid-column:span 2;">
            <label>Order / PO <span style="font-size:9px;color:var(--muted);font-weight:400;">(PO selesai tidak ditampilkan)</span></label>
            <select id="bs-order" onchange="window.onBsOrderChange()">
                <option value="">-- Pilih PO --</option>${orderOptions}
            </select>
        </div>
        <div id="bs-ketebalan-inputs" class="field" style="grid-column:span 3;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;">
            <div class="field">
                <label>Stok Board (m³) *</label>
                <input type="number" step="any" class="bs-stok-input" data-ketebalan="" placeholder="0.000">
            </div>
        </div>
        <div class="field" style="grid-column:span 3;">
            <label>Keterangan</label>
            <input type="text" id="bs-keterangan" placeholder="Catatan opsional">
        </div>
    </div>
    <div class="form-actions" style="margin-top:12px;">
        <button class="btn btn-secondary" onclick="window.resetBoardStockForm()">🔄 Reset</button>
        <button class="btn btn-primary" onclick="window.saveBoardStock()">💾 Simpan Stok</button>
    </div>`;
}

window.saveBoardStock = function () {
    const tgl   = document.getElementById('bs-tanggal')?.value;
    const ordId = document.getElementById('bs-order')?.value;
    const ket   = document.getElementById('bs-keterangan')?.value?.trim();

    if (!tgl) { toast('⚠️ Tanggal wajib diisi!'); return; }

    // Kumpulkan semua box stok per ketebalan
    const inputs = document.querySelectorAll('.bs-stok-input');
    const entries = [];
    inputs.forEach(inp => {
        const stok = parseFloat(inp.value) || 0;
        if (stok > 0) entries.push({ ketebalan: inp.dataset.ketebalan || '', stok });
    });

    if (!entries.length) { toast('⚠️ Minimal satu nilai stok wajib diisi!'); return; }

    if (!window.boardStockList) window.boardStockList = [];

    entries.forEach(e => {
        const item = { id: uid(), tanggal: tgl, stok: e.stok, orderId: ordId || '', ketebalan: e.ketebalan, keterangan: ket || '' };
        window.boardStockList.push(item);
        logActivity?.('Simpan', 'StokBoard', `${fmtDec(e.stok, 3)} m³ · ${e.ketebalan || '—'}mm`);
    });

    persistAll();
    toast(`✅ Stok board disimpan! (${entries.length} ketebalan)`);
    window.resetBoardStockForm();
    renderBoardStockSummary();
    renderBoardStockHistory();
};

window.resetBoardStockForm = function () {
    const tgl = document.getElementById('bs-tanggal'); if (tgl) tgl.value = today();
    const ket = document.getElementById('bs-keterangan'); if (ket) ket.value = '';
    const sel = document.getElementById('bs-order'); if (sel) { sel.selectedIndex = 0; window.onBsOrderChange(); }
    document.querySelectorAll('.bs-stok-input').forEach(el => el.value = '');
};

window.deleteBoardStock = function (id) {
    if (!confirmDialog?.('Hapus data stok board ini?')) return;
    window.boardStockList = (window.boardStockList||[]).filter(s => s.id !== id);
    persistAll();
    renderBoardStockSummary();
    renderBoardStockHistory();
    toast('🗑️ Data stok dihapus');
};

// ═══════════════════════════════════════════════════════
// STOK BOARD — SUMMARY & RIWAYAT
// ═══════════════════════════════════════════════════════
function renderBoardStockSummary() {
    const cont = document.getElementById('board-stock-latest-container');
    if (!cont) return;
    const stockList = window.boardStockList || [];
    const orders    = window.orderList || [];
    const { totPress, totJual, totSezing } = getStokBoardRealtime();

    // Stok terbaru per order per ketebalan
    const stokByOrder = {};
    stockList.forEach(s => {
        if (!s.orderId) return;
        if (!stokByOrder[s.orderId]) stokByOrder[s.orderId] = {};
        const k = s.ketebalan || '';
        if (!stokByOrder[s.orderId][k] || s.tanggal > stokByOrder[s.orderId][k].tanggal)
            stokByOrder[s.orderId][k] = s;
    });

    // Tampilkan semua order (aktif: belum selesai), dengan atau tanpa stok
    const activeOrders = orders.filter(o => {
        const t = (window.penjualanList||[]).filter(p=>p.orderId===o.id).reduce((a,p)=>a+Math.max(0,(p.volume||0)-(p.retur||0)),0);
        return !(o.volumeOrder > 0 && t >= o.volumeOrder);
    });

    const rows = activeOrders.map(o => {
        const stokPerTebal = stokByOrder[o.id] || {};
        const entries = Object.values(stokPerTebal);
        const totalStok = entries.reduce((a,s) => a+(s.stok||0), 0);
        const variants  = (o.ketebalanVariants && o.ketebalanVariants.length)
            ? o.ketebalanVariants
            : o.ketebalanProduk ? [{ketebalan: o.ketebalanProduk, volume: o.volumeOrder||0}] : [];
        const hasStok = entries.length > 0;

        const tebalRows = variants.map(v => {
            const k = v.ketebalan||'';
            const s = stokPerTebal[k];
            const col = tebalColor(k);
            const stokVal = s ? s.stok : 0;
            const pct = v.volume > 0 ? Math.min(100, stokVal/v.volume*100).toFixed(0) : 0;
            return `
            <div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11px;">
                <span style="background:${col.bg};color:${col.text};border:1px solid ${col.border};border-radius:20px;padding:1px 7px;font-size:9px;font-weight:700;min-width:38px;text-align:center;">${k||'?'}mm</span>
                <div style="flex:1;height:5px;background:var(--border);border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;background:${stokVal>0?col.border:'transparent'};border-radius:3px;"></div>
                </div>
                <span style="font-family:var(--font-mono);color:${stokVal>0?col.text:'var(--muted)'};font-weight:700;min-width:55px;text-align:right;">${stokVal>0?fmtDec(stokVal,2):'—'} m³</span>
                ${s?`<button class="btn btn-del btn-sm" style="padding:2px 6px;font-size:9px;" onclick="window.deleteBoardStock('${s.id}')">🗑</button>`:'<span style="width:32px;"></span>'}
            </div>`;
        }).join('');

        return `
        <div style="padding:10px 13px;border-bottom:1px solid var(--border);">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                <div style="flex:1;min-width:160px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                        <span style="font-size:12px;font-weight:700;font-family:var(--font-mono);color:var(--gold);">${escapeHtml(o.kodePO||'—')}</span>
                        <span style="font-size:10px;color:var(--muted);">${escapeHtml(o.perusahaan||'')}</span>
                        ${!hasStok?'<span style="font-size:9px;background:rgba(156,163,175,.12);color:var(--muted);border:1px solid var(--border);border-radius:20px;padding:1px 7px;">Belum ada stok</span>':''}
                    </div>
                    <div style="font-size:10px;color:var(--muted);">Total order: ${fmtDec(o.volumeOrder||0,2)} m³</div>
                </div>
                <div style="font-family:var(--font-mono);font-size:15px;font-weight:800;color:${hasStok?'var(--blue)':'var(--muted)'};">
                    ${hasStok?fmtDec(totalStok,2)+'<span style="font-size:9px;color:var(--muted);margin-left:2px;">m³</span>':'—'}
                </div>
            </div>
            ${variants.length ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);">${tebalRows}</div>` : ''}
        </div>`;
    }).join('');

    cont.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden;">
        <div style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <span style="font-size:13px;font-weight:700;color:var(--text);">📦 Stok Board per PO</span>
            <div style="display:flex;align-items:center;gap:14px;font-size:11px;font-family:var(--font-mono);">
                <span style="color:var(--muted);">Press: <b style="color:var(--text);">${fmt(totPress)}</b> lbr</span>
                <span style="color:var(--muted);">Sezing: <b style="color:var(--gold);">${fmtDec(totSezing,2)}</b> m³</span>
                <span style="color:var(--muted);">Jual: <b style="color:var(--green);">${fmtDec(totJual,2)}</b> m³</span>
            </div>
        </div>
        ${rows || `<div style="padding:24px;text-align:center;color:var(--muted);font-size:12px;">Belum ada stok board tercatat per PO</div>`}
    </div>`;
}

function renderBoardStockHistory() {
    const cont = document.getElementById('board-stock-history');
    if (!cont) return;
    const list = [...(window.boardStockList||[])].sort((a,b)=>(b.tanggal||'').localeCompare(a.tanggal||''));
    if (!list.length) {
        cont.innerHTML = `<div style="text-align:center;padding:32px;color:var(--muted);font-size:12px;">📭 Belum ada riwayat stok board</div>`;
        return;
    }
    const rows = list.map(s => {
        const order = (window.orderList||[]).find(o => o.id === s.orderId);
        const col   = tebalColor(s.ketebalan);
        return `<tr>
            <td>${fmtDate(s.tanggal)}</td>
            <td style="font-family:var(--font-mono);color:var(--gold);">${escapeHtml(order?.kodePO||'—')}</td>
            <td>${escapeHtml(order?.perusahaan||'—')}</td>
            <td>${s.ketebalan?`<span style="color:${col.text};font-weight:700;">${s.ketebalan}mm</span>`:'—'}</td>
            <td style="font-family:var(--font-mono);font-weight:700;color:var(--blue);">${fmtDec(s.stok,3)}</td>
            <td style="color:var(--muted);font-size:11px;">${escapeHtml(s.keterangan||'')}</td>
            <td><button class="btn btn-del btn-sm" onclick="window.deleteBoardStock('${s.id}')">🗑️</button></td>
        </tr>`;
    }).join('');
    cont.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-top:14px;">
        <div style="padding:12px 14px;border-bottom:1px solid var(--border);">
            <span style="font-size:13px;font-weight:700;color:var(--text);">📋 Riwayat Input Stok Board</span>
        </div>
        <div class="table-wrap">
            <table><thead><tr><th>Tanggal</th><th>Kode PO</th><th>Pembeli</th><th>Tebal</th><th>Stok (m³)</th><th>Keterangan</th><th>Aksi</th></tr></thead>
            <tbody>${rows}</tbody></table>
        </div>
    </div>`;
}

function refreshBoardStockOrders() {
    const sel = document.getElementById('bs-order');
    if (!sel) return;
    const orders       = window.orderList || [];
    const activeOrders = orders.filter(o => !isPOSelesai(o));
    const currentVal   = sel.value;
    sel.innerHTML = '<option value="">-- Pilih PO --</option>' +
        activeOrders.map(o => {
            const variants   = getOrderVariants(o);
            const tebalLabel = variants.length > 1
                ? variants.map(v => v.ketebalan ? v.ketebalan + 'mm' : '?').join(' + ')
                : (variants[0]?.ketebalan ? variants[0].ketebalan + 'mm' : '');
            return `<option value="${o.id}"${o.id===currentVal?' selected':''}>${escapeHtml(o.kodePO||'')} — ${escapeHtml(o.perusahaan||'')}${tebalLabel ? ' ['+tebalLabel+']' : ''}</option>`;
        }).join('');
    if (currentVal && activeOrders.some(o => o.id === currentVal)) {
        window.onBsOrderChange?.();
    }
}

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
    renderPenjualanAnalitik();
};

// ═══════════════════════════════════════════════════════
// PENJUALAN — KPI BAR (Compact, 6 cards)
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
    const hargaPerM3  = totNettoBln > 0 ? totHargaBln / totNettoBln : 0;
    const hariBln     = new Set(listBln.map(p=>p.tanggal)).size;

    // Order status
    const orders      = window.orderList || [];
    const orderAktif  = orders.filter(o => {
        const t = window.getOrderTerpenuhi(o.id);
        return !(o.volumeOrder > 0 && t >= o.volumeOrder);
    });

    // Prev bulan untuk trend
    const [y,m]    = bulan.split('-').map(Number);
    const prevDate = m===1 ? `${y-1}-12` : `${y}-${String(m-1).padStart(2,'0')}`;
    const listPrev = listAll.filter(p=>p.tanggal?.startsWith(prevDate));
    const nettoPrev= listPrev.reduce((a,p)=>a+getPenjualanNetto(p), 0);
    const trendPct = nettoPrev > 0 ? ((totNettoBln - nettoPrev) / nettoPrev * 100) : null;
    const trendHtml= trendPct !== null
        ? `<span style="font-size:9px;font-weight:700;color:${trendPct>=0?'var(--green)':'var(--red)'};">${trendPct>=0?'▲':'▼'} ${Math.abs(trendPct).toFixed(0)}% vs bln lalu</span>`
        : '';

    // Top tujuan distribusi bar
    const perTujuan = {};
    listBln.forEach(p => {
        const t = p.tujuan || 'Lainnya';
        if (!perTujuan[t]) perTujuan[t] = 0;
        perTujuan[t] += getPenjualanNetto(p);
    });
    const tujEntries = Object.entries(perTujuan).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const maxTuj     = Math.max(...tujEntries.map(([,v])=>v), 0.001);
    const tujColors  = ['var(--gold)','var(--blue)','var(--green)','var(--orange)','var(--red)'];
    const tujBars    = tujEntries.map(([k,v],i) => {
        const col = tujColors[i];
        const w   = (v/maxTuj*100).toFixed(1);
        const pct = totNettoBln > 0 ? (v/totNettoBln*100).toFixed(0)+'%' : '—';
        return `<div style="display:flex;align-items:center;gap:8px;">
            <span style="width:90px;font-size:10px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(k)}">${escapeHtml(k)}</span>
            <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${w}%;background:${col};border-radius:3px;transition:width .5s;"></div>
            </div>
            <span style="width:70px;text-align:right;font-family:var(--font-mono);font-size:10px;color:${col};">${fmtDec(v,2)} m³</span>
            <span style="width:30px;text-align:right;font-size:9px;color:var(--muted);">${pct}</span>
        </div>`;
    }).join('');

    cont.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin-bottom:14px;">
        ${_kpi('💰 Netto Bulan Ini', fmtDec(totNettoBln,2)+' m³', 'var(--green)',
            `Rp ${fmtRpRekap(totHargaBln)} &nbsp; ${trendHtml}`)}
        ${_kpi('📦 Volume Bruto', fmtDec(totVolBln,2)+' m³', 'var(--gold)',
            hariBln+' hari aktif')}
        ${_kpi('↩️ Total Retur', totReturBln>0 ? fmtDec(totReturBln,2)+' m³' : '—',
            totReturBln>0 ? 'var(--red)' : 'var(--muted)',
            totVolBln>0 ? (totReturBln/totVolBln*100).toFixed(1)+'% dari bruto' : 'Bulan ini')}
        ${_kpi('💵 Harga / m³', hargaPerM3>0 ? 'Rp '+fmtRpRekap(hargaPerM3) : '—', 'var(--gold-light)', 'Rata-rata netto')}
        ${_kpi('📊 Kumulatif', fmtDec(totVolAll,2)+' m³', 'var(--blue)',
            'Rp '+fmtRpRekap(totHargaAll)+' all-time')}
        ${_kpi('📑 PO Aktif', orderAktif.length+' PO',
            orderAktif.length>0 ? 'var(--orange)' : 'var(--green)',
            orderAktif.length>0 ? 'Belum selesai' : '✅ Semua lunas')}
    </div>
    ${tujBars ? `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px;">
        <div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">🗺️ Distribusi per Tujuan — ${_fmtBulan(bulan)}</div>
        <div style="display:flex;flex-direction:column;gap:6px;">${tujBars}</div>
    </div>` : ''}`;
}

// ═══════════════════════════════════════════════════════
// PENJUALAN — DAFTAR (grouped by date, card per hari)
// ═══════════════════════════════════════════════════════
window.renderPenjualanList = function () {
    const cont = document.getElementById('penjualan-list-content');
    if (!cont) return;

    const bulan = localStorage.getItem('jual_filter_month') || (() => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; })();
    const srch = (document.getElementById('jual-filter-search')?.value||'').toLowerCase();

    let list = sortByDateAsc(window.penjualanList || []);
    if (bulan !== 'all') list = list.filter(p => p.tanggal?.startsWith(bulan));
    if (srch) list = list.filter(p =>
        (p.tujuan||'').toLowerCase().includes(srch) ||
        (p.truk||'').toLowerCase().includes(srch) ||
        ((window.orderList||[]).find(o=>o.id===p.orderId)?.kodePO||'').toLowerCase().includes(srch) ||
        ((window.orderList||[]).find(o=>o.id===p.orderId)?.perusahaan||'').toLowerCase().includes(srch)
    );

    if (!list.length) {
        cont.innerHTML = `
        <div style="text-align:center;padding:48px 20px;color:var(--muted);">
            <div style="font-size:36px;margin-bottom:10px;opacity:.35;">📭</div>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;">Belum ada data penjualan</div>
            <div style="font-size:11px;">Ubah filter atau <a href="#" onclick="document.querySelector('#tab-penjualan .subtab-btn[data-subtab=penjualan-input]').click();return false;" style="color:var(--gold);">catat penjualan baru</a></div>
        </div>`;
        return;
    }

    // Group by date, sort desc
    const byDate = {};
    list.forEach(p => { if (!byDate[p.tanggal]) byDate[p.tanggal] = []; byDate[p.tanggal].push(p); });
    const dates  = Object.keys(byDate).sort((a,b)=>b.localeCompare(a));

    const grandNetto = list.reduce((a,p)=>a+getPenjualanNetto(p), 0);
    const grandHarga = list.reduce((a,p)=>a+(p.harga||0), 0);
    const grandRetur = list.reduce((a,p)=>a+(p.retur||0), 0);
    const grandPcs   = list.reduce((a,p)=>a+(p.pcs||0), 0);
    const avgHpm3    = grandNetto > 0 ? grandHarga/grandNetto : 0;

    // ── KPI bar ──
    let html = `
    <div class="kpi-row" style="margin-bottom:14px;">
        <div class="kpi-card" style="--kpi-accent:#a0aec0;">
            <div class="kpi-label">Transaksi</div>
            <div class="kpi-value">${list.length}<span class="kpi-unit">kirim</span></div>
            <div class="kpi-sub">${dates.length} hari aktif</div>
        </div>
        <div class="kpi-card" style="--kpi-accent:var(--green);">
            <div class="kpi-label">Volume Netto</div>
            <div class="kpi-value">${fmtDec(grandNetto,2)}<span class="kpi-unit">m³</span></div>
            ${grandRetur>0?`<div class="kpi-sub">↩ retur ${fmtDec(grandRetur,2)} m³</div>`:''}
        </div>
        <div class="kpi-card" style="--kpi-accent:var(--gold);">
            <div class="kpi-label">Total Nilai</div>
            <div class="kpi-value" style="font-size:15px;">Rp ${fmtRpRekap(grandHarga)}</div>
            <div class="kpi-sub">${fmtRpRekap(avgHpm3)}/m³</div>
        </div>
        <div class="kpi-card" style="--kpi-accent:var(--blue);">
            <div class="kpi-label">Total Pcs</div>
            <div class="kpi-value">${fmt(grandPcs)}<span class="kpi-unit">pcs</span></div>
        </div>
    </div>`;

    dates.forEach(tgl => {
        const items    = byDate[tgl];
        const dayNetto = items.reduce((s,p)=>s+getPenjualanNetto(p), 0);
        const dayHarga = items.reduce((s,p)=>s+(p.harga||0), 0);
        const dayRetur = items.reduce((s,p)=>s+(p.retur||0), 0);
        const dayPcs   = items.reduce((s,p)=>s+(p.pcs||0), 0);
        const dayHpm3  = dayNetto > 0 ? dayHarga/dayNetto : 0;

        const poSet = [...new Map(items.map(p => {
            const o = (window.orderList||[]).find(ord=>ord.id===p.orderId);
            return [p.orderId, o?.kodePO || '—'];
        }))].map(([,kode]) => `<span class="compact-tag" style="background:rgba(212,160,23,.12);color:var(--gold);border:1px solid rgba(212,160,23,.25);">${escapeHtml(kode)}</span>`).join('');

        html += `
        <div class="compact-list">
            <div class="compact-day-header">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span class="compact-day-title">📅 ${fmtDate(tgl)}</span>
                    <span style="font-size:10px;color:var(--muted);">${items.length} pengiriman</span>
                    <div style="display:flex;gap:4px;flex-wrap:wrap;">${poSet}</div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="text-align:right;">
                        <div style="font-size:15px;font-weight:800;font-family:var(--font-mono);color:var(--green);">${fmtDec(dayNetto,3)}<span style="font-size:9px;color:var(--muted);margin-left:3px;">m³</span></div>
                        <div style="font-size:9px;color:var(--muted);font-family:var(--font-mono);">Rp ${fmtRpRekap(dayHarga)}${dayRetur>0?` · ↩${fmtDec(dayRetur,2)}`:''}</div>
                    </div>
                    <button style="background:rgba(96,165,250,.12);color:var(--blue);border:1px solid rgba(96,165,250,.3);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;" onclick="window.exportPenjualanCSV()">📥 CSV</button>
                </div>
            </div>`;

        items.forEach((p, i) => {
            const order   = (window.orderList||[]).find(o=>o.id===p.orderId);
            const netto   = getPenjualanNetto(p);
            const hpm3    = netto > 0 ? p.harga/netto : 0;
            const returPct= p.volume>0 ? (p.retur/p.volume*100).toFixed(1) : '0';

            const variants = order ? (
                (order.ketebalanVariants?.length) ? order.ketebalanVariants :
                order.ketebalanProduk ? [{ketebalan:order.ketebalanProduk}] : []
            ) : [];
            const tebalHtml = variants.map(v=>{
                const col=TEBAL_HEX[v.ketebalan]||'var(--gold)';
                return `<span class="compact-tag" style="background:rgba(0,0,0,.2);color:${col};border:1px solid ${col}44;">${v.ketebalan}mm</span>`;
            }).join('');

            html += `
            <div class="compact-row">
                <div class="compact-row-left">
                    <div class="compact-accent" style="background:var(--green);"></div>
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                            <span class="compact-main">${order?escapeHtml(order.kodePO):'—'}</span>
                            ${order?.perusahaan?`<span style="font-size:10px;color:var(--muted);">${escapeHtml(order.perusahaan)}</span>`:''}
                            ${tebalHtml}
                        </div>
                        <div style="display:flex;gap:8px;margin-top:3px;font-size:10px;color:var(--muted);flex-wrap:wrap;">
                            <span>🚛 <b style="color:var(--text);font-family:var(--font-mono);">${escapeHtml(p.truk)}</b></span>
                            <span>📍 ${escapeHtml(p.tujuan)}</span>
                            <span>${fmt(p.pcs)} pcs</span>
                            ${p.retur>0?`<span style="color:var(--red);">↩ ${fmtDec(p.retur,3)} m³ (${returPct}%)</span>`:''}
                        </div>
                    </div>
                </div>
                <div class="compact-row-right">
                    <div class="compact-metric">
                        <div class="compact-metric-val" style="color:var(--green);">${fmtDec(netto,3)}</div>
                        <div class="compact-metric-unit">m³ netto</div>
                    </div>
                    <div class="compact-metric">
                        <div class="compact-metric-val" style="color:var(--gold);font-size:12px;">Rp ${fmtRpRekap(p.harga)}</div>
                        <div class="compact-metric-unit">${fmtRpRekap(hpm3)}/m³</div>
                    </div>
                    <div class="compact-actions">
                        <button class="btn btn-edit btn-sm" onclick="window.editPenjualan('${p.id}')">✏️</button>
                        <button class="btn btn-del btn-sm" onclick="window.deletePenjualan('${p.id}')">🗑️</button>
                    </div>
                </div>
            </div>`;
        });

        html += `</div>`;
    });

    cont.innerHTML = html;
};

// ═══════════════════════════════════════════════════════
// PENJUALAN — ANALITIK (subtab terpisah)
// ═══════════════════════════════════════════════════════
window.renderPenjualanAnalitik = function () {
    const cont = document.getElementById('penjualan-analitik-content');
    if (!cont) return;

    const bulan    = thisMonth();
    const listAll  = window.penjualanList || [];
    const listBln  = listAll.filter(p => p.tanggal?.startsWith(bulan));

    if (!listAll.length) {
        cont.innerHTML = `<div style="text-align:center;padding:48px 20px;color:var(--muted);"><div style="font-size:36px;opacity:.35;margin-bottom:10px;">📊</div><div style="font-size:13px;font-weight:600;color:var(--text);">Belum ada data untuk dianalisis</div></div>`;
        return;
    }

    // Trend 6 bulan
    const months6 = [];
    for (let i=5; i>=0; i--) {
        const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-i);
        const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const items = listAll.filter(p=>p.tanggal?.startsWith(ym));
        months6.push({
            ym, label: _fmtBulan(ym),
            netto: items.reduce((a,p)=>a+getPenjualanNetto(p),0),
            harga: items.reduce((a,p)=>a+(p.harga||0),0),
            count: items.length
        });
    }

    // Per tujuan all-time
    const perTujuanAll = {};
    listAll.forEach(p => {
        const t = p.tujuan || 'Lainnya';
        if (!perTujuanAll[t]) perTujuanAll[t] = { vol:0, harga:0, count:0 };
        perTujuanAll[t].vol   += getPenjualanNetto(p);
        perTujuanAll[t].harga += p.harga||0;
        perTujuanAll[t].count++;
    });
    const tujAll    = Object.entries(perTujuanAll).sort((a,b)=>b[1].vol-a[1].vol);
    const maxTujVol = Math.max(...tujAll.map(([,v])=>v.vol), 0.001);
    const tujColors = ['var(--gold)','var(--blue)','var(--green)','var(--orange)','var(--red)','var(--gold-light)'];

    const tujRows = tujAll.map(([k,v],i) => {
        const col  = tujColors[i%tujColors.length];
        const w    = (v.vol/maxTujVol*100).toFixed(1);
        const hpm3 = v.vol>0 ? v.harga/v.vol : 0;
        return `
        <div style="padding:10px 12px;${i<tujAll.length-1?'border-bottom:1px solid var(--border);':''}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">
                <div style="display:flex;align-items:center;gap:7px;">
                    <span style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0;"></span>
                    <span style="font-size:12px;font-weight:600;color:var(--text);">${escapeHtml(k)}</span>
                    <span style="font-size:10px;color:var(--muted);">${v.count}x</span>
                </div>
                <div style="text-align:right;">
                    <span style="font-size:13px;font-weight:700;font-family:var(--font-mono);color:${col};">${fmtDec(v.vol,2)} m³</span>
                    <div style="font-size:9px;color:var(--muted);font-family:var(--font-mono);">Rp ${fmtRpRekap(v.harga)} · ${fmtRpRekap(hpm3)}/m³</div>
                </div>
            </div>
            <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;">
                <div style="height:100%;width:${w}%;background:${col};border-radius:2px;transition:width .5s;"></div>
            </div>
        </div>`;
    }).join('');

    // Per PO progress
    const orderRows = (window.orderList||[]).map(o => {
        const terpenuhi = window.getOrderTerpenuhi(o.id);
        const volOrd    = o.volumeOrder || 0;
        const pct       = volOrd > 0 ? Math.min(100, terpenuhi/volOrd*100) : 0;
        const sisa      = Math.max(0, volOrd - terpenuhi);
        const lunas     = terpenuhi >= volOrd;
        const col       = lunas ? 'var(--green)' : pct>=60 ? 'var(--orange)' : 'var(--red)';
        const trxCount  = (window.penjualanList||[]).filter(p=>p.orderId===o.id).length;
        return `
        <div style="display:flex;align-items:center;gap:12px;padding:9px 12px;border-bottom:1px solid var(--border);">
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px;">
                    <span style="font-size:12px;font-weight:700;font-family:var(--font-mono);color:var(--gold);">${escapeHtml(o.kodePO)}</span>
                    <span style="font-size:10px;color:var(--muted);">${escapeHtml(o.perusahaan||'')}</span>
                    ${lunas?`<span style="background:rgba(74,222,128,.12);color:var(--green);border:1px solid rgba(74,222,128,.3);border-radius:20px;padding:1px 7px;font-size:9px;font-weight:700;">✅ Lunas</span>`:''}
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
                    <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                        <div style="height:100%;width:${pct.toFixed(1)}%;background:${col};border-radius:3px;transition:width .5s;"></div>
                    </div>
                    <span style="font-size:10px;font-family:var(--font-mono);font-weight:700;color:${col};white-space:nowrap;">${pct.toFixed(0)}%</span>
                </div>
                <div style="font-size:9px;color:var(--muted);font-family:var(--font-mono);">${fmtDec(terpenuhi,2)} / ${fmtDec(volOrd,2)} m³ · Sisa ${fmtDec(sisa,2)} m³ · ${trxCount} trx</div>
            </div>
        </div>`;
    }).join('');

    // Harian bulan ini
    const [y,mo]  = bulan.split('-').map(Number);
    const hariDlm = new Date(y,mo,0).getDate();
    const labels  = Array.from({length:hariDlm},(_,i)=>String(i+1).padStart(2,'0'));
    const volHari = labels.map(d => {
        const tgl = `${bulan}-${d}`;
        return listBln.filter(p=>p.tanggal===tgl).reduce((a,p)=>a+getPenjualanNetto(p),0) || null;
    });
    const hargaHari = labels.map(d => {
        const tgl = `${bulan}-${d}`;
        return listBln.filter(p=>p.tanggal===tgl).reduce((a,p)=>a+(p.harga||0),0) || null;
    });

    cont.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border);">
        <span style="width:3px;height:16px;background:var(--blue);border-radius:2px;display:inline-block;"></span>
        <span style="font-size:14px;font-weight:700;color:var(--text);">📊 Analitik Penjualan</span>
        <span style="font-size:10px;background:rgba(74,158,232,.13);color:var(--blue);border:1px solid rgba(74,158,232,.28);border-radius:20px;padding:2px 8px;font-weight:600;">${listAll.length} total transaksi</span>
    </div>

    <!-- Row 1: Chart harian + Trend 6 bulan -->
    <div style="display:grid;grid-template-columns:3fr 2fr;gap:12px;margin-bottom:14px;">
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;padding:14px;">
            <div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:12px;">📅 Volume & Nilai Harian — ${_fmtBulan(bulan)}</div>
            <canvas id="chart-jual-harian" height="150"></canvas>
        </div>
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;padding:14px;">
            <div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:12px;">📈 Trend 6 Bulan Terakhir</div>
            <canvas id="chart-jual-trend" height="150"></canvas>
        </div>
    </div>

    <!-- Row 2: Distribusi tujuan + Progress PO -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;overflow:hidden;">
            <div style="padding:12px 14px;border-bottom:1px solid var(--border);font-size:11px;font-weight:700;color:var(--text);">🗺️ Per Tujuan — All-time</div>
            <div style="max-height:300px;overflow-y:auto;">${tujRows||'<div style="padding:20px;text-align:center;color:var(--muted);font-size:12px;">Belum ada data</div>'}</div>
        </div>
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;overflow:hidden;">
            <div style="padding:12px 14px;border-bottom:1px solid var(--border);font-size:11px;font-weight:700;color:var(--text);">📑 Progress per PO</div>
            <div style="max-height:300px;overflow-y:auto;">${orderRows||'<div style="padding:20px;text-align:center;color:var(--muted);font-size:12px;">Belum ada order</div>'}</div>
        </div>
    </div>`;

    // Render charts setelah DOM siap
    setTimeout(() => {
        // Chart harian
        const ctx1 = document.getElementById('chart-jual-harian');
        if (ctx1 && window.Chart) {
            if (ctx1._ci) ctx1._ci.destroy();
            ctx1._ci = new Chart(ctx1, {
                data: { labels, datasets: [
                    { type:'bar',  label:'Vol. Netto (m³)', data:volHari,   backgroundColor:'rgba(62,200,122,.4)', borderColor:'var(--green)', borderWidth:1, borderRadius:4, yAxisID:'y', spanGaps:true },
                    { type:'line', label:'Nilai (Rp)',      data:hargaHari, borderColor:'var(--gold)', backgroundColor:'rgba(200,160,80,.06)', borderWidth:2, pointRadius:2, fill:true, tension:.35, yAxisID:'y1', spanGaps:true }
                ]},
                options:{
                    responsive:true, interaction:{mode:'index',intersect:false},
                    plugins:{legend:{labels:{color:'#8a8578',font:{size:9},boxWidth:10,padding:12}}},
                    scales:{
                        x:{ticks:{color:'#555',font:{size:8}},grid:{color:'rgba(255,255,255,.025)'}},
                        y:{position:'left', ticks:{color:'#3ec87a',font:{size:8}},grid:{color:'rgba(255,255,255,.03)'},title:{display:true,text:'m³',color:'#666',font:{size:8}}},
                        y1:{position:'right',ticks:{color:'#c8a050',font:{size:8}},grid:{drawOnChartArea:false},title:{display:true,text:'Rp',color:'#666',font:{size:8}}}
                    }
                }
            });
        }

        // Chart trend 6 bulan
        const ctx2 = document.getElementById('chart-jual-trend');
        if (ctx2 && window.Chart) {
            if (ctx2._ci) ctx2._ci.destroy();
            ctx2._ci = new Chart(ctx2, {
                type:'bar',
                data:{
                    labels: months6.map(x=>x.label),
                    datasets:[
                        { label:'Vol. Netto (m³)', data:months6.map(x=>x.netto), backgroundColor: months6.map((_,i)=>i===5?'rgba(62,200,122,.7)':'rgba(62,200,122,.25)'), borderColor:'var(--green)', borderWidth:1, borderRadius:4, yAxisID:'y' },
                        { type:'line', label:'Nilai (Rp)', data:months6.map(x=>x.harga), borderColor:'var(--gold)', backgroundColor:'rgba(200,160,80,.05)', borderWidth:2, pointRadius:3, fill:false, tension:.3, yAxisID:'y1' }
                    ]
                },
                options:{
                    responsive:true, interaction:{mode:'index',intersect:false},
                    plugins:{legend:{labels:{color:'#8a8578',font:{size:9},boxWidth:10,padding:12}}},
                    scales:{
                        x:{ticks:{color:'#8a8578',font:{size:9}},grid:{color:'rgba(255,255,255,.025)'}},
                        y:{position:'left', ticks:{color:'#3ec87a',font:{size:8}},grid:{color:'rgba(255,255,255,.03)'},title:{display:true,text:'m³',color:'#666',font:{size:8}}},
                        y1:{position:'right',ticks:{color:'#c8a050',font:{size:8}},grid:{drawOnChartArea:false},title:{display:true,text:'Rp',color:'#666',font:{size:8}}}
                    }
                }
            });
        }
    }, 120);
};

// ═══════════════════════════════════════════════════════
// PENJUALAN — FORM: Live Preview
// ═══════════════════════════════════════════════════════
window.updateJualPreview = function () {
    const vol   = parseFloat(document.getElementById('jual-volume')?.value) || 0;
    const retur = parseFloat(document.getElementById('jual-retur')?.value)  || 0;
    const harga = parseFloat(document.getElementById('jual-harga')?.value)  || 0;
    const netto = Math.max(0, vol - retur);
    const hpm3  = netto > 0 ? harga / netto : 0;

    // Netto
    const elNetto = document.getElementById('prev-netto');
    if (elNetto) elNetto.textContent = netto.toFixed(3);

    // Harga/m³
    const elHpm3 = document.getElementById('prev-hpm3');
    if (elHpm3) elHpm3.textContent = hpm3 > 0 ? 'Rp ' + fmtRpRekap(hpm3) + '/m³' : '—';

    // Juga update field lama (kompatibilitas)
    const elOld = document.getElementById('jual-harga-per-m3');
    if (elOld) elOld.textContent = hpm3 > 0 ? 'Rp ' + fmtRpRekap(hpm3) + '/m³' : '—';

    // Retur row
    const returRow = document.getElementById('prev-retur-row');
    if (returRow) {
        if (retur > 0) {
            returRow.style.display = 'block';
            document.getElementById('prev-retur').textContent  = fmtDec(retur,3) + ' m³';
            document.getElementById('prev-retur-pct').textContent = vol > 0 ? (retur/vol*100).toFixed(1)+'% dari bruto' : '';
        } else {
            returRow.style.display = 'none';
        }
    }

    // Tebal: sekarang input manual, tidak perlu auto-fill dari PO

    // Sisa PO preview
    const sisaRow = document.getElementById('prev-sisa-row');
    if (sisaRow && orderId) {
        const order = (window.orderList||[]).find(o=>o.id===orderId);
        if (order && order.volumeOrder > 0) {
            sisaRow.style.display = 'block';
            let terpenuhi = window.getOrderTerpenuhi(orderId);
            if (penjualanEditId) {
                const old = (window.penjualanList||[]).find(p=>p.id===penjualanEditId);
                if (old) terpenuhi -= getPenjualanNetto(old);
            }
            const sisaSekarang  = Math.max(0, order.volumeOrder - terpenuhi);
            const sisaSetelahIni= Math.max(0, sisaSekarang - netto);
            const pctTerpenuhi  = Math.min(100, (terpenuhi + netto) / order.volumeOrder * 100);
            const sisaColor     = sisaSetelahIni <= 0 ? 'var(--green)' : netto > sisaSekarang ? 'var(--red)' : 'var(--orange)';

            document.getElementById('prev-sisa-val').textContent  = fmtDec(sisaSetelahIni,2) + ' m³ tersisa';
            document.getElementById('prev-sisa-val').style.color  = sisaColor;
            document.getElementById('prev-sisa-bar').style.width  = pctTerpenuhi.toFixed(1)+'%';
            document.getElementById('prev-sisa-bar').style.background = pctTerpenuhi>=100?'var(--green)':pctTerpenuhi>=60?'var(--orange)':'var(--red)';
            document.getElementById('prev-sisa-pct').textContent  = pctTerpenuhi.toFixed(0)+'% order terpenuhi';
        } else {
            sisaRow.style.display = 'none';
        }
    } else if (sisaRow) {
        sisaRow.style.display = 'none';
    }

    // Sisa PO (field lama, kompatibilitas)
    const sisaElOld = document.getElementById('jual-sisa-po');
    if (sisaElOld && orderId) {
        const order = (window.orderList||[]).find(o=>o.id===orderId);
        if (order) {
            let terpenuhi = window.getOrderTerpenuhi(orderId);
            if (penjualanEditId) { const old=(window.penjualanList||[]).find(p=>p.id===penjualanEditId); if(old) terpenuhi-=getPenjualanNetto(old); }
            const sisa = Math.max(0,(order.volumeOrder||0)-terpenuhi);
            sisaElOld.textContent = `Sisa PO: ${fmtDec(sisa,2)} m³`;
            sisaElOld.style.color = netto>sisa ? 'var(--red)' : 'var(--green)';
        }
    }
};

// ═══════════════════════════════════════════════════════
// PENJUALAN — FORM: populate / reset / fill
// ═══════════════════════════════════════════════════════
window.populateOrderDropdown = function (selectedId) {
    const sel = document.getElementById('jual-order');
    if (!sel) return;
    const activeOrders = (window.orderList||[]).filter(o => {
        const terkirim = (window.penjualanList||[]).filter(p=>p.orderId===o.id).reduce((s,p)=>s+Math.max(0,(parseFloat(p.volume)||0)-(parseFloat(p.retur)||0)),0);
        return !(o.volumeOrder>0 && terkirim>=o.volumeOrder) || o.id===selectedId;
    });
    sel.innerHTML = '<option value="">-- Pilih PO --</option>' +
        activeOrders.map(o => `<option value="${o.id}"${o.id===selectedId?' selected':''}>${escapeHtml(o.kodePO)} — ${escapeHtml(o.perusahaan)}</option>`).join('');
};

window.resetJualForm = function () {
    ['jual-pcs','jual-volume','jual-truk','jual-tujuan','jual-harga'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    const tgl = document.getElementById('jual-tanggal'); if (tgl) tgl.value = today();
    const ret = document.getElementById('jual-retur');   if (ret) ret.value = '0';
    const ti  = document.getElementById('jual-tebal-info'); if (ti) { ti.value=''; }
    // Reset preview
    const pn = document.getElementById('prev-netto'); if (pn) pn.textContent='0.000';
    const ph = document.getElementById('prev-hpm3');  if (ph) ph.textContent='—';
    const pr = document.getElementById('prev-retur-row'); if (pr) pr.style.display='none';
    const ps = document.getElementById('prev-sisa-row');  if (ps) ps.style.display='none';
    penjualanEditId = null;
    populateOrderDropdown(null);
};

window.fillJualForm = function (item) {
    const set = (id,val) => { const el=document.getElementById(id); if(el) el.value=val||''; };
    set('jual-tanggal', item.tanggal);
    set('jual-pcs',     item.pcs);
    set('jual-volume',  item.volume);
    set('jual-truk',    item.truk);
    set('jual-tujuan',  item.tujuan);
    set('jual-harga',   item.harga);
    set('jual-retur',   item.retur || 0);
    set('jual-tebal-info', item.ketebalan || '');
    penjualanEditId = item.id;
    populateOrderDropdown(item.orderId||null);
    updateJualPreview();
};

// ═══════════════════════════════════════════════════════
// PENJUALAN — SAVE / DELETE / EDIT
// ═══════════════════════════════════════════════════════
window.savePenjualan = function () {
    const tgl    = document.getElementById('jual-tanggal')?.value;
    const pcs    = document.getElementById('jual-pcs')?.value;
    const vol    = parseFloat(document.getElementById('jual-volume')?.value) || 0;
    const truk   = document.getElementById('jual-truk')?.value?.trim();
    const tujuan = document.getElementById('jual-tujuan')?.value?.trim();
    const harga  = parseFloat(document.getElementById('jual-harga')?.value) || 0;
    const orderId= document.getElementById('jual-order')?.value;
    const retur  = parseFloat(document.getElementById('jual-retur')?.value) || 0;
    const ketebalan = document.getElementById('jual-tebal-info')?.value?.trim() || '';

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
        if (netto>sisa && !confirmDialog(`⚠️ Volume netto (${fmtDec(netto,2)} m³) melebihi sisa order (${fmtDec(sisa,2)} m³). Tetap simpan?`)) return;
    }

    const item = { id:penjualanEditId||uid(), tanggal:tgl, pcs:parseInt(pcs)||0, volume:vol, truk, tujuan, harga, orderId, retur, ketebalan };
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
    // Switch ke Daftar setelah simpan
    document.querySelector('#tab-penjualan .subtab-btn[data-subtab="penjualan-list"]')?.click();
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
    setTimeout(() => {
        document.querySelector('#tab-penjualan .subtab-btn[data-subtab="penjualan-input"]')?.click();
        window.scrollTo({top:0,behavior:'smooth'});
    }, 50);
};

// ═══════════════════════════════════════════════════════
// EXPORT CSV
// ═══════════════════════════════════════════════════════
window.exportSezingCSV = function () {
    if (!(window.sezingList||[]).length) { toast('⚠️ Tidak ada data'); return; }
    const headers = ['Tanggal','Open No.','Ketebalan(mm)','Jenis','Volume(m³)','Lembar(pcs)','Shift','Operator','Keterangan'];
    const rows    = sortByDateAsc(window.sezingList).map(s => [s.tanggal,s.openNo||'',s.ketebalan||'',s.jenis||'',fmtDec(s.volume||0,3),s.pcs||0,s.shift||'1',s.operator||'',escapeHtml(s.keterangan||'')].join(','));
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
// ─── SHARED HELPER: generate opsi bulan ───────────────────────────────
function _genMonthOpts() {
    const opts = [];
    const now  = new Date();
    const cur  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    opts.push(`<option value="${cur}">Bulan ini (${cur})</option>`);
    for (let i = 1; i <= 11; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        opts.push(`<option value="${m}">${m}</option>`);
    }
    opts.push('<option value="all">Semua Bulan</option>');
    return opts.join('');
}

function _injectFilterBar(listId, barId, searchId, fromId, toId, renderFn, placeholder) {
    // Legacy wrapper — tidak dipakai lagi; diganti injectSezingFilterBar / injectJualFilterBar
    injectSezingFilterBar();
    injectJualFilterBar();
}

function injectSezingFilterBar() {
    const listEl = document.getElementById('sezing-list-content');
    if (!listEl || document.getElementById('sz-filter-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'sz-filter-bar';
    bar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;';
    bar.innerHTML = `
        <select id="sz-filter-bulan" onchange="window.onSzFilterMonthChange(this.value)"
            style="background:var(--input-bg);border:1px solid var(--input-border);color:var(--input-color);
                   padding:6px 10px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">
            ${_genMonthOpts()}
        </select>
        <input class="search" type="text" id="sz-filter-search" placeholder="🔍 Cari Open No. / operator..." style="width:200px;" oninput="window.renderSezingList()">
        <button style="background:var(--bg3);color:var(--muted);border:1px solid var(--border);border-radius:6px;padding:5px 11px;font-size:11px;cursor:pointer;" onclick="window['sz-filter-bar_reset']()">↩ Reset</button>`;
    listEl.insertAdjacentElement('beforebegin', bar);
    setTimeout(() => {
        const sel = document.getElementById('sz-filter-bulan');
        if (sel) {
            const saved = localStorage.getItem('sz_filter_month');
            if (saved && sel.querySelector(`option[value="${saved}"]`)) sel.value = saved;
        }
    }, 0);
}

function injectJualFilterBar() {
    const listEl = document.getElementById('penjualan-list-content');
    if (!listEl || document.getElementById('jual-filter-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'jual-filter-bar';
    bar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px;';
    bar.innerHTML = `
        <select id="jual-filter-bulan" onchange="window.onJualFilterMonthChange(this.value)"
            style="background:var(--input-bg);border:1px solid var(--input-border);color:var(--input-color);
                   padding:6px 10px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">
            ${_genMonthOpts()}
        </select>
        <input class="search" type="text" id="jual-filter-search" placeholder="🔍 Cari tujuan / truk / PO..." style="width:200px;" oninput="window.renderPenjualanList()">
        <button style="background:var(--bg3);color:var(--muted);border:1px solid var(--border);border-radius:6px;padding:5px 11px;font-size:11px;cursor:pointer;" onclick="window['jual-filter-bar_reset']()">↩ Reset</button>`;
    listEl.insertAdjacentElement('beforebegin', bar);
    setTimeout(() => {
        const sel = document.getElementById('jual-filter-bulan');
        if (sel) {
            const saved = localStorage.getItem('jual_filter_month');
            if (saved && sel.querySelector(`option[value="${saved}"]`)) sel.value = saved;
        }
    }, 0);
}

window.onSzFilterMonthChange = function(val) {
    localStorage.setItem('sz_filter_month', val);
    window.renderSezingList();
};
window.onJualFilterMonthChange = function(val) {
    localStorage.setItem('jual_filter_month', val);
    window.renderPenjualanList();
};

window['sz-filter-bar_reset'] = function () {
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    localStorage.setItem('sz_filter_month', cur);
    const sel = document.getElementById('sz-filter-bulan');
    if (sel && sel.querySelector(`option[value="${cur}"]`)) sel.value = cur;
    const srch = document.getElementById('sz-filter-search'); if (srch) srch.value = '';
    window.renderSezingList();
};
window['jual-filter-bar_reset'] = function () {
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    localStorage.setItem('jual_filter_month', cur);
    const sel = document.getElementById('jual-filter-bulan');
    if (sel && sel.querySelector(`option[value="${cur}"]`)) sel.value = cur;
    const srch = document.getElementById('jual-filter-search'); if (srch) srch.value = '';
    window.renderPenjualanList();
};

function injectExtraContainers() {
    // Semua container & label sudah ada di HTML baru, tidak perlu inject dinamis.
    // Cukup pastikan listener terpasang pada form input penjualan.
    const fields = ['jual-volume','jual-retur','jual-harga'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el && !el._jualPreviewBound) {
            el.addEventListener('input', window.updateJualPreview);
            el._jualPreviewBound = true;
        }
    });
    const orderSel = document.getElementById('jual-order');
    if (orderSel && !orderSel._jualPreviewBound) {
        orderSel.addEventListener('change', window.updateJualPreview);
        orderSel._jualPreviewBound = true;
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
