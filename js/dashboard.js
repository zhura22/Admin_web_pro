// dashboard.js — Redesigned
// Perubahan: hapus section "Hari Ini" terpisah & "Target Capaian Hari Ini",
// embed nilai hari ini sebagai sub-line di setiap KPI card utama.

// ── Target day helper ──────────────────────────────────────────────
// Hari kerja = bukan Minggu + bukan Sabtu (jika liburSabtu=true) + tidak ada di daftar hariLibur
function isTargetDay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return false;
    const dow = d.getDay();
    if (dow === 0) return false;  // Minggu selalu libur
    const cfg = window.appSettings || {};
    if (cfg.liburSabtu && dow === 6) return false;  // Sabtu libur jika diset
    const libur = cfg.hariLibur || [];
    if (libur.includes(dateStr)) return false;  // Tanggal libur khusus
    return true;
}
function getDailyTargetForDate(ds, dt) { return isTargetDay(ds) ? dt : 0; }
function getTargetCumulativeUpTo(endDateStr, dailyTarget) {
    const end = new Date(endDateStr);
    const [year, month] = [end.getFullYear(), end.getMonth()];
    let cum = 0, cur = new Date(year, month, 1);
    while (cur <= end) {
        cum += getDailyTargetForDate(cur.toISOString().split('T')[0], dailyTarget);
        cur.setDate(cur.getDate() + 1);
    }
    return cum;
}

// ── Entry point ───────────────────────────────────────────────────
window.renderDashboard = function () {
    try {
        renderDashboardKPI();
        renderTargetAchievement();
        window.renderTargetHariAktif();
        renderTargetCharts();
        renderTrendCharts();
    } catch (e) {
        console.error('renderDashboard error:', e);
        const c = document.getElementById('dashboard-container');
        if (c) c.innerHTML = '<div class="error">⚠️ Gagal memuat dashboard.</div>';
    }
};

