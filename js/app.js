function initApp() {
    loadAllData();
    renderAll();
    switchTab("dashboard");
    document.getElementById("sezing-tanggal").value = today();
    document.getElementById("jual-tanggal").value = today();
    document.getElementById("opname-bulan").value = thisMonth();
    window.populateOrderDropdown(null);
    // Inisialisasi bulan rekap (month picker)
    const rekBln = document.getElementById("rekap-bulan");
    if (rekBln && !rekBln.value) rekBln.value = thisMonth();
    // Render chart dashboard (nama fungsi yang benar di dashboard.js)
    window.renderTrendCharts?.();
    window.renderTargetCharts?.();
}