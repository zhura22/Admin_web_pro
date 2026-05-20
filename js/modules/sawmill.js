// sawmill.js — Versi Enhanced
// Fitur baru: KPI summary cards, rendemen gauge berwarna, produktivitas tenaga kerja,
//             trend sparkline, breakdown palet per tebal, form diperluas (shift, no batch kayu),
//             filter search, laporan card yang lebih informatif

window.paletRows   = [];
let sawmillEditId  = null;
let sawmillSearch  = '';

// ─────────────────────────────────────────────────
// KONSTANTA
// ─────────────────────────────────────────────────
const RENDEMEN_TARGET   = 45;   // % target rendemen (bisa diubah)
const RENDEMEN_WARNING  = 35;   // % batas warning

// ─────────────────────────────────────────────────
// CSS INJECT
// ─────────────────────────────────────────────────
function injectSawmillStyles() {
    if (document.getElementById('sawmill-styles')) return;
    const s = document.createElement('style');
    s.id = 'sawmill-styles';
    s.textContent = `
        /* ─── KPI Cards ─── */
        .sw-kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 10px;
            margin-bottom: 18px;
        }
        .sw-kpi {
            background: var(--bg3);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 12px 14px;
            text-align: center;
        }
        .sw-kpi-val { font-size: 24px; font-weight: 800; line-height: 1.1; }
        .sw-kpi-lbl { font-size: 10px; color: var(--muted); margin-top: 4px; }
        .sw-kv-green  { color: var(--green); }
        .sw-kv-gold   { color: var(--gold); }
        .sw-kv-orange { color: var(--orange); }
        .sw-kv-red    { color: #f87171; }
        .sw-kv-blue   { color: #60a5fa; }
        .sw-kv-muted  { color: var(--muted); }

        /* ─── Rendemen Gauge ─── */
        .rend-gauge-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 4px;
        }
        .rend-bar-outer {
            flex: 1;
            background: var(--border);
            border-radius: 6px;
            height: 7px;
            overflow: hidden;
        }
        .rend-bar-inner { height: 100%; border-radius: 6px; transition: width .4s ease; }
        .rend-pct { font-size: 12px; font-weight: 700; min-width: 40px; text-align: right; }
        .rend-good   { background: var(--green); }
        .rend-warn   { background: var(--orange); }
        .rend-bad    { background: #f87171; }
        .rend-c-good { color: var(--green); }
        .rend-c-warn { color: var(--orange); }
        .rend-c-bad  { color: #f87171; }

        /* ─── Toolbar ─── */
        .sw-toolbar {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
            margin-bottom: 14px;
        }
        .sw-toolbar input[type=text] {
            flex: 1; min-width: 160px;
            padding: 7px 12px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--input-bg);
            color: var(--text);
            font-size: 13px;
        }
        .sw-toolbar select {
            padding: 7px 10px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--input-bg);
            color: var(--text);
            font-size: 13px;
        }

        /* ─── Laporan Card ─── */
        .sw-card {
            background: var(--bg3);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 14px;
            transition: box-shadow .2s;
        }
        .sw-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.2); }
        .sw-card.rend-card-warn { border-left: 3px solid var(--orange); }
        .sw-card.rend-card-bad  { border-left: 3px solid #f87171; }
        .sw-card.rend-card-good { border-left: 3px solid var(--green); }

        .sw-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 12px;
        }
        .sw-card-title { font-size: 15px; font-weight: 700; color: var(--text); }
        .sw-card-sub   { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .sw-card-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
        }
        .badge-shift-pagi  { background:#fef08a22; color:#eab308; border:1px solid #eab30850; }
        .badge-shift-siang { background:#7c3aed22; color:#a78bfa; border:1px solid #7c3aed50; }
        .badge-shift-full  { background:#06b6d422; color:#67e8f9; border:1px solid #06b6d450; }

        /* ─── Stat Pills (row) ─── */
        .sw-stats {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;
        }
        .sw-stat {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 12px;
            white-space: nowrap;
        }
        .sw-stat span { color: var(--muted); font-size: 10px; display: block; }

        /* ─── Palet Table ─── */
        .sw-palet-tbl { width:100%; border-collapse:collapse; font-size:11px; }
        .sw-palet-tbl thead tr { background: var(--bg); }
        .sw-palet-tbl th { padding:6px 8px; text-align:right; color:var(--muted);
            font-size:10px; text-transform:uppercase; letter-spacing:.04em; white-space:nowrap; }
        .sw-palet-tbl th:first-child { text-align:center; }
        .sw-palet-tbl td { padding:5px 8px; text-align:right;
            border-bottom:1px solid var(--border); }
        .sw-palet-tbl td:first-child { text-align:center; color:var(--muted); }
        .sw-palet-tbl tbody tr:last-child td { border-bottom:none; font-weight:700; }
        .sw-palet-tbl .vol-col { color:var(--gold); font-weight:700; }

        /* ─── Sparkline (trend rendemen) ─── */
        .sw-sparkline { display:flex; align-items:flex-end; gap:2px; height:32px; }
        .sw-spark-bar {
            flex:1; min-width:6px; max-width:18px;
            border-radius:3px 3px 0 0;
            opacity:.8;
            cursor:pointer;
            transition:opacity .15s;
        }
        .sw-spark-bar:hover { opacity:1; }

        /* ─── Form palet rows ─── */
        .palet-input-tbl { width:100%; border-collapse:collapse; font-size:12px; }
        .palet-input-tbl thead tr { background:var(--bg3); }
        .palet-input-tbl th { padding:8px 6px; color:var(--muted);
            font-size:10px; text-transform:uppercase; letter-spacing:.04em; }
        .palet-input-tbl td { padding:4px 4px; }
        .palet-input-tbl input {
            width:100%; padding:5px 6px;
            background:var(--input-bg); border:1px solid var(--border);
            border-radius:6px; color:var(--text); font-size:12px;
        }
        .palet-input-tbl input:focus { border-color:var(--gold); outline:none; }

        /* ─── Summary tab ─── */
        .sw-sum-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 10px;
            margin-bottom: 16px;
        }
        .sw-sum-card {
            background: var(--bg3);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 12px 14px;
            text-align: center;
        }
        .sw-sum-val { font-size: 22px; font-weight: 800; color: var(--gold); }
        .sw-sum-lbl { font-size: 10px; color: var(--muted); margin-top: 4px; }

        .sw-tebal-tbl { width:100%; border-collapse:collapse; font-size:12px; margin-top:8px; }
        .sw-tebal-tbl thead tr { background:var(--bg3); }
        .sw-tebal-tbl th { padding:8px 10px; text-align:right; color:var(--muted);
            font-size:10px; text-transform:uppercase; }
        .sw-tebal-tbl th:first-child { text-align:left; }
        .sw-tebal-tbl td { padding:8px 10px; text-align:right;
            border-bottom:1px solid var(--border); }
        .sw-tebal-tbl td:first-child { text-align:left; font-weight:700; color:var(--gold); }
        .sw-tebal-tbl tbody tr:last-child td { border-bottom:none;
            font-weight:700; color:var(--text); }

        /* ─── Pct bar in summary ─── */
        .sw-pct-wrap { display:flex; align-items:center; gap:6px; }
        .sw-pct-bar  { flex:1; background:var(--border); border-radius:4px; height:6px; overflow:hidden; }
        .sw-pct-fill { height:100%; border-radius:4px; background:var(--gold); }
        .sw-pct-num  { font-size:10px; color:var(--muted); min-width:32px; text-align:right; }

        @media (max-width: 600px) {
            .sw-palet-tbl th:nth-child(3),
            .sw-palet-tbl td:nth-child(3) { display:none; }
        }
    `;
    document.head.appendChild(s);
}