// ── 1. KPI UTAMA (bulan ini + sub-line hari ini) ──────────────────
function renderDashboardKPI() {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    const bulan = thisMonth();
    const hari  = today();

    // ── Kumpul data ──
    const kayuBulan  = (window.kayuList     || []).filter(k => k.tanggal?.startsWith(bulan));
    const sawBulan   = (window.sawmillList  || []).filter(s => s.tanggal?.startsWith(bulan));
    const prodBulan  = (window.produksiList || []).filter(p => p.tanggal?.startsWith(bulan));
    const penjBulan  = (window.penjualanList|| []).filter(j => j.tanggal?.startsWith(bulan));
    const sezBulan   = (window.sezingList   || []).filter(s => s.tanggal?.startsWith(bulan));

    const kayuHari   = kayuBulan .filter(k => k.tanggal === hari);
    const sawHari    = sawBulan  .filter(s => s.tanggal === hari);
    const prodHari   = prodBulan .filter(p => p.tanggal === hari);
    const penjHari   = penjBulan .filter(j => j.tanggal === hari);
    const sezHari    = sezBulan  .filter(s => s.tanggal === hari);

    // ── Sawmill ──
    const totVolInBln  = sawBulan.reduce((a,s) => a + (s.prosesSawmill     || 0), 0);
    const totPaletBln  = sawBulan.reduce((a,s) => a + (s.totalVolumePalet  || 0), 0);
    const totVolInHari = sawHari .reduce((a,s) => a + (s.prosesSawmill     || 0), 0);
    const rendBln  = totVolInBln  > 0 ? (totPaletBln / totVolInBln * 100).toFixed(1)  : '—';
    const rendCol  = rendBln === '—' ? 'var(--muted)' : rendBln >= 65 ? 'var(--green)' : rendBln >= 55 ? 'var(--orange)' : 'var(--red)';

    // ── Produksi ──
    let planerBln=0, pressBln=0, seriBln=0, ripsawBln=0;
    let planerHari=0, pressHari=0;
    prodBulan.forEach(p => {
        const s1=p.shift1||{}, s2=p.shift2||{};
        planerBln  += (s1.planerBagus||0)+(s2.planerBagus||0);
        pressBln   += (s1.press||0)      +(s2.press||0);
        seriBln    += (s1.seri||0)       +(s2.seri||0);
        ripsawBln  += (s1.ripsawIn||0)   +(s2.ripsawIn||0);
    });
    prodHari.forEach(p => {
        const s1=p.shift1||{}, s2=p.shift2||{};
        planerHari += (s1.planerBagus||0)+(s2.planerBagus||0);
        pressHari  += (s1.press||0)      +(s2.press||0);
    });
    const efBln  = planerBln > 0 ? (ripsawBln / planerBln * 100).toFixed(1) : '—';
    const efCol  = efBln  === '—' ? 'var(--muted)' : efBln  >= 80 ? 'var(--green)' : efBln  >= 60 ? 'var(--orange)' : 'var(--red)';

    // ── Kayu ──
    const volKayuBln   = kayuBulan.reduce((a,k) => a+(k.volume||0), 0);
    const nilaiKayuBln = kayuBulan.reduce((a,k) => a+(k.harga ||0), 0);
    const volKayuHari  = kayuHari .reduce((a,k) => a+(k.volume||0), 0);

    // ── Penjualan ──
    const volJualBln   = penjBulan.reduce((a,j) => a+(j.volume||0), 0);
    const nilaiJualBln = penjBulan.reduce((a,j) => a+(j.harga ||0), 0);
    const volJualHari  = penjHari .reduce((a,j) => a+(j.volume||0), 0);

    // ── Sezing ──
    const volSezBln  = sezBulan.reduce((a,s) => a+(s.volume||0), 0);
    const volSezHari = sezHari .reduce((a,s) => a+(s.volume||0), 0);

    // ── Oven ──
    const ovenAktif  = (window.ovenList||[]).filter(o => o.status==='isi').length;
    const ovenKosong = 7 - ovenAktif;

    // ── Stok ──
    const stokRT      = typeof window.hitungStokRealtime === 'function' ? window.hitungStokRealtime() : {stokKering:0};
    const stokKering  = stokRT.stokKering || 0;
    const minStok     = (window.appSettings||{}).minStokKering || 50;
    const stokCol     = stokKering < minStok ? 'var(--red)' : stokKering < 100 ? 'var(--orange)' : 'var(--green)';

    // ── Order ──
    let sisaOrderTotal = 0, totVolOrder = 0;
    const orderAktif = (window.orderList||[]).filter(o => {
        const terp = typeof window.getOrderTerpenuhi==='function' ? window.getOrderTerpenuhi(o.id) : 0;
        const sisa = Math.max(0,(o.volumeOrder||0)-terp);
        if (sisa > 0) { sisaOrderTotal += sisa; totVolOrder += (o.volumeOrder||0); return true; }
        return false;
    });

    // ── Alerts ──
    const alerts = [];
    if (ovenKosong >= 3) alerts.push({ type:'warn',   msg:`${ovenKosong} chamber oven kosong` });
    if (orderAktif.length > 0) alerts.push({ type:'info', msg:`${orderAktif.length} order aktif (${fmtDec(totVolOrder,2)} m³)` });
    if (pressHari === 0 && new Date().getHours() >= 10) alerts.push({ type:'warn', msg:`Belum ada laporan press hari ini` });
    if (planerBln > 0 && parseFloat(efBln) < 60) alerts.push({ type:'danger', msg:`Efisiensi ripsaw rendah: ${efBln}%` });

    const alertBadge = document.getElementById('header-alert');
    const alertCount = document.getElementById('alert-count');
    if (alertBadge && alertCount) {
        alertBadge.style.display = alerts.length ? 'inline-flex' : 'none';
        alertCount.textContent   = alerts.length;
        alertBadge.title         = alerts.map(a=>a.msg).join('\n');
    }

    // ── Render ──
    container.innerHTML = `
    ${alerts.length ? `
    <div style="background:rgba(248,113,113,.07);border:1px solid rgba(248,113,113,.22);border-radius:10px;padding:12px 16px;margin-bottom:16px;">
        <div style="font-size:11px;font-weight:700;color:#f87171;margin-bottom:6px;">⚠️ Perhatian (${alerts.length})</div>
        ${alerts.map(a=>`<div style="font-size:12px;color:${a.type==='danger'?'#f87171':a.type==='warn'?'var(--orange)':'#60a5fa'};padding:2px 0;">• ${a.msg}</div>`).join('')}
    </div>` : `
    <div style="background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.18);border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:12px;color:var(--green);">✅ Semua sistem berjalan normal</div>`}

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:12px;margin-bottom:18px;">
        ${dashKPI('🪵 Kayu Masuk',   fmtDec(volKayuBln,2)+' m³',  'var(--orange)',     volKayuHari  > 0 ? 'Hari ini: '+fmtDec(volKayuHari,2)+' m³'   : 'Belum ada hari ini')}
        ${dashKPI('🪚 Sawmill',      fmtDec(totVolInBln,2)+' m³', 'var(--gold)',       totVolInHari > 0 ? 'Hari ini: '+fmtDec(totVolInHari,2)+' m³'  : 'Belum ada hari ini')}
        ${dashKPI('📦 Planer Bagus', fmtDec(planerBln,2)+' m³',   '#e8c84a',          planerHari   > 0 ? 'Hari ini: '+fmtDec(planerHari,2)+' m³'    : 'Belum ada hari ini')}
        ${dashKPI('🔩 Press',        fmt(pressBln)+' lbr',         '#60a5fa',          pressHari    > 0 ? 'Hari ini: '+fmt(pressHari)+' lbr'         : 'Belum ada hari ini')}
        ${dashKPI('🔗 Seri',         fmt(seriBln)+' lbr',          '#a78bfa',          null)}
        ${dashKPI('📏 Sezing',       fmtDec(volSezBln,2)+' m³',   'var(--green)',      volSezHari   > 0 ? 'Hari ini: '+fmtDec(volSezHari,2)+' m³'   : 'Belum ada hari ini')}
        ${dashKPI('💰 Penjualan',    'Rp '+fmtRupiah(nilaiJualBln),'var(--green)',     'Vol: '+fmtDec(volJualBln,2)+' m³'+(volJualHari>0?' · Hari ini: '+fmtDec(volJualHari,2)+' m³':''))}
        ${dashKPI('📊 Ef. Ripsaw',   efBln==='—'?'—':efBln+'%',   efCol,              'Rendemen: '+(rendBln==='—'?'—':rendBln+'%'))}
        ${dashKPI('🔥 Oven',         ovenAktif+'/7 aktif',         ovenAktif>0?'var(--orange)':'var(--muted)', ovenKosong+' chamber kosong')}
        ${dashKPI('📦 Stok Kering',  fmtDec(stokKering,2)+' m³',  stokCol,            'Min: '+minStok+' m³')}
        ${dashKPI('📑 Order Aktif',  orderAktif.length+' PO',      orderAktif.length>0?'#60a5fa':'var(--green)', 'Sisa: '+fmtDec(sisaOrderTotal,2)+' m³')}
        ${dashKPI('💵 Nilai Kayu',   'Rp '+fmtRupiah(nilaiKayuBln),'var(--orange)',   fmtDec(volKayuBln,2)+' m³ masuk')}
    </div>

    <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:12px;padding:16px 18px;margin-bottom:4px;">
        <div style="font-size:11px;font-weight:700;color:var(--gold-light);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">🔄 Aliran Material — ${formatBulan(bulan)}</div>
        <div style="display:flex;align-items:center;gap:0;flex-wrap:wrap;overflow-x:auto;">
            ${flowStep('🪵 Kayu',    fmtDec(volKayuBln,2),  'm³',    'var(--orange)', 'Dibeli')}
            <div style="color:var(--gold);font-size:20px;padding:0 4px;">→</div>
            ${flowStep('🪚 Sawmill', fmtDec(totPaletBln,2),  'm³',   'var(--gold)',   'Palet Bagus')}
            <div style="color:var(--gold);font-size:20px;padding:0 4px;">→</div>
            ${flowStep('🔥 Oven',   ovenAktif+'',           'chamber','var(--orange)','Sedang Isi')}
            <div style="color:var(--gold);font-size:20px;padding:0 4px;">→</div>
            ${flowStep('📦 Produksi',fmtDec(planerBln,2),    'm³',   '#60a5fa',      'Planer Bagus')}
            <div style="color:var(--gold);font-size:20px;padding:0 4px;">→</div>
            ${flowStep('💰 Jual',   fmtDec(volJualBln,2),   'm³',   'var(--green)', 'Terjual')}
        </div>
        ${planerBln > 0 ? `
        <div style="margin-top:14px;">
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px;">Konversi: Kayu → Planer Bagus</div>
            <div style="height:7px;background:var(--border);border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${Math.min(100,(planerBln/(volKayuBln||1)*100)).toFixed(1)}%;background:linear-gradient(90deg,var(--gold),#60a5fa);border-radius:4px;"></div>
            </div>
            <div style="font-size:10px;color:var(--muted);margin-top:4px;">${Math.min(100,(planerBln/(volKayuBln||1)*100)).toFixed(1)}% dari kayu masuk menjadi planer bagus</div>
        </div>` : ''}
    </div>`;
}

