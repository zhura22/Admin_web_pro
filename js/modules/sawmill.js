// sawmill.js - perbaikan bug "}" dan tampilan card laporan

window.paletRows = [];
let sawmillEditId = null;

// ========== FUNGSI PERHITUNGAN VOLUME ==========
function hitungVolumeBaris(row) {
    const tebal = parseFloat(row.tebal) || 0;
    const lebar = parseFloat(row.lebar) || 0;
    const panjang = parseFloat(row.panjang) || 0;
    const sap = parseFloat(row.sap) || 0;
    return (tebal / 1000) * (lebar / 100) * (panjang / 100) * sap;
}

function hitungTotalVolumePalet() {
    let total = 0;
    window.paletRows.forEach(row => total += hitungVolumeBaris(row));
    return total;
}

function updateTotalDanRendemen() {
    const sawmill = parseFloat(document.getElementById("p-sawmill")?.value) || 0;
    const totalVol = hitungTotalVolumePalet();
    const elTotal = document.getElementById("p-totalvolume");
    if (elTotal) elTotal.value = totalVol.toFixed(4);
    const elRendemen = document.getElementById("p-randemen");
    if (elRendemen) elRendemen.value = sawmill > 0 ? ((totalVol / sawmill) * 100).toFixed(2) : "0";
}

function updateRowVolume(index) {
    const row = window.paletRows[index];
    const volume = hitungVolumeBaris(row);
    const volumeCell = document.getElementById(`palet-vol-${index}`);
    if (volumeCell) volumeCell.textContent = volume.toFixed(4);
    updateTotalDanRendemen();
}

window.onPaletInput = function(index, field, value) {
    window.paletRows[index][field] = value;
    updateRowVolume(index);
};

window.addPaletRow = function() {
    window.paletRows.push({ jumlah: '', tebal: '', lebar: '', panjang: '', sap: '' });
    renderPaletRows();
    updateTotalDanRendemen();
};

window.removePaletRow = function(index) {
    window.paletRows.splice(index, 1);
    renderPaletRows();
    updateTotalDanRendemen();
};

function renderPaletRows() {
    const c = document.getElementById("palet-container");
    if (!c) return;
    if (!window.paletRows.length) {
        c.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--muted); border: 1px dashed var(--border); border-radius: var(--radius-sm);">Belum ada palet. Klik "+ Tambah Palet".</div>';
        return;
    }
    let html = `
        <div style="overflow-x: auto;">
            <table style="width:100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: var(--bg3); border-bottom: 2px solid var(--gold-dim);">
                        <th style="padding: 8px; text-align: left;">Jumlah Palet</th>
                        <th style="padding: 8px; text-align: left;">Tebal (mm)</th>
                        <th style="padding: 8px; text-align: left;">Lebar (cm)</th>
                        <th style="padding: 8px; text-align: left;">Panjang (cm)</th>
                        <th style="padding: 8px; text-align: left;">SAP (total lembar)</th>
                        <th style="padding: 8px; text-align: right;">Volume (m³)</th>
                        <th style="width: 50px; padding: 8px; text-align: center;"></th>
                    </tr>
                </thead>
                <tbody>
    `;
    window.paletRows.forEach((p, i) => {
        const volume = hitungVolumeBaris(p);
        html += `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 6px;"><input type="number" step="any" value="${p.jumlah}" oninput="window.onPaletInput(${i}, 'jumlah', this.value)" style="width:100%; background:var(--input-bg); border:1px solid var(--input-border); color:var(--input-color); padding: 6px; border-radius: var(--radius-sm); text-align: right;"></td>
                <td style="padding: 6px;"><input type="number" step="any" value="${p.tebal}" oninput="window.onPaletInput(${i}, 'tebal', this.value)" style="width:100%; background:var(--input-bg); border:1px solid var(--input-border); color:var(--input-color); padding: 6px; border-radius: var(--radius-sm); text-align: right;"></td>
                <td style="padding: 6px;"><input type="number" step="any" value="${p.lebar}" oninput="window.onPaletInput(${i}, 'lebar', this.value)" style="width:100%; background:var(--input-bg); border:1px solid var(--input-border); color:var(--input-color); padding: 6px; border-radius: var(--radius-sm); text-align: right;"></td>
                <td style="padding: 6px;"><input type="number" step="any" value="${p.panjang}" oninput="window.onPaletInput(${i}, 'panjang', this.value)" style="width:100%; background:var(--input-bg); border:1px solid var(--input-border); color:var(--input-color); padding: 6px; border-radius: var(--radius-sm); text-align: right;"></td>
                <td style="padding: 6px;"><input type="number" step="any" value="${p.sap}" oninput="window.onPaletInput(${i}, 'sap', this.value)" style="width:100%; background:var(--input-bg); border:1px solid var(--input-border); color:var(--input-color); padding: 6px; border-radius: var(--radius-sm); text-align: right;"></td>
                <td style="padding: 6px; text-align: right; font-family: monospace;" id="palet-vol-${i}">${volume.toFixed(4)}</td>
                <td style="padding: 6px; text-align: center;"><button class="btn btn-del btn-sm" onclick="window.removePaletRow(${i})" style="padding: 4px 8px;">✕</button></td>
            </tr>
        `;
    });
    html += `</tbody></table></div>`;
    c.innerHTML = html;
}