// ─────────────────────────────────────────────────
// KALKULASI VOLUME PALET
// ─────────────────────────────────────────────────
function hitungVolumeBaris(row) {
    return (parseFloat(row.tebal)||0)/1000
         * (parseFloat(row.lebar)||0)/100
         * (parseFloat(row.panjang)||0)/100
         * (parseFloat(row.sap)||0);
}
function hitungTotalVolumePalet() {
    return window.paletRows.reduce((s, r) => s + hitungVolumeBaris(r), 0);
}

function updateTotalDanRendemen() {
    const sawmill  = parseFloat(document.getElementById('p-sawmill')?.value) || 0;
    const totalVol = hitungTotalVolumePalet();
    const el = document.getElementById('p-totalvolume');
    if (el) el.value = totalVol.toFixed(4);
    const elR = document.getElementById('p-randemen');
    const pct = sawmill > 0 ? (totalVol / sawmill) * 100 : 0;
    if (elR) elR.value = pct.toFixed(2);

    // live gauge di form
    const gauge = document.getElementById('form-rend-gauge');
    if (gauge) {
        const cls  = pct >= RENDEMEN_TARGET ? 'rend-good' : (pct >= RENDEMEN_WARNING ? 'rend-warn' : 'rend-bad');
        const clsC = pct >= RENDEMEN_TARGET ? 'rend-c-good' : (pct >= RENDEMEN_WARNING ? 'rend-c-warn' : 'rend-c-bad');
        gauge.innerHTML = `
            <div class="rend-gauge-wrap">
                <div class="rend-bar-outer">
                    <div class="rend-bar-inner ${cls}" style="width:${Math.min(pct,100).toFixed(1)}%;"></div>
                </div>
                <div class="rend-pct ${clsC}">${pct.toFixed(1)}%</div>
            </div>
            <div style="font-size:9px; color:var(--muted); margin-top:3px;">
                Target: ${RENDEMEN_TARGET}% &nbsp;|&nbsp; Warning: ${RENDEMEN_WARNING}%
            </div>`;
    }
}

function updateRowVolume(index) {
    const vol = hitungVolumeBaris(window.paletRows[index]);
    const el  = document.getElementById(`palet-vol-${index}`);
    if (el) el.textContent = vol.toFixed(4);
    updateTotalDanRendemen();
}

window.onPaletInput = function(index, field, value) {
    window.paletRows[index][field] = value;
    updateRowVolume(index);
};

window.addPaletRow = function() {
    window.paletRows.push({ jumlah:'', tebal:'', lebar:'', panjang:'', sap:'' });
    renderPaletRows();
    updateTotalDanRendemen();
};

window.removePaletRow = function(index) {
    window.paletRows.splice(index, 1);
    renderPaletRows();
    updateTotalDanRendemen();
};

function renderPaletRows() {
    const c = document.getElementById('palet-container');
    if (!c) return;
    if (!window.paletRows.length) {
        c.innerHTML = '<div class="empty" style="padding:16px; color:var(--muted); font-size:12px;">Belum ada palet. Klik "+ Tambah Palet".</div>';
        return;
    }
    let html = `<div style="overflow-x:auto;">
        <table class="palet-input-tbl">
            <thead><tr>
                <th>No</th>
                <th>Jml Palet</th>
                <th>Tebal (mm)</th>
                <th>Lebar (cm)</th>
                <th>Panjang (cm)</th>
                <th>SAP (lbr)</th>
                <th>Volume (m³)</th>
                <th></th>
            </tr></thead>
            <tbody>`;
    window.paletRows.forEach((p, i) => {
        const vol = hitungVolumeBaris(p);
        html += `<tr>
            <td style="text-align:center; color:var(--muted); padding:4px 8px;">${i+1}</td>
            <td><input type="number" step="any" min="0" value="${p.jumlah}" placeholder="0"
                oninput="window.onPaletInput(${i},'jumlah',this.value)"></td>
            <td><input type="number" step="any" min="0" value="${p.tebal}" placeholder="mm"
                oninput="window.onPaletInput(${i},'tebal',this.value)"></td>
            <td><input type="number" step="any" min="0" value="${p.lebar}" placeholder="cm"
                oninput="window.onPaletInput(${i},'lebar',this.value)"></td>
            <td><input type="number" step="any" min="0" value="${p.panjang}" placeholder="cm"
                oninput="window.onPaletInput(${i},'panjang',this.value)"></td>
            <td><input type="number" step="any" min="0" value="${p.sap}" placeholder="lbr"
                oninput="window.onPaletInput(${i},'sap',this.value)"></td>
            <td style="text-align:right; padding:4px 8px; font-weight:700; color:var(--gold);"
                id="palet-vol-${i}">${vol.toFixed(4)}</td>
            <td style="text-align:center; padding:4px 4px;">
                <button class="btn-del" style="padding:2px 8px; font-size:12px;"
                    onclick="window.removePaletRow(${i})">✕</button></td>
        </tr>`;
    });
    // Baris total
    const totalSAP = window.paletRows.reduce((s,r) => s+(parseFloat(r.sap)||0), 0);
    const totalJml = window.paletRows.reduce((s,r) => s+(parseFloat(r.jumlah)||0), 0);
    const totalVol = hitungTotalVolumePalet();
    html += `<tr style="background:var(--bg3); font-weight:700;">
        <td colspan="5" style="text-align:right; padding:6px 8px; color:var(--muted); font-size:11px;">TOTAL</td>
        <td style="text-align:right; padding:6px 8px; color:var(--gold);">${fmtDec(totalSAP,0)} lbr</td>
        <td style="text-align:right; padding:6px 8px; color:var(--gold);">${totalVol.toFixed(4)}</td>
        <td></td>
    </tr>`;
    html += `</tbody></table></div>`;
    c.innerHTML = html;
}

