window.paletRows = [];
let sawmillEditId = null;

function hitungVolumePalet(tebal, lebar, panjang, sap) {
    return ((parseFloat(tebal) || 0) / 1000) * ((parseFloat(lebar) || 0) / 100) * ((parseFloat(panjang) || 0) / 100) * (parseFloat(sap) || 0);
}
window.hitungVolumePalet = hitungVolumePalet;

window.addPaletRow = function(d) {
    window.paletRows.push(d || { noPalet: '', tebal: '', lebar: '', panjang: '', jumlahSap: '88', volume: '' });
    renderPaletRows();
    window.updateRendemen();
};

window.removePaletRow = function(i) {
    window.paletRows.splice(i, 1);
    renderPaletRows();
    window.updateRendemen();
};

function renderPaletRows() {
    const c = document.getElementById("palet-container");
    if (!c) return;
    if (!window.paletRows.length) { c.innerHTML = '<p style="color:#666;font-size:12px;">Belum ada palet. Klik "+ Tambah Palet".</p>'; return; }
    c.innerHTML = window.paletRows.map((p, i) => {
        const vol = window.hitungVolumePalet(p.tebal, p.lebar, p.panjang, p.jumlahSap).toFixed(4);
        return `<div class="palet-row-horizontal">
            <div class="palet-field-no"><label>No</label><input type="text" value="${p.noPalet || ''}" placeholder="${(i+1).toString().padStart(3,'0')}" oninput="window.paletRows[${i}].noPalet = this.value"></div>
            <div class="palet-field"><label>Tebal (mm)</label><input type="number" step="any" value="${p.tebal || ''}" oninput="window.paletRows[${i}].tebal = this.value; document.getElementById('palet-vol-${i}').value = window.hitungVolumePalet(window.paletRows[${i}].tebal, window.paletRows[${i}].lebar, window.paletRows[${i}].panjang, window.paletRows[${i}].jumlahSap).toFixed(4); window.updateRendemen()"></div>
            <div class="palet-field"><label>Lebar (cm)</label><input type="number" step="any" value="${p.lebar || ''}" oninput="window.paletRows[${i}].lebar = this.value; document.getElementById('palet-vol-${i}').value = window.hitungVolumePalet(window.paletRows[${i}].tebal, window.paletRows[${i}].lebar, window.paletRows[${i}].panjang, window.paletRows[${i}].jumlahSap).toFixed(4); window.updateRendemen()"></div>
            <div class="palet-field"><label>Panjang (cm)</label><input type="number" step="any" value="${p.panjang || ''}" oninput="window.paletRows[${i}].panjang = this.value; document.getElementById('palet-vol-${i}').value = window.hitungVolumePalet(window.paletRows[${i}].tebal, window.paletRows[${i}].lebar, window.paletRows[${i}].panjang, window.paletRows[${i}].jumlahSap).toFixed(4); window.updateRendemen()"></div>
            <div class="palet-field"><label>SAP</label><input type="number" step="any" value="${p.jumlahSap || ''}" oninput="window.paletRows[${i}].jumlahSap = this.value; document.getElementById('palet-vol-${i}').value = window.hitungVolumePalet(window.paletRows[${i}].tebal, window.paletRows[${i}].lebar, window.paletRows[${i}].panjang, window.paletRows[${i}].jumlahSap).toFixed(4); window.updateRendemen()"></div>
            <div class="palet-field"><label>Vol (m³)</label><input type="number" step="any" id="palet-vol-${i}" value="${vol}" readonly></div>
            <button class="btn btn-del btn-sm palet-delete-btn" onclick="window.removePaletRow(${i})">✕</button>
        </div>`;
    }).join('');
}

window.updateRendemen = function() {
    const sawmill = parseFloat(document.getElementById("p-sawmill")?.value) || 0;
    let totalVol = 0;
    window.paletRows.forEach(r => {
        totalVol += window.hitungVolumePalet(r.tebal, r.lebar, r.panjang, r.jumlahSap);
    });
    const el = document.getElementById("p-randemen");
    if (el) el.value = sawmill > 0 ? ((totalVol / sawmill) * 100).toFixed(2) : "0";
    const tv = document.getElementById("p-totalvolume");
    if (tv) tv.value = totalVol.toFixed(4);
};

