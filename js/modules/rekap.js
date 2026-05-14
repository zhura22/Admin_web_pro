// rekap.js
window.renderBatch = function() {
    const container = document.getElementById("batch-list");
    if (!container) return;
    const openNumbers = [...new Set(window.sawmillList.map(s => s.openNo).filter(Boolean))];
    if (!openNumbers.length) { container.innerHTML = '<div class="empty">📭 Belum ada batch</div>'; return; }
    let html = '';
    openNumbers.forEach(openNo => {
        const sawmillEntries = window.sawmillList.filter(s => s.openNo === openNo);
        const totalLog = sawmillEntries.reduce((s, x) => s + (parseFloat(x.prosesSawmill) || 0), 0);
        const totalPalet = sawmillEntries.reduce((s, x) => s + (x.totalVolumePalet || (x.hasilPalet || []).reduce((a, p) => a + (p.volume || 0), 0)), 0);
        const ovenEntries = window.ovenHistoryList.filter(h => h.openNo === openNo);
        const totalOvenIn = ovenEntries.reduce((s, h) => s + (h.volumeMasuk || 0), 0);
        const totalOvenOut = ovenEntries.reduce((s, h) => s + (h.volumeKeluar || 0), 0);
        const prodEntries = window.produksiList.filter(p => p.openNo === openNo);
        const totalPlanerBagus = prodEntries.reduce((s, p) => s + ((p.shift1?.planerBagus || 0) + (p.shift2?.planerBagus || 0)), 0);
        const totalLimbah = prodEntries.reduce((s, p) => s + (p.limbah || 0), 0);
        const rendemenSawmill = totalLog > 0 ? ((totalPalet / totalLog) * 100).toFixed(1) : "-";
        const overallYield = totalLog > 0 ? ((totalPlanerBagus / totalLog) * 100).toFixed(1) : "-";
        html += `<div class="laporan-card"><div class="laporan-head"><div class="laporan-title">📦 Batch ${openNo}</div></div><div class="stat-pills"><div class="stat-pill"><span class="stat-label">Log</span><span class="stat-val">${fmtDec(totalLog, 2)} m³</span></div><div class="stat-pill"><span class="stat-label">Sawmill</span><span class="stat-val">${rendemenSawmill}%</span></div><div class="stat-pill"><span class="stat-label">Oven In</span><span class="stat-val">${fmtDec(totalOvenIn, 2)} m³</span></div><div class="stat-pill"><span class="stat-label">Planer Bagus</span><span class="stat-val">${fmtDec(totalPlanerBagus, 2)} m³</span></div><div class="stat-pill"><span class="stat-label">Limbah</span><span class="stat-val">${fmtDec(totalLimbah, 2)} m³</span></div><div class="stat-pill"><span class="stat-label">Yield</span><span class="stat-val">${overallYield}%</span></div></div></div>`;
    });
    container.innerHTML = html;
};

window.renderRekapRange = function() {
    let { awal, akhir } = getDateRange();
    renderRekap(awal, akhir);
};

