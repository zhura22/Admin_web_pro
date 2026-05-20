// opname.js — Stock Opname Bulanan (Enhanced)
// Kontrol stok: Kayu Log | Palet Basah | Palet Kering | Board | Limbah
// Rekonsiliasi Sezing | Tren selisih | Skor akurasi

// ═══════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════
(function injectOpnameStyles() {
    if (document.getElementById('opname-styles')) return;
    const s = document.createElement('style');
    s.id = 'opname-styles';
    s.textContent = `
        .op-form-ref {
            font-size: 10px; color: var(--muted); margin-top: 3px;
        }
        .op-form-ref span { color: var(--gold); font-weight: 700; }

        .op-skor-wrap {
            display: flex; align-items: center; gap: 10px;
            background: var(--bg3); border: 1px solid var(--border);
            border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;
        }
        .op-skor-circle {
            width: 54px; height: 54px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 20px; font-weight: 800; flex-shrink: 0;
        }
        .op-skor-label { font-size: 10px; color: var(--muted); margin-top: 2px; }

        .op-card {
            background: var(--bg3);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 0;
            margin-bottom: 16px;
            overflow: hidden;
        }
        .op-card-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 14px 18px; border-bottom: 1px solid var(--border);
            flex-wrap: wrap; gap: 8px;
        }
        .op-card-title { font-size: 15px; font-weight: 700; }
        .op-card-body  { padding: 16px 18px; }

        .op-stok-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 10px; margin-bottom: 16px;
        }
        .op-stok-item {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 12px 14px;
        }
        .op-stok-label { font-size: 10px; color: var(--muted); text-transform: uppercase; margin-bottom: 6px; }
        .op-stok-vals  { display: flex; justify-content: space-between; align-items: flex-end; gap: 6px; }
        .op-stok-sys   { font-size: 11px; color: var(--muted); }
        .op-stok-fisik { font-size: 17px; font-weight: 800; font-family: var(--font-mono); }
        .op-stok-sel   { font-size: 11px; font-weight: 700; margin-top: 4px; }
        .op-stok-bar   { height: 3px; border-radius: 2px; margin-top: 6px; background: var(--border); overflow: hidden; }
        .op-stok-fill  { height: 100%; border-radius: 2px; }

        .op-sel-ok     { color: var(--green); }
        .op-sel-warn   { color: var(--orange); }
        .op-sel-danger { color: #f87171; }
        .op-sel-muted  { color: var(--muted); }

        .op-border-ok     { border-left: 3px solid var(--green) !important; }
        .op-border-warn   { border-left: 3px solid var(--orange) !important; }
        .op-border-danger { border-left: 3px solid #f87171 !important; }

        .op-badge {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700;
        }
        .op-badge-ok     { background: rgba(74,222,128,0.12); color: var(--green); border: 1px solid rgba(74,222,128,0.3); }
        .op-badge-warn   { background: rgba(255,159,67,0.12); color: var(--orange); border: 1px solid rgba(255,159,67,0.3); }
        .op-badge-danger { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }

        .op-rekon-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .op-rekon-tbl td { padding: 8px 10px; border-bottom: 1px solid var(--border); }
        .op-rekon-tbl td:last-child { text-align: right; font-family: var(--font-mono); font-weight: 600; }
        .op-rekon-tbl tr:last-child td { border-bottom: none; }
        .op-rekon-tbl .op-total-row td { font-weight: 800; padding-top: 10px; }

        .op-trend-wrap { display: flex; align-items: flex-end; gap: 3px; height: 36px; margin-top: 6px; }
        .op-trend-bar  {
            flex: 1; min-width: 8px; border-radius: 3px 3px 0 0;
            opacity: 0.8; cursor: pointer; position: relative;
        }
        .op-trend-bar:hover { opacity: 1; }

        .op-nav { display: flex; gap: 6px; align-items: center; }
        .op-nav button {
            background: var(--bg3); border: 1px solid var(--border);
            border-radius: 8px; color: var(--text); padding: 5px 12px;
            cursor: pointer; font-size: 13px;
        }
        .op-nav button:hover { border-color: var(--gold); color: var(--gold); }
        .op-nav .op-month-lbl { font-size: 14px; font-weight: 700; color: var(--gold); min-width: 100px; text-align: center; }

        @media (max-width: 600px) {
            .op-stok-grid { grid-template-columns: 1fr 1fr; }
        }
    `;
    document.head.appendChild(s);
})();

