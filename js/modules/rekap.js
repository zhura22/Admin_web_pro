// rekap.js — IMPROVED
// Rekap multi-modul, perbandingan bulanan, efisiensi end-to-end, chart, export

// ═══════════════════════════════════════════════════════════
// RENDER UTAMA
// ═══════════════════════════════════════════════════════════
window.renderRekap = function () {
    const bulan = document.getElementById('rekap-bulan')?.value || thisMonth();
    renderRekapKPI(bulan);
    renderRekapEfisiensi(bulan);
    renderRekapCharts(bulan);
    renderRekapPerModul(bulan);
    renderRekapPerbandingan(bulan);
};

// ═══════════════════════════════════════════════════════════
// HELPER: Kumpulkan semua data satu bulan
// ═══════════════════════════════════════════════════════════
function getRekapData(bulan) {
    const kayu    = (window.kayuList    || []).filter(k => k.tanggal?.startsWith(bulan));
    const sawmill = (window.sawmillList || []).filter(s => s.tanggal?.startsWith(bulan));
    const oven    = (window.ovenList    || []).filter(o => o.tglMulai?.startsWith(bulan));
    const prod    = (window.produksiList|| []).filter(p => p.tanggal?.startsWith(bulan));
    const penj    = (window.penjualanList||[]).filter(j => j.tanggal?.startsWith(bulan));
    const order   = (window.orderList   || []);
    const sezing  = (window.sezingList  || []).filter(s => s.tanggal?.startsWith(bulan));

    // Kayu
    const volKayu    = kayu.reduce((a,k) => a+(k.volume||0), 0);
    const nilaiKayu  = kayu.reduce((a,k) => a+(k.harga||0),  0);

    // Sawmill (perbaikan: prosesSawmill)
    const volSawIn   = sawmill.reduce((a,s) => a+(s.prosesSawmill||0), 0);
    const volPaletOk = sawmill.reduce((a,s) => a+(s.totalVolumePalet||0), 0);
    const rendemen   = volSawIn > 0 ? (volPaletOk / volSawIn * 100) : 0;

    // Produksi
    let totPlaner=0, totPress=0, totRipsaw=0, totSeri=0, totMasuk=0, totTidak=0;
    prod.forEach(p => {
        const s1=p.shift1||{}, s2=p.shift2||{};
        totPlaner  += (s1.planerBagus||0)+(s2.planerBagus||0);
        totPress   += (s1.press||0)      +(s2.press||0);
        totRipsaw  += (s1.ripsawIn||0)   +(s2.ripsawIn||0);
        totSeri    += (s1.seri||0)        +(s2.seri||0);
        totMasuk   += (s1.masuk||0)       +(s2.masuk||0);
        totTidak   += (s1.tidakMasuk||0)  +(s2.tidakMasuk||0);
    });
    const efRipsaw   = totPlaner > 0 ? (totRipsaw / totPlaner * 100) : 0;
    const kehadiran  = (totMasuk+totTidak) > 0 ? (totMasuk/(totMasuk+totTidak)*100) : 100;

    // Penjualan
    const volJual    = penj.reduce((a,j) => a+(j.volume||0), 0);
    const nilaiJual  = penj.reduce((a,j) => a+(j.harga||0),  0);

    // Order
    const orderAktif = order.filter(o => !o.lunas);
    const orderBulan = order.filter(o => o.tanggal?.startsWith(bulan));

    // Sezing
    const volSezing  = sezing.reduce((a,s) => a+(s.volume||0), 0);

    // Efisiensi end-to-end: kayu masuk → press keluar
    const konversi   = volKayu > 0 ? (totPlaner / volKayu * 100) : 0;

    return {
        kayu, sawmill, oven, prod, penj, order, sezing,
        volKayu, nilaiKayu, volSawIn, volPaletOk, rendemen,
        totPlaner, totPress, totRipsaw, totSeri, totMasuk, totTidak,
        efRipsaw, kehadiran, volJual, nilaiJual, orderAktif, orderBulan,
        volSezing, konversi
    };
}

