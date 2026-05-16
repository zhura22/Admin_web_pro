// dashboard.js – lengkap dengan filter bulan untuk semua komponen

window.renderDashboard = function() {
    const container = document.getElementById("dashboard-container");
    if (!container) return;

    // Ambil bulan dari localStorage atau default bulan ini
    let selectedMonth = localStorage.getItem('dashboard_month') || thisMonth();
    const hashMatch = window.location.hash.match(/month=(\d{4}-\d{2})/);
    if (hashMatch) selectedMonth = hashMatch[1];
    
    const bulanTampil = selectedMonth;
    const stok = hitungStokRealtime();

    // Data hari ini
    const totalKayuHariIni = kayuList.filter(x => x.tanggal === today()).reduce((s,x) => s + (parseFloat(x.volume)||0), 0);
    const totalProduksiHariIni = produksiList.filter(x => x.tanggal === today()).reduce((s,p) => s + ((p.shift1?.planerBagus||0)+(p.shift2?.planerBagus||0)), 0);
    const totalPenjualanHariIni = penjualanList.filter(x => x.tanggal === today()).reduce((s,x) => s + (parseFloat(x.volume)||0), 0);
    const totalTenagaHadir = produksiList.filter(x => x.tanggal === today()).reduce((s,p) => s + ((p.shift1?.masuk||0)+(p.shift2?.masuk||0)), 0);
    
    const totalPenjualanBulan = penjualanList.filter(p => p.tanggal?.startsWith(bulanTampil)).reduce((s, p) => s + ((p.volume || 0) - (p.retur || 0)), 0);
    
    container.innerHTML = `
        <div class="panel-head">
            <div>
                <h2 class="panel-title">🏠 Dashboard</h2>
                <p class="panel-sub">Ringkasan Hari Ini</p>
            </div>
            <div class="flex gap10 items-center">
                <div class="field" style="margin:0;">
                    <label style="font-size:10px;">Bulan Laporan</label>
                    <input type="month" id="dashboard-month" value="${bulanTampil}" style="padding:6px; border-radius:var(--radius-sm); background:var(--input-bg); border:1px solid var(--border); color:var(--text);">
                </div>
                <button class="btn btn-secondary btn-sm" id="refresh-dashboard-btn" style="margin-top:16px;">📅 Tampilkan</button>
            </div>
        </div>
        <div class="summary-row">
            <div class="summary-card"><div class="summary-label">📥 Kayu Masuk Hari Ini</div><div class="summary-value">${fmtDec(totalKayuHariIni,2)} m³</div></div>
            <div class="summary-card"><div class="summary-label">📦 Produksi Hari Ini</div><div class="summary-value">${fmtDec(totalProduksiHariIni,2)} m³</div></div>
            <div class="summary-card"><div class="summary-label">📤 Penjualan Hari Ini</div><div class="summary-value">${fmtDec(totalPenjualanHariIni,2)} m³</div></div>
            <div class="summary-card"><div class="summary-label">👥 Tenaga Hadir</div><div class="summary-value">${totalTenagaHadir} org</div></div>
        </div>
        <div class="summary-row">
            <div class="summary-card" style="grid-column: span 4; text-align: center; background: var(--gold-dim); border-color: var(--gold);">
                <div class="summary-label" style="font-size: 12px;">📊 KUMULATIF PENJUALAN BOARD (NETTO)</div>
                <div class="summary-value" style="font-size: 32px; color: var(--gold);" id="dashboard-penjualan-bulan">${fmtDec(totalPenjualanBulan, 2)} m³</div>
                <div style="font-size:10px;">Bulan: ${bulanTampil}</div>
            </div>
        </div>
        <div class="rekap-stats">
            <div class="stat-card"><div class="stat-card-label">🌲 Stok Kayu Log</div><div class="stat-card-value">${fmtDec(stok.stokLog,2)} m³</div></div>
            <div class="stat-card"><div class="stat-card-label">🔥 Stok Palet Basah</div><div class="stat-card-value">${fmtDec(stok.stokBasah,2)} m³</div></div>
            <div class="stat-card"><div class="stat-card-label">✅ Stok Palet Kering</div><div class="stat-card-value">${fmtDec(stok.stokKering,2)} m³</div></div>
            <div class="stat-card"><div class="stat-card-label">📦 Stok Board</div><div class="stat-card-value">${fmtDec(stok.stokBoard,2)} m³</div></div>
        </div>
        <div class="panel-head" style="margin-top:20px;">
            <h2 class="panel-title">📊 Persentase Pencapaian Target Bulan Ini</h2>
            <p class="panel-sub" id="target-subtitle"></p>
        </div>
        <div id="achievement-stats" class="rekap-stats"></div>
        <div class="flex gap10" style="margin-top:16px;">
            <button class="btn btn-primary" onclick="switchTab('kayu')">➕ Input Kayu</button>
            <button class="btn btn-primary" onclick="switchTab('produksi')">➕ Input Produksi</button>
        </div>
        <div class="panel-head" style="margin-top:20px;"><h2 class="panel-title">🎯 Target Hari Ini</h2></div>
        <div id="target-capaian-container" class="rekap-stats"></div>
        
        <div class="panel-head" style="margin-top:20px;"><h2 class="panel-title">📊 Target vs Realisasi (Kumulatif Bulan Ini)</h2></div>
        <div class="chart-vertical" id="target-charts-container">
            <canvas id="chart-target-kayu" height="200"></canvas>
            <canvas id="chart-target-sawmill" height="200"></canvas>
            <canvas id="chart-target-planer" height="200"></canvas>
            <canvas id="chart-target-ripsaw" height="200"></canvas>
            <canvas id="chart-target-seri" height="200"></canvas>
            <canvas id="chart-target-press" height="200"></canvas>
            <canvas id="chart-target-sezing" height="200"></canvas>
        </div>
        
        <div class="panel-head" style="margin-top:20px;"><h2 class="panel-title">📈 Tren 30 Hari Terakhir</h2></div>
        <div class="chart-vertical">
            <canvas id="chart-rendemen" height="200"></canvas>
            <canvas id="chart-produksi" height="200"></canvas>
            <canvas id="chart-stok" height="200"></canvas>
            <canvas id="chart-penjualan" height="200"></canvas>
        </div>
    `;

    // Pasang event listener untuk filter bulan
    const monthPicker = document.getElementById("dashboard-month");
    const refreshBtn = document.getElementById("refresh-dashboard-btn");
    if (monthPicker && refreshBtn) {
        const updateDashboardByMonth = () => {
            const newMonth = monthPicker.value;
            localStorage.setItem('dashboard_month', newMonth);
            // Update penjualan bulan
            const penjualanNew = penjualanList.filter(p => p.tanggal?.startsWith(newMonth)).reduce((s, p) => s + ((p.volume || 0) - (p.retur || 0)), 0);
            document.getElementById("dashboard-penjualan-bulan").innerHTML = fmtDec(penjualanNew, 2);
            document.querySelector("#dashboard-penjualan-bulan").parentElement.querySelector("div:last-child").innerHTML = `Bulan: ${newMonth}`;
            renderAchievementCards(newMonth);
            renderAllTargetChartsForMonth(newMonth);
        };
        refreshBtn.onclick = updateDashboardByMonth;
        monthPicker.addEventListener('change', updateDashboardByMonth);
    }
    
    renderTargetCapaian();
    renderCharts();
    renderAllTargetChartsForMonth(bulanTampil);
    renderAchievementCards(bulanTampil);
    checkAlerts();
};