// ─────────────────────────────────────────────────
// BANGUN FORM SAWMILL
// ─────────────────────────────────────────────────
function buildSawmillForm() {
    const container = document.getElementById('sawmill-form-container');
    if (!container || container.querySelector('#p-tanggal')) return;
    container.innerHTML = `
        <div class="form-title" id="sawmill-form-title">➕ Input Laporan Sawmill</div>

        <!-- ─ BARIS 1: Tanggal, Shift, No Batch Kayu ─ -->
        <div class="grid3">
            <div class="field"><label>Tanggal *</label>
                <input type="date" id="p-tanggal"></div>
            <div class="field"><label>Shift</label>
                <select id="p-shift">
                    <option value="full">Full Day</option>
                    <option value="pagi">Pagi</option>
                    <option value="siang">Siang</option>
                </select></div>
            <div class="field"><label>No. Batch / Referensi Kayu</label>
                <input type="text" id="p-batchkayu" placeholder="Opsional"></div>
        </div>

        <!-- ─ BARIS 2: Volume & Rendemen ─ -->
        <div class="grid3">
            <div class="field"><label>Proses Sawmill (m³) *</label>
                <input type="number" step="any" id="p-sawmill"
                    oninput="updateTotalDanRendemen()" placeholder="Volume kayu diproses"></div>
            <div class="field"><label>Rendemen (%)</label>
                <input type="number" step="any" id="p-randemen" readonly
                    style="background:var(--bg3); cursor:default;">
                <div id="form-rend-gauge" style="margin-top:4px;"></div>
            </div>
            <div class="field"><label>Total Volume Palet (m³)</label>
                <input type="number" step="any" id="p-totalvolume" readonly
                    style="background:var(--bg3); cursor:default;"></div>
        </div>

        <!-- ─ PALET ─ -->
        <div class="section-head" style="margin-top:10px;">
            🪵 Palet yang Dihasilkan
            <span style="font-size:10px; color:var(--muted); font-weight:400;">
              (Volume = Tebal/1000 × Lebar/100 × Panjang/100 × SAP)
            </span>
        </div>
        <div id="palet-container"></div>
        <div style="margin-top:8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.addPaletRow()">+ Tambah Palet</button>
        </div>

        <!-- ─ TENAGA KERJA ─ -->
        <div class="section-head" style="margin-top:14px;">👷 Tenaga Kerja</div>
        <div class="grid3">
            <div class="field"><label>Masuk</label>
                <input type="number" min="0" id="p-masuk" placeholder="0"></div>
            <div class="field"><label>Tidak Masuk</label>
                <input type="number" min="0" id="p-tidakmasuk" placeholder="0"></div>
            <div class="field"><label>Produktivitas Est. (m³/orang)</label>
                <input type="number" id="p-produktivitas" readonly
                    style="background:var(--bg3); cursor:default;"></div>
        </div>

        <!-- ─ CATATAN ─ -->
        <div class="field" style="margin-top:4px;">
            <label>Catatan</label>
            <textarea id="p-catatan" rows="2" placeholder="Hambatan, kondisi mesin, dll."></textarea>
        </div>

        <!-- ─ OVEN ─ -->
        <div class="section-head" style="margin-top:14px;">🔥 Oven (opsional)</div>
        <div class="grid3">
            <div class="field"><label>Chamber</label>
                <select id="p-chamber">
                    <option value="">-- Tidak masuk oven --</option>
                    ${[1,2,3,4,5,6,7].map(i=>`<option value="${i}">Chamber ${i}</option>`).join('')}
                </select></div>
            <div class="field"><label>Volume Oven (m³)</label>
                <input type="number" step="any" id="p-volumeOven" placeholder="0"></div>
            <div class="field"><label>Tgl Mulai Oven</label>
                <input type="date" id="p-tanggalOven"></div>
        </div>

        <div class="form-actions">
            <button class="btn btn-secondary" onclick="window.closeSawmillForm()">Batal</button>
            <button class="btn btn-primary" onclick="window.saveSawmill()">💾 Simpan Laporan</button>
        </div>
    `;

    // Auto-update produktivitas
    ['p-masuk','p-totalvolume'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateProduktivitas);
    });

    // ── Auto-fill oven: saat chamber dipilih → isi volume & tanggal otomatis ──
    document.getElementById('p-chamber')?.addEventListener('change', function () {
        if (!this.value) return;
        const volOvenEl = document.getElementById('p-volumeOven');
        const tglOvenEl = document.getElementById('p-tanggalOven');
        // Volume oven = total volume palet hari ini (jika belum diisi manual)
        if (volOvenEl && !volOvenEl.value) {
            const totalVol = parseFloat(document.getElementById('p-totalvolume')?.value) || 0;
            if (totalVol > 0) volOvenEl.value = totalVol.toFixed(4);
        }
        // Tanggal oven = tanggal laporan hari ini (jika belum diisi manual)
        if (tglOvenEl && !tglOvenEl.value) {
            tglOvenEl.value = document.getElementById('p-tanggal')?.value || today();
        }
    });

    // ── Saat total volume palet berubah → perbarui volume oven jika chamber sudah dipilih ──
    const origUpdateTotal = updateTotalDanRendemen;
    const pTotalVolumeEl = document.getElementById('p-totalvolume');
    const observer = new MutationObserver(() => {
        const chamberEl = document.getElementById('p-chamber');
        const volOvenEl = document.getElementById('p-volumeOven');
        if (chamberEl?.value && volOvenEl) {
            const newVol = parseFloat(pTotalVolumeEl?.value) || 0;
            if (newVol > 0) volOvenEl.value = newVol.toFixed(4);
        }
    });
    if (pTotalVolumeEl) observer.observe(pTotalVolumeEl, { attributes: true, attributeFilter: ['value'] });

    // Patch updateTotalDanRendemen agar volume oven ikut update
    window._origUpdateTotalDanRendemen = updateTotalDanRendemen;
    window.updateTotalDanRendemen = function () {
        window._origUpdateTotalDanRendemen();
        const chamberEl = document.getElementById('p-chamber');
        const volOvenEl = document.getElementById('p-volumeOven');
        const totalVolEl = document.getElementById('p-totalvolume');
        if (chamberEl?.value && volOvenEl && totalVolEl) {
            const v = parseFloat(totalVolEl.value) || 0;
            if (v > 0) volOvenEl.value = v.toFixed(4);
        }
    };
}

function updateProduktivitas() {
    const masuk = parseInt(document.getElementById('p-masuk')?.value) || 0;
    const vol   = parseFloat(document.getElementById('p-totalvolume')?.value) || 0;
    const el    = document.getElementById('p-produktivitas');
    if (el) el.value = masuk > 0 ? (vol / masuk).toFixed(4) : '0';
}

