// dashboard.js — COMPLETE & FIXED
// Fitur: KPI utama, Target Achievement (tanpa target di tgl 1 & Minggu), Target Harian, Target Kumulatif Charts, Tren 30 hari

// ========== HELPER UNTUK MENENTUKAN HARI YANG DIBEBANI TARGET ==========
function isTargetDay(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const tanggal = d.getDate();
    const hari = d.getDay(); // 0 = Minggu
    return (tanggal !== 1 && hari !== 0);
}

function getDailyTargetForDate(dateStr, dailyTarget) {
    return isTargetDay(dateStr) ? dailyTarget : 0;
}

function getTargetCumulativeUpTo(endDateStr, dailyTarget) {
    const end = new Date(endDateStr);
    const year = end.getFullYear();
    const month = end.getMonth();
    const firstDay = new Date(year, month, 1);
    let cumulative = 0;
    let current = new Date(firstDay);
    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        cumulative += getDailyTargetForDate(dateStr, dailyTarget);
        current.setDate(current.getDate() + 1);
    }
    return cumulative;
}

// ========== RENDER DASHBOARD UTAMA ==========
window.renderDashboard = function () {
    try {
        renderDashboardKPI();
        renderTargetAchievement();
        renderTargetCapaian();
        renderTargetCharts();
        renderTrendCharts();
    } catch (e) {
        console.error("Error renderDashboard:", e);
        const container = document.getElementById('dashboard-container');
        if (container) container.innerHTML = '<div class="error">⚠️ Gagal memuat dashboard. Silakan refresh halaman.</div>';
    }
};

