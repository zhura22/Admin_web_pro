// produksi.js — IMPROVED: tampilan lebih informatif, efisiensi, filter tanggal, chart
// Perbaikan: grafik Tren Planer & Press per Hari sekarang berfungsi

let produksiEditId = null;
window._produksiSumberPalet = [];

// ═══════════════════════════════════════════════
// HELPER: hitung efisiensi & indikator warna
// ═══════════════════════════════════════════════
function getProdEfisiensi(item) {
    const s1 = item.shift1 || {}, s2 = item.shift2 || {};
    const planerBagus = (s1.planerBagus||0) + (s2.planerBagus||0);
    const ripsawIn = (s1.ripsawIn||0) + (s2.ripsawIn||0);
    const press = (s1.press||0) + (s2.press||0);
    const seri = (s1.seri||0) + (s2.seri||0);
    const efRipsaw = planerBagus > 0 ? (ripsawIn / planerBagus * 100) : 0;
    const pressPerSeri = seri > 0 ? (press / seri).toFixed(2) : '-';
    return { efRipsaw, pressPerSeri };
}

function miniBar(val, max, color) {
    const pct = max > 0 ? Math.min(100, (val / max) * 100) : 0;
    return `<div style="height:4px;background:var(--border);border-radius:2px;margin-top:4px;overflow:hidden;">
        <div style="height:100%;width:${pct.toFixed(1)}%;background:${color};border-radius:2px;transition:width .5s ease;"></div>
    </div>`;
}