// ─────────────────────────────────────────────────
// OPEN / CLOSE FORM
// ─────────────────────────────────────────────────
window.openSawmillForm = function(item) {
    sawmillEditId = item?.id || null;
    window.paletRows = [];
    buildSawmillForm();

    if (item) {
        window.paletRows = JSON.parse(JSON.stringify(item.hasilPalet || []));
        document.getElementById('p-tanggal').value       = item.tanggal       || '';
        document.getElementById('p-shift').value         = item.shift         || 'full';
        document.getElementById('p-batchkayu').value     = item.batchKayu     || '';
        document.getElementById('p-sawmill').value       = item.prosesSawmill || '';
        document.getElementById('p-masuk').value         = item.tenagaMasuk   || '';
        document.getElementById('p-tidakmasuk').value    = item.tenagaTidakMasuk || '';
        document.getElementById('p-catatan').value       = item.catatan       || '';
        document.getElementById('p-chamber').value       = item.chamber       || '';
        document.getElementById('p-volumeOven').value    = item.volumeOven    || '';
        document.getElementById('p-tanggalOven').value   = item.tanggalOven   || '';
        document.getElementById('sawmill-form-title').textContent = '✏️ Edit Laporan Sawmill';
    } else {
        document.getElementById('p-tanggal').value       = today();
        document.getElementById('p-shift').value         = 'full';
        document.getElementById('p-batchkayu').value     = '';
        document.getElementById('p-sawmill').value       = '';
        document.getElementById('p-masuk').value         = '';
        document.getElementById('p-tidakmasuk').value    = '';
        document.getElementById('p-catatan').value       = '';
        document.getElementById('p-chamber').value       = '';
        document.getElementById('p-volumeOven').value    = '';
        document.getElementById('p-tanggalOven').value   = '';
        document.getElementById('sawmill-form-title').textContent = '➕ Input Laporan Sawmill';
    }

    renderPaletRows();
    updateTotalDanRendemen();
    updateProduktivitas();

    document.getElementById('sawmill-input').classList.remove('hidden');
    document.getElementById('sawmill-list').classList.add('hidden');
};

window.closeSawmillForm = function() {
    document.getElementById('sawmill-input').classList.add('hidden');
    document.getElementById('sawmill-list').classList.remove('hidden');
    sawmillEditId = null;
    window.paletRows = [];
};

// ─────────────────────────────────────────────────
// SIMPAN LAPORAN
// ─────────────────────────────────────────────────
function closePreviousOvenByOpenNo(openNo, excludeHistoryId = null) {
    const h = (window.ovenHistoryList || []).find(
        h => h.openNo === openNo && h.status === 'active' && h.id !== excludeHistoryId);
    if (h) {
        h.status = 'completed';
        h.tanggalSelesai = today();
        const oi = (window.ovenList || []).findIndex(o => o.chamber === h.chamber);
        if (oi !== -1 && window.ovenList[oi].status === 'active')
            window.ovenList[oi] = { chamber: h.chamber, volume:0, tanggalMulai:'', status:'empty' };
    }
}

window.saveSawmill = function() {
    const tgl = document.getElementById('p-tanggal')?.value;
    if (!tgl) { toast('⚠️ Tanggal wajib!'); return; }
    updateTotalDanRendemen();

    const hasilPalet = window.paletRows
        .filter(p => (parseFloat(p.tebal)||0) > 0 && (parseFloat(p.lebar)||0) > 0
                  && (parseFloat(p.panjang)||0) > 0 && (parseFloat(p.sap)||0) > 0)
        .map(p => ({
            jumlah:  parseFloat(p.jumlah)  || 0,
            tebal:   parseFloat(p.tebal)   || 0,
            lebar:   parseFloat(p.lebar)   || 0,
            panjang: parseFloat(p.panjang) || 0,
            sap:     parseFloat(p.sap)     || 0,
            volume:  hitungVolumeBaris(p)
        }));

    const totalVolumePalet = hasilPalet.reduce((s,p) => s+p.volume, 0);
    const prosesSawmill    = parseFloat(document.getElementById('p-sawmill')?.value) || 0;
    const masuk            = parseInt(document.getElementById('p-masuk')?.value)     || 0;
    const selectedChamber  = document.getElementById('p-chamber')?.value;
    const volumeOven       = parseFloat(document.getElementById('p-volumeOven')?.value) || 0;
    const tanggalOven      = document.getElementById('p-tanggalOven')?.value || '';

    const item = {
        id:                sawmillEditId || uid(),
        tanggal:           tgl,
        shift:             document.getElementById('p-shift')?.value || 'full',
        batchKayu:         document.getElementById('p-batchkayu')?.value?.trim() || '',
        prosesSawmill:     prosesSawmill,
        randemanSawmill:   prosesSawmill > 0 ? (totalVolumePalet/prosesSawmill)*100 : 0,
        openNo:            `SW-${sawmillEditId || Date.now()}`,
        hasilPalet:        hasilPalet,
        totalPalet:        hasilPalet.reduce((s,p) => s+(p.jumlah||0), 0),
        totalVolumePalet:  totalVolumePalet,
        totalSap:          hasilPalet.reduce((s,p) => s+p.sap, 0),
        tenagaMasuk:       masuk,
        tenagaTidakMasuk:  parseInt(document.getElementById('p-tidakmasuk')?.value) || 0,
        produktivitas:     masuk > 0 ? totalVolumePalet/masuk : 0,
        catatan:           document.getElementById('p-catatan')?.value || '',
        chamber:           selectedChamber || '',
        volumeOven:        volumeOven,
        tanggalOven:       tanggalOven
    };

    if (sawmillEditId) {
        closePreviousOvenByOpenNo(item.openNo, sawmillEditId);
        window.sawmillList = window.sawmillList.map(x => x.id === sawmillEditId ? item : x);
        logActivity('Update', 'Sawmill', `${tgl} Rendemen:${item.randemanSawmill.toFixed(1)}%`);
    } else {
        window.sawmillList.push(item);
        logActivity('Simpan', 'Sawmill', `${tgl} Rendemen:${item.randemanSawmill.toFixed(1)}%`);
    }

    // ── Oven handling — format disesuaikan dengan oven.js ──
    if (selectedChamber && volumeOven > 0 && tanggalOven) {
        const ovenChamber = parseInt(selectedChamber);

        // Helper: hitung tglTarget (+7 hari standar pengeringan)
        const _addHari = (tgl, hari) => {
            const d = new Date(tgl);
            d.setDate(d.getDate() + hari);
            return d.toISOString().split('T')[0];
        };
        const DURASI_OVEN = (typeof DURASI_NORMAL_HARI !== 'undefined') ? DURASI_NORMAL_HARI : 7;
        const tglTarget = _addHari(tanggalOven, DURASI_OVEN);

        // Buat entry ovenList dengan format yang sesuai oven.js
        const buatEntryOven = (existingId) => ({
            id:         existingId || uid(),
            chamber:    ovenChamber,
            openNo:     item.openNo,
            volume:     volumeOven,
            tglMulai:   tanggalOven,
            tglTarget:  tglTarget,
            tglSelesai: '',
            suhu:       null,
            catatan:    `Auto dari sawmill ${tgl}`,
            status:     'isi'
        });

        if (!window.ovenList) window.ovenList = [];

        if (sawmillEditId) {
            // Mode edit: cari entri oven yang sudah ada berdasarkan openNo
            const existIdx = window.ovenList.findIndex(o => o.openNo === item.openNo && o.status === 'isi');
            if (existIdx !== -1) {
                // Update entry yang ada
                const old = window.ovenList[existIdx];
                window.ovenList[existIdx] = { ...buatEntryOven(old.id), suhu: old.suhu, catatan: old.catatan };
            } else {
                // Tambah baru (kemungkinan openNo berubah)
                const chamberIdx = window.ovenList.findIndex(o => o.chamber === ovenChamber && o.status === 'isi');
                if (chamberIdx !== -1) window.ovenList[chamberIdx] = buatEntryOven(window.ovenList[chamberIdx].id);
                else window.ovenList.push(buatEntryOven());
            }
        } else {
            // Mode tambah baru
            const existActive = window.ovenList.find(o => o.chamber === ovenChamber && o.status === 'isi');
            if (existActive) {
                if (!confirmDialog(`Chamber ${ovenChamber} masih aktif (Open ${existActive.openNo || '?'}). Ganti data oven chamber ini?`)) {
                    // User batalkan — skip oven
                    persistAll();
                    window.closeSawmillForm();
                    window.renderSawmill();
                    if (typeof window.renderOven === 'function') window.renderOven();
                    if (typeof window.renderBatch === 'function') window.renderBatch();
                    toast('✅ Laporan sawmill disimpan! (Oven tidak diubah)');
                    return;
                }
                // Tandai chamber lama sebagai selesai
                existActive.status    = 'selesai';
                existActive.tglSelesai = today();
            }
            window.ovenList.push(buatEntryOven());
        }
    }

    persistAll();
    window.closeSawmillForm();
    window.renderSawmill();
    if (typeof window.renderOven       === 'function') window.renderOven();   // sync ke tab oven
    if (typeof window.renderBatch      === 'function') window.renderBatch();
    toast('✅ Laporan sawmill disimpan! Data oven diperbarui otomatis.');
};

