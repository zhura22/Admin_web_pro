// kayu.js — Versi Enhanced
// Fitur baru:
//   - KPI summary cards (volume, nilai, avg harga, total nota)
//   - Live harga/m³ di form saat input
//   - Peringatan harga jika di atas rata-rata historis
//   - Trend sparkline volume bulanan
//   - Ranking supplier dengan bar persen
//   - Breakdown grade (Bagus vs Jelek) dengan gauge
//   - Tabel diperkaya (harga/m³ per baris, color grade)
//   - Ringkasan bulanan lebih detail (per asal, per jenis, per grade)
//   - Search diperluas (nota, suplier, asal, no truk)
//   - Komparasi bulan ini vs bulan lalu

let kayuEditId = null;
let kayuSearch = '';

// ─────────────────────────────────────────────────
// KONSTANTA
// ─────────────────────────────────────────────────
// Threshold peringatan harga/m³ (jika > rata-rata × faktor ini → alert)
const HARGA_WARNING_FACTOR = 1.20; // 20% di atas rata-rata

// ─────────────────────────────────────────────────
// CSS INJECT
// ─────────────────────────────────────────────────
function injectKayuStyles() {
    if (document.getElementById('kayu-styles')) return;
    const s = document.createElement('style');
    s.id = 'kayu-styles';
    s.textContent = `
        /* ─── KPI Cards ─── */
        .ky-kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 10px;
            margin-bottom: 16px;
        }
        .ky-kpi {
            background: var(--bg3);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 12px 14px;
            text-align: center;
        }
        .ky-kpi-val { font-size: 22px; font-weight: 800; line-height: 1.15; }
        .ky-kpi-lbl { font-size: 10px; color: var(--muted); margin-top: 4px; }
        .ky-kpi-sub { font-size: 10px; margin-top: 3px; }
        .kv-gold   { color: var(--gold); }
        .kv-green  { color: var(--green); }
        .kv-blue   { color: #60a5fa; }
        .kv-orange { color: var(--orange); }
        .kv-red    { color: #f87171; }
        .kv-muted  { color: var(--muted); }

        /* ─── Trend chip (vs bulan lalu) ─── */
        .ky-trend-up   { color: var(--green); font-size: 10px; }
        .ky-trend-down { color: #f87171; font-size: 10px; }
        .ky-trend-flat { color: var(--muted); font-size: 10px; }

        /* ─── Toolbar ─── */
        .ky-toolbar {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
            margin-bottom: 14px;
        }
        .ky-toolbar select, .ky-toolbar input[type=text] {
            padding: 7px 10px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--input-bg);
            color: var(--text);
            font-size: 13px;
        }
        .ky-toolbar input[type=text] { flex: 1; min-width: 160px; }

        /* ─── Live harga hint di form ─── */
        .ky-harga-hint {
            font-size: 11px;
            margin-top: 4px;
            padding: 4px 8px;
            border-radius: 6px;
            border-left: 3px solid var(--border);
            background: var(--bg3);
        }
        .ky-harga-ok   { border-left-color: var(--green);  color: var(--green); }
        .ky-harga-warn { border-left-color: var(--orange); color: var(--orange); }

        /* ─── Tabel Kayu ─── */
        .ky-tbl-wrap { overflow-x: auto; border-radius: 10px; border: 1px solid var(--border); }
        .ky-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .ky-tbl thead tr { background: var(--bg3); border-bottom: 2px solid var(--gold-dim); }
        .ky-tbl th {
            padding: 9px 10px; text-align: left; font-size: 10px;
            text-transform: uppercase; letter-spacing: .05em; color: var(--muted);
            white-space: nowrap;
        }
        .ky-tbl th.r { text-align: right; }
        .ky-tbl td { padding: 9px 10px; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .ky-tbl td.r { text-align: right; }
        .ky-tbl tbody tr:hover { background: var(--gold-dim); }
        .ky-tbl tbody tr:last-child td { border-bottom: none; }

        .ky-nota { font-family: monospace; font-weight: 700; color: var(--gold); font-size: 12px; }
        .ky-suplier { font-weight: 600; font-size: 12px; }
        .ky-asal { font-size: 11px; color: var(--muted); }

        .grade-bagus { display:inline-block; padding:2px 8px; border-radius:10px;
            font-size:10px; font-weight:700;
            background:#16a34a20; color:var(--green); border:1px solid #16a34a40; }
        .grade-jelek { display:inline-block; padding:2px 8px; border-radius:10px;
            font-size:10px; font-weight:700;
            background:#f8717120; color:#f87171; border:1px solid #f8717140; }
        .jenis-papan { display:inline-block; padding:2px 8px; border-radius:10px;
            font-size:10px; font-weight:700;
            background:#7c3aed20; color:#a78bfa; border:1px solid #7c3aed40; }
        .jenis-glondong { display:inline-block; padding:2px 8px; border-radius:10px;
            font-size:10px; font-weight:700;
            background:#0369a120; color:#38bdf8; border:1px solid #0369a140; }

        .harga-row-warn { color: var(--orange) !important; font-weight: 700; }
        .harga-row-ok   { color: var(--text); }

        /* ─── Sparkline ─── */
        .ky-sparkline-wrap {
            background: var(--bg3);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 14px;
        }
        .ky-sparkline-title {
            font-size: 10px; color: var(--muted);
            text-transform: uppercase; letter-spacing: .08em;
            margin-bottom: 8px;
        }
        .ky-spark { display: flex; align-items: flex-end; gap: 4px; height: 40px; }
        .ky-spark-col { display: flex; flex-direction: column; align-items: center; flex: 1; }
        .ky-spark-bar {
            width: 100%; border-radius: 3px 3px 0 0;
            min-height: 4px; cursor: pointer;
            transition: opacity .15s;
        }
        .ky-spark-bar:hover { opacity: .7; }
        .ky-spark-lbl { font-size: 8px; color: var(--muted); margin-top: 3px; white-space: nowrap; }

        /* ─── Summary tab ─── */
        .ky-sum-kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 10px;
            margin: 14px 0 16px;
        }
        .ky-sum-kpi {
            background: var(--bg3); border: 1px solid var(--border);
            border-radius: 10px; padding: 12px 14px; text-align: center;
        }
        .ky-sum-kpi-val { font-size: 20px; font-weight: 800; color: var(--gold); }
        .ky-sum-kpi-lbl { font-size: 10px; color: var(--muted); margin-top: 4px; }

        /* Ranking bar */
        .ky-rank-item {
            display: flex; align-items: center; gap: 8px;
            padding: 8px 0; border-bottom: 1px solid var(--border);
            font-size: 12px;
        }
        .ky-rank-item:last-child { border-bottom: none; }
        .ky-rank-name { min-width: 100px; max-width: 140px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            font-weight: 600; color: var(--text); }
        .ky-rank-bar-outer { flex: 1; background: var(--border);
            border-radius: 4px; height: 8px; overflow: hidden; }
        .ky-rank-bar-inner { height: 100%; border-radius: 4px;
            background: var(--gold); transition: width .4s ease; }
        .ky-rank-val { font-size: 11px; color: var(--muted); min-width: 70px; text-align: right; }
        .ky-rank-pct { font-size: 10px; color: var(--gold); min-width: 36px; text-align: right; }

        /* Grade gauge */
        .ky-grade-gauge {
            display: flex; height: 12px; border-radius: 8px;
            overflow: hidden; gap: 2px; margin: 8px 0 4px;
        }
        .ky-grade-bagus { background: var(--green); transition: flex .4s ease; }
        .ky-grade-jelek { background: #f87171;       transition: flex .4s ease; }

        /* Comparison row */
        .ky-compare-row {
            display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px;
        }
        .ky-compare-card {
            flex: 1; min-width: 120px;
            background: var(--bg3); border: 1px solid var(--border);
            border-radius: 10px; padding: 12px 14px;
        }
        .ky-compare-title { font-size: 10px; color: var(--muted);
            text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
        .ky-compare-val { font-size: 18px; font-weight: 800; color: var(--gold); }
        .ky-compare-sub { font-size: 10px; color: var(--muted); margin-top: 3px; }

        /* Summary tables */
        .ky-sum-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .ky-sum-tbl thead tr { background: var(--bg3); }
        .ky-sum-tbl th {
            padding: 8px 10px; text-align: right; font-size: 10px;
            text-transform: uppercase; letter-spacing: .05em; color: var(--muted); white-space: nowrap;
        }
        .ky-sum-tbl th:first-child { text-align: left; }
        .ky-sum-tbl td { padding: 8px 10px; text-align: right;
            border-bottom: 1px solid var(--border); }
        .ky-sum-tbl td:first-child { text-align: left; font-weight: 600; color: var(--text); }
        .ky-sum-tbl tbody tr:last-child td {
            border-bottom: none; font-weight: 700; color: var(--gold); }
        .ky-sum-tbl tbody tr:hover { background: var(--gold-dim); }

        /* Pct bar inline */
        .ky-pct-wrap { display: flex; align-items: center; gap: 6px; }
        .ky-pct-bar  { flex: 1; background: var(--border); border-radius: 4px; height: 6px; overflow: hidden; }
        .ky-pct-fill { height: 100%; border-radius: 4px; background: var(--gold); }
        .ky-pct-num  { font-size: 10px; color: var(--muted); min-width: 32px; text-align: right; }

        @media (max-width: 640px) {
            .ky-tbl th:nth-child(5),
            .ky-tbl td:nth-child(5),
            .ky-tbl th:nth-child(6),
            .ky-tbl td:nth-child(6) { display: none; }
        }
    `;
    document.head.appendChild(s);
}

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────
function avgHargaPerM3(list) {
    const volTotal = list.reduce((s, x) => s + (x.volume || 0), 0);
    const hrgTotal = list.reduce((s, x) => s + (x.harga  || 0), 0);
    return volTotal > 0 ? hrgTotal / volTotal : 0;
}