// ═══════════════════════════════════════════════
// RENDER DAFTAR PRODUKSI (IMPROVED)
// ═══════════════════════════════════════════════
window.renderProduksi = function () {
    const countEl = document.getElementById("produksi-count");
    if (countEl) countEl.textContent = window.produksiList.length + " laporan";
    const container = document.getElementById("produksi-list");
    if (!window.produksiList.length) {
        container.innerHTML = '<div class="empty">📭 Belum ada laporan produksi</div>';
        return;
    }

    const from  = document.getElementById('prod-filter-from')?.value || '';
    const to    = document.getElementById('prod-filter-to')?.value || '';
    const srch  = (document.getElementById('prod-filter-search')?.value || '').toLowerCase();

    let list = sortByDateDesc(window.produksiList);
    if (from)  list = list.filter(l => l.tanggal >= from);
    if (to)    list = list.filter(l => l.tanggal <= to);
    if (srch)  list = list.filter(l => (l.openNo||'').toLowerCase().includes(srch) || (l.keterangan||'').toLowerCase().includes(srch));

    if (!list.length) {
        container.innerHTML = '<div class="empty">🔍 Tidak ada data sesuai filter</div>';
        return;
    }

    let totPlanerBagus = 0, totPress = 0, totSeri = 0, totRipsaw = 0, totLimbah = 0, totReject = 0;
    list.forEach(l => {
        const s1 = l.shift1||{}, s2 = l.shift2||{};
        totPlanerBagus += (s1.planerBagus||0)+(s2.planerBagus||0);
        totPress       += (s1.press||0)+(s2.press||0);
        totSeri        += (s1.seri||0)+(s2.seri||0);
        totRipsaw      += (s1.ripsawIn||0)+(s2.ripsawIn||0);
        totLimbah      += l.limbah||0;
        totReject      += l.reject||0;
    });
    const efTotal = totPlanerBagus > 0 ? (totRipsaw / totPlanerBagus * 100).toFixed(1) : '0.0';
    const efColor = efTotal >= 80 ? 'var(--green)' : efTotal >= 60 ? 'var(--orange)' : 'var(--red)';

    const summaryBar = `
    <div class="summary-row" style="margin-bottom:16px;">
        <div class="summary-card"><div class="summary-label">Total Laporan (Filter)</div><div class="summary-value">${list.length}</div></div>
        <div class="summary-card"><div class="summary-label">Total Planer Bagus</div><div class="summary-value">${fmtDec(totPlanerBagus,2)} <span style="font-size:11px;color:var(--muted)">m³</span></div></div>
        <div class="summary-card"><div class="summary-label">Total Press</div><div class="summary-value">${fmt(totPress)} <span style="font-size:11px;color:var(--muted)">lbr</span></div></div>
        <div class="summary-card"><div class="summary-label">Efisiensi Ripsaw</div><div class="summary-value" style="color:${efColor}">${efTotal}%</div>${miniBar(parseFloat(efTotal), 100, efColor)}</div>
    </div>`;

    const cards = list.map(l => {
        const s1 = l.shift1||{}, s2 = l.shift2||{};
        const planerBagus = (s1.planerBagus||0)+(s2.planerBagus||0);
        const planerMis   = (s1.planerMis||0)+(s2.planerMis||0);
        const seri        = (s1.seri||0)+(s2.seri||0);
        const press       = (s1.press||0)+(s2.press||0);
        const ripsawIn    = (s1.ripsawIn||0)+(s2.ripsawIn||0);
        const totalMasuk  = (s1.masuk||0)+(s2.masuk||0);
        const totalTidak  = (s1.tidakMasuk||0)+(s2.tidakMasuk||0);
        const { efRipsaw, pressPerSeri } = getProdEfisiensi(l);
        const efCol   = efRipsaw >= 80 ? 'var(--green)' : efRipsaw >= 60 ? 'var(--orange)' : 'var(--red)';
        const absensi = (totalMasuk + totalTidak) > 0 ? ((totalMasuk/(totalMasuk+totalTidak))*100).toFixed(0) : 100;
        const absFmt  = `${absensi}%`;
        const absCol  = absensi >= 90 ? 'var(--green)' : absensi >= 75 ? 'var(--orange)' : 'var(--red)';
        const sumberInfo = (l.asalPalet && l.asalPalet.length > 0)
            ? l.asalPalet.map(p => `<span style="background:var(--gold-dim);color:var(--gold);padding:2px 8px;border-radius:12px;font-size:10px;">Open ${p.openNo}: ${p.jumlahPalet} plt · ${fmtDec(p.volume,2)} m³</span>`).join(' ')
            : '<span style="color:var(--muted);font-size:10px;">—</span>';

        return `
        <div class="laporan-card" style="border-left:3px solid var(--gold);">
            <div class="laporan-head" style="margin-bottom:12px;">
                <div>
                    <div class="laporan-title">📅 ${fmtDate(l.tanggal)} &nbsp;·&nbsp; <span style="color:var(--gold-light)">${l.openNo || 'Tanpa Batch'}</span></div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">${sumberInfo}</div>
                </div>
                <div class="flex gap4">
                    <button class="btn btn-edit btn-sm" onclick="editProduksi('${l.id}')">✏️ Edit</button>
                    <button class="btn btn-del btn-sm" onclick="deleteProduksi('${l.id}')">🗑️</button>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;">
                <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 14px;">
                    <div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Planer Bagus</div>
                    <div style="font-size:18px;font-weight:700;color:var(--gold);font-family:var(--font-mono);">${fmtDec(planerBagus,2)} <span style="font-size:10px">m³</span></div>
                    ${miniBar(planerBagus, 5, 'var(--gold)')}
                </div>
                <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 14px;">
                    <div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Press (Hasil)</div>
                    <div style="font-size:18px;font-weight:700;color:var(--blue);font-family:var(--font-mono);">${fmt(press)} <span style="font-size:10px">lbr</span></div>
                    ${miniBar(press, 2000, 'var(--blue)')}
                </div>
                <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 14px;">
                    <div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Efisiensi Ripsaw</div>
                    <div style="font-size:18px;font-weight:700;font-family:var(--font-mono);color:${efCol}">${efRipsaw.toFixed(1)}%</div>
                    ${miniBar(efRipsaw, 100, efCol)}
                </div>
                <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 14px;">
                    <div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">Kehadiran</div>
                    <div style="font-size:18px;font-weight:700;font-family:var(--font-mono);color:${absCol};">${absFmt}</div>
                    <div style="font-size:10px;color:var(--muted);">Masuk: ${totalMasuk} / ${totalMasuk+totalTidak} orang</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                ${renderShiftMini('Shift 1 🕛', s1)}
                ${renderShiftMini('Shift 2 🌙', s2)}
            </div>
            <div class="stat-pills" style="padding-top:8px;border-top:1px solid var(--border);">
                ${l.limbah ? `<div class="stat-pill"><span class="stat-label">♻️ Limbah</span>&nbsp;<span class="stat-val">${fmtDec(l.limbah,2)} m³</span></div>` : ''}
                ${l.reject ? `<div class="stat-pill" style="border-color:rgba(248,113,113,0.3)"><span class="stat-label">❌ Reject</span>&nbsp;<span class="stat-val" style="color:var(--red)">${l.reject} pcs</span></div>` : ''}
                <div class="stat-pill"><span class="stat-label">Mis</span>&nbsp;<span class="stat-val">${planerMis} sap</span></div>
                <div class="stat-pill"><span class="stat-label">Seri</span>&nbsp;<span class="stat-val">${fmt(seri)} lbr</span></div>
                <div class="stat-pill"><span class="stat-label">Press/Seri</span>&nbsp;<span class="stat-val">${pressPerSeri}</span></div>
                ${l.keterangan ? `<div class="stat-pill"><span class="stat-label">📝</span>&nbsp;<span style="color:var(--muted)">${l.keterangan}</span></div>` : ''}
            </div>
        </div>`;
    }).join('');

    container.innerHTML = summaryBar + cards;
};

function renderShiftMini(label, s) {
    const bagus   = s.planerBagus||0;
    const press   = s.press||0;
    const masuk   = s.masuk||0;
    const tidak   = s.tidakMasuk||0;
    const hadirPct = (masuk+tidak) > 0 ? ((masuk/(masuk+tidak))*100).toFixed(0) : 100;
    return `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:12px;">
        <div style="font-size:11px;font-weight:700;color:var(--gold-light);margin-bottom:8px;">${label}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:11px;font-family:var(--font-mono);">
            <span style="color:var(--muted)">Planer:</span><span style="color:var(--gold)">${fmtDec(bagus,2)} m³</span>&nbsp;
            <span style="color:var(--muted)">Press:</span><span style="color:var(--blue)">${fmt(press)} lbr</span>&nbsp;
            <span style="color:var(--muted)">Ripsaw:</span><span>${fmtDec(s.ripsawIn||0,2)} m³</span>
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:6px;">Seri: ${s.seri||0} lbr · Masuk: ${masuk}/${masuk+tidak} (${hadirPct}%)</div>
    </div>`;
}