// ========== 1. KPI UTAMA ==========
function renderDashboardKPI() {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    const bulan = thisMonth();
    const hari = today();

    const kayuBulan = (window.kayuList || []).filter(k => k.tanggal?.startsWith(bulan));
    const sawBulan = (window.sawmillList || []).filter(s => s.tanggal?.startsWith(bulan));
    const prodBulan = (window.produksiList || []).filter(p => p.tanggal?.startsWith(bulan));
    const penjBulan = (window.penjualanList || []).filter(j => j.tanggal?.startsWith(bulan));
    const orderAktif = (window.orderList || []).filter(o => !o.lunas);
    const kayuHari = (window.kayuList || []).filter(k => k.tanggal === hari);
    const sawHari = (window.sawmillList || []).filter(s => s.tanggal === hari);
    const prodHari = (window.produksiList || []).filter(p => p.tanggal === hari);
    const penjHari = (window.penjualanList || []).filter(j => j.tanggal === hari);

    const volKayuBln = kayuBulan.reduce((a, k) => a + (k.volume || 0), 0);
    const nilaiKayuBln = kayuBulan.reduce((a, k) => a + (k.harga || 0), 0);
    const totVolIn = sawBulan.reduce((a, s) => a + (s.prosesSawmill || 0), 0);
    const totPaletOk = sawBulan.reduce((a, s) => a + (s.totalVolumePalet || 0), 0);
    const rendemenBln = totVolIn > 0 ? ((totPaletOk / totVolIn) * 100).toFixed(1) : '—';
    const rendemenCol = rendemenBln >= 65 ? 'var(--green)' : rendemenBln >= 55 ? 'var(--orange)' : 'var(--red)';

    let totPlanerBln = 0, totPressBln = 0, totRipsawBln = 0, totSeriBtn = 0;
    prodBulan.forEach(p => {
        const s1 = p.shift1 || {}, s2 = p.shift2 || {};
        totPlanerBln += (s1.planerBagus || 0) + (s2.planerBagus || 0);
        totPressBln += (s1.press || 0) + (s2.press || 0);
        totRipsawBln += (s1.ripsawIn || 0) + (s2.ripsawIn || 0);
        totSeriBtn += (s1.seri || 0) + (s2.seri || 0);
    });
    const efRipsawBln = totPlanerBln > 0 ? (totRipsawBln / totPlanerBln * 100).toFixed(1) : '—';
    const efCol = efRipsawBln >= 80 ? 'var(--green)' : efRipsawBln >= 60 ? 'var(--orange)' : 'var(--red)';

    let totPlanerHari = 0, totPressHari = 0;
    prodHari.forEach(p => {
        const s1 = p.shift1 || {}, s2 = p.shift2 || {};
        totPlanerHari += (s1.planerBagus || 0) + (s2.planerBagus || 0);
        totPressHari += (s1.press || 0) + (s2.press || 0);
    });

    const volJualBln = penjBulan.reduce((a, j) => a + (j.volume || 0), 0);
    const nilaiJualBln = penjBulan.reduce((a, j) => a + (j.harga || 0), 0);
    const volJualHari = penjHari.reduce((a, j) => a + (j.volume || 0), 0);

    const ovenAktif = (window.ovenList || []).filter(o => o.status === 'isi').length;
    const ovenKosong = 7 - ovenAktif;
    const stokRealtime = typeof window.hitungStokRealtime === 'function' ? window.hitungStokRealtime() : { stokKering: 0 };
    const stokKering = stokRealtime.stokKering;
    const stokColor = stokKering < (window.appSettings.minStokKering || 50) ? 'var(--red)' : (stokKering < 100 ? 'var(--orange)' : 'var(--green)');

    let sisaOrderTotal = 0;
    (window.orderList || []).forEach(o => {
        if (o.lunas) return;
        const terpenuhi = typeof window.getOrderTerpenuhi === 'function' ? window.getOrderTerpenuhi(o.id) : 0;
        sisaOrderTotal += Math.max(0, (o.volumeOrder || 0) - terpenuhi);
    });
    const totVolOrder = orderAktif.reduce((a, o) => a + (o.volumeOrder || 0), 0);

    const alerts = [];
    if (ovenKosong >= 3) alerts.push({ type: 'warn', msg: `${ovenKosong} chamber oven kosong — perlu pengisian` });
    if (orderAktif.length > 0) alerts.push({ type: 'info', msg: `${orderAktif.length} order aktif belum lunas (${fmtDec(totVolOrder, 2)} m³)` });
    if (totPressHari === 0 && new Date().getHours() >= 10) alerts.push({ type: 'warn', msg: `Belum ada laporan press hari ini` });
    if (kayuHari.length === 0) alerts.push({ type: 'info', msg: `Belum ada pembelian kayu hari ini` });
    if (totPlanerBln > 0 && parseFloat(efRipsawBln) < 60) alerts.push({ type: 'danger', msg: `Efisiensi ripsaw bulan ini rendah: ${efRipsawBln}%` });

    const alertBadge = document.getElementById('header-alert');
    const alertCount = document.getElementById('alert-count');
    if (alertBadge && alertCount) {
        if (alerts.length > 0) {
            alertBadge.style.display = 'inline-flex';
            alertCount.textContent = alerts.length;
            alertBadge.title = alerts.map(a => a.msg).join("\n");
        } else {
            alertBadge.style.display = 'none';
        }
    }

    container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <div>
            <div style="font-family:var(--font-mono);font-size:18px;color:var(--gold);font-weight:700;">📊 Overview — ${formatBulan(bulan)}</div>
            <div style="font-size:11px;color:var(--muted);">Update: ${fmtDate(hari)} · Klik kartu untuk detail</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.renderDashboard()">🔄 Refresh</button>
    </div>
    ${alerts.length ? `
    <div style="background:var(--red-bg);border:1px solid rgba(248,113,113,0.25);border-radius:10px;padding:14px 18px;margin-bottom:18px;">
        <div style="font-size:11px;font-weight:700;color:var(--red);margin-bottom:8px;">⚠️ Perhatian (${alerts.length})</div>
        ${alerts.map(a => `<div style="font-size:12px;color:${a.type === 'danger' ? 'var(--red)' : a.type === 'warn' ? 'var(--orange)' : 'var(--blue)'};padding:3px 0;">• ${a.msg}</div>`).join('')}
    </div>` : `<div style="background:var(--green-bg);border:1px solid rgba(74,222,128,0.2);border-radius:10px;padding:12px 18px;margin-bottom:18px;font-size:12px;color:var(--green);">✅ Semua sistem berjalan normal</div>`}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px;">
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:12px;padding:18px;">
            <div style="font-size:11px;font-weight:700;color:var(--gold-light);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">📅 Hari Ini — ${fmtDate(hari)}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                ${miniKPI('Planer Bagus', fmtDec(totPlanerHari, 2) + ' m³', totPlanerHari > 0 ? 'var(--gold)' : 'var(--muted)')}
                ${miniKPI('Press', fmt(totPressHari) + ' lbr', totPressHari > 0 ? 'var(--blue)' : 'var(--muted)')}
                ${miniKPI('Jual Keluar', fmtDec(volJualHari, 2) + ' m³', volJualHari > 0 ? 'var(--green)' : 'var(--muted)')}
                ${miniKPI('Kayu Masuk', fmtDec(kayuHari.reduce((a, k) => a + (k.volume || 0), 0), 2) + ' m³', kayuHari.length > 0 ? 'var(--orange)' : 'var(--muted)')}
            </div>
        </div>
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:12px;padding:18px;">
            <div style="font-size:11px;font-weight:700;color:var(--gold-light);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">📆 Bulan Ini — ${formatBulan(bulan)}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                ${miniKPI('Planer Bagus', fmtDec(totPlanerBln, 2) + ' m³', 'var(--gold)')}
                ${miniKPI('Total Press', fmt(totPressBln) + ' lbr', 'var(--blue)')}
                ${miniKPI('Volume Jual', fmtDec(volJualBln, 2) + ' m³', 'var(--green)')}
                ${miniKPI('Kayu Masuk', fmtDec(volKayuBln, 2) + ' m³', 'var(--orange)')}
            </div>
        </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px;">
        ${bigKPI('Ef. Ripsaw', efRipsawBln === '—' ? '—' : efRipsawBln + '%', efCol, '📊', 'Efisiensi ripsaw bulan ini')}
        ${bigKPI('Rendemen Sawmill', rendemenBln === '—' ? '—' : rendemenBln + '%', rendemenCol, '🪚', 'Rendemen sawmill bulan ini')}
        ${bigKPI('Oven Aktif', ovenAktif + '/' + 7, ovenAktif > 0 ? 'var(--orange)' : 'var(--muted)', '🔥', 'Chamber oven terisi')}
        ${bigKPI('Order Aktif', orderAktif.length + ' PO', orderAktif.length > 0 ? 'var(--blue)' : 'var(--green)', '📑', fmtDec(totVolOrder, 2) + ' m³')}
        ${bigKPI('Nilai Jual', 'Rp ' + fmtRupiah(nilaiJualBln), 'var(--green)', '💰', 'Total penjualan bulan ini')}
        ${bigKPI('Total Seri', fmt(totSeriBtn) + ' lbr', 'var(--gold-light)', '🔗', 'Seri bulan ini')}
        ${bigKPI('Stok Palet Kering', fmtDec(stokKering, 2) + ' m³', stokColor, '📦', `Min ${window.appSettings.minStokKering || 50} m³`)}
        ${bigKPI('Sisa Order', fmtDec(sisaOrderTotal, 2) + ' m³', sisaOrderTotal > 0 ? 'var(--orange)' : 'var(--green)', '⚠️', 'Belum terkirim')}
    </div>
    <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:12px;padding:18px;margin-bottom:4px;">
        <div style="font-size:11px;font-weight:700;color:var(--gold-light);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">🔄 Aliran Material — ${formatBulan(bulan)}</div>
        <div style="display:flex;align-items:center;gap:0;flex-wrap:wrap;overflow-x:auto;">
            ${flowStep('🪵 Kayu', fmtDec(volKayuBln, 2), 'm³', 'var(--orange)', 'Dibeli')}
            <div style="color:var(--gold);font-size:20px;padding:0 4px;">→</div>
            ${flowStep('🪚 Sawmill', fmtDec(totPaletOk, 2), 'm³', 'var(--gold)', 'Palet Bagus')}
            <div style="color:var(--gold);font-size:20px;padding:0 4px;">→</div>
            ${flowStep('🔥 Oven', ovenAktif + '', 'chamber', 'var(--orange)', 'Sedang Isi')}
            <div style="color:var(--gold);font-size:20px;padding:0 4px;">→</div>
            ${flowStep('📦 Produksi', fmtDec(totPlanerBln, 2), 'm³', 'var(--blue)', 'Planer Bagus')}
            <div style="color:var(--gold);font-size:20px;padding:0 4px;">→</div>
            ${flowStep('💰 Penjualan', fmtDec(volJualBln, 2), 'm³', 'var(--green)', 'Terjual')}
        </div>
        ${totPlanerBln > 0 ? `
        <div style="margin-top:14px;">
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px;">Konversi Material: Kayu → Planer Bagus</div>
            <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${Math.min(100, (totPlanerBln / (volKayuBln || 1) * 100)).toFixed(1)}%;background:linear-gradient(90deg,var(--gold),var(--blue));border-radius:4px;transition:width .5s ease;"></div>
            </div>
            <div style="font-size:10px;color:var(--muted);margin-top:4px;">${Math.min(100, (totPlanerBln / (volKayuBln || 1) * 100)).toFixed(1)}% dari kayu yang masuk menjadi planer bagus</div>
        </div>` : ''}
    </div>`;
}

// ========== 2. TARGET ACHIEVEMENT (tanpa target di tgl 1 & Minggu) ==========
function renderTargetAchievement() {
    const container = document.getElementById('target-achievement-container');
    if (!container) return;

    const cfg = window.appSettings || {};
    const bulan = thisMonth();
    const todayDate = today();

    const tKayu = cfg.targetKayuHarian || 10;
    const tSawmill = cfg.targetSawmillHarian || 8;
    const tPlaner = cfg.targetPlanerHarian || 3;
    const tPress = cfg.targetPressHarian || 1000;
    const tSeri = cfg.targetSeriHarian || 800;
    const tSezing = cfg.targetSezingHarian || 2;

    const targetKayuBln = getTargetCumulativeUpTo(todayDate, tKayu);
    const targetSawmillBln = getTargetCumulativeUpTo(todayDate, tSawmill);
    const targetPlanerBln = getTargetCumulativeUpTo(todayDate, tPlaner);
    const targetPressBln = getTargetCumulativeUpTo(todayDate, tPress);
    const targetSeriBln = getTargetCumulativeUpTo(todayDate, tSeri);
    const targetSezingBln = getTargetCumulativeUpTo(todayDate, tSezing);

    const kayuBulan = (window.kayuList || []).filter(k => k.tanggal?.startsWith(bulan));
    const sawBulan = (window.sawmillList || []).filter(s => s.tanggal?.startsWith(bulan));
    const prodBulan = (window.produksiList || []).filter(p => p.tanggal?.startsWith(bulan));
    const sezBulan = (window.sezingList || []).filter(s => s.tanggal?.startsWith(bulan));

    const realKayu = kayuBulan.reduce((a, k) => a + (k.volume || 0), 0);
    const realSawmill = sawBulan.reduce((a, s) => a + (s.prosesSawmill || 0), 0);
    let realPlaner = 0, realPress = 0, realSeri = 0;
    prodBulan.forEach(p => {
        const s1 = p.shift1 || {}, s2 = p.shift2 || {};
        realPlaner += (s1.planerBagus || 0) + (s2.planerBagus || 0);
        realPress += (s1.press || 0) + (s2.press || 0);
        realSeri += (s1.seri || 0) + (s2.seri || 0);
    });
    const realSezing = sezBulan.reduce((a, s) => a + (s.volume || 0), 0);

    const pctKayu = targetKayuBln > 0 ? Math.min(100, (realKayu / targetKayuBln) * 100) : 0;
    const pctSawmill = targetSawmillBln > 0 ? Math.min(100, (realSawmill / targetSawmillBln) * 100) : 0;
    const pctPlaner = targetPlanerBln > 0 ? Math.min(100, (realPlaner / targetPlanerBln) * 100) : 0;
    const pctPress = targetPressBln > 0 ? Math.min(100, (realPress / targetPressBln) * 100) : 0;
    const pctSeri = targetSeriBln > 0 ? Math.min(100, (realSeri / targetSeriBln) * 100) : 0;
    const pctSezing = targetSezingBln > 0 ? Math.min(100, (realSezing / targetSezingBln) * 100) : 0;

    const getColor = (pct) => pct >= 100 ? 'var(--green)' : pct >= 70 ? 'var(--gold)' : pct >= 50 ? 'var(--orange)' : 'var(--red)';

    // Hitung jumlah hari efektif yang sudah berlalu untuk info
    let efektifCount = 0;
    const [year, month] = bulan.split('-').map(Number);
    let current = new Date(year, month - 1, 1);
    const todayObj = new Date(todayDate);
    while (current <= todayObj) {
        const dStr = current.toISOString().split('T')[0];
        if (isTargetDay(dStr)) efektifCount++;
        current.setDate(current.getDate() + 1);
    }

    container.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin:20px 0 12px;">
        <span style="width:4px;height:22px;background:var(--gold);border-radius:3px;"></span>
        <span style="font-size:14px;font-weight:700;color:var(--gold);">🎯 Target vs Realisasi Bulan Ini (${formatBulan(bulan)})</span>
        <span style="font-size:10px;color:var(--muted);background:var(--bg3);padding:2px 8px;border-radius:12px;">Hari Efektif ke-${efektifCount}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px;">
        ${achievementCard('🪵 Kayu Masuk', realKayu, targetKayuBln, pctKayu, getColor(pctKayu), 'm³')}
        ${achievementCard('🪚 Sawmill', realSawmill, targetSawmillBln, pctSawmill, getColor(pctSawmill), 'm³')}
        ${achievementCard('📦 Planer Bagus', realPlaner, targetPlanerBln, pctPlaner, getColor(pctPlaner), 'm³')}
        ${achievementCard('🔩 Press', realPress, targetPressBln, pctPress, getColor(pctPress), 'lbr')}
        ${achievementCard('🔗 Seri', realSeri, targetSeriBln, pctSeri, getColor(pctSeri), 'lbr')}
        ${achievementCard('📏 Sezing', realSezing, targetSezingBln, pctSezing, getColor(pctSezing), 'm³')}
    </div>`;
}

