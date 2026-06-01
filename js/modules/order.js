// order.js - Versi Enhanced dengan Pemisahan Tab Aktif & Selesai
// Fitur: deadline, prioritas, status otomatis, progress bar, filter/search, detail pengiriman
// Sekarang order selesai berada di tab terpisah

let orderEditId = null;
let orderDetailId = null;
let orderFilterStatus = 'semua';
let orderSearchQuery = '';
let orderActiveTab = 'active'; // 'active' atau 'completed'

// ─────────────────────────────────────────────
// HELPER: Hitung volume terkirim bersih (netto)
// ─────────────────────────────────────────────
window.getOrderTerpenuhi = function(orderId) {
    return (window.penjualanList || [])
        .filter(p => p.orderId === orderId)
        .reduce((s, p) => s + ((parseFloat(p.volume) || 0) - (parseFloat(p.retur) || 0)), 0);
};

// Ambil stok board terbaru untuk suatu orderId
function getLatestStockByOrderId(orderId) {
    const stocks = (window.boardStockList || []).filter(s => s.orderId === orderId);
    if (!stocks.length) return 0;
    return [...stocks].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''))[0].stok || 0;
}

// ─────────────────────────────────────────────
// HELPER: Tentukan status order
// ─────────────────────────────────────────────
function getOrderStatus(order) {
    const terkirim = window.getOrderTerpenuhi(order.id);
    const stokBoard = getLatestStockByOrderId(order.id);
    // sisa = volume yang BELUM terkirim (stokBoard tidak mengurangi sisa pengiriman)
    const sisa = Math.max(0, order.volumeOrder - terkirim);
    const persen = order.volumeOrder > 0 ? (terkirim / order.volumeOrder) * 100 : 0;
    const todayStr = today();
    const terlambat = order.deadline && order.deadline < todayStr && sisa > 0;
    const mendesak = order.deadline && !terlambat && sisa > 0 &&
        diffDaysOrder(todayStr, order.deadline) <= 7;

    let status, statusClass, statusIcon;
    if (sisa <= 0) {
        status = 'Selesai'; statusClass = 'os-selesai'; statusIcon = '✅';
    } else if (terlambat) {
        status = 'Terlambat'; statusClass = 'os-terlambat'; statusIcon = '🔴';
    } else if (mendesak) {
        status = 'Mendesak'; statusClass = 'os-mendesak'; statusIcon = '🟠';
    } else if (terkirim > 0) {
        status = 'Sebagian'; statusClass = 'os-sebagian'; statusIcon = '🔵';
    } else {
        status = 'Pending'; statusClass = 'os-pending'; statusIcon = '⚪';
    }

    return { terkirim, stokBoard, sisa, persen, status, statusClass, statusIcon, terlambat, mendesak };
}

function diffDaysOrder(d1, d2) {
    return Math.ceil((new Date(d2) - new Date(d1)) / 86400000);
}