// ========== BUKA FORM ==========
window.openSawmillForm = function(item) {
    sawmillEditId = item?.id || null;
    window.paletRows = item ? JSON.parse(JSON.stringify(item.hasilPalet || [])) : [];
    const container = document.getElementById("sawmill-form-container");
    container.innerHTML = `
        <div class="form-title">${item ? "✏️ Edit" : "➕ Input"} Laporan Sawmill</div>
        <div class="grid3">
            <div class="field"><label>Tanggal *</label><input type="date" id="p-tanggal" style="width:100%;"></div>
            <div class="field"><label>Proses Sawmill (m³)</label><input type="number" step="any" id="p-sawmill" oninput="updateTotalDanRendemen()" placeholder="Volume kayu" style="width:100%;"></div>
            <div class="field"><label>Rendemen (%)</label><input type="number" step="any" id="p-randemen" readonly style="width:100%; background:var(--pill-bg);"></div>
        </div>
        <div class="section-head">🪵 Palet yang Dihasilkan (input jumlah palet, dimensi & total SAP)</div>
        <div id="palet-container"></div>
        <div class="flex gap10 items-center" style="margin-top: 12px;">
            <button class="btn btn-secondary btn-sm" onclick="window.addPaletRow()" style="padding: 6px 12px;">+ Tambah Palet</button>
            <div class="field" style="margin-left:auto; width: auto;"><label>Total Volume (m³)</label><input type="number" step="any" id="p-totalvolume" readonly style="width: 140px; background:var(--pill-bg);"></div>
        </div>
        <div class="section-head">📝 Catatan Harian</div>
        <div class="grid3">
            <div class="field"><label>Tenaga Masuk</label><input type="number" id="p-masuk" style="width:100%;"></div>
            <div class="field"><label>Tidak Masuk</label><input type="number" id="p-tidakmasuk" style="width:100%;"></div>
            <div class="field span3"><label>Catatan</label><textarea id="p-catatan" rows="2" style="width:100%;"></textarea></div>
        </div>
        <div class="section-head">🔥 Oven</div>
        <div class="grid3">
            <div class="field"><label>Chamber</label><select id="p-chamber" style="width:100%;">${[1,2,3,4,5,6,7].map(i => `<option value="${i}">Chamber ${i}</option>`).join("")}</select></div>
            <div class="field"><label>Volume Oven (m³)</label><input type="number" step="any" id="p-volumeOven" style="width:100%;"></div>
            <div class="field"><label>Tgl Mulai Oven</label><input type="date" id="p-tanggalOven" style="width:100%;"></div>
        </div>
        <div class="form-actions"><button class="btn btn-secondary" onclick="window.closeSawmillForm()">Batal</button><button class="btn btn-primary" onclick="window.saveSawmill()">Simpan Laporan</button></div>
    `;
    document.getElementById("p-tanggal").value = item?.tanggal || today();
    document.getElementById("p-sawmill").value = item?.prosesSawmill || "";
    document.getElementById("p-masuk").value = item?.tenagaMasuk || "";
    document.getElementById("p-tidakmasuk").value = item?.tenagaTidakMasuk || "";
    document.getElementById("p-catatan").value = item?.catatan || "";
    document.getElementById("p-chamber").value = item?.chamber || "";
    document.getElementById("p-volumeOven").value = item?.volumeOven || "";
    document.getElementById("p-tanggalOven").value = item?.tanggalOven || "";
    renderPaletRows();
    updateTotalDanRendemen();
    document.getElementById("sawmill-input").classList.remove("hidden");
    document.getElementById("sawmill-list").classList.add("hidden");
};