function achievementCard(label, real, target, pct, color, unit) {
    const pctRounded = pct.toFixed(1);
    const icon = pct >= 100 ? '✅' : pct >= 70 ? '🟡' : pct >= 50 ? '⚠️' : '🔴';
    return `
    <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="font-size:12px;font-weight:700;color:var(--text);">${label}</div>
            <div style="font-size:18px;">${icon}</div>
        </div>
        <div style="font-size:24px;font-weight:800;color:${color};font-family:var(--font-mono);margin-bottom:5px;">${pctRounded}%</div>
        <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;margin-bottom:10px;">
            <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width 0.5s ease;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);">
            <span>Realisasi: ${fmtDec(real, 2)} ${unit}</span>
            <span>Target: ${fmtDec(target, 2)} ${unit}</span>
        </div>
    </div>`;
}

// ========== 3. TARGET CAPAIAN HARI INI (target 0 pada libur) ==========
window.renderTargetCapaian = function () {
    const container = document.getElementById('target-capaian-container');
    if (!container) return;
    const cfg = window.appSettings || {};
    const hari = today();

    if (!isTargetDay(hari)) {
        container.innerHTML = `
        <div style="text-align:center;padding:20px;background:var(--bg2);border-radius:12px;border:1px solid var(--gold-dim);">
            <div style="font-size:28px;margin-bottom:8px;">📅</div>
            <div style="font-size:13px;font-weight:600;color:var(--gold);">Libur / Tanggal 1</div>
            <div style="font-size:11px;color:var(--muted);">Tidak ada target produksi hari ini</div>
        </div>`;
        return;
    }

    const targets = {
        kayu: cfg.targetKayuHarian || 10,
        sawmill: cfg.targetSawmillHarian || 8,
        planer: cfg.targetPlanerHarian || 3,
        press: cfg.targetPressHarian || 1000,
        seri: cfg.targetSeriHarian || 800,
        sezing: cfg.targetSezingHarian || 2
    };

    const kayuHari = (window.kayuList || []).filter(k => k.tanggal === hari);
    const sawHari = (window.sawmillList || []).filter(s => s.tanggal === hari);
    const prodHari = (window.produksiList || []).filter(p => p.tanggal === hari);
    const sezHari = (window.sezingList || []).filter(s => s.tanggal === hari);
    let planerH = 0, pressH = 0, seriH = 0;
    prodHari.forEach(p => {
        const s1 = p.shift1 || {}, s2 = p.shift2 || {};
        planerH += (s1.planerBagus || 0) + (s2.planerBagus || 0);
        pressH += (s1.press || 0) + (s2.press || 0);
        seriH += (s1.seri || 0) + (s2.seri || 0);
    });
    const aktual = {
        kayu: kayuHari.reduce((a, k) => a + (k.volume || 0), 0),
        sawmill: sawHari.reduce((a, s) => a + (s.prosesSawmill || 0), 0),
        planer: planerH,
        press: pressH,
        seri: seriH,
        sezing: sezHari.reduce((a, s) => a + (s.volume || 0), 0)
    };

    const metrik = [
        { key: 'kayu', label: '🪵 Kayu Masuk', unit: 'm³', target: targets.kayu },
        { key: 'sawmill', label: '🪚 Sawmill', unit: 'm³', target: targets.sawmill },
        { key: 'planer', label: '📦 Planer Bagus', unit: 'm³', target: targets.planer },
        { key: 'press', label: '🔩 Press', unit: 'lbr', target: targets.press },
        { key: 'seri', label: '🔗 Seri', unit: 'lbr', target: targets.seri },
        { key: 'sezing', label: '📏 Sezing', unit: 'm³', target: targets.sezing }
    ];

    container.innerHTML = metrik.map(m => {
        const act = aktual[m.key] || 0;
        const pct = m.target > 0 ? Math.min(100, (act / m.target) * 100) : 0;
        const col = pct >= 100 ? 'var(--green)' : pct >= 60 ? 'var(--gold)' : pct >= 30 ? 'var(--orange)' : 'var(--red)';
        const icon = pct >= 100 ? '✅' : pct >= 60 ? '🟡' : '🔴';
        return `
        <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;padding:14px 16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-size:11px;color:var(--muted);">${m.label}</div>
                <div style="font-size:10px;">${icon}</div>
            </div>
            <div style="font-size:20px;font-weight:700;color:${col};font-family:var(--font-mono);">${typeof act === 'number' && !Number.isInteger(act) ? fmtDec(act, 2) : fmt(act)} <span style="font-size:10px;font-weight:400;">${m.unit}</span></div>
            <div style="height:5px;background:var(--border);border-radius:3px;margin:8px 0 4px;overflow:hidden;">
                <div style="height:100%;width:${pct.toFixed(1)}%;background:${col};border-radius:3px;transition:width .6s ease;"></div>
            </div>
            <div style="font-size:10px;color:var(--muted);">${pct.toFixed(0)}% dari target ${fmt(m.target)} ${m.unit}</div>
        </div>`;
    }).join('');
};