// ═══════════════════════════════════════════════════════
// KALKULASI STOK SISTEM per bulan
// ═══════════════════════════════════════════════════════
function hitungStokSistem(bulan) {
    // ── Kayu Log ──
    const kayuMasuk   = (window.kayuList || [])
        .filter(x => x.tanggal?.startsWith(bulan))
        .reduce((s, x) => s + (parseFloat(x.volume) || 0), 0);
    const prosesSaw   = (window.sawmillList || [])
        .filter(x => x.tanggal?.startsWith(bulan))
        .reduce((s, x) => s + (parseFloat(x.prosesSawmill) || 0), 0);
    const stokLog     = kayuMasuk - prosesSaw;

    // ── Palet Basah ──
    const paletBasah  = (window.sawmillList || [])
        .filter(x => x.tanggal?.startsWith(bulan))
        .reduce((s, x) => s + (x.totalVolumePalet ||
            (x.hasilPalet || []).reduce((a, p) => a + (p.volume || 0), 0)), 0);

    // Oven masuk — support ovenList (baru) & ovenHistoryList (lama)
    const ovenMasuk   = _ovenMasukBulan(bulan);
    const stokBasah   = paletBasah - ovenMasuk;

    // ── Palet Kering ──
    const ovenKeluar  = _ovenKeluarBulan(bulan);
    const produksiVol = (window.produksiList || [])
        .filter(p => p.tanggal?.startsWith(bulan))
        .reduce((s, p) => s + ((p.shift1?.planerBagus || 0) + (p.shift2?.planerBagus || 0)), 0);
    const stokKering  = ovenKeluar - produksiVol;

    // ── Board ──
    const totalSezing = (window.sezingList || [])
        .filter(s => s.tanggal?.startsWith(bulan))
        .reduce((s, x) => s + (x.volume || 0), 0);
    const penjualanNetto = (window.penjualanList || [])
        .filter(p => p.tanggal?.startsWith(bulan))
        .reduce((s, p) => s + ((p.volume || 0) - (p.retur || 0)), 0);
    const stokBoard   = totalSezing - penjualanNetto;

    // ── Limbah ──
    const totalLimbah = (window.produksiList || [])
        .filter(p => p.tanggal?.startsWith(bulan))
        .reduce((s, p) => s + (p.limbah || 0), 0);

    return { stokLog, stokBasah, stokKering, stokBoard, totalLimbah,
             kayuMasuk, prosesSaw, paletBasah, ovenMasuk, ovenKeluar,
             produksiVol, totalSezing, penjualanNetto };
}

// Helper: volume masuk oven bulan ini (support kedua format)
function _ovenMasukBulan(bulan) {
    // Format baru: ovenList dengan tglMulai
    const fromNew = (window.ovenList || [])
        .filter(o => o.tglMulai?.startsWith(bulan))
        .reduce((s, o) => s + (o.volume || 0), 0);
    // Format lama: ovenHistoryList
    const fromOld = (window.ovenHistoryList || [])
        .filter(h => h.tanggalMasuk?.startsWith(bulan))
        .reduce((s, h) => s + (h.volumeMasuk || 0), 0);
    return fromNew || fromOld;
}

function _ovenKeluarBulan(bulan) {
    // Format baru: ovenList selesai bulan ini
    const fromNew = (window.ovenList || [])
        .filter(o => o.status === 'selesai' && o.tglSelesai?.startsWith(bulan))
        .reduce((s, o) => s + (o.volume || 0), 0);
    // Format lama
    const fromOld = (window.ovenHistoryList || [])
        .filter(h => h.tanggalSelesai?.startsWith(bulan))
        .reduce((s, h) => s + (h.volumeKeluar || h.volumeMasuk || 0), 0);
    return fromNew || fromOld;
}