// ─────────────────────────────────────────────
// CSS inject (dipanggil sekali saat init)
// ─────────────────────────────────────────────
function injectOrderStyles() {
    if (document.getElementById('order-styles')) return;
    const style = document.createElement('style');
    style.id = 'order-styles';
    style.textContent = `
        /* ══════════════════════════════════════════
           VOLUME KPI SECTION — Hero Metrics
        ══════════════════════════════════════════ */
        .order-kpi-section {
            margin-bottom: 20px;
        }
        .order-kpi-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
        }
        .order-kpi-title {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: .12em;
            text-transform: uppercase;
            color: var(--muted);
        }
        .order-kpi-title::before {
            content: '';
            display: inline-block;
            width: 3px; height: 12px;
            background: var(--gold);
            border-radius: 2px;
            margin-right: 7px;
            vertical-align: middle;
        }
        .order-kpi-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin-bottom: 12px;
        }
        @media (max-width: 900px) {
            .order-kpi-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 580px) {
            .order-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .okpi {
            background: var(--bg3);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 14px 16px;
            position: relative;
            overflow: hidden;
            transition: transform .15s, border-color .15s;
        }
        .okpi:hover { transform: translateY(-2px); }
        .okpi::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 2px;
            border-radius: 12px 12px 0 0;
        }
        .okpi.kpi-gold::before   { background: var(--gold); }
        .okpi.kpi-green::before  { background: var(--green); }
        .okpi.kpi-blue::before   { background: #60a5fa; }
        .okpi.kpi-orange::before { background: var(--orange); }
        .okpi.kpi-red::before    { background: #f87171; }

        .okpi-icon {
            font-size: 18px;
            margin-bottom: 6px;
            display: block;
            line-height: 1;
        }
        .okpi-val {
            font-size: 22px;
            font-weight: 800;
            line-height: 1.1;
            font-family: var(--font-mono);
            letter-spacing: -.02em;
        }
        .okpi-unit {
            font-size: 11px;
            font-weight: 400;
            color: var(--muted);
            margin-left: 2px;
        }
        .okpi-lbl {
            font-size: 10px;
            color: var(--muted);
            margin-top: 5px;
            line-height: 1.4;
            font-weight: 500;
        }
        .okpi-sub {
            font-size: 10px;
            color: var(--muted);
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px solid var(--border);
        }
        .okpi.kpi-gold  .okpi-val { color: var(--gold); }
        .okpi.kpi-green .okpi-val { color: var(--green); }
        .okpi.kpi-blue  .okpi-val { color: #60a5fa; }
        .okpi.kpi-orange .okpi-val { color: var(--orange); }
        .okpi.kpi-red   .okpi-val { color: #f87171; }

        /* Overall progress bar in KPI section */
        .order-kpi-progress-wrap {
            background: var(--bg3);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 14px 16px;
            margin-bottom: 12px;
        }
        .kpi-prog-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .kpi-prog-label {
            font-size: 11px;
            font-weight: 700;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: .08em;
        }
        .kpi-prog-pct {
            font-size: 20px;
            font-weight: 800;
            color: var(--gold);
            font-family: var(--font-mono);
        }
        .kpi-prog-bar {
            height: 10px;
            background: var(--border);
            border-radius: 10px;
            overflow: hidden;
            display: flex;
            margin-bottom: 8px;
        }
        .kpi-prog-seg {
            height: 100%;
            border-radius: 10px;
            transition: width .6s cubic-bezier(.4,0,.2,1);
        }
        .kpi-prog-legend {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            font-size: 10px;
            color: var(--muted);
        }
        .kpi-prog-legend span {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .kpi-leg-dot {
            width: 8px; height: 8px;
            border-radius: 2px;
            flex-shrink: 0;
        }
        /* Divider between KPI and status cards */
        .order-section-divider {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 4px 0 10px;
        }
        .order-section-divider span {
            font-size: 10px;
            font-weight: 700;
            color: var(--muted);
            letter-spacing: .1em;
            text-transform: uppercase;
            white-space: nowrap;
        }
        .order-section-divider::before,
        .order-section-divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border);
        }

        /* ── Order Summary Cards ── */
        .order-summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
            gap: 8px;
            margin-bottom: 18px;
        }
        .osc {
            background: var(--bg3);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 10px 12px;
            text-align: center;
            transition: transform .15s;
            cursor: pointer;
        }
        .osc:hover { transform: translateY(-2px); }
        .osc.active { border-color: var(--gold); background: var(--gold-dim); }
        .osc-val { font-size: 22px; font-weight: 700; line-height: 1; font-family: var(--font-mono); }
        .osc-lbl { font-size: 10px; color: var(--muted); margin-top: 4px; }
        .osc-val.c-green  { color: var(--green); }
        .osc-val.c-gold   { color: var(--gold); }
        .osc-val.c-orange { color: var(--orange); }
        .osc-val.c-red    { color: #f87171; }
        .osc-val.c-blue   { color: #60a5fa; }
        .osc-val.c-muted  { color: var(--muted); }

        /* ── Filter & Search Bar ── */
        .order-toolbar {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
            margin-bottom: 14px;
        }
        .order-toolbar input[type=text] {
            flex: 1; min-width: 160px;
            padding: 7px 12px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--input-bg);
            color: var(--text);
            font-size: 13px;
        }
        .order-filter-btns { display: flex; gap: 6px; flex-wrap: wrap; }
        .ofbtn {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            border: 1px solid var(--border);
            background: var(--bg3);
            color: var(--muted);
            cursor: pointer;
            transition: all .15s;
        }
        .ofbtn:hover  { border-color: var(--gold); color: var(--gold); }
        .ofbtn.active { background: var(--gold); color: #111; border-color: var(--gold); }

        /* ── Tab untuk Aktif/Selesai ── */
        .order-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            border-bottom: 1px solid var(--border);
            padding-bottom: 8px;
        }
        .order-tab-btn {
            padding: 8px 20px;
            border-radius: 30px;
            font-size: 12px;
            font-weight: 600;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--muted);
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .order-tab-btn.active {
            background: var(--gold);
            color: #111;
            border-color: var(--gold);
        }
        .order-tab-btn:hover:not(.active) {
            background: var(--gold-dim);
            color: var(--gold-light);
        }

        /* ── Order Status Badges ── */
        .os-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
        }
        .os-selesai  { background: #16a34a22; color: var(--green); border: 1px solid #16a34a55; }
        .os-terlambat{ background: #ef444422; color: #f87171;     border: 1px solid #ef444455; }
        .os-mendesak { background: #f9731622; color: var(--orange);border: 1px solid #f9731655; }
        .os-sebagian { background: #3b82f622; color: #60a5fa;     border: 1px solid #3b82f655; }
        .os-pending  { background: #6b728022; color: var(--muted); border: 1px solid #6b728055; }

        /* ── Prioritas Badge ── */
        .prio-urgent { display:inline-block; padding:2px 7px; border-radius:10px;
            font-size:10px; font-weight:700; background:#ef444420;
            color:#f87171; border:1px solid #ef444450; margin-left:4px; }
        .prio-normal { display:none; }

        /* ── Progress Bar ── */
        .order-progress-wrap {
            width: 100%; min-width: 80px;
            background: var(--bg3);
            border-radius: 6px;
            height: 8px;
            overflow: hidden;
            border: 1px solid var(--border);
            display: flex;
        }
        .order-progress-seg {
            height: 100%;
            transition: width .4s ease;
        }
        .order-progress-label {
            font-size: 10px;
            color: var(--muted);
            text-align: right;
            margin-top: 2px;
            display: flex;
            justify-content: space-between;
            gap: 4px;
        }

        /* ── Table ── */
        .order-tbl-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid var(--border); margin-top: 12px; }
        .order-tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
        .order-tbl thead tr { background: var(--bg3); border-bottom: 2px solid var(--gold-dim); }
        .order-tbl th { padding: 10px 12px; text-align: left; font-size: 11px;
            text-transform: uppercase; letter-spacing: .05em; color: var(--muted); white-space: nowrap; }
        .order-tbl th.r { text-align: right; }
        .order-tbl td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .order-tbl td.r { text-align: right; }
        .order-tbl tbody tr:last-child td { border-bottom: none; }
        .order-tbl tbody tr:hover { background: var(--gold-dim) !important; }
        .order-tbl tbody tr.row-terlambat { background: #ef444408; }
        .order-tbl tbody tr.row-mendesak  { background: #f9731608; }

        .order-po { font-weight: 700; color: var(--gold); font-family: monospace; font-size: 13px; }
        .order-company { font-size: 13px; color: var(--text); }
        .order-date { font-size: 12px; color: var(--muted); }
        .deadline-normal { font-size: 11px; color: var(--muted); }
        .deadline-soon   { font-size: 11px; color: var(--orange); font-weight: 600; }
        .deadline-over   { font-size: 11px; color: #f87171; font-weight: 700; }
        .no-deadline     { font-size: 11px; color: var(--muted); font-style: italic; }

        .sisa-ok   { color: var(--green); font-weight: 600; }
        .sisa-warn { color: var(--orange); font-weight: 600; }
        .sisa-crit { color: #f87171; font-weight: 700; }

        /* ── Thickness Variant Chips ── */
        .tebal-chips-wrap {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
        }
        .tebal-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: var(--gold-dim);
            color: var(--gold);
            border: 1px solid rgba(200,160,80,.3);
            border-radius: 20px;
            padding: 3px 9px;
            font-size: 10px;
            font-weight: 700;
            font-family: var(--font-mono);
            white-space: nowrap;
        }
        .tebal-chip .tebal-vol {
            font-weight: 400;
            color: var(--muted);
            font-size: 9px;
            border-left: 1px solid rgba(200,160,80,.25);
            padding-left: 5px;
            margin-left: 1px;
        }
        .tebal-unknown {
            background: rgba(107,114,128,.15);
            color: var(--muted);
            border-color: rgba(107,114,128,.3);
        }

        /* ── Detail Panel ── */
        .order-detail-panel {
            background: var(--bg3);
            border: 1px solid var(--gold-dim);
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 18px;
            animation: slideDown .2s ease;
        }
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-8px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .detail-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 14px;
            flex-wrap: wrap;
            gap: 10px;
        }
        .detail-title { font-size: 15px; font-weight: 700; color: var(--gold); }
        .detail-meta  { font-size: 12px; color: var(--muted); margin-top: 2px; }
        .detail-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
            gap: 10px;
            margin-bottom: 14px;
        }
        .dstat { background: var(--bg2, var(--bg)); border: 1px solid var(--border);
            border-radius: 8px; padding: 10px; text-align: center; }
        .dstat-val { font-size: 20px; font-weight: 700; }
        .dstat-lbl { font-size: 10px; color: var(--muted); margin-top: 2px; }
        .detail-progress {
            background: var(--border);
            border-radius: 8px; height: 12px;
            overflow: hidden; margin-bottom: 6px;
            display: flex;
        }
        .detail-progress-seg {
            height: 100%;
            transition: width .5s ease;
        }
        .detail-progress-legend {
            display: flex; gap: 12px; flex-wrap: wrap;
            margin-bottom: 12px; font-size: 10px; color: var(--muted);
        }
        .detail-progress-legend span {
            display: flex; align-items: center; gap: 4px;
        }
        .legend-dot {
            width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0;
        }
        .detail-shipments-title {
            font-size: 12px; font-weight: 600; color: var(--muted);
            text-transform: uppercase; letter-spacing: .08em;
            margin-bottom: 8px;
        }
        .shipment-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 10px;
            border-radius: 8px;
            background: var(--bg);
            border: 1px solid var(--border);
            margin-bottom: 6px;
            font-size: 12px;
            flex-wrap: wrap;
            gap: 6px;
        }
        .shipment-date { color: var(--muted); }
        .shipment-vol  { color: var(--green); font-weight: 700; }
        .shipment-retur { color: #f87171; }
        .shipment-truck { color: var(--muted); font-style: italic; }
        .no-shipment { text-align: center; color: var(--muted); padding: 16px;
            font-size: 13px; font-style: italic; }

        /* ── Responsive ── */
        @media (max-width: 640px) {
            .order-tbl th:nth-child(6),
            .order-tbl td:nth-child(6) { display: none; }
        }
    `;
    document.head.appendChild(style);
}