window.closeSawmillForm = function() {
    document.getElementById("sawmill-input").classList.add("hidden");
    document.getElementById("sawmill-list").classList.remove("hidden");
    sawmillEditId = null;
    window.paletRows = [];
};

// ========== OVEN ==========
function closePreviousOvenByOpenNo(openNo, excludeHistoryId = null) {
    const activeHistory = window.ovenHistoryList.find(h => h.openNo === openNo && h.status === 'active' && h.id !== excludeHistoryId);
    if (activeHistory) {
        activeHistory.status = 'completed';
        activeHistory.tanggalSelesai = today();
        const ovenIdx = window.ovenList.findIndex(o => o.chamber === activeHistory.chamber);
        if (ovenIdx !== -1 && window.ovenList[ovenIdx].status === 'active') {
            window.ovenList[ovenIdx] = { chamber: activeHistory.chamber, volume: 0, tanggalMulai: "", status: "empty" };
        }
    }
}

window.saveSawmill = function() {
    const tgl = document.getElementById("p-tanggal")?.value;
    if (!tgl) { toast("⚠️ Tanggal wajib!"); return; }
    updateTotalDanRendemen();
    const hasilPalet = [];
    window.paletRows.forEach(p => {
        const jumlah = parseFloat(p.jumlah) || 0;
        const tebal = parseFloat(p.tebal) || 0;
        const lebar = parseFloat(p.lebar) || 0;
        const panjang = parseFloat(p.panjang) || 0;
        const sap = parseFloat(p.sap) || 0;
        if (tebal > 0 && lebar > 0 && panjang > 0 && sap > 0) {
            const volume = (tebal / 1000) * (lebar / 100) * (panjang / 100) * sap;
            hasilPalet.push({ jumlah, tebal, lebar, panjang, sap, volume });
        }
    });
    const totalVolumePalet = hasilPalet.reduce((s, p) => s + p.volume, 0);
    const selectedChamber = document.getElementById("p-chamber")?.value;
    const volumeOven = parseFloat(document.getElementById("p-volumeOven")?.value) || 0;
    const tanggalOven = document.getElementById("p-tanggalOven")?.value;
    const dummyOpenNo = `SW-${Date.now()}`;
    const item = {
        id: sawmillEditId || uid(),
        tanggal: tgl,
        prosesSawmill: parseFloat(document.getElementById("p-sawmill")?.value) || 0,
        randemanSawmill: parseFloat(document.getElementById("p-randemen")?.value) || 0,
        openNo: dummyOpenNo,
        hasilPalet: hasilPalet,
        totalPalet: hasilPalet.reduce((s, p) => s + (p.jumlah || 0), 0),
        totalVolumePalet: totalVolumePalet,
        totalSap: hasilPalet.reduce((s, p) => s + p.sap, 0),
        tenagaMasuk: parseInt(document.getElementById("p-masuk")?.value) || 0,
        tenagaTidakMasuk: parseInt(document.getElementById("p-tidakmasuk")?.value) || 0,
        catatan: document.getElementById("p-catatan")?.value || "",
        chamber: selectedChamber || "",
        volumeOven: volumeOven,
        tanggalOven: tanggalOven || ""
    };
    if (sawmillEditId) {
        closePreviousOvenByOpenNo(item.openNo, sawmillEditId);
        window.sawmillList = window.sawmillList.map(x => x.id === sawmillEditId ? item : x);
        logActivity('Update', 'Sawmill', `ID: ${item.id}`);
        if (selectedChamber && volumeOven > 0 && tanggalOven) {
            const ovenChamber = parseInt(selectedChamber);
            const existingHistory = window.ovenHistoryList.find(h => h.openNo === item.openNo && h.status === 'active');
            if (existingHistory) {
                existingHistory.chamber = ovenChamber;
                existingHistory.volumeMasuk = volumeOven;
                existingHistory.tanggalMasuk = tanggalOven;
                existingHistory.palet = hasilPalet;
                const oidx = window.ovenList.findIndex(o => o.chamber === ovenChamber);
                if (oidx !== -1) window.ovenList[oidx] = { chamber: ovenChamber, volume: volumeOven, tanggalMulai: tanggalOven, status: 'active' };
            } else {
                window.ovenHistoryList.push({ id: uid(), chamber: ovenChamber, openNo: item.openNo, volumeMasuk: volumeOven, tanggalMasuk: tanggalOven, tanggalSelesai: "", status: "active", palet: hasilPalet });
                const oidx = window.ovenList.findIndex(o => o.chamber === ovenChamber);
                if (oidx !== -1) window.ovenList[oidx] = { chamber: ovenChamber, volume: volumeOven, tanggalMulai: tanggalOven, status: 'active' };
                else window.ovenList.push({ chamber: ovenChamber, volume: volumeOven, tanggalMulai: tanggalOven, status: 'active' });
            }
        }
    } else {
        window.sawmillList.push(item);
        logActivity('Simpan', 'Sawmill', `ID: ${item.id}`);
        if (selectedChamber && volumeOven > 0 && tanggalOven) {
            const ovenChamber = parseInt(selectedChamber);
            const existingActiveOven = window.ovenList.find(o => o.chamber === ovenChamber && o.status === 'active');
            if (existingActiveOven && !confirmDialog(`Chamber ${ovenChamber} masih aktif. Tetap ganti?`)) {}
            else {
                if (existingActiveOven) {
                    const historyToClose = window.ovenHistoryList.find(h => h.chamber === ovenChamber && h.status === 'active');
                    if (historyToClose) { historyToClose.status = 'completed'; historyToClose.tanggalSelesai = today(); }
                    existingActiveOven.status = 'empty';
                }
                const existingActiveByOpen = window.ovenHistoryList.find(h => h.openNo === item.openNo && h.status === 'active');
                if (existingActiveByOpen) { existingActiveByOpen.status = 'completed'; existingActiveByOpen.tanggalSelesai = today(); }
                window.ovenHistoryList.push({ id: uid(), chamber: ovenChamber, openNo: item.openNo, volumeMasuk: volumeOven, tanggalMasuk: tanggalOven, tanggalSelesai: "", status: "active", palet: hasilPalet });
                const oidx = window.ovenList.findIndex(o => o.chamber === ovenChamber);
                if (oidx !== -1) window.ovenList[oidx] = { chamber: ovenChamber, volume: volumeOven, tanggalMulai: tanggalOven, status: "active" };
                else window.ovenList.push({ chamber: ovenChamber, volume: volumeOven, tanggalMulai: tanggalOven, status: "active" });
            }
        }
    }
    persistAll();
    window.closeSawmillForm();
    window.renderSawmill();
    window.renderOvenStatus();
    window.renderBatch();
    toast("✅ Laporan sawmill disimpan!");
};