// ─────────────────────────────────────────────────
// DELETE / EDIT
// ─────────────────────────────────────────────────
window.deleteSawmill = function(id) {
    if (!confirmDialog('Hapus laporan ini?')) return;
    const item = (window.sawmillList||[]).find(x=>x.id===id);
    if (item) logActivity('Hapus','Sawmill',`${item.tanggal}`);
    window.sawmillList = (window.sawmillList||[]).filter(x=>x.id!==id);
    persistAll();
    window.renderSawmill();
    if (typeof window.renderOven       === 'function') window.renderOven();   // sync ke tab oven
    if (typeof window.renderBatch      === 'function') window.renderBatch();
    toast('🗑️ Laporan dihapus.');
};

window.editSawmill = function(id) {
    const item = (window.sawmillList||[]).find(x=>x.id===id);
    if (item) window.openSawmillForm(item);
};

// ─────────────────────────────────────────────────
// HELPER: Rendemen class
// ─────────────────────────────────────────────────
function rendClass(pct) {
    return pct >= RENDEMEN_TARGET ? 'rend-good' : (pct >= RENDEMEN_WARNING ? 'rend-warn' : 'rend-bad');
}
function rendClassC(pct) {
    return pct >= RENDEMEN_TARGET ? 'rend-c-good' : (pct >= RENDEMEN_WARNING ? 'rend-c-warn' : 'rend-c-bad');
}
function rendCardClass(pct) {
    return pct >= RENDEMEN_TARGET ? 'rend-card-good' : (pct >= RENDEMEN_WARNING ? 'rend-card-warn' : 'rend-card-bad');
}

// ─────────────────────────────────────────────────
// FILTER BULAN — stabil
// ─────────────────────────────────────────────────
function generateMonthOptions() {
    const opts = [];
    const now  = new Date();
    const cur  = now.toISOString().slice(0,7);
    opts.push(`<option value="${cur}">Bulan ini (${cur})</option>`);
    for (let i=1; i<=11; i++) {
        const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
        const m = d.toISOString().slice(0,7);
        opts.push(`<option value="${m}">${m}</option>`);
    }
    opts.push('<option value="all">Semua Bulan</option>');
    return opts.join('');
}

function getFilteredSawmill() {
    let bulan = localStorage.getItem('sawmill_filter_month') || new Date().toISOString().slice(0,7);
    if (bulan === 'all') return [...(window.sawmillList||[])];
    return (window.sawmillList||[]).filter(s => s.tanggal && s.tanggal.startsWith(bulan));
}
function getCurrentFilter() {
    return localStorage.getItem('sawmill_filter_month') || new Date().toISOString().slice(0,7);
}