// ─────────────────────────────────────────────
// RENDER UTAMA
// ─────────────────────────────────────────────
window.renderOrder = function() {
    injectOrderStyles();
    const container = document.getElementById('order-list');
    if (!container) return;

    const orders = window.orderList || [];

    // ── Hitung data setiap order ──
    const enriched = orders.map(o => ({ o, ...getOrderStatus(o) }));

    // ── Pisahkan berdasarkan status selesai ──
    const activeOrders = enriched.filter(x => x.status !== 'Selesai');
    const completedOrders = enriched.filter(x => x.status === 'Selesai');

    // ── Summary counts ──
    const total = enriched.length;
    const aktif = activeOrders.length;
    const selesai = completedOrders.length;
    const sebagian = enriched.filter(x => x.status === 'Sebagian').length;
    const mendesak = enriched.filter(x => x.status === 'Mendesak').length;
    const terlambat = enriched.filter(x => x.status === 'Terlambat').length;
    const pending = enriched.filter(x => x.status === 'Pending').length;

    // ── Volume KPI calculations ──
    const totalVolumeOrder    = enriched.reduce((s, x) => s + (x.o.volumeOrder || 0), 0);
    const totalVolumeTerkirim = enriched.reduce((s, x) => s + x.terkirim, 0);
    const totalVolumeStok     = enriched.reduce((s, x) => s + x.stokBoard, 0);
    const totalVolumeSisa     = enriched.reduce((s, x) => s + x.sisa, 0);
    const totalSisaAktif      = activeOrders.reduce((s, x) => s + x.sisa, 0);
    const totalVolumeAktif    = activeOrders.reduce((s, x) => s + (x.o.volumeOrder || 0), 0);
    const pctOverall          = totalVolumeOrder > 0 ? (totalVolumeTerkirim / totalVolumeOrder * 100) : 0;
    const pctStokBar          = totalVolumeOrder > 0 ? (Math.min(totalVolumeSisa, totalVolumeStok) / totalVolumeOrder * 100) : 0;

    document.getElementById('order-count').textContent = total + ' order';

    // ── Filter & Search (diterapkan ke data yang akan ditampilkan sesuai tab) ──
    let currentData = (orderActiveTab === 'active') ? activeOrders : completedOrders;
    
    // Filter status tambahan (hanya untuk tab aktif, karena tab selesai hanya menampilkan status Selesai)
    if (orderActiveTab === 'active' && orderFilterStatus !== 'semua') {
        currentData = currentData.filter(x => x.status.toLowerCase() === orderFilterStatus);
    }
    if (orderSearchQuery) {
        const q = orderSearchQuery.toLowerCase();
        currentData = currentData.filter(x =>
            x.o.kodePO.toLowerCase().includes(q) ||
            x.o.perusahaan.toLowerCase().includes(q)
        );
    }

    // Urutkan: untuk aktif: terlambat → mendesak → sebagian → pending
    // untuk selesai: berdasarkan tanggal deadline atau tanggal order terbaru
    if (orderActiveTab === 'active') {
        const order_rank = { Terlambat:0, Mendesak:1, Sebagian:2, Pending:3 };
        currentData.sort((a, b) => (order_rank[a.status] || 99) - (order_rank[b.status] || 99)
            || (a.o.deadline || 'z').localeCompare(b.o.deadline || 'z'));
    } else {
        // Selesai: urutkan dari yang terbaru (berdasarkan deadline atau tanggal)
        currentData.sort((a, b) => (b.o.deadline || b.o.tanggal).localeCompare(a.o.deadline || a.o.tanggal));
    }

    // ─────────────────────────
    // Render HTML
    // ─────────────────────────
    let html = `
        <!-- ══ VOLUME KPI SECTION ══ -->
        <div class="order-kpi-section">
            <div class="order-kpi-header">
                <span class="order-kpi-title">Volume Order (m³)</span>
            </div>

            <div class="order-kpi-grid">
                <!-- Total Volume Order -->
                <div class="okpi kpi-gold">
                    <span class="okpi-icon">📦</span>
                    <div class="okpi-val">${fmtDec(totalVolumeOrder, 2)}<span class="okpi-unit">m³</span></div>
                    <div class="okpi-lbl">Total Volume Order</div>
                    <div class="okpi-sub">${total} order terdaftar</div>
                </div>

                <!-- Volume Terkirim -->
                <div class="okpi kpi-green">
                    <span class="okpi-icon">🚛</span>
                    <div class="okpi-val">${fmtDec(totalVolumeTerkirim, 2)}<span class="okpi-unit">m³</span></div>
                    <div class="okpi-lbl">Sudah Terkirim</div>
                    <div class="okpi-sub">${pctOverall.toFixed(1)}% dari total order</div>
                </div>

                <!-- Stok Board -->
                <div class="okpi kpi-blue">
                    <span class="okpi-icon">🏗️</span>
                    <div class="okpi-val">${fmtDec(totalVolumeStok, 2)}<span class="okpi-unit">m³</span></div>
                    <div class="okpi-lbl">Stok Board Siap</div>
                    <div class="okpi-sub">Siap kirim ke buyer</div>
                </div>

                <!-- Sisa Belum Dikerjakan (fokus order aktif) -->
                <div class="okpi ${totalSisaAktif > 0 ? (terlambat > 0 ? 'kpi-red' : (mendesak > 0 ? 'kpi-orange' : 'kpi-orange')) : 'kpi-green'}">
                    <span class="okpi-icon">${totalSisaAktif > 0 ? '⏳' : '✅'}</span>
                    <div class="okpi-val">${fmtDec(totalSisaAktif, 2)}<span class="okpi-unit">m³</span></div>
                    <div class="okpi-lbl">Sisa Belum Dikirim</div>
                    <div class="okpi-sub">${aktif} order masih aktif</div>
                </div>

                <!-- % Pemenuhan -->
                <div class="okpi kpi-gold">
                    <span class="okpi-icon">📊</span>
                    <div class="okpi-val">${pctOverall.toFixed(1)}<span class="okpi-unit">%</span></div>
                    <div class="okpi-lbl">Pemenuhan Keseluruhan</div>
                    <div class="okpi-sub">${selesai} order selesai</div>
                </div>
            </div>

            <!-- Overall Progress Bar -->
            <div class="order-kpi-progress-wrap">
                <div class="kpi-prog-header">
                    <span class="kpi-prog-label">📈 Progres Keseluruhan Volume</span>
                    <span class="kpi-prog-pct">${pctOverall.toFixed(1)}%</span>
                </div>
                <div class="kpi-prog-bar">
                    <div class="kpi-prog-seg"
                        style="width:${Math.min(100,pctOverall).toFixed(2)}%; background:var(--green); border-radius:10px 0 0 10px;"></div>
                    <div class="kpi-prog-seg"
                        style="width:${Math.min(100-pctOverall,pctStokBar).toFixed(2)}%; background:#60a5fa;"></div>
                </div>
                <div class="kpi-prog-legend">
                    <span><div class="kpi-leg-dot" style="background:var(--green);"></div>Terkirim: ${fmtDec(totalVolumeTerkirim,2)} m³</span>
                    <span><div class="kpi-leg-dot" style="background:#60a5fa;"></div>Stok Siap: ${fmtDec(totalVolumeStok,2)} m³</span>
                    <span><div class="kpi-leg-dot" style="background:var(--border);"></div>Sisa: ${fmtDec(totalSisaAktif,2)} m³</span>
                    <span style="margin-left:auto; color:var(--gold); font-weight:700;">Total: ${fmtDec(totalVolumeOrder,2)} m³</span>
                </div>
            </div>
        </div>

        <!-- ══ STATUS ORDER ══ -->
        <div class="order-section-divider"><span>Status Order</span></div>

        <!-- Summary Cards -->
        <div class="order-summary-grid">
            <div class="osc" onclick="setOrderFilter('semua')">
                <div class="osc-val c-gold">${total}</div>
                <div class="osc-lbl">Total Order</div>
            </div>
            <div class="osc" onclick="switchOrderTab('active')">
                <div class="osc-val c-blue">${aktif}</div>
                <div class="osc-lbl">🟢 Aktif</div>
            </div>
            <div class="osc" onclick="switchOrderTab('completed')">
                <div class="osc-val c-green">${selesai}</div>
                <div class="osc-lbl">✅ Selesai</div>
            </div>
            <div class="osc ${orderFilterStatus==='sebagian'?'active':''}" onclick="setOrderFilter('sebagian')">
                <div class="osc-val c-blue">${sebagian}</div>
                <div class="osc-lbl">🔵 Sebagian</div>
            </div>
            <div class="osc ${orderFilterStatus==='mendesak'?'active':''}" onclick="setOrderFilter('mendesak')">
                <div class="osc-val c-orange">${mendesak}</div>
                <div class="osc-lbl">🟠 Mendesak</div>
            </div>
            <div class="osc ${orderFilterStatus==='terlambat'?'active':''}" onclick="setOrderFilter('terlambat')">
                <div class="osc-val c-red">${terlambat}</div>
                <div class="osc-lbl">🔴 Terlambat</div>
            </div>
            <div class="osc ${orderFilterStatus==='pending'?'active':''}" onclick="setOrderFilter('pending')">
                <div class="osc-val c-muted">${pending}</div>
                <div class="osc-lbl">⚪ Pending</div>
            </div>
        </div>

        <!-- Tab Navigation -->
        <div class="order-tabs">
            <button class="order-tab-btn ${orderActiveTab === 'active' ? 'active' : ''}" onclick="switchOrderTab('active')">🟢 Order Aktif</button>
            <button class="order-tab-btn ${orderActiveTab === 'completed' ? 'active' : ''}" onclick="switchOrderTab('completed')">✅ Order Selesai</button>
        </div>

        <!-- Search Bar -->
        <div class="order-toolbar">
            <input type="text" id="order-search-input"
                placeholder="🔍 Cari kode PO atau perusahaan..."
                value="${escapeHtml(orderSearchQuery)}"
                oninput="onOrderSearch(this.value)">
        </div>
    `;

    // ── Detail Panel (jika ada yang dibuka) ──
    if (orderDetailId) {
        const found = currentData.find(x => x.o.id === orderDetailId);
        if (found) html += renderDetailPanel(found);
    }

    if (!currentData.length) {
        html += `<div class="empty-state" style="padding:40px; text-align:center; color:var(--muted);">
            📭 Tidak ada order ${orderActiveTab === 'active' ? 'aktif' : 'selesai'} yang sesuai filter.
        </div>`;
    } else {
        html += `
        <div class="order-tbl-wrap">
            <table class="order-tbl">
                <thead>
                    <tr>
                        <th>Kode PO</th>
                        <th>Perusahaan</th>
                        <th>Tgl / Deadline</th>
                        <th>Varian Ketebalan</th>
                        <th>Progress</th>
                        <th class="r">Sisa (m³)</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;

        currentData.forEach(({ o, terkirim, sisa, persen, status, statusClass, statusIcon, terlambat, mendesak, stokBoard }) => {
            const rowClass = terlambat ? 'row-terlambat' : (mendesak ? 'row-mendesak' : '');
            const progressColor = sisa <= 0 ? '#22c55e' : (terlambat ? '#f87171' : (mendesak ? '#f97316' : '#d4a017'));
            const sisaClass = sisa <= 0 ? 'sisa-ok' : (terlambat ? 'sisa-crit' : 'sisa-warn');

            let deadlineHtml = '<span class="no-deadline">—</span>';
            if (o.deadline) {
                const daysLeft = diffDaysOrder(today(), o.deadline);
                if (terlambat) {
                    deadlineHtml = `<span class="deadline-over">📅 ${fmtDate(o.deadline)}<br>⚠️ Lewat ${Math.abs(daysLeft)} hari</span>`;
                } else if (mendesak) {
                    deadlineHtml = `<span class="deadline-soon">📅 ${fmtDate(o.deadline)}<br>⏰ ${daysLeft} hari lagi</span>`;
                } else {
                    deadlineHtml = `<span class="deadline-normal">📅 ${fmtDate(o.deadline)}</span>`;
                }
            }

            const prioHtml = o.prioritas === 'urgent' ? `<span class="prio-urgent">URGENT</span>` : '';

            // ── Variant ketebalan chips ──
            const variants = migrateOrderVariants(o);
            const variantHtml = variants.length
                ? variants.map(v => v.ketebalan
                    ? `<span class="tebal-chip">${v.ketebalan}mm<span class="tebal-vol">${fmtDec(v.volume,2)}</span></span>`
                    : `<span class="tebal-chip tebal-unknown">?mm<span class="tebal-vol">${fmtDec(v.volume,2)}</span></span>`
                ).join('')
                : `<span style="color:var(--muted);font-size:10px;">—</span>`;

            const volHtml = `<div class="tebal-chips-wrap">${variantHtml}</div>
                <div style="font-size:10px;color:var(--muted);margin-top:3px;text-align:right;">
                    Total: <b style="color:var(--gold);">${fmtDec(o.volumeOrder,2)} m³</b>
                </div>`;

            html += `
                <tr class="${rowClass}" style="cursor:pointer;" onclick="toggleOrderDetail('${o.id}')">
                    <td>
                        <div class="order-po">${escapeHtml(o.kodePO)}${prioHtml}</div>
                    </td>
                    <td><div class="order-company">${escapeHtml(o.perusahaan)}</div>
                        <div class="order-date">${fmtDate(o.tanggal)}</div>
                    </td>
                    <td>${deadlineHtml}</td>
                    <td>${volHtml}</td>
                    <td>
                        <div class="order-progress-wrap">${(() => {
                            const vol   = o.volumeOrder || 1;
                            const pKirim = Math.min(100, terkirim / vol * 100);
                            const sisaVol = Math.max(0, vol - terkirim);
                            const pStok  = Math.min(sisaVol, stokBoard) / vol * 100;
                            return `
                                <div class="order-progress-seg" title="Terkirim: ${fmtDec(terkirim,2)} m³"
                                    style="width:${pKirim.toFixed(2)}%; background:#22c55e;"></div>
                                <div class="order-progress-seg" title="Stok Board: ${fmtDec(stokBoard,2)} m³"
                                    style="width:${pStok.toFixed(2)}%; background:#60a5fa;"></div>`;
                        })()}</div>
                        <div class="order-progress-label">
                            <span style="color:#22c55e;">▪ ${fmtDec(terkirim,2)}</span>
                            ${stokBoard>0 ? `<span style="color:#60a5fa;">▪ ${fmtDec(stokBoard,2)}</span>` : ''}
                            <span>${persen.toFixed(1)}%</span>
                        </div>
                    </td>
                    <td class="r"><span class="${sisaClass}">${fmtDec(sisa, 2)}</span></td>
                    <td><span class="os-badge ${statusClass}">${statusIcon} ${status}</span></td>
                    <td onclick="event.stopPropagation()">
                        <button class="btn-icon edit" onclick="window.editOrder('${o.id}')" title="Edit">✏️</button>
                        <button class="btn-icon delete" onclick="window.deleteOrder('${o.id}')" title="Hapus">🗑️</button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
    }

    container.innerHTML = html;
};

