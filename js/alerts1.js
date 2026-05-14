let lastCriticalAlertTime = 0;

window.checkAlerts = function(showModal = false) {
    const alerts = [];
    const bulan = thisMonth();
    const totalKayuBulanIni = window.kayuList.filter(x => x.tanggal?.startsWith(bulan)).reduce((s,x) => s + (parseFloat(x.volume)||0), 0);
    const totalSawmillProses = window.sawmillList.filter(x => x.tanggal?.startsWith(bulan)).reduce((s,x) => s + (parseFloat(x.prosesSawmill)||0), 0);
    const rendemen = totalKayuBulanIni > 0 ? (totalSawmillProses / totalKayuBulanIni) * 100 : 0;
    if (rendemen < window.appSettings.rendemenMin) alerts.push(`Rendemen sawmill ${rendemen.toFixed(1)}% (min ${window.appSettings.rendemenMin}%)`);
    
    // PERBAIKAN: Gunakan stok realtime dari dashboard.js
    const stokRealtime = typeof window.hitungStokRealtime === 'function' ? window.hitungStokRealtime() : { stokKering: 0 };
    const stokKering = stokRealtime.stokKering;
    if (stokKering < window.appSettings.minStokKering) alerts.push(`Stok palet kering tersisa ${stokKering.toFixed(1)} m³ (min ${window.appSettings.minStokKering})`);
    
    const ovOver = window.ovenHistoryList.filter(h => h.status === 'active' && diffDays(h.tanggalMasuk, today()) > 5);
    if (ovOver.length) alerts.push(`${ovOver.length} oven sudah >5 hari`);
    
    const badge = document.getElementById("header-alert");
    if (badge) {
        if (alerts.length > 0) {
            badge.style.display = 'inline-flex';
            document.getElementById("alert-count").textContent = alerts.length;
            badge.title = alerts.join("\n");
            const now = Date.now();
            if (showModal && (now - lastCriticalAlertTime) > 3600000 && alerts.length > 0) {
                lastCriticalAlertTime = now;
                const modalContent = `<ul>${alerts.map(a => `<li>${a}</li>`).join('')}</ul>`;
                window.showModal('⚠️ Peringatan Kritis', modalContent);
            }
            toast(`⚠️ ${alerts.length} peringatan! Klik badge untuk detail.`, 5000);
        } else {
            badge.style.display = 'none';
        }
    }
};

function diffDays(d1, d2) {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return Math.ceil((date2 - date1) / (1000 * 60 * 60 * 24));
}

// Fungsi ini TIDAK dipakai lagi, tapi dipertahankan untuk kompatibilitas
function hitungStokKering() {
    const bulan = thisMonth();
    const totalOvenOut = window.ovenHistoryList.filter(h => h.tanggalSelesai?.startsWith(bulan)).reduce((s,h) => s + (h.volumeKeluar || 0), 0);
    const totalProduksi = window.produksiList.filter(p => p.tanggal?.startsWith(bulan)).reduce((s,p) => s + ((p.shift1?.planerBagus || 0) + (p.shift2?.planerBagus || 0)), 0);
    return Math.max(0, totalOvenOut - totalProduksi);
}