// ═══════════════════════════════════════════════
// FILTER PANEL
// ═══════════════════════════════════════════════
function initProduksiFilterBar() {
    const listEl = document.getElementById('produksi-list');
    if (!listEl || document.getElementById('prod-filter-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'prod-filter-bar';
    bar.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;';
    bar.innerHTML = `
        <input class="search" type="text" id="prod-filter-search" placeholder="🔍 Cari batch/keterangan..." style="width:220px;" oninput="window.renderProduksi()">
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);">
            <label>Dari:</label>
            <input type="date" id="prod-filter-from" style="background:var(--input-bg);border:1px solid var(--input-border);color:var(--input-color);padding:7px 10px;border-radius:6px;font-size:11px;" onchange="window.renderProduksi()">
            <label>s/d</label>
            <input type="date" id="prod-filter-to" style="background:var(--input-bg);border:1px solid var(--input-border);color:var(--input-color);padding:7px 10px;border-radius:6px;font-size:11px;" onchange="window.renderProduksi()">
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.resetProduksiFilter()">↩ Reset</button>
        <button class="btn btn-sm" style="background:rgba(96,165,250,0.15);color:var(--blue);border-color:rgba(96,165,250,0.3);" onclick="window.exportProduksiCSV()">📥 CSV</button>
    `;
    listEl.insertAdjacentElement('beforebegin', bar);
}

window.resetProduksiFilter = function() {
    document.getElementById('prod-filter-from') && (document.getElementById('prod-filter-from').value = '');
    document.getElementById('prod-filter-to') && (document.getElementById('prod-filter-to').value = '');
    document.getElementById('prod-filter-search') && (document.getElementById('prod-filter-search').value = '');
    window.renderProduksi();
};

// ═══════════════════════════════════════════════
// EXPORT CSV
// ═══════════════════════════════════════════════
window.exportProduksiCSV = function() {
    if (!window.produksiList.length) { toast('⚠️ Tidak ada data'); return; }
    const headers = ['Tanggal','Batch','Planer Bagus (m³)','Planer Mis','Ripsaw In (m³)','Seri (lbr)','Press (lbr)','Tenaga Masuk','Tenaga Tidak','Limbah (m³)','Reject (pcs)','Ef.Ripsaw (%)','Keterangan'];
    const rows = sortByDateAsc(window.produksiList).map(l => {
        const s1 = l.shift1||{}, s2 = l.shift2||{};
        const pB = (s1.planerBagus||0)+(s2.planerBagus||0);
        const rIn = (s1.ripsawIn||0)+(s2.ripsawIn||0);
        const ef = pB > 0 ? (rIn/pB*100).toFixed(1) : '0';
        return [
            l.tanggal, l.openNo||'',
            fmtDec(pB,2),
            (s1.planerMis||0)+(s2.planerMis||0),
            fmtDec(rIn,2),
            (s1.seri||0)+(s2.seri||0),
            (s1.press||0)+(s2.press||0),
            (s1.masuk||0)+(s2.masuk||0),
            (s1.tidakMasuk||0)+(s2.tidakMasuk||0),
            fmtDec(l.limbah||0,2),
            l.reject||0,
            ef,
            l.keterangan||''
        ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `produksi_${thisMonth()}.csv`;
    a.click();
    toast('📥 CSV berhasil diunduh');
};

// ═══════════════════════════════════════════════
// RANGKUMAN BULANAN (DENGAN CHART YANG BERFUNGSI)
// ═══════════════════════════════════════════════
function renderProduksiSummary() {
    const bulan = document.getElementById("produksi-summary-bulan")?.value || thisMonth();
    const reports = window.produksiList.filter(p => p.tanggal && p.tanggal.startsWith(bulan));
    const container = document.getElementById("produksi-summary-content");
    if (!container) return;
    if (reports.length === 0) {
        container.innerHTML = '<div class="empty">📭 Tidak ada laporan produksi pada bulan ini</div>';
        return;
    }

    let totPB=0, totPM=0, totRI=0, totSeri=0, totPress=0, totLimbah=0, totReject=0, totMasuk=0, totTidak=0;
    const shift1D = { pb:0, pm:0, ri:0, seri:0, press:0, masuk:0, tidak:0 };
    const shift2D = { pb:0, pm:0, ri:0, seri:0, press:0, masuk:0, tidak:0 };
    const perHari = {}; // key = tanggal lengkap YYYY-MM-DD

    reports.forEach(p => {
        const s1 = p.shift1||{}, s2 = p.shift2||{};
        const pB = (s1.planerBagus||0)+(s2.planerBagus||0);
        const pM = (s1.planerMis||0)+(s2.planerMis||0);
        const rI = (s1.ripsawIn||0)+(s2.ripsawIn||0);
        const se = (s1.seri||0)+(s2.seri||0);
        const pr = (s1.press||0)+(s2.press||0);
        const ma = (s1.masuk||0)+(s2.masuk||0);
        const ti = (s1.tidakMasuk||0)+(s2.tidakMasuk||0);

        totPB += pB; totPM += pM; totRI += rI; totSeri += se; totPress += pr;
        totLimbah += p.limbah||0; totReject += p.reject||0; totMasuk += ma; totTidak += ti;

        shift1D.pb += s1.planerBagus||0; shift1D.pm += s1.planerMis||0; shift1D.ri += s1.ripsawIn||0;
        shift1D.seri += s1.seri||0; shift1D.press += s1.press||0; shift1D.masuk += s1.masuk||0; shift1D.tidak += s1.tidakMasuk||0;
        shift2D.pb += s2.planerBagus||0; shift2D.pm += s2.planerMis||0; shift2D.ri += s2.ripsawIn||0;
        shift2D.seri += s2.seri||0; shift2D.press += s2.press||0; shift2D.masuk += s2.masuk||0; shift2D.tidak += s2.tidakMasuk||0;

        // Simpan per hari dengan key tanggal lengkap
        perHari[p.tanggal] = { pB, pM, rI, seri:se, press:pr, limbah:p.limbah||0, reject:p.reject||0, masuk:ma, tidak:ti };
    });

    const hariAktif  = Object.keys(perHari).length;
    const rataPlaner = hariAktif > 0 ? (totPB / hariAktif).toFixed(2) : '0.00';
    const rataPress  = hariAktif > 0 ? Math.round(totPress / hariAktif) : 0;
    const efRipsaw   = totPB > 0 ? (totRI / totPB * 100).toFixed(1) : '0.0';
    const efCol      = efRipsaw >= 80 ? 'var(--green)' : efRipsaw >= 60 ? 'var(--orange)' : 'var(--red)';
    const kehadiran  = (totMasuk + totTidak) > 0 ? ((totMasuk/(totMasuk+totTidak))*100).toFixed(1) : '100.0';
    const khadCol    = kehadiran >= 90 ? 'var(--green)' : kehadiran >= 75 ? 'var(--orange)' : 'var(--red)';

    // KPI CARDS
    const kpiSection = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px;">
        ${kpiCard('Total Hari Aktif', hariAktif + ' hari', 'var(--gold)', '📅')}
        ${kpiCard('Total Planer Bagus', fmtDec(totPB,2) + ' m³', 'var(--gold)', '🪵')}
        ${kpiCard('Rata-rata Planer/Hari', rataPlaner + ' m³', 'var(--gold-light)', '📈')}
        ${kpiCard('Total Press', fmt(totPress) + ' lbr', 'var(--blue)', '🔩')}
        ${kpiCard('Rata-rata Press/Hari', fmt(rataPress) + ' lbr', 'var(--blue)', '⚙️')}
        ${kpiCard('Total Seri', fmt(totSeri) + ' lbr', 'var(--orange)', '🔗')}
        ${kpiCard('Efisiensi Ripsaw', efRipsaw + '%', efCol, '📊')}
        ${kpiCard('Kehadiran Rata-rata', kehadiran + '%', khadCol, '👷')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;padding:16px;">
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:8px;">♻️ Limbah vs Reject</div>
            <div style="display:flex;gap:20px;">
                <div><div style="font-size:22px;font-weight:700;color:var(--orange);font-family:var(--font-mono);">${fmtDec(totLimbah,2)} m³</div><div style="font-size:10px;color:var(--muted)">Total Limbah</div></div>
                <div><div style="font-size:22px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${fmt(totReject)} pcs</div><div style="font-size:10px;color:var(--muted)">Total Reject</div></div>
            </div>
        </div>
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;padding:16px;">
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:8px;">👷 Tenaga Kerja</div>
            <div style="display:flex;gap:20px;">
                <div><div style="font-size:22px;font-weight:700;color:var(--green);font-family:var(--font-mono);">${fmt(totMasuk)}</div><div style="font-size:10px;color:var(--muted)">Total Masuk</div></div>
                <div><div style="font-size:22px;font-weight:700;color:var(--red);font-family:var(--font-mono);">${fmt(totTidak)}</div><div style="font-size:10px;color:var(--muted)">Total Tidak Masuk</div></div>
            </div>
        </div>
    </div>`;

    // SHIFT COMPARISON TABLE
    const shiftTable = `
    <div class="section-head">📊 Perbandingan Shift — ${bulan}</div>
    <div class="table-wrap" style="margin-bottom:20px;">
        <table>
            <thead><tr>
                <th>Shift</th><th>Planer Bagus (m³)</th><th>Planer Mis</th>
                <th>Ripsaw In (m³)</th><th>Seri (lbr)</th><th>Press (lbr)</th>
                <th>Ef. Ripsaw</th><th>Tenaga Masuk</th><th>Tidak Masuk</th>
            </tr></thead>
            <tbody>
                ${shiftRow('Shift 1 🕛', shift1D)}
                ${shiftRow('Shift 2 🌙', shift2D)}
                <tr style="font-weight:700;background:var(--gold-dim);">
                    <td class="highlight">Total</td>
                    <td class="right">${fmtDec(totPB,2)}</td>
                    <td class="right">${totPM}</td>
                    <td class="right">${fmtDec(totRI,2)}</td>
                    <td class="right">${fmt(totSeri)}</td>
                    <td class="right">${fmt(totPress)}</td>
                    <td class="right" style="color:${efCol}">${efRipsaw}%</td>
                    <td class="right">${fmt(totMasuk)}</td>
                    <td class="right">${fmt(totTidak)}</td>
                </tr>
            </tbody>
        </table>
    </div>`;

    // PER HARI TABLE
    const sortedDates = Object.keys(perHari).sort();
    const hariRows = sortedDates.map(tgl => {
        const d = perHari[tgl];
        const ef = d.pB > 0 ? (d.rI / d.pB * 100).toFixed(1) : '0.0';
        const efC = ef >= 80 ? 'var(--green)' : ef >= 60 ? 'var(--orange)' : 'var(--red)';
        const had = (d.masuk+d.tidak) > 0 ? ((d.masuk/(d.masuk+d.tidak))*100).toFixed(0) : 100;
        return `<tr>
            <td>${fmtDate(tgl)}</td>
            <td class="right">${fmtDec(d.pB,2)}</td>
            <td class="right">${d.pM}</td>
            <td class="right">${fmtDec(d.rI,2)}</td>
            <td class="right">${d.seri}</td>
            <td class="right">${d.press}</td>
            <td class="right" style="color:${efC}">${ef}%</td>
            <td class="right">${fmtDec(d.limbah,2)}</td>
            <td class="right">${d.reject}</td>
            <td class="right">${d.masuk}/${d.masuk+d.tidak} <span style="color:${had>=90?'var(--green)':had>=75?'var(--orange)':'var(--red)'};">(${had}%)</span></td>
        </tr>`;
    }).join('');

    const perHariTable = `
    <div class="section-head" style="margin-top:20px;">📅 Detail Produksi Per Hari</div>
    <div class="table-wrap">
        <table style="font-size:11px;">
            <thead><tr>
                <th>Tanggal</th><th>Planer Bagus (m³)</th><th>Planer Mis</th>
                <th>Ripsaw In (m³)</th><th>Seri</th><th>Press</th>
                <th>Ef. Ripsaw</th><th>Limbah (m³)</th><th>Reject</th><th>Kehadiran</th>
            </tr></thead>
            <tbody>${hariRows}</tbody>
        </table>
    </div>`;

    // CHART SECTION (diperbaiki)
    const chartSection = `
    <div class="section-head" style="margin-top:20px;">📈 Tren Planer & Press per Hari</div>
    <canvas id="chart-produksi-summary" height="150" style="background:var(--bg2);border-radius:10px;padding:12px;"></canvas>`;

    container.innerHTML = kpiSection + shiftTable + chartSection + perHariTable;

    // Render chart setelah DOM update
    setTimeout(() => {
        const ctx = document.getElementById('chart-produksi-summary');
        if (!ctx || !window.Chart) return;
        if (ctx._chartInst) ctx._chartInst.destroy();

        // Gunakan sortedDates untuk urutan yang benar
        const labels = sortedDates.map(tgl => tgl.slice(5)); // "MM-DD" untuk label
        const pbData = sortedDates.map(tgl => perHari[tgl].pB);
        const prData = sortedDates.map(tgl => perHari[tgl].press);

        ctx._chartInst = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Planer Bagus (m³)', data: pbData, backgroundColor: 'rgba(212,160,23,0.7)', borderColor: 'var(--gold)', borderWidth: 1, yAxisID: 'y', type: 'bar' },
                    { label: 'Press (lbr)', data: prData, type: 'line', backgroundColor: 'rgba(96,165,250,0.15)', borderColor: 'var(--blue)', borderWidth: 2, pointRadius: 3, fill: true, yAxisID: 'y1', tension: 0.3 }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { labels: { color: '#8a8578', font: { size: 11 } } } },
                scales: {
                    x: { ticks: { color: '#8a8578', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    y: { position: 'left', ticks: { color: '#d4a017', font: { size: 10 } }, grid: { color: 'rgba(212,160,23,0.08)' }, title: { display: true, text: 'm³', color: '#8a8578', font: { size: 10 } } },
                    y1: { position: 'right', ticks: { color: '#60a5fa', font: { size: 10 } }, grid: { drawOnChartArea: false }, title: { display: true, text: 'lbr', color: '#8a8578', font: { size: 10 } } }
                }
            }
        });
    }, 150);
}

function kpiCard(label, value, color, icon) {
    const lbl = icon ? icon + ' ' + label : label;
    return `<div style="background:var(--bg2);border:1px solid var(--gold-dim);
                border-top:3px solid ${color};border-radius:12px;
                padding:14px 18px;box-shadow:0 3px 12px rgba(0,0,0,.18);
                position:relative;overflow:hidden;">
        <div style="position:absolute;top:-12px;right:-12px;width:52px;height:52px;
                    border-radius:50%;background:${color};opacity:.07;pointer-events:none;"></div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;
                    letter-spacing:.9px;font-weight:600;">${lbl}</div>
        <div style="font-size:21px;font-weight:700;color:${color};
                    font-family:var(--font-mono);margin-top:6px;line-height:1.1;
                    letter-spacing:-.5px;">${value}</div>
    </div>`;
}

function shiftRow(label, d) {
    const ef = d.pb > 0 ? (d.ri/d.pb*100).toFixed(1) : '0.0';
    const efC = ef >= 80 ? 'var(--green)' : ef >= 60 ? 'var(--orange)' : 'var(--red)';
    return `<tr>
        <td class="highlight">${label}</td>
        <td class="right">${fmtDec(d.pb,2)}</td>
        <td class="right">${d.pm}</td>
        <td class="right">${fmtDec(d.ri,2)}</td>
        <td class="right">${d.seri}</td>
        <td class="right">${d.press}</td>
        <td class="right" style="color:${efC}">${ef}%</td>
        <td class="right">${d.masuk}</td>
        <td class="right">${d.tidak}</td>
    </tr>`;
}

// ═══════════════════════════════════════════════
// INIT SUMMARY PANEL
// ═══════════════════════════════════════════════
function initProduksiSummary() {
    const tabProduksi = document.getElementById("tab-produksi");
    if (!tabProduksi || document.getElementById("produksi-summary-panel")) return;

    const subtabContainer = tabProduksi.querySelector('.subtab-toggle');
    if (subtabContainer && !subtabContainer.querySelector('[data-subtab="produksi-summary-panel"]')) {
        const btnSummary = document.createElement('button');
        btnSummary.className = 'btn btn-secondary subtab-btn';
        btnSummary.setAttribute('data-subtab', 'produksi-summary-panel');
        btnSummary.textContent = '📊 Rangkuman Bulanan';
        btnSummary.onclick = () => {
            document.querySelectorAll('#tab-produksi .subtab-panel').forEach(p => p.classList.add('hidden'));
            document.getElementById('produksi-summary-panel').classList.remove('hidden');
            document.querySelectorAll('#tab-produksi .subtab-btn').forEach(btn => {
                btn.classList.remove('active', 'btn-primary');
                btn.classList.add('btn-secondary');
            });
            btnSummary.classList.add('active', 'btn-primary');
            btnSummary.classList.remove('btn-secondary');
            renderProduksiSummary();
        };
        subtabContainer.appendChild(btnSummary);
    }

    const summaryPanel = document.createElement('div');
    summaryPanel.id = 'produksi-summary-panel';
    summaryPanel.className = 'subtab-panel hidden';
    summaryPanel.innerHTML = `
        <div class="form-card">
            <div class="form-title">📊 Rangkuman Produksi per Bulan</div>
            <div class="grid2">
                <div class="field"><label>Pilih Bulan</label><input type="month" id="produksi-summary-bulan" value="${thisMonth()}" onchange="renderProduksiSummary()"></div>
                <div class="field"><button class="btn btn-primary" onclick="renderProduksiSummary()" style="margin-top:22px;">🔄 Tampilkan</button></div>
            </div>
            <div id="produksi-summary-content"></div>
        </div>`;

    const produksiListPanel = document.getElementById("produksi-list");
    if (produksiListPanel) produksiListPanel.insertAdjacentElement('afterend', summaryPanel);
    else tabProduksi.appendChild(summaryPanel);
}

// ═══════════════════════════════════════════════
// CRUD FORM (tidak diubah, tetap sama seperti sebelumnya)
// ═══════════════════════════════════════════════
window.openProduksiForm = function(item) {
    produksiEditId = item?.id || null;
    window._produksiSumberPalet = item ? JSON.parse(JSON.stringify(item.asalPalet || [])) : [];
    const container = document.getElementById("produksi-form-container");
    container.innerHTML = `
        <div class="form-title">${item ? "✏️ Edit" : "➕ Input"} Laporan Produksi</div>
        <div class="section-head">📅 Informasi Umum</div>
        <div class="grid2">
            <div class="field"><label>Tanggal *</label><input type="date" id="prod-tanggal" /></div>
            <div class="field"><label>Batch / Open No.</label><input type="text" id="prod-openno" placeholder="Contoh: Batch A atau OP-001" /></div>
        </div>
        <div class="section-head">📋 Sumber Palet (dari Oven)</div>
        <div id="sumber-palet-container"></div>
        <button class="btn btn-secondary btn-sm mt8" onclick="window.tambahSumberPalet()">+ Tambah Sumber Palet</button>
        <div class="section-head" style="background:linear-gradient(90deg,var(--gold-dim),transparent);padding:8px 12px;border-radius:6px;">🕛 SHIFT 1 — Siang</div>
        <div class="grid3">
            <div class="field"><label>Planer — Palet (plt)</label><input type="number" id="prod-s1-planer-palet" placeholder="0" /></div>
            <div class="field"><label>Planer — Bagus (m³)</label><input type="number" step="any" id="prod-s1-planer-bagus" placeholder="0.00" /></div>
            <div class="field"><label>Planer — Mis (sap)</label><input type="number" id="prod-s1-planer-mis" placeholder="0" /></div>
            <div class="field"><label>Ripsaw — Input (m³)</label><input type="number" step="any" id="prod-s1-ripsaw-in" placeholder="0.00" /></div>
            <div class="field"><label>Seri — Hasil (lbr)</label><input type="number" id="prod-s1-seri" placeholder="0" /></div>
            <div class="field"><label>Press — Hasil (lbr)</label><input type="number" id="prod-s1-press" placeholder="0" /></div>
        </div>
        <div class="grid2 mt8">
            <div class="field"><label>👷 Tenaga Masuk</label><input type="number" id="prod-s1-masuk" placeholder="0" /></div>
            <div class="field"><label>🚫 Tidak Masuk</label><input type="number" id="prod-s1-tidakmasuk" placeholder="0" /></div>
        </div>
        <div class="section-head" style="background:linear-gradient(90deg,rgba(96,165,250,0.12),transparent);padding:8px 12px;border-radius:6px;">🌙 SHIFT 2 — Malam</div>
        <div class="grid3">
            <div class="field"><label>Planer — Palet (plt)</label><input type="number" id="prod-s2-planer-palet" placeholder="0" /></div>
            <div class="field"><label>Planer — Bagus (m³)</label><input type="number" step="any" id="prod-s2-planer-bagus" placeholder="0.00" /></div>
            <div class="field"><label>Planer — Mis (sap)</label><input type="number" id="prod-s2-planer-mis" placeholder="0" /></div>
            <div class="field"><label>Ripsaw — Input (m³)</label><input type="number" step="any" id="prod-s2-ripsaw-in" placeholder="0.00" /></div>
            <div class="field"><label>Seri — Hasil (lbr)</label><input type="number" id="prod-s2-seri" placeholder="0" /></div>
            <div class="field"><label>Press — Hasil (lbr)</label><input type="number" id="prod-s2-press" placeholder="0" /></div>
        </div>
        <div class="grid2 mt8">
            <div class="field"><label>👷 Tenaga Masuk</label><input type="number" id="prod-s2-masuk" placeholder="0" /></div>
            <div class="field"><label>🚫 Tidak Masuk</label><input type="number" id="prod-s2-tidakmasuk" placeholder="0" /></div>
        </div>
        <div class="section-head">♻️ Limbah & Reject</div>
        <div class="grid3">
            <div class="field"><label>Limbah (m³)</label><input type="number" step="any" id="prod-limbah" placeholder="0.00" /></div>
            <div class="field"><label>Reject Board (pcs)</label><input type="number" id="prod-reject" placeholder="0" /></div>
            <div class="field"><label>Keterangan</label><input type="text" id="prod-keterangan" placeholder="Catatan opsional..." /></div>
        </div>
        <div id="prod-live-preview" style="background:var(--gold-dim);border:1px solid var(--gold-dim);border-radius:8px;padding:12px;margin-top:16px;display:none;">
            <div style="font-size:10px;color:var(--gold-light);font-weight:700;text-transform:uppercase;margin-bottom:8px;">⚡ Preview Kalkulasi</div>
            <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;font-family:var(--font-mono);">
                <span>Total Planer: <b id="prev-planer">0.00</b> m³</span>
                <span>Total Press: <b id="prev-press">0</b> lbr</span>
                <span>Ef.Ripsaw: <b id="prev-ef">0.0</b>%</span>
                <span>Total Masuk: <b id="prev-masuk">0</b> orang</span>
            </div>
        </div>
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="window.closeProduksiForm()">Batal</button>
            <button class="btn btn-primary" onclick="window.saveProduksi()">💾 Simpan</button>
        </div>`;

    if (item) {
        document.getElementById("prod-tanggal").value = item.tanggal || "";
        document.getElementById("prod-openno").value = item.openNo || "";
        const s1 = item.shift1||{}, s2 = item.shift2||{};
        document.getElementById("prod-s1-planer-palet").value = s1.planerPalet||"";
        document.getElementById("prod-s1-planer-bagus").value = s1.planerBagus||"";
        document.getElementById("prod-s1-planer-mis").value   = s1.planerMis||"";
        document.getElementById("prod-s1-ripsaw-in").value    = s1.ripsawIn||"";
        document.getElementById("prod-s1-seri").value         = s1.seri||"";
        document.getElementById("prod-s1-press").value        = s1.press||"";
        document.getElementById("prod-s1-masuk").value        = s1.masuk||"";
        document.getElementById("prod-s1-tidakmasuk").value   = s1.tidakMasuk||"";
        document.getElementById("prod-s2-planer-palet").value = s2.planerPalet||"";
        document.getElementById("prod-s2-planer-bagus").value = s2.planerBagus||"";
        document.getElementById("prod-s2-planer-mis").value   = s2.planerMis||"";
        document.getElementById("prod-s2-ripsaw-in").value    = s2.ripsawIn||"";
        document.getElementById("prod-s2-seri").value         = s2.seri||"";
        document.getElementById("prod-s2-press").value        = s2.press||"";
        document.getElementById("prod-s2-masuk").value        = s2.masuk||"";
        document.getElementById("prod-s2-tidakmasuk").value   = s2.tidakMasuk||"";
        document.getElementById("prod-limbah").value          = item.limbah||"";
        document.getElementById("prod-reject").value          = item.reject||"";
        document.getElementById("prod-keterangan").value      = item.keterangan||"";
    } else {
        document.getElementById("prod-tanggal").value = today();
    }
    renderSumberPalet();
    const inputs = container.querySelectorAll('input[type="number"]');
    inputs.forEach(inp => inp.addEventListener('input', updateLivePreview));
    updateLivePreview();
    document.getElementById("produksi-input").classList.remove("hidden");
    document.getElementById("produksi-list").classList.add("hidden");
};

function updateLivePreview() {
    const pB = (parseFloat(document.getElementById("prod-s1-planer-bagus")?.value)||0) + (parseFloat(document.getElementById("prod-s2-planer-bagus")?.value)||0);
    const rI = (parseFloat(document.getElementById("prod-s1-ripsaw-in")?.value)||0) + (parseFloat(document.getElementById("prod-s2-ripsaw-in")?.value)||0);
    const pr = (parseInt(document.getElementById("prod-s1-press")?.value)||0) + (parseInt(document.getElementById("prod-s2-press")?.value)||0);
    const ma = (parseInt(document.getElementById("prod-s1-masuk")?.value)||0) + (parseInt(document.getElementById("prod-s2-masuk")?.value)||0);
    const ef = pB > 0 ? (rI/pB*100).toFixed(1) : '0.0';
    const prev = document.getElementById('prod-live-preview');
    if (!prev) return;
    if (pB > 0 || pr > 0) {
        prev.style.display = 'block';
        document.getElementById('prev-planer').textContent = pB.toFixed(2);
        document.getElementById('prev-press').textContent = pr;
        document.getElementById('prev-ef').textContent = ef;
        document.getElementById('prev-masuk').textContent = ma;
    }
}

window.tambahSumberPalet = function() {
    window._produksiSumberPalet.push({ openNo: "", jumlahPalet: "", volume: "" });
    renderSumberPalet();
};

window.hapusSumberPalet = function(i) {
    window._produksiSumberPalet.splice(i, 1);
    renderSumberPalet();
};

function renderSumberPalet() {
    const c = document.getElementById("sumber-palet-container");
    if (!c) return;
    if (!window._produksiSumberPalet.length) {
        c.innerHTML = '<p style="color:var(--muted);font-size:12px;padding:8px 0;">Belum ada sumber palet. Klik "+ Tambah Sumber Palet".</p>';
        return;
    }
    const openList = [...new Set((window.sawmillList || []).map(s => s.openNo).filter(Boolean))];
    c.innerHTML = window._produksiSumberPalet.map((s, i) => {
        const openOptions = openList.map(no => `<option value="${no}"${no === s.openNo ? ' selected' : ''}>${no}</option>`).join('');
        return `
        <div class="palet-row-horizontal">
            <div class="palet-field"><label>Open No.</label><select onchange="window._produksiSumberPalet[${i}].openNo = this.value"><option value="">--Pilih--</option>${openOptions}</select></div>
            <div class="palet-field"><label>Jumlah (plt)</label><input type="number" step="any" value="${s.jumlahPalet || ''}" oninput="window._produksiSumberPalet[${i}].jumlahPalet = this.value"></div>
            <div class="palet-field"><label>Volume (m³)</label><input type="number" step="any" value="${s.volume || ''}" oninput="window._produksiSumberPalet[${i}].volume = this.value"></div>
            <button class="btn btn-del btn-sm palet-delete-btn" onclick="window.hapusSumberPalet(${i})">✕</button>
        </div>`;
    }).join('');
}

window.closeProduksiForm = function() {
    document.getElementById("produksi-input").classList.add("hidden");
    document.getElementById("produksi-list").classList.remove("hidden");
    produksiEditId = null;
    window._produksiSumberPalet = [];
};

window.saveProduksi = function() {
    const tgl = document.getElementById("prod-tanggal")?.value;
    const openNo = document.getElementById("prod-openno")?.value.trim();
    if (!tgl) { toast("⚠️ Tanggal wajib diisi!"); return; }

    const readInt   = id => parseInt(document.getElementById(id)?.value)   || 0;
    const readFloat = id => parseFloat(document.getElementById(id)?.value) || 0;

    const shift1 = {
        planerPalet: readInt("prod-s1-planer-palet"),
        planerBagus: readFloat("prod-s1-planer-bagus"),
        planerMis:   readInt("prod-s1-planer-mis"),
        ripsawIn:    readFloat("prod-s1-ripsaw-in"),
        seri:        readInt("prod-s1-seri"),
        press:       readInt("prod-s1-press"),
        masuk:       readInt("prod-s1-masuk"),
        tidakMasuk:  readInt("prod-s1-tidakmasuk")
    };
    const shift2 = {
        planerPalet: readInt("prod-s2-planer-palet"),
        planerBagus: readFloat("prod-s2-planer-bagus"),
        planerMis:   readInt("prod-s2-planer-mis"),
        ripsawIn:    readFloat("prod-s2-ripsaw-in"),
        seri:        readInt("prod-s2-seri"),
        press:       readInt("prod-s2-press"),
        masuk:       readInt("prod-s2-masuk"),
        tidakMasuk:  readInt("prod-s2-tidakmasuk")
    };
    const item = {
        id: produksiEditId || uid(),
        tanggal: tgl,
        openNo,
        asalPalet: window._produksiSumberPalet.filter(s => s.openNo),
        shift1,
        shift2,
        limbah: readFloat("prod-limbah"),
        reject: readInt("prod-reject"),
        keterangan: document.getElementById("prod-keterangan")?.value || ""
    };

    if (produksiEditId) {
        window.produksiList = window.produksiList.map(x => x.id === produksiEditId ? item : x);
        logActivity('Update', 'Produksi', `Batch: ${item.openNo}`);
    } else {
        window.produksiList.push(item);
        logActivity('Simpan', 'Produksi', `Batch: ${item.openNo}`);
    }
    persistAll();
    closeProduksiForm();
    renderProduksi();
    if (typeof renderBatch === 'function') renderBatch();
    if (typeof renderRekap === 'function') renderRekap();
    if (typeof renderDashboard === 'function') renderDashboard();
    toast("✅ Laporan produksi disimpan!");
};

window.deleteProduksi = function(id) {
    const item = window.produksiList.find(x => x.id === id);
    if (item) logActivity('Hapus', 'Produksi', `Batch: ${item.openNo}`);
    if (!confirmDialog("Hapus laporan ini?")) return;
    window.produksiList = window.produksiList.filter(x => x.id !== id);
    persistAll();
    renderProduksi();
    if (typeof renderBatch === 'function') renderBatch();
    if (typeof renderRekap === 'function') renderRekap();
    if (typeof renderDashboard === 'function') renderDashboard();
    toast("🗑️ Laporan dihapus");
};

window.editProduksi = function(id) {
    const item = window.produksiList.find(x => x.id === id);
    if (item) openProduksiForm(item);
};

// ═══════════════════════════════════════════════
// INISIALISASI
// ═══════════════════════════════════════════════
setTimeout(() => {
    initProduksiSummary();
    initProduksiFilterBar();
    // Pastikan data tersedia
    if (window.produksiList) renderProduksi();
}, 500);