// ─────────────────────────────────────────────
// SWITCH TAB
// ─────────────────────────────────────────────
window.switchOrderTab = function(tab) {
    orderActiveTab = tab;
    orderDetailId = null; // tutup detail panel saat ganti tab
    window.renderOrder();
};

// ─────────────────────────────────────────────
// DETAIL PANEL — Riwayat Pengiriman per Order
// ─────────────────────────────────────────────
function renderDetailPanel({ o, terkirim, sisa, persen, stokBoard, status, statusClass, statusIcon }) {
    const shipments = (window.penjualanList || [])
        .filter(p => p.orderId === o.id)
        .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));

    const progressColor = sisa <= 0 ? '#22c55e'
        : (status === 'Terlambat' ? '#f87171'
        : (status === 'Mendesak'  ? '#f97316' : '#d4a017'));

    let shipmentsHtml = '';
    if (!shipments.length) {
        shipmentsHtml = `<div class="no-shipment">Belum ada pengiriman untuk order ini.</div>`;
    } else {
        shipments.forEach((p, i) => {
            const netto = (p.volume || 0) - (p.retur || 0);
            const returHtml = p.retur > 0
                ? `<span class="shipment-retur"> (Retur: ${fmtDec(p.retur,2)} m³)</span>` : '';
            shipmentsHtml += `
                <div class="shipment-item">
                    <span class="shipment-date">#${i+1} · ${fmtDate(p.tanggal)}</span>
                    <span><span class="shipment-vol">+${fmtDec(netto,2)} m³</span>${returHtml}</span>
                    <span class="shipment-truck">🚛 ${escapeHtml(p.noTruk||'—')} → ${escapeHtml(p.tujuan||'—')}</span>
                </div>
            `;
        });
    }

    const deadlineInfo = o.deadline
        ? `Deadline: <strong>${fmtDate(o.deadline)}</strong>`
        : 'Deadline: <em>tidak ditentukan</em>';

    const catatanInfo = o.catatan
        ? `<div style="margin-top:6px; font-size:11px; color:var(--muted);">📝 ${escapeHtml(o.catatan)}</div>` : '';

    return `
        <div class="order-detail-panel">
            <div class="detail-header">
                <div>
                    <div class="detail-title">📦 ${escapeHtml(o.kodePO)} — ${escapeHtml(o.perusahaan)}</div>
                    <div class="detail-meta">${deadlineInfo} &nbsp;|&nbsp; <span class="os-badge ${statusClass}">${statusIcon} ${status}</span></div>
                    ${catatanInfo}
                </div>
                <button class="btn btn-sm btn-secondary" onclick="toggleOrderDetail('${o.id}')">✖ Tutup</button>
            </div>

            <div class="detail-stats">
                <div class="dstat">
                    <div class="dstat-val" style="color:var(--gold);">${fmtDec(o.volumeOrder,2)}</div>
                    <div class="dstat-lbl">Volume Order (m³)</div>
                </div>
                <div class="dstat">
                    <div class="dstat-val" style="color:#22c55e;">${fmtDec(terkirim,2)}</div>
                    <div class="dstat-lbl">Sudah Terkirim (m³)</div>
                </div>
                <div class="dstat">
                    <div class="dstat-val" style="color:#60a5fa;">${fmtDec(stokBoard,2)}</div>
                    <div class="dstat-lbl">Stok Board (m³)</div>
                </div>
                <div class="dstat">
                    <div class="dstat-val" style="color:${sisa>0?'#f97316':'#22c55e'};">${fmtDec(sisa,2)}</div>
                    <div class="dstat-lbl">Sisa Belum Kirim (m³)</div>
                </div>
                <div class="dstat">
                    <div class="dstat-val" style="color:var(--gold);">${persen.toFixed(1)}%</div>
                    <div class="dstat-lbl">Pemenuhan</div>
                </div>
                <div class="dstat">
                    <div class="dstat-val">${shipments.length}</div>
                    <div class="dstat-lbl">Pengiriman</div>
                </div>
            </div>

            <!-- Varian Ketebalan Breakdown -->
            ${(() => {
                const variants = migrateOrderVariants(o);
                if (!variants.length) return '';
                const rows = variants.map(v => {
                    const pct = o.volumeOrder > 0 ? (v.volume / o.volumeOrder * 100).toFixed(1) : '0';
                    return `
                    <div style="display:flex;justify-content:space-between;align-items:center;
                                padding:7px 10px;background:var(--bg);border:1px solid var(--border);
                                border-radius:8px;font-size:12px;margin-bottom:5px;">
                        <span class="tebal-chip" style="pointer-events:none;">
                            ${v.ketebalan ? v.ketebalan+'mm' : '?mm'}
                        </span>
                        <div style="display:flex;align-items:center;gap:12px;">
                            <span style="font-family:var(--font-mono);color:var(--gold);font-weight:700;">
                                ${fmtDec(v.volume,2)} m³
                            </span>
                            <span style="font-size:10px;color:var(--muted);">${pct}%</span>
                            <div style="width:80px;height:5px;background:var(--border);border-radius:3px;overflow:hidden;">
                                <div style="height:100%;width:${pct}%;background:var(--gold);border-radius:3px;"></div>
                            </div>
                        </div>
                    </div>`;
                }).join('');
                return `<div style="margin-bottom:12px;">
                    <div class="detail-shipments-title" style="margin-bottom:8px;">📐 Varian Ketebalan</div>
                    ${rows}
                </div>`;
            })()}

            <div class="detail-progress">
                ${(() => {
                    const vol    = o.volumeOrder || 1;
                    const pKirim = Math.min(100, terkirim / vol * 100);
                    const sisaVol = Math.max(0, vol - terkirim);
                    const pStok  = Math.min(sisaVol, stokBoard) / vol * 100;
                    return `
                        <div class="detail-progress-seg"
                            title="Terkirim: ${fmtDec(terkirim,2)} m³"
                            style="width:${pKirim.toFixed(2)}%; background:#22c55e;"></div>
                        <div class="detail-progress-seg"
                            title="Stok Board: ${fmtDec(stokBoard,2)} m³"
                            style="width:${pStok.toFixed(2)}%; background:#60a5fa;"></div>`;
                })()}
            </div>
            <div class="detail-progress-legend">
                <span><div class="legend-dot" style="background:#22c55e;"></div>Terkirim: ${fmtDec(terkirim,2)} m³</span>
                <span><div class="legend-dot" style="background:#60a5fa;"></div>Stok Board: ${fmtDec(stokBoard,2)} m³</span>
                <span><div class="legend-dot" style="background:var(--border);"></div>Sisa: ${fmtDec(sisa,2)} m³</span>
            </div>

            <div class="detail-shipments-title">🚛 Riwayat Pengiriman</div>
            ${shipmentsHtml}
        </div>
    `;
}

