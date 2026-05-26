// sawmill.js — Versi Enhanced
// Fitur baru: KPI summary cards, rendemen gauge berwarna, produktivitas tenaga kerja,
//             trend sparkline, breakdown palet per tebal, form diperluas (shift, no batch kayu),
//             filter search, laporan card yang lebih informatif

window.paletRows   = [];   // [{jumlah,tebal,lebar,panjang,sap}]
window.ovenRows    = [];   // [{chamber, volume, tanggal}] — multi-chamber
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
        /* ─── KPI Cards CSS removed, see swKPI() ─── */
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
        <div class="section-head" style="margin-top:14px;">
            🔥 Oven (opsional)
            <span style="font-size:10px;color:var(--muted);font-weight:400;">
                — bisa lebih dari satu chamber
            </span>
        </div>
        <div id="oven-rows-container"></div>
        <div style="margin-top:8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.addOvenRow()">+ Tambah Chamber</button>
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

}

// ─────────────────────────────────────────────────
// OVEN ROWS — multi-chamber per laporan
// ─────────────────────────────────────────────────
window.renderOvenRows = function () {
    const c = document.getElementById('oven-rows-container');
    if (!c) return;
    if (!window.ovenRows.length) {
        c.innerHTML = `<div style="font-size:11px;color:var(--muted);padding:6px 0;">
            Belum ada chamber. Klik "+ Tambah Chamber" jika hasil palet masuk oven.</div>`;
        return;
    }
    const used = window.ovenRows.map(r => r.chamber).filter(Boolean);
    let html = `<div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead><tr style="background:var(--bg3);">
                <th style="padding:7px 10px;text-align:left;color:var(--muted);font-size:10px;text-transform:uppercase;">Chamber</th>
                <th style="padding:7px 10px;text-align:right;color:var(--muted);font-size:10px;text-transform:uppercase;">Volume (m³)</th>
                <th style="padding:7px 10px;text-align:center;color:var(--muted);font-size:10px;text-transform:uppercase;">Tgl Mulai</th>
                <th style="padding:7px 4px;"></th>
            </tr></thead><tbody>`;

    window.ovenRows.forEach((row, i) => {
        const opts = [1,2,3,4,5,6,7].map(n => {
            const disabled = used.includes(String(n)) && row.chamber !== String(n) ? 'disabled' : '';
            const sel      = row.chamber === String(n) ? 'selected' : '';
            return `<option value="${n}" ${sel} ${disabled}>Chamber ${n}</option>`;
        }).join('');

        html += `<tr style="border-bottom:1px solid var(--border);">
            <td style="padding:5px 8px;">
                <select style="padding:5px 8px;border-radius:6px;border:1px solid var(--border);
                               background:var(--input-bg);color:var(--text);font-size:12px;width:100%;"
                    onchange="window.onOvenRowInput(${i},'chamber',this.value)">
                    <option value="">-- Pilih --</option>${opts}
                </select>
            </td>
            <td style="padding:5px 8px;">
                <input type="number" step="any" min="0" placeholder="0"
                    style="padding:5px 8px;border-radius:6px;border:1px solid var(--border);
                           background:var(--input-bg);color:var(--text);font-size:12px;
                           width:100%;text-align:right;"
                    value="${row.volume}"
                    oninput="window.onOvenRowInput(${i},'volume',this.value)">
            </td>
            <td style="padding:5px 8px;">
                <input type="date"
                    style="padding:5px 8px;border-radius:6px;border:1px solid var(--border);
                           background:var(--input-bg);color:var(--text);font-size:12px;width:100%;"
                    value="${row.tanggal}"
                    onchange="window.onOvenRowInput(${i},'tanggal',this.value)">
            </td>
            <td style="padding:5px 4px;text-align:center;">
                <button style="padding:3px 8px;border-radius:6px;border:1px solid var(--red);
                               background:transparent;color:var(--red);cursor:pointer;font-size:12px;"
                    onclick="window.removeOvenRow(${i})">✕</button>
            </td>
        </tr>`;
    });

    const totalOven = window.ovenRows.reduce((s,r) => s+(parseFloat(r.volume)||0), 0);
    html += `<tr style="background:var(--bg3);">
        <td style="padding:6px 10px;font-size:10px;color:var(--muted);text-align:right;font-weight:600;">TOTAL</td>
        <td style="padding:6px 10px;text-align:right;font-weight:700;color:var(--gold);">${totalOven.toFixed(4)} m³</td>
        <td colspan="2"></td>
    </tr>`;
    html += `</tbody></table></div>`;
    c.innerHTML = html;
};