// ── dashKPI — kartu KPI utama dengan sub-line ─────────────────────
function dashKPI(label, value, color, sub) {
    return `<div style="background:var(--bg2);border:1px solid var(--gold-dim);
                border-top:3px solid ${color};border-radius:12px;
                padding:14px 16px;box-shadow:0 3px 12px rgba(0,0,0,.18);
                position:relative;overflow:hidden;">
        <div style="position:absolute;top:-12px;right:-12px;width:48px;height:48px;
                    border-radius:50%;background:${color};opacity:.07;pointer-events:none;"></div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;
                    letter-spacing:.9px;font-weight:600;margin-bottom:6px;">${label}</div>
        <div style="font-size:20px;font-weight:700;color:${color};
                    font-family:var(--font-mono);line-height:1.1;letter-spacing:-.5px;">${value}</div>
        ${sub ? `<div style="font-size:10px;color:var(--muted);margin-top:6px;
                             padding-top:5px;border-top:1px solid var(--border);">${sub}</div>` : ''}
    </div>`;
}

// ── 2. TARGET ACHIEVEMENT ─────────────────────────────────────────
function renderTargetAchievement() {
    const container = document.getElementById('target-achievement-container');
    if (!container) return;

    const cfg   = window.appSettings || {};
    const bulan = thisMonth();
    const today_= today();

    const tKayu    = cfg.targetKayuHarian    || 10;
    const tSawmill = cfg.targetSawmillHarian || 8;
    const tPlaner  = cfg.targetPlanerHarian  || 3;
    const tPress   = cfg.targetPressHarian   || 1000;
    const tSeri    = cfg.targetSeriHarian    || 800;
    const tSezing  = cfg.targetSezingHarian  || 2;

    const targetKayu    = getTargetCumulativeUpTo(today_, tKayu);
    const targetSawmill = getTargetCumulativeUpTo(today_, tSawmill);
    const targetPlaner  = getTargetCumulativeUpTo(today_, tPlaner);
    const targetPress   = getTargetCumulativeUpTo(today_, tPress);
    const targetSeri    = getTargetCumulativeUpTo(today_, tSeri);
    const targetSezing  = getTargetCumulativeUpTo(today_, tSezing);

    const kayuBln = (window.kayuList    ||[]).filter(k=>k.tanggal?.startsWith(bulan));
    const sawBln  = (window.sawmillList ||[]).filter(s=>s.tanggal?.startsWith(bulan));
    const prodBln = (window.produksiList||[]).filter(p=>p.tanggal?.startsWith(bulan));
    const sezBln  = (window.sezingList  ||[]).filter(s=>s.tanggal?.startsWith(bulan));

    let rPlaner=0, rPress=0, rSeri=0;
    prodBln.forEach(p=>{
        const s1=p.shift1||{}, s2=p.shift2||{};
        rPlaner+=(s1.planerBagus||0)+(s2.planerBagus||0);
        rPress +=(s1.press||0)      +(s2.press||0);
        rSeri  +=(s1.seri||0)       +(s2.seri||0);
    });

    const real = {
        kayu:    kayuBln.reduce((a,k)=>a+(k.volume||0),0),
        sawmill: sawBln .reduce((a,s)=>a+(s.prosesSawmill||0),0),
        planer:  rPlaner, press: rPress, seri: rSeri,
        sezing:  sezBln.reduce((a,s)=>a+(s.volume||0),0),
    };

    let efDays = 0;
    const [yr, mo] = bulan.split('-').map(Number);
    let cur = new Date(yr, mo-1, 1);
    const todayObj = new Date(today_);
    while (cur <= todayObj) { if(isTargetDay(cur.toISOString().split('T')[0])) efDays++; cur.setDate(cur.getDate()+1); }

    const getCol = p => p>=100?'var(--green)':p>=70?'var(--gold)':p>=50?'var(--orange)':'var(--red)';
    const pct    = (r,t) => t>0 ? Math.min(100,r/t*100) : 0;

    const metrics = [
        { label:'🪵 Kayu Masuk',   r:real.kayu,    t:targetKayu,    unit:'m³',  dec:true  },
        { label:'🪚 Sawmill',      r:real.sawmill,  t:targetSawmill, unit:'m³',  dec:true  },
        { label:'📦 Planer Bagus', r:real.planer,   t:targetPlaner,  unit:'m³',  dec:true  },
        { label:'🔩 Press',        r:real.press,    t:targetPress,   unit:'lbr', dec:false },
        { label:'🔗 Seri',         r:real.seri,     t:targetSeri,    unit:'lbr', dec:false },
        { label:'📏 Sezing',       r:real.sezing,   t:targetSezing,  unit:'m³',  dec:true  },
    ];

    container.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin:20px 0 12px;">
        <span style="width:4px;height:22px;background:var(--gold);border-radius:3px;"></span>
        <span style="font-size:14px;font-weight:700;color:var(--gold);">🎯 Target vs Realisasi — ${formatBulan(bulan)}</span>
        <span style="font-size:10px;color:var(--muted);background:var(--bg3);padding:2px 8px;border-radius:12px;">Hari Efektif ke-${efDays}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px;">
        ${metrics.map(m => {
            const p = pct(m.r, m.t), col = getCol(p);
            const icon = p>=100?'✅':p>=70?'🟡':p>=50?'⚠️':'🔴';
            const valFmt = v => m.dec ? fmtDec(v,2) : fmt(v);
            return `<div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.1);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <div style="font-size:12px;font-weight:700;color:var(--text);">${m.label}</div>
                    <div>${icon}</div>
                </div>
                <div style="font-size:24px;font-weight:800;color:${col};font-family:var(--font-mono);margin-bottom:5px;">${p.toFixed(1)}%</div>
                <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;margin-bottom:10px;">
                    <div style="height:100%;width:${p}%;background:${col};border-radius:4px;transition:width .5s;"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);">
                    <span>Realisasi: ${valFmt(m.r)} ${m.unit}</span>
                    <span>Target: ${valFmt(m.t)} ${m.unit}</span>
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

