// sezing.js — IMPROVED
// Form diperkaya, stok realtime, KPI informatif, filter, chart, per-customer, export CSV

// ═══════════════════════════════════════════════════════════
// INISIALISASI DATA
// ═══════════════════════════════════════════════════════════
let penjualanEditId = null;
let sezingEditId    = null;
if (!window.boardStockList) window.boardStockList = [];
if (!window.sezingList)     window.sezingList     = [];
if (!window.penjualanList)  window.penjualanList  = [];

// ═══════════════════════════════════════════════════════════
// HELPER: Escape HTML
// ═══════════════════════════════════════════════════════════
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ═══════════════════════════════════════════════════════════
// HELPER: Harga per m³ & Netto
// ═══════════════════════════════════════════════════════════
function getPenjualanNetto(p) {
    return Math.max(0, (p.volume || 0) - (p.retur || 0));
}

function getHargaPerM3(p) {
    const netto = getPenjualanNetto(p);
    return netto > 0 ? (p.harga || 0) / netto : 0;
}

// ═══════════════════════════════════════════════════════════
// HELPER: Stok Board Realtime
// stok = total press bulan berjalan - total penjualan netto
// ═══════════════════════════════════════════════════════════
function getStokBoardRealtime() {
    // Total press dari produksi (semua waktu)
    let totPress = 0;
    (window.produksiList || []).forEach(p => {
        const s1 = p.shift1 || {}, s2 = p.shift2 || {};
        totPress += (s1.press || 0) + (s2.press || 0);
    });

    // Total terjual netto (semua waktu)
    const totJual = (window.penjualanList || [])
        .reduce((a, p) => a + getPenjualanNetto(p), 0);

    // Sezing = sudah diproses, diasumsikan sebagian sudah siap jual
    const totSezing = (window.sezingList || [])
        .reduce((a, s) => a + (s.volume || 0), 0);

    // Stok board dalam lembar (belum jual)
    const stokLbr  = Math.max(0, totPress - totJual);

    return { totPress, totJual, totSezing, stokLbr };
}

// ═══════════════════════════════════════════════════════════
// HELPER: Total terpenuhi per Order
// ═══════════════════════════════════════════════════════════
window.getOrderTerpenuhi = function (orderId) {
    return (window.penjualanList || [])
        .filter(p => p.orderId === orderId)
        .reduce((a, p) => a + getPenjualanNetto(p), 0);
};