// ─────────────────────────────────────────────────
// RENDER UTAMA
// ─────────────────────────────────────────────────
window.renderSawmill = function() {
    injectSawmillStyles();
    const container = document.getElementById('sawmill-list');
    if (!container) return;

    const allData  = window.sawmillList || [];
    const bulan    = getCurrentFilter();
    const filtered = sortByDateAsc(getFilteredSawmill());

    // Search
    let shown = filtered;
    if (sawmillSearch) {
        const q = sawmillSearch.toLowerCase();
        shown = filtered.filter(s =>
            (s.catatan||'').toLowerCase().includes(q) ||
            (s.batchKayu||'').toLowerCase().includes(q) ||
            (s.tanggal||'').includes(q));
    }

    // ── KPI bulan ini ──
    const volTotal    = filtered.reduce((s,x) => s+(x.prosesSawmill||0), 0);
    const paletVol    = filtered.reduce((s,x) => s+(x.totalVolumePalet||0), 0);
    const avgRendemen = volTotal > 0 ? (paletVol/volTotal)*100 : 0;
    const totalSAP    = filtered.reduce((s,x) => s+(x.totalSap||0), 0);
    const totalTK     = filtered.reduce((s,x) => s+(x.tenagaMasuk||0), 0);
    const prodTK      = totalTK > 0 ? paletVol/totalTK : 0;

    // ── Sparkline data (rendemen per laporan, terbaru 10) ──
    const sparkData = [...filtered].slice(-10).map(x => x.randemanSawmill||0);

    const countEl = document.getElementById('sawmill-count');
    if (countEl) countEl.textContent = `${allData.length} laporan (filter: ${filtered.length} tampil)`;

    // ─────── Build HTML ───────
    let html = `
        <!-- KPI Cards -->
        <div class="sw-kpi-grid">
            <div class="sw-kpi">
                <div class="sw-kpi-val sw-kv-gold">${fmtDec(volTotal,2)}</div>
                <div class="sw-kpi-lbl">Volume Proses (m³)</div>
            </div>
            <div class="sw-kpi">
                <div class="sw-kpi-val sw-kv-blue">${fmtDec(paletVol,2)}</div>
                <div class="sw-kpi-lbl">Total Palet (m³)</div>
            </div>
            <div class="sw-kpi">
                <div class="sw-kpi-val ${rendClassC(avgRendemen)}">${avgRendemen.toFixed(1)}%</div>
                <div class="sw-kpi-lbl">Avg Rendemen</div>
                <div class="rend-gauge-wrap" style="margin-top:4px;">
                    <div class="rend-bar-outer">
                        <div class="rend-bar-inner ${rendClass(avgRendemen)}"
                            style="width:${Math.min(avgRendemen,100).toFixed(1)}%;"></div>
                    </div>
                </div>
            </div>
            <div class="sw-kpi">
                <div class="sw-kpi-val sw-kv-green">${fmt(totalSAP)}</div>
                <div class="sw-kpi-lbl">Total SAP (lbr)</div>
            </div>
            <div class="sw-kpi">
                <div class="sw-kpi-val sw-kv-orange">${fmtDec(prodTK,3)}</div>
                <div class="sw-kpi-lbl">Produktivitas (m³/org)</div>
            </div>
            <div class="sw-kpi">
                <div class="sw-kpi-val sw-kv-muted">${filtered.length}</div>
                <div class="sw-kpi-lbl">Hari Laporan</div>
            </div>
        </div>

        <!-- Trend Rendemen Sparkline -->
        ${sparkData.length > 1 ? `
        <div style="background:var(--bg3); border:1px solid var(--border); border-radius:10px;
            padding:12px 14px; margin-bottom:14px;">
            <div style="font-size:10px; color:var(--muted); text-transform:uppercase;
                letter-spacing:.08em; margin-bottom:8px;">
                📈 Tren Rendemen — ${sparkData.length} laporan terakhir
            </div>
            <div class="sw-sparkline">
                ${sparkData.map((v,i) => {
                    const h = Math.max(10, Math.min(100, (v/60)*100));
                    const clr = v >= RENDEMEN_TARGET ? '#22c55e' : (v >= RENDEMEN_WARNING ? '#f97316' : '#f87171');
                    return `<div class="sw-spark-bar" title="${v.toFixed(1)}%"
                        style="height:${h}%; background:${clr};"></div>`;
                }).join('')}
            </div>
            <div style="display:flex; justify-content:space-between;
                font-size:9px; color:var(--muted); margin-top:4px;">
                <span>Terlama</span><span>Terbaru</span>
            </div>
        </div>` : ''}

        <!-- Filter & Search -->
        <div class="sw-toolbar">
            <select id="sawmill-filter-bulan" onchange="onSawmillFilterChange(this.value)">
                ${generateMonthOptions()}
            </select>
            <input type="text" id="sawmill-search-input"
                placeholder="🔍 Cari catatan, batch, atau tanggal..."
                value="${sawmillSearch}"
                oninput="onSawmillSearch(this.value)">
        </div>
    `;

    // Set nilai filter dropdown
    setTimeout(() => {
        const sel = document.getElementById('sawmill-filter-bulan');
        if (sel) {
            const saved = getCurrentFilter();
            if (sel.querySelector(`option[value="${saved}"]`)) sel.value = saved;
        }
    }, 0);

    // ── Laporan Cards ──
    if (!shown.length) {
        html += `<div class="empty" style="padding:40px; text-align:center; color:var(--muted);">
            📭 Tidak ada laporan sesuai filter.</div>`;
    } else {
        // Urutkan terbaru di atas untuk tampilan
        [...shown].reverse().forEach(lap => {
            const totalVol   = lap.totalVolumePalet || 0;
            const totalSap   = lap.totalSap || (lap.hasilPalet||[]).reduce((s,p)=>s+p.sap,0);
            const totalJml   = lap.totalPalet || (lap.hasilPalet||[]).reduce((s,p)=>s+(p.jumlah||0),0);
            const rend       = lap.randemanSawmill || 0;
            const totalJenis = (lap.hasilPalet||[]).length;
            const prod       = lap.produktivitas
                             || ((lap.tenagaMasuk||0)>0 ? totalVol/(lap.tenagaMasuk) : 0);

            // Shift badge
            const shiftMap = { pagi:'badge-shift-pagi', siang:'badge-shift-siang', full:'badge-shift-full' };
            const shiftLbl = { pagi:'🌅 Pagi', siang:'🌆 Siang', full:'🔄 Full Day' };
            const shiftKey = lap.shift || 'full';

            // Palet table
            let paletHtml = '';
            if ((lap.hasilPalet||[]).length) {
                const rows = lap.hasilPalet.map((p,i) =>
                    `<tr>
                        <td>${i+1}</td>
                        <td>${p.jumlah||0}</td>
                        <td>${p.tebal}</td>
                        <td>${p.lebar}</td>
                        <td>${p.panjang}</td>
                        <td>${p.sap}</td>
                        <td class="vol-col">${p.volume.toFixed(4)}</td>
                    </tr>`).join('');

                paletHtml = `<div style="overflow-x:auto; margin-top:10px;">
                    <table class="sw-palet-tbl">
                        <thead><tr>
                            <th>No</th><th>Jml</th><th>Tebal(mm)</th>
                            <th>Lebar(cm)</th><th>Pjg(cm)</th><th>SAP</th><th>Vol(m³)</th>
                        </tr></thead>
                        <tbody>
                            ${rows}
                            <tr style="background:var(--bg3);">
                                <td colspan="3" style="text-align:right; color:var(--muted); font-size:10px; padding:5px 8px;">TOTAL</td>
                                <td colspan="2" style="text-align:right;">${fmtDec(totalSap,0)} lbr</td>
                                <td></td>
                                <td class="vol-col">${totalVol.toFixed(4)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>`;
            }

            html += `
            <div class="sw-card ${rendCardClass(rend)}">
                <div class="sw-card-header">
                    <div>
                        <div class="sw-card-title">
                            📅 ${fmtDate(lap.tanggal)}
                            <span class="sw-card-badge ${shiftMap[shiftKey]}">${shiftLbl[shiftKey]}</span>
                            ${lap.batchKayu ? `<span style="font-size:11px; color:var(--muted); font-weight:400; margin-left:6px;">Batch: ${lap.batchKayu}</span>` : ''}
                        </div>
                        <div class="sw-card-sub">
                            ${totalJenis} jenis · ${fmt(totalJml)} palet · ${fmtDec(totalVol,3)} m³ palet
                        </div>
                    </div>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <button class="btn btn-edit btn-sm" onclick="window.editSawmill('${lap.id}')">✏️</button>
                        <button class="btn btn-del  btn-sm" onclick="window.deleteSawmill('${lap.id}')">🗑️</button>
                    </div>
                </div>

                <!-- Stat pills -->
                <div class="sw-stats">
                    <div class="sw-stat">
                        <span>Proses Sawmill</span>
                        <strong>${fmtDec(lap.prosesSawmill,2)} m³</strong>
                    </div>
                    <div class="sw-stat">
                        <span>Rendemen</span>
                        <strong class="${rendClassC(rend)}">${fmtDec(rend,2)}%</strong>
                    </div>
                    <div class="sw-stat">
                        <span>Total SAP</span>
                        <strong>${fmt(totalSap)} lbr</strong>
                    </div>
                    <div class="sw-stat">
                        <span>Tenaga Masuk</span>
                        <strong>${lap.tenagaMasuk||0} org</strong>
                    </div>
                    ${prod > 0 ? `<div class="sw-stat">
                        <span>Produktivitas</span>
                        <strong>${fmtDec(prod,3)} m³/org</strong>
                    </div>` : ''}
                    ${lap.chamber ? `<div class="sw-stat">
                        <span>Oven</span>
                        <strong>Chamber ${lap.chamber} · ${fmtDec(lap.volumeOven,2)} m³</strong>
                    </div>` : ''}
                </div>

                <!-- Rendemen gauge -->
                <div class="rend-gauge-wrap" style="margin-bottom:10px;">
                    <div style="font-size:10px; color:var(--muted); min-width:64px;">Rendemen</div>
                    <div class="rend-bar-outer">
                        <div class="rend-bar-inner ${rendClass(rend)}"
                            style="width:${Math.min(rend,100).toFixed(1)}%;"></div>
                    </div>
                    <div class="rend-pct ${rendClassC(rend)}">${rend.toFixed(1)}%</div>
                </div>

                ${paletHtml}

                ${lap.catatan ? `<div style="margin-top:10px; font-size:11px; color:var(--muted);
                    background:var(--bg); border-radius:6px; padding:8px 10px; border-left:3px solid var(--border);">
                    📝 ${lap.catatan}</div>` : ''}
            </div>`;
        });
    }

    container.innerHTML = html;
};