// ─────────────────────────────────────────────
// EVENT HANDLERS
// ─────────────────────────────────────────────
window.toggleOrderDetail = function(id) {
    orderDetailId = (orderDetailId === id) ? null : id;
    window.renderOrder();
};

window.setOrderFilter = function(status) {
    orderFilterStatus = status;
    window.renderOrder();
};

window.onOrderSearch = function(val) {
    orderSearchQuery = val;
    window.renderOrder();
};

// ─────────────────────────────────────────────
// FORM: Buka / Tutup / Simpan
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// VARIANT HELPERS
// ─────────────────────────────────────────────
const TEBAL_OPTIONS = ['6','9','12','15','18','20','25','30'];

// Migrate legacy single-thickness to variants array
function migrateOrderVariants(order) {
    if (order.ketebalanVariants && order.ketebalanVariants.length) return order.ketebalanVariants;
    if (order.ketebalanProduk) {
        return [{ ketebalan: order.ketebalanProduk, volume: order.volumeOrder || 0 }];
    }
    return [{ ketebalan: '', volume: order.volumeOrder || 0 }];
}
window.migrateOrderVariants = migrateOrderVariants;

// Compute total volume from variants
function computeVariantTotal() {
    const rows = document.querySelectorAll('.ov-row');
    let total = 0;
    rows.forEach(row => {
        total += parseFloat(row.querySelector('.ov-vol')?.value) || 0;
    });
    const el = document.getElementById('ov-total-display');
    if (el) {
        el.textContent = fmtDec(total, 2) + ' m³';
        el.style.color = total > 0 ? 'var(--gold)' : 'var(--muted)';
    }
}
window.computeVariantTotal = computeVariantTotal;
window.addVariantRow       = addVariantRow;

