function initApp() {
    loadAllData();
    renderAll();
    switchTab("dashboard");
    // sz-tanggal diisi oleh _initSezingInputForm() di sezing.js
    // document.getElementById("sz-tanggal") diinisialisasi oleh renderSezing()
    const jualTglEl = document.getElementById("jual-tanggal");
    if (jualTglEl) jualTglEl.value = today();
    const opnameBulanEl = document.getElementById("opname-bulan");
    if (opnameBulanEl) opnameBulanEl.value = thisMonth();
    window.populateOrderDropdown?.(null);
    // Inisialisasi bulan rekap (month picker)
    const rekBln = document.getElementById("rekap-bulan");
    if (rekBln && !rekBln.value) rekBln.value = thisMonth();
    // Render chart dashboard (nama fungsi yang benar di dashboard.js)
    window.renderTrendCharts?.();
    window.renderTargetCharts?.();
}