// ═══════════════════════════════════════════════════════════
// RENDER UTAMA — semua sub-panel
// ═══════════════════════════════════════════════════════════
window.renderSezing = function () {
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

// ═══════════════════════════════════════════════════════════
// 1. SEZING — KPI SUMMARY
// ═══════════════════════════════════════════════════════════
function renderSezingKPI() {
    const cont = document.getElementById('sezing-kpi-bar');
    if (!cont) return;

    const bulan   = thisMonth();
    const listBln = (window.sezingList || []).filter(s => s.tanggal?.startsWith(bulan));
    const listAll = window.sezingList || [];

    const totBln    = listBln.reduce((a, s) => a + (s.volume || 0), 0);
    const totAll    = listAll.reduce((a, s) => a + (s.volume || 0), 0);
    const hariBln   = new Set(listBln.map(s => s.tanggal)).size;
    const rataHari  = hariBln > 0 ? (totBln / hariBln).toFixed(2) : '0.00';

    // Per ketebalan bulan ini
    const perTebal  = {};
    listBln.forEach(s => {
        const k = s.ketebalan ? s.ketebalan + ' mm' : 'Lainnya';
        perTebal[k] = (perTebal[k] || 0) + (s.volume || 0);
    });
    const tebalInfo = Object.entries(perTebal)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) =>
            `<span style="display:inline-flex;align-items:center;gap:4px;
                          background:rgba(212,160,23,.13);color:var(--gold);
                          border:1px solid rgba(212,160,23,.28);border-radius:20px;
                          padding:3px 10px;font-size:10px;font-weight:600;
                          font-family:var(--font-mono);">${k}: ${fmtDec(v,2)} m³</span>`)
        .join('');

    const stok = getStokBoardRealtime();

    cont.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
                gap:12px;margin-bottom:16px;">
        ${szKPI('📏 Sezing Bulan Ini',  fmtDec(totBln,2)+' m³',    'var(--gold)',
                hariBln+' hari aktif')}
        ${szKPI('📦 Sezing Total',      fmtDec(totAll,2)+' m³',    'var(--gold-light)',
                listAll.length+' sesi')}
        ${szKPI('📈 Rata-rata/Hari',    rataHari+' m³',             'var(--blue)',
                'Bulan ini')}
        ${szKPI('🔩 Stok (Press)',      fmt(stok.totPress)+' lbr',  'var(--orange)',
                'Total diproduksi')}
        ${szKPI('✅ Sudah Terjual',     fmt(stok.totJual)+' lbr',   'var(--green)',
                'Netto')}
        ${szKPI('📦 Estimasi Sisa',     fmt(stok.stokLbr)+' lbr',
            stok.stokLbr > 500 ? 'var(--green)' : stok.stokLbr > 100 ? 'var(--orange)' : 'var(--red)',
            'Press − Jual')}
    </div>
    ${tebalInfo
        ? `<div style="display:flex;flex-wrap:wrap;gap:7px;align-items:center;
                        margin-bottom:16px;padding:10px 14px;
                        background:var(--bg2);border:1px solid var(--border);
                        border-radius:8px;">
               <span style="font-size:10px;color:var(--muted);margin-right:2px;">
                   Tebal bulan ini:
               </span>
               ${tebalInfo}
           </div>`
        : ''}`;
}

function szKPI(label, value, color, sub) {
    return `
    <div style="background:var(--bg2);border:1px solid var(--gold-dim);
                border-top:3px solid ${color};border-radius:12px;
                padding:14px 18px;box-shadow:0 3px 12px rgba(0,0,0,.18);
                position:relative;overflow:hidden;">
        <div style="position:absolute;top:-12px;right:-12px;width:52px;height:52px;
                    border-radius:50%;background:${color};opacity:.07;pointer-events:none;"></div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;
                    letter-spacing:.9px;font-weight:600;">${label}</div>
        <div style="font-size:21px;font-weight:700;color:${color};
                    font-family:var(--font-mono);margin-top:6px;line-height:1.1;
                    letter-spacing:-.5px;">${value}</div>
        ${sub ? `<div style="font-size:10px;color:var(--muted);margin-top:6px;
                             padding-top:5px;border-top:1px solid var(--border);">${sub}</div>` : ''}
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// 2. SEZING — FORM INPUT / EDIT
// ═══════════════════════════════════════════════════════════
window.openSezingForm = function (item) {
    sezingEditId = item?.id || null;
    const modal  = document.getElementById('sezing-form-modal');
    if (!modal) { _buildSezingModal(); }

    const openOpts = [...new Set((window.sawmillList || []).map(s => s.openNo).filter(Boolean))]
        .map(no => `<option value="${no}"${no === item?.openNo ? ' selected' : ''}>${no}</option>`)
        .join('');

    const formEl = document.getElementById('sezing-form-inner');
    if (!formEl) return;

    formEl.innerHTML = `
        <div class="form-title" style="font-size:15px;font-weight:700;
                                       color:var(--gold);margin-bottom:18px;">
            ${item ? '✏️ Edit' : '📏 Input'} Hasil Sezing
        </div>
        <div class="grid3">
            <div class="field">
                <label>Tanggal *</label>
                <input type="date" id="sz-tanggal" value="${item?.tanggal || today()}">
            </div>
            <div class="field">
                <label>Open No. / Batch</label>
                <select id="sz-openno">
                    <option value="">-- Pilih --</option>${openOpts}
                </select>
            </div>
            <div class="field">
                <label>Ketebalan (mm)</label>
                <select id="sz-ketebalan">
                    <option value="">-- Pilih --</option>
                    ${['12','15','18','20','25','30'].map(v =>
                        `<option value="${v}"${item?.ketebalan == v ? ' selected' : ''}>${v} mm</option>`
                    ).join('')}
                </select>
            </div>
            <div class="field">
                <label>Volume (m³) *</label>
                <input type="number" step="any" id="sz-volume"
                    value="${item?.volume || ''}" placeholder="0.000"
                    oninput="updateSezingPreview()">
            </div>
            <div class="field">
                <label>Jumlah Lembar (pcs)</label>
                <input type="number" id="sz-pcs" value="${item?.pcs || ''}"
                    placeholder="0" oninput="updateSezingPreview()">
            </div>
            <div class="field">
                <label>Operator</label>
                <input type="text" id="sz-operator" value="${item?.operator || ''}"
                    placeholder="Nama operator">
            </div>
            <div class="field">
                <label>Jenis Board</label>
                <select id="sz-jenis">
                    <option value="">-- Pilih --</option>
                    ${['LB','FLB','LVL','Core','Lainnya'].map(v =>
                        `<option value="${v}"${item?.jenis === v ? ' selected' : ''}>${v}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="field">
                <label>Shift</label>
                <select id="sz-shift">
                    <option value="1"${item?.shift == 1 ? ' selected' : ''}>Shift 1 🕛</option>
                    <option value="2"${item?.shift == 2 ? ' selected' : ''}>Shift 2 🌙</option>
                </select>
            </div>
            <div class="field">
                <label>Keterangan</label>
                <input type="text" id="sz-keterangan" value="${item?.keterangan || ''}"
                    placeholder="Catatan opsional">
            </div>
        </div>

        <!-- Live Preview -->
        <div id="sz-preview"
            style="background:linear-gradient(135deg,rgba(212,160,23,.1),rgba(0,0,0,.1));
                   border:1px solid rgba(212,160,23,.3);border-radius:10px;
                   padding:12px 18px;margin-top:14px;display:none;">
            <div style="font-size:9px;color:var(--gold);font-weight:700;
                        text-transform:uppercase;letter-spacing:.9px;margin-bottom:8px;">
                ⚡ Preview Kalkulasi
            </div>
            <div style="display:flex;gap:20px;flex-wrap:wrap;font-size:12px;
                        font-family:var(--font-mono);">
                <span>Volume: <b style="color:var(--gold);" id="sz-prev-vol">0.000</b> m³</span>
                <span>Lembar: <b style="color:var(--gold);" id="sz-prev-pcs">0</b> pcs</span>
                <span>Rata-rata/Lembar: <b style="color:var(--gold);" id="sz-prev-ratio">—</b></span>
            </div>
        </div>

        <div class="form-actions" style="margin-top:18px;padding-top:14px;
                                         border-top:1px solid var(--border);">
            <button class="btn btn-secondary" onclick="closeSezingForm()">✕ Batal</button>
            <button class="btn btn-primary"   onclick="window.saveSezing()">💾 Simpan Sezing</button>
        </div>`;

    document.getElementById('sezing-form-modal').classList.remove('hidden');
    updateSezingPreview();
};

window.updateSezingPreview = function () {
    const vol = parseFloat(document.getElementById('sz-volume')?.value) || 0;
    const pcs = parseInt(document.getElementById('sz-pcs')?.value) || 0;
    const prev = document.getElementById('sz-preview');
    if (!prev) return;
    if (vol > 0 || pcs > 0) {
        prev.style.display = 'block';
        document.getElementById('sz-prev-vol').textContent = vol.toFixed(3);
        document.getElementById('sz-prev-pcs').textContent = pcs;
        document.getElementById('sz-prev-ratio').textContent =
            pcs > 0 && vol > 0 ? (vol / pcs * 1000).toFixed(2) + ' ltr/lbr' : '—';
    } else {
        prev.style.display = 'none';
    }
};

function closeSezingForm() {
    document.getElementById('sezing-form-modal')?.classList.add('hidden');
    sezingEditId = null;
}

window.saveSezing = function () {
    // Dukung dua id: form dinamis (sz-tanggal) & form statis index.html (sezing-tanggal)
    const tgl = (document.getElementById('sz-tanggal')?.value
              || document.getElementById('sezing-tanggal')?.value || '').trim();
    const vol = parseFloat(document.getElementById('sz-volume')?.value
             || document.getElementById('sezing-volume')?.value || '');
    if (!tgl)         { toast('⚠️ Tanggal wajib diisi!'); return; }
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
    closeSezingForm();
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
    if (item) openSezingForm(item);
};

// ═══════════════════════════════════════════════════════════
// 3. SEZING — RENDER DAFTAR
// ═══════════════════════════════════════════════════════════
window.renderSezingList = function () {
    const cont = document.getElementById('sezing-list-content');
    if (!cont) return;

    const from  = document.getElementById('sz-filter-from')?.value  || '';
    const to    = document.getElementById('sz-filter-to')?.value    || '';
    const srch  = (document.getElementById('sz-filter-search')?.value || '').toLowerCase();

    let list = sortByDateAsc(window.sezingList || []);
    if (from) list = list.filter(s => s.tanggal >= from);
    if (to)   list = list.filter(s => s.tanggal <= to);
    if (srch) list = list.filter(s =>
        (s.openNo||'').toLowerCase().includes(srch) ||
        (s.operator||'').toLowerCase().includes(srch) ||
        (s.jenis||'').toLowerCase().includes(srch)
    );

    if (!list.length) {
        cont.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--muted);">
            <div style="font-size:32px;margin-bottom:8px;opacity:.5;">📭</div>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;">
                Belum ada data sezing
            </div>
            <div style="font-size:11px;">Ubah filter atau tambah data baru</div>
        </div>`;
        return;
    }

    const rows = list.map(s => {
        const tebalBadge = s.ketebalan
            ? `<span style="background:rgba(212,160,23,.15);color:var(--gold);
                             border:1px solid rgba(212,160,23,.3);border-radius:20px;
                             padding:2px 8px;font-size:9px;font-weight:600;
                             white-space:nowrap;">${s.ketebalan} mm</span>`
            : '—';
        const jenisBadge = s.jenis
            ? `<span style="background:rgba(96,165,250,.15);color:var(--blue);
                             border:1px solid rgba(96,165,250,.3);border-radius:20px;
                             padding:2px 8px;font-size:9px;font-weight:600;">${s.jenis}</span>`
            : '—';
        const shiftBadge = s.shift == 2
            ? `<span style="background:rgba(251,146,60,.15);color:var(--orange);
                             border:1px solid rgba(251,146,60,.3);border-radius:20px;
                             padding:2px 8px;font-size:9px;font-weight:600;">🌙 S2</span>`
            : `<span style="background:var(--bg3);color:var(--muted);
                             border:1px solid var(--border);border-radius:20px;
                             padding:2px 8px;font-size:9px;font-weight:600;">🕛 S1</span>`;
        return `<tr onmouseover="this.style.background='var(--bg3)'"
                    onmouseout="this.style.background=''">
            <td>${fmtDate(s.tanggal)}</td>
            <td style="font-family:var(--font-mono);font-size:12px;font-weight:600;
                       color:var(--text);">${s.openNo || '—'}</td>
            <td>${tebalBadge}</td>
            <td>${jenisBadge}</td>
            <td style="text-align:right;font-family:var(--font-mono);
                       color:var(--gold);font-weight:700;">${fmtDec(s.volume,3)}</td>
            <td style="text-align:right;font-family:var(--font-mono);">
                ${s.pcs ? fmt(s.pcs) : '—'}
            </td>
            <td style="color:var(--text);font-size:11px;">${s.operator || '—'}</td>
            <td>${shiftBadge}</td>
            <td>${s.keterangan
                ? `<span style="color:var(--muted);font-size:10px;font-style:italic;">
                       ${escapeHtml(s.keterangan)}</span>`
                : '—'}</td>
            <td>
                <div style="display:flex;gap:4px;justify-content:center;">
                    <button class="btn btn-edit btn-sm"
                        title="Edit" onclick="window.editSezing('${s.id}')">✏️</button>
                    <button class="btn btn-del  btn-sm"
                        title="Hapus" onclick="window.deleteSezing('${s.id}')">🗑️</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    cont.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;
                margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:3px;height:18px;background:var(--gold);
                          border-radius:2px;display:inline-block;"></span>
            <span style="font-size:13px;font-weight:700;color:var(--text);">
                📏 Daftar Hasil Sezing
            </span>
            <span style="font-size:10px;background:rgba(212,160,23,.15);color:var(--gold);
                         border:1px solid rgba(212,160,23,.3);border-radius:20px;
                         padding:2px 8px;font-weight:600;">${list.length} entri</span>
        </div>
        <button style="display:inline-flex;align-items:center;gap:5px;
                        background:rgba(96,165,250,.12);color:var(--blue);
                        border:1px solid rgba(96,165,250,.3);border-radius:6px;
                        padding:5px 12px;font-size:11px;font-weight:600;cursor:pointer;"
                onclick="window.exportSezingCSV()">📥 Export CSV</button>
    </div>
    <div class="table-wrap">
        <table style="font-size:12px;">
            <thead><tr>
                <th>Tanggal</th><th>Open No.</th><th>Tebal</th><th>Jenis</th>
                <th class="right">Volume (m³)</th><th class="right">Lembar</th>
                <th>Operator</th><th>Shift</th><th>Keterangan</th><th>Aksi</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
};

// ═══════════════════════════════════════════════════════════
// 4. BOARD STOCK — SUMMARY (IMPROVED, no <progress>)
// ═══════════════════════════════════════════════════════════
function renderBoardStockSummary() {
    const cont = document.getElementById('board-stock-latest-container');
    if (!cont) return;

    const latest = getLatestBoardStock();
    if (latest.size === 0) {
        cont.innerHTML = `
        <div style="text-align:center;padding:32px 20px;background:var(--bg2);
                    border:1px dashed var(--border);border-radius:12px;color:var(--muted);">
            <div style="font-size:28px;margin-bottom:8px;opacity:.4;">📦</div>
            <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px;">
                Belum ada stok board per PO
            </div>
            <div style="font-size:11px;">Input stok fisik menggunakan form di bawah</div>
        </div>`;
        return;
    }

    const cards = [];
    for (let [orderId, stok] of latest.entries()) {
        const order     = (window.orderList || []).find(o => o.id === orderId);
        if (!order) continue;
        const terpenuhi  = window.getOrderTerpenuhi(orderId);
        const volOrder   = order.volumeOrder || 0;
        const sisaOrder  = Math.max(0, volOrder - terpenuhi);
        const pctTerp    = volOrder > 0 ? Math.min(100, terpenuhi / volOrder * 100) : 0;
        const pctStok    = volOrder > 0 ? Math.min(100, stok / volOrder * 100)      : 0;
        const stokCol    = stok >= sisaOrder ? 'var(--green)' : stok > 0 ? 'var(--orange)' : 'var(--red)';
        const statusLabel = terpenuhi >= volOrder
            ? `<span style="background:rgba(74,222,128,.15);color:var(--green);
                             border:1px solid rgba(74,222,128,.3);border-radius:20px;
                             padding:2px 9px;font-size:9px;font-weight:700;">✅ Lunas</span>`
            : `<span style="background:rgba(251,146,60,.15);color:var(--orange);
                             border:1px solid rgba(251,146,60,.3);border-radius:20px;
                             padding:2px 9px;font-size:9px;font-weight:700;">⏳ Proses</span>`;

        cards.push(`
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);
                    border-radius:12px;padding:16px 18px;position:relative;
                    overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.15);">
            <!-- Accent bar top -->
            <div style="position:absolute;top:0;left:0;right:0;height:3px;
                        background:linear-gradient(90deg,${stokCol},transparent);"></div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;
                        margin-bottom:12px;">
                <div>
                    <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;
                                color:var(--gold);">${escapeHtml(order.kodePO)}</div>
                    <div style="font-size:11px;color:var(--muted);margin-top:2px;">
                        ${escapeHtml(order.perusahaan || '—')}
                    </div>
                </div>
                ${statusLabel}
            </div>

            <!-- 3-col metrics -->
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
                <div style="background:var(--bg3);border-radius:8px;padding:8px 10px;">
                    <div style="font-size:9px;color:var(--muted);margin-bottom:3px;">Vol. Order</div>
                    <div style="font-size:14px;font-weight:700;color:var(--text);
                                font-family:var(--font-mono);">
                        ${fmtDec(volOrder,2)}<span style="font-size:9px;color:var(--muted);"> m³</span>
                    </div>
                </div>
                <div style="background:var(--bg3);border-radius:8px;padding:8px 10px;">
                    <div style="font-size:9px;color:var(--muted);margin-bottom:3px;">Terpenuhi</div>
                    <div style="font-size:14px;font-weight:700;color:var(--green);
                                font-family:var(--font-mono);">
                        ${fmtDec(terpenuhi,2)}<span style="font-size:9px;color:var(--muted);"> m³</span>
                    </div>
                </div>
                <div style="background:var(--bg3);border-radius:8px;padding:8px 10px;">
                    <div style="font-size:9px;color:var(--muted);margin-bottom:3px;">Stok Fisik</div>
                    <div style="font-size:14px;font-weight:700;font-family:var(--font-mono);
                                color:${stokCol};">
                        ${fmtDec(stok,2)}<span style="font-size:9px;color:var(--muted);"> m³</span>
                    </div>
                </div>
            </div>

            <!-- Progress pemenuhan order -->
            <div style="margin-bottom:6px;">
                <div style="display:flex;justify-content:space-between;font-size:9px;
                            color:var(--muted);margin-bottom:4px;">
                    <span>Pemenuhan Order</span>
                    <span style="color:${pctTerp>=100?'var(--green)':pctTerp>=60?'var(--orange)':'var(--red)'}">
                        ${pctTerp.toFixed(0)}%
                    </span>
                </div>
                <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:${pctTerp.toFixed(1)}%;
                                background:${pctTerp>=100?'var(--green)':pctTerp>=60?'var(--orange)':'var(--red)'};
                                border-radius:3px;transition:width .5s ease;"></div>
                </div>
            </div>

            <!-- Sisa order info -->
            <div style="font-size:10px;color:var(--muted);margin-top:5px;">
                Sisa: <span style="color:${sisaOrder>0?'var(--orange)':'var(--green)'};">
                    ${fmtDec(sisaOrder,2)} m³
                </span>
                ${stok > 0 && stok >= sisaOrder
                    ? '&nbsp;·&nbsp;<span style="color:var(--green);">✅ Stok cukup</span>'
                    : stok > 0
                        ? `&nbsp;·&nbsp;<span style="color:var(--orange);">⚠️ Kurang ${fmtDec(sisaOrder - stok,2)} m³</span>`
                        : ''}
            </div>
        </div>`);
    }

    cont.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
                gap:14px;margin-bottom:16px;">
        ${cards.join('')}
    </div>`;
}

function getLatestBoardStock() {
    const latestMap = new Map();
    const sorted    = [...(window.boardStockList || [])].sort((a, b) =>
        (b.tanggal || '').localeCompare(a.tanggal || ''));
    sorted.forEach(item => {
        if (!latestMap.has(item.orderId)) latestMap.set(item.orderId, item.stok);
    });
    return latestMap;
}

// ═══════════════════════════════════════════════════════════
// 5. BOARD STOCK — RIWAYAT (sekarang ditampilkan)
// ═══════════════════════════════════════════════════════════
function renderBoardStockHistory() {
    const cont = document.getElementById('board-stock-history');
    if (!cont) return;

    const list = [...(window.boardStockList || [])].sort((a, b) =>
        (b.tanggal || '').localeCompare(a.tanggal || '')).slice(0, 15);

    if (!list.length) {
        cont.innerHTML = `
        <div style="text-align:center;padding:24px 20px;color:var(--muted);font-size:12px;">
            <div style="font-size:24px;margin-bottom:6px;opacity:.4;">📋</div>
            Belum ada riwayat input stok.
        </div>`;
        return;
    }

    const rows = list.map(item => {
        const order = (window.orderList || []).find(o => o.id === item.orderId);
        return `<tr>
            <td>${fmtDate(item.tanggal)}</td>
            <td class="highlight">${order ? escapeHtml(order.kodePO) : '—'}</td>
            <td>${order ? escapeHtml(order.perusahaan || '—') : '—'}</td>
            <td class="right" style="color:var(--gold);font-family:var(--font-mono);">
                ${fmtDec(item.stok,2)} m³
            </td>
            <td style="color:var(--muted);font-size:11px;">${item.catatan || '—'}</td>
            <td>
                <button class="btn btn-del btn-sm"
                    onclick="window.deleteBoardStock('${item.id}')">🗑️</button>
            </td>
        </tr>`;
    }).join('');

    cont.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-top:18px;margin-bottom:10px;
                padding-bottom:8px;border-bottom:1px solid var(--border);">
        <span style="width:3px;height:16px;background:var(--muted);
                      border-radius:2px;display:inline-block;"></span>
        <span style="font-size:12px;font-weight:700;color:var(--text);">
            📋 Riwayat Input Stok (15 Terakhir)
        </span>
    </div>
    <div class="table-wrap">
        <table style="font-size:12px;">
            <thead><tr>
                <th>Tanggal</th><th>Kode PO</th><th>Perusahaan</th>
                <th>Stok (m³)</th><th>Catatan</th><th>Aksi</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// 6. BOARD STOCK — FORM INPUT
// ═══════════════════════════════════════════════════════════
function initBoardStockForm() {
    const cont = document.getElementById('board-stock-form-container');
    if (!cont || cont.querySelector('#board-stock-order')) return;

    const orderOpts = (window.orderList || [])
        .map(o => `<option value="${o.id}">${escapeHtml(o.kodePO)} — ${escapeHtml(o.perusahaan)}</option>`)
        .join('');

    cont.innerHTML = `
    <div class="form-title" style="font-size:15px;font-weight:700;
                                   color:var(--gold);margin-bottom:6px;">
        📦 Input Stok Board Fisik per PO
    </div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:16px;line-height:1.6;">
        Input hasil opname atau penghitungan stok fisik di gudang. Data ini digunakan
        untuk memantau kesiapan pemenuhan order.
    </div>
    <div class="grid3">
        <div class="field">
            <label>Tanggal *</label>
            <input type="date" id="board-stock-tanggal" value="${today()}">
        </div>
        <div class="field">
            <label>Pilih PO *</label>
            <select id="board-stock-order">
                <option value="">-- Pilih PO --</option>${orderOpts}
            </select>
        </div>
        <div class="field">
            <label>Stok Board Fisik (m³) *</label>
            <input type="number" step="any" id="board-stock-value" placeholder="0.00">
        </div>
        <div class="field" style="grid-column:span 2">
            <label>Catatan</label>
            <input type="text" id="board-stock-catatan"
                placeholder="Contoh: Hasil opname gudang, setelah sortir, dll.">
        </div>
        <div class="field" style="justify-content:flex-end;">
            <button class="btn btn-primary" onclick="window.saveBoardStock()"
                style="margin-top:22px;">💾 Simpan Stok</button>
        </div>
    </div>`;
}

function refreshBoardStockOrders() {
    const sel = document.getElementById('board-stock-order');
    if (!sel) return;
    const old = sel.value;
    sel.innerHTML = '<option value="">-- Pilih PO --</option>' +
        (window.orderList || []).map(o =>
            `<option value="${o.id}">${escapeHtml(o.kodePO)} — ${escapeHtml(o.perusahaan)}</option>`
        ).join('');
    if (old) sel.value = old;
}

window.saveBoardStock = function () {
    const orderId = document.getElementById('board-stock-order')?.value;
    const stok    = parseFloat(document.getElementById('board-stock-value')?.value);
    const tgl     = document.getElementById('board-stock-tanggal')?.value || today();
    const catatan = document.getElementById('board-stock-catatan')?.value || '';

    if (!orderId)          { toast('⚠️ Pilih PO terlebih dahulu!'); return; }
    if (isNaN(stok) || stok < 0) { toast('⚠️ Isi stok dengan benar!'); return; }

    window.boardStockList.push({ id: uid(), tanggal: tgl, orderId, stok, catatan });
    persistAll();
    renderBoardStockSummary();
    renderBoardStockHistory();

    document.getElementById('board-stock-value').value   = '';
    document.getElementById('board-stock-catatan').value = '';

    const order = (window.orderList || []).find(o => o.id === orderId);
    toast(`✅ Stok ${fmtDec(stok,2)} m³ disimpan untuk ${order?.kodePO || 'PO'}`);
    logActivity('Simpan', 'Board Stock', `${order?.kodePO}: ${fmtDec(stok,2)} m³`);
};

window.deleteBoardStock = function (id) {
    if (!confirmDialog('Hapus riwayat stok ini?')) return;
    window.boardStockList = window.boardStockList.filter(i => i.id !== id);
    persistAll();
    renderBoardStockSummary();
    renderBoardStockHistory();
    toast('🗑️ Riwayat stok dihapus');
};

// ═══════════════════════════════════════════════════════════
// 7. PENJUALAN — KPI SUMMARY
// ═══════════════════════════════════════════════════════════
function renderPenjualanKPI() {
    const cont = document.getElementById('penjualan-kpi-bar');
    if (!cont) return;

    const bulan   = thisMonth();
    const listBln = (window.penjualanList || []).filter(p => p.tanggal?.startsWith(bulan));
    const listAll = window.penjualanList || [];

    const totVolBln    = listBln.reduce((a, p) => a + (p.volume || 0), 0);
    const totNettoBln  = listBln.reduce((a, p) => a + getPenjualanNetto(p), 0);
    const totHargaBln  = listBln.reduce((a, p) => a + (p.harga || 0), 0);
    const totReturBln  = listBln.reduce((a, p) => a + (p.retur || 0), 0);
    const totVolAll    = listAll.reduce((a, p) => a + (p.volume || 0), 0);
    const totHargaAll  = listAll.reduce((a, p) => a + (p.harga || 0), 0);
    const hargaPerM3   = totNettoBln > 0 ? (totHargaBln / totNettoBln) : 0;
    const orderAktif   = (window.orderList || []).filter(o => !o.lunas);
    const hariBln      = new Set(listBln.map(p => p.tanggal)).size;

    // Per tujuan bulan ini
    const perTujuan = {};
    listBln.forEach(p => {
        const t = p.tujuan || 'Lainnya';
        if (!perTujuan[t]) perTujuan[t] = { vol: 0, harga: 0, cnt: 0 };
        perTujuan[t].vol   += getPenjualanNetto(p);
        perTujuan[t].harga += p.harga || 0;
        perTujuan[t].cnt++;
    });
    const topTujuan = Object.entries(perTujuan)
        .sort((a, b) => b[1].vol - a[1].vol).slice(0, 3)
        .map(([k, v]) =>
            `<span style="background:rgba(96,165,250,.13);color:var(--blue);
                          border:1px solid rgba(96,165,250,.28);border-radius:20px;
                          padding:3px 10px;font-size:10px;font-weight:600;
                          font-family:var(--font-mono);">
                ${escapeHtml(k)}: ${fmtDec(v.vol,2)} m³
            </span>`
        ).join('');

    // Breakdown per ketebalan produk bulan ini
    const perTebalJual = {};
    listBln.forEach(p => {
        const order = (window.orderList || []).find(o => o.id === p.orderId);
        const tebal = order?.ketebalanProduk ? order.ketebalanProduk + ' mm' : 'Tdk diatur';
        if (!perTebalJual[tebal]) perTebalJual[tebal] = 0;
        perTebalJual[tebal] += getPenjualanNetto(p);
    });
    const tebalBadges = Object.entries(perTebalJual)
        .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
        .map(([k, v]) =>
            `<span style="background:var(--gold-dim);color:var(--gold);
                          border:1px solid rgba(200,160,80,.22);border-radius:20px;
                          padding:3px 10px;font-size:10px;font-weight:700;
                          font-family:var(--font-mono);">
                ${escapeHtml(k)}: ${fmtDec(v,2)} m³
            </span>`
        ).join('');

    cont.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
                gap:12px;margin-bottom:16px;">
        ${szKPI('💰 Netto Bulan Ini',    fmtDec(totNettoBln,2)+' m³', 'var(--green)',    'Rp '+fmtRpRekap(totHargaBln))}
        ${szKPI('📦 Bruto Bulan Ini',    fmtDec(totVolBln,2)+' m³',   'var(--gold)',     hariBln+' hari aktif')}
        ${szKPI('↩️ Total Retur',         fmtDec(totReturBln,2)+' m³', totReturBln > 0 ? 'var(--red)' : 'var(--muted)', 'Bulan ini')}
        ${szKPI('💵 Harga/m³',           'Rp '+fmtRpRekap(hargaPerM3), 'var(--gold-light)', 'Rata-rata bulan ini')}
        ${szKPI('📊 Total All-time',      fmtDec(totVolAll,2)+' m³',   'var(--blue)',     'Rp '+fmtRpRekap(totHargaAll))}
        ${szKPI('📑 Order Aktif',         orderAktif.length+' PO',
            orderAktif.length > 0 ? 'var(--orange)' : 'var(--green)',
            orderAktif.length > 0 ? 'Belum lunas' : 'Semua lunas')}
    </div>
    ${topTujuan ? `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:16px;
                padding:10px 14px;background:var(--bg2);border:1px solid var(--border);
                border-radius:8px;">
        <span style="font-size:10px;color:var(--muted);">🏆 Top Tujuan:</span>
        ${topTujuan}
    </div>` : ''}
    ${tebalBadges ? `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:16px;
                padding:10px 14px;background:var(--bg2);border:1px solid var(--border);
                border-radius:8px;">
        <span style="font-size:10px;color:var(--muted);">📐 Per Tebal Produk (bulan ini):</span>
        ${tebalBadges}
    </div>` : ''}`;
}

