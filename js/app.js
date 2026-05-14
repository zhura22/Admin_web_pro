function initApp() {
    loadAllData();
    renderAll();
    switchTab("dashboard");
    document.getElementById("sezing-tanggal").value = today();
    document.getElementById("jual-tanggal").value = today();
    document.getElementById("opname-bulan").value = thisMonth();
    window.populateOrderDropdown(null);
    const { awal, akhir } = getDateRange();
    if (document.getElementById("rekap-tgl-awal")) document.getElementById("rekap-tgl-awal").value = awal;
    if (document.getElementById("rekap-tgl-akhir")) document.getElementById("rekap-tgl-akhir").value = akhir;
    renderCharts();
    renderAllTargetCharts();
}