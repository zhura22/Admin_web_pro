// sawmill.js - Final (form dinamis, filter bulan stabil, volume tanpa jumlah)

window.paletRows = [];
let sawmillEditId = null;

// ========== PERHITUNGAN VOLUME (tanpa jumlah) ==========
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
        c.innerHTML = '<div class="empty">Belum ada palet. Klik "+ Tambah Palet".</div>';
        return;
    }
    let html = `
        <div style="overflow-x: auto;">
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
                <thead><tr style="background:var(--bg3);">
                    <th>Jumlah Palet</th><th>Tebal (mm)</th><th>Lebar (cm)</th><th>Panjang (cm)</th><th>SAP</th><th>Volume (m³)</th><th></th>
                </tr></thead>
                <tbody>
    `;
    window.paletRows.forEach((p, i) => {
        const volume = hitungVolumeBaris(p);
        html += `
            <tr>
                <td><input type="number" step="any" value="${p.jumlah}" oninput="window.onPaletInput(${i}, 'jumlah', this.value)" style="width:100%;"></td>
                <td><input type="number" step="any" value="${p.tebal}" oninput="window.onPaletInput(${i}, 'tebal', this.value)" style="width:100%;"></td>
                <td><input type="number" step="any" value="${p.lebar}" oninput="window.onPaletInput(${i}, 'lebar', this.value)" style="width:100%;"></td>
                <td><input type="number" step="any" value="${p.panjang}" oninput="window.onPaletInput(${i}, 'panjang', this.value)" style="width:100%;"></td>
                <td><input type="number" step="any" value="${p.sap}" oninput="window.onPaletInput(${i}, 'sap', this.value)" style="width:100%;"></td>
                <td style="text-align:right;" id="palet-vol-${i}">${volume.toFixed(4)}</td>
                <td style="text-align:center;"><button class="btn-del" onclick="window.removePaletRow(${i})">✕</button></td>
            </tr>
        `;
    });
    html += `</tbody>}</div>`;
    c.innerHTML = html;
}

// ========== BANGUN FORM SAWMILL (dinamis) ==========
function buildSawmillForm() {
    const container = document.getElementById("sawmill-form-container");
    if (!container) return;
    // Hanya buat jika belum ada
    if (container.querySelector("#p-tanggal")) return;
    container.innerHTML = `
        <div class="form-title" id="sawmill-form-title">➕ Input Laporan Sawmill</div>
        <div class="grid3">
            <div class="field"><label>Tanggal *</label><input type="date" id="p-tanggal"></div>
            <div class="field"><label>Proses Sawmill (m³)</label><input type="number" step="any" id="p-sawmill" oninput="updateTotalDanRendemen()" placeholder="Volume kayu"></div>
            <div class="field"><label>Rendemen (%)</label><input type="number" step="any" id="p-randemen" readonly></div>
        </div>
        <div class="section-head">🪵 Palet yang Dihasilkan (jumlah hanya info, volume dari dimensi & SAP)</div>
        <div id="palet-container"></div>
        <div class="flex gap10 items-center" style="margin-top:8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.addPaletRow()">+ Tambah Palet</button>
            <div class="field" style="margin-left:auto;width:150px;"><label>Total Volume (m³)</label><input type="number" step="any" id="p-totalvolume" readonly></div>
        </div>
        <div class="section-head">📝 Catatan Harian</div>
        <div class="grid3">
            <div class="field"><label>Tenaga Masuk</label><input type="number" id="p-masuk"></div>
            <div class="field"><label>Tidak Masuk</label><input type="number" id="p-tidakmasuk"></div>
            <div class="field span3"><label>Catatan</label><textarea id="p-catatan" rows="2"></textarea></div>
        </div>
        <div class="section-head">🔥 Oven</div>
        <div class="grid3">
            <div class="field"><label>Chamber</label><select id="p-chamber"><option value="">-- Pilih --</option>${[1,2,3,4,5,6,7].map(i => `<option value="${i}">Chamber ${i}</option>`).join("")}</select></div>
            <div class="field"><label>Volume Oven (m³)</label><input type="number" step="any" id="p-volumeOven"></div>
            <div class="field"><label>Tgl Mulai Oven</label><input type="date" id="p-tanggalOven"></div>
        </div>
        <div class="form-actions"><button class="btn btn-secondary" onclick="window.closeSawmillForm()">Batal</button><button class="btn btn-primary" onclick="window.saveSawmill()">Simpan Laporan</button></div>
    `;
}