// ═══════════════════════════════════════════════════════
// SIMPAN OPNAME
// ═══════════════════════════════════════════════════════
window.saveOpname = function () {
    const bulan = document.getElementById('opname-bulan')?.value;
    if (!bulan) { toast('⚠️ Pilih bulan terlebih dahulu'); return; }

    const entry = {
        id:         uid(),
        bulan,
        log:        parseFloat(document.getElementById('opname-log')?.value)       || 0,
        basah:      parseFloat(document.getElementById('opname-basah')?.value)     || 0,
        kering:     parseFloat(document.getElementById('opname-kering')?.value)    || 0,
        board:      parseFloat(document.getElementById('opname-board')?.value)     || 0,
        limbah:     parseFloat(document.getElementById('opname-limbah')?.value)    || 0,
        awalBoard:  parseFloat(document.getElementById('opname-awal-board')?.value)|| 0,
        catatan:    document.getElementById('opname-catatan')?.value || ''
    };

    window.opnameList = [entry, ...(window.opnameList || []).filter(o => o.bulan !== bulan)];
    persistAll();
    renderOpname();
    toast('✅ Opname disimpan');
    logActivity('Simpan', 'Opname', `Bulan ${bulan}`);
};

// Auto-tampilkan nilai sistem di placeholder form saat bulan berubah
window.onOpnameBulanChange = function () {
    const bulan = document.getElementById('opname-bulan')?.value;
    if (!bulan) return;
    const sys = hitungStokSistem(bulan);

    const refs = {
        'opname-log-ref':    `Sistem: ${fmtDec(sys.stokLog, 2)} m³ (masuk ${fmtDec(sys.kayuMasuk,2)} − proses ${fmtDec(sys.prosesSaw,2)})`,
        'opname-basah-ref':  `Sistem: ${fmtDec(sys.stokBasah, 2)} m³ (palet ${fmtDec(sys.paletBasah,2)} − oven in ${fmtDec(sys.ovenMasuk,2)})`,
        'opname-kering-ref': `Sistem: ${fmtDec(sys.stokKering, 2)} m³ (oven out ${fmtDec(sys.ovenKeluar,2)} − produksi ${fmtDec(sys.produksiVol,2)})`,
        'opname-board-ref':  `Sistem: ${fmtDec(sys.stokBoard, 2)} m³ (sezing ${fmtDec(sys.totalSezing,2)} − jual ${fmtDec(sys.penjualanNetto,2)})`,
        'opname-limbah-ref': `Sistem: ${fmtDec(sys.totalLimbah, 2)} m³`,
    };
    for (const [id, txt] of Object.entries(refs)) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = txt.replace('Sistem:', '<span>Sistem:</span>');
    }

    // Pre-fill form jika data bulan ini sudah ada
    const existing = (window.opnameList || []).find(o => o.bulan === bulan);
    if (existing) {
        ['log','basah','kering','board','limbah','awal-board'].forEach(key => {
            const el = document.getElementById(`opname-${key}`);
            const dataKey = key === 'awal-board' ? 'awalBoard' : key;
            if (el) el.value = existing[dataKey] || '';
        });
        const cat = document.getElementById('opname-catatan');
        if (cat) cat.value = existing.catatan || '';
    }
};

// ═══════════════════════════════════════════════════════
// RENDER UTAMA
// ═══════════════════════════════════════════════════════
window.renderOpname = function () {
    renderOpnameSummary();
    renderOpnameList();
};