window.deleteSawmill = function(id) {
    const item = window.sawmillList.find(x => x.id === id);
    if (item) logActivity('Hapus', 'Sawmill', `ID: ${item.id}`);
    if (!confirmDialog("Hapus?")) return;
    window.sawmillList = window.sawmillList.filter(x => x.id !== id);
    persistAll();
    window.renderSawmill();
    window.renderOvenStatus();
    window.renderBatch();
    toast("🗑️ Dihapus");
};

window.editSawmill = function(id) {
    const item = window.sawmillList.find(x => x.id === id);
    if (item) window.openSawmillForm(item);
};

// ========== RENDER DAFTAR LAPORAN (dengan batas card jelas) ==========
window.renderSawmill = function() {
    const countEl = document.getElementById("sawmill-count");
    if (countEl) countEl.textContent = sawmillList.length + " laporan";
    const container = document.getElementById("sawmill-list");
    if (!container) return;
    if (!sawmillList.length) {
        container.innerHTML = '<div class="empty">📭 Belum ada laporan</div>';
        return;
    }
    const sorted = sortByDateAsc(window.sawmillList);
    container.innerHTML = sorted.map(lap => {
        const totalVol = lap.totalVolumePalet || 0;
        const totalSap = lap.totalSap || (lap.hasilPalet ? lap.hasilPalet.reduce((s, p) => s + p.sap, 0) : 0);
        const totalJumlahPalet = lap.totalPalet || (lap.hasilPalet ? lap.hasilPalet.reduce((s, p) => s + (p.jumlah || 0), 0) : 0);
        const totalJenis = lap.hasilPalet ? lap.hasilPalet.length : 0;
        let detailTable = '';
        if (lap.hasilPalet && lap.hasilPalet.length) {
            detailTable = `<div style="overflow-x: auto; margin-top: 12px;">
                <table style="width:100%; font-size: 11px; border-collapse: collapse;">
                    <thead><tr style="background: var(--bg3);"><th style="padding: 6px; text-align: left;">No</th><th style="padding: 6px; text-align: left;">Jml</th><th style="padding: 6px; text-align: left;">Tebal (mm)</th><th style="padding: 6px; text-align: left;">Lebar (cm)</th><th style="padding: 6px; text-align: left;">Panjang (cm)</th><th style="padding: 6px; text-align: left;">SAP</th><th style="padding: 6px; text-align: right;">Volume (m³)</th></tr></thead>
                    <tbody>`;
            lap.hasilPalet.forEach((p, idx) => {
                detailTable += `<tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 6px; text-align: center;">${idx+1}</td>
                    <td style="padding: 6px; text-align: right;">${p.jumlah || 0}</td>
                    <td style="padding: 6px; text-align: right;">${p.tebal}</td>
                    <td style="padding: 6px; text-align: right;">${p.lebar}</td>
                    <td style="padding: 6px; text-align: right;">${p.panjang}</td>
                    <td style="padding: 6px; text-align: right;">${p.sap}</td>
                    <td style="padding: 6px; text-align: right;">${p.volume.toFixed(4)}</td>
                </tr>`;
            });
            detailTable += `</tbody></table></div>`;
        }
        return `<div class="laporan-card" style="margin-bottom: 20px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg2);">
            <div class="laporan-head" style="display: flex; justify-content: space-between; flex-wrap: wrap; padding: 12px; border-bottom: 1px solid var(--gold-dim);">
                <div>
                    <div class="laporan-title" style="font-weight: bold;">📅 ${fmtDate(lap.tanggal)}</div>
                    <div class="laporan-sub" style="font-size: 11px; color: var(--muted);">${totalJenis} jenis · ${totalJumlahPalet} palet · Total Vol ${fmtDec(totalVol, 2)} m³ · Total SAP ${fmt(totalSap)} lbr</div>
                </div>
                <div class="flex gap4">
                    <button class="btn btn-edit btn-sm" onclick="window.editSawmill('${lap.id}')">✏️</button>
                    <button class="btn btn-del btn-sm" onclick="window.deleteSawmill('${lap.id}')">🗑️</button>
                </div>
            </div>
            <div class="stat-pills" style="padding: 8px 12px 0 12px;">
                <div class="stat-pill"><span class="stat-label">Proses</span><span class="stat-val">${fmtDec(lap.prosesSawmill, 2)} m³</span></div>
                <div class="stat-pill"><span class="stat-label">Rendemen</span><span class="stat-val">${fmtDec(lap.randemanSawmill, 2)}%</span></div>
            </div>
            <div style="padding: 0 12px 12px 12px;">
                ${detailTable}
                ${lap.catatan ? `<p style="margin-top: 8px; color: var(--muted); font-size: 11px;">📝 ${lap.catatan}</p>` : ''}
            </div>
        </div>`;
    }).join("");
};