function prevMonth(ym) {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return d.toISOString().slice(0, 7);
}

function trendArrow(cur, prev) {
    if (!prev || prev === 0) return '';
    const pct = ((cur - prev) / prev) * 100;
    if (Math.abs(pct) < 1) return `<span class="ky-trend-flat">→ ±0%</span>`;
    return pct > 0
        ? `<span class="ky-trend-up">↑ +${pct.toFixed(1)}%</span>`
        : `<span class="ky-trend-down">↓ ${pct.toFixed(1)}%</span>`;
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m =>
        ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

// ─────────────────────────────────────────────────
// FORM — open / close / save / delete
// ─────────────────────────────────────────────────
function resetKayuForm() {
    document.getElementById('k-tanggal').value = today();
    document.getElementById('k-nonota').value  = '';
    document.getElementById('k-notruk').value  = '';
    document.getElementById('k-batang').value  = '';
    document.getElementById('k-volume').value  = '';
    document.getElementById('k-harga').value   = '';
    document.getElementById('k-suplier').value = '';
    document.getElementById('k-asal').value    = '';
    document.getElementById('k-jenis').value   = 'glondong';
    document.getElementById('k-grade').value   = 'bagus';
    kayuEditId = null;
    document.getElementById('kayu-form-title').textContent = '➕ Input Pembelian Kayu';
    updateHargaHint();
}

window.openKayuForm = function(item) {
    if (item) {
        kayuEditId = item.id;
        document.getElementById('k-tanggal').value = item.tanggal;
        document.getElementById('k-nonota').value  = item.noNota;
        document.getElementById('k-notruk').value  = item.noTruk   || '';
        document.getElementById('k-batang').value  = item.jumlahBatang;
        document.getElementById('k-volume').value  = item.volume;
        document.getElementById('k-harga').value   = item.harga;
        document.getElementById('k-suplier').value = item.suplier;
        document.getElementById('k-asal').value    = item.asal     || '';
        document.getElementById('k-jenis').value   = item.jenis;
        document.getElementById('k-grade').value   = item.grade;
        document.getElementById('kayu-form-title').textContent = '✏️ Edit Pembelian Kayu';
    } else {
        resetKayuForm();
    }
    updateHargaHint();
    document.getElementById('kayu-input').classList.remove('hidden');
    document.getElementById('kayu-list').classList.add('hidden');
    const summaryPanel = document.getElementById('kayu-summary-panel');
    if (summaryPanel) summaryPanel.classList.add('hidden');
};

window.closeKayuForm = function() {
    document.getElementById('kayu-input').classList.add('hidden');
    document.getElementById('kayu-list').classList.remove('hidden');
    resetKayuForm();
};

// Live hint harga/m³ saat input
window.updateHargaHint = updateHargaHint;
function updateHargaHint() {
    const hint = document.getElementById('kayu-harga-hint');
    if (!hint) return;
    const vol = parseFloat(document.getElementById('k-volume')?.value) || 0;
    const hrg = parseFloat(document.getElementById('k-harga')?.value)  || 0;
    if (vol <= 0 || hrg <= 0) { hint.textContent = ''; hint.className = 'ky-harga-hint'; return; }
    const perM3   = hrg / vol;
    const avgHist = avgHargaPerM3(window.kayuList || []);
    const isWarn  = avgHist > 0 && perM3 > avgHist * HARGA_WARNING_FACTOR;
    hint.className = `ky-harga-hint ${isWarn ? 'ky-harga-warn' : 'ky-harga-ok'}`;
    hint.textContent = isWarn
        ? `⚠️ Harga/m³: Rp ${fmt(Math.round(perM3))} — di atas rata-rata ${fmt(Math.round(avgHist))} (>${(HARGA_WARNING_FACTOR*100-100).toFixed(0)}%)`
        : `✅ Harga/m³: Rp ${fmt(Math.round(perM3))} — rata-rata historis: Rp ${fmt(Math.round(avgHist))}`;
}

window.saveKayu = function() {
    const tgl     = document.getElementById('k-tanggal').value.trim();
    const noNota  = document.getElementById('k-nonota').value.trim();
    const suplier = document.getElementById('k-suplier').value.trim();
    if (!tgl || !noNota || !suplier) {
        toast('⚠️ Tanggal, Nota, Suplier wajib!');
        return;
    }
    const existing = (window.kayuList || []).find(k =>
        k.noNota === noNota && (kayuEditId ? k.id !== kayuEditId : true));
    if (existing) {
        toast(`⚠️ Nota ${noNota} sudah ada (${fmtDate(existing.tanggal)}, ${existing.suplier})`);
        return;
    }
    const vol = parseFloat(document.getElementById('k-volume').value) || 0;
    const hrg = parseFloat(document.getElementById('k-harga').value)  || 0;
    const item = {
        id:           kayuEditId || uid(),
        tanggal:      tgl,
        noNota:       noNota,
        noTruk:       document.getElementById('k-notruk').value.trim(),
        jumlahBatang: parseFloat(document.getElementById('k-batang').value) || 0,
        volume:       vol,
        harga:        hrg,
        hargaPerM3:   vol > 0 ? hrg / vol : 0,
        suplier:      suplier,
        asal:         document.getElementById('k-asal').value.trim(),
        jenis:        document.getElementById('k-jenis').value,
        grade:        document.getElementById('k-grade').value
    };
    if (kayuEditId) {
        window.kayuList = window.kayuList.map(x => x.id === kayuEditId ? item : x);
        logActivity('Update', 'Kayu', `Nota: ${item.noNota} | ${fmtDec(item.volume,2)}m³ | Rp${fmt(Math.round(item.hargaPerM3))}/m³`);
        toast('✅ Data berhasil diupdate');
    } else {
        window.kayuList.push(item);
        logActivity('Simpan', 'Kayu', `Nota: ${item.noNota} | ${fmtDec(item.volume,2)}m³ | Rp${fmt(Math.round(item.hargaPerM3))}/m³`);
        toast('✅ Data berhasil disimpan');
    }
    persistAll();
    resetKayuForm();
    window.renderKayu();
    if (typeof window.loadKayuSummary === 'function') window.loadKayuSummary();
};

window.deleteKayu = function(id) {
    if (!confirmDialog('Hapus data pembelian kayu ini?')) return;
    const item = (window.kayuList || []).find(x => x.id === id);
    if (item) logActivity('Hapus', 'Kayu', `Nota: ${item.noNota}`);
    window.kayuList = (window.kayuList || []).filter(x => x.id !== id);
    persistAll();
    window.renderKayu();
    toast('🗑️ Dihapus');
};

window.editKayu = function(id) {
    const item = (window.kayuList || []).find(x => x.id === id);
    if (item) window.openKayuForm(item);
};

// ─────────────────────────────────────────────────
// Pasang listener live hint ke form (sekali saja)
// ─────────────────────────────────────────────────
function ensureHargaHintEl() {
    if (document.getElementById('kayu-harga-hint')) return;
    const hargaField = document.getElementById('k-harga')?.closest('.field');
    if (!hargaField) return;
    const div = document.createElement('div');
    div.id = 'kayu-harga-hint';
    div.className = 'ky-harga-hint';
    hargaField.appendChild(div);
    // Attach listeners
    ['k-volume','k-harga'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateHargaHint);
    });
}