// ── SUMMARY: KPI bulan ini ──
function renderOpnameSummary() {
    const container = document.getElementById('opname-summary');
    if (!container) return;

    const bulan = document.getElementById('opname-bulan')?.value || thisMonth();
    const sys   = hitungStokSistem(bulan);
    const fisik = (window.opnameList || []).find(o => o.bulan === bulan);

    if (!fisik) {
        container.innerHTML = `<div style="background:var(--bg3);border:1px dashed var(--border);border-radius:10px;
            padding:16px;text-align:center;color:var(--muted);font-size:13px;margin-bottom:16px;">
            📋 Belum ada data opname untuk bulan ini. Isi form di atas lalu simpan.
        </div>`;
        return;
    }

    const items = [
        { label: 'Kayu Log',      sys: sys.stokLog,    fisik: fisik.log,    unit: 'm³' },
        { label: 'Palet Basah',   sys: sys.stokBasah,  fisik: fisik.basah,  unit: 'm³' },
        { label: 'Palet Kering',  sys: sys.stokKering, fisik: fisik.kering, unit: 'm³' },
        { label: 'Board',         sys: sys.stokBoard,  fisik: fisik.board,  unit: 'm³' },
        { label: 'Limbah',        sys: sys.totalLimbah,fisik: fisik.limbah, unit: 'm³' },
    ];

    // Hitung skor akurasi keseluruhan
    const skorList = items.map(it => {
        if (!it.sys || it.sys <= 0) return 100;
        const pct = Math.abs(it.sys - it.fisik) / it.sys * 100;
        return Math.max(0, 100 - pct);
    });
    const skorTotal = skorList.reduce((a, b) => a + b, 0) / skorList.length;
    const skorColor = skorTotal >= 90 ? 'var(--green)' : skorTotal >= 75 ? 'var(--orange)' : '#f87171';
    const skorLabel = skorTotal >= 90 ? '✅ Akurat' : skorTotal >= 75 ? '⚠️ Perlu Cek' : '🚨 Deviasi Tinggi';

    container.innerHTML = `
    <div class="op-skor-wrap" style="margin-bottom:14px;">
        <div class="op-skor-circle" style="background:${skorColor}22;color:${skorColor};border:2px solid ${skorColor};">
            ${skorTotal.toFixed(0)}%
        </div>
        <div>
            <div style="font-size:14px;font-weight:700;color:${skorColor};">${skorLabel}</div>
            <div class="op-skor-label">Skor Akurasi Opname — ${fmtDate(bulan + '-01')}</div>
            ${renderTrendSparkline(bulan)}
        </div>
    </div>
    <div class="op-stok-grid">
        ${items.map((it, i) => renderStokItem(it, skorList[i])).join('')}
    </div>`;
}

function renderStokItem(it, skor) {
    const selisih = it.sys - it.fisik;
    const pct     = it.sys > 0 ? Math.abs(selisih) / it.sys * 100 : 0;
    const cls     = pct <= 2 ? 'op-sel-ok' : pct <= 10 ? 'op-sel-warn' : 'op-sel-danger';
    const borderCls = pct <= 2 ? 'op-border-ok' : pct <= 10 ? 'op-border-warn' : 'op-border-danger';
    const fillColor = pct <= 2 ? 'var(--green)' : pct <= 10 ? 'var(--orange)' : '#f87171';
    const barWidth  = Math.min(pct * 3, 100); // scale: 33% selisih = full bar

    return `
    <div class="op-stok-item ${borderCls}">
        <div class="op-stok-label">${it.label}</div>
        <div class="op-stok-vals">
            <div>
                <div class="op-stok-fisik" style="color:${fillColor}">${fmtDec(it.fisik, 2)}</div>
                <div class="op-stok-sys">Sistem: ${fmtDec(it.sys, 2)} ${it.unit}</div>
            </div>
            <div style="text-align:right;">
                <div class="op-stok-sel ${cls}">${selisih >= 0 ? '+' : ''}${fmtDec(selisih, 2)}</div>
                <div style="font-size:10px;color:var(--muted);">${pct.toFixed(1)}%</div>
            </div>
        </div>
        <div class="op-stok-bar">
            <div class="op-stok-fill" style="width:${barWidth}%;background:${fillColor};"></div>
        </div>
    </div>`;
}