// ========== RINGKASAN KUMULATIF PER BULAN ==========
function renderSawmillSummary() {
    const bulan = document.getElementById("sawmill-summary-bulan")?.value || thisMonth();
    const reports = window.sawmillList.filter(r => r.tanggal && r.tanggal.startsWith(bulan));
    const container = document.getElementById("sawmill-summary-content");
    if (!container) return;
    if (reports.length === 0) {
        container.innerHTML = '<div class="empty">📭 Tidak ada laporan sawmill pada bulan ini</div>';
        return;
    }
    const allPalet = [];
    reports.forEach(r => { if (r.hasilPalet) allPalet.push(...r.hasilPalet); });
    const tebalMap = new Map();
    allPalet.forEach(p => {
        const tebal = p.tebal;
        if (!tebalMap.has(tebal)) tebalMap.set(tebal, { volume: 0, sap: 0, jumlah: 0, count: 0 });
        const entry = tebalMap.get(tebal);
        entry.volume += p.volume;
        entry.sap += p.sap;
        entry.jumlah += (p.jumlah || 0);
        entry.count += 1;
    });
    const sortedTebal = Array.from(tebalMap.keys()).sort((a,b) => a - b);
    let html = `
        <div class="summary-row" style="margin-bottom: 20px;">
            <div class="summary-card"><div class="summary-label">Total Laporan</div><div class="summary-value">${reports.length}</div></div>
            <div class="summary-card"><div class="summary-label">Total Volume Palet</div><div class="summary-value">${fmtDec(allPalet.reduce((s,p)=>s+p.volume,0), 2)} m³</div></div>
            <div class="summary-card"><div class="summary-label">Total SAP</div><div class="summary-value">${fmt(allPalet.reduce((s,p)=>s+p.sap,0))} lembar</div></div>
            <div class="summary-card"><div class="summary-label">Total Jumlah Palet</div><div class="summary-value">${fmt(allPalet.reduce((s,p)=>s+(p.jumlah||0),0))}</div></div>
        </div>
        <div style="overflow-x: auto;">
            <table style="width:100%; border-collapse: collapse; font-size: 12px;">
                <thead><tr style="background: var(--bg3);"><th style="padding: 8px; text-align: left;">Tebal (mm)</th><th style="padding: 8px; text-align: right;">Total Volume (m³)</th><th style="padding: 8px; text-align: right;">Total SAP</th><th style="padding: 8px; text-align: right;">Total Palet</th><th style="padding: 8px; text-align: center;">Jenis Dimensi</th></tr></thead>
                <tbody>
                    ${sortedTebal.map(tebal => {
                        const data = tebalMap.get(tebal);
                        return `<tr><td style="padding: 6px; text-align: right;">${tebal}</td><td style="padding: 6px; text-align: right;">${fmtDec(data.volume, 2)}</td><td style="padding: 6px; text-align: right;">${fmt(data.sap)}</td><td style="padding: 6px; text-align: right;">${fmt(data.jumlah)}</td><td style="padding: 6px; text-align: center;">${data.count}</td></tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
}