// ========== 4. CHARTS TARGET VS REALISASI KUMULATIF (tanpa libur) ==========
window.renderTargetCharts = function () {
    const bulan = thisMonth();
    const cfg = window.appSettings || {};
    const [y, m] = bulan.split('-').map(Number);
    const hariIni = parseInt(today().split('-')[2]);
    const hariLabels = Array.from({ length: hariIni }, (_, i) => String(i + 1).padStart(2, '0'));

    function sumPerHari(list, dateField, valueFunc) {
        return hariLabels.map(d => {
            const tgl = `${bulan}-${d}`;
            return list.filter(x => x[dateField] === tgl).reduce((a, x) => a + valueFunc(x), 0);
        });
    }

    const kayuPerHari = sumPerHari(window.kayuList || [], 'tanggal', k => k.volume || 0);
    const sawmillPerHari = sumPerHari(window.sawmillList || [], 'tanggal', s => s.prosesSawmill || 0);
    let prodByDate = {};
    (window.produksiList || []).forEach(p => {
        if (!p.tanggal?.startsWith(bulan)) return;
        const d = p.tanggal;
        if (!prodByDate[d]) prodByDate[d] = { planer: 0, press: 0, seri: 0, ripsaw: 0 };
        const s1 = p.shift1 || {}, s2 = p.shift2 || {};
        prodByDate[d].planer += (s1.planerBagus || 0) + (s2.planerBagus || 0);
        prodByDate[d].press += (s1.press || 0) + (s2.press || 0);
        prodByDate[d].seri += (s1.seri || 0) + (s2.seri || 0);
        prodByDate[d].ripsaw += (s1.ripsawIn || 0) + (s2.ripsawIn || 0);
    });
    const planerPerHari = hariLabels.map(d => prodByDate[`${bulan}-${d}`]?.planer || 0);
    const pressPerHari = hariLabels.map(d => prodByDate[`${bulan}-${d}`]?.press || 0);
    const seriPerHari = hariLabels.map(d => prodByDate[`${bulan}-${d}`]?.seri || 0);
    const ripsawPerHari = hariLabels.map(d => prodByDate[`${bulan}-${d}`]?.ripsaw || 0);
    const sezingPerHari = sumPerHari(window.sezingList || [], 'tanggal', s => s.volume || 0);

    const tKayu = cfg.targetKayuHarian || 10;
    const tSawmill = cfg.targetSawmillHarian || 8;
    const tPlaner = cfg.targetPlanerHarian || 3;
    const tRipsaw = cfg.targetRipsawHarian || 2.5;
    const tSeri = cfg.targetSeriHarian || 800;
    const tPress = cfg.targetPressHarian || 1000;
    const tSezing = cfg.targetSezingHarian || 2;

    function getTargetCumulatives(dailyTarget) {
        const cum = [];
        let acc = 0;
        for (let i = 0; i < hariLabels.length; i++) {
            const tgl = `${bulan}-${hariLabels[i]}`;
            const daily = isTargetDay(tgl) ? dailyTarget : 0;
            acc += daily;
            cum.push(acc);
        }
        return cum;
    }

    function getActualCumulatives(data) {
        const cum = [];
        let acc = 0;
        for (let i = 0; i < data.length; i++) {
            acc += data[i];
            cum.push(acc);
        }
        return cum;
    }

    const kayuCum = getActualCumulatives(kayuPerHari);
    const sawmillCum = getActualCumulatives(sawmillPerHari);
    const planerCum = getActualCumulatives(planerPerHari);
    const ripsawCum = getActualCumulatives(ripsawPerHari);
    const seriCum = getActualCumulatives(seriPerHari);
    const pressCum = getActualCumulatives(pressPerHari);
    const sezingCum = getActualCumulatives(sezingPerHari);

    const targetKayuCum = getTargetCumulatives(tKayu);
    const targetSawmillCum = getTargetCumulatives(tSawmill);
    const targetPlanerCum = getTargetCumulatives(tPlaner);
    const targetRipsawCum = getTargetCumulatives(tRipsaw);
    const targetSeriCum = getTargetCumulatives(tSeri);
    const targetPressCum = getTargetCumulatives(tPress);
    const targetSezingCum = getTargetCumulatives(tSezing);

    const chartConfigs = [
        { id: 'chart-target-kayu', label: '🪵 Kayu Masuk (m³)', data: kayuPerHari, cumData: kayuCum, targetCum: targetKayuCum, color: '#ff9f43' },
        { id: 'chart-target-sawmill', label: '🪚 Sawmill Vol.In (m³)', data: sawmillPerHari, cumData: sawmillCum, targetCum: targetSawmillCum, color: '#d4a017' },
        { id: 'chart-target-planer', label: '📦 Planer Bagus (m³)', data: planerPerHari, cumData: planerCum, targetCum: targetPlanerCum, color: '#e8c84a' },
        { id: 'chart-target-ripsaw', label: '🔄 Ripsaw Input (m³)', data: ripsawPerHari, cumData: ripsawCum, targetCum: targetRipsawCum, color: '#60a5fa' },
        { id: 'chart-target-seri', label: '🔗 Seri (lbr)', data: seriPerHari, cumData: seriCum, targetCum: targetSeriCum, color: '#a78bfa' },
        { id: 'chart-target-press', label: '🔩 Press (lbr)', data: pressPerHari, cumData: pressCum, targetCum: targetPressCum, color: '#38bdf8' },
        { id: 'chart-target-sezing', label: '📏 Sezing (m³)', data: sezingPerHari, cumData: sezingCum, targetCum: targetSezingCum, color: '#4ade80' },
    ];

    chartConfigs.forEach(cfg => {
        const ctx = document.getElementById(cfg.id);
        if (!ctx || !window.Chart) return;
        if (ctx._chartInst) ctx._chartInst.destroy();
        ctx._chartInst = new Chart(ctx, {
            data: {
                labels: hariLabels,
                datasets: [
                    { type: 'bar', label: 'Harian', data: cfg.data, backgroundColor: hexAlpha(cfg.color, 0.5), borderColor: cfg.color, borderWidth: 1, yAxisID: 'y', order: 2 },
                    { type: 'line', label: 'Kumulatif Aktual', data: cfg.cumData, borderColor: cfg.color, backgroundColor: hexAlpha(cfg.color, 0.08), borderWidth: 2, pointRadius: 2, fill: true, tension: 0.3, yAxisID: 'y1', order: 1 },
                    { type: 'line', label: 'Target Kumulatif', data: cfg.targetCum, borderColor: 'rgba(255,255,255,0.25)', borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, fill: false, tension: 0, yAxisID: 'y1', order: 0 }
                ]
            },
            options: {
                responsive: true, interaction: { mode: 'index', intersect: false },
                plugins: { title: { display: true, text: cfg.label, color: '#8a8578', font: { size: 11, weight: '600' }, padding: { bottom: 8 } }, legend: { labels: { color: '#8a8578', font: { size: 9 }, boxWidth: 12 } } },
                scales: { x: { ticks: { color: '#666', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.03)' } }, y: { position: 'left', ticks: { color: cfg.color, font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' } }, y1: { position: 'right', ticks: { color: '#8a8578', font: { size: 9 } }, grid: { drawOnChartArea: false } } }
            }
        });
    });
};