// Stub agar fungsi lama tidak error jika dipanggil dari luar
window.renderTargetCapaian = function () {};

// ── 2b. TARGET VS REALISASI BERDASARKAN HARI AKTIF MASUK ─────────
window.renderTargetHariAktif = function () {
    const cont  = document.getElementById('target-hari-aktif-container');
    const badge = document.getElementById('hari-aktif-badge');
    if (!cont) return;

    const cfg   = window.appSettings || {};
    const bulan = thisMonth();

    // ── Hitung semua hari kerja bulan ini dari tgl 1 s/d hari ini ──
    // Hari kerja = bukan Minggu + bukan Sabtu (jika liburSabtu) + tidak di daftar libur
    const hari_ini   = today();
    const [thn, bln] = bulan.split('-').map(Number);
    const hariKerja  = [];   // semua hari kerja s/d hari ini
    const hariLiburSet = new Set(cfg.hariLibur || []);

    let cur = new Date(thn, bln - 1, 1);
    const batas = new Date(hari_ini + 'T00:00:00');
    while (cur <= batas) {
        const tgl = cur.toISOString().split('T')[0];
        if (isTargetDay(tgl)) hariKerja.push(tgl);
        cur.setDate(cur.getDate() + 1);
    }

    const jumlahHariKerja = hariKerja.length;

    // ── Target kumulatif = jumlah hari kerja s/d hari ini × target harian ──
    const tKayu    = cfg.targetKayuHarian    || 10;
    const tSawmill = cfg.targetSawmillHarian || 8;
    const tPlaner  = cfg.targetPlanerHarian  || 3;
    const tPress   = cfg.targetPressHarian   || 1000;
    const tSeri    = cfg.targetSeriHarian    || 800;
    const tSezing  = cfg.targetSezingHarian  || 2;

    const targetKayu    = jumlahHariKerja * tKayu;
    const targetSawmill = jumlahHariKerja * tSawmill;
    const targetPlaner  = jumlahHariKerja * tPlaner;
    const targetPress   = jumlahHariKerja * tPress;
    const targetSeri    = jumlahHariKerja * tSeri;
    const targetSezing  = jumlahHariKerja * tSezing;

    // ── Hitung juga total hari kerja sebulan penuh (untuk info) ──
    let totalHariBulan = 0;
    let curFull = new Date(thn, bln - 1, 1);
    const akhirBulan = new Date(thn, bln, 0);
    while (curFull <= akhirBulan) {
        if (isTargetDay(curFull.toISOString().split('T')[0])) totalHariBulan++;
        curFull.setDate(curFull.getDate() + 1);
    }
    const sisaHari = totalHariBulan - jumlahHariKerja;

    // ── Realisasi bulan ini ──
    const kayuBln  = (window.kayuList     || []).filter(k => k.tanggal?.startsWith(bulan));
    const sawBln   = (window.sawmillList  || []).filter(s => s.tanggal?.startsWith(bulan));
    const prodBln  = (window.produksiList || []).filter(p => p.tanggal?.startsWith(bulan));
    const sezBln   = (window.sezingList   || []).filter(s => s.tanggal?.startsWith(bulan));

    let rPlaner = 0, rPress = 0, rSeri = 0;
    prodBln.forEach(p => {
        const s1 = p.shift1 || {}, s2 = p.shift2 || {};
        rPlaner += (s1.planerBagus || 0) + (s2.planerBagus || 0);
        rPress  += (s1.press       || 0) + (s2.press       || 0);
        rSeri   += (s1.seri        || 0) + (s2.seri        || 0);
    });

    const rKayu    = kayuBln.reduce((a, k) => a + (k.volume        || 0), 0);
    const rSawmill = sawBln .reduce((a, s) => a + (s.prosesSawmill || 0), 0);
    const rSezing  = sezBln .reduce((a, s) => a + (s.volume        || 0), 0);

    // ── Update badge hari kerja ──
    if (badge) {
        const sabtulbl = cfg.liburSabtu ? 'Sen–Jum' : 'Sen–Sab';
        const liburExtra = hariLiburSet.size;
        badge.innerHTML = `
            <span style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;
                          padding:6px 14px;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px;">
                📅 Hari kerja s/d hari ini:
                <span style="color:var(--gold);font-weight:800;font-family:var(--font-mono);font-size:16px;">
                    ${jumlahHariKerja}</span>
                <span style="opacity:.6;">/ ${totalHariBulan} hari</span>
            </span>
            <span style="font-size:10px;color:var(--muted);">
                ${sabtulbl}${liburExtra ? ` · ${liburExtra} libur khusus` : ''}
                ${sisaHari > 0 ? ` · <b style="color:var(--gold);">${sisaHari} hari kerja tersisa</b>` : ' · Bulan selesai'}
            </span>`;
    }

    // ── Tidak ada hari kerja ──
    if (jumlahHariKerja === 0) {
        cont.innerHTML = `<div style="text-align:center;padding:32px;color:var(--muted);font-size:13px;">
            📭 Belum ada hari kerja yang terhitung bulan ini.
        </div>`;
        return;
    }

    // ── Helpers ──
    const pct    = (r, t) => t > 0 ? Math.min(999, (r / t) * 100) : 0;
    const getStatus = p => p >= 100 ? { label: 'TERCAPAI',   color: 'var(--green)',  bg: 'rgba(74,222,128,.08)'  }
                         : p >= 75  ? { label: 'ON TRACK',   color: 'var(--gold)',   bg: 'rgba(234,179,8,.08)'   }
                         : p >= 50  ? { label: 'PERLU PACU', color: 'var(--orange)', bg: 'rgba(249,115,22,.08)'  }
                         :            { label: 'KRITIS',     color: 'var(--red)',    bg: 'rgba(239,68,68,.08)'   };

    const fmtVal = (v, dec) => dec
        ? fmtDec(v, 2)
        : fmt(Math.round(v));

    // ── Data per hari untuk sparkline ──
    // Sparkline mini: realisasi aktual per hari aktif (max 20 bar terakhir)
    const sparkDays   = hariKerja.slice(-20);
    const sparkLabels = sparkDays.map(d => d.slice(8)); // "DD"

    const sparkKayu   = sparkDays.map(d => (window.kayuList    ||[]).filter(k=>k.tanggal===d).reduce((a,k)=>a+(k.volume||0),0));
    const sparkSaw    = sparkDays.map(d => (window.sawmillList ||[]).filter(s=>s.tanggal===d).reduce((a,s)=>a+(s.prosesSawmill||0),0));
    const sparkSez    = sparkDays.map(d => (window.sezingList  ||[]).filter(s=>s.tanggal===d).reduce((a,s)=>a+(s.volume||0),0));
    let   sparkPrd = {}; (window.produksiList||[]).filter(p=>p.tanggal?.startsWith(bulan)).forEach(p=>{
        const d=p.tanggal; if(!sparkPrd[d]) sparkPrd[d]={planer:0,press:0};
        const s1=p.shift1||{},s2=p.shift2||{};
        sparkPrd[d].planer+=(s1.planerBagus||0)+(s2.planerBagus||0);
        sparkPrd[d].press +=(s1.press||0)+(s2.press||0);
    });
    const sparkPlaner = sparkDays.map(d => sparkPrd[d]?.planer || 0);
    const sparkPress  = sparkDays.map(d => sparkPrd[d]?.press  || 0);

    // ── Metrics ──
    const metrics = [
        { key:'kayu',   label:'🪵 Kayu Masuk',   real:rKayu,    target:targetKayu,    tHari:tKayu,    unit:'m³',  dec:true,  color:'var(--orange)', sparkData:sparkKayu  },
        { key:'saw',    label:'🪚 Sawmill',       real:rSawmill, target:targetSawmill, tHari:tSawmill, unit:'m³',  dec:true,  color:'var(--gold)',   sparkData:sparkSaw   },
        { key:'planer', label:'📦 Planer Bagus',  real:rPlaner,  target:targetPlaner,  tHari:tPlaner,  unit:'m³',  dec:true,  color:'#e8c84a',       sparkData:sparkPlaner},
        { key:'press',  label:'🔩 Press',         real:rPress,   target:targetPress,   tHari:tPress,   unit:'lbr', dec:false, color:'#60a5fa',       sparkData:sparkPress },
        { key:'seri',   label:'🔗 Seri',          real:rSeri,    target:targetSeri,    tHari:tSeri,    unit:'lbr', dec:false, color:'#a78bfa',       sparkData:null       },
        { key:'sezing', label:'📏 Sezing',        real:rSezing,  target:targetSezing,  tHari:tSezing,  unit:'m³',  dec:true,  color:'var(--green)',  sparkData:sparkSez   },
    ];

    // ── Render kartu ──
    const cardsHtml = metrics.map(m => {
        const p  = pct(m.real, m.target);
        const st = getStatus(p);
        const barW = Math.min(100, p).toFixed(1);
        const sisa = m.target - m.real;
        const sisaTxt = sisa > 0
            ? `Sisa ${fmtVal(sisa, m.dec)} ${m.unit}`
            : `<span style="color:var(--green);">+${fmtVal(Math.abs(sisa), m.dec)} ${m.unit} lebih</span>`;
        const canvasId = `spark-hari-aktif-${m.key}`;

        return `
        <div style="background:var(--bg2);border:1px solid var(--border);
                    border-top:3px solid ${m.color};border-radius:12px;
                    padding:16px;display:flex;flex-direction:column;gap:10px;">
            <!-- Header -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                    <div style="font-size:10px;color:var(--muted);text-transform:uppercase;
                                letter-spacing:.9px;font-weight:600;margin-bottom:4px;">${m.label}</div>
                    <div style="font-size:22px;font-weight:800;color:${m.color};
                                font-family:var(--font-mono);line-height:1.1;">
                        ${fmtVal(m.real, m.dec)}
                        <span style="font-size:11px;color:var(--muted);font-weight:400;"> ${m.unit}</span>
                    </div>
                    <div style="font-size:10px;color:var(--muted);margin-top:3px;">
                        Target: <span style="font-family:var(--font-mono);">${fmtVal(m.target, m.dec)} ${m.unit}</span>
                        <span style="opacity:.6;"> (${jumlahHariKerja} hr × ${m.dec ? fmtDec(m.tHari,1) : fmt(m.tHari)})</span>
                    </div>
                </div>
                <!-- Pct circle -->
                <div style="flex-shrink:0;text-align:center;">
                    <div style="font-size:22px;font-weight:900;color:${st.color};
                                font-family:var(--font-mono);line-height:1;">${p.toFixed(1)}%</div>
                    <div style="font-size:9px;font-weight:700;letter-spacing:.6px;
                                color:${st.color};background:${st.bg};
                                padding:2px 8px;border-radius:20px;margin-top:4px;">${st.label}</div>
                </div>
            </div>
            <!-- Progress bar -->
            <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${barW}%;
                            background:linear-gradient(90deg,${m.color}88,${m.color});
                            border-radius:3px;transition:width .5s;"></div>
            </div>
            <!-- Sisa + sparkline -->
            <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:8px;">
                <div style="font-size:10px;color:var(--muted);">${sisaTxt}</div>
                ${m.sparkData ? `<canvas id="${canvasId}" width="80" height="28" style="flex-shrink:0;"></canvas>` : ''}
            </div>
        </div>`;
    }).join('');

    // ── Rata-rata keseluruhan ──
    const avgPct = metrics.reduce((a, m) => a + pct(m.real, m.target), 0) / metrics.length;
    const avgSt  = getStatus(avgPct);

    cont.innerHTML = `
    <!-- Summary strip -->
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;
                padding:10px 16px;margin-bottom:14px;
                display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <div style="display:flex;gap:20px;flex:1;flex-wrap:wrap;">
            ${metrics.map(m => {
                const p = pct(m.real, m.target);
                const c = p>=100?'var(--green)':p>=75?'var(--gold)':p>=50?'var(--orange)':'var(--red)';
                return `<div style="display:flex;flex-direction:column;align-items:center;gap:1px;min-width:56px;">
                    <div style="font-size:9px;color:var(--muted);text-align:center;line-height:1.2;">${m.label.split(' ').slice(1).join(' ')}</div>
                    <div style="font-size:14px;font-weight:800;color:${c};font-family:var(--font-mono);">${p.toFixed(0)}%</div>
                </div>`;
            }).join('')}
        </div>
        <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:10px;color:var(--muted);">Rata-rata pencapaian</div>
            <div style="font-size:26px;font-weight:900;color:${avgSt.color};font-family:var(--font-mono);line-height:1;">${avgPct.toFixed(1)}%</div>
            <div style="font-size:9px;font-weight:700;color:${avgSt.color};background:${avgSt.bg};
                        padding:2px 10px;border-radius:20px;display:inline-block;margin-top:2px;">${avgSt.label}</div>
        </div>
    </div>
    <!-- Kartu per indikator -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
        ${cardsHtml}
    </div>`;

    // ── Render sparklines setelah DOM siap ──
    if (!window.Chart) return;
    metrics.forEach(m => {
        if (!m.sparkData) return;
        const ctx = document.getElementById(`spark-hari-aktif-${m.key}`);
        if (!ctx) return;
        if (ctx._sp) ctx._sp.destroy();
        ctx._sp = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sparkLabels,
                datasets: [{ data: m.sparkData, backgroundColor: m.color + '88',
                             borderColor: m.color, borderWidth: 1, borderRadius: 2 }]
            },
            options: {
                animation: false,
                plugins: { legend: { display: false }, tooltip: {
                    callbacks: { label: ctx => `${m.dec ? ctx.raw.toFixed(2) : ctx.raw} ${m.unit}` }
                }},
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    });
};