window.renderRekap = function(awal, akhir) {
    if (!awal || !akhir) {
        const range = getDateRange();
        awal = range.awal;
        akhir = range.akhir;
    }
    const kF = filterByDateRange(kayuList, awal, akhir);
    const sF = filterByDateRange(sawmillList, awal, akhir);
    const prodF = filterByDateRange(produksiList, awal, akhir);
    const sezF = filterByDateRange(sezingList, awal, akhir);
    const penF = filterByDateRange(penjualanList, awal, akhir);

    const ovenInRange = ovenHistoryList.filter(h => h.tanggalMasuk && h.tanggalMasuk >= awal && h.tanggalMasuk <= akhir);
    const ovenOutRange = ovenHistoryList.filter(h => h.status === 'completed' && h.tanggalSelesai && h.tanggalSelesai >= awal && h.tanggalSelesai <= akhir);
    
    const totalKayu = kF.reduce((s, x) => s + (parseFloat(x.volume) || 0), 0);
    const totalSawmillProses = sF.reduce((s, x) => s + (parseFloat(x.prosesSawmill) || 0), 0);
    const totalPaletBasah = sF.reduce((s, x) => s + (x.totalVolumePalet || (x.hasilPalet || []).reduce((a, p) => a + (p.volume || 0), 0)), 0);
    const totalOvenIn = ovenInRange.reduce((s, h) => s + (h.volumeMasuk || 0), 0);
    const totalOvenOut = ovenOutRange.reduce((s, h) => s + (h.volumeKeluar || 0), 0);
    const totalPlanerBagus = prodF.reduce((s, p) => s + ((p.shift1?.planerBagus || 0) + (p.shift2?.planerBagus || 0)), 0);
    const totalPapanMis = prodF.reduce((s, p) => s + ((p.shift1?.planerMis || 0) + (p.shift2?.planerMis || 0)), 0);
    const totalSeri = prodF.reduce((s, p) => s + ((p.shift1?.seri || 0) + (p.shift2?.seri || 0)), 0);
    const totalPress = prodF.reduce((s, p) => s + ((p.shift1?.press || 0) + (p.shift2?.press || 0)), 0);
    const totalLimbah = prodF.reduce((s, p) => s + (p.limbah || 0), 0);
    const totalReject = prodF.reduce((s, p) => s + (p.reject || 0), 0);
    const totalSezing = sezF.reduce((s, x) => s + (x.volume || 0), 0);
    const totalPenjualanNetto = penF.reduce((s, p) => s + ((p.volume || 0) - (p.retur || 0)), 0);
    const totalRetur = penF.reduce((s, p) => s + (p.retur || 0), 0);

    const rendemenSawmill = totalKayu > 0 ? ((totalPaletBasah / totalKayu) * 100).toFixed(1) : "-";
    const susutOven = totalOvenIn > 0 ? (((totalOvenIn - totalOvenOut) / totalOvenIn) * 100).toFixed(1) : "-";
    const rendemenPlaner = totalOvenOut > 0 ? ((totalPlanerBagus / totalOvenOut) * 100).toFixed(1) : "-";
    const overallYield = totalKayu > 0 ? ((totalPlanerBagus / totalKayu) * 100).toFixed(1) : "-";

    // Flow chart
    document.getElementById("rekap-flow").innerHTML = `
        <div class="flow-step"><div>Kayu Masuk</div><div class="summary-value">${fmtDec(totalKayu, 1)} m³</div></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step"><div>Sawmill</div><div class="summary-value">${fmtDec(totalPaletBasah, 1)} m³</div><div>R:${rendemenSawmill}%</div></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step"><div>Oven Out</div><div class="summary-value">${fmtDec(totalOvenOut, 1)} m³</div><div>Susut:${susutOven}%</div></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step"><div>Planer Bagus</div><div class="summary-value">${fmtDec(totalPlanerBagus, 1)} m³</div><div>R:${rendemenPlaner}%</div></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step"><div>Overall Yield</div><div class="summary-value">${overallYield}%</div></div>
    `;

    // Statistik ringkasan
    document.getElementById("rekap-stats-container").innerHTML = `
        <div class="stat-card"><div class="stat-card-label">Total Kayu</div><div class="stat-card-value">${fmtDec(totalKayu,2)} m³</div></div>
        <div class="stat-card"><div class="stat-card-label">Total Produksi</div><div class="stat-card-value">${fmtDec(totalPlanerBagus,2)} m³</div></div>
        <div class="stat-card"><div class="stat-card-label">Total Penjualan (Netto)</div><div class="stat-card-value">${fmtDec(totalPenjualanNetto,2)} m³</div></div>
        <div class="stat-card"><div class="stat-card-label">Rendemen Sawmill</div><div class="stat-card-value">${rendemenSawmill}%</div></div>
    `;

    // Tabel Sawmill
    document.getElementById("rekap-tbody").innerHTML = sF.map(lap => {
        const totalVol = lap.totalVolumePalet || (lap.hasilPalet || []).reduce((a,p) => a + (p.volume||0),0);
        const rendemen = lap.prosesSawmill > 0 ? (totalVol / lap.prosesSawmill * 100).toFixed(1) : "-";
        return `<tr>
            <td>${fmtDate(lap.tanggal)}</td>
            <td class="right">${fmtDec(lap.prosesSawmill,2)}</td>
            <td class="right">${rendemen}%</td>
            <td class="right">${fmtDec(totalVol,2)}</td>
            <td class="right">${lap.tenagaMasuk||0}</td>
            <td class="right">${lap.tenagaTidakMasuk||0}</td>
        </tr>`;
    }).join("");

    // Tabel Produksi
    document.getElementById("rekap-produksi-tbody").innerHTML = prodF.map(p => {
        const s1=p.shift1||{}, s2=p.shift2||{};
        const planerBagus = (s1.planerBagus||0)+(s2.planerBagus||0);
        const planerMis = (s1.planerMis||0)+(s2.planerMis||0);
        const ripsawIn = (s1.ripsawIn||0)+(s2.ripsawIn||0);
        const seri = (s1.seri||0)+(s2.seri||0);
        const press = (s1.press||0)+(s2.press||0);
        const totalInputPalet = (p.asalPalet || []).reduce((a,b) => a + (b.volume||0), 0);
        return `<tr>
            <td>${fmtDate(p.tanggal)}</td>
            <td>${p.openNo||'-'}</td>
            <td class="right">${fmtDec(totalInputPalet,2)}</td>
            <td class="right">${fmtDec(planerBagus,2)}</td>
            <td class="right">${planerMis}</td>
            <td class="right">${fmtDec(ripsawIn,2)}</td>
            <td class="right">${seri}</td>
            <td class="right">${press}</td>
            <td class="right">${fmtDec(p.limbah||0,2)}</td>
            <td class="right">${p.reject||0}</td>
        </tr>`;
    }).join("");

    // Tabel Sezing & Penjualan
    const combined = [...sezF.map(s => ({ ...s, type: 'sezing' })), ...penF.map(p => ({ ...p, type: 'jual' }))];
    combined.sort((a,b) => a.tanggal.localeCompare(b.tanggal));
    document.getElementById("rekap-sezing-tbody").innerHTML = combined.map(item => {
        if (item.type === 'sezing') {
            return `<tr><td>${fmtDate(item.tanggal)}</td><td class="right">${fmtDec(item.volume,2)}</td><td class="right">-</td><td class="right">-</td></tr>`;
        } else {
            return `<tr><td>${fmtDate(item.tanggal)}</td><td class="right">-</td><td class="right">${fmtDec(item.volume,2)}</td><td class="right">${fmtDec(item.retur||0,2)}</td></tr>`;
        }
    }).join("");
};