// lmkb.js — Laporan Mutasi Kayu Bundar (LMKB)
// Menampilkan mutasi volume kayu: Masuk (Pembelian) → Proses Sawmill → Saldo
// Dilengkapi: breakdown per supplier, per jenis, per grade, tren bulanan

// ─── CSS ───────────────────────────────────────────────
function injectLMKBStyles() {
    if (document.getElementById('lmkb-styles')) return;
    const s = document.createElement('style');
    s.id = 'lmkb-styles';
    s.textContent = `
        .lmkb-month-sel {
            display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
            padding: 12px 14px; background: var(--bg2); border: 1px solid var(--border);
            border-radius: 10px; margin-bottom: 16px;
        }
        .lmkb-month-sel select, .lmkb-month-sel input {
            background: var(--input-bg); border: 1px solid var(--input-border);
            color: var(--input-color); padding: 7px 11px; border-radius: 7px;
            font-size: 12px; font-family: var(--font-mono);
        }
        .lmkb-section-title {
            display: flex; align-items: center; gap: 8px; margin: 20px 0 10px;
            font-size: 12px; font-weight: 700; color: var(--text);
            text-transform: uppercase; letter-spacing: .07em;
        }
        .lmkb-section-title .accent-bar {
            width: 3px; height: 16px; border-radius: 2px; background: var(--gold);
        }
        .lmkb-tbl-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid var(--border); margin-bottom: 18px; }
        .lmkb-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .lmkb-tbl thead { background: var(--bg3); border-bottom: 2px solid var(--gold-dim); }
        .lmkb-tbl th { padding: 10px 12px; font-size: 10px; text-transform: uppercase;
            letter-spacing: .06em; color: var(--muted); font-weight: 600; white-space: nowrap; }
        .lmkb-tbl th.r { text-align: right; }
        .lmkb-tbl td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .lmkb-tbl td.r { text-align: right; font-family: var(--font-mono); }
        .lmkb-tbl tbody tr:hover { background: var(--gold-dim); }
        .lmkb-tbl tbody tr:last-child td { border-bottom: none; }
        .lmkb-tbl .total-row td { background: var(--bg3); font-weight: 700; color: var(--gold); }
        .lmkb-badge {
            display: inline-block; padding: 2px 8px; border-radius: 20px;
            font-size: 9px; font-weight: 700;
        }
        .lmkb-saldo-pos { color: var(--green); }
        .lmkb-saldo-neg { color: var(--red); }
        .lmkb-progress-bar { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; margin-top: 4px; }
        .lmkb-progress-fill { height: 100%; border-radius: 3px; transition: width .4s; }
        .lmkb-empty { text-align: center; padding: 48px 20px; color: var(--muted); }
        .lmkb-header-card {
            background: linear-gradient(135deg, rgba(212,160,23,.1), rgba(0,0,0,.2));
            border: 1px solid rgba(212,160,23,.3); border-radius: 12px;
            padding: 18px 20px; margin-bottom: 18px;
        }
        .lmkb-kpi-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr));
            gap: 12px; margin-bottom: 18px;
        }
        .lmkb-kpi {
            background: var(--bg2); border: 1px solid var(--border); border-radius: 10px;
            padding: 12px 14px;
        }
        .lmkb-kpi-label { font-size: 10px; color: var(--muted); font-weight: 600;
            text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
        .lmkb-kpi-val { font-size: 20px; font-weight: 800; font-family: var(--font-mono); line-height: 1.1; }
        .lmkb-kpi-sub { font-size: 10px; color: var(--muted); margin-top: 4px; }
    `;
    document.head.appendChild(s);
}