// ========== 5. TREN 30 HARI TERAKHIR ==========
window.renderTrendCharts = function () {
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    const labels = days.map(d => d.slice(5));

    const rendemenData = days.map(d => {
        const sawDay = (window.sawmillList || []).filter(s => s.tanggal === d);
        const vIn = sawDay.reduce((a, s) => a + (s.prosesSawmill || 0), 0);
        const pOk = sawDay.reduce((a, s) => a + (s.totalVolumePalet || 0), 0);
        return vIn > 0 ? parseFloat((pOk / vIn * 100).toFixed(1)) : null;
    });

    const prodData = days.map(d => {
        let tot = 0;
        (window.produksiList || []).filter(p => p.tanggal === d).forEach(p => {
            const s1 = p.shift1 || {}, s2 = p.shift2 || {};
            tot += (s1.planerBagus || 0) + (s2.planerBagus || 0);
        });
        return tot || null;
    });

    const stokData = days.map(d => {
        const masukSampai = (window.kayuList || []).filter(k => k.tanggal <= d).reduce((a, k) => a + (k.volume || 0), 0);
        const prosesedSampai = (window.sawmillList || []).filter(s => s.tanggal <= d).reduce((a, s) => a + (s.prosesSawmill || 0), 0);
        return parseFloat((masukSampai - prosesedSampai).toFixed(2));
    });

    const jualData = days.map(d => (window.penjualanList || []).filter(j => j.tanggal === d).reduce((a, j) => a + (j.volume || 0), 0) || null);

    const trendConfigs = [
        { id: 'chart-rendemen', label: '📈 Rendemen Sawmill (%)', data: rendemenData, borderColor: '#d4a017', bgColor: 'rgba(212,160,23,0.08)', yUnit: '%', yMin: 0, yMax: 100 },
        { id: 'chart-produksi', label: '📦 Planer Bagus Harian (m³)', data: prodData, borderColor: '#60a5fa', bgColor: 'rgba(96,165,250,0.08)', yUnit: 'm³' },
        { id: 'chart-stok', label: '🪵 Estimasi Stok Kayu Log (m³)', data: stokData, borderColor: '#ff9f43', bgColor: 'rgba(255,159,67,0.08)', yUnit: 'm³' },
        { id: 'chart-penjualan', label: '💰 Volume Penjualan Harian (m³)', data: jualData, borderColor: '#4ade80', bgColor: 'rgba(74,222,128,0.08)', yUnit: 'm³' }
    ];

    trendConfigs.forEach(cfg => {
        const ctx = document.getElementById(cfg.id);
        if (!ctx || !window.Chart) return;
        if (ctx._chartInst) ctx._chartInst.destroy();

        const maData = cfg.data.map((_, i) => {
            const slice = cfg.data.slice(Math.max(0, i - 6), i + 1).filter(v => v !== null);
            return slice.length > 0 ? parseFloat((slice.reduce((a, v) => a + v, 0) / slice.length).toFixed(2)) : null;
        });

        ctx._chartInst = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Nilai Harian', data: cfg.data, borderColor: cfg.borderColor, backgroundColor: cfg.bgColor, borderWidth: 1.5, pointRadius: 3, pointHoverRadius: 5, fill: true, tension: 0.3, spanGaps: true },
                    { label: 'MA 7 Hari', data: maData, borderColor: 'rgba(255,255,255,0.4)', borderWidth: 1.5, borderDash: [4, 3], pointRadius: 0, fill: false, tension: 0.4, spanGaps: true }
                ]
            },
            options: {
                responsive: true, interaction: { mode: 'index', intersect: false },
                plugins: { title: { display: true, text: cfg.label, color: '#8a8578', font: { size: 11, weight: '600' }, padding: { bottom: 6 } }, legend: { labels: { color: '#8a8578', font: { size: 9 }, boxWidth: 12 } }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw ?? '—'} ${cfg.yUnit}` } } },
                scales: { x: { ticks: { color: '#666', font: { size: 9 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 15 }, grid: { color: 'rgba(255,255,255,0.03)' } }, y: { min: cfg.yMin, max: cfg.yMax, ticks: { color: '#8a8578', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: cfg.yUnit, color: '#8a8578', font: { size: 9 } } } }
            }
        });
    });
};

// ========== UTILITY FUNCTIONS (pendukung) ==========
function miniKPI(label, value, color) {
    return `<div style="background:var(--bg3);border-radius:8px;padding:10px 12px;">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-bottom:4px;">${label}</div>
        <div style="font-size:15px;font-weight:700;color:${color};font-family:var(--font-mono);">${value}</div>
    </div>`;
}

function bigKPI(label, value, color, icon, sub) {
    return `<div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:10px;padding:14px 16px;cursor:default;">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;margin-bottom:6px;">${icon} ${label}</div>
        <div style="font-size:20px;font-weight:700;color:${color};font-family:var(--font-mono);">${value}</div>
        ${sub ? `<div style="font-size:10px;color:var(--muted);margin-top:3px;">${sub}</div>` : ''}
    </div>`;
}

function flowStep(label, value, unit, color, sublabel) {
    return `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px 16px;min-width:100px;text-align:center;flex-shrink:0;">
        <div style="font-size:11px;color:var(--muted);">${label}</div>
        <div style="font-size:18px;font-weight:700;color:${color};font-family:var(--font-mono);">${value}</div>
        <div style="font-size:9px;color:var(--muted);">${unit} · ${sublabel}</div>
    </div>`;
}

function fmtRupiah(n) {
    if (!n) return '0';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'M';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'jt';
    return fmt(n);
}

function formatBulan(ym) {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return (months[parseInt(m) - 1] || m) + ' ' + y;
}

function hexAlpha(hex, alpha) {
    const map = {
        '#ff9f43': `rgba(255,159,67,${alpha})`,
        '#d4a017': `rgba(212,160,23,${alpha})`,
        '#e8c84a': `rgba(232,200,74,${alpha})`,
        '#60a5fa': `rgba(96,165,250,${alpha})`,
        '#a78bfa': `rgba(167,139,250,${alpha})`,
        '#38bdf8': `rgba(56,189,248,${alpha})`,
        '#4ade80': `rgba(74,222,128,${alpha})`,
    };
    return map[hex] || `rgba(200,200,200,${alpha})`;
}

// ========== AUTO-INIT DASHBOARD SAAT HALAMAN SIAP ==========
(function initDashboardOnLoad() {
    const tryRender = () => {
        if (document.getElementById('dashboard-container')) {
            if (typeof window.renderDashboard === 'function') {
                window.renderDashboard();
            }
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryRender);
    } else {
        tryRender();
    }
})();