// ========== STOK REALTIME ==========
function hitungStokRealtime() {
    const totalKayuMasuk = kayuList.reduce((s, x) => s + (parseFloat(x.volume) || 0), 0);
    const totalProsesSawmill = sawmillList.reduce((s, x) => s + (parseFloat(x.prosesSawmill) || 0), 0);
    const stokLog = totalKayuMasuk - totalProsesSawmill;
    
    const totalPaletBasah = sawmillList.reduce((s, x) => s + (x.totalVolumePalet || (x.hasilPalet || []).reduce((a,p) => a + (p.volume || 0), 0)), 0);
    const totalOvenIn = ovenHistoryList.reduce((s, h) => s + (h.volumeMasuk || 0), 0);
    const stokBasah = totalPaletBasah - totalOvenIn;
    
    const totalOvenOut = ovenHistoryList.filter(h => h.status === 'completed').reduce((s, h) => s + (h.volumeKeluar || 0), 0);
    const totalProduksi = produksiList.reduce((s, p) => s + ((p.shift1?.planerBagus || 0) + (p.shift2?.planerBagus || 0)), 0);
    const stokKering = totalOvenOut - totalProduksi;
    
    const totalSezing = sezingList.reduce((s, x) => s + (x.volume || 0), 0);
    const totalPenjualanNetto = penjualanList.reduce((s, p) => s + ((p.volume || 0) - (p.retur || 0)), 0);
    const stokBoard = totalSezing - totalPenjualanNetto;
    
    return { stokLog, stokBasah, stokKering, stokBoard };
}