// ─────────────────────────────────────────────────
// FILTER & SEARCH
// ─────────────────────────────────────────────────
function getSelectedMonth() {
    const v = document.getElementById('kayu-filter-bulan')?.value;
    if (!v || v === 'all') return null;
    if (v === 'this_month') return thisMonth();
    return v;
}

function getFilteredKayu() {
    const selectedMonth = getSelectedMonth();
    const q = kayuSearch.toLowerCase();
    let list = [...(window.kayuList || [])];
    if (selectedMonth) list = list.filter(x => x.tanggal && x.tanggal.startsWith(selectedMonth));
    if (q) list = list.filter(x =>
        (x.suplier||'').toLowerCase().includes(q) ||
        (x.noNota ||'').toLowerCase().includes(q) ||
        (x.asal   ||'').toLowerCase().includes(q) ||
        (x.noTruk ||'').toLowerCase().includes(q)
    );
    return sortByDateAsc(list);
}

function generateKayuMonthOptions() {
    const cur = thisMonth();
    let opts = `<option value="all">📅 Semua Bulan</option>
                <option value="this_month" selected>📆 Bulan Ini (${cur})</option>`;
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.toISOString().slice(0, 7);
        if (m !== cur) opts += `<option value="${m}">${m}</option>`;
    }
    return opts;
}