// ── 3. CHARTS TARGET VS REALISASI KUMULATIF ──────────────────────
window.renderTargetCharts = function () {
    const bulan = thisMonth();
    const cfg   = window.appSettings || {};
    const hariIni = parseInt(today().split('-')[2]);
    const labels  = Array.from({length:hariIni},(_,i)=>String(i+1).padStart(2,'0'));

    function sumPerHari(list, dateField, valueFunc) {
        return labels.map(d => list.filter(x=>x[dateField]===`${bulan}-${d}`).reduce((a,x)=>a+valueFunc(x),0));
    }

    const kayuH   = sumPerHari(window.kayuList    ||[], 'tanggal', k=>k.volume||0);
    const sawH    = sumPerHari(window.sawmillList  ||[], 'tanggal', s=>s.prosesSawmill||0);
    let prodByDate={};
    (window.produksiList||[]).filter(p=>p.tanggal?.startsWith(bulan)).forEach(p=>{
        const d=p.tanggal; if(!prodByDate[d]) prodByDate[d]={planer:0,press:0,seri:0,ripsaw:0};
        const s1=p.shift1||{},s2=p.shift2||{};
        prodByDate[d].planer+=(s1.planerBagus||0)+(s2.planerBagus||0);
        prodByDate[d].press +=(s1.press||0)      +(s2.press||0);
        prodByDate[d].seri  +=(s1.seri||0)       +(s2.seri||0);
        prodByDate[d].ripsaw+=(s1.ripsawIn||0)   +(s2.ripsawIn||0);
    });
    const planerH = labels.map(d=>prodByDate[`${bulan}-${d}`]?.planer||0);
    const pressH  = labels.map(d=>prodByDate[`${bulan}-${d}`]?.press ||0);
    const seriH   = labels.map(d=>prodByDate[`${bulan}-${d}`]?.seri  ||0);
    const ripsawH = labels.map(d=>prodByDate[`${bulan}-${d}`]?.ripsaw||0);
    const sezH    = sumPerHari(window.sezingList  ||[], 'tanggal', s=>s.volume||0);

    const cum  = data => { let a=0; return data.map(v=>(a+=v,a)); };
    const tCum = dt   => { let a=0; return labels.map(d=>(a+=isTargetDay(`${bulan}-${d}`)?dt:0,a)); };

    const hexA = {
        '#ff9f43':`rgba(255,159,67,`,   '#d4a017':`rgba(212,160,23,`,
        '#e8c84a':`rgba(232,200,74,`,   '#60a5fa':`rgba(96,165,250,`,
        '#a78bfa':`rgba(167,139,250,`,  '#38bdf8':`rgba(56,189,248,`,
        '#4ade80':`rgba(74,222,128,`,
    };
    const alpha = (hex,a) => (hexA[hex]||`rgba(200,200,200,`)+a+`)`;

    const charts = [
        {id:'chart-target-kayu',    label:'🪵 Kayu Masuk (m³)',      data:kayuH,   cum:cum(kayuH),   tgt:tCum(cfg.targetKayuHarian||10),    color:'#ff9f43'},
        {id:'chart-target-sawmill', label:'🪚 Sawmill Vol.In (m³)',   data:sawH,    cum:cum(sawH),    tgt:tCum(cfg.targetSawmillHarian||8),  color:'#d4a017'},
        {id:'chart-target-planer',  label:'📦 Planer Bagus (m³)',     data:planerH, cum:cum(planerH), tgt:tCum(cfg.targetPlanerHarian||3),   color:'#e8c84a'},
        {id:'chart-target-ripsaw',  label:'🔄 Ripsaw Input (m³)',     data:ripsawH, cum:cum(ripsawH), tgt:tCum(cfg.targetRipsawHarian||2.5), color:'#60a5fa'},
        {id:'chart-target-seri',    label:'🔗 Seri (lbr)',            data:seriH,   cum:cum(seriH),   tgt:tCum(cfg.targetSeriHarian||800),   color:'#a78bfa'},
        {id:'chart-target-press',   label:'🔩 Press (lbr)',           data:pressH,  cum:cum(pressH),  tgt:tCum(cfg.targetPressHarian||1000), color:'#38bdf8'},
        {id:'chart-target-sezing',  label:'📏 Sezing (m³)',           data:sezH,    cum:cum(sezH),    tgt:tCum(cfg.targetSezingHarian||2),   color:'#4ade80'},
    ];

    charts.forEach(c => {
        const ctx = document.getElementById(c.id);
        if (!ctx || !window.Chart) return;
        if (ctx._chartInst) ctx._chartInst.destroy();
        ctx._chartInst = new Chart(ctx, {
            data: { labels,
                datasets: [
                    {type:'bar',  label:'Harian',          data:c.data, backgroundColor:alpha(c.color,.5), borderColor:c.color, borderWidth:1, yAxisID:'y',  order:2},
                    {type:'line', label:'Kumulatif Aktual',data:c.cum,  borderColor:c.color, backgroundColor:alpha(c.color,.08), borderWidth:2, pointRadius:2, fill:true, tension:.3, yAxisID:'y1', order:1},
                    {type:'line', label:'Target Kumulatif',data:c.tgt,  borderColor:'rgba(255,255,255,.25)', borderDash:[5,4], borderWidth:1.5, pointRadius:0, fill:false, tension:0, yAxisID:'y1', order:0},
                ]
            },
            options: {
                responsive:true, interaction:{mode:'index',intersect:false},
                plugins:{
                    title:{display:true,text:c.label,color:'#8a8578',font:{size:11,weight:'600'},padding:{bottom:8}},
                    legend:{labels:{color:'#8a8578',font:{size:9},boxWidth:12}}
                },
                scales:{
                    x:{ticks:{color:'#666',font:{size:9}},grid:{color:'rgba(255,255,255,.03)'}},
                    y:{position:'left',ticks:{color:c.color,font:{size:9}},grid:{color:'rgba(255,255,255,.04)'}},
                    y1:{position:'right',ticks:{color:'#8a8578',font:{size:9}},grid:{drawOnChartArea:false}}
                }
            }
        });
    });
};