// ========== INISIALISASI PANEL RINGKASAN ==========
function initSawmillSummary() {
    const tabSawmill = document.getElementById("tab-sawmill");
    if (!tabSawmill) return;
    if (document.getElementById("sawmill-summary-panel")) return;
    const subtabContainer = tabSawmill.querySelector('.subtab-toggle');
    if (subtabContainer) {
        const btnSummary = document.createElement('button');
        btnSummary.className = 'btn btn-secondary subtab-btn';
        btnSummary.setAttribute('data-subtab', 'sawmill-summary-panel');
        btnSummary.textContent = '📊 Rangkuman Bulanan';
        btnSummary.onclick = () => {
            document.querySelectorAll('#tab-sawmill .subtab-panel').forEach(p => p.classList.add('hidden'));
            document.getElementById('sawmill-summary-panel').classList.remove('hidden');
            document.querySelectorAll('#tab-sawmill .subtab-btn').forEach(btn => {
                btn.classList.remove('active', 'btn-primary');
                btn.classList.add('btn-secondary');
            });
            btnSummary.classList.add('active', 'btn-primary');
            btnSummary.classList.remove('btn-secondary');
            renderSawmillSummary();
        };
        subtabContainer.appendChild(btnSummary);
    }
    const summaryPanel = document.createElement('div');
    summaryPanel.id = 'sawmill-summary-panel';
    summaryPanel.className = 'subtab-panel hidden';
    summaryPanel.innerHTML = `
        <div class="form-card">
            <div class="form-title">📊 Rangkuman Perolehan Palet per Bulan (Berdasarkan Tebal)</div>
            <div class="grid2">
                <div class="field"><label>Bulan (YYYY-MM)</label><input type="month" id="sawmill-summary-bulan" value="${thisMonth()}"></div>
                <div class="field"><button class="btn btn-primary" onclick="renderSawmillSummary()" style="margin-top: 22px;">Tampilkan</button></div>
            </div>
            <div id="sawmill-summary-content"></div>
        </div>
    `;
    const sawmillListPanel = document.getElementById("sawmill-list");
    if (sawmillListPanel) sawmillListPanel.insertAdjacentElement('afterend', summaryPanel);
    else tabSawmill.appendChild(summaryPanel);
}

setTimeout(() => {
    initSawmillSummary();
}, 500);