function fmtRpRekap(n) {
    if (!n) return '0';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + ' M';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + ' jt';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + ' rb';
    return fmt(n);
}

// ═══════════════════════════════════════════════════════════
// 8. PENJUALAN — RENDER LIST
// ═══════════════════════════════════════════════════════════
window.renderPenjualanList = function () {
    const cont = document.getElementById('penjualan-list-content');
    if (!cont) return;

    const from = document.getElementById('jual-filter-from')?.value || '';
    const to   = document.getElementById('jual-filter-to')?.value   || '';
    const srch = (document.getElementById('jual-filter-search')?.value || '').toLowerCase();

    let list = sortByDateAsc(window.penjualanList || []);
    if (from) list = list.filter(p => p.tanggal >= from);
    if (to)   list = list.filter(p => p.tanggal <= to);
    if (srch) list = list.filter(p =>
        (p.tujuan  || '').toLowerCase().includes(srch) ||
        (p.truk    || '').toLowerCase().includes(srch) ||
        ((window.orderList||[]).find(o => o.id === p.orderId)?.kodePO || '').toLowerCase().includes(srch)
    );

    if (!list.length) {
        cont.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--muted);">
            <div style="font-size:32px;margin-bottom:8px;opacity:.5;">📭</div>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;">
                Belum ada penjualan
            </div>
            <div style="font-size:11px;">Ubah filter atau catat penjualan baru</div>
        </div>`;
        return;
    }

    const rows = list.map(p => {
        const order    = (window.orderList || []).find(o => o.id === p.orderId);
        const netto    = getPenjualanNetto(p);
        const hPerM3   = netto > 0 ? (p.harga / netto) : 0;
        const returPct = p.volume > 0 ? (p.retur / p.volume * 100).toFixed(1) : '0';

        const tebalProduk = order?.ketebalanProduk || null;
        return `<tr onmouseover="this.style.background='var(--bg3)'"
                    onmouseout="this.style.background=''">
            <td>${fmtDate(p.tanggal)}</td>
            <td>
                <div style="font-size:12px;font-weight:700;font-family:var(--font-mono);
                            color:var(--text);">
                    ${order ? escapeHtml(order.kodePO) : '—'}
                </div>
                <div style="font-size:10px;color:var(--muted);">
                    ${order ? escapeHtml(order.perusahaan || '') : ''}
                </div>
            </td>
            <td style="text-align:center;">
                ${tebalProduk
                    ? `<span style="background:var(--gold-dim);color:var(--gold);
                                  padding:2px 9px;border-radius:20px;
                                  font-family:var(--font-mono);font-size:11px;
                                  font-weight:700;border:1px solid rgba(200,160,80,.2);
                                  white-space:nowrap;">${tebalProduk} mm</span>`
                    : '<span style="color:var(--muted);font-size:10px;">—</span>'}
            </td>
            <td style="text-align:right;font-family:var(--font-mono);">${fmt(p.pcs)}</td>
            <td style="text-align:right;">
                <span style="font-family:var(--font-mono);color:var(--gold);">
                    ${fmtDec(p.volume,3)}
                </span>
                ${p.retur > 0
                    ? `<div style="font-size:9px;color:var(--red);">
                           ↩ ${fmtDec(p.retur,3)} (${returPct}%)
                       </div>`
                    : ''}
            </td>
            <td style="text-align:right;font-family:var(--font-mono);
                       font-weight:700;color:var(--green);">${fmtDec(netto,3)}</td>
            <td style="font-family:var(--font-mono);font-size:11px;">
                ${escapeHtml(p.truk)}
            </td>
            <td>${escapeHtml(p.tujuan)}</td>
            <td style="text-align:right;">
                <div style="font-family:var(--font-mono);color:var(--green);font-weight:600;">
                    Rp ${fmt(p.harga)}
                </div>
                <div style="font-size:9px;color:var(--muted);">
                    ${fmtRpRekap(hPerM3)}/m³
                </div>
            </td>
            <td>
                <div style="display:flex;gap:4px;justify-content:center;">
                    <button class="btn btn-edit btn-sm"
                        title="Edit" onclick="window.editPenjualan('${p.id}')">✏️</button>
                    <button class="btn btn-del  btn-sm"
                        title="Hapus" onclick="window.deletePenjualan('${p.id}')">🗑️</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    cont.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;
                margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:3px;height:18px;background:var(--green);
                          border-radius:2px;display:inline-block;"></span>
            <span style="font-size:13px;font-weight:700;color:var(--text);">
                💰 Daftar Penjualan
            </span>
            <span style="font-size:10px;background:rgba(74,222,128,.13);color:var(--green);
                         border:1px solid rgba(74,222,128,.28);border-radius:20px;
                         padding:2px 8px;font-weight:600;">${list.length} transaksi</span>
        </div>
        <button style="display:inline-flex;align-items:center;gap:5px;
                        background:rgba(96,165,250,.12);color:var(--blue);
                        border:1px solid rgba(96,165,250,.3);border-radius:6px;
                        padding:5px 12px;font-size:11px;font-weight:600;cursor:pointer;"
                onclick="window.exportPenjualanCSV()">📥 Export CSV</button>
    </div>
    <div class="table-wrap">
        <table style="font-size:11px;">
            <thead><tr>
                <th>Tanggal</th><th>PO / Pembeli</th><th style="text-align:center;">Tebal</th><th class="right">Pcs</th>
                <th class="right">Bruto (m³)</th><th class="right">Netto (m³)</th>
                <th>No. Truk</th><th>Tujuan</th><th class="right">Harga</th><th>Aksi</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
};