// ── 4. TREN 30 HARI ──────────────────────────────────────────────
window.renderTrendCharts = function () {
    const days = [];
    for (let i=29; i>=0; i--) {
        const d = new Date(); d.setDate(d.getDate()-i);
        days.push(d.toISOString().split('T')[0]);
    }
    const labels = days.map(d=>d.slice(5));

    const rendData = days.map(d=>{
        const s=(window.sawmillList||[]).filter(x=>x.tanggal===d);
        const vIn=s.reduce((a,x)=>a+(x.prosesSawmill||0),0);
        const pOk=s.reduce((a,x)=>a+(x.totalVolumePalet||0),0);
        return vIn>0 ? parseFloat((pOk/vIn*100).toFixed(1)) : null;
    });
    const prodData = days.map(d=>{
        let t=0;
        (window.produksiList||[]).filter(p=>p.tanggal===d).forEach(p=>{
            const s1=p.shift1||{},s2=p.shift2||{};
            t+=(s1.planerBagus||0)+(s2.planerBagus||0);
        });
        return t||null;
    });
    const stokData = days.map(d=>{
        const m=(window.kayuList  ||[]).filter(k=>k.tanggal<=d).reduce((a,k)=>a+(k.volume||0),0);
        const p=(window.sawmillList||[]).filter(s=>s.tanggal<=d).reduce((a,s)=>a+(s.prosesSawmill||0),0);
        return parseFloat((m-p).toFixed(2));
    });
    const jualData = days.map(d=>(window.penjualanList||[]).filter(j=>j.tanggal===d).reduce((a,j)=>a+(j.volume||0),0)||null);

    const trendCfgs = [
        {id:'chart-rendemen',  label:'📈 Rendemen Sawmill (%)',         data:rendData, borderColor:'#d4a017', bgColor:'rgba(212,160,23,.08)', yUnit:'%', yMin:0, yMax:100},
        {id:'chart-produksi',  label:'📦 Planer Bagus Harian (m³)',     data:prodData, borderColor:'#60a5fa', bgColor:'rgba(96,165,250,.08)',  yUnit:'m³'},
        {id:'chart-stok',      label:'🪵 Estimasi Stok Kayu Log (m³)',  data:stokData, borderColor:'#ff9f43', bgColor:'rgba(255,159,67,.08)',  yUnit:'m³'},
        {id:'chart-penjualan', label:'💰 Volume Penjualan Harian (m³)', data:jualData, borderColor:'#4ade80', bgColor:'rgba(74,222,128,.08)', yUnit:'m³'},
    ];

    trendCfgs.forEach(c => {
        const ctx = document.getElementById(c.id);
        if (!ctx || !window.Chart) return;
        if (ctx._chartInst) ctx._chartInst.destroy();
        const ma = c.data.map((_,i)=>{
            const sl=c.data.slice(Math.max(0,i-6),i+1).filter(v=>v!==null);
            return sl.length?parseFloat((sl.reduce((a,v)=>a+v,0)/sl.length).toFixed(2)):null;
        });
        ctx._chartInst = new Chart(ctx, {
            type:'line',
            data:{labels, datasets:[
                {label:'Nilai Harian', data:c.data, borderColor:c.borderColor, backgroundColor:c.bgColor, borderWidth:1.5, pointRadius:3, pointHoverRadius:5, fill:true, tension:.3, spanGaps:true},
                {label:'MA 7 Hari',    data:ma,     borderColor:'rgba(255,255,255,.4)', borderWidth:1.5, borderDash:[4,3], pointRadius:0, fill:false, tension:.4, spanGaps:true},
            ]},
            options:{
                responsive:true, interaction:{mode:'index',intersect:false},
                plugins:{
                    title:{display:true,text:c.label,color:'#8a8578',font:{size:11,weight:'600'},padding:{bottom:6}},
                    legend:{labels:{color:'#8a8578',font:{size:9},boxWidth:12}},
                    tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.raw??'—'} ${c.yUnit}`}}
                },
                scales:{
                    x:{ticks:{color:'#666',font:{size:9},maxRotation:45,autoSkip:true,maxTicksLimit:15},grid:{color:'rgba(255,255,255,.03)'}},
                    y:{min:c.yMin,max:c.yMax,ticks:{color:'#8a8578',font:{size:9}},grid:{color:'rgba(255,255,255,.05)'},title:{display:true,text:c.yUnit,color:'#8a8578',font:{size:9}}}
                }
            }
        });
    });
};

// ── Utility ───────────────────────────────────────────────────────
function flowStep(label, value, unit, color, sublabel) {
    return `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px 16px;min-width:100px;text-align:center;flex-shrink:0;">
        <div style="font-size:11px;color:var(--muted);">${label}</div>
        <div style="font-size:18px;font-weight:700;color:${color};font-family:var(--font-mono);">${value}</div>
        <div style="font-size:9px;color:var(--muted);">${unit} · ${sublabel}</div>
    </div>`;
}
function fmtRupiah(n) {
    if (!n) return '0';
    if (n>=1e9) return (n/1e9).toFixed(1)+'M';
    if (n>=1e6) return (n/1e6).toFixed(1)+'jt';
    return fmt(n);
}
function formatBulan(ym) {
    if (!ym) return '';
    const [y,m] = ym.split('-');
    return ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][parseInt(m)-1]+' '+y;
}
// Expose helpers for export-pdf.js
window.formatBulan           = formatBulan;
window.isTargetDay           = isTargetDay;
window.getTargetCumulativeUpTo = getTargetCumulativeUpTo;

// ── Auto-init ─────────────────────────────────────────────────────
(function () {
    const run = () => { if (document.getElementById('dashboard-container') && typeof window.renderDashboard==='function') window.renderDashboard(); };
    document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',run) : run();
})();
