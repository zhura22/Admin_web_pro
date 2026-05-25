window.renderAll = function() {
    renderKayu();
    renderOrder();
    renderSawmill();
    renderOvenStatus();
    renderProduksi();
    renderSezing();
    renderPenjualan();
    renderRekap();
    renderBatch();
    renderOpname();
    renderDashboard();
    renderLog();
    renderSettings();
    updateHeaderDate();
    checkAlerts();
};

function updateHeaderDate() {
    document.getElementById("header-date").textContent = fmtDate(today());
}

window.printSection = function(tabId) {
    const panel = document.getElementById(tabId);
    if (!panel) return;
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    panel.classList.remove('hidden');
    window.print();
    const active = document.querySelector('.sidebar-item.active');
    if (active) switchTab(active.dataset.tab);
};

window.switchTab = function(name) {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
    const target = document.getElementById(`tab-${name}`);
    if (target) target.classList.remove("hidden");
    document.querySelectorAll(".sidebar-item").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === name));
    
    if (name === "dashboard") renderDashboard();
    if (name === "rekap") {
        const { awal, akhir } = getDateRange();
        document.getElementById("rekap-tgl-awal").value = awal;
        document.getElementById("rekap-tgl-akhir").value = akhir;
        renderRekap(awal, akhir);
    }
    if (name === "oven") renderOvenStatus();
    if (name === "sezing") {
        document.getElementById("sezing-tanggal").value = today();
        if (window.renderSezing) window.renderSezing();
    }
    if (name === "penjualan") {
        document.getElementById("jual-tanggal").value = today();
        resetJualForm();
        if (window.renderPenjualan) window.renderPenjualan();
    }
    if (name === "opname") {
        document.getElementById("opname-bulan").value = thisMonth();
        renderOpname();
    }
    if (name === "batch") renderBatch();
    if (name === "log") renderLog();
    if (name === "settings") renderSettings();
    
    resetSubTab(name);
};

function resetSubTab(tabName) {
    const panel = document.getElementById(`tab-${tabName}`);
    if (!panel) return;
    const firstSubtab = panel.querySelector('.subtab-btn.active');
    if (firstSubtab) {
        activateSubTab(tabName, firstSubtab.dataset.subtab);
    } else {
        const first = panel.querySelector('.subtab-btn');
        if (first) activateSubTab(tabName, first.dataset.subtab);
    }
}

function activateSubTab(tabName, subtab) {
    const panel = document.getElementById(`tab-${tabName}`);
    if (!panel) return;
    panel.querySelectorAll('.subtab-panel').forEach(sp => sp.classList.add('hidden'));
    const targetPanel = document.getElementById(subtab);
    if (targetPanel) targetPanel.classList.remove('hidden');
    panel.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subtab === subtab);
        btn.classList.toggle('btn-primary', btn.dataset.subtab === subtab);
        btn.classList.toggle('btn-secondary', btn.dataset.subtab !== subtab);
    });
    
    if (subtab === 'sawmill-input') {
        const container = document.getElementById('sawmill-form-container');
        if (container && container.innerHTML.trim() === '' && typeof window.openSawmillForm === 'function') {
            window.openSawmillForm();
        }
    }
    if (subtab === 'produksi-input') {
        const container = document.getElementById('produksi-form-container');
        if (container && container.innerHTML.trim() === '' && typeof window.openProduksiForm === 'function') {
            window.openProduksiForm();
        }
    }
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('subtab-btn')) {
        const subtab = e.target.dataset.subtab;
        const panel = e.target.closest('.panel');
        if (panel) activateSubTab(panel.id.replace('tab-',''), subtab);
    }
});

document.querySelectorAll(".sidebar-item").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});