window.openSawmillForm = function(item) {
    sawmillEditId = item?.id || null;
    window.paletRows = item ? JSON.parse(JSON.stringify(item.hasilPalet || [])) : [];
    const container = document.getElementById("sawmill-form-container");
    container.innerHTML = `
        <div class="form-title">${item ? "✏️ Edit" : "➕ Input"} Laporan Sawmill</div>
        <div class="grid3">
            <div class="field"><label>Tanggal *</label><input type="date" id="p-tanggal" /></div>
            <div class="field"><label>Proses Sawmill (m³)</label><input type="number" step="any" id="p-sawmill" oninput="window.updateRendemen()" placeholder="Volume kayu" /></div>
            <div class="field"><label>Rendemen (%)</label><input type="number" step="any" id="p-randemen" readonly /></div>
            <div class="field"><label>Open No. *</label><input type="text" id="p-openno" /></div>
        </div>
        <div class="section-head">🪵 Palet yang Dihasilkan</div>
        <div id="palet-container"></div>
        <div class="flex gap10 items-center" style="margin-top:8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.addPaletRow()">+ Tambah Palet</button>
            <div class="field" style="margin-left:auto;width:150px;"><label>Total Volume (m³)</label><input type="number" step="any" id="p-totalvolume" readonly /></div>
        </div>
        <div class="section-head">📝 Catatan Harian</div>
        <div class="grid3">
            <div class="field"><label>Tenaga Masuk</label><input type="number" id="p-masuk" /></div>
            <div class="field"><label>Tidak Masuk</label><input type="number" id="p-tidakmasuk" /></div>
            <div class="field span3"><label>Catatan</label><textarea id="p-catatan" rows="2"></textarea></div>
        </div>
        <div class="section-head">🔥 Oven</div>
        <div class="grid3">
            <div class="field"><label>Chamber</label><select id="p-chamber"><option value="">-- Pilih --</option>${[1,2,3,4,5,6,7].map(i => `<option value="${i}">Chamber ${i}</option>`).join("")}</select></div>
            <div class="field"><label>Volume Oven (m³)</label><input type="number" step="any" id="p-volumeOven" /></div>
            <div class="field"><label>Tgl Mulai Oven</label><input type="date" id="p-tanggalOven" /></div>
        </div>
        <div class="form-actions"><button class="btn btn-secondary" onclick="window.closeSawmillForm()">Batal</button><button class="btn btn-primary" onclick="window.saveSawmill()">Simpan Laporan</button></div>
    `;
    document.getElementById("p-tanggal").value = item?.tanggal || today();
    document.getElementById("p-sawmill").value = item?.prosesSawmill || "";
    document.getElementById("p-openno").value = item?.openNo || "";
    document.getElementById("p-masuk").value = item?.tenagaMasuk || "";
    document.getElementById("p-tidakmasuk").value = item?.tenagaTidakMasuk || "";
    document.getElementById("p-catatan").value = item?.catatan || "";
    document.getElementById("p-chamber").value = item?.chamber || "";
    document.getElementById("p-volumeOven").value = item?.volumeOven || "";
    document.getElementById("p-tanggalOven").value = item?.tanggalOven || "";
    renderPaletRows();
    window.updateRendemen();
    document.getElementById("sawmill-input").classList.remove("hidden");
    document.getElementById("sawmill-list").classList.add("hidden");
};