// Collect variants from form
function collectVariants() {
    const rows = document.querySelectorAll('.ov-row');
    const variants = [];
    rows.forEach(row => {
        const k = row.querySelector('.ov-ket')?.value || '';
        const v = parseFloat(row.querySelector('.ov-vol')?.value) || 0;
        if (v > 0) variants.push({ ketebalan: k, volume: v });
    });
    return variants;
}

// Render variant rows
function renderVariantRows(variants) {
    const tbody = document.getElementById('ov-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    variants.forEach((vr, i) => addVariantRow(vr, i));
    computeVariantTotal();
}

function addVariantRow(vr = { ketebalan: '', volume: '' }, idx = null) {
    const tbody = document.getElementById('ov-tbody');
    if (!tbody) return;
    const id = Date.now() + Math.random();
    const opts = TEBAL_OPTIONS.map(v =>
        `<option value="${v}"${vr.ketebalan == v ? ' selected' : ''}>${v} mm</option>`
    ).join('');
    const tr = document.createElement('tr');
    tr.className = 'ov-row';
    tr.style.cssText = 'background:transparent;';
    tr.innerHTML = `
        <td style="padding:5px 8px;">
            <select class="ov-ket" style="background:var(--input-bg);border:1px solid var(--border);
                color:var(--text);padding:6px 10px;border-radius:6px;font-size:12px;
                font-family:var(--font-mono);width:100%;cursor:pointer;">
                <option value="">-- Tebal --</option>${opts}
            </select>
        </td>
        <td style="padding:5px 8px;">
            <input type="number" step="any" min="0" class="ov-vol"
                value="${vr.volume || ''}" placeholder="0.000"
                style="background:var(--input-bg);border:1px solid var(--border);
                       color:var(--text);padding:6px 10px;border-radius:6px;
                       font-size:12px;font-family:var(--font-mono);width:100%;text-align:right;"
                oninput="computeVariantTotal()">
        </td>
        <td style="padding:5px 8px;text-align:center;">
            <button type="button" onclick="this.closest('.ov-row').remove();computeVariantTotal();"
                style="background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.3);
                       border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:13px;
                       display:inline-flex;align-items:center;justify-content:center;"
                title="Hapus varian">✕</button>
        </td>`;
    tbody.appendChild(tr);
}

function buildVariantsSection(variants) {
    const sec = document.getElementById('order-variants-section');
    if (!sec) return;
    sec.innerHTML = `
        <div style="margin:14px 0 6px;padding-top:12px;border-top:1px solid var(--border);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="width:3px;height:14px;background:var(--gold);border-radius:2px;display:inline-block;"></span>
                    <span style="font-size:12px;font-weight:700;color:var(--text);">📐 Varian Ketebalan & Volume</span>
                </div>
                <button type="button" onclick="addVariantRow();computeVariantTotal();"
                    style="background:var(--gold-dim);color:var(--gold);border:1px solid rgba(200,160,80,.35);
                           border-radius:20px;padding:5px 14px;font-size:11px;font-weight:700;cursor:pointer;">
                    + Tambah Varian
                </button>
            </div>
            <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:8px;">
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                    <thead>
                        <tr style="background:var(--bg3);border-bottom:1px solid var(--border);">
                            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;
                                       letter-spacing:.06em;color:var(--muted);width:180px;">Ketebalan (mm)</th>
                            <th style="padding:8px 10px;text-align:right;font-size:10px;text-transform:uppercase;
                                       letter-spacing:.06em;color:var(--muted);">Volume (m³)</th>
                            <th style="width:40px;"></th>
                        </tr>
                    </thead>
                    <tbody id="ov-tbody"></tbody>
                </table>
            </div>
            <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;
                        padding:8px 12px;background:var(--bg3);border-radius:8px;
                        border:1px solid var(--gold-dim);">
                <span style="font-size:11px;color:var(--muted);">Total Volume Order:</span>
                <span id="ov-total-display" style="font-size:18px;font-weight:800;
                      font-family:var(--font-mono);color:var(--muted);">0.00 m³</span>
            </div>
        </div>`;
    renderVariantRows(variants);
}

// ─────────────────────────────────────────────
// FORM: Buka / Tutup / Simpan
// ─────────────────────────────────────────────
window.openOrderForm = function(item) {
    orderEditId = item?.id || null;
    document.getElementById('order-tanggal').value    = item?.tanggal    || today();
    document.getElementById('order-po').value         = item?.kodePO     || '';
    document.getElementById('order-perusahaan').value = item?.perusahaan || '';

    // Build variants section
    const variants = item ? migrateOrderVariants(item) : [{ ketebalan: '', volume: '' }];
    buildVariantsSection(variants);

    // Extra fields (deadline, prioritas, catatan)
    ensureExtraOrderFields();
    document.getElementById('order-deadline').value  = item?.deadline  || '';
    document.getElementById('order-prioritas').value = item?.prioritas || 'normal';
    document.getElementById('order-catatan').value   = item?.catatan   || '';

    document.getElementById('order-input').classList.remove('hidden');
    document.getElementById('order-list').classList.add('hidden');
};

window.closeOrderForm = function() {
    document.getElementById('order-input').classList.add('hidden');
    document.getElementById('order-list').classList.remove('hidden');
    orderEditId = null;
    const sec = document.getElementById('order-variants-section');
    if (sec) sec.innerHTML = '';
    const ext = document.getElementById('order-extra-fields');
    if (ext) ext.innerHTML = '';
};

function ensureExtraOrderFields() {
    if (document.getElementById('order-deadline')) return;
    const ext = document.getElementById('order-extra-fields');
    if (!ext) return;
    ext.innerHTML = `
        <div class="grid2" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
            <div class="field">
                <label>Deadline Pengiriman</label>
                <input type="date" id="order-deadline">
            </div>
            <div class="field">
                <label>Prioritas</label>
                <select id="order-prioritas">
                    <option value="normal">Normal</option>
                    <option value="urgent">🔴 Urgent</option>
                </select>
            </div>
            <div class="field" style="grid-column:span 2;">
                <label>Catatan</label>
                <input type="text" id="order-catatan" placeholder="Keterangan tambahan (opsional)">
            </div>
        </div>`;
}

window.saveOrder = function() {
    const tgl        = document.getElementById('order-tanggal').value.trim();
    const po         = document.getElementById('order-po').value.trim();
    const perusahaan = document.getElementById('order-perusahaan').value.trim();
    const deadline   = document.getElementById('order-deadline')?.value || '';
    const prioritas  = document.getElementById('order-prioritas')?.value || 'normal';
    const catatan    = document.getElementById('order-catatan')?.value.trim() || '';

    if (!tgl || !po || !perusahaan) {
        toast('⚠️ Tanggal, Kode PO, dan Perusahaan wajib diisi!');
        return;
    }

    // Collect variants
    const variants = collectVariants();
    if (!variants.length || variants.every(v => v.volume <= 0)) {
        toast('⚠️ Tambahkan minimal 1 varian ketebalan dengan volume > 0!');
        return;
    }

    const duplikat = (window.orderList || []).find(
        o => o.kodePO.toLowerCase() === po.toLowerCase() && o.id !== orderEditId
    );
    if (duplikat) {
        toast(`⚠️ Kode PO "${po}" sudah ada! Gunakan kode yang berbeda.`);
        return;
    }

    // Total volume = sum of all variants
    const totalVolume = variants.reduce((s, v) => s + v.volume, 0);

    const item = {
        id:                orderEditId || uid(),
        tanggal:           tgl,
        kodePO:            po,
        perusahaan:        perusahaan,
        volumeOrder:       totalVolume,
        ketebalanVariants: variants,
        deadline:          deadline,
        prioritas:         prioritas,
        catatan:           catatan
    };

    if (orderEditId) {
        window.orderList = window.orderList.map(o => o.id === orderEditId ? item : o);
        logActivity('Update', 'Order', `PO: ${item.kodePO}`);
    } else {
        window.orderList.push(item);
        logActivity('Simpan', 'Order', `PO: ${item.kodePO}`);
    }

    persistAll();
    closeOrderForm();
    window.updateAllOrderSummaries();
    if (typeof renderPenjualan === 'function') renderPenjualan();
    if (typeof populateOrderDropdown === 'function') populateOrderDropdown();
    window.renderOrder();
    toast('✅ Order disimpan!');
};

window.deleteOrder = function(id) {
    const item = (window.orderList || []).find(o => o.id === id);
    if (item) logActivity('Hapus', 'Order', `PO: ${item.kodePO}`);
    if (!confirmDialog('Hapus order ini?')) return;
    const terkait = (window.penjualanList || []).filter(p => p.orderId === id);
    if (terkait.length > 0 && !confirmDialog(`Order ini memiliki ${terkait.length} pengiriman terkait. Hapus juga?`)) return;
    window.penjualanList = (window.penjualanList || []).filter(p => p.orderId !== id);
    window.orderList = (window.orderList || []).filter(o => o.id !== id);
    if (orderDetailId === id) orderDetailId = null;
    persistAll();
    window.updateAllOrderSummaries();
    if (typeof renderPenjualan === 'function') renderPenjualan();
    window.renderOrder();
    toast('🗑️ Order dihapus.');
};

window.editOrder = function(id) {
    const item = (window.orderList || []).find(o => o.id === id);
    if (item) window.openOrderForm(item);
};

window.updateAllOrderSummaries = function() {
    if (typeof renderBoardStockSummary === 'function') renderBoardStockSummary();
};

window.populateOrderDropdown = function(selectedOrderId = null) {
    const select = document.getElementById('jual-order');
    if (!select) return;
    select.innerHTML = '<option value="">-- Pilih Order --</option>';
    (window.orderList || []).forEach(o => {
        const terkirim  = window.getOrderTerpenuhi(o.id);
        const stokBoard = getLatestStockByOrderId(o.id);
        const sisa      = Math.max(0, o.volumeOrder - terkirim);
        if (sisa > 0 || o.id === selectedOrderId) {
            const opt = document.createElement('option');
            opt.value = o.id;
            opt.textContent = `${o.kodePO} - ${o.perusahaan} (Sisa: ${fmtDec(sisa,2)} m³)`;
            if (o.id === selectedOrderId) opt.selected = true;
            select.appendChild(opt);
        }
    });
    if (selectedOrderId && !select.querySelector(`option[value="${selectedOrderId}"]`)) {
        const o = (window.orderList || []).find(o => o.id === selectedOrderId);
        if (o) {
            const opt = document.createElement('option');
            opt.value = o.id;
            opt.textContent = `${o.kodePO} - ${o.perusahaan} (Selesai)`;
            opt.selected = true;
            opt.disabled = true;
            select.appendChild(opt);
        }
    }
};

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m =>
        ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

// Init
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.orderList) window.renderOrder();
    }, 150);
});