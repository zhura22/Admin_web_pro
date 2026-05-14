// opname.js
window.saveOpname = function() {
    const bulan = document.getElementById("opname-bulan")?.value;
    if (!bulan) { toast("⚠️ Pilih bulan"); return; }
    const entry = {
        id: uid(),
        bulan,
        log: parseFloat(document.getElementById("opname-log")?.value) || 0,
        basah: parseFloat(document.getElementById("opname-basah")?.value) || 0,
        kering: parseFloat(document.getElementById("opname-kering")?.value) || 0,
        board: parseFloat(document.getElementById("opname-board")?.value) || 0,
        limbah: parseFloat(document.getElementById("opname-limbah")?.value) || 0,
        awalBoard: parseFloat(document.getElementById("opname-awal-board")?.value) || 0,
        catatan: document.getElementById("opname-catatan")?.value || ""
    };
    window.opnameList = [entry, ...window.opnameList.filter(o => o.bulan !== bulan)];
    persistAll();
    renderOpname();
    toast("✅ Opname disimpan");
    logActivity('Simpan', 'Opname', `Bulan ${bulan}`);
};

window.renderOpname = function() {
    const container = document.getElementById("opname-list");
    if (!container) return;
    const bulan = document.getElementById("opname-bulan")?.value || thisMonth();

    const totalKayuMasuk = window.kayuList.filter(x => x.tanggal?.startsWith(bulan)).reduce((s, x) => s + (parseFloat(x.volume) || 0), 0);
    const totalProsesSawmill = window.sawmillList.filter(x => x.tanggal?.startsWith(bulan)).reduce((s, x) => s + (parseFloat(x.prosesSawmill) || 0), 0);
    const stokKayuLog = totalKayuMasuk - totalProsesSawmill;

    const totalPaletBasah = window.sawmillList.filter(x => x.tanggal?.startsWith(bulan)).reduce((s, x) => s + (x.totalVolumePalet || (x.hasilPalet || []).reduce((a, p) => a + (p.volume || 0), 0)), 0);
    const totalOvenIn = window.ovenHistoryList.filter(h => h.tanggalMasuk?.startsWith(bulan)).reduce((s, h) => s + (h.volumeMasuk || 0), 0);
    const stokPaletBasah = totalPaletBasah - totalOvenIn;

    const totalOvenOut = window.ovenHistoryList.filter(h => h.tanggalSelesai?.startsWith(bulan)).reduce((s, h) => s + (h.volumeKeluar || 0), 0);
    const totalProduksi = window.produksiList.filter(p => p.tanggal?.startsWith(bulan)).reduce((s, p) => s + ((p.shift1?.planerBagus || 0) + (p.shift2?.planerBagus || 0)), 0);
    const stokPaletKering = totalOvenOut - totalProduksi;

    const totalSezing = window.sezingList.filter(s => s.tanggal?.startsWith(bulan)).reduce((s, x) => s + (x.volume || 0), 0);
    const totalPenjualanNetto = window.penjualanList.filter(p => p.tanggal?.startsWith(bulan)).reduce((s, p) => s + ((p.volume || 0) - (p.retur || 0)), 0);
    const stokBoard = totalSezing - totalPenjualanNetto;

    const totalLimbah = window.produksiList.filter(p => p.tanggal?.startsWith(bulan)).reduce((s, p) => s + (p.limbah || 0), 0);

    container.innerHTML = window.opnameList.map(o => {
        const selLog = stokKayuLog - o.log;
        const selBasah = stokPaletBasah - o.basah;
        const selKering = stokPaletKering - o.kering;
        const selBoard = stokBoard - o.board;
        const selLimbah = totalLimbah - o.limbah;
        const sezingAktual = o.board - o.awalBoard + totalPenjualanNetto;
        const selisihSezing = sezingAktual - totalSezing;
        const selisihPersen = totalSezing > 0 ? (Math.abs(selisihSezing) / totalSezing * 100).toFixed(1) : '0.0';

        return `<div class="laporan-card mt8">
            <div class="laporan-head"><div class="laporan-title">📅 ${fmtDate(o.bulan + "-01")}</div></div>
            <div class="table-wrap"><table><thead><tr><th>Kategori</th><th>Stok Sistem</th><th>Stok Fisik</th><th>Selisih</th><th>%</th></tr></thead><tbody>
                <tr><td>Kayu Log</td><td class="right">${fmtDec(stokKayuLog, 2)}</td><td class="right">${fmtDec(o.log, 2)}</td><td class="right">${fmtDec(selLog, 2)}</td><td class="right">${stokKayuLog ? fmtDec(Math.abs(selLog) / stokKayuLog * 100, 1) + '%' : '-'}</td></tr>
                <tr><td>Palet Basah</td><td class="right">${fmtDec(stokPaletBasah, 2)}</td><td class="right">${fmtDec(o.basah, 2)}</td><td class="right">${fmtDec(selBasah, 2)}</td><td class="right">${stokPaletBasah ? fmtDec(Math.abs(selBasah) / stokPaletBasah * 100, 1) + '%' : '-'}</td></tr>
                <tr><td>Palet Kering</td><td class="right">${fmtDec(stokPaletKering, 2)}</td><td class="right">${fmtDec(o.kering, 2)}</td><td class="right">${fmtDec(selKering, 2)}</td><td class="right">${stokPaletKering ? fmtDec(Math.abs(selKering) / stokPaletKering * 100, 1) + '%' : '-'}</td></tr>
                <tr><td>Board</td><td class="right">${fmtDec(stokBoard, 2)}</td><td class="right">${fmtDec(o.board, 2)}</td><td class="right">${fmtDec(selBoard, 2)}</td><td class="right">${stokBoard ? fmtDec(Math.abs(selBoard) / stokBoard * 100, 1) + '%' : '-'}</td></tr>
                <tr><td>Limbah</td><td class="right">${fmtDec(totalLimbah, 2)}</td><td class="right">${fmtDec(o.limbah, 2)}</td><td class="right">${fmtDec(selLimbah, 2)}</td><td class="right">${totalLimbah ? fmtDec(Math.abs(selLimbah) / totalLimbah * 100, 1) + '%' : '-'}</td></tr>
            </tbody></table></div>
            <div class="section-head mt16">📊 Rekonsiliasi Sezing</div>
            <div class="table-wrap"><table><thead><tr><th>Uraian</th><th>Volume (m³)</th></tr></thead><tbody>
                <tr><td>Stok Awal Board</td><td class="right">${fmtDec(o.awalBoard, 2)}</td></tr>
                <tr><td>Total Penjualan Board (Netto)</td><td class="right">${fmtDec(totalPenjualanNetto, 2)}</td></tr>
                <tr><td>Stok Akhir Board (Opname)</td><td class="right">${fmtDec(o.board, 2)}</td></tr>
                <tr style="font-weight:bold;color:var(--gold);"><td>Sezing Aktual (perhitungan)</td><td class="right">${fmtDec(sezingAktual, 2)}</td></tr>
                <tr><td>Sezing Tercatat (harian)</td><td class="right">${fmtDec(totalSezing, 2)}</td></tr>
                <tr style="color:${Math.abs(selisihSezing) > 0.5 ? 'var(--red)' : 'var(--green)'};"><td>Selisih</td><td class="right">${fmtDec(selisihSezing, 2)} (${selisihPersen}%)</td></tr>
            </tbody></table></div>
            ${o.catatan ? `<p style="margin-top:8px;color:#888">📝 ${o.catatan}</p>` : ''}
        </div>`;
    }).join("");
};