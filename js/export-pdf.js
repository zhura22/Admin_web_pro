// export-pdf.js — Laporan Pencapaian Target Bulanan
// Menghasilkan halaman HTML yang siap di-print/save as PDF

window.exportTargetPDF = function (bulanParam) {

    /* ── 0. Setup data ─────────────────────────────────────── */
    const cfg   = window.appSettings || {};
    const bulan = bulanParam || thisMonth();
    const today_= today();

    const namaPerusahaan = cfg.namaPerusahaan      || 'UD. Karya Muda Surya Utama';
    const singkatan      = cfg.singkatanPerusahaan || 'KMSU';
    const lokasi         = cfg.lokasiPabrik        || 'Jawa Tengah';

    /* ── Target harian ──────────────────────────────────────── */
    const tKayu    = cfg.targetKayuHarian    || 10;
    const tSawmill = cfg.targetSawmillHarian || 8;
    const tPlaner  = cfg.targetPlanerHarian  || 3;
    const tPress   = cfg.targetPressHarian   || 1000;
    const tSeri    = cfg.targetSeriHarian    || 800;
    const tSezing  = cfg.targetSezingHarian  || 2;

    /* ── Target kumulatif s/d hari ini (atau akhir bulan) ───── */
    const endDate = today_ > bulan + '-31'
        ? getLastDayOfMonth(bulan)
        : (today_.startsWith(bulan) ? today_ : getLastDayOfMonth(bulan));

    const targetKayu    = getTargetCumulativeUpTo(endDate, tKayu);
    const targetSawmill = getTargetCumulativeUpTo(endDate, tSawmill);
    const targetPlaner  = getTargetCumulativeUpTo(endDate, tPlaner);
    const targetPress   = getTargetCumulativeUpTo(endDate, tPress);
    const targetSeri    = getTargetCumulativeUpTo(endDate, tSeri);
    const targetSezing  = getTargetCumulativeUpTo(endDate, tSezing);

    /* ── Realisasi ──────────────────────────────────────────── */
    const kayuBln = (window.kayuList     || []).filter(k => k.tanggal?.startsWith(bulan));
    const sawBln  = (window.sawmillList  || []).filter(s => s.tanggal?.startsWith(bulan));
    const prodBln = (window.produksiList || []).filter(p => p.tanggal?.startsWith(bulan));
    const sezBln  = (window.sezingList   || []).filter(s => s.tanggal?.startsWith(bulan));
    const jualBln = (window.penjualanList|| []).filter(j => j.tanggal?.startsWith(bulan));

    let rPlaner = 0, rPress = 0, rSeri = 0;
    prodBln.forEach(p => {
        const s1 = p.shift1 || {}, s2 = p.shift2 || {};
        rPlaner += (s1.planerBagus || 0) + (s2.planerBagus || 0);
        rPress  += (s1.press       || 0) + (s2.press       || 0);
        rSeri   += (s1.seri        || 0) + (s2.seri        || 0);
    });

    const rKayu    = kayuBln.reduce((a, k) => a + (k.volume        || 0), 0);
    const rSawmill = sawBln .reduce((a, s) => a + (s.prosesSawmill || 0), 0);
    const rSezing  = sezBln .reduce((a, s) => a + (s.volume        || 0), 0);
    const rJualNetto  = jualBln.reduce((a, j) => a + Math.max(0, (j.volume || 0) - (j.retur || 0)), 0);
    const rJualHarga  = jualBln.reduce((a, j) => a + (j.harga || 0), 0);
    const rJualRetur  = jualBln.reduce((a, j) => a + (j.retur || 0), 0);

    /* ── Hari efektif ──────────────────────────────────────── */
    let efDays = 0;
    const [yr, mo] = bulan.split('-').map(Number);
    let cur = new Date(yr, mo - 1, 1);
    const endObj = new Date(endDate);
    while (cur <= endObj) {
        if (isTargetDay(cur.toISOString().split('T')[0])) efDays++;
        cur.setDate(cur.getDate() + 1);
    }
    const totalDays = new Date(yr, mo, 0).getDate(); // hari dalam bulan

    /* ── Metrics array ─────────────────────────────────────── */
    const metrics = [
        { label: 'Kayu Masuk',    icon: '🪵', real: rKayu,    target: targetKayu,    unit: 'm³',  dec: true,  color: '#f97316', colorHex: '#f97316' },
        { label: 'Sawmill',       icon: '🪚', real: rSawmill,  target: targetSawmill, unit: 'm³',  dec: true,  color: '#eab308', colorHex: '#eab308' },
        { label: 'Planer Bagus',  icon: '📦', real: rPlaner,   target: targetPlaner,  unit: 'm³',  dec: true,  color: '#22c55e', colorHex: '#22c55e' },
        { label: 'Press',         icon: '🔩', real: rPress,    target: targetPress,   unit: 'lbr', dec: false, color: '#3b82f6', colorHex: '#3b82f6' },
        { label: 'Seri',          icon: '🔗', real: rSeri,     target: targetSeri,    unit: 'lbr', dec: false, color: '#8b5cf6', colorHex: '#8b5cf6' },
        { label: 'Sezing',        icon: '📏', real: rSezing,   target: targetSezing,  unit: 'm³',  dec: true,  color: '#06b6d4', colorHex: '#06b6d4' },
    ];

    /* ── Helper: format number ─────────────────────────────── */
    const fmtN  = (v, dec) => dec
        ? v.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : v.toLocaleString('id-ID');
    const fmtRp = v => {
        if (!v) return 'Rp 0';
        if (v >= 1e9) return 'Rp ' + (v / 1e9).toFixed(2) + ' M';
        if (v >= 1e6) return 'Rp ' + (v / 1e6).toFixed(1) + ' jt';
        return 'Rp ' + v.toLocaleString('id-ID');
    };

    const pct = (r, t) => t > 0 ? Math.min(100, (r / t) * 100) : 0;
    const getStatus = p => p >= 100 ? { label: 'TERCAPAI',  color: '#22c55e', bg: '#052e16' }
                         : p >= 75  ? { label: 'ON TRACK',  color: '#eab308', bg: '#1c1400' }
                         : p >= 50  ? { label: 'PERLU PACU',color: '#f97316', bg: '#1c0800' }
                         :            { label: 'KRITIS',    color: '#ef4444', bg: '#1c0404' };

    /* ── SVG donut gauge ────────────────────────────────────── */
    const donut = (p, color) => {
        const R = 28, C = 2 * Math.PI * R;
        const fill = (Math.min(p, 100) / 100) * C;
        return `<svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="${R}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="7"/>
            <circle cx="36" cy="36" r="${R}" fill="none" stroke="${color}" stroke-width="7"
                stroke-dasharray="${fill.toFixed(1)} ${C.toFixed(1)}"
                stroke-dashoffset="${(C / 4).toFixed(1)}"
                stroke-linecap="round"/>
            <text x="36" y="40" text-anchor="middle" fill="${color}"
                  font-size="12" font-weight="800" font-family="monospace">${p.toFixed(0)}%</text>
        </svg>`;
    };

    /* ── Build metric cards HTML ──────────────────────────── */
    const cardsHTML = metrics.map(m => {
        const p = pct(m.real, m.target);
        const st = getStatus(p);
        const valFmt = v => fmtN(v, m.dec);
        const sisa = m.target - m.real;
        const sisaText = sisa > 0
            ? `Sisa: ${valFmt(sisa)} ${m.unit}`
            : `Lebih: +${valFmt(Math.abs(sisa))} ${m.unit}`;
        return `
        <div style="background:#0f0f0f;border:1px solid rgba(255,255,255,.08);
                    border-radius:16px;padding:20px 18px;
                    border-top:3px solid ${m.color};
                    box-shadow:0 4px 24px rgba(0,0,0,.5);
                    display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;
                                color:rgba(255,255,255,.4);font-weight:600;margin-bottom:4px;">
                        ${m.icon} ${m.label}
                    </div>
                    <div style="font-size:26px;font-weight:800;color:#fff;
                                font-family:monospace;line-height:1;">
                        ${valFmt(m.real)}
                        <span style="font-size:12px;color:rgba(255,255,255,.4);font-weight:400;"> ${m.unit}</span>
                    </div>
                    <div style="font-size:10px;color:rgba(255,255,255,.35);margin-top:3px;">
                        Target: ${valFmt(m.target)} ${m.unit}
                    </div>
                </div>
                <div style="flex-shrink:0;">${donut(p, m.color)}</div>
            </div>
            <!-- Progress bar -->
            <div style="height:5px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${p.toFixed(1)}%;background:linear-gradient(90deg, ${m.color}99, ${m.color});
                            border-radius:3px;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:9.5px;color:rgba(255,255,255,.35);">${sisaText}</span>
                <span style="font-size:9px;font-weight:700;letter-spacing:.8px;
                             color:${st.color};background:${st.bg};
                             padding:2px 8px;border-radius:20px;border:1px solid ${st.color}44;">
                    ${st.label}
                </span>
            </div>
        </div>`;
    }).join('');

    /* ── Summary table ───────────────────────────────────── */
    const tableRows = metrics.map(m => {
        const p = pct(m.real, m.target);
        const st = getStatus(p);
        const valFmt = v => fmtN(v, m.dec);
        const barW = Math.min(p, 100).toFixed(1);
        return `<tr>
            <td style="padding:10px 14px;font-weight:600;white-space:nowrap;">${m.icon} ${m.label}</td>
            <td style="padding:10px 14px;text-align:right;font-family:monospace;color:#fff;">
                ${valFmt(m.real)} ${m.unit}</td>
            <td style="padding:10px 14px;text-align:right;font-family:monospace;color:rgba(255,255,255,.45);">
                ${valFmt(m.target)} ${m.unit}</td>
            <td style="padding:10px 14px;min-width:110px;">
                <div style="height:6px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden;">
                    <div style="height:100%;width:${barW}%;background:${m.color};border-radius:3px;"></div>
                </div>
            </td>
            <td style="padding:10px 14px;text-align:right;font-family:monospace;
                       font-weight:700;color:${m.color};">${p.toFixed(1)}%</td>
            <td style="padding:10px 14px;text-align:center;">
                <span style="font-size:9px;font-weight:700;letter-spacing:.6px;
                             color:${st.color};background:${st.bg};
                             padding:2px 8px;border-radius:20px;">${st.label}</span>
            </td>
        </tr>`;
    }).join('');

    /* ── Penjualan summary ───────────────────────────────── */
    const hargaPerM3 = rJualNetto > 0 ? rJualHarga / rJualNetto : 0;

    /* ── Overall achievement score ───────────────────────── */
    const overallPct = metrics.reduce((a, m) => a + pct(m.real, m.target), 0) / metrics.length;
    const overallSt  = getStatus(overallPct);

    /* ── Generated timestamp ─────────────────────────────── */
    const now = new Date();
    const tsCetak = now.toLocaleDateString('id-ID', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })
        + ' ' + now.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });

    /* ── Full HTML page ──────────────────────────────────── */
    const bulanLabel = formatBulan(bulan);

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Target Bulanan — ${bulanLabel} — ${singkatan}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: #050505;
            color: rgba(255,255,255,.85);
            min-height: 100vh;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* ── COVER HEADER ── */
        .cover {
            background: linear-gradient(135deg, #0a0a0a 0%, #111 40%, #0d0d14 100%);
            border-bottom: 1px solid rgba(255,255,255,.06);
            padding: 44px 56px 36px;
            position: relative;
            overflow: hidden;
        }
        .cover::before {
            content: '';
            position: absolute;
            top: -80px; right: -80px;
            width: 360px; height: 360px;
            background: radial-gradient(circle, rgba(234,179,8,.12) 0%, transparent 65%);
            pointer-events: none;
        }
        .cover::after {
            content: '';
            position: absolute;
            bottom: -60px; left: 20%;
            width: 280px; height: 280px;
            background: radial-gradient(circle, rgba(59,130,246,.08) 0%, transparent 65%);
            pointer-events: none;
        }

        .cover-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 28px;
        }
        .company-name {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: rgba(255,255,255,.35);
            font-weight: 600;
            margin-bottom: 6px;
        }
        .company-full {
            font-size: 22px;
            font-weight: 800;
            color: #fff;
            letter-spacing: -.3px;
        }
        .company-sub {
            font-size: 11px;
            color: rgba(255,255,255,.3);
            margin-top: 4px;
        }
        .doc-badge {
            text-align: right;
        }
        .doc-type {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: rgba(234,179,8,.6);
            font-weight: 600;
            margin-bottom: 6px;
        }
        .doc-bulan {
            font-size: 28px;
            font-weight: 900;
            color: #eab308;
            letter-spacing: -.5px;
        }

        /* ── OVERALL SCORE BAR ── */
        .score-bar {
            display: flex;
            align-items: center;
            gap: 24px;
            background: rgba(255,255,255,.03);
            border: 1px solid rgba(255,255,255,.06);
            border-radius: 14px;
            padding: 18px 24px;
        }
        .score-circle {
            flex-shrink: 0;
        }
        .score-info { flex: 1; }
        .score-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: rgba(255,255,255,.35);
            font-weight: 600;
            margin-bottom: 4px;
        }
        .score-value {
            font-size: 36px;
            font-weight: 900;
            font-family: monospace;
            line-height: 1;
        }
        .score-sub {
            font-size: 11px;
            color: rgba(255,255,255,.3);
            margin-top: 6px;
        }
        .score-meta {
            text-align: right;
        }
        .meta-item {
            font-size: 10px;
            color: rgba(255,255,255,.3);
            margin-bottom: 6px;
        }
        .meta-item strong {
            color: rgba(255,255,255,.65);
            font-family: monospace;
        }

        /* ── BODY ── */
        .body {
            padding: 36px 56px;
        }

        /* ── SECTION TITLE ── */
        .section-title {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: rgba(255,255,255,.3);
            font-weight: 700;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .section-title::after {
            content: '';
            flex: 1;
            height: 1px;
            background: rgba(255,255,255,.06);
        }

        /* ── METRIC CARDS GRID ── */
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 40px;
        }

        /* ── TABLE ── */
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 40px;
        }
        .summary-table thead tr {
            border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .summary-table thead th {
            padding: 10px 14px;
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            color: rgba(255,255,255,.3);
            font-weight: 700;
        }
        .summary-table thead th.r { text-align: right; }
        .summary-table tbody tr {
            border-bottom: 1px solid rgba(255,255,255,.04);
            color: rgba(255,255,255,.65);
        }
        .summary-table tbody tr:hover { background: rgba(255,255,255,.02); }

        /* ── PENJUALAN STRIP ── */
        .penjualan-strip {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            margin-bottom: 40px;
        }
        .pj-card {
            background: #0f0f0f;
            border: 1px solid rgba(255,255,255,.07);
            border-radius: 12px;
            padding: 16px;
        }
        .pj-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            color: rgba(255,255,255,.3);
            font-weight: 600;
            margin-bottom: 8px;
        }
        .pj-value {
            font-size: 18px;
            font-weight: 800;
            font-family: monospace;
            color: #fff;
        }
        .pj-sub {
            font-size: 9.5px;
            color: rgba(255,255,255,.3);
            margin-top: 4px;
        }

        /* ── FOOTER ── */
        .footer {
            border-top: 1px solid rgba(255,255,255,.06);
            padding: 20px 56px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .footer-left {
            font-size: 9px;
            color: rgba(255,255,255,.2);
            line-height: 1.6;
        }
        .footer-right {
            font-size: 9px;
            color: rgba(255,255,255,.2);
            text-align: right;
            line-height: 1.6;
        }

        /* ── LEGEND ── */
        .legend {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            margin-bottom: 12px;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 10px;
            color: rgba(255,255,255,.4);
        }
        .legend-dot {
            width: 8px; height: 8px;
            border-radius: 50%;
        }

        /* ── PRINT ── */
        @media print {
            body { background: #050505 !important; }
            .no-print { display: none !important; }
            @page {
                size: A4;
                margin: 0;
            }
            .cover { padding: 32px 48px 28px; }
            .body { padding: 24px 48px; }
            .footer { padding: 16px 48px; }
        }

        /* ── PRINT BUTTON ── */
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #eab308;
            color: #000;
            border: none;
            border-radius: 10px;
            padding: 10px 22px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            z-index: 999;
            box-shadow: 0 4px 20px rgba(234,179,8,.4);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .print-btn:hover { background: #fbbf24; }
    </style>
</head>
<body>

<button class="print-btn no-print" onclick="window.print()">
    🖨️ Simpan / Cetak PDF
</button>

<!-- ════════════════════════════════════ COVER ════════════════════ -->
<div class="cover">
    <div class="cover-top">
        <div>
            <div class="company-name">${singkatan} — Laporan Resmi</div>
            <div class="company-full">${namaPerusahaan}</div>
            <div class="company-sub">📍 ${lokasi} &nbsp;·&nbsp; Industri Pengolahan Kayu</div>
        </div>
        <div class="doc-badge">
            <div class="doc-type">Pencapaian Target</div>
            <div class="doc-bulan">${bulanLabel}</div>
            <div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:4px;">
                Hari efektif: <strong style="color:rgba(255,255,255,.6);font-family:monospace;">${efDays}</strong> hari
            </div>
        </div>
    </div>

    <!-- Overall Score -->
    <div class="score-bar">
        <div class="score-circle">
            ${donut(overallPct, overallSt.color)}
        </div>
        <div class="score-info">
            <div class="score-label">Rata-rata Pencapaian Keseluruhan</div>
            <div class="score-value" style="color:${overallSt.color};">${overallPct.toFixed(1)}%</div>
            <div class="score-sub">
                <span style="color:${overallSt.color};font-weight:700;
                             background:${overallSt.bg};padding:2px 10px;
                             border-radius:20px;font-size:9px;letter-spacing:.8px;">
                    ${overallSt.label}
                </span>
                &nbsp; dari 6 indikator produksi
            </div>
        </div>
        <div class="score-meta">
            <div class="meta-item">Periode &nbsp;<strong>${bulanLabel}</strong></div>
            <div class="meta-item">s/d tanggal &nbsp;<strong>${endDate}</strong></div>
            <div class="meta-item">Dicetak &nbsp;<strong>${tsCetak}</strong></div>
        </div>
    </div>
</div>

<!-- ════════════════════════════════════ BODY ════════════════════ -->
<div class="body">

    <!-- Metric Cards -->
    <div class="section-title">📊 Realisasi vs Target per Indikator</div>
    <div class="cards-grid">
        ${cardsHTML}
    </div>

    <!-- Summary Table -->
    <div class="section-title">📋 Tabel Ringkasan</div>
    <div class="legend">
        <div class="legend-item"><div class="legend-dot" style="background:#22c55e;"></div> ≥ 100% — Tercapai</div>
        <div class="legend-item"><div class="legend-dot" style="background:#eab308;"></div> 75–99% — On Track</div>
        <div class="legend-item"><div class="legend-dot" style="background:#f97316;"></div> 50–74% — Perlu Pacu</div>
        <div class="legend-item"><div class="legend-dot" style="background:#ef4444;"></div> < 50% — Kritis</div>
    </div>
    <table class="summary-table">
        <thead>
            <tr>
                <th>Indikator</th>
                <th class="r">Realisasi</th>
                <th class="r">Target</th>
                <th>Progress</th>
                <th class="r">%</th>
                <th style="text-align:center;">Status</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>

    <!-- Penjualan summary -->
    <div class="section-title">💰 Ringkasan Penjualan Bulan Ini</div>
    <div class="penjualan-strip">
        <div class="pj-card">
            <div class="pj-label">📦 Volume Netto</div>
            <div class="pj-value" style="color:#22c55e;">${fmtN(rJualNetto, true)}</div>
            <div class="pj-sub">m³ terkirim (setelah retur)</div>
        </div>
        <div class="pj-card">
            <div class="pj-label">↩️ Total Retur</div>
            <div class="pj-value" style="color:${rJualRetur > 0 ? '#ef4444' : '#6b7280'};">
                ${fmtN(rJualRetur, true)}</div>
            <div class="pj-sub">m³ dikembalikan</div>
        </div>
        <div class="pj-card">
            <div class="pj-label">💵 Total Pendapatan</div>
            <div class="pj-value" style="color:#eab308;">${fmtRp(rJualHarga)}</div>
            <div class="pj-sub">bulan ${bulanLabel}</div>
        </div>
        <div class="pj-card">
            <div class="pj-label">📐 Rata-rata Harga/m³</div>
            <div class="pj-value" style="color:#60a5fa;">${fmtRp(hargaPerM3)}</div>
            <div class="pj-sub">per m³ netto</div>
        </div>
    </div>

</div>

<!-- ════════════════════════════════════ FOOTER ════════════════════ -->
<div class="footer">
    <div class="footer-left">
        <strong style="color:rgba(255,255,255,.4);">${namaPerusahaan}</strong><br>
        Laporan Pencapaian Target Bulanan — ${bulanLabel}<br>
        Dokumen ini digenerate otomatis oleh sistem Admin Web Pro
    </div>
    <div class="footer-right">
        Dicetak: ${tsCetak}<br>
        Periode s/d: ${endDate}<br>
        Hari efektif: ${efDays} hari
    </div>
</div>

</body>
</html>`;

    /* ── Buka di tab baru & auto print ── */
    const win = window.open('', '_blank');
    if (!win) { alert('Popup diblokir browser. Izinkan popup untuk mengexport PDF.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    // Sedikit delay agar font & layout render sempurna
    setTimeout(() => win.print(), 900);
};

/* ── Helper: last day of month ─────────────────────────── */
function getLastDayOfMonth(ym) {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m, 0).toISOString().split('T')[0];
}