// ========== TARGET HARIAN ==========
function renderTargetCapaian() {
    const container = document.getElementById("target-capaian-container");
    if (!container) return;
    const todayStr = today();
    const prodToday = produksiList.find(p => p.tanggal === todayStr);
    const planerBagus = (prodToday?.shift1?.planerBagus || 0) + (prodToday?.shift2?.planerBagus || 0);
    const press = (prodToday?.shift1?.press || 0) + (prodToday?.shift2?.press || 0);
    const targetPlaner = window.appSettings.targetPlaner || 12;
    const targetPress = window.appSettings.targetPress || 700;
    const persenPlaner = (planerBagus / targetPlaner) * 100;
    const persenPress = (press / targetPress) * 100;
    
    container.innerHTML = `
        <div class="stat-card"><div class="stat-card-label">Planer Bagus (m³)</div><div class="stat-card-value">${planerBagus} / ${targetPlaner}</div><progress value="${persenPlaner}" max="100" style="width:100%; height:8px; border-radius:4px;"></progress><span style="font-size:10px;">${persenPlaner.toFixed(0)}%</span></div>
        <div class="stat-card"><div class="stat-card-label">Press (lbr)</div><div class="stat-card-value">${press} / ${targetPress}</div><progress value="${persenPress}" max="100" style="width:100%; height:8px; border-radius:4px;"></progress><span style="font-size:10px;">${persenPress.toFixed(0)}%</span></div>
    `;
}

// ========== GRAFIK TREN 30 HARI ==========
function renderCharts() {
    const labels = [];
    const rendemenData = [];
    const produksiData = [];
    const stokData = [];
    const penjualanData = [];
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        last30Days.push(dateStr);
    }
    last30Days.forEach(date => {
        labels.push(date.slice(5));
        const kayuHari = kayuList.filter(x => x.tanggal === date).reduce((s,x)=>s+(x.volume||0),0);
        const paletHari = sawmillList.filter(x => x.tanggal === date).reduce((s,x)=>s+(x.totalVolumePalet||0),0);
        const rendemen = kayuHari > 0 ? (paletHari/kayuHari)*100 : 0;
        rendemenData.push(rendemen);
        const produksiHari = produksiList.filter(p => p.tanggal === date).reduce((s,p)=>s+((p.shift1?.planerBagus||0)+(p.shift2?.planerBagus||0)),0);
        produksiData.push(produksiHari);
        const allOvenOut = ovenHistoryList.filter(h => h.tanggalSelesai && h.tanggalSelesai <= date).reduce((s,h)=>s+(h.volumeKeluar||0),0);
        const allProduksi = produksiList.filter(p => p.tanggal && p.tanggal <= date).reduce((s,p)=>s+((p.shift1?.planerBagus||0)+(p.shift2?.planerBagus||0)),0);
        stokData.push(allOvenOut - allProduksi);
        const penjualanHari = penjualanList.filter(p => p.tanggal === date).reduce((s,p)=>s+(p.volume||0),0);
        penjualanData.push(penjualanHari);
    });
    
    if (window.myChartRendemen) window.myChartRendemen.destroy();
    if (window.myChartProduksi) window.myChartProduksi.destroy();
    if (window.myChartStok) window.myChartStok.destroy();
    if (window.myChartPenjualan) window.myChartPenjualan.destroy();
    
    const ctxR = document.getElementById('chart-rendemen')?.getContext('2d');
    const ctxP = document.getElementById('chart-produksi')?.getContext('2d');
    const ctxS = document.getElementById('chart-stok')?.getContext('2d');
    const ctxJ = document.getElementById('chart-penjualan')?.getContext('2d');
    
    if (ctxR) window.myChartRendemen = new Chart(ctxR, { type: 'line', data: { labels, datasets: [{ label: 'Rendemen %', data: rendemenData, borderColor: '#d4a017', fill: false }] }, options: { responsive: true } });
    if (ctxP) window.myChartProduksi = new Chart(ctxP, { type: 'bar', data: { labels, datasets: [{ label: 'Produksi (m³)', data: produksiData, backgroundColor: '#d4a017' }] }, options: { responsive: true } });
    if (ctxS) window.myChartStok = new Chart(ctxS, { type: 'line', data: { labels, datasets: [{ label: 'Stok Kering (m³)', data: stokData, borderColor: '#4ade80', fill: false }] }, options: { responsive: true } });
    if (ctxJ) window.myChartPenjualan = new Chart(ctxJ, { type: 'bar', data: { labels, datasets: [{ label: 'Penjualan (m³)', data: penjualanData, backgroundColor: '#f87171' }] }, options: { responsive: true } });
}