// Event handlers filter & search
window.onSawmillFilterChange = function(val) {
    localStorage.setItem('sawmill_filter_month', val);
    window.renderSawmill();
};
window.onSawmillSearch = function(val) {
    sawmillSearch = val;
    window.renderSawmill();
};

// ─────────────────────────────────────────────────
// RINGKASAN BULANAN — Diperkaya
// ─────────────────────────────────────────────────
function renderSawmillSummary() {
    const bulan = document.getElementById('sawmill-summary-bulan')?.value || thisMonth();
    const reports = (window.sawmillList||[]).filter(r => r.tanggal && r.tanggal.startsWith(bulan));
    const container = document.getElementById('sawmill-summary-content');
    if (!container) return;

    if (!reports.length) {
        container.innerHTML = '<div class="empty">📭 Tidak ada laporan sawmill pada bulan ini.</div>';
        return;
    }

    const allPalet   = reports.flatMap(r => r.hasilPalet||[]);
    const totalProses = reports.reduce((s,r) => s+(r.prosesSawmill||0), 0);
    const totalPaletVol = allPalet.reduce((s,p) => s+p.volume, 0);
    const avgRend    = totalProses > 0 ? (totalPaletVol/totalProses)*100 : 0;
    const totalSAP   = allPalet.reduce((s,p) => s+p.sap, 0);
    const totalJml   = allPalet.reduce((s,p) => s+(p.jumlah||0), 0);
    const totalTK    = reports.reduce((s,r) => s+(r.tenagaMasuk||0), 0);
    const prodTK     = totalTK > 0 ? totalPaletVol/totalTK : 0;

    // Breakdown per tebal
    const tebalMap = new Map();
    allPalet.forEach(p => {
        if (!tebalMap.has(p.tebal)) tebalMap.set(p.tebal, { volume:0, sap:0, jumlah:0, count:0 });
        const e = tebalMap.get(p.tebal);
        e.volume += p.volume; e.sap += p.sap;
        e.jumlah += (p.jumlah||0); e.count++;
    });
    const sortedTebal = [...tebalMap.keys()].sort((a,b)=>a-b);

    let html = `
        <!-- Summary KPI -->
        <div class="sw-sum-grid" style="margin-top:14px;">
            <div class="sw-sum-card">
                <div class="sw-sum-val">${fmtDec(totalProses,2)}</div>
                <div class="sw-sum-lbl">Vol Proses (m³)</div>
            </div>
            <div class="sw-sum-card">
                <div class="sw-sum-val">${fmtDec(totalPaletVol,2)}</div>
                <div class="sw-sum-lbl">Vol Palet (m³)</div>
            </div>
            <div class="sw-sum-card">
                <div class="sw-sum-val ${rendClassC(avgRend)}">${avgRend.toFixed(1)}%</div>
                <div class="sw-sum-lbl">Avg Rendemen</div>
            </div>
            <div class="sw-sum-card">
                <div class="sw-sum-val">${fmt(totalSAP)}</div>
                <div class="sw-sum-lbl">Total SAP (lbr)</div>
            </div>
            <div class="sw-sum-card">
                <div class="sw-sum-val">${fmt(totalJml)}</div>
                <div class="sw-sum-lbl">Total Palet (lbr)</div>
            </div>
            <div class="sw-sum-card">
                <div class="sw-sum-val">${fmtDec(prodTK,3)}</div>
                <div class="sw-sum-lbl">Prod. TK (m³/org)</div>
            </div>
        </div>

        <!-- Rendemen gauge bulanan -->
        <div style="background:var(--bg3); border:1px solid var(--border);
            border-radius:10px; padding:12px 14px; margin-bottom:16px;">
            <div style="font-size:11px; color:var(--muted); margin-bottom:6px;">
                Rendemen Rata-rata vs Target (${RENDEMEN_TARGET}%)
            </div>
            <div class="rend-gauge-wrap">
                <div class="rend-bar-outer" style="height:12px; border-radius:8px;">
                    <div class="rend-bar-inner ${rendClass(avgRend)}"
                        style="width:${Math.min(avgRend,100).toFixed(1)}%; border-radius:8px;"></div>
                </div>
                <div class="rend-pct ${rendClassC(avgRend)}" style="font-size:14px;">${avgRend.toFixed(1)}%</div>
            </div>
            ${avgRend < RENDEMEN_WARNING
                ? `<div style="margin-top:6px; font-size:11px; color:#f87171;">
                    ⚠️ Rendemen di bawah batas minimum ${RENDEMEN_WARNING}% — perlu evaluasi bahan baku atau proses.</div>`
                : avgRend < RENDEMEN_TARGET
                ? `<div style="margin-top:6px; font-size:11px; color:var(--orange);">
                    ⚠️ Rendemen belum mencapai target ${RENDEMEN_TARGET}%.</div>`
                : `<div style="margin-top:6px; font-size:11px; color:var(--green);">
                    ✅ Rendemen memenuhi target ${RENDEMEN_TARGET}%.</div>`}
        </div>

        <!-- Breakdown per tebal -->
        <div style="font-size:11px; font-weight:600; color:var(--muted);
            text-transform:uppercase; letter-spacing:.08em; margin-bottom:8px;">
            📊 Breakdown per Ketebalan
        </div>
        <div style="overflow-x:auto;">
            <table class="sw-tebal-tbl">
                <thead><tr>
                    <th>Tebal (mm)</th>
                    <th>Volume (m³)</th>
                    <th>% dari Total</th>
                    <th>SAP (lbr)</th>
                    <th>Jml Palet</th>
                    <th>Jenis Dim.</th>
                </tr></thead>
                <tbody>`;

    sortedTebal.forEach(tebal => {
        const d   = tebalMap.get(tebal);
        const pct = totalPaletVol > 0 ? (d.volume/totalPaletVol)*100 : 0;
        html += `<tr>
            <td>${tebal}</td>
            <td>${fmtDec(d.volume,4)}</td>
            <td>
                <div class="sw-pct-wrap">
                    <div class="sw-pct-bar">
                        <div class="sw-pct-fill" style="width:${pct.toFixed(1)}%;"></div>
                    </div>
                    <div class="sw-pct-num">${pct.toFixed(1)}%</div>
                </div>
            </td>
            <td>${fmt(d.sap)}</td>
            <td>${fmt(d.jumlah)}</td>
            <td>${d.count}</td>
        </tr>`;
    });

    // Baris total
    html += `<tr>
        <td>TOTAL</td>
        <td>${fmtDec(totalPaletVol,4)}</td>
        <td><div class="sw-pct-wrap">
            <div class="sw-pct-bar"><div class="sw-pct-fill" style="width:100%;"></div></div>
            <div class="sw-pct-num">100%</div></div></td>
        <td>${fmt(totalSAP)}</td>
        <td>${fmt(totalJml)}</td>
        <td>${allPalet.length}</td>
    </tr>`;

    html += `</tbody></table></div>

        <!-- Rendemen per laporan -->
        <div style="font-size:11px; font-weight:600; color:var(--muted);
            text-transform:uppercase; letter-spacing:.08em; margin:16px 0 8px;">
            📅 Rendemen per Laporan Harian
        </div>
        <div style="overflow-x:auto;">
            <table class="sw-tebal-tbl">
                <thead><tr>
                    <th style="text-align:left;">Tanggal</th>
                    <th>Shift</th>
                    <th>Vol Proses</th>
                    <th>Vol Palet</th>
                    <th>Rendemen</th>
                    <th>TK Masuk</th>
                    <th>Produktivitas</th>
                </tr></thead>
                <tbody>`;

    [...reports].sort((a,b)=>(a.tanggal||'').localeCompare(b.tanggal||'')).forEach(r => {
        const rd  = r.randemanSawmill||0;
        const pd  = r.produktivitas || ((r.tenagaMasuk||0)>0 ? (r.totalVolumePalet||0)/r.tenagaMasuk : 0);
        const shiftLbl = { pagi:'🌅 Pagi', siang:'🌆 Siang', full:'🔄 Full' };
        html += `<tr>
            <td style="text-align:left; font-weight:600;">${fmtDate(r.tanggal)}</td>
            <td>${shiftLbl[r.shift||'full']||'—'}</td>
            <td>${fmtDec(r.prosesSawmill||0,2)} m³</td>
            <td>${fmtDec(r.totalVolumePalet||0,4)} m³</td>
            <td><span class="${rendClassC(rd)}" style="font-weight:700;">${rd.toFixed(2)}%</span></td>
            <td>${r.tenagaMasuk||0} org</td>
            <td>${pd>0 ? fmtDec(pd,4)+' m³/org' : '—'}</td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

// ─────────────────────────────────────────────────
// INIT RINGKASAN TAB
// ─────────────────────────────────────────────────
function initSawmillSummary() {
    const tabSawmill = document.getElementById('tab-sawmill');
    if (!tabSawmill || document.getElementById('sawmill-summary-panel')) return;

    const subtabContainer = tabSawmill.querySelector('.subtab-toggle');
    if (subtabContainer && !subtabContainer.querySelector('[data-subtab="sawmill-summary-panel"]')) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary subtab-btn';
        btn.setAttribute('data-subtab','sawmill-summary-panel');
        btn.textContent = '📊 Rangkuman Bulanan';
        btn.onclick = () => {
            tabSawmill.querySelectorAll('.subtab-panel').forEach(p => p.classList.add('hidden'));
            document.getElementById('sawmill-summary-panel').classList.remove('hidden');
            tabSawmill.querySelectorAll('.subtab-btn').forEach(b => {
                b.classList.remove('active','btn-primary'); b.classList.add('btn-secondary');
            });
            btn.classList.add('active','btn-primary'); btn.classList.remove('btn-secondary');
            renderSawmillSummary();
        };
        subtabContainer.appendChild(btn);
    }

    const panel = document.createElement('div');
    panel.id        = 'sawmill-summary-panel';
    panel.className = 'subtab-panel hidden';
    panel.innerHTML = `
        <div class="form-card">
            <div class="form-title">📊 Rangkuman Perolehan Palet per Bulan</div>
            <div class="grid2">
                <div class="field"><label>Pilih Bulan</label>
                    <input type="month" id="sawmill-summary-bulan" value="${thisMonth()}"></div>
                <div class="field" style="display:flex; align-items:flex-end;">
                    <button class="btn btn-primary" onclick="renderSawmillSummary()">Tampilkan</button>
                </div>
            </div>
            <div id="sawmill-summary-content"></div>
        </div>`;

    const listPanel = document.getElementById('sawmill-list');
    if (listPanel) listPanel.insertAdjacentElement('afterend', panel);
    else tabSawmill.appendChild(panel);
}

// ─────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────
setTimeout(() => {
    initSawmillSummary();
    window.renderSawmill();
}, 500);