// ═══════════════════════════════════════════════════════════
// 9. PENJUALAN — CHARTS
// ═══════════════════════════════════════════════════════════
function renderPenjualanCharts() {
    const cont = document.getElementById('penjualan-charts-container');
    if (!cont) return;

    const bulan = thisMonth();
    const listBln = (window.penjualanList || []).filter(p => p.tanggal?.startsWith(bulan));
    if (!listBln.length) { cont.innerHTML = ''; return; }

    // Data harian
    const [y, m] = bulan.split('-').map(Number);
    const hariDlm = new Date(y, m, 0).getDate();
    const labels  = Array.from({length: hariDlm}, (_, i) => String(i + 1).padStart(2, '0'));
    const volHari = labels.map(d => {
        const tgl = `${bulan}-${d}`;
        return listBln.filter(p => p.tanggal === tgl)
            .reduce((a, p) => a + getPenjualanNetto(p), 0) || null;
    });
    const hargaHari = labels.map(d => {
        const tgl = `${bulan}-${d}`;
        return listBln.filter(p => p.tanggal === tgl)
            .reduce((a, p) => a + (p.harga || 0), 0) || null;
    });

    // Per tujuan (pie-like summary)
    const perTujuan = {};
    listBln.forEach(p => {
        const t = p.tujuan || 'Lainnya';
        perTujuan[t] = (perTujuan[t] || 0) + getPenjualanNetto(p);
    });
    const tujuanEntries = Object.entries(perTujuan).sort((a, b) => b[1] - a[1]);
    const totVol = tujuanEntries.reduce((a, [, v]) => a + v, 0);
    const tujuanColors = ['var(--gold)','var(--blue)','var(--green)','var(--orange)','var(--red)'];
    const tujuanBars   = tujuanEntries.map(([k, v], i) => {
        const pct = totVol > 0 ? (v / totVol * 100) : 0;
        const col = tujuanColors[i % tujuanColors.length];
        return `
        <div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;
                        margin-bottom:4px;">
                <span style="color:var(--text);">${escapeHtml(k)}</span>
                <span style="font-family:var(--font-mono);color:${col};">
                    ${fmtDec(v,2)} m³ (${pct.toFixed(0)}%)
                </span>
            </div>
            <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${pct.toFixed(1)}%;background:${col};
                            border-radius:3px;transition:width .5s ease;"></div>
            </div>
        </div>`;
    }).join('');

    cont.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-top:22px;margin-bottom:14px;
                padding-bottom:10px;border-bottom:1px solid var(--border);">
        <span style="width:3px;height:18px;background:var(--blue);
                      border-radius:2px;display:inline-block;"></span>
        <span style="font-size:13px;font-weight:700;color:var(--text);">
            📊 Analitik Penjualan — ${_fmtBulan(bulan)}
        </span>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:14px;">
        <div class="chart-wrap">
            <div class="chart-title">📅 Volume & Nilai Penjualan Harian</div>
            <canvas id="chart-jual-harian" height="180"></canvas>
        </div>
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;
                    padding:16px;">
            <div class="chart-title">🗺️ Distribusi per Tujuan</div>
            ${tujuanBars || '<div style="color:var(--muted);font-size:11px;padding-top:8px;">Belum ada data</div>'}
        </div>
    </div>`;

    setTimeout(() => {
        const ctx = document.getElementById('chart-jual-harian');
        if (!ctx || !window.Chart) return;
        if (ctx._chartInst) ctx._chartInst.destroy();
        ctx._chartInst = new Chart(ctx, {
            data: {
                labels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Volume Netto (m³)',
                        data: volHari,
                        backgroundColor: 'rgba(74,222,128,.45)',
                        borderColor: 'var(--green)',
                        borderWidth: 1,
                        borderRadius: 3,
                        yAxisID: 'y',
                        spanGaps: true
                    },
                    {
                        type: 'line',
                        label: 'Nilai (Rp)',
                        data: hargaHari,
                        borderColor: 'var(--gold)',
                        backgroundColor: 'rgba(212,160,23,.08)',
                        borderWidth: 2,
                        pointRadius: 2,
                        fill: true,
                        tension: .3,
                        yAxisID: 'y1',
                        spanGaps: true
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { labels: { color: '#8a8578', font: { size: 9 }, boxWidth: 12 } }
                },
                scales: {
                    x:  { ticks: { color: '#555', font: { size: 9 } },
                          grid: { color: 'rgba(255,255,255,.03)' } },
                    y:  { position: 'left',  ticks: { color: '#4ade80', font: { size: 9 } },
                          grid: { color: 'rgba(255,255,255,.04)' },
                          title: { display: true, text: 'm³', color: '#8a8578', font: { size: 9 } } },
                    y1: { position: 'right', ticks: { color: '#d4a017', font: { size: 9 } },
                          grid: { drawOnChartArea: false },
                          title: { display: true, text: 'Rp', color: '#8a8578', font: { size: 9 } } }
                }
            }
        });
    }, 100);
}

function _fmtBulan(ym) {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const names  = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return (names[parseInt(m) - 1] || m) + ' ' + y;
}

// ═══════════════════════════════════════════════════════════
// 10. PENJUALAN — FORM INPUT / EDIT
// ═══════════════════════════════════════════════════════════
window.populateOrderDropdown = function (selectedId) {
    const sel = document.getElementById('jual-order');
    if (!sel) return;

    // Filter: tampilkan hanya order yang BELUM selesai
    // Order dianggap selesai jika total penjualan >= volumeOrder
    const activeOrders = (window.orderList || []).filter(o => {
        const terkirim = (window.penjualanList || [])
            .filter(p => p.orderId === o.id)
            .reduce((s, p) => s + (parseFloat(p.volume) || 0), 0);
        const selesai = o.volumeOrder > 0 && terkirim >= o.volumeOrder;
        // Selalu tampilkan order yang sedang di-edit (selectedId)
        return !selesai || o.id === selectedId;
    });

    sel.innerHTML = '<option value="">-- Pilih PO --</option>' +
        activeOrders.map(o =>
            `<option value="${o.id}"${o.id === selectedId ? ' selected' : ''}>
                ${escapeHtml(o.kodePO)} — ${escapeHtml(o.perusahaan)}
             </option>`
        ).join('');
};

window.resetJualForm = function () {
    ['jual-tanggal','jual-pcs','jual-volume','jual-truk',
     'jual-tujuan','jual-harga','jual-retur'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = id === 'jual-tanggal' ? today() : id === 'jual-retur' ? '0' : '';
    });
    document.getElementById('jual-harga-per-m3')
        && (document.getElementById('jual-harga-per-m3').textContent = '—');
    const tebalReset = document.getElementById('jual-tebal-info');
    if (tebalReset) { tebalReset.textContent = '—'; tebalReset.style.color = 'var(--gold)'; }
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
    populateOrderDropdown(item.orderId || null);
    updateJualPreview();
};

// Auto-hitung harga per m³ saat mengetik
window.updateJualPreview = function () {
    const vol   = parseFloat(document.getElementById('jual-volume')?.value) || 0;
    const retur = parseFloat(document.getElementById('jual-retur')?.value)  || 0;
    const harga = parseFloat(document.getElementById('jual-harga')?.value)  || 0;
    const netto = Math.max(0, vol - retur);
    const hpm3  = netto > 0 ? (harga / netto) : 0;
    const el    = document.getElementById('jual-harga-per-m3');
    if (el) el.textContent = hpm3 > 0 ? 'Rp ' + fmtRpRekap(hpm3) + '/m³' : '—';

    // Auto-tampilkan ketebalan produk dari order
    const orderId = document.getElementById('jual-order')?.value;
    const tebalInfoEl = document.getElementById('jual-tebal-info');
    if (tebalInfoEl) {
        const selOrder = (window.orderList || []).find(o => o.id === orderId);
        if (selOrder?.ketebalanProduk) {
            tebalInfoEl.textContent = selOrder.ketebalanProduk + ' mm';
            tebalInfoEl.style.color = 'var(--gold)';
        } else {
            tebalInfoEl.textContent = orderId ? 'Tidak diatur' : '—';
            tebalInfoEl.style.color = 'var(--muted)';
        }
    }

    // Warna sisa PO
    if (orderId && vol > 0) {
        const order   = (window.orderList || []).find(o => o.id === orderId);
        if (order) {
            let terpenuhi = window.getOrderTerpenuhi(orderId);
            if (penjualanEditId) {
                const old = (window.penjualanList || []).find(p => p.id === penjualanEditId);
                if (old) terpenuhi -= getPenjualanNetto(old);
            }
            const sisa = Math.max(0, (order.volumeOrder || 0) - terpenuhi);
            const sisaEl = document.getElementById('jual-sisa-po');
            if (sisaEl) {
                sisaEl.textContent  = `Sisa PO: ${fmtDec(sisa, 2)} m³`;
                sisaEl.style.color  = vol > sisa ? 'var(--red)' : 'var(--green)';
            }
        }
    }
};

window.savePenjualan = function () {
    const tgl     = document.getElementById('jual-tanggal')?.value;
    const pcs     = document.getElementById('jual-pcs')?.value;
    const vol     = parseFloat(document.getElementById('jual-volume')?.value)  || 0;
    const truk    = document.getElementById('jual-truk')?.value?.trim();
    const tujuan  = document.getElementById('jual-tujuan')?.value?.trim();
    const harga   = parseFloat(document.getElementById('jual-harga')?.value)   || 0;
    const orderId = document.getElementById('jual-order')?.value;
    const retur   = parseFloat(document.getElementById('jual-retur')?.value)   || 0;

    if (!tgl)     { toast('⚠️ Tanggal wajib diisi!'); return; }
    if (!pcs)     { toast('⚠️ Jumlah pcs wajib diisi!'); return; }
    if (!vol)     { toast('⚠️ Volume wajib diisi!'); return; }
    if (!truk)    { toast('⚠️ No. truk wajib diisi!'); return; }
    if (!tujuan)  { toast('⚠️ Tujuan wajib diisi!'); return; }
    if (!harga)   { toast('⚠️ Harga wajib diisi!'); return; }
    if (!orderId) { toast('⚠️ Pilih PO terlebih dahulu!'); return; }

    // Validasi stok vs order
    const order = (window.orderList || []).find(o => o.id === orderId);
    if (order) {
        let terpenuhi = window.getOrderTerpenuhi(orderId);
        if (penjualanEditId) {
            const old = (window.penjualanList || []).find(p => p.id === penjualanEditId);
            if (old) terpenuhi -= getPenjualanNetto(old);
        }
        const sisa  = Math.max(0, (order.volumeOrder || 0) - terpenuhi);
        const netto = Math.max(0, vol - retur);
        if (netto > sisa && !confirmDialog(
            `⚠️ Volume netto (${fmtDec(netto,2)} m³) melebihi sisa order\n` +
            `(sisa: ${fmtDec(sisa,2)} m³). Tetap simpan?`
        )) return;
    }

    const item = {
        id: penjualanEditId || uid(),
        tanggal: tgl,
        pcs:     parseInt(pcs) || 0,
        volume:  vol,
        truk,
        tujuan,
        harga,
        orderId,
        retur
    };

    if (!window.penjualanList) window.penjualanList = [];

    if (penjualanEditId) {
        window.penjualanList = window.penjualanList.map(p => p.id === penjualanEditId ? item : p);
        logActivity('Update', 'Penjualan', `${truk} → ${tujuan}`);
        toast('✅ Penjualan diperbarui!');
    } else {
        window.penjualanList.push(item);
        logActivity('Simpan', 'Penjualan', `${truk} → ${tujuan} · ${fmtDec(vol,2)} m³`);
        toast('✅ Penjualan disimpan!');
    }

    persistAll();
    renderPenjualan();
    updateAllOrderSummaries?.();
    renderOrder?.();
    resetJualForm();
};

window.deletePenjualan = function (id) {
    const item = (window.penjualanList || []).find(p => p.id === id);
    if (!confirmDialog('Hapus data penjualan ini?')) return;
    window.penjualanList = window.penjualanList.filter(p => p.id !== id);
    persistAll();
    renderPenjualan();
    updateAllOrderSummaries?.();
    renderOrder?.();
    logActivity('Hapus', 'Penjualan', `${item?.truk} → ${item?.tujuan}`);
    toast('🗑️ Penjualan dihapus');
};

window.editPenjualan = function (id) {
    const item = (window.penjualanList || []).find(p => p.id === id);
    if (!item) return;
    fillJualForm(item);
    // FIX: Switch ke tab penjualan, subtab input (bukan tab sezing)
    window.switchTab?.('penjualan');
    setTimeout(() => {
        document.querySelector('#tab-penjualan .subtab-btn[data-subtab="penjualan-input"]')?.click();
    }, 50);
};

// ═══════════════════════════════════════════════════════════
// 11. EXPORT CSV
// ═══════════════════════════════════════════════════════════
window.exportSezingCSV = function () {
    if (!(window.sezingList || []).length) { toast('⚠️ Tidak ada data'); return; }
    const headers = ['Tanggal','Open No.','Ketebalan(mm)','Jenis','Volume(m³)',
                     'Lembar(pcs)','Shift','Operator','Keterangan'];
    const rows    = sortByDateAsc(window.sezingList).map(s => [
        s.tanggal, s.openNo||'', s.ketebalan||'', s.jenis||'',
        fmtDec(s.volume||0,3), s.pcs||0, s.shift||'1',
        s.operator||'', s.keterangan||''
    ].join(','));
    _downloadCSV([headers.join(','), ...rows].join('\n'), `sezing_${thisMonth()}.csv`);
    toast('📥 CSV sezing berhasil diunduh');
};

window.exportPenjualanCSV = function () {
    if (!(window.penjualanList || []).length) { toast('⚠️ Tidak ada data'); return; }
    const headers = ['Tanggal','Kode PO','Pembeli','Pcs','Bruto(m³)',
                     'Retur(m³)','Netto(m³)','No.Truk','Tujuan','Harga(Rp)','Harga/m³'];
    const rows    = sortByDateAsc(window.penjualanList).map(p => {
        const order  = (window.orderList || []).find(o => o.id === p.orderId);
        const netto  = getPenjualanNetto(p);
        const hpm3   = netto > 0 ? Math.round(p.harga / netto) : 0;
        return [
            p.tanggal,
            order?.kodePO || '',
            order?.perusahaan || '',
            p.pcs || 0,
            fmtDec(p.volume || 0, 3),
            fmtDec(p.retur  || 0, 3),
            fmtDec(netto, 3),
            p.truk   || '',
            p.tujuan || '',
            p.harga  || 0,
            hpm3
        ].join(',');
    });
    _downloadCSV([headers.join(','), ...rows].join('\n'), `penjualan_${thisMonth()}.csv`);
    toast('📥 CSV penjualan berhasil diunduh');
};

function _downloadCSV(csv, filename) {
    const a   = document.createElement('a');
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download= filename;
    a.click();
}

// ═══════════════════════════════════════════════════════════
// 12. INJECT FILTER BARS & EXTRA CONTAINERS
// ═══════════════════════════════════════════════════════════
function injectSezingFilterBar() {
    const listEl = document.getElementById('sezing-list-content');
    if (!listEl || document.getElementById('sz-filter-bar')) return;
    const bar = document.createElement('div');
    bar.id    = 'sz-filter-bar';
    bar.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;';
    bar.innerHTML = `
        <input class="search" type="text" id="sz-filter-search"
            placeholder="🔍 Cari Open No. / operator..."
            style="width:210px;" oninput="window.renderSezingList()">
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);">
            <label>Dari:</label>
            <input type="date" id="sz-filter-from"
                style="background:var(--input-bg);border:1px solid var(--input-border);
                       color:var(--input-color);padding:7px 10px;border-radius:6px;font-size:11px;"
                onchange="window.renderSezingList()">
            <label>s/d</label>
            <input type="date" id="sz-filter-to"
                style="background:var(--input-bg);border:1px solid var(--input-border);
                       color:var(--input-color);padding:7px 10px;border-radius:6px;font-size:11px;"
                onchange="window.renderSezingList()">
        </div>
        <button style="background:var(--bg3);color:var(--muted);border:1px solid var(--border);
                        border-radius:6px;padding:6px 12px;font-size:11px;cursor:pointer;"
                onclick="resetSzFilter()">↩ Reset</button>`;
    listEl.insertAdjacentElement('beforebegin', bar);
}

function injectJualFilterBar() {
    const listEl = document.getElementById('penjualan-list-content');
    if (!listEl || document.getElementById('jual-filter-bar')) return;
    const bar = document.createElement('div');
    bar.id    = 'jual-filter-bar';
    bar.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;';
    bar.innerHTML = `
        <input class="search" type="text" id="jual-filter-search"
            placeholder="🔍 Cari tujuan / truk / PO..."
            style="width:210px;" oninput="window.renderPenjualanList()">
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);">
            <label>Dari:</label>
            <input type="date" id="jual-filter-from"
                style="background:var(--input-bg);border:1px solid var(--input-border);
                       color:var(--input-color);padding:7px 10px;border-radius:6px;font-size:11px;"
                onchange="window.renderPenjualanList()">
            <label>s/d</label>
            <input type="date" id="jual-filter-to"
                style="background:var(--input-bg);border:1px solid var(--input-border);
                       color:var(--input-color);padding:7px 10px;border-radius:6px;font-size:11px;"
                onchange="window.renderPenjualanList()">
        </div>
        <button style="background:var(--bg3);color:var(--muted);border:1px solid var(--border);
                        border-radius:6px;padding:6px 12px;font-size:11px;cursor:pointer;"
                onclick="resetJualFilter()">↩ Reset</button>`;
    listEl.insertAdjacentElement('beforebegin', bar);
}

function resetSzFilter() {
    ['sz-filter-from','sz-filter-to','sz-filter-search'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    window.renderSezingList();
}

function resetJualFilter() {
    ['jual-filter-from','jual-filter-to','jual-filter-search'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    window.renderPenjualanList();
}

// ═══════════════════════════════════════════════════════════
// 13. INJECT KPI BARS & CHART CONTAINER
// ═══════════════════════════════════════════════════════════
function injectExtraContainers() {
    const tab = document.getElementById('tab-sezing');
    if (!tab) return;

    // Sezing KPI bar
    const szList = document.getElementById('sezing-list-content');
    if (szList && !document.getElementById('sezing-kpi-bar')) {
        const el = document.createElement('div');
        el.id    = 'sezing-kpi-bar';
        szList.insertAdjacentElement('beforebegin', el);
    }

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
        const parent = jualList?.parentElement || tab;
        parent.appendChild(el);
    }

    // Harga per m³ display di form penjualan
    const hargaInput = document.getElementById('jual-harga');
    if (hargaInput && !document.getElementById('jual-harga-per-m3')) {
        const el        = document.createElement('div');
        el.id           = 'jual-harga-per-m3';
        el.style.cssText= 'font-size:11px;color:var(--gold);margin-top:4px;font-family:var(--font-mono);';
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

// ═══════════════════════════════════════════════════════════
// 14. SEZING FORM MODAL BUILDER
// ═══════════════════════════════════════════════════════════
function _buildSezingModal() {
    const tab = document.getElementById('tab-sezing');
    if (!tab || document.getElementById('sezing-form-modal')) return;
    const modal     = document.createElement('div');
    modal.id        = 'sezing-form-modal';
    modal.className = 'hidden';
    modal.innerHTML = `
    <div class="form-card" style="margin-bottom:16px;position:relative;">
        <button onclick="closeSezingForm()"
            style="position:absolute;top:14px;right:14px;background:var(--bg3);
                   border:1px solid var(--border);color:var(--muted);width:28px;height:28px;
                   border-radius:50%;cursor:pointer;font-size:13px;font-weight:700;
                   display:flex;align-items:center;justify-content:center;
                   transition:background .15s;">✕</button>
        <div id="sezing-form-inner"></div>
    </div>`;
    const szList = document.getElementById('sezing-list-content');
    if (szList) szList.insertAdjacentElement('beforebegin', modal);
    else tab.prepend(modal);
}

// ═══════════════════════════════════════════════════════════
// HOOKS: sync dengan Order module
// ═══════════════════════════════════════════════════════════
if (typeof window.saveOrder === 'function') {
    const _orig = window.saveOrder;
    window.saveOrder = function () {
        _orig();
        refreshBoardStockOrders();
        renderBoardStockSummary();
        renderPenjualanKPI?.();
    };
}

if (typeof window.deleteOrder === 'function') {
    const _orig = window.deleteOrder;
    window.deleteOrder = function (id) {
        _orig(id);
        refreshBoardStockOrders();
        renderBoardStockSummary();
        renderPenjualanKPI?.();
    };
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    const btnSave = document.getElementById('btn-save-penjualan');
    if (btnSave) btnSave.onclick = () => window.savePenjualan();
});

setTimeout(() => {
    injectExtraContainers();
    injectSezingFilterBar();
    injectJualFilterBar();
    _buildSezingModal();
    renderSezing();
    renderPenjualan();
}, 500);