// ─── Helper ────────────────────────────────────────────
function lmkbEsc(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function lmkbFmtRp(n) {
    if (!n) return '—';
    if (n >= 1e9) return 'Rp ' + (n/1e9).toFixed(1) + ' M';
    if (n >= 1e6) return 'Rp ' + (n/1e6).toFixed(1) + ' jt';
    if (n >= 1e3) return 'Rp ' + (n/1e3).toFixed(0) + ' rb';
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}
function lmkbFmt3(n) { return (n||0).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function lmkbFmt2(n) { return (n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function lmkbKPI(label, val, color, sub) {
    return `<div class="lmkb-kpi">
        <div class="lmkb-kpi-label">${label}</div>
        <div class="lmkb-kpi-val" style="color:${color};">${val}</div>
        ${sub ? `<div class="lmkb-kpi-sub">${sub}</div>` : ''}
    </div>`;
}

// ─── Bulan options ─────────────────────────────────────
function lmkbMonthOpts(selected) {
    const now = new Date();
    let opts = '';
    for (let i = 0; i <= 23; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const names = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
        const label = names[d.getMonth()] + ' ' + d.getFullYear();
        opts += `<option value="${m}"${m===selected?' selected':''}>${label}</option>`;
    }
    return opts;
}

// ─── RENDER UTAMA ──────────────────────────────────────
window.renderLMKB = function(bulan) {
    injectLMKBStyles();
    const cont = document.getElementById('lmkb-container');
    if (!cont) return;

    const now  = new Date();
    const cur  = bulan || localStorage.getItem('lmkb_bulan') ||
                 `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const [y,m] = cur.split('-').map(Number);
    const prvD  = new Date(y, m-2, 1);
    const prv   = `${prvD.getFullYear()}-${String(prvD.getMonth()+1).padStart(2,'0')}`;

    const kayuAll     = window.kayuList     || [];
    const sawmillAll  = window.sawmillList  || [];

    // Data bulan ini dan bulan lalu
    const kayuBln  = kayuAll.filter(k => k.tanggal?.startsWith(cur));
    const kayuPrv  = kayuAll.filter(k => k.tanggal?.startsWith(prv));
    const sawBln   = sawmillAll.filter(s => s.tanggal?.startsWith(cur));

    // KPI
    const volMasuk   = kayuBln.reduce((a,k) => a+(k.volume||0), 0);
    const hrMasuk    = kayuBln.reduce((a,k) => a+(k.harga||0), 0);
    const batangMsk  = kayuBln.reduce((a,k) => a+(k.jumlahBatang||0), 0);
    const volSawmill = sawBln.reduce((a,s) => a+(s.prosesSawmill||0), 0);
    const volPrv     = kayuPrv.reduce((a,k) => a+(k.volume||0), 0);
    const saldo      = volMasuk - volSawmill;
    const avgHargaM3 = volMasuk > 0 ? hrMasuk/volMasuk : 0;

    // Filter UI
    const filterBar = `
    <div class="lmkb-month-sel">
        <label style="font-size:12px;color:var(--muted);font-weight:600;">📅 Periode:</label>
        <select id="lmkb-bulan-sel" onchange="window.renderLMKB(this.value)">
            ${lmkbMonthOpts(cur)}
        </select>
        <button class="btn btn-secondary btn-sm" onclick="window.exportLMKBCSV('${cur}')">📥 Export CSV</button>
        <button class="btn btn-print btn-sm" onclick="window.printSection('tab-lmkb')">🖨️ Cetak</button>
    </div>`;

    if (!kayuBln.length && !sawBln.length) {
        cont.innerHTML = filterBar + `
        <div class="lmkb-empty">
            <div style="font-size:40px;margin-bottom:12px;opacity:.3;">📋</div>
            <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:6px;">Tidak ada data untuk ${cur}</div>
            <div style="font-size:11px;">Input data pembelian kayu dan laporan sawmill terlebih dahulu</div>
        </div>`;
        return;
    }

    // ── Header card identitas laporan ──
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const headerCard = `
    <div class="lmkb-header-card">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;">Laporan Resmi</div>
        <div style="font-size:18px;font-weight:800;color:var(--gold);margin-bottom:2px;">
            LAPORAN MUTASI KAYU BUNDAR
        </div>
        <div style="font-size:13px;color:var(--text);font-weight:600;">
            UD. Karya Muda Surya Utama — ${months[m-1]} ${y}
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:6px;">
            Jenis kayu: Albasia (Falcataria) &nbsp;|&nbsp; Satuan: m³ &nbsp;|&nbsp;
            Dicetak: ${new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}
        </div>
    </div>`;

    // ── KPI ──
    const trend = volPrv > 0 ? ((volMasuk-volPrv)/volPrv*100).toFixed(1) : null;
    const trendHtml = trend !== null
        ? `<span style="color:${parseFloat(trend)>=0?'var(--green)':'var(--red)'};font-size:9px;font-weight:700;">${parseFloat(trend)>=0?'▲':'▼'} ${Math.abs(trend)}% vs bln lalu</span>`
        : '';
    const kpiGrid = `
    <div class="lmkb-kpi-grid">
        ${lmkbKPI('📦 Volume Masuk', lmkbFmt3(volMasuk)+' m³', 'var(--gold)', batangMsk+' batang · '+trendHtml)}
        ${lmkbKPI('💰 Nilai Pembelian', lmkbFmtRp(hrMasuk), '#60a5fa', 'Avg: '+lmkbFmtRp(avgHargaM3)+'/m³')}
        ${lmkbKPI('🪚 Vol. Proses Sawmill', lmkbFmt3(volSawmill)+' m³', 'var(--orange)', sawBln.length+' laporan')}
        ${lmkbKPI('📊 Saldo Volume', lmkbFmt3(Math.abs(saldo))+' m³', saldo>=0?'var(--green)':'var(--red)', saldo>=0?'Surplus':'Defisit')}
        ${lmkbKPI('📋 Jumlah Transaksi', kayuBln.length+' nota', 'var(--muted)', kayuBln.filter(k=>k.grade==='bagus').length+' grade bagus')}
        ${lmkbKPI('📈 Rendemen Rata-rata', sawBln.length > 0 ? (sawBln.reduce((a,s)=>a+(s.randemanSawmill||0),0)/sawBln.length).toFixed(1)+'%' : '—', 'var(--green)', 'Rata-rata sawmill bulan ini')}
    </div>`;

    // ── Tabel Mutasi Utama ──
    const mutasiTable = `
    <div class="lmkb-section-title"><div class="accent-bar"></div>📊 Rekapitulasi Mutasi Volume</div>
    <div class="lmkb-tbl-wrap">
        <table class="lmkb-tbl">
            <thead><tr>
                <th>Uraian</th><th>Keterangan</th><th class="r">Volume (m³)</th>
                <th class="r">Nilai (Rp)</th><th class="r">Avg Rp/m³</th>
            </tr></thead>
            <tbody>
                <tr>
                    <td><strong style="color:var(--gold);">I. MASUK</strong></td>
                    <td><span style="color:var(--muted);font-size:11px;">Pembelian kayu albasia bulan ${months[m-1]} ${y}</span></td>
                    <td class="r"><strong style="color:var(--gold);">${lmkbFmt3(volMasuk)}</strong></td>
                    <td class="r">${lmkbFmtRp(hrMasuk)}</td>
                    <td class="r">${avgHargaM3>0?lmkbFmtRp(avgHargaM3):'—'}</td>
                </tr>
                <tr>
                    <td><strong style="color:var(--orange);">II. KELUAR</strong></td>
                    <td><span style="color:var(--muted);font-size:11px;">Proses sawmill (penggergajian)</span></td>
                    <td class="r"><strong style="color:var(--orange);">${lmkbFmt3(volSawmill)}</strong></td>
                    <td class="r">—</td>
                    <td class="r">—</td>
                </tr>
                <tr class="total-row">
                    <td colspan="2"><strong>SALDO AKHIR (I - II)</strong></td>
                    <td class="r" style="color:${saldo>=0?'var(--green)':'var(--red)'};">
                        <strong>${saldo>=0?'+':''}${lmkbFmt3(saldo)}</strong>
                    </td>
                    <td class="r">—</td>
                    <td class="r">—</td>
                </tr>
            </tbody>
        </table>
    </div>`;

    // ── Tabel per Supplier ──
    const supMap = {};
    kayuBln.forEach(k => {
        const s = k.suplier||'—';
        if (!supMap[s]) supMap[s] = {vol:0,hrg:0,btg:0,n:0,bagus:0};
        supMap[s].vol  += k.volume||0;
        supMap[s].hrg  += k.harga||0;
        supMap[s].btg  += k.jumlahBatang||0;
        supMap[s].n++;
        if (k.grade==='bagus') supMap[s].bagus++;
    });
    const supArr = Object.entries(supMap).sort((a,b)=>b[1].vol-a[1].vol);

    const supTable = kayuBln.length ? `
    <div class="lmkb-section-title"><div class="accent-bar" style="background:var(--blue);"></div>🏭 Detail per Supplier</div>
    <div class="lmkb-tbl-wrap">
        <table class="lmkb-tbl">
            <thead><tr>
                <th>#</th><th>Supplier</th><th class="r">Nota</th><th class="r">Batang</th>
                <th class="r">Volume (m³)</th><th class="r">% Volume</th>
                <th class="r">Nilai (Rp)</th><th class="r">Avg Rp/m³</th><th class="r">Grade Bagus</th>
            </tr></thead>
            <tbody>
            ${supArr.map(([name,v],i) => {
                const pct = volMasuk>0?(v.vol/volMasuk*100):0;
                const avgM3 = v.vol>0?v.hrg/v.vol:0;
                const pctBagus = v.n>0?(v.bagus/v.n*100):0;
                return `<tr>
                    <td style="color:var(--muted);font-size:11px;">${i+1}</td>
                    <td><strong>${lmkbEsc(name)}</strong></td>
                    <td class="r">${v.n}</td>
                    <td class="r">${v.btg}</td>
                    <td class="r"><strong>${lmkbFmt3(v.vol)}</strong></td>
                    <td class="r">
                        <div>${pct.toFixed(1)}%</div>
                        <div class="lmkb-progress-bar"><div class="lmkb-progress-fill" style="width:${pct.toFixed(1)}%;background:var(--gold);"></div></div>
                    </td>
                    <td class="r">${lmkbFmtRp(v.hrg)}</td>
                    <td class="r">${avgM3>0?lmkbFmtRp(avgM3):'—'}</td>
                    <td class="r" style="color:${pctBagus>=80?'var(--green)':pctBagus>=60?'var(--orange)':'var(--red)'};">
                        ${pctBagus.toFixed(0)}%
                    </td>
                </tr>`;
            }).join('')}
            <tr class="total-row">
                <td colspan="2">TOTAL</td>
                <td class="r">${kayuBln.length}</td>
                <td class="r">${batangMsk}</td>
                <td class="r">${lmkbFmt3(volMasuk)}</td>
                <td class="r">100%</td>
                <td class="r">${lmkbFmtRp(hrMasuk)}</td>
                <td class="r">${avgHargaM3>0?lmkbFmtRp(avgHargaM3):'—'}</td>
                <td class="r">${volMasuk>0?(kayuBln.filter(k=>k.grade==='bagus').reduce((a,k)=>a+(k.volume||0),0)/volMasuk*100).toFixed(0):0}%</td>
            </tr>
            </tbody>
        </table>
    </div>` : '';

    // ── Riwayat Pembelian Detail (semua transaksi bulan ini) ──
    const riwayatRows = [...kayuBln].sort((a,b)=>(a.tanggal||'').localeCompare(b.tanggal||'')).map((k,i)=>{
        const hm3 = k.volume>0?(k.harga/k.volume):0;
        return `<tr>
            <td style="color:var(--muted);font-size:11px;">${i+1}</td>
            <td style="font-size:11px;">${(typeof fmtDate==='function')?fmtDate(k.tanggal):k.tanggal}</td>
            <td><span style="font-family:var(--font-mono);color:var(--gold);font-weight:700;">${lmkbEsc(k.noNota)}</span></td>
            <td>${lmkbEsc(k.suplier||'—')}</td>
            <td>${lmkbEsc(k.asal||'—')}</td>
            <td><span class="lmkb-badge" style="background:${k.jenis==='papan'?'rgba(167,139,250,.15)':'rgba(56,189,248,.15)'};color:${k.jenis==='papan'?'#a78bfa':'#38bdf8'};">${k.jenis==='papan'?'Papan':'Glondong'}</span></td>
            <td><span class="lmkb-badge" style="background:${k.grade==='bagus'?'rgba(22,163,74,.15)':'rgba(248,113,113,.15)'};color:${k.grade==='bagus'?'var(--green)':'#f87171'};">${k.grade==='bagus'?'✅ Bagus':'⚠️ Jelek'}</span></td>
            <td class="r">${k.jumlahBatang||0}</td>
            <td class="r"><strong>${lmkbFmt3(k.volume)}</strong></td>
            <td class="r">${lmkbFmtRp(k.harga)}</td>
            <td class="r" style="font-size:11px;color:var(--muted);">${hm3>0?lmkbFmtRp(hm3):'—'}</td>
        </tr>`;
    }).join('');

    const riwayatTable = kayuBln.length ? `
    <div class="lmkb-section-title"><div class="accent-bar" style="background:var(--green);"></div>📝 Rincian Pembelian Kayu — ${months[m-1]} ${y}</div>
    <div class="lmkb-tbl-wrap">
        <table class="lmkb-tbl">
            <thead><tr>
                <th>#</th><th>Tanggal</th><th>No. Nota</th><th>Supplier</th><th>Asal</th>
                <th>Jenis</th><th>Grade</th><th class="r">Batang</th>
                <th class="r">Volume (m³)</th><th class="r">Harga (Rp)</th><th class="r">Rp/m³</th>
            </tr></thead>
            <tbody>${riwayatRows}</tbody>
        </table>
    </div>` : '';

    // ── Laporan Sawmill bulan ini ──
    const sawmillRows = sawBln.map((s,i) => {
        return `<tr>
            <td style="color:var(--muted);font-size:11px;">${i+1}</td>
            <td style="font-size:11px;">${(typeof fmtDate==='function')?fmtDate(s.tanggal):s.tanggal}</td>
            <td><span style="font-family:var(--font-mono);color:var(--gold);font-weight:700;">${lmkbEsc(s.openNo||'—')}</span></td>
            <td class="r"><strong>${lmkbFmt3(s.prosesSawmill)}</strong></td>
            <td class="r">${lmkbFmt3(s.totalVolumePalet)}</td>
            <td class="r" style="color:${(s.randemanSawmill||0)>=55?'var(--green)':'var(--orange)'};">
                ${(s.randemanSawmill||0).toFixed(1)}%
            </td>
            <td class="r" style="font-size:11px;color:var(--muted);">${s.totalPalet||0}</td>
        </tr>`;
    }).join('');

    const sawmillTable = sawBln.length ? `
    <div class="lmkb-section-title"><div class="accent-bar" style="background:var(--orange);"></div>🪚 Laporan Proses Sawmill — ${months[m-1]} ${y}</div>
    <div class="lmkb-tbl-wrap">
        <table class="lmkb-tbl">
            <thead><tr>
                <th>#</th><th>Tanggal</th><th>Open No.</th>
                <th class="r">Vol. Proses (m³)</th><th class="r">Vol. Palet (m³)</th>
                <th class="r">Rendemen</th><th class="r">Total Palet</th>
            </tr></thead>
            <tbody>
                ${sawmillRows}
                <tr class="total-row">
                    <td colspan="3">TOTAL</td>
                    <td class="r">${lmkbFmt3(volSawmill)}</td>
                    <td class="r">${lmkbFmt3(sawBln.reduce((a,s)=>a+(s.totalVolumePalet||0),0))}</td>
                    <td class="r">${sawBln.length>0?(sawBln.reduce((a,s)=>a+(s.randemanSawmill||0),0)/sawBln.length).toFixed(1)+'%':'—'}</td>
                    <td class="r">${sawBln.reduce((a,s)=>a+(s.totalPalet||0),0)}</td>
                </tr>
            </tbody>
        </table>
    </div>` : '';

    cont.innerHTML = filterBar + headerCard + kpiGrid + mutasiTable + supTable + sawmillTable + riwayatTable;
    localStorage.setItem('lmkb_bulan', cur);
};

// ─── Export CSV ─────────────────────────────────────────
window.exportLMKBCSV = function(bulan) {
    const kayuBln = (window.kayuList||[]).filter(k => k.tanggal?.startsWith(bulan));
    if (!kayuBln.length) { if(window.toast) toast('⚠️ Tidak ada data'); return; }
    const headers = ['Tanggal','No.Nota','No.Truk','Supplier','Asal','Jenis','Grade','Batang','Volume(m³)','Harga(Rp)','Rp/m³'];
    const rows = [...kayuBln].sort((a,b)=>(a.tanggal||'').localeCompare(b.tanggal||'')).map(k => {
        const hm3 = k.volume>0?Math.round(k.harga/k.volume):0;
        return [k.tanggal,k.noNota||'',k.noTruk||'',k.suplier||'',k.asal||'',k.jenis||'',k.grade||'',k.jumlahBatang||0,(k.volume||0).toFixed(3),k.harga||0,hm3].join(',');
    });
    const csv = [headers.join(','),...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    a.download = `LMKB_${bulan}.csv`;
    a.click();
    if(window.toast) toast('📥 CSV LMKB berhasil diunduh');
};

// ─── Init ───────────────────────────────────────────────
setTimeout(() => {
    if (typeof window.renderLMKB === 'function') window.renderLMKB();
}, 800);