window.openSawmillForm = function(item) {
    sawmillEditId = item?.id || null;
    window.paletRows = [];
    buildSawmillForm(); // pastikan form ada
    if (item) {
        // Mode edit
        window.paletRows = JSON.parse(JSON.stringify(item.hasilPalet || []));
        document.getElementById("p-tanggal").value = item.tanggal;
        document.getElementById("p-sawmill").value = item.prosesSawmill;
        document.getElementById("p-masuk").value = item.tenagaMasuk;
        document.getElementById("p-tidakmasuk").value = item.tenagaTidakMasuk;
        document.getElementById("p-catatan").value = item.catatan;
        document.getElementById("p-chamber").value = item.chamber;
        document.getElementById("p-volumeOven").value = item.volumeOven;
        document.getElementById("p-tanggalOven").value = item.tanggalOven;
        document.getElementById("sawmill-form-title").textContent = "✏️ Edit Laporan Sawmill";
    } else {
        // Mode input baru
        document.getElementById("p-tanggal").value = today();
        document.getElementById("p-sawmill").value = "";
        document.getElementById("p-masuk").value = "";
        document.getElementById("p-tidakmasuk").value = "";
        document.getElementById("p-catatan").value = "";
        document.getElementById("p-chamber").value = "";
        document.getElementById("p-volumeOven").value = "";
        document.getElementById("p-tanggalOven").value = "";
        document.getElementById("sawmill-form-title").textContent = "➕ Input Laporan Sawmill";
    }
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

// ========== FILTER BULAN (sama dengan kayu.js, stabil) ==========
function generateMonthOptions() {
    const months = [];
    const todayDate = new Date();
    const thisMonth = todayDate.toISOString().slice(0,7);
    months.push(`<option value="${thisMonth}">Bulan ini (${thisMonth})</option>`);
    for (let i = 1; i <= 11; i++) {
        const d = new Date(todayDate.getFullYear(), todayDate.getMonth() - i, 1);
        const monthStr = d.toISOString().slice(0,7);
        months.push(`<option value="${monthStr}">${monthStr}</option>`);
    }
    months.push(`<option value="all">Semua Bulan</option>`);
    return months.join("");
}

function addMonthFilterToSawmill() {
    const listContainer = document.getElementById("sawmill-list");
    if (!listContainer) return;
    if (document.getElementById("sawmill-filter-bulan")) return;
    const filterDiv = document.createElement("div");
    filterDiv.className = "flex gap10 items-center wrap";
    filterDiv.style.marginBottom = "16px";
    filterDiv.style.background = "var(--bg2)";
    filterDiv.style.padding = "8px";
    filterDiv.style.borderRadius = "var(--radius-sm)";
    filterDiv.innerHTML = `
        <div class="field" style="margin:0;">
            <label style="font-size:10px;">Filter Bulan</label>
            <select id="sawmill-filter-bulan" style="padding:6px; border-radius:var(--radius-sm); background:var(--input-bg); border:1px solid var(--border); color:var(--text);">
                ${generateMonthOptions()}
            </select>
        </div>
        <button class="btn btn-secondary btn-sm" id="sawmill-apply-filter">🔍 Terapkan</button>
    `;
    listContainer.prepend(filterDiv);
    const select = document.getElementById("sawmill-filter-bulan");
    const apply = document.getElementById("sawmill-apply-filter");
    const saved = localStorage.getItem('sawmill_filter_month');
    if (saved && select.querySelector(`option[value="${saved}"]`)) select.value = saved;
    else select.value = new Date().toISOString().slice(0,7);
    const applyFilter = () => {
        localStorage.setItem('sawmill_filter_month', select.value);
        window.renderSawmill();
    };
    apply.onclick = applyFilter;
    select.onchange = applyFilter;
}

function getFilteredSawmill() {
    let bulan = localStorage.getItem('sawmill_filter_month') || new Date().toISOString().slice(0,7);
    const select = document.getElementById("sawmill-filter-bulan");
    if (select && select.value !== bulan) select.value = bulan;
    if (bulan === 'all') return [...window.sawmillList];
    return window.sawmillList.filter(s => s.tanggal && s.tanggal.startsWith(bulan));
}

// ========== RENDER DAFTAR LAPORAN (tidak mengganggu filter) ==========
window.renderSawmill = function() {
    const container = document.getElementById("sawmill-list");
    if (!container) return;
    // Pastikan filter sudah ada
    if (!document.getElementById("sawmill-filter-bulan")) addMonthFilterToSawmill();
    
    const filtered = sortByDateAsc(getFilteredSawmill());
    const totalAll = window.sawmillList.length;
    const countEl = document.getElementById("sawmill-count");
    if (countEl) countEl.textContent = totalAll + " laporan (filter: " + filtered.length + " tampil)";
    
    // Hapus semua isi kecuali filter (filter adalah elemen pertama)
    const filterDiv = document.getElementById("sawmill-filter-bulan")?.closest('.flex');
    if (filterDiv) {
        // Simpan filter, lalu kosongkan container
        const filterClone = filterDiv.cloneNode(true);
        container.innerHTML = '';
        container.appendChild(filterClone);
        // Re-attach event listeners
        const newSelect = filterClone.querySelector("#sawmill-filter-bulan");
        const newApply = filterClone.querySelector("#sawmill-apply-filter");
        if (newApply) newApply.onclick = () => {
            localStorage.setItem('sawmill_filter_month', newSelect.value);
            window.renderSawmill();
        };
        if (newSelect) newSelect.onchange = () => {
            localStorage.setItem('sawmill_filter_month', newSelect.value);
            window.renderSawmill();
        };
    } else {
        container.innerHTML = '';
        addMonthFilterToSawmill();
    }
    
    if (filtered.length === 0) {
        container.insertAdjacentHTML('beforeend', '<div class="empty">📭 Tidak ada laporan sesuai filter</div>');
        return;
    }
    let html = '';
    filtered.forEach(lap => {
        const totalVol = lap.totalVolumePalet || 0;
        const totalSap = lap.totalSap || (lap.hasilPalet ? lap.hasilPalet.reduce((s,p)=>s+p.sap,0) : 0);
        const totalJumlahPalet = lap.totalPalet || (lap.hasilPalet ? lap.hasilPalet.reduce((s,p)=>s+(p.jumlah||0),0) : 0);
        const totalJenis = lap.hasilPalet ? lap.hasilPalet.length : 0;
        let detailTable = '';
        if (lap.hasilPalet && lap.hasilPalet.length) {
            detailTable = `<div style="overflow-x:auto; margin-top:12px;">
                <table style="width:100%; font-size:11px; border-collapse:collapse;">
                    <thead><tr><th>No</th><th>Jml</th><th>Tebal (mm)</th><th>Lebar (cm)</th><th>Panjang (cm)</th><th>SAP</th><th>Volume (m³)</th></tr></thead>
                    <tbody>`;
            lap.hasilPalet.forEach((p, idx) => {
                detailTable += `<tr>
                    <td style="text-align:center;">${idx+1}</td>
                    <td style="text-align:right;">${p.jumlah || 0}</td>
                    <td style="text-align:right;">${p.tebal}</td>
                    <td style="text-align:right;">${p.lebar}</td>
                    <td style="text-align:right;">${p.panjang}</td>
                    <td style="text-align:right;">${p.sap}</td>
                    <td style="text-align:right;">${p.volume.toFixed(4)}</td>
                </tr>`;
            });
            detailTable += `</tbody></table></div>`;
        }
        html += `<div class="laporan-card" style="margin-bottom:16px;">
            <div class="laporan-head" style="display:flex; justify-content:space-between; flex-wrap:wrap;">
                <div>
                    <div class="laporan-title">📅 ${fmtDate(lap.tanggal)}</div>
                    <div class="laporan-sub">${totalJenis} jenis · ${totalJumlahPalet} palet · Total Vol ${fmtDec(totalVol,2)} m³ · Total SAP ${fmt(totalSap)} lbr</div>
                </div>
                <div class="flex gap4">
                    <button class="btn btn-edit btn-sm" onclick="window.editSawmill('${lap.id}')">✏️</button>
                    <button class="btn btn-del btn-sm" onclick="window.deleteSawmill('${lap.id}')">🗑️</button>
                </div>
            </div>
            <div class="stat-pills" style="margin-top:8px;">
                <div class="stat-pill"><span>Proses</span> ${fmtDec(lap.prosesSawmill,2)} m³</div>
                <div class="stat-pill"><span>Rendemen</span> ${fmtDec(lap.randemanSawmill,2)}%</div>
            </div>
            ${detailTable}
            ${lap.catatan ? `<p style="margin-top:8px;">📝 ${lap.catatan}</p>` : ''}
        </div>`;
    });
    container.insertAdjacentHTML('beforeend', html);
};

// ========== RINGKASAN BULANAN ==========
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
        entry.count++;
    });
    const sortedTebal = Array.from(tebalMap.keys()).sort((a,b)=>a-b);
    let html = `
        <div class="summary-row" style="margin-bottom:20px;">
            <div class="summary-card"><div class="summary-label">Total Laporan</div><div class="summary-value">${reports.length}</div></div>
            <div class="summary-card"><div class="summary-label">Total Volume</div><div class="summary-value">${fmtDec(allPalet.reduce((s,p)=>s+p.volume,0),2)} m³</div></div>
            <div class="summary-card"><div class="summary-label">Total SAP</div><div class="summary-value">${fmt(allPalet.reduce((s,p)=>s+p.sap,0))} lembar</div></div>
            <div class="summary-card"><div class="summary-label">Total Palet</div><div class="summary-value">${fmt(allPalet.reduce((s,p)=>s+(p.jumlah||0),0))}</div></div>
        </div>
        <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
                <thead><tr><th>Tebal (mm)</th><th>Total Volume (m³)</th><th>Total SAP</th><th>Total Palet</th><th>Jenis Dimensi</th></tr></thead>
                <tbody>
                    ${sortedTebal.map(tebal => {
                        const d = tebalMap.get(tebal);
                        return `<tr><td style="text-align:right;">${tebal}</td><td style="text-align:right;">${fmtDec(d.volume,2)}</td><td style="text-align:right;">${fmt(d.sap)}</td><td style="text-align:right;">${fmt(d.jumlah)}</td><td style="text-align:center;">${d.count}</td></tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
}