// ─────────────────────────────────────────────────
// RENDER UTAMA
// ─────────────────────────────────────────────────
window.renderKayu = function() {
    injectKayuStyles();
    ensureHargaHintEl();

    const filtered   = getFilteredKayu();
    const allList    = window.kayuList || [];
    const curMonth   = getSelectedMonth() || thisMonth();
    const prvMonth   = prevMonth(curMonth);
    const curData    = allList.filter(x => x.tanggal && x.tanggal.startsWith(curMonth));
    const prvData    = allList.filter(x => x.tanggal && x.tanggal.startsWith(prvMonth));

    // KPI bulan berjalan (sesuai filter)
    const volTotal   = filtered.reduce((s,x) => s+(x.volume||0), 0);
    const hrgTotal   = filtered.reduce((s,x) => s+(x.harga||0),  0);
    const avgM3      = avgHargaPerM3(filtered);
    const notaTotal  = filtered.length;

    // Komparasi vs bulan lalu
    const volPrv     = prvData.reduce((s,x) => s+(x.volume||0), 0);
    const hrgPrv     = prvData.reduce((s,x) => s+(x.harga||0),  0);
    const avgPrv     = avgHargaPerM3(prvData);

    // Grade breakdown
    const cntBagus   = filtered.filter(x => x.grade === 'bagus').length;
    const pctBagus   = notaTotal > 0 ? (cntBagus/notaTotal)*100 : 0;
    const volBagus   = filtered.filter(x=>x.grade==='bagus').reduce((s,x)=>s+(x.volume||0),0);
    const volJelek   = filtered.filter(x=>x.grade==='jelek').reduce((s,x)=>s+(x.volume||0),0);

    // Update count el
    const countEl = document.getElementById('kayu-count');
    if (countEl) countEl.textContent = `${allList.length} transaksi (filter: ${notaTotal} tampil)`;

    // Update legacy summary elements jika ada
    ['s-k-total','s-k-vol','s-k-harga','s-k-avgprice'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === 's-k-total')    el.textContent = `${notaTotal} nota`;
        if (id === 's-k-vol')      el.textContent = `${fmtDec(volTotal,3)} m³`;
        if (id === 's-k-harga')    el.textContent = `Rp ${fmt(hrgTotal)}`;
        if (id === 's-k-avgprice') el.textContent = `Rp ${fmt(Math.round(avgM3))}/m³`;
    });

    // ── Trend sparkline (6 bulan terakhir) ──
    const sparkMonths = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        sparkMonths.push(d.toISOString().slice(0, 7));
    }
    const sparkVols = sparkMonths.map(m =>
        allList.filter(x => x.tanggal && x.tanggal.startsWith(m))
               .reduce((s,x) => s+(x.volume||0), 0));
    const maxSparkVol = Math.max(...sparkVols, 0.001);

    let sparkHtml = '';
    if (sparkVols.some(v => v > 0)) {
        sparkHtml = `
        <div class="ky-sparkline-wrap">
            <div class="ky-sparkline-title">📈 Tren Volume Pembelian — 6 Bulan Terakhir</div>
            <div class="ky-spark">
                ${sparkMonths.map((m, i) => {
                    const h = Math.max(5, (sparkVols[i]/maxSparkVol)*100);
                    const isCur = m === curMonth;
                    return `<div class="ky-spark-col">
                        <div class="ky-spark-bar"
                            style="height:${h}%; background:${isCur?'var(--gold)':'#d4a01755'};"
                            title="${m}: ${fmtDec(sparkVols[i],2)} m³"></div>
                        <div class="ky-spark-lbl">${m.slice(5)}</div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }

    // ── KPI Cards ──
    const kpiHtml = `
        <div class="ky-kpi-grid">
            <div class="ky-kpi">
                <div class="ky-kpi-val kv-gold">${fmtDec(volTotal,2)}</div>
                <div class="ky-kpi-lbl">Volume (m³)</div>
                <div class="ky-kpi-sub">${trendArrow(volTotal, volPrv)}</div>
            </div>
            <div class="ky-kpi">
                <div class="ky-kpi-val kv-blue">Rp ${fmt(Math.round(hrgTotal/1000))}k</div>
                <div class="ky-kpi-lbl">Total Nilai (Rp)</div>
                <div class="ky-kpi-sub">${trendArrow(hrgTotal, hrgPrv)}</div>
            </div>
            <div class="ky-kpi">
                <div class="ky-kpi-val ${avgM3 > avgPrv*HARGA_WARNING_FACTOR && avgPrv>0 ? 'kv-orange' : 'kv-green'}">
                    Rp ${fmt(Math.round(avgM3))}
                </div>
                <div class="ky-kpi-lbl">Avg Harga/m³</div>
                <div class="ky-kpi-sub">${trendArrow(avgM3, avgPrv)}</div>
            </div>
            <div class="ky-kpi">
                <div class="ky-kpi-val kv-muted">${notaTotal}</div>
                <div class="ky-kpi-lbl">Total Nota</div>
            </div>
            <div class="ky-kpi">
                <div class="ky-kpi-val kv-green">${pctBagus.toFixed(0)}%</div>
                <div class="ky-kpi-lbl">Grade Bagus</div>
                <div class="ky-kpi-sub" style="font-size:10px; color:var(--muted);">
                    ${fmtDec(volBagus,2)} / ${fmtDec(volJelek,2)} m³</div>
            </div>
            <div class="ky-kpi">
                <div class="ky-kpi-val kv-blue">${fmtDec(volTotal>0&&notaTotal>0?volTotal/notaTotal:0,2)}</div>
                <div class="ky-kpi-lbl">Avg Vol/Nota (m³)</div>
            </div>
        </div>`;

    // ── Toolbar ──
    const toolbarHtml = `
        <div class="ky-toolbar">
            <select id="kayu-filter-bulan" onchange="onKayuFilterChange(this.value)">
                ${generateKayuMonthOptions()}
            </select>
            <input type="text" id="kayu-search" placeholder="🔍 Nota, suplier, asal, truk..."
                value="${escHtml(kayuSearch)}" oninput="onKayuSearch(this.value)">
            <button class="btn btn-secondary btn-sm" onclick="onKayuReset()">Reset</button>
        </div>`;

    // ── Tabel ──
    let tableHtml = '';
    if (!filtered.length) {
        tableHtml = `<div class="empty" style="padding:40px; text-align:center; color:var(--muted);">
            📭 Tidak ada data sesuai filter.</div>`;
    } else {
        const avgM3All = avgHargaPerM3(allList);
        const rows = [...filtered].reverse().map((r, i) => {
            const hM3 = r.volume > 0 ? r.harga / r.volume : 0;
            const hM3Class = hM3 > avgM3All * HARGA_WARNING_FACTOR && avgM3All > 0
                ? 'harga-row-warn' : 'harga-row-ok';
            return `<tr>
                <td style="text-align:center; color:var(--muted); font-size:11px;">${i+1}</td>
                <td style="font-size:11px; color:var(--muted);">${fmtDate(r.tanggal)}</td>
                <td><div class="ky-nota">${escHtml(r.noNota)}</div>
                    ${r.noTruk?`<div style="font-size:10px;color:var(--muted);">🚛 ${escHtml(r.noTruk)}</div>`:''}</td>
                <td><div class="ky-suplier">${escHtml(r.suplier)}</div>
                    <div class="ky-asal">${escHtml(r.asal)||'—'}</div></td>
                <td>${r.jenis==='papan'
                    ? `<span class="jenis-papan">Papan</span>`
                    : `<span class="jenis-glondong">Glondong</span>`}</td>
                <td>${r.grade==='bagus'
                    ? `<span class="grade-bagus">✅ Bagus</span>`
                    : `<span class="grade-jelek">⚠️ Jelek</span>`}</td>
                <td class="r">${fmt(r.jumlahBatang)}</td>
                <td class="r"><strong>${fmtDec(r.volume,3)}</strong></td>
                <td class="r">Rp ${fmt(r.harga)}</td>
                <td class="r"><span class="${hM3Class}">Rp ${fmt(Math.round(hM3))}</span></td>
                <td>
                    <button class="btn btn-edit btn-sm" onclick="window.editKayu('${r.id}')">✏️</button>
                    <button class="btn btn-del  btn-sm" onclick="window.deleteKayu('${r.id}')">🗑️</button>
                </td>
            </tr>`;
        }).join('');

        tableHtml = `
        <div class="ky-tbl-wrap">
            <table class="ky-tbl">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Tanggal</th>
                        <th>No Nota / Truk</th>
                        <th>Suplier / Asal</th>
                        <th>Jenis</th>
                        <th>Grade</th>
                        <th class="r">Batang</th>
                        <th class="r">Volume (m³)</th>
                        <th class="r">Harga (Rp)</th>
                        <th class="r">Rp/m³</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
    }

    // ── Pasang ke container ──
    const listEl = document.getElementById('kayu-list');
    if (!listEl) return;
    listEl.innerHTML = kpiHtml + sparkHtml + toolbarHtml + tableHtml;

    // Restore filter value
    setTimeout(() => {
        const sel = document.getElementById('kayu-filter-bulan');
        if (!sel) return;
        const saved = localStorage.getItem('kayu_filter_month') || 'this_month';
        if (sel.querySelector(`option[value="${saved}"]`)) sel.value = saved;
    }, 0);
};

// Event handlers
window.onKayuFilterChange = function(val) {
    localStorage.setItem('kayu_filter_month', val);
    window.renderKayu();
};
window.onKayuSearch = function(val) {
    kayuSearch = val;
    window.renderKayu();
};
window.onKayuReset = function() {
    kayuSearch = '';
    localStorage.setItem('kayu_filter_month', 'this_month');
    window.renderKayu();
};

// ─────────────────────────────────────────────────
// RINGKASAN BULANAN — Diperkaya
// ─────────────────────────────────────────────────
window.loadKayuSummary = function() {
    const bulan     = document.getElementById('summary-bulan')?.value || thisMonth();
    const prv       = prevMonth(bulan);
    const dataBulan = (window.kayuList||[]).filter(x => x.tanggal && x.tanggal.startsWith(bulan));
    const dataPrv   = (window.kayuList||[]).filter(x => x.tanggal && x.tanggal.startsWith(prv));
    const container = document.getElementById('summary-content');
    if (!container) return;

    if (!dataBulan.length) {
        container.innerHTML = '<div class="empty">📭 Tidak ada data pembelian kayu pada bulan ini.</div>';
        return;
    }

    const volTotal  = dataBulan.reduce((s,x) => s+(x.volume||0), 0);
    const hrgTotal  = dataBulan.reduce((s,x) => s+(x.harga||0),  0);
    const avgM3     = avgHargaPerM3(dataBulan);
    const notaTotal = dataBulan.length;
    const volPrv    = dataPrv.reduce((s,x) => s+(x.volume||0), 0);
    const hrgPrv    = dataPrv.reduce((s,x) => s+(x.harga||0),  0);
    const avgPrv    = avgHargaPerM3(dataPrv);

    // Grade
    const vBagus = dataBulan.filter(x=>x.grade==='bagus').reduce((s,x)=>s+(x.volume||0),0);
    const vJelek = dataBulan.filter(x=>x.grade==='jelek').reduce((s,x)=>s+(x.volume||0),0);
    const pBagus = volTotal > 0 ? (vBagus/volTotal)*100 : 0;

    // Per Supplier
    const supMap = new Map();
    dataBulan.forEach(x => {
        const k = x.suplier||'—';
        if (!supMap.has(k)) supMap.set(k, { vol:0, hrg:0, n:0 });
        const e = supMap.get(k);
        e.vol += (x.volume||0); e.hrg += (x.harga||0); e.n++;
    });
    const supArr = [...supMap.entries()]
        .map(([name,v]) => ({ name, vol:v.vol, hrg:v.hrg, n:v.n, avgM3:v.vol>0?v.hrg/v.vol:0 }))
        .sort((a,b) => b.vol - a.vol);

    // Per Asal
    const asalMap = new Map();
    dataBulan.forEach(x => {
        const k = x.asal||'Tidak diketahui';
        if (!asalMap.has(k)) asalMap.set(k, { vol:0, hrg:0, n:0 });
        const e = asalMap.get(k);
        e.vol += (x.volume||0); e.hrg += (x.harga||0); e.n++;
    });
    const asalArr = [...asalMap.entries()]
        .map(([name,v]) => ({ name, vol:v.vol, hrg:v.hrg, n:v.n }))
        .sort((a,b) => b.vol - a.vol);

    // Per Jenis
    const jenisMap = new Map();
    dataBulan.forEach(x => {
        const k = x.jenis||'glondong';
        if (!jenisMap.has(k)) jenisMap.set(k, { vol:0, hrg:0, n:0 });
        const e = jenisMap.get(k);
        e.vol += (x.volume||0); e.hrg += (x.harga||0); e.n++;
    });

    let html = `
        <!-- KPI ringkasan -->
        <div class="ky-sum-kpi-grid">
            <div class="ky-sum-kpi">
                <div class="ky-sum-kpi-val">${fmtDec(volTotal,2)}</div>
                <div class="ky-sum-kpi-lbl">Volume (m³)</div>
            </div>
            <div class="ky-sum-kpi">
                <div class="ky-sum-kpi-val">Rp ${fmt(Math.round(hrgTotal/1000))}k</div>
                <div class="ky-sum-kpi-lbl">Total Nilai (Rp)</div>
            </div>
            <div class="ky-sum-kpi">
                <div class="ky-sum-kpi-val">Rp ${fmt(Math.round(avgM3))}</div>
                <div class="ky-sum-kpi-lbl">Avg Harga/m³</div>
            </div>
            <div class="ky-sum-kpi">
                <div class="ky-sum-kpi-val">${notaTotal}</div>
                <div class="ky-sum-kpi-lbl">Jumlah Nota</div>
            </div>
        </div>

        <!-- Komparasi vs bulan lalu -->
        ${dataPrv.length ? `
        <div style="font-size:11px; font-weight:600; color:var(--muted);
            text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px;">
            ⚖️ Komparasi vs Bulan Lalu (${prv})
        </div>
        <div class="ky-compare-row">
            <div class="ky-compare-card">
                <div class="ky-compare-title">Volume</div>
                <div class="ky-compare-val">${fmtDec(volTotal,2)} m³</div>
                <div class="ky-compare-sub">vs ${fmtDec(volPrv,2)} m³ ${trendArrow(volTotal,volPrv)}</div>
            </div>
            <div class="ky-compare-card">
                <div class="ky-compare-title">Total Nilai</div>
                <div class="ky-compare-val">Rp ${fmt(Math.round(hrgTotal/1000))}k</div>
                <div class="ky-compare-sub">vs Rp ${fmt(Math.round(hrgPrv/1000))}k ${trendArrow(hrgTotal,hrgPrv)}</div>
            </div>
            <div class="ky-compare-card">
                <div class="ky-compare-title">Avg Harga/m³</div>
                <div class="ky-compare-val">Rp ${fmt(Math.round(avgM3))}</div>
                <div class="ky-compare-sub">vs Rp ${fmt(Math.round(avgPrv))} ${trendArrow(avgM3,avgPrv)}</div>
            </div>
        </div>` : ''}

        <!-- Grade breakdown -->
        <div style="font-size:11px; font-weight:600; color:var(--muted);
            text-transform:uppercase; letter-spacing:.08em; margin-bottom:6px;">
            🌿 Kualitas Grade (berdasarkan volume)
        </div>
        <div class="ky-grade-gauge">
            <div class="ky-grade-bagus" style="flex:${vBagus};"></div>
            <div class="ky-grade-jelek" style="flex:${vJelek};"></div>
        </div>
        <div style="display:flex; gap:16px; font-size:11px; margin-bottom:16px;">
            <span style="color:var(--green);">✅ Bagus: ${fmtDec(vBagus,2)} m³ (${pBagus.toFixed(1)}%)</span>
            <span style="color:#f87171;">⚠️ Jelek: ${fmtDec(vJelek,2)} m³ (${(100-pBagus).toFixed(1)}%)</span>
        </div>

        <!-- Ranking Supplier -->
        <div style="font-size:11px; font-weight:600; color:var(--muted);
            text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px;">
            🏆 Ranking Supplier (Volume)
        </div>
        <div style="background:var(--bg3); border:1px solid var(--border);
            border-radius:10px; padding:12px 14px; margin-bottom:16px;">
            ${supArr.map(s => {
                const pct = volTotal > 0 ? (s.vol/volTotal)*100 : 0;
                return `<div class="ky-rank-item">
                    <div class="ky-rank-name" title="${escHtml(s.name)}">${escHtml(s.name)}</div>
                    <div class="ky-rank-bar-outer">
                        <div class="ky-rank-bar-inner" style="width:${pct.toFixed(1)}%;"></div>
                    </div>
                    <div class="ky-rank-val">${fmtDec(s.vol,2)} m³</div>
                    <div class="ky-rank-pct">${pct.toFixed(1)}%</div>
                </div>`;
            }).join('')}
        </div>

        <!-- Tabel per Supplier -->
        <div style="font-size:11px; font-weight:600; color:var(--muted);
            text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px;">
            📦 Detail per Supplier
        </div>
        <div style="overflow-x:auto; margin-bottom:18px;">
            <table class="ky-sum-tbl">
                <thead><tr>
                    <th>Supplier</th>
                    <th>Nota</th>
                    <th>Volume (m³)</th>
                    <th>% Volume</th>
                    <th>Total Nilai</th>
                    <th>Avg Harga/m³</th>
                </tr></thead>
                <tbody>
                ${supArr.map(s => {
                    const pct = volTotal > 0 ? (s.vol/volTotal)*100 : 0;
                    const isWarn = s.avgM3 > avgM3 * HARGA_WARNING_FACTOR;
                    return `<tr>
                        <td>${escHtml(s.name)}</td>
                        <td>${s.n}</td>
                        <td>${fmtDec(s.vol,3)}</td>
                        <td><div class="ky-pct-wrap">
                            <div class="ky-pct-bar"><div class="ky-pct-fill" style="width:${pct.toFixed(1)}%;"></div></div>
                            <div class="ky-pct-num">${pct.toFixed(1)}%</div>
                        </div></td>
                        <td>Rp ${fmt(s.hrg)}</td>
                        <td style="color:${isWarn?'var(--orange)':'var(--text)'}; font-weight:${isWarn?700:400};">
                            Rp ${fmt(Math.round(s.avgM3))}${isWarn?' ⚠️':''}
                        </td>
                    </tr>`;
                }).join('')}
                <tr>
                    <td>TOTAL</td>
                    <td>${notaTotal}</td>
                    <td>${fmtDec(volTotal,3)}</td>
                    <td>100%</td>
                    <td>Rp ${fmt(hrgTotal)}</td>
                    <td>Rp ${fmt(Math.round(avgM3))}</td>
                </tr>
                </tbody>
            </table>
        </div>

        <!-- Tabel per Asal -->
        <div style="font-size:11px; font-weight:600; color:var(--muted);
            text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px;">
            📍 Detail per Asal Kayu
        </div>
        <div style="overflow-x:auto; margin-bottom:18px;">
            <table class="ky-sum-tbl">
                <thead><tr>
                    <th>Asal</th>
                    <th>Nota</th>
                    <th>Volume (m³)</th>
                    <th>% Volume</th>
                    <th>Total Nilai</th>
                    <th>Avg Harga/m³</th>
                </tr></thead>
                <tbody>
                ${asalArr.map(a => {
                    const pct = volTotal > 0 ? (a.vol/volTotal)*100 : 0;
                    return `<tr>
                        <td>${escHtml(a.name)}</td>
                        <td>${a.n}</td>
                        <td>${fmtDec(a.vol,3)}</td>
                        <td><div class="ky-pct-wrap">
                            <div class="ky-pct-bar"><div class="ky-pct-fill" style="width:${pct.toFixed(1)}%;"></div></div>
                            <div class="ky-pct-num">${pct.toFixed(1)}%</div>
                        </div></td>
                        <td>Rp ${fmt(a.hrg)}</td>
                        <td>Rp ${fmt(Math.round(a.vol>0?a.hrg/a.vol:0))}</td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>
        </div>

        <!-- Per Jenis -->
        <div style="font-size:11px; font-weight:600; color:var(--muted);
            text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px;">
            🪵 Per Jenis Kayu
        </div>
        <div style="overflow-x:auto;">
            <table class="ky-sum-tbl">
                <thead><tr>
                    <th>Jenis</th><th>Nota</th><th>Volume (m³)</th>
                    <th>% Volume</th><th>Total Nilai</th><th>Avg Harga/m³</th>
                </tr></thead>
                <tbody>
                ${[...jenisMap.entries()].map(([k,v]) => {
                    const pct = volTotal > 0 ? (v.vol/volTotal)*100 : 0;
                    return `<tr>
                        <td>${k==='papan'?'<span class="jenis-papan">Papan</span>':'<span class="jenis-glondong">Glondong</span>'}</td>
                        <td>${v.n}</td>
                        <td>${fmtDec(v.vol,3)}</td>
                        <td><div class="ky-pct-wrap">
                            <div class="ky-pct-bar"><div class="ky-pct-fill" style="width:${pct.toFixed(1)}%;"></div></div>
                            <div class="ky-pct-num">${pct.toFixed(1)}%</div>
                        </div></td>
                        <td>Rp ${fmt(v.hrg)}</td>
                        <td>Rp ${fmt(Math.round(v.vol>0?v.hrg/v.vol:0))}</td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
};

// ─────────────────────────────────────────────────
// INIT SUMMARY PANEL & SUBTAB BUTTON
// ─────────────────────────────────────────────────
function ensureSummaryPanel() {
    let panel = document.getElementById('kayu-summary-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id        = 'kayu-summary-panel';
        panel.className = 'subtab-panel hidden';
        panel.innerHTML = `
            <div class="form-card">
                <div class="form-title">📊 Rangkuman Pembelian Kayu</div>
                <div class="grid2">
                    <div class="field"><label>Pilih Bulan</label>
                        <input type="month" id="summary-bulan" value="${thisMonth()}"></div>
                    <div class="field" style="display:flex; align-items:flex-end;">
                        <button class="btn btn-primary" onclick="window.loadKayuSummary()">Tampilkan</button>
                    </div>
                </div>
                <div id="summary-content"></div>
            </div>`;
        const listPanel = document.getElementById('kayu-list');
        if (listPanel) listPanel.insertAdjacentElement('afterend', panel);
        else document.getElementById('tab-kayu')?.appendChild(panel);
    }
    return panel;
}

function addSummarySubtabButton() {
    const container = document.querySelector('#tab-kayu .subtab-toggle');
    if (!container || document.getElementById('kayu-summary-btn')) return;
    const btn = document.createElement('button');
    btn.id        = 'kayu-summary-btn';
    btn.className = 'btn btn-secondary subtab-btn';
    btn.setAttribute('data-subtab', 'kayu-summary-panel');
    btn.textContent = '📊 Rangkuman';
    btn.onclick = () => {
        document.querySelectorAll('#tab-kayu .subtab-panel').forEach(p => p.classList.add('hidden'));
        ensureSummaryPanel().classList.remove('hidden');
        document.querySelectorAll('#tab-kayu .subtab-btn').forEach(b => {
            b.classList.remove('active','btn-primary'); b.classList.add('btn-secondary');
        });
        btn.classList.add('active','btn-primary'); btn.classList.remove('btn-secondary');
        window.loadKayuSummary();
    };
    container.appendChild(btn);
}

// ─────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────
setTimeout(() => {
    injectKayuStyles();
    ensureSummaryPanel();
    addSummarySubtabButton();
    window.renderKayu();
    // Pasang listener form setelah DOM ready
    setTimeout(ensureHargaHintEl, 300);
}, 500);