// Sparkline tren selisih opname 6 bulan terakhir
function renderTrendSparkline(bulanAktif) {
    const list = [...(window.opnameList || [])]
        .sort((a, b) => a.bulan.localeCompare(b.bulan))
        .slice(-6);
    if (list.length < 2) return '';

    const scores = list.map(o => {
        const sys = hitungStokSistem(o.bulan);
        const items = [
            [sys.stokLog,    o.log],
            [sys.stokBasah,  o.basah],
            [sys.stokKering, o.kering],
            [sys.stokBoard,  o.board],
        ];
        const avg = items.reduce((s, [sv, fv]) => {
            if (!sv || sv <= 0) return s + 100;
            return s + Math.max(0, 100 - Math.abs(sv - fv) / sv * 100);
        }, 0) / items.length;
        return { bulan: o.bulan, score: avg };
    });

    const max = Math.max(...scores.map(s => s.score), 1);
    const bars = scores.map(s => {
        const h   = Math.max(4, (s.score / max) * 100);
        const col = s.score >= 90 ? 'var(--green)' : s.score >= 75 ? 'var(--orange)' : '#f87171';
        const isActive = s.bulan === bulanAktif;
        return `<div class="op-trend-bar" title="${s.bulan}: ${s.score.toFixed(0)}%"
            style="height:${h}%;background:${col};${isActive ? 'opacity:1;outline:1px solid '+col+';' : 'opacity:0.5;'}"></div>`;
    }).join('');

    return `<div style="font-size:10px;color:var(--muted);margin-top:4px;">Tren 6 bulan:</div>
            <div class="op-trend-wrap">${bars}</div>`;
}

// ── LIST: semua opname tersimpan ──
function renderOpnameList() {
    const container = document.getElementById('opname-list');
    if (!container) return;

    const list = [...(window.opnameList || [])].sort((a, b) => b.bulan.localeCompare(a.bulan));

    if (!list.length) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = list.map(o => renderOpnameCard(o)).join('');
}