// ========== INISIALISASI RINGKASAN ==========
function initSawmillSummary() {
    const tabSawmill = document.getElementById("tab-sawmill");
    if (!tabSawmill) return;
    if (document.getElementById("sawmill-summary-panel")) return;
    const subtabContainer = tabSawmill.querySelector('.subtab-toggle');
    if (subtabContainer && !subtabContainer.querySelector('[data-subtab="sawmill-summary-panel"]')) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary subtab-btn';
        btn.setAttribute('data-subtab', 'sawmill-summary-panel');
        btn.textContent = '📊 Rangkuman Bulanan';
        btn.onclick = () => {
            document.querySelectorAll('#tab-sawmill .subtab-panel').forEach(p => p.classList.add('hidden'));
            document.getElementById('sawmill-summary-panel').classList.remove('hidden');
            document.querySelectorAll('#tab-sawmill .subtab-btn').forEach(b => {
                b.classList.remove('active', 'btn-primary');
                b.classList.add('btn-secondary');
            });
            btn.classList.add('active', 'btn-primary');
            btn.classList.remove('btn-secondary');
            renderSawmillSummary();
        };
        subtabContainer.appendChild(btn);
    }
    const summaryPanel = document.createElement('div');
    summaryPanel.id = 'sawmill-summary-panel';
    summaryPanel.className = 'subtab-panel hidden';
    summaryPanel.innerHTML = `
        <div class="form-card">
            <div class="form-title">📊 Rangkuman Perolehan Palet per Bulan</div>
            <div class="grid2">
                <div class="field"><label>Bulan (YYYY-MM)</label><input type="month" id="sawmill-summary-bulan" value="${thisMonth()}"></div>
                <div class="field"><button class="btn btn-primary" onclick="renderSawmillSummary()">Tampilkan</button></div>
            </div>
            <div id="sawmill-summary-content"></div>
        </div>
    `;
    const sawmillListPanel = document.getElementById("sawmill-list");
    if (sawmillListPanel) sawmillListPanel.insertAdjacentElement('afterend', summaryPanel);
    else tabSawmill.appendChild(summaryPanel);
}

// ========== START ==========
setTimeout(() => {
    initSawmillSummary();
    addMonthFilterToSawmill();
    window.renderSawmill();
}, 500);