// ═══════════════════════════════════════════════════════════
// 1. KPI UTAMA
// ═══════════════════════════════════════════════════════════
function renderRekapKPI(bulan) {
    const cont = document.getElementById('rekap-kpi-container');
    if (!cont) return;
    const d = getRekapData(bulan);

    const rendCol  = d.rendemen >= 65 ? 'var(--green)' : d.rendemen >= 55 ? 'var(--orange)' : 'var(--red)';
    const efRipCol = d.efRipsaw >= 80 ? 'var(--green)' : d.efRipsaw >= 60 ? 'var(--orange)' : 'var(--red)';
    const khadCol  = d.kehadiran >= 90 ? 'var(--green)' : d.kehadiran >= 75 ? 'var(--orange)' : 'var(--red)';

    cont.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
                gap:12px;margin-bottom:8px;">
        ${rKPI('🪵 Kayu Masuk',        fmtDec(d.volKayu,2)+' m³',         'var(--orange)',   'Rp '+fmtRp(d.nilaiKayu))}
        ${rKPI('🪚 Vol. Sawmill',       fmtDec(d.volSawIn,2)+' m³',        'var(--gold)',     d.sawmill.length+' sesi')}
        ${rKPI('📊 Rendemen',           d.rendemen.toFixed(1)+'%',          rendCol,           'Target 65%')}
        ${rKPI('📦 Planer Bagus',       fmtDec(d.totPlaner,2)+' m³',       'var(--gold)',     d.prod.length+' laporan')}
        ${rKPI('🔩 Total Press',        fmt(d.totPress)+' lbr',             'var(--blue)',     '🔗 Seri: '+fmt(d.totSeri)+' lbr')}
        ${rKPI('📊 Ef. Ripsaw',         d.efRipsaw.toFixed(1)+'%',          efRipCol,          'Target 80%')}
        ${rKPI('💰 Nilai Jual',         'Rp '+fmtRp(d.nilaiJual),           'var(--green)',    fmtDec(d.volJual,2)+' m³')}
        ${rKPI('👷 Kehadiran',          d.kehadiran.toFixed(1)+'%',          khadCol,           'Masuk: '+fmt(d.totMasuk)+' orang')}
    </div>`;
}

function rKPI(label, value, color, sub) {
    return `
    <div style="background:var(--bg2);border:1px solid var(--gold-dim);
                border-top:3px solid ${color};border-radius:12px;
                padding:14px 18px;box-shadow:0 3px 12px rgba(0,0,0,.18);
                position:relative;overflow:hidden;">
        <div style="position:absolute;top:-12px;right:-12px;width:52px;height:52px;
                    border-radius:50%;background:${color};opacity:.07;pointer-events:none;"></div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;
                    letter-spacing:.9px;font-weight:600;">${label}</div>
        <div style="font-size:21px;font-weight:700;color:${color};
                    font-family:var(--font-mono);margin-top:6px;line-height:1.1;
                    letter-spacing:-.5px;">${value}</div>
        ${sub ? `<div style="font-size:10px;color:var(--muted);margin-top:6px;
                             padding-top:5px;border-top:1px solid var(--border);">${sub}</div>` : ''}
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// 2. EFISIENSI END-TO-END
// ═══════════════════════════════════════════════════════════
function renderRekapEfisiensi(bulan) {
    const cont = document.getElementById('rekap-e2e-container');
    if (!cont) return;
    const d = getRekapData(bulan);

    // Tahapan konversi material
    const steps = [
        { label: '🪵 Kayu Dibeli',      val: fmtDec(d.volKayu,2),     unit:'m³', color:'var(--orange)', pct: 100 },
        { label: '🪚 Masuk Sawmill',     val: fmtDec(d.volSawIn,2),    unit:'m³', color:'var(--gold)',
          pct: d.volKayu > 0 ? d.volSawIn/d.volKayu*100 : 0 },
        { label: '📦 Palet Bagus',       val: fmtDec(d.volPaletOk,2),  unit:'m³', color:'var(--gold-light)',
          pct: d.volKayu > 0 ? d.volPaletOk/d.volKayu*100 : 0 },
        { label: '📦 Planer Bagus',      val: fmtDec(d.totPlaner,2),   unit:'m³', color:'var(--blue)',
          pct: d.volKayu > 0 ? d.totPlaner/d.volKayu*100 : 0 },
        { label: '🔩 Press Hasil',       val: fmt(d.totPress),          unit:'lbr',color:'var(--blue)',
          pct: null },
        { label: '💰 Terjual',           val: fmtDec(d.volJual,2),     unit:'m³', color:'var(--green)',
          pct: d.totPlaner > 0 ? d.volJual/d.totPlaner*100 : 0 },
    ];

    const stepsHtml = steps.map((s, i) => `
        <div style="flex:1;min-width:95px;text-align:center;">
            <div style="background:var(--bg3);border:1px solid var(--border);border-radius:9px;
                        padding:12px 8px;transition:border-color .2s;">
                <div style="font-size:10px;color:var(--muted);margin-bottom:5px;">${s.label}</div>
                <div style="font-size:17px;font-weight:700;color:${s.color};
                            font-family:var(--font-mono);">${s.val}</div>
                <div style="font-size:9px;color:var(--muted);">${s.unit}</div>
                ${s.pct !== null
                    ? `<div style="font-size:10px;margin-top:5px;color:${s.pct>=70?'var(--green)':s.pct>=50?'var(--orange)':'var(--red)'};">
                           ${s.pct.toFixed(1)}% dari kayu</div>`
                    : ''}
            </div>
        </div>
        ${i < steps.length-1
            ? `<div style="color:var(--gold);font-size:18px;opacity:.5;
                           padding:0 4px;flex-shrink:0;align-self:center;">→</div>`
            : ''}
    `).join('');

    // Konversi ringkasan
    const convPct  = d.volKayu > 0 ? (d.totPlaner / d.volKayu * 100).toFixed(1) : '0.0';
    const sellPct  = d.totPlaner > 0 ? (d.volJual / d.totPlaner * 100).toFixed(1) : '0.0';

    cont.innerHTML = `
    <div class="section-head" style="margin-top:20px;">🔄 Aliran Efisiensi End-to-End</div>
    <div style="background:var(--bg2);border:1px solid var(--gold-dim);border-radius:12px;
                padding:18px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;
                    overflow-x:auto;">
            ${stepsHtml}
        </div>
        <div style="margin-top:16px;display:grid;
                    grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
            <div style="background:var(--bg3);border-radius:8px;padding:12px 14px;">
                <div style="font-size:10px;color:var(--muted);margin-bottom:4px;">
                    Konversi: Kayu → Planer Bagus</div>
                <div style="height:7px;background:var(--border);border-radius:4px;overflow:hidden;">
                    <div style="height:100%;width:${Math.min(100,parseFloat(convPct))}%;
                                background:var(--gold);border-radius:4px;"></div>
                </div>
                <div style="font-size:11px;color:var(--gold);margin-top:4px;
                            font-family:var(--font-mono);">${convPct}%</div>
            </div>
            <div style="background:var(--bg3);border-radius:8px;padding:12px 14px;">
                <div style="font-size:10px;color:var(--muted);margin-bottom:4px;">
                    Penjualan: Planer Bagus → Terjual</div>
                <div style="height:7px;background:var(--border);border-radius:4px;overflow:hidden;">
                    <div style="height:100%;width:${Math.min(100,parseFloat(sellPct))}%;
                                background:var(--green);border-radius:4px;"></div>
                </div>
                <div style="font-size:11px;color:var(--green);margin-top:4px;
                            font-family:var(--font-mono);">${sellPct}%</div>
            </div>
            <div style="background:var(--bg3);border-radius:8px;padding:12px 14px;">
                <div style="font-size:10px;color:var(--muted);margin-bottom:4px;">
                    Efisiensi Ripsaw</div>
                <div style="height:7px;background:var(--border);border-radius:4px;overflow:hidden;">
                    <div style="height:100%;width:${Math.min(100,d.efRipsaw).toFixed(1)}%;
                                background:${d.efRipsaw>=80?'var(--green)':d.efRipsaw>=60?'var(--orange)':'var(--red)'};
                                border-radius:4px;"></div>
                </div>
                <div style="font-size:11px;margin-top:4px;font-family:var(--font-mono);
                            color:${d.efRipsaw>=80?'var(--green)':d.efRipsaw>=60?'var(--orange)':'var(--red)'};">
                    ${d.efRipsaw.toFixed(1)}%</div>
            </div>
        </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// 3. CHARTS REKAP
// ═══════════════════════════════════════════════════════════
function renderRekapCharts(bulan) {
    const cont = document.getElementById('rekap-charts-container');
    if (!cont) return;

    // Bangun data harian
    const [y, m] = bulan.split('-').map(Number);
    const hariDlmBulan = new Date(y, m, 0).getDate();
    const hariLabels   = Array.from({length: hariDlmBulan}, (_, i) =>
        String(i+1).padStart(2,'0'));

    function daySum(list, dateField, valFn) {
        return hariLabels.map(d => {
            const tgl = `${bulan}-${d}`;
            return list.filter(x => x[dateField] === tgl).reduce((a,x)=>a+valFn(x),0)||null;
        });
    }

    const kayuHari   = daySum(window.kayuList||[],    'tanggal', k=>k.volume||0);
    const sawHari    = daySum(window.sawmillList||[],  'tanggal', s=>s.prosesSawmill||0);
    const jualHari   = daySum(window.penjualanList||[],'tanggal', j=>j.volume||0);

    let prodByDate = {};
    (window.produksiList||[]).forEach(p => {
        if (!p.tanggal?.startsWith(bulan)) return;
        if (!prodByDate[p.tanggal]) prodByDate[p.tanggal] = {planer:0,press:0};
        const s1=p.shift1||{},s2=p.shift2||{};
        prodByDate[p.tanggal].planer += (s1.planerBagus||0)+(s2.planerBagus||0);
        prodByDate[p.tanggal].press  += (s1.press||0)      +(s2.press||0);
    });
    const planerHari = hariLabels.map(d=>prodByDate[`${bulan}-${d}`]?.planer||null);
    const pressHari  = hariLabels.map(d=>prodByDate[`${bulan}-${d}`]?.press ||null);

    cont.innerHTML = `
    <div class="section-head" style="margin-top:20px;">📈 Aktivitas Harian — ${formatBln(bulan)}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:4px;">
        <div class="chart-wrap">
            <div class="chart-title">🪵 Kayu Masuk vs Sawmill (m³)</div>
            <canvas id="chart-rekap-kayu" height="160"></canvas>
        </div>
        <div class="chart-wrap">
            <div class="chart-title">📦 Planer Bagus & Press Harian</div>
            <canvas id="chart-rekap-prod" height="160"></canvas>
        </div>
    </div>
    <div class="chart-wrap" style="margin-top:14px;">
        <div class="chart-title">💰 Volume Penjualan Harian (m³)</div>
        <canvas id="chart-rekap-jual" height="130"></canvas>
    </div>`;

    setTimeout(() => {
        if (!window.Chart) return;

        // Chart 1: Kayu vs Sawmill
        const c1 = document.getElementById('chart-rekap-kayu');
        if (c1) {
            if (c1._chartInst) c1._chartInst.destroy();
            c1._chartInst = new Chart(c1, {
                type: 'bar',
                data: {
                    labels: hariLabels,
                    datasets: [
                        { label:'Kayu Masuk',  data:kayuHari,  backgroundColor:'rgba(251,146,60,.5)',
                          borderColor:'var(--orange)', borderWidth:1, borderRadius:3, spanGaps:true },
                        { label:'Sawmill',     data:sawHari,   backgroundColor:'rgba(212,160,23,.5)',
                          borderColor:'var(--gold)',   borderWidth:1, borderRadius:3, spanGaps:true }
                    ]
                },
                options: chartOpts('m³')
            });
        }

        // Chart 2: Planer + Press
        const c2 = document.getElementById('chart-rekap-prod');
        if (c2) {
            if (c2._chartInst) c2._chartInst.destroy();
            c2._chartInst = new Chart(c2, {
                data: {
                    labels: hariLabels,
                    datasets: [
                        { type:'bar',  label:'Planer (m³)', data:planerHari,
                          backgroundColor:'rgba(212,160,23,.45)', borderColor:'var(--gold)',
                          borderWidth:1, borderRadius:3, yAxisID:'y', spanGaps:true },
                        { type:'line', label:'Press (lbr)', data:pressHari,
                          borderColor:'var(--blue)', backgroundColor:'rgba(96,165,250,.08)',
                          borderWidth:2, pointRadius:2, fill:true, tension:.3,
                          yAxisID:'y1', spanGaps:true }
                    ]
                },
                options: chartOptsDual('m³','lbr')
            });
        }

        // Chart 3: Penjualan
        const c3 = document.getElementById('chart-rekap-jual');
        if (c3) {
            if (c3._chartInst) c3._chartInst.destroy();
            c3._chartInst = new Chart(c3, {
                type: 'bar',
                data: {
                    labels: hariLabels,
                    datasets: [{ label:'Volume Jual (m³)', data:jualHari,
                        backgroundColor:'rgba(74,222,128,.45)', borderColor:'var(--green)',
                        borderWidth:1, borderRadius:3, spanGaps:true }]
                },
                options: chartOpts('m³')
            });
        }
    }, 100);
}

function chartOpts(unit) {
    return {
        responsive: true,
        interaction: { mode:'index', intersect:false },
        plugins: { legend:{ labels:{ color:'#8a8578', font:{size:9}, boxWidth:12 } } },
        scales: {
            x:  { ticks:{ color:'#555', font:{size:9} }, grid:{ color:'rgba(255,255,255,.03)' } },
            y:  { ticks:{ color:'#8a8578', font:{size:9} }, grid:{ color:'rgba(255,255,255,.05)' },
                  title:{ display:true, text:unit, color:'#8a8578', font:{size:9} } }
        }
    };
}

function chartOptsDual(u1, u2) {
    return {
        responsive: true,
        interaction: { mode:'index', intersect:false },
        plugins: { legend:{ labels:{ color:'#8a8578', font:{size:9}, boxWidth:12 } } },
        scales: {
            x:  { ticks:{ color:'#555', font:{size:9} }, grid:{ color:'rgba(255,255,255,.03)' } },
            y:  { position:'left',  ticks:{ color:'#d4a017', font:{size:9} },
                  grid:{ color:'rgba(255,255,255,.04)' },
                  title:{ display:true, text:u1, color:'#8a8578', font:{size:9} } },
            y1: { position:'right', ticks:{ color:'#60a5fa', font:{size:9} },
                  grid:{ drawOnChartArea:false },
                  title:{ display:true, text:u2, color:'#8a8578', font:{size:9} } }
        }
    };
}

// ═══════════════════════════════════════════════════════════
// 4. REKAP PER MODUL (tabel detail)
// ═══════════════════════════════════════════════════════════
function renderRekapPerModul(bulan) {
    const cont = document.getElementById('rekap-modul-container');
    if (!cont) return;
    const d    = getRekapData(bulan);

    const kayu2 = [...d.kayu].sort((a,b) => b.tanggal?.localeCompare(a.tanggal)).slice(0,8);
    const saw2  = [...d.sawmill].sort((a,b) => b.tanggal?.localeCompare(a.tanggal)).slice(0,8);
    const penj2 = [...d.penj].sort((a,b) => b.tanggal?.localeCompare(a.tanggal)).slice(0,8);

    const tblKayu = `
    <div class="section-head" style="margin-top:24px;">🪵 Pembelian Kayu — ${formatBln(bulan)}</div>
    <div class="table-wrap" style="margin-bottom:20px;">
        <table><thead><tr>
            <th>Tanggal</th><th>Open No.</th><th>Supplier</th>
            <th>Volume (m³)</th><th>Harga (Rp)</th>
        </tr></thead><tbody>
        ${kayu2.map(k=>`<tr>
            <td>${fmtDate(k.tanggal)}</td>
            <td class="highlight">${k.openNo||'—'}</td>
            <td class="highlight">${k.suplier||'—'}</td>
            <td class="right">${fmtDec(k.volume||0,2)}</td>
            <td class="right">${fmtRp(k.harga||0)}</td>
        </tr>`).join('')}
        ${!kayu2.length ? '<tr><td colspan="5" class="empty">Belum ada数据</td></tr>':'' }
        </tbody></table>
    </div>`;

    const tblSaw = `
    <div class="section-head">🪚 Produksi Sawmill — ${formatBln(bulan)}</div>
    <div class="table-wrap" style="margin-bottom:20px;">
        <table><thead><tr>
            <th>Tanggal</th><th>Open No.</th>
            <th>Vol.Masuk</th><th>Palet Bagus</th><th>Rendemen</th>
        </tr></thead><tbody>
        ${saw2.map(s=>{
            const r=s.prosesSawmill>0?(s.totalVolumePalet/s.prosesSawmill*100).toFixed(1):'0.0';
            const rc=r>=65?'var(--green)':r>=55?'var(--orange)':'var(--red)';
            return `<tr>
                <td>${fmtDate(s.tanggal)}</td>
                <td class="highlight">${s.openNo||'—'}</td>
                <td class="right">${fmtDec(s.prosesSawmill||0,2)} m³</td>
                <td class="right">${fmtDec(s.totalVolumePalet||0,2)} m³</td>
                <td class="right" style="color:${rc}">${r}%</td>
            </tr>`;
        }).join('')}
        ${!saw2.length ? '<tr><td colspan="5" class="empty">Belum ada数据</td></tr>':''}
        </tbody></table>
    </div>`;

    const tblPenj = `
    <div class="section-head">💰 Penjualan — ${formatBln(bulan)}</div>
    <div class="table-wrap" style="margin-bottom:20px;">
        <table><thead><tr>
            <th>Tanggal</th><th>Pembeli</th><th>Produk</th>
            <th>Volume (m³)</th><th>Harga (Rp)</th>
        </tr></thead><tbody>
        ${penj2.map(j=>`<tr>
            <td>${fmtDate(j.tanggal)}</td>
            <td class="highlight">${j.namaPembeli||j.namaCustomer||'—'}</td>
            <td>${j.produk||j.jenis||'—'}</td>
            <td class="right">${fmtDec(j.volume||0,2)}</td>
            <td class="right">${fmtRp(j.harga||0)}</td>
        </tr>`).join('')}
        ${!penj2.length ? '<tr><td colspan="5" class="empty">Belum ada数据</td></tr>':''}
        </tbody></table>
    </div>`;

    cont.innerHTML = tblKayu + tblSaw + tblPenj;
}

// ═══════════════════════════════════════════════════════════
// 5. PERBANDINGAN BULANAN (6 bulan terakhir)
// ═══════════════════════════════════════════════════════════
function renderRekapPerbandingan(bulan) {
    const cont = document.getElementById('rekap-compare-container');
    if (!cont) return;

    // Ambil 6 bulan terakhir
    const months = [];
    const [y, m] = bulan.split('-').map(Number);
    for (let i = 5; i >= 0; i--) {
        let mo = m - i;
        let yr = y;
        while (mo <= 0) { mo += 12; yr--; }
        months.push(`${yr}-${String(mo).padStart(2,'0')}`);
    }

    const rows = months.map(bln => {
        const d = getRekapData(bln);
        const rendCol = d.rendemen >= 65 ? 'var(--green)' : d.rendemen >= 55 ? 'var(--orange)' : 'var(--red)';
        const efCol   = d.efRipsaw >= 80 ? 'var(--green)' : d.efRipsaw >= 60 ? 'var(--orange)' : 'var(--red)';
        const active  = bln === bulan;
        return `<tr style="${active ? 'background:var(--gold-dim);font-weight:700;' : ''}">
            <td class="${active ? 'highlight' : ''}">${formatBln(bln)}</td>
            <td class="right">${fmtDec(d.volKayu,2)}</td>
            <td class="right">${fmtDec(d.volSawIn,2)}</td>
            <td class="right" style="color:${rendCol}">${d.rendemen.toFixed(1)}%</td>
            <td class="right">${fmtDec(d.totPlaner,2)}</td>
            <td class="right">${fmt(d.totPress)}</td>
            <td class="right" style="color:${efCol}">${d.efRipsaw.toFixed(1)}%</td>
            <td class="right">${fmtDec(d.volJual,2)}</td>
            <td class="right">${fmtRp(d.nilaiJual)}</td>
        </tr>`;
    });

    // Chart perbandingan bulanan
    const chartHtml = `
    <div class="chart-wrap" style="margin-bottom:16px;">
        <div class="chart-title">📊 Tren 6 Bulan — Volume & Rendemen</div>
        <canvas id="chart-rekap-compare" height="160"></canvas>
    </div>`;

    cont.innerHTML = `
    <div class="section-head" style="margin-top:24px;">📅 Perbandingan 6 Bulan Terakhir</div>
    ${chartHtml}
    <div class="table-wrap">
        <table style="font-size:11px;">
            <thead><tr>
                <th>Bulan</th>
                <th>Kayu (m³)</th><th>Sawmill (m³)</th>
                <th>Rendemen</th>
                <th>Planer (m³)</th><th>Press (lbr)</th>
                <th>Ef.Ripsaw</th>
                <th>Vol.Jual (m³)</th><th>Nilai Jual</th>
            </tr></thead>
            <tbody>${rows.join('')}</tbody>
        </table>
    </div>`;

    setTimeout(() => {
        const ctx = document.getElementById('chart-rekap-compare');
        if (!ctx || !window.Chart) return;
        if (ctx._chartInst) ctx._chartInst.destroy();

        const labels    = months.map(formatBln);
        const volData   = months.map(b => parseFloat(getRekapData(b).volSawIn.toFixed(2)));
        const rendData  = months.map(b => parseFloat(getRekapData(b).rendemen.toFixed(1)));
        const pressData = months.map(b => getRekapData(b).totPress);

        ctx._chartInst = new Chart(ctx, {
            data: {
                labels,
                datasets: [
                    { type:'bar',  label:'Vol. Sawmill (m³)', data:volData,
                      backgroundColor:'rgba(212,160,23,.5)', borderColor:'var(--gold)',
                      borderWidth:1, borderRadius:4, yAxisID:'y' },
                    { type:'bar',  label:'Press (lbr)', data:pressData,
                      backgroundColor:'rgba(96,165,250,.35)', borderColor:'var(--blue)',
                      borderWidth:1, borderRadius:4, yAxisID:'y1' },
                    { type:'line', label:'Rendemen (%)', data:rendData,
                      borderColor:'var(--green)', backgroundColor:'rgba(74,222,128,.08)',
                      borderWidth:2.5, pointRadius:4, fill:false, tension:.3, yAxisID:'y2' }
                ]
            },
            options: {
                responsive:true,
                interaction:{ mode:'index', intersect:false },
                plugins:{
                    legend:{ labels:{ color:'#8a8578', font:{size:9}, boxWidth:12 } }
                },
                scales: {
                    x:   { ticks:{color:'#666', font:{size:9}}, grid:{color:'rgba(255,255,255,.03)'} },
                    y:   { position:'left',   ticks:{color:'#d4a017',font:{size:9}},
                           grid:{color:'rgba(255,255,255,.04)'},
                           title:{display:true,text:'m³',color:'#8a8578',font:{size:9}} },
                    y1:  { position:'right',  ticks:{color:'#60a5fa',font:{size:9}},
                           grid:{drawOnChartArea:false},
                           title:{display:true,text:'lbr',color:'#8a8578',font:{size:9}} },
                    y2:  { position:'right',  ticks:{color:'#4ade80',font:{size:9}}, min:0, max:100,
                           grid:{drawOnChartArea:false},
                           title:{display:true,text:'%',color:'#8a8578',font:{size:9}} }
                }
            }
        });
    }, 150);
}

// ═══════════════════════════════════════════════════════════
// 6. EXPORT EXCEL-LIKE CSV REKAP
// ═══════════════════════════════════════════════════════════
window.exportRekapCSV = function () {
    const bulan = document.getElementById('rekap-bulan')?.value || thisMonth();
    const d     = getRekapData(bulan);

    const sections = [
        ['=== REKAP BULANAN - ' + formatBln(bulan).toUpperCase() + ' ==='],
        [],
        ['KPI UTAMA'],
        ['Kayu Masuk (m³)', fmtDec(d.volKayu,2)],
        ['Volume Sawmill (m³)', fmtDec(d.volSawIn,2)],
        ['Rendemen Sawmill (%)', d.rendemen.toFixed(1)],
        ['Planer Bagus (m³)', fmtDec(d.totPlaner,2)],
        ['Total Press (lbr)', fmt(d.totPress)],
        ['Efisiensi Ripsaw (%)', d.efRipsaw.toFixed(1)],
        ['Volume Jual (m³)', fmtDec(d.volJual,2)],
        ['Nilai Jual (Rp)', fmtRp(d.nilaiJual)],
        ['Kehadiran (%)', d.kehadiran.toFixed(1)],
        [],
        ['DETAIL SAWMILL'],
        ['Tanggal','Open No.','Vol.Masuk','Palet Bagus','Rendemen'],
        ...d.sawmill.map(s => [
            s.tanggal, s.openNo||'',
            fmtDec(s.prosesSawmill||0,2), fmtDec(s.totalVolumePalet||0,2),
            s.prosesSawmill>0?(s.totalVolumePalet/s.prosesSawmill*100).toFixed(1):0
        ]),
        [],
        ['DETAIL PENJUALAN'],
        ['Tanggal','Pembeli','Produk','Volume (m³)','Harga (Rp)'],
        ...d.penj.map(j => [
            j.tanggal, j.namaPembeli||j.namaCustomer||'',
            j.produk||'', fmtDec(j.volume||0,2), j.harga||0
        ])
    ];

    const csv = sections.map(r => Array.isArray(r) ? r.join(',') : r).join('\n');
    const a   = document.createElement('a');
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download= `rekap_${bulan}.csv`;
    a.click();
    toast('📥 Rekap CSV berhasil diunduh');
};

// ═══════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════
function formatBln(ym) {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const names  = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return (names[parseInt(m)-1] || m) + ' ' + y;
}

function fmtRp(n) {
    if (!n) return '0';
    if (n >= 1e9)  return (n/1e9).toFixed(1)  + ' M';
    if (n >= 1e6)  return (n/1e6).toFixed(1)  + ' jt';
    if (n >= 1e3)  return (n/1e3).toFixed(0)  + ' rb';
    return String(n);
}

// ═══════════════════════════════════════════════════════════
// INJECT CONTAINER KE DOM
// ═══════════════════════════════════════════════════════════
function initRekapContainers() {
    const tab = document.getElementById('tab-rekap');
    if (!tab) return;

    // Pastikan semua container tersedia
    const needed = [
        'rekap-kpi-container',
        'rekap-e2e-container',
        'rekap-charts-container',
        'rekap-modul-container',
        'rekap-compare-container'
    ];

    needed.forEach(id => {
        if (!document.getElementById(id)) {
            const el = document.createElement('div');
            el.id    = id;
            tab.appendChild(el);
        }
    });

    // Pastikan tombol Export ada
    const head = tab.querySelector('.panel-head');
    if (head && !head.querySelector('.btn-export-rekap')) {
        const btn       = document.createElement('button');
        btn.className   = 'btn btn-sm btn-export-rekap';
        btn.style.cssText = 'background:rgba(96,165,250,.12);color:var(--blue);border-color:rgba(96,165,250,.3);';
        btn.innerHTML   = '📥 Export CSV';
        btn.onclick     = window.exportRekapCSV;
        head.appendChild(btn);
    }
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
setTimeout(() => {
    initRekapContainers();
    renderRekap();
}, 800);