function renderOpnameCard(o) {
    const sys = hitungStokSistem(o.bulan);

    // ── Tabel stok ──
    const kategori = [
        { nama: '🪵 Kayu Log',     sys: sys.stokLog,     fisik: o.log,    detail: `Masuk ${fmtDec(sys.kayuMasuk,2)} − Proses ${fmtDec(sys.prosesSaw,2)}` },
        { nama: '💧 Palet Basah',  sys: sys.stokBasah,   fisik: o.basah,  detail: `Palet ${fmtDec(sys.paletBasah,2)} − Oven ${fmtDec(sys.ovenMasuk,2)}` },
        { nama: '🔥 Palet Kering', sys: sys.stokKering,  fisik: o.kering, detail: `Oven out ${fmtDec(sys.ovenKeluar,2)} − Produksi ${fmtDec(sys.produksiVol,2)}` },
        { nama: '📦 Board',        sys: sys.stokBoard,   fisik: o.board,  detail: `Sezing ${fmtDec(sys.totalSezing,2)} − Jual ${fmtDec(sys.penjualanNetto,2)}` },
        { nama: '🗑️ Limbah',       sys: sys.totalLimbah, fisik: o.limbah, detail: `Dari produksi` },
    ];

    const rows = kategori.map(k => {
        const sel    = k.fisik - k.sys;
        const pct    = k.sys > 0 ? Math.abs(sel) / k.sys * 100 : 0;
        const cls    = pct <= 2 ? 'op-sel-ok' : pct <= 10 ? 'op-sel-warn' : 'op-sel-danger';
        const badge  = pct <= 2
            ? `<span class="op-badge op-badge-ok">✓ OK</span>`
            : pct <= 10
                ? `<span class="op-badge op-badge-warn">⚠ Cek</span>`
                : `<span class="op-badge op-badge-danger">🚨 Deviasi</span>`;

        return `<tr>
            <td>
                <div style="font-weight:600;">${k.nama}</div>
                <div style="font-size:10px;color:var(--muted);">${k.detail}</div>
            </td>
            <td class="right" style="font-family:var(--font-mono);">${fmtDec(k.sys, 2)}</td>
            <td class="right" style="font-family:var(--font-mono);">${fmtDec(k.fisik, 2)}</td>
            <td class="right ${cls}" style="font-family:var(--font-mono);font-weight:700;">
                ${sel >= 0 ? '+' : ''}${fmtDec(sel, 2)}
            </td>
            <td class="right" style="color:var(--muted);">${k.sys > 0 ? pct.toFixed(1) + '%' : '—'}</td>
            <td>${badge}</td>
        </tr>`;
    }).join('');

    // ── Rekonsiliasi sezing ──
    const sezingAktual   = o.board - o.awalBoard + sys.penjualanNetto;
    const selisihSezing  = sezingAktual - sys.totalSezing;
    const selPct         = sys.totalSezing > 0 ? (Math.abs(selisihSezing) / sys.totalSezing * 100).toFixed(1) : '0.0';
    const rekonColor     = Math.abs(selisihSezing) <= 0.5 ? 'var(--green)' : Math.abs(selisihSezing) <= 2 ? 'var(--orange)' : '#f87171';
    const rekonBadge     = Math.abs(selisihSezing) <= 0.5
        ? `<span class="op-badge op-badge-ok">✓ Sesuai</span>`
        : Math.abs(selisihSezing) <= 2
            ? `<span class="op-badge op-badge-warn">⚠ Deviasi Kecil</span>`
            : `<span class="op-badge op-badge-danger">🚨 Tidak Sesuai</span>`;

    // ── Skor card ──
    const skorList = kategori.map(k => {
        if (!k.sys || k.sys <= 0) return 100;
        return Math.max(0, 100 - Math.abs(k.fisik - k.sys) / k.sys * 100);
    });
    const skor       = skorList.reduce((a, b) => a + b, 0) / skorList.length;
    const skorColor  = skor >= 90 ? 'var(--green)' : skor >= 75 ? 'var(--orange)' : '#f87171';
    const badgeCls   = skor >= 90 ? 'op-badge-ok' : skor >= 75 ? 'op-badge-warn' : 'op-badge-danger';
    const skorTxt    = skor >= 90 ? '✅ Akurat' : skor >= 75 ? '⚠️ Perlu Cek' : '🚨 Deviasi Tinggi';

    return `
    <div class="op-card" style="border-left:4px solid ${skorColor};">
        <div class="op-card-header">
            <div>
                <div class="op-card-title">📅 ${fmtDate(o.bulan + '-01')}</div>
                <div style="font-size:11px;color:var(--muted);margin-top:2px;">Stock Opname Bulanan</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <div style="font-size:22px;font-weight:800;color:${skorColor};font-family:var(--font-mono);">${skor.toFixed(0)}%</div>
                <span class="op-badge ${badgeCls}">${skorTxt}</span>
                <button class="btn btn-del btn-sm" onclick="hapusOpname('${o.id}')">🗑️</button>
            </div>
        </div>

        <div class="op-card-body">
            <!-- Tabel Stok -->
            <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;
                letter-spacing:.06em;margin-bottom:10px;">📊 Perbandingan Stok</div>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                    <thead>
                        <tr style="background:var(--bg);">
                            <th style="padding:8px 10px;text-align:left;color:var(--muted);font-size:10px;text-transform:uppercase;">Kategori</th>
                            <th style="padding:8px 10px;text-align:right;color:var(--muted);font-size:10px;text-transform:uppercase;">Sistem (m³)</th>
                            <th style="padding:8px 10px;text-align:right;color:var(--muted);font-size:10px;text-transform:uppercase;">Fisik (m³)</th>
                            <th style="padding:8px 10px;text-align:right;color:var(--muted);font-size:10px;text-transform:uppercase;">Selisih</th>
                            <th style="padding:8px 10px;text-align:right;color:var(--muted);font-size:10px;text-transform:uppercase;">%</th>
                            <th style="padding:8px 10px;text-align:left;color:var(--muted);font-size:10px;text-transform:uppercase;">Status</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>

            <!-- Rekonsiliasi Sezing -->
            <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;
                letter-spacing:.06em;margin:18px 0 10px;">📐 Rekonsiliasi Sezing</div>
            <div style="background:var(--bg);border-radius:10px;padding:4px 0;overflow-x:auto;">
                <table class="op-rekon-tbl">
                    <tbody>
                        <tr>
                            <td>Stok Awal Board (Opname sebelumnya)</td>
                            <td>${fmtDec(o.awalBoard, 4)}</td>
                        </tr>
                        <tr>
                            <td>+ Penjualan Netto bulan ini</td>
                            <td style="color:var(--orange);">+${fmtDec(sys.penjualanNetto, 4)}</td>
                        </tr>
                        <tr>
                            <td>− Stok Akhir Board (Opname ini)</td>
                            <td style="color:var(--red, #f87171);">−${fmtDec(o.board, 4)}</td>
                        </tr>
                        <tr class="op-total-row" style="border-top:1px solid var(--border);">
                            <td style="color:var(--gold);">= Sezing Aktual (hasil hitungan)</td>
                            <td style="color:var(--gold);">${fmtDec(sezingAktual, 4)}</td>
                        </tr>
                        <tr>
                            <td style="color:var(--muted);">Sezing Tercatat (laporan harian)</td>
                            <td style="color:var(--muted);">${fmtDec(sys.totalSezing, 4)}</td>
                        </tr>
                        <tr style="border-top:1px solid var(--border);">
                            <td style="font-weight:700;">
                                Selisih Rekonsiliasi &nbsp;${rekonBadge}
                            </td>
                            <td style="color:${rekonColor};font-weight:800;">
                                ${selisihSezing >= 0 ? '+' : ''}${fmtDec(selisihSezing, 4)}
                                <span style="font-size:10px;color:var(--muted);font-weight:400;">(${selPct}%)</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            ${o.catatan ? `
            <div style="margin-top:14px;padding:10px 14px;background:var(--bg);border-radius:8px;
                border-left:3px solid var(--muted);font-size:12px;color:var(--muted);">
                📝 ${o.catatan}
            </div>` : ''}
        </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════
// HAPUS OPNAME
// ═══════════════════════════════════════════════════════
window.hapusOpname = function (id) {
    if (!confirmDialog('Hapus data opname ini?')) return;
    window.opnameList = (window.opnameList || []).filter(o => o.id !== id);
    persistAll();
    renderOpname();
    toast('🗑️ Data opname dihapus');
};

// ═══════════════════════════════════════════════════════
// INJECT ELEMEN FORM — tampilkan referensi sistem di bawah tiap field
// ═══════════════════════════════════════════════════════
function injectOpnameFormRefs() {
    const fields = [
        { input: 'opname-log',       ref: 'opname-log-ref' },
        { input: 'opname-basah',     ref: 'opname-basah-ref' },
        { input: 'opname-kering',    ref: 'opname-kering-ref' },
        { input: 'opname-board',     ref: 'opname-board-ref' },
        { input: 'opname-limbah',    ref: 'opname-limbah-ref' },
    ];

    fields.forEach(({ input, ref }) => {
        const inputEl = document.getElementById(input);
        if (!inputEl || document.getElementById(ref)) return;
        const div = document.createElement('div');
        div.id = ref;
        div.className = 'op-form-ref';
        div.innerHTML = 'Pilih bulan untuk melihat nilai sistem';
        inputEl.insertAdjacentElement('afterend', div);
    });

    // Inject summary container sebelum opname-list
    const listEl = document.getElementById('opname-list');
    if (listEl && !document.getElementById('opname-summary')) {
        const sumEl = document.createElement('div');
        sumEl.id = 'opname-summary';
        listEl.insertAdjacentElement('beforebegin', sumEl);
    }

    // Pasang event listener pada input bulan
    const bulanEl = document.getElementById('opname-bulan');
    if (bulanEl && !bulanEl._opnameListenerAdded) {
        bulanEl.addEventListener('change', window.onOpnameBulanChange);
        bulanEl._opnameListenerAdded = true;
    }
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
setTimeout(() => {
    injectOpnameFormRefs();
    if (typeof window.renderOpname === 'function') window.renderOpname();
}, 700);