// ========== GRAFIK TARGET UNTUK BULAN TERTENTU ==========
function renderAllTargetChartsForMonth(month) {
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const lastDate = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const endDate = `${year}-${monthNum}-${lastDate}`;
    const todayStr = today();
    const finalEndDate = (month === thisMonth()) ? todayStr : endDate;
    
    renderChartTargetForDateRange('kayu', 'Kayu Masuk', kayuList, 'volume', window.appSettings.targetKayuHarian || 30, startDate, finalEndDate, 'stokAwalKayu');
    renderChartTargetForDateRange('sawmill', 'Proses Sawmill', sawmillList, 'prosesSawmill', window.appSettings.targetSawmillHarian || 25, startDate, finalEndDate, 0);
    renderChartTargetForDateRange('planer', 'Planer Bagus', produksiList, (item) => (item.shift1?.planerBagus||0)+(item.shift2?.planerBagus||0), window.appSettings.targetPlaner || 12, startDate, finalEndDate, 0);
    renderChartTargetForDateRange('ripsaw', 'Ripsaw Input', produksiList, (item) => (item.shift1?.ripsawIn||0)+(item.shift2?.ripsawIn||0), window.appSettings.targetRipsaw || 13, startDate, finalEndDate, 0);
    renderChartTargetForDateRange('seri', 'Seri Hasil', produksiList, (item) => (item.shift1?.seri||0)+(item.shift2?.seri||0), window.appSettings.targetSeri || 700, startDate, finalEndDate, 0);
    renderChartTargetForDateRange('press', 'Press Hasil', produksiList, (item) => (item.shift1?.press||0)+(item.shift2?.press||0), window.appSettings.targetPress || 700, startDate, finalEndDate, 0);
    renderChartTargetForDateRange('sezing', 'Sezing', sezingList, 'volume', window.appSettings.targetSezingHarian || 15, startDate, finalEndDate, 0);
}

function renderChartTargetForDateRange(id, label, dataList, valueField, targetHarian, startDate, endDate, stokAwalField = 0) {
    const canvas = document.getElementById(`chart-target-${id}`);
    if (!canvas) return;

    const stokAwal = (typeof stokAwalField === 'string') ? (window.appSettings[stokAwalField] || 0) : stokAwalField;
    
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    
    let targetKumulatif = [];
    let realisasiKumulatif = [];
    let akumulasiTarget = 0;
    let akumulasiRealisasi = stokAwal;

    function isWeekend(tglStr) {
        const date = new Date(tglStr);
        return date.getDay() === 0;
    }

    for (let i = 0; i < dates.length; i++) {
        const tgl = dates[i];
        if (!isWeekend(tgl)) {
            akumulasiTarget += targetHarian;
        }
        targetKumulatif.push(akumulasiTarget);

        let nilaiHari = 0;
        if (typeof valueField === 'function') {
            nilaiHari = dataList.filter(x => x.tanggal === tgl).reduce((s, item) => s + valueField(item), 0);
        } else {
            nilaiHari = dataList.filter(x => x.tanggal === tgl).reduce((s, item) => s + (parseFloat(item[valueField]) || 0), 0);
        }
        akumulasiRealisasi += nilaiHari;
        realisasiKumulatif.push(akumulasiRealisasi);
    }

    const chartKey = `myChartTarget_${id}`;
    if (window[chartKey]) window[chartKey].destroy();
    const ctx = canvas.getContext('2d');
    window[chartKey] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(d => d.slice(5)),
            datasets: [
                { label: `Target Kumulatif ${label} (${targetHarian}/hari kerja)`, data: targetKumulatif, borderColor: '#60a5fa', borderWidth: 2, fill: false, tension: 0.1 },
                { label: `Realisasi Kumulatif ${label}`, data: realisasiKumulatif, borderColor: '#d4a017', borderWidth: 2, fill: false, tension: 0.1 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            let value = context.raw;
                            let result = `${label}: ${value.toFixed(1)}`;
                            if (context.dataset.borderColor === '#d4a017' && targetKumulatif[context.dataIndex] > 0) {
                                const targetVal = targetKumulatif[context.dataIndex];
                                const persen = (value / targetVal) * 100;
                                result += ` (${persen.toFixed(1)}% dari target)`;
                            }
                            return result;
                        }
                    }
                },
                legend: { position: 'top', labels: { color: '#e6dfd0' } }
            },
            scales: {
                y: { title: { display: true, text: 'Kumulatif', color: '#e6dfd0' }, grid: { color: '#2e2b20' }, ticks: { color: '#e6dfd0' } },
                x: { title: { display: true, text: 'Tanggal', color: '#e6dfd0' }, ticks: { color: '#e6dfd0', maxRotation: 45, minRotation: 45 } }
            }
        }
    });
}