window.closeSawmillForm = function() {
    document.getElementById("sawmill-input").classList.add("hidden");
    document.getElementById("sawmill-list").classList.remove("hidden");
    sawmillEditId = null;
    window.paletRows = [];
};

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
    window.updateRendemen();
    const hasilPalet = window.paletRows.map((p, idx) => ({
        noPalet: p.noPalet || (idx+1).toString().padStart(3,'0'),
        tebal: parseFloat(p.tebal) || 0,
        lebar: parseFloat(p.lebar) || 0,
        panjang: parseFloat(p.panjang) || 0,
        jumlahSap: parseFloat(p.jumlahSap) || 0,
        volume: window.hitungVolumePalet(p.tebal, p.lebar, p.panjang, p.jumlahSap)
    }));
    const totalVolumePalet = hasilPalet.reduce((s, p) => s + p.volume, 0);
    const selectedChamber = document.getElementById("p-chamber")?.value;
    const volumeOven = parseFloat(document.getElementById("p-volumeOven")?.value) || 0;
    const tanggalOven = document.getElementById("p-tanggalOven")?.value;
    
    const item = {
        id: sawmillEditId || uid(),
        tanggal: tgl,
        prosesSawmill: parseFloat(document.getElementById("p-sawmill")?.value) || 0,
        randemanSawmill: parseFloat(document.getElementById("p-randemen")?.value) || 0,
        openNo: document.getElementById("p-openno")?.value || "",
        hasilPalet,
        totalPalet: hasilPalet.length,
        totalVolumePalet,
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
        logActivity('Update', 'Sawmill', `Open: ${item.openNo}`);

        // Saat edit: hanya update entri oven yang sudah ada (jangan push baru)
        if (selectedChamber && volumeOven > 0 && tanggalOven) {
            const ovenChamber = parseInt(selectedChamber);
            // Cari history oven aktif milik openNo ini
            const existingHistory = window.ovenHistoryList.find(h => h.openNo === item.openNo && h.status === 'active');
            if (existingHistory) {
                // Update data oven yang sudah ada
                existingHistory.chamber = ovenChamber;
                existingHistory.volumeMasuk = volumeOven;
                existingHistory.tanggalMasuk = tanggalOven;
                existingHistory.palet = hasilPalet;
                // Sinkronisasi ovenList
                const oidx = window.ovenList.findIndex(o => o.chamber === ovenChamber);
                if (oidx !== -1) {
                    window.ovenList[oidx] = { chamber: ovenChamber, volume: volumeOven, tanggalMulai: tanggalOven, status: 'active' };
                }
            }
            // Jika tidak ada history aktif (misal sebelumnya tidak ada oven), buat baru
            else {
                window.ovenHistoryList.push({
                    id: uid(),
                    chamber: ovenChamber,
                    openNo: item.openNo,
                    volumeMasuk: volumeOven,
                    tanggalMasuk: tanggalOven,
                    tanggalSelesai: "",
                    status: "active",
                    palet: hasilPalet
                });
                const oidx = window.ovenList.findIndex(o => o.chamber === ovenChamber);
                if (oidx !== -1) {
                    window.ovenList[oidx] = { chamber: ovenChamber, volume: volumeOven, tanggalMulai: tanggalOven, status: 'active' };
                } else {
                    window.ovenList.push({ chamber: ovenChamber, volume: volumeOven, tanggalMulai: tanggalOven, status: 'active' });
                }
            }
        }
    } else {
        window.sawmillList.push(item);
        logActivity('Simpan', 'Sawmill', `Open: ${item.openNo}`);

        // Saat simpan baru: buat entri oven baru jika chamber diisi
        if (selectedChamber && volumeOven > 0 && tanggalOven) {
            const ovenChamber = parseInt(selectedChamber);
            const existingActiveOven = window.ovenList.find(o => o.chamber === ovenChamber && o.status === 'active');
            if (existingActiveOven && !confirmDialog(`Chamber ${ovenChamber} masih aktif dengan openNo lain. Tetap ganti?`)) {
                // Dibatalkan oleh user, lewati bagian oven
            } else {
                // Tutup oven sebelumnya pada chamber ini jika ada
                if (existingActiveOven) {
                    const historyToClose = window.ovenHistoryList.find(h => h.chamber === ovenChamber && h.status === 'active');
                    if (historyToClose) {
                        historyToClose.status = 'completed';
                        historyToClose.tanggalSelesai = today();
                    }
                    existingActiveOven.status = 'empty';
                }
                // Tutup oven sebelumnya dengan openNo sama (jika pindah chamber)
                const existingActiveByOpen = window.ovenHistoryList.find(h => h.openNo === item.openNo && h.status === 'active');
                if (existingActiveByOpen) {
                    existingActiveByOpen.status = 'completed';
                    existingActiveByOpen.tanggalSelesai = today();
                }
                window.ovenHistoryList.push({
                    id: uid(),
                    chamber: ovenChamber,
                    openNo: item.openNo,
                    volumeMasuk: volumeOven,
                    tanggalMasuk: tanggalOven,
                    tanggalSelesai: "",
                    status: "active",
                    palet: hasilPalet
                });
                const oidx = window.ovenList.findIndex(o => o.chamber === ovenChamber);
                if (oidx !== -1) {
                    window.ovenList[oidx] = { chamber: ovenChamber, volume: volumeOven, tanggalMulai: tanggalOven, status: "active" };
                } else {
                    window.ovenList.push({ chamber: ovenChamber, volume: volumeOven, tanggalMulai: tanggalOven, status: "active" });
                }
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
    if (item) logActivity('Hapus', 'Sawmill', `Open: ${item.openNo}`);
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

window.renderSawmill = function() {
    document.getElementById("sawmill-count").textContent = sawmillList.length + " laporan";
    const container = document.getElementById("sawmill-list");
    if (!sawmillList.length) { container.innerHTML = '<div class="empty">📭 Belum ada laporan</div>'; return; }
    const sorted = sortByDateAsc(window.sawmillList);
    container.innerHTML = sorted.map(lap => {
        const totalVol = lap.totalVolumePalet || (lap.hasilPalet || []).reduce((s, p) => s + (p.volume || 0), 0);
        return `<div class="laporan-card">
            <div class="laporan-head"><div><div class="laporan-title">📅 ${fmtDate(lap.tanggal)} · Open ${lap.openNo}</div><div class="laporan-sub">${lap.hasilPalet?.length || 0} palet · Total Vol ${fmtDec(totalVol, 2)} m³</div></div><div class="flex gap4"><button class="btn btn-edit btn-sm" onclick="window.editSawmill('${lap.id}')">✏️</button><button class="btn btn-del btn-sm" onclick="window.deleteSawmill('${lap.id}')">🗑️</button></div></div>
            <div class="stat-pills"><div class="stat-pill"><span class="stat-label">Proses</span><span class="stat-val">${fmtDec(lap.prosesSawmill, 2)} m³</span></div><div class="stat-pill"><span class="stat-label">Rendemen</span><span class="stat-val">${fmtDec(lap.randemanSawmill, 2)}%</span></div></div>
        </div>`;
    }).join("");
};