window.addOvenRow = function () {
    const tgl = document.getElementById('p-tanggal')?.value || today();
    window.ovenRows.push({ chamber: '', volume: '', tanggal: tgl });
    window.renderOvenRows();
};
window.removeOvenRow = function (i) {
    window.ovenRows.splice(i, 1);
    window.renderOvenRows();
};
window.onOvenRowInput = function (i, field, value) {
    window.ovenRows[i][field] = value;
    if (field === 'chamber') window.renderOvenRows(); // re-render untuk update disabled state
};

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
        // Load ovenRows: dari ovenEntries (multi) atau migrasi data lama (single)
        if (item.ovenEntries && item.ovenEntries.length) {
            window.ovenRows = JSON.parse(JSON.stringify(item.ovenEntries));
        } else if (item.chamber) {
            window.ovenRows = [{ chamber: String(item.chamber), volume: String(item.volumeOven||''), tanggal: item.tanggalOven||'' }];
        } else {
            window.ovenRows = [];
        }
        document.getElementById('p-tanggal').value       = item.tanggal       || '';
        document.getElementById('p-shift').value         = item.shift         || 'full';
        document.getElementById('p-batchkayu').value     = item.batchKayu     || '';
        document.getElementById('p-sawmill').value       = item.prosesSawmill || '';
        document.getElementById('p-masuk').value         = item.tenagaMasuk   || '';
        document.getElementById('p-tidakmasuk').value    = item.tenagaTidakMasuk || '';
        document.getElementById('p-catatan').value       = item.catatan       || '';
        document.getElementById('sawmill-form-title').textContent = '✏️ Edit Laporan Sawmill';
    } else {
        window.ovenRows = [];
        document.getElementById('p-tanggal').value       = today();
        document.getElementById('p-shift').value         = 'full';
        document.getElementById('p-batchkayu').value     = '';
        document.getElementById('p-sawmill').value       = '';
        document.getElementById('p-masuk').value         = '';
        document.getElementById('p-tidakmasuk').value    = '';
        document.getElementById('p-catatan').value       = '';
        document.getElementById('sawmill-form-title').textContent = '➕ Input Laporan Sawmill';
    }

    renderPaletRows();
    window.renderOvenRows();
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
    // ── Baca multi-chamber dari ovenRows ──
    const validOvenRows = (window.ovenRows || [])
        .filter(r => r.chamber && parseFloat(r.volume) > 0 && r.tanggal);
    // Backward-compat: simpan field lama dari entry pertama
    const selectedChamber = validOvenRows.length > 0 ? validOvenRows[0].chamber : '';
    const volumeOven      = validOvenRows.reduce((s,r) => s+(parseFloat(r.volume)||0), 0);
    const tanggalOven     = validOvenRows.length > 0 ? validOvenRows[0].tanggal : '';

    const item = {
        id:                sawmillEditId || uid(),
        tanggal:           tgl,
        shift:             document.getElementById('p-shift')?.value || 'full',
        batchKayu:         document.getElementById('p-batchkayu')?.value?.trim() || '',
        prosesSawmill:     prosesSawmill,
        randemanSawmill:   prosesSawmill > 0 ? (totalVolumePalet/prosesSawmill)*100 : 0,
        openNo:            selectedChamber ? String(parseInt(selectedChamber)) : `SW-${sawmillEditId || Date.now()}`,
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
        tanggalOven:       tanggalOven,
        ovenEntries:       validOvenRows.map(r => ({
            chamber: String(r.chamber),
            volume:  parseFloat(r.volume) || 0,
            tanggal: r.tanggal
        }))
    };

    if (sawmillEditId) {
        closePreviousOvenByOpenNo(item.openNo, sawmillEditId);
        window.sawmillList = window.sawmillList.map(x => x.id === sawmillEditId ? item : x);
        logActivity('Update', 'Sawmill', `${tgl} Rendemen:${item.randemanSawmill.toFixed(1)}%`);
    } else {
        window.sawmillList.push(item);
        logActivity('Simpan', 'Sawmill', `${tgl} Rendemen:${item.randemanSawmill.toFixed(1)}%`);
    }

    // ── Oven handling — loop semua validOvenRows (multi-chamber) ──
    if (!window.ovenList) window.ovenList = [];

    const _addHari = (d, hari) => {
        const dt = new Date(d); dt.setDate(dt.getDate() + hari);
        return dt.toISOString().split('T')[0];
    };
    const DURASI_OVEN = (typeof DURASI_NORMAL_HARI !== 'undefined') ? DURASI_NORMAL_HARI : 7;

    // Mode edit: hapus dulu semua oven entry lama milik laporan ini
    if (sawmillEditId) {
        window.ovenList = window.ovenList.filter(o =>
            !(o.sawmillId === sawmillEditId && o.status === 'isi')
        );
    }

    for (const entry of validOvenRows) {
        const ovenChamber = parseInt(entry.chamber);
        const openNoEntry = String(ovenChamber);
        const tglTarget   = _addHari(entry.tanggal, DURASI_OVEN);

        const buatEntry = (existingId) => ({
            id:         existingId || uid(),
            chamber:    ovenChamber,
            openNo:     openNoEntry,
            sawmillId:  item.id,
            volume:     parseFloat(entry.volume) || 0,
            tglMulai:   entry.tanggal,
            tglTarget:  tglTarget,
            tglSelesai: '',
            suhu:       null,
            catatan:    `Auto dari sawmill ${tgl}`,
            status:     'isi'
        });

        const existActive = window.ovenList.find(o => o.chamber === ovenChamber && o.status === 'isi');
        if (existActive) {
            if (!confirmDialog(`Chamber ${ovenChamber} masih aktif. Ganti dengan data baru?`)) continue;
            existActive.status     = 'selesai';
            existActive.tglSelesai = today();
        }
        window.ovenList.push(buatEntry());
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
function rendClassColor(pct) {
    return pct >= RENDEMEN_TARGET ? 'var(--green)' : (pct >= RENDEMEN_WARNING ? 'var(--orange)' : 'var(--red)');
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

    function swKPI(label, value, color, sub) {
        return `<div style="background:var(--bg2);border:1px solid var(--gold-dim);
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
        // ─────── Build HTML ───────
    let html = `
        <!-- KPI Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px;">
            ${swKPI('Volume Proses (m³)',    fmtDec(volTotal,2),           'var(--gold)',    null)}
            ${swKPI('Total Palet (m³)',      fmtDec(paletVol,2),           '#60a5fa',        null)}
            ${swKPI('Avg Rendemen',          avgRendemen.toFixed(1)+'%',   rendClassColor(avgRendemen), 'Target: 65%')}
            ${swKPI('Total SAP (lbr)',       fmt(totalSAP),                'var(--green)',   null)}
            ${swKPI('Produktivitas (m³/org)',fmtDec(prodTK,3),             'var(--orange)',  null)}
            ${swKPI('Hari Laporan',          filtered.length+'',           'var(--muted)',   null)}
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
            <button onclick="window.exportSawmillExcel()"
                style="background:var(--green);color:#fff;border:none;
                       display:flex;align-items:center;gap:6px;padding:0 14px;height:34px;
                       font-weight:600;font-size:13px;border-radius:8px;cursor:pointer;
                       white-space:nowrap;transition:opacity .15s;"
                onmouseover="this.style.opacity='.82'"
                onmouseout="this.style.opacity='1'">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export Excel
            </button>
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
                    ${(lap.ovenEntries && lap.ovenEntries.length)
                        ? `<div class="sw-stat"><span>🔥 Oven</span>
                            <strong>${lap.ovenEntries.map(e=>`Ch.${e.chamber}: ${fmtDec(e.volume,2)}m³`).join(' · ')}</strong>
                           </div>`
                        : lap.chamber
                        ? `<div class="sw-stat"><span>🔥 Oven</span>
                            <strong>Chamber ${lap.chamber} · ${fmtDec(lap.volumeOven,2)} m³</strong>
                           </div>`
                        : ''}
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

// ═══════════════════════════════════════════════════════════════════
// EXPORT EXCEL — Sawmill (3 sheet: Data, Ringkasan, Tren)
// ═══════════════════════════════════════════════════════════════════

window.exportSawmillExcel = async function () {
    // ── Load ExcelJS ──────────────────────────────────────────────
    if (typeof ExcelJS === 'undefined') {
        await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
        });
    }

    const selMonth = getCurrentFilter();
    const allList  = window.sawmillList || [];
    const filtered = allList.filter(r => r.tanggal && r.tanggal.startsWith(selMonth));
    const sorted   = [...filtered].sort((a,b) => (a.tanggal||'').localeCompare(b.tanggal||''));

    if (!allList.length) { toast('⚠️ Belum ada data sawmill'); return; }
    toast('⏳ Menyiapkan Excel...');

    const wb = new ExcelJS.Workbook();
    wb.creator  = 'Admin Web KMSU';
    wb.created  = new Date();
    wb.modified = new Date();

    // ── Warna tema (dark) ─────────────────────────────────────────
    const C = {
        gold:      'FFD4A017', textGold:  'FFD4A017',
        green:     'FF22C55E', red:       'FFF87171',
        orange:    'FFF97316', blue:      'FF60A5FA',
        purple:    'FFA78BFA',
        bgHeader:  'FF1A1814', bgAlt:     'FF1F1C18',
        bgTotal:   'FF2A2416', border:    'FF3A3020',
        textMain:  'FFE5DDD0', textMuted: 'FF8A8578',
        rendGood:  'FF22C55E', rendWarn:  'FFF97316', rendBad:  'FFF87171',
    };

    // ── Format angka ──────────────────────────────────────────────
    const FMT_INT  = '#,##0';
    const FMT_DEC2 = '#,##0.00';
    const FMT_DEC4 = '#,##0.0000';
    const FMT_PCT  = '0.00"%"';

    // ── Helper styles ─────────────────────────────────────────────
    const darkFill  = bg  => ({ type:'pattern', pattern:'solid', fgColor:{argb:bg} });
    const thinBorder= col => {
        const s = { style:'thin', color:{argb:col} };
        return { top:s, bottom:s, left:s, right:s };
    };
    const centerAlign = () => ({ vertical:'middle', horizontal:'center', wrapText:false });
    const leftAlign   = () => ({ vertical:'middle', horizontal:'left'   });
    const rightAlign  = () => ({ vertical:'middle', horizontal:'right'  });

    function applyHdrStyle(cell, align='center') {
        cell.font      = { name:'Arial', size:10, bold:true, color:{argb:C.textGold} };
        cell.fill      = darkFill(C.bgHeader);
        cell.border    = thinBorder(C.border);
        cell.alignment = align==='right' ? rightAlign() : align==='left' ? leftAlign() : centerAlign();
    }
    function applyDataStyle(cell, align='left', alt=false) {
        cell.font      = { name:'Arial', size:10, color:{argb:C.textMain} };
        cell.fill      = darkFill(alt ? C.bgAlt : C.bgHeader);
        cell.border    = thinBorder(C.border);
        cell.alignment = align==='right' ? rightAlign() : align==='left' ? leftAlign() : centerAlign();
    }
    function applyTotalStyle(cell, align='right') {
        cell.font      = { name:'Arial', size:10, bold:true, color:{argb:C.textGold} };
        cell.fill      = darkFill(C.bgTotal);
        cell.border    = thinBorder(C.gold);
        cell.alignment = align==='right' ? rightAlign() : leftAlign();
    }
    function rendColor(rend) {
        return rend >= RENDEMEN_TARGET ? C.rendGood : rend >= RENDEMEN_WARNING ? C.rendWarn : C.rendBad;
    }

    // ══════════════════════════════════════════════════════════════
    // SHEET 1 — DATA LAPORAN HARIAN
    // ══════════════════════════════════════════════════════════════
    const ws1 = wb.addWorksheet('Data Laporan', {
        properties:{ tabColor:{argb:C.gold} },
        views:[{ state:'frozen', xSplit:0, ySplit:4 }],
    });

    ws1.columns = [
        { key:'no',       width:5  },
        { key:'tanggal',  width:14 },
        { key:'shift',    width:10 },
        { key:'batch',    width:16 },
        { key:'proses',   width:14 },
        { key:'paletVol', width:14 },
        { key:'rendemen', width:12 },
        { key:'sap',      width:12 },
        { key:'palet',    width:10 },
        { key:'tkMasuk',  width:10 },
        { key:'tkTidak',  width:10 },
        { key:'prodTK',   width:16 },
        { key:'catatan',  width:30 },
    ];

    let r1 = 1;
    // Judul
    ws1.mergeCells(`A${r1}:M${r1}`);
    const t1 = ws1.getCell(`A${r1}`);
    t1.value     = 'LAPORAN SAWMILL — UD. KARYA MUDA SURYA UTAMA';
    t1.font      = { name:'Arial', size:14, bold:true, color:{argb:C.gold} };
    t1.fill      = darkFill(C.bgHeader);
    t1.alignment = centerAlign();
    ws1.getRow(r1).height = 28; r1++;

    ws1.mergeCells(`A${r1}:M${r1}`);
    const t1b = ws1.getCell(`A${r1}`);
    t1b.value     = `Periode: ${selMonth}  |  Export: ${new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}  |  Total: ${sorted.length} laporan`;
    t1b.font      = { name:'Arial', size:9, italic:true, color:{argb:C.textMuted} };
    t1b.fill      = darkFill(C.bgHeader);
    t1b.alignment = centerAlign();
    ws1.getRow(r1).height = 16; r1++;

    // Baris kosong
    ws1.getRow(r1).height = 6;
    ['A','B','C','D','E','F','G','H','I','J','K','L','M'].forEach(c => {
        const cell = ws1.getCell(`${c}${r1}`);
        cell.fill = darkFill(C.bgHeader);
    });
    r1++;

    // Header
    const hdrs1 = [
        { label:'No',              align:'center' },
        { label:'Tanggal',         align:'center' },
        { label:'Shift',           align:'center' },
        { label:'Batch Kayu',      align:'left'   },
        { label:'Proses (m³)',     align:'right'  },
        { label:'Vol Palet (m³)',  align:'right'  },
        { label:'Rendemen (%)',    align:'right'  },
        { label:'Total SAP (lbr)',align:'right'   },
        { label:'Jml Palet',       align:'right'  },
        { label:'TK Masuk',        align:'right'  },
        { label:'TK Tdk Masuk',   align:'right'   },
        { label:'Prod. (m³/org)', align:'right'   },
        { label:'Catatan',         align:'left'   },
    ];
    const hdrRow1 = ws1.getRow(r1);
    hdrRow1.height = 20;
    hdrs1.forEach((h,i) => { const cell = hdrRow1.getCell(i+1); cell.value = h.label; applyHdrStyle(cell, h.align); });
    ws1.autoFilter = { from:`A${r1}`, to:`M${r1}` };
    r1++;

    // Baris data
    let tot_proses=0, tot_paletVol=0, tot_sap=0, tot_palet=0, tot_tk=0;
    sorted.forEach((r, idx) => {
        const vol   = r.totalVolumePalet || 0;
        const rend  = r.randemanSawmill  || 0;
        const prod  = r.produktivitas || ((r.tenagaMasuk||0)>0 ? vol/(r.tenagaMasuk) : 0);
        const alt   = idx % 2 === 1;
        const shiftLbl = { pagi:'Pagi', siang:'Siang', full:'Full Day' }[r.shift||'full'] || r.shift;
        const row   = ws1.getRow(r1);
        row.height  = 17;

        const vals = [
            { v: idx+1,              align:'center', fmt:FMT_INT  },
            { v: r.tanggal||'',      align:'center'               },
            { v: shiftLbl,           align:'center'               },
            { v: r.batchKayu||'—',  align:'left'                  },
            { v: r.prosesSawmill||0, align:'right',  fmt:FMT_DEC4 },
            { v: vol,                align:'right',  fmt:FMT_DEC4 },
            { v: rend,               align:'right',  fmt:FMT_PCT, color:rendColor(rend) },
            { v: r.totalSap||0,      align:'right',  fmt:FMT_INT  },
            { v: r.totalPalet||0,    align:'right',  fmt:FMT_INT  },
            { v: r.tenagaMasuk||0,   align:'right',  fmt:FMT_INT  },
            { v: r.tenagaTidakMasuk||0, align:'right', fmt:FMT_INT },
            { v: prod,               align:'right',  fmt:FMT_DEC4 },
            { v: r.catatan||'',      align:'left'                 },
        ];

        vals.forEach((v,ci) => {
            const cell = row.getCell(ci+1);
            cell.value = v.v;
            applyDataStyle(cell, v.align, alt);
            if (v.color) cell.font = { name:'Arial', size:10, bold:true, color:{argb:v.color} };
            if (v.fmt)   cell.numFmt = v.fmt;
        });

        tot_proses   += r.prosesSawmill||0;
        tot_paletVol += vol;
        tot_sap      += r.totalSap||0;
        tot_palet    += r.totalPalet||0;
        tot_tk       += r.tenagaMasuk||0;
        r1++;
    });

    // Baris total
    const totRow1 = ws1.getRow(r1);
    totRow1.height = 20;
    const avgRend1 = tot_proses > 0 ? (tot_paletVol/tot_proses)*100 : 0;
    const prodTot  = tot_tk > 0 ? tot_paletVol/tot_tk : 0;
    [
        { v:'TOTAL', a:'left'   },
        { v:'',      a:'center' },
        { v:'',      a:'center' },
        { v:'',      a:'left'   },
        { v:tot_proses,   a:'right', fmt:FMT_DEC4 },
        { v:tot_paletVol, a:'right', fmt:FMT_DEC4 },
        { v:avgRend1,     a:'right', fmt:FMT_PCT, color:rendColor(avgRend1) },
        { v:tot_sap,      a:'right', fmt:FMT_INT  },
        { v:tot_palet,    a:'right', fmt:FMT_INT  },
        { v:tot_tk,       a:'right', fmt:FMT_INT  },
        { v:'',           a:'right' },
        { v:prodTot,      a:'right', fmt:FMT_DEC4 },
        { v:'',           a:'left'  },
    ].forEach((v,ci) => {
        const cell = totRow1.getCell(ci+1);
        cell.value = v.v;
        applyTotalStyle(cell, v.a);
        if (v.color) cell.font = { name:'Arial', size:10, bold:true, color:{argb:v.color} };
        if (v.fmt)   cell.numFmt = v.fmt;
    });

    // ── Sub-sheet palet per laporan ──────────────────────────────
    // Sisipkan baris palet detail per laporan di bawah baris data
    // (dilakukan via sheet kedua agar tidak memperumit sheet 1)

    // ══════════════════════════════════════════════════════════════
    // SHEET 2 — RINGKASAN: KPI + Breakdown Ketebalan + Per Laporan
    // ══════════════════════════════════════════════════════════════
    const ws2 = wb.addWorksheet('Ringkasan', {
        properties:{ tabColor:{argb:C.green} },
    });

    ws2.columns = [
        { width:22 }, { width:16 }, { width:14 },
        { width:14 }, { width:14 }, { width:14 }, { width:14 },
    ];

    let r2 = 1;
    // Judul
    ws2.mergeCells(`A${r2}:G${r2}`);
    const t2 = ws2.getCell(`A${r2}`);
    t2.value     = `RINGKASAN SAWMILL — ${selMonth}`;
    t2.font      = { name:'Arial', size:13, bold:true, color:{argb:C.gold} };
    t2.fill      = darkFill(C.bgHeader);
    t2.alignment = centerAlign();
    ws2.getRow(r2).height = 26; r2++;

    ws2.mergeCells(`A${r2}:G${r2}`);
    ws2.getCell(`A${r2}`).value     = `UD. Karya Muda Surya Utama  |  ${new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}`;
    ws2.getCell(`A${r2}`).font      = { name:'Arial', size:9, italic:true, color:{argb:C.textMuted} };
    ws2.getCell(`A${r2}`).fill      = darkFill(C.bgHeader);
    ws2.getCell(`A${r2}`).alignment = centerAlign();
    ws2.getRow(r2).height = 17; r2 += 2;

    // ── KPI Summary ──
    ws2.mergeCells(`A${r2}:G${r2}`);
    ws2.getCell(`A${r2}`).value     = '▸ KPI UTAMA BULAN INI';
    ws2.getCell(`A${r2}`).font      = { name:'Arial', size:10, bold:true, color:{argb:C.textGold} };
    ws2.getCell(`A${r2}`).fill      = darkFill(C.bgTotal);
    ws2.getCell(`A${r2}`).alignment = leftAlign();
    ws2.getRow(r2).height = 18; r2++;

    const allPalet2 = sorted.flatMap(r => r.hasilPalet||[]);
    const totProses2 = sorted.reduce((s,r)=>s+(r.prosesSawmill||0),0);
    const totPaletV2 = sorted.reduce((s,r)=>s+(r.totalVolumePalet||0),0);
    const totSAP2    = sorted.reduce((s,r)=>s+(r.totalSap||0),0);
    const totPalet2  = sorted.reduce((s,r)=>s+(r.totalPalet||0),0);
    const totTK2     = sorted.reduce((s,r)=>s+(r.tenagaMasuk||0),0);
    const avgRend2   = totProses2 > 0 ? (totPaletV2/totProses2)*100 : 0;
    const prodTK2    = totTK2 > 0 ? totPaletV2/totTK2 : 0;

    const kpis = [
        ['Vol Proses (m³)',    totProses2, FMT_DEC4, C.gold    ],
        ['Vol Palet (m³)',     totPaletV2, FMT_DEC4, C.blue    ],
        ['Avg Rendemen',       avgRend2,   FMT_PCT,  rendColor(avgRend2)],
        ['Total SAP (lbr)',    totSAP2,    FMT_INT,  C.green   ],
        ['Total Palet (unit)', totPalet2,  FMT_INT,  C.textMain],
        ['TK Masuk (tot)',     totTK2,     FMT_INT,  C.textMain],
        ['Prod TK (m³/org)',   prodTK2,    FMT_DEC4, C.orange  ],
        ['Hari Laporan',       sorted.length, FMT_INT, C.textMuted],
    ];
    kpis.forEach(([lbl, val, fmt, col]) => {
        const row = ws2.getRow(r2);
        row.height = 18;
        const cA = row.getCell(1), cB = row.getCell(2);
        ws2.mergeCells(`A${r2}:A${r2}`);
        ws2.mergeCells(`B${r2}:C${r2}`);
        cA.value     = lbl;
        cA.font      = { name:'Arial', size:10, color:{argb:C.textMuted} };
        cA.fill      = darkFill(C.bgHeader);
        cA.border    = thinBorder(C.border);
        cA.alignment = leftAlign();
        cB.value     = val;
        cB.font      = { name:'Arial', size:10, bold:true, color:{argb:col} };
        cB.fill      = darkFill(C.bgHeader);
        cB.border    = thinBorder(C.border);
        cB.numFmt    = fmt;
        cB.alignment = rightAlign();
        r2++;
    });
    r2++;

    // ── Rendemen status ──
    ws2.mergeCells(`A${r2}:G${r2}`);
    const rendMsg = avgRend2 >= RENDEMEN_TARGET
        ? `✅ Rendemen ${avgRend2.toFixed(2)}% — Memenuhi target (${RENDEMEN_TARGET}%)`
        : avgRend2 >= RENDEMEN_WARNING
        ? `⚠️ Rendemen ${avgRend2.toFixed(2)}% — Di bawah target (${RENDEMEN_TARGET}%), masih di atas batas minimum (${RENDEMEN_WARNING}%)`
        : `🔴 Rendemen ${avgRend2.toFixed(2)}% — Di bawah batas minimum (${RENDEMEN_WARNING}%)! Perlu evaluasi.`;
    ws2.getCell(`A${r2}`).value     = rendMsg;
    ws2.getCell(`A${r2}`).font      = { name:'Arial', size:10, italic:true, color:{argb:rendColor(avgRend2)} };
    ws2.getCell(`A${r2}`).fill      = darkFill(C.bgTotal);
    ws2.getCell(`A${r2}`).alignment = leftAlign();
    ws2.getRow(r2).height = 18; r2 += 2;

    // ── Breakdown per ketebalan ──
    ws2.mergeCells(`A${r2}:G${r2}`);
    ws2.getCell(`A${r2}`).value     = '▸ BREAKDOWN PER KETEBALAN PALET';
    ws2.getCell(`A${r2}`).font      = { name:'Arial', size:10, bold:true, color:{argb:C.textGold} };
    ws2.getCell(`A${r2}`).fill      = darkFill(C.bgTotal);
    ws2.getCell(`A${r2}`).alignment = leftAlign();
    ws2.getRow(r2).height = 18; r2++;

    const tebalHdrs = ['Tebal (mm)','Vol Palet (m³)','% dari Total','SAP (lbr)','Jml Palet','Dimensi Unik','Avg Vol/SAP'];
    const tebalHdrRow = ws2.getRow(r2);
    tebalHdrRow.height = 19;
    tebalHdrs.forEach((h,i) => { const cell = tebalHdrRow.getCell(i+1); cell.value = h; applyHdrStyle(cell, i===0?'left':'right'); });
    r2++;

    const tebalMap = new Map();
    allPalet2.forEach(p => {
        if (!tebalMap.has(p.tebal)) tebalMap.set(p.tebal, { vol:0, sap:0, jml:0, cnt:0 });
        const e = tebalMap.get(p.tebal);
        e.vol += p.volume; e.sap += p.sap; e.jml += (p.jumlah||0); e.cnt++;
    });
    const sortedTebal2 = [...tebalMap.keys()].sort((a,b)=>a-b);

    sortedTebal2.forEach((tebal, idx) => {
        const d   = tebalMap.get(tebal);
        const pct = totPaletV2 > 0 ? d.vol/totPaletV2 : 0;
        const avgVpS = d.sap > 0 ? d.vol/d.sap : 0;
        const alt = idx % 2 === 1;
        const row = ws2.getRow(r2);
        row.height = 17;
        [
            { v:tebal,  a:'left',   fmt:FMT_INT,  col:C.gold  },
            { v:d.vol,  a:'right',  fmt:FMT_DEC4              },
            { v:pct,    a:'right',  fmt:'0.0%'                 },
            { v:d.sap,  a:'right',  fmt:FMT_INT                },
            { v:d.jml,  a:'right',  fmt:FMT_INT                },
            { v:d.cnt,  a:'right',  fmt:FMT_INT                },
            { v:avgVpS, a:'right',  fmt:FMT_DEC4               },
        ].forEach((v,ci) => {
            const cell = row.getCell(ci+1);
            cell.value = v.v;
            applyDataStyle(cell, v.a, alt);
            if (v.col) cell.font = { name:'Arial', size:10, bold:true, color:{argb:v.col} };
            if (v.fmt) cell.numFmt = v.fmt;
        });
        r2++;
    });

    // Baris total tebal
    const totTebalRow = ws2.getRow(r2);
    totTebalRow.height = 19;
    [
        { v:'TOTAL', a:'left'  },
        { v:totPaletV2, a:'right', fmt:FMT_DEC4 },
        { v:1,          a:'right', fmt:'0.0%'   },
        { v:totSAP2,    a:'right', fmt:FMT_INT  },
        { v:totPalet2,  a:'right', fmt:FMT_INT  },
        { v:allPalet2.length, a:'right', fmt:FMT_INT },
        { v:'',         a:'right'               },
    ].forEach((v,ci) => {
        const cell = totTebalRow.getCell(ci+1);
        cell.value = v.v;
        applyTotalStyle(cell, v.a);
        if (v.fmt) cell.numFmt = v.fmt;
    });
    r2 += 2;

    // ── Rendemen per Laporan Harian ──
    ws2.mergeCells(`A${r2}:G${r2}`);
    ws2.getCell(`A${r2}`).value     = '▸ RENDEMEN PER LAPORAN HARIAN';
    ws2.getCell(`A${r2}`).font      = { name:'Arial', size:10, bold:true, color:{argb:C.textGold} };
    ws2.getCell(`A${r2}`).fill      = darkFill(C.bgTotal);
    ws2.getCell(`A${r2}`).alignment = leftAlign();
    ws2.getRow(r2).height = 18; r2++;

    const dailyHdrs = ['Tanggal','Shift','Vol Proses (m³)','Vol Palet (m³)','Rendemen (%)','TK Masuk','Prod (m³/org)'];
    const dailyHdrRow = ws2.getRow(r2);
    dailyHdrRow.height = 19;
    dailyHdrs.forEach((h,i) => { const cell = dailyHdrRow.getCell(i+1); cell.value = h; applyHdrStyle(cell, i<2?'center':'right'); });
    r2++;

    sorted.forEach((r, idx) => {
        const rd  = r.randemanSawmill||0;
        const pd  = r.produktivitas||((r.tenagaMasuk||0)>0?(r.totalVolumePalet||0)/r.tenagaMasuk:0);
        const sl  = { pagi:'Pagi', siang:'Siang', full:'Full Day' }[r.shift||'full']||r.shift;
        const alt = idx%2===1;
        const row = ws2.getRow(r2);
        row.height = 17;
        [
            { v:r.tanggal,                a:'center'               },
            { v:sl,                       a:'center'               },
            { v:r.prosesSawmill||0,       a:'right', fmt:FMT_DEC4 },
            { v:r.totalVolumePalet||0,    a:'right', fmt:FMT_DEC4 },
            { v:rd,                       a:'right', fmt:FMT_PCT, col:rendColor(rd) },
            { v:r.tenagaMasuk||0,         a:'right', fmt:FMT_INT  },
            { v:pd,                       a:'right', fmt:FMT_DEC4 },
        ].forEach((v,ci) => {
            const cell = row.getCell(ci+1);
            cell.value = v.v;
            applyDataStyle(cell, v.a, alt);
            if (v.col) cell.font = { name:'Arial', size:10, bold:true, color:{argb:v.col} };
            if (v.fmt) cell.numFmt = v.fmt;
        });
        r2++;
    });

    // ══════════════════════════════════════════════════════════════
    // SHEET 3 — TREN 12 BULAN
    // ══════════════════════════════════════════════════════════════
    const ws3 = wb.addWorksheet('Tren Bulanan', {
        properties:{ tabColor:{argb:C.blue} },
    });
    ws3.columns = [
        { width:14 }, { width:10 }, { width:16 }, { width:16 },
        { width:14 }, { width:14 }, { width:18 }, { width:16 },
    ];

    let r3 = 1;
    ws3.mergeCells(`A${r3}:H${r3}`);
    const t3 = ws3.getCell(`A${r3}`);
    t3.value     = `TREN SAWMILL — 12 BULAN TERAKHIR`;
    t3.font      = { name:'Arial', size:13, bold:true, color:{argb:C.gold} };
    t3.fill      = darkFill(C.bgHeader);
    t3.alignment = centerAlign();
    ws3.getRow(r3).height = 26; r3++;

    ws3.mergeCells(`A${r3}:H${r3}`);
    ws3.getCell(`A${r3}`).value     = `UD. Karya Muda Surya Utama  |  ${new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}`;
    ws3.getCell(`A${r3}`).font      = { name:'Arial', size:9, italic:true, color:{argb:C.textMuted} };
    ws3.getCell(`A${r3}`).fill      = darkFill(C.bgHeader);
    ws3.getCell(`A${r3}`).alignment = centerAlign();
    ws3.getRow(r3).height = 17; r3 += 2;

    const trendHdrs = [
        { label:'Bulan',            align:'center' },
        { label:'Laporan',          align:'right'  },
        { label:'Vol Proses (m³)', align:'right'   },
        { label:'Vol Palet (m³)',  align:'right'   },
        { label:'Rendemen (%)',     align:'right'  },
        { label:'Total SAP (lbr)', align:'right'   },
        { label:'Prod TK (m³/org)',align:'right'   },
        { label:'vs Bln Lalu',      align:'center' },
    ];
    const tHdrRow = ws3.getRow(r3);
    tHdrRow.height = 20;
    trendHdrs.forEach((h,i) => { const cell = tHdrRow.getCell(i+1); cell.value = h.label; applyHdrStyle(cell, h.align); });
    r3++;

    const now = new Date();
    const trendMonths = [];
    for (let i=11; i>=0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
        trendMonths.push(d.toISOString().slice(0,7));
    }

    let prevVol = 0;
    trendMonths.forEach((m, idx) => {
        const md   = allList.filter(r => r.tanggal && r.tanggal.startsWith(m));
        const vP   = md.reduce((s,r)=>s+(r.prosesSawmill||0),0);
        const vPal = md.reduce((s,r)=>s+(r.totalVolumePalet||0),0);
        const sap  = md.reduce((s,r)=>s+(r.totalSap||0),0);
        const tk   = md.reduce((s,r)=>s+(r.tenagaMasuk||0),0);
        const rend = vP > 0 ? vPal/vP*100 : 0;
        const prod = tk > 0 ? vPal/tk : 0;
        const diff = prevVol > 0 ? (vP-prevVol)/prevVol : null;

        const isCur = m === selMonth;
        const alt   = idx%2===1;
        const row   = ws3.getRow(r3);
        row.height  = 18;

        [
            { v:m,             a:'center'                         },
            { v:md.length,     a:'right',  fmt:FMT_INT            },
            { v:vP,            a:'right',  fmt:FMT_DEC4           },
            { v:vPal,          a:'right',  fmt:FMT_DEC4           },
            { v:rend,          a:'right',  fmt:FMT_PCT, col:vP>0?rendColor(rend):C.textMuted },
            { v:sap,           a:'right',  fmt:FMT_INT            },
            { v:prod,          a:'right',  fmt:FMT_DEC4           },
            { v:diff!==null?diff:'—', a:'center', fmt:diff!==null?'+0.0%;-0.0%;0.0%':'@',
              col:diff===null?C.textMuted:diff>=0?C.green:C.red  },
        ].forEach((v,ci) => {
            const cell = row.getCell(ci+1);
            cell.value = v.v;
            if (isCur) {
                cell.fill   = darkFill(C.bgTotal);
                cell.font   = { name:'Arial', size:10, bold:true, color:{argb:v.col||C.textGold} };
                cell.border = thinBorder(C.gold);
            } else {
                applyDataStyle(cell, v.a, alt);
                if (v.col) cell.font = { name:'Arial', size:10, color:{argb:v.col} };
            }
            cell.alignment = v.a==='right' ? rightAlign() : centerAlign();
            if (v.fmt && v.v !== '—') cell.numFmt = v.fmt;
        });

        if (vP > 0) prevVol = vP;
        r3++;
    });

    // Keterangan highlight
    r3 += 1;
    ws3.mergeCells(`A${r3}:H${r3}`);
    ws3.getCell(`A${r3}`).value     = `★ Baris emas = bulan yang sedang dipilih (${selMonth})`;
    ws3.getCell(`A${r3}`).font      = { name:'Arial', size:9, italic:true, color:{argb:C.gold} };
    ws3.getCell(`A${r3}`).fill      = darkFill(C.bgTotal);
    ws3.getCell(`A${r3}`).alignment = leftAlign();

    // ── Download ──────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = `Laporan_Sawmill_${selMonth}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast(`✅ Export Excel Sawmill berhasil! (3 sheet)`);
    if (typeof logActivity === 'function') logActivity('Export','Sawmill',`Excel ${selMonth}`);
};