// ========== CARD PENCAPAIAN (ACHIEVEMENT) ==========
function renderAchievementCards(bulan) {
    const container = document.getElementById("achievement-stats");
    if (!container) return;
    
    const [year, month] = bulan.split('-');
    const startOfMonth = new Date(parseInt(year), parseInt(month)-1, 1);
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0);
    const bulanIni = startOfMonth.toISOString().split('T')[0];
    const todayStr = today();
    const endDate = (bulan === thisMonth()) ? todayStr : endOfMonth.toISOString().split('T')[0];
    
    // Hitung hari kerja dalam bulan yang dipilih (Senin-Sabtu)
    let workingDays = 0;
    let current = new Date(startOfMonth);
    const limitDate = (bulan === thisMonth()) ? new Date(todayStr) : endOfMonth;
    while (current <= limitDate) {
        if (current.getDay() !== 0) workingDays++;
        current.setDate(current.getDate() + 1);
    }
    
    function countActiveDays(dataList) {
        const days = new Set();
        dataList.forEach(item => {
            if (item.tanggal && item.tanggal >= bulanIni && item.tanggal <= endDate) {
                days.add(item.tanggal);
            }
        });
        return days.size;
    }
    
    const categories = [
        { id: 'kayu', label: 'Kayu Masuk', dataList: kayuList, valueField: 'volume', targetSetting: 'targetKayuHarian', stokAwal: window.appSettings.stokAwalKayu || 0, unit: 'm³' },
        { id: 'sawmill', label: 'Proses Sawmill', dataList: sawmillList, valueField: 'prosesSawmill', targetSetting: 'targetSawmillHarian', stokAwal: 0, unit: 'm³' },
        { id: 'planer', label: 'Planer Bagus', dataList: produksiList, valueField: (item) => (item.shift1?.planerBagus||0)+(item.shift2?.planerBagus||0), targetSetting: 'targetPlaner', stokAwal: 0, unit: 'm³' },
        { id: 'ripsaw', label: 'Ripsaw Input', dataList: produksiList, valueField: (item) => (item.shift1?.ripsawIn||0)+(item.shift2?.ripsawIn||0), targetSetting: 'targetRipsaw', stokAwal: 0, unit: 'm³' },
        { id: 'seri', label: 'Seri Hasil', dataList: produksiList, valueField: (item) => (item.shift1?.seri||0)+(item.shift2?.seri||0), targetSetting: 'targetSeri', stokAwal: 0, unit: 'lbr' },
        { id: 'press', label: 'Press Hasil', dataList: produksiList, valueField: (item) => (item.shift1?.press||0)+(item.shift2?.press||0), targetSetting: 'targetPress', stokAwal: 0, unit: 'lbr' },
        { id: 'sezing', label: 'Sezing', dataList: sezingList, valueField: 'volume', targetSetting: 'targetSezingHarian', stokAwal: 0, unit: 'm³' }
    ];
    
    const targetHarianMap = {
        targetKayuHarian: window.appSettings.targetKayuHarian || 30,
        targetSawmillHarian: window.appSettings.targetSawmillHarian || 25,
        targetPlaner: window.appSettings.targetPlaner || 12,
        targetRipsaw: window.appSettings.targetRipsaw || 13,
        targetSeri: window.appSettings.targetSeri || 700,
        targetPress: window.appSettings.targetPress || 700,
        targetSezingHarian: window.appSettings.targetSezingHarian || 15
    };
    
    // Rendemen sawmill berdasarkan bulan yang dipilih
    const totalProsesSawmillBulan = sawmillList.filter(s => s.tanggal && s.tanggal >= bulanIni && s.tanggal <= endDate).reduce((s, lap) => s + (lap.prosesSawmill || 0), 0);
    const totalPaletBasahBulan = sawmillList.filter(s => s.tanggal && s.tanggal >= bulanIni && s.tanggal <= endDate).reduce((s, lap) => s + (lap.totalVolumePalet || 0), 0);
    const rendemenSawmill = totalProsesSawmillBulan > 0 ? (totalPaletBasahBulan / totalProsesSawmillBulan * 100) : 0;
    const targetRendemenMin = window.appSettings.rendemenMin || 65;
    const rendemenColor = rendemenSawmill >= targetRendemenMin ? 'var(--green)' : 'var(--orange)';
    const activeDaysSawmill = countActiveDays(sawmillList);
    
    let cardsHtml = [];
    for (let cat of categories) {
        const activeDays = countActiveDays(cat.dataList);
        const targetPerHari = targetHarianMap[cat.targetSetting] || 0;
        const totalTarget = targetPerHari * workingDays;
        let totalRealisasi = 0;
        if (typeof cat.valueField === 'function') {
            totalRealisasi = cat.dataList.filter(item => item.tanggal && item.tanggal >= bulanIni && item.tanggal <= endDate).reduce((sum, item) => sum + cat.valueField(item), 0);
        } else {
            totalRealisasi = cat.dataList.filter(item => item.tanggal && item.tanggal >= bulanIni && item.tanggal <= endDate).reduce((sum, item) => sum + (parseFloat(item[cat.valueField]) || 0), 0);
        }
        if (cat.stokAwal && cat.id === 'kayu') totalRealisasi += cat.stokAwal;
        const persen = totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;
        const persenColor = persen >= 100 ? 'var(--green)' : (persen >= 75 ? 'var(--gold)' : 'var(--orange)');
        const statusIcon = persen >= 100 ? '✅' : (persen >= 75 ? '⚠️' : '🔴');
        const statusText = persen >= 100 ? 'Melampaui target' : (persen >= 75 ? 'Menuju target' : 'Perlu ditingkatkan');
        
        cardsHtml.push(`
            <div class="stat-card" style="text-align:center; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div class="stat-card-label">${cat.label}</div>
                    <div class="stat-card-value" style="font-size:28px; color:${persenColor};">${persen.toFixed(1)}%</div>
                    <div style="font-size:11px; margin-top:6px;">${fmtDec(totalRealisasi, 1)} / ${fmtDec(totalTarget, 1)}</div>
                    <progress value="${persen}" max="100" style="width:100%; height:6px; border-radius:3px; margin-top:8px;"></progress>
                    <div style="font-size:10px; margin-top:4px;">${statusIcon} ${statusText}</div>
                </div>
                <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--gold-dim); font-size: 9px; color: var(--muted);">
                    📆 Target: ${workingDays} hari kerja | Aktif: ${activeDays} hari | Target/hari: ${targetPerHari} ${cat.unit}
                </div>
            </div>
        `);
        
        if (cat.id === 'sawmill') {
            cardsHtml.push(`
                <div class="stat-card" style="text-align:center; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div class="stat-card-label">🔄 Rendemen Sawmill</div>
                        <div class="stat-card-value" style="font-size:28px; color:${rendemenColor};">${rendemenSawmill.toFixed(1)}%</div>
                        <div style="font-size:11px; margin-top:6px;">Target min: ${targetRendemenMin}%</div>
                        <progress value="${Math.min(rendemenSawmill, 100)}" max="100" style="width:100%; height:6px; border-radius:3px; margin-top:8px;"></progress>
                        <div style="font-size:10px; margin-top:4px;">${rendemenSawmill >= targetRendemenMin ? '✅ Memenuhi target' : '⚠️ Di bawah target'}</div>
                    </div>
                    <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--gold-dim); font-size: 9px; color: var(--muted);">
                        📆 Aktif: ${activeDaysSawmill} hari | ${fmtDec(totalProsesSawmillBulan, 1)} m³ proses → ${fmtDec(totalPaletBasahBulan, 1)} m³ palet
                    </div>
                </div>
            `);
        }
    }
    container.innerHTML = cardsHtml.join('');
    document.getElementById("target-subtitle").innerHTML = `Bulan: ${bulan} · Target berdasarkan hari kerja (Senin-Sabtu)`;
}