let produksiEditId = null;
window._produksiSumberPalet = [];

window.openProduksiForm = function(item) {
    produksiEditId = item?.id || null;
    window._produksiSumberPalet = item ? JSON.parse(JSON.stringify(item.asalPalet || [])) : [];
    const container = document.getElementById("produksi-form-container");
    container.innerHTML = `
        <div class="form-title">${item ? "✏️ Edit" : "➕ Input"} Laporan Produksi</div>
        <div class="section-head">📅 Informasi Umum</div>
        <div class="grid2"><div class="field"><label>Tanggal *</label><input type="date" id="prod-tanggal" /></div><div class="field"><label>Batch Produksi</label><input type="text" id="prod-openno" placeholder="Contoh: Batch A" /></div></div>
        <div class="section-head">📋 Sumber Palet (dari oven)</div><div id="sumber-palet-container"></div>
        <button class="btn btn-secondary btn-sm mt8" onclick="window.tambahSumberPalet()">+ Tambah Sumber</button>
        <div class="section-head">🕛 SHIFT 1</div>
        <div class="grid3">
            <div class="field"><label>Planer - Palet</label><input type="number" id="prod-s1-planer-palet" /></div>
            <div class="field"><label>Planer - Bagus (m³)</label><input type="number" step="any" id="prod-s1-planer-bagus" /></div>
            <div class="field"><label>Planer - Mis (sap)</label><input type="number" id="prod-s1-planer-mis" /></div>
            <div class="field"><label>Ripsaw - Input</label><input type="number" step="any" id="prod-s1-ripsaw-in" /></div>
            <div class="field"><label>Seri - Hasil</label><input type="number" id="prod-s1-seri" /></div>
            <div class="field"><label>Press - Hasil</label><input type="number" id="prod-s1-press" /></div>
        </div>
        <div class="grid2 mt8"><div class="field"><label>Tenaga Masuk</label><input type="number" id="prod-s1-masuk" /></div><div class="field"><label>Tidak Masuk</label><input type="number" id="prod-s1-tidakmasuk" /></div></div>
        <div class="section-head">🌙 SHIFT 2</div>
        <div class="grid3">
            <div class="field"><label>Planer - Palet</label><input type="number" id="prod-s2-planer-palet" /></div>
            <div class="field"><label>Planer - Bagus (m³)</label><input type="number" step="any" id="prod-s2-planer-bagus" /></div>
            <div class="field"><label>Planer - Mis (sap)</label><input type="number" id="prod-s2-planer-mis" /></div>
            <div class="field"><label>Ripsaw - Input</label><input type="number" step="any" id="prod-s2-ripsaw-in" /></div>
            <div class="field"><label>Seri - Hasil</label><input type="number" id="prod-s2-seri" /></div>
            <div class="field"><label>Press - Hasil</label><input type="number" id="prod-s2-press" /></div>
        </div>
        <div class="grid2 mt8"><div class="field"><label>Tenaga Masuk</label><input type="number" id="prod-s2-masuk" /></div><div class="field"><label>Tidak Masuk</label><input type="number" id="prod-s2-tidakmasuk" /></div></div>
        <div class="section-head">🗑️ Limbah & Reject</div>
        <div class="grid2">
            <div class="field"><label>Limbah (m³)</label><input type="number" step="any" id="prod-limbah" /></div>
            <div class="field"><label>Reject Board (pcs)</label><input type="number" step="any" id="prod-reject" /></div>
            <div class="field"><label>Keterangan</label><input type="text" id="prod-keterangan" /></div>
        </div>
        <div class="form-actions"><button class="btn btn-secondary" onclick="window.closeProduksiForm()">Batal</button><button class="btn btn-primary" onclick="window.saveProduksi()">Simpan</button></div>
    `;
    if (item) {
        document.getElementById("prod-tanggal").value = item.tanggal || "";
        document.getElementById("prod-openno").value = item.openNo || "";
        const s1 = item.shift1 || {}, s2 = item.shift2 || {};
        document.getElementById("prod-s1-planer-palet").value = s1.planerPalet || "";
        document.getElementById("prod-s1-planer-bagus").value = s1.planerBagus || "";
        document.getElementById("prod-s1-planer-mis").value = s1.planerMis || "";
        document.getElementById("prod-s1-ripsaw-in").value = s1.ripsawIn || "";
        document.getElementById("prod-s1-seri").value = s1.seri || "";
        document.getElementById("prod-s1-press").value = s1.press || "";
        document.getElementById("prod-s1-masuk").value = s1.masuk || "";
        document.getElementById("prod-s1-tidakmasuk").value = s1.tidakMasuk || "";
        document.getElementById("prod-s2-planer-palet").value = s2.planerPalet || "";
        document.getElementById("prod-s2-planer-bagus").value = s2.planerBagus || "";
        document.getElementById("prod-s2-planer-mis").value = s2.planerMis || "";
        document.getElementById("prod-s2-ripsaw-in").value = s2.ripsawIn || "";
        document.getElementById("prod-s2-seri").value = s2.seri || "";
        document.getElementById("prod-s2-press").value = s2.press || "";
        document.getElementById("prod-s2-masuk").value = s2.masuk || "";
        document.getElementById("prod-s2-tidakmasuk").value = s2.tidakMasuk || "";
        document.getElementById("prod-limbah").value = item.limbah || "";
        document.getElementById("prod-reject").value = item.reject || "";
        document.getElementById("prod-keterangan").value = item.keterangan || "";
    } else {
        document.getElementById("prod-tanggal").value = today();
    }
    renderSumberPalet();
    document.getElementById("produksi-input").classList.remove("hidden");
    document.getElementById("produksi-list").classList.add("hidden");
};

window.tambahSumberPalet = function() {
    window._produksiSumberPalet.push({ openNo: "", jumlahPalet: "", volume: "" });
    renderSumberPalet();
};

window.hapusSumberPalet = function(i) {
    window._produksiSumberPalet.splice(i, 1);
    renderSumberPalet();
};

function renderSumberPalet() {
    const c = document.getElementById("sumber-palet-container");
    if (!c) return;
    if (!window._produksiSumberPalet.length) { c.innerHTML = '<p style="color:#666">Belum ada sumber palet.</p>'; return; }
    const openList = [...new Set(window.sawmillList.map(s => s.openNo).filter(Boolean))];
    c.innerHTML = window._produksiSumberPalet.map((s, i) => {
        const openOptions = openList.map(no =>
            `<option value="${no}"${no === s.openNo ? ' selected' : ''}>${no}</option>`
        ).join("");
        return `
        <div class="palet-row-horizontal">
            <div class="palet-field"><label>Open No.</label><select onchange="window._produksiSumberPalet[${i}].openNo = this.value"><option value="">--Pilih--</option>${openOptions}</select></div>
            <div class="palet-field"><label>Jumlah</label><input type="number" step="any" value="${s.jumlahPalet || ''}" oninput="window._produksiSumberPalet[${i}].jumlahPalet = this.value"></div>
            <div class="palet-field"><label>Volume (m³)</label><input type="number" step="any" value="${s.volume || ''}" oninput="window._produksiSumberPalet[${i}].volume = this.value"></div>
            <button class="btn btn-del btn-sm palet-delete-btn" onclick="window.hapusSumberPalet(${i})">✕</button>
        </div>
    `}).join('');
}

window.closeProduksiForm = function() {
    document.getElementById("produksi-input").classList.add("hidden");
    document.getElementById("produksi-list").classList.remove("hidden");
    produksiEditId = null;
    window._produksiSumberPalet = [];
};

window.saveProduksi = function() {
    const tgl = document.getElementById("prod-tanggal")?.value;
    const openNo = document.getElementById("prod-openno")?.value.trim();
    if (!tgl) { toast("⚠️ Tanggal wajib diisi!"); return; }
    const shift1 = {
        planerPalet: parseInt(document.getElementById("prod-s1-planer-palet")?.value) || 0,
        planerBagus: parseFloat(document.getElementById("prod-s1-planer-bagus")?.value) || 0,
        planerMis: parseInt(document.getElementById("prod-s1-planer-mis")?.value) || 0,
        ripsawIn: parseFloat(document.getElementById("prod-s1-ripsaw-in")?.value) || 0,
        seri: parseInt(document.getElementById("prod-s1-seri")?.value) || 0,
        press: parseInt(document.getElementById("prod-s1-press")?.value) || 0,
        masuk: parseInt(document.getElementById("prod-s1-masuk")?.value) || 0,
        tidakMasuk: parseInt(document.getElementById("prod-s1-tidakmasuk")?.value) || 0
    };
    const shift2 = {
        planerPalet: parseInt(document.getElementById("prod-s2-planer-palet")?.value) || 0,
        planerBagus: parseFloat(document.getElementById("prod-s2-planer-bagus")?.value) || 0,
        planerMis: parseInt(document.getElementById("prod-s2-planer-mis")?.value) || 0,
        ripsawIn: parseFloat(document.getElementById("prod-s2-ripsaw-in")?.value) || 0,
        seri: parseInt(document.getElementById("prod-s2-seri")?.value) || 0,
        press: parseInt(document.getElementById("prod-s2-press")?.value) || 0,
        masuk: parseInt(document.getElementById("prod-s2-masuk")?.value) || 0,
        tidakMasuk: parseInt(document.getElementById("prod-s2-tidakmasuk")?.value) || 0
    };
    const item = {
        id: produksiEditId || uid(),
        tanggal: tgl,
        openNo,
        asalPalet: window._produksiSumberPalet.filter(s => s.openNo),
        shift1,
        shift2,
        limbah: parseFloat(document.getElementById("prod-limbah")?.value) || 0,
        reject: parseInt(document.getElementById("prod-reject")?.value) || 0,
        keterangan: document.getElementById("prod-keterangan")?.value || ""
    };
    if (produksiEditId) {
        window.produksiList = window.produksiList.map(x => x.id === produksiEditId ? item : x);
        logActivity('Update', 'Produksi', `Batch: ${item.openNo}`);
    } else {
        window.produksiList.push(item);
        logActivity('Simpan', 'Produksi', `Batch: ${item.openNo}`);
    }
    persistAll();
    closeProduksiForm();
    renderProduksi();
    renderBatch();
    renderRekap();
    toast("✅ Laporan produksi disimpan!");
};

window.deleteProduksi = function(id) {
    const item = window.produksiList.find(x => x.id === id);
    if (item) logActivity('Hapus', 'Produksi', `Batch: ${item.openNo}`);
    if (!confirmDialog("Hapus?")) return;
    window.produksiList = window.produksiList.filter(x => x.id !== id);
    persistAll();
    renderProduksi();
    renderBatch();
    renderRekap();
    toast("🗑️ Dihapus");
};

window.editProduksi = function(id) {
    const item = window.produksiList.find(x => x.id === id);
    if (item) openProduksiForm(item);
};

window.renderProduksi = function() {
    document.getElementById("produksi-count").textContent = window.produksiList.length + " laporan";
    const container = document.getElementById("produksi-list");
    if (!window.produksiList.length) { container.innerHTML = '<div class="empty">📭 Belum ada laporan</div>'; return; }
    const sorted = sortByDateAsc(window.produksiList);
    container.innerHTML = sorted.map(l => {
        const s1 = l.shift1 || {}, s2 = l.shift2 || {};
        const planerBagus = (s1.planerBagus || 0) + (s2.planerBagus || 0);
        const planerMis = (s1.planerMis || 0) + (s2.planerMis || 0);
        const seri = (s1.seri || 0) + (s2.seri || 0);
        const press = (s1.press || 0) + (s2.press || 0);
        const ripsawIn = (s1.ripsawIn || 0) + (s2.ripsawIn || 0);
        const sumberInfo = (l.asalPalet && l.asalPalet.length > 0) ? l.asalPalet.map(p => `Open ${p.openNo}: ${p.jumlahPalet} plt (${fmtDec(p.volume, 2)} m³)`).join(', ') : '-';
        const totalMasuk = (s1.masuk || 0) + (s2.masuk || 0);
        const totalTidak = (s1.tidakMasuk || 0) + (s2.tidakMasuk || 0);
        return `<div class="laporan-card">
            <div class="laporan-head"><div><div class="laporan-title">📅 ${fmtDate(l.tanggal)} · ${l.openNo || 'Tanpa Batch'}</div><div class="laporan-sub">Sumber: ${sumberInfo} · Bagus: ${fmtDec(planerBagus, 2)} m³ · Mis: ${planerMis} sap · Ripsaw in: ${fmtDec(ripsawIn, 2)} plt</div></div><div class="flex gap4"><button class="btn btn-edit btn-sm" onclick="editProduksi('${l.id}')">✏️</button><button class="btn btn-del btn-sm" onclick="deleteProduksi('${l.id}')">🗑️</button></div></div>
            <div class="produksi-shift-card"><div class="produksi-shift-title">🕛 Shift 1 (Tenaga: ${s1.masuk || 0} / ${(s1.masuk || 0)+(s1.tidakMasuk || 0)})</div><div class="stat-pills"><div class="stat-pill"><span class="stat-label">Planer</span><span class="stat-val">${s1.planerPalet || 0} plt</span></div><div class="stat-pill"><span class="stat-label">Bagus</span><span class="stat-val">${fmtDec(s1.planerBagus, 2)} m³</span></div><div class="stat-pill"><span class="stat-label">Mis</span><span class="stat-val">${s1.planerMis || 0} sap</span></div><div class="stat-pill"><span class="stat-label">Ripsaw in</span><span class="stat-val">${fmtDec(s1.ripsawIn, 2)} plt</span></div><div class="stat-pill"><span class="stat-label">Seri</span><span class="stat-val">${s1.seri || 0} lbr</span></div><div class="stat-pill"><span class="stat-label">Press</span><span class="stat-val">${s1.press || 0} lbr</span></div></div></div>
            <div class="produksi-shift-card"><div class="produksi-shift-title">🌙 Shift 2 (Tenaga: ${s2.masuk || 0} / ${(s2.masuk || 0)+(s2.tidakMasuk || 0)})</div><div class="stat-pills"><div class="stat-pill"><span class="stat-label">Planer</span><span class="stat-val">${s2.planerPalet || 0} plt</span></div><div class="stat-pill"><span class="stat-label">Bagus</span><span class="stat-val">${fmtDec(s2.planerBagus, 2)} m³</span></div><div class="stat-pill"><span class="stat-label">Mis</span><span class="stat-val">${s2.planerMis || 0} sap</span></div><div class="stat-pill"><span class="stat-label">Ripsaw in</span><span class="stat-val">${fmtDec(s2.ripsawIn, 2)} plt</span></div><div class="stat-pill"><span class="stat-label">Seri</span><span class="stat-val">${s2.seri || 0} lbr</span></div><div class="stat-pill"><span class="stat-label">Press</span><span class="stat-val">${s2.press || 0} lbr</span></div></div></div>
            <div class="stat-pills"><div class="stat-pill"><span class="stat-label">Total Tenaga</span><span class="stat-val">${totalMasuk} / ${totalMasuk+totalTidak}</span></div>${l.limbah ? `<div class="stat-pill"><span class="stat-label">Limbah</span><span class="stat-val">${fmtDec(l.limbah, 2)} m³</span></div>` : ''}${l.reject ? `<div class="stat-pill"><span class="stat-label">Reject</span><span class="stat-val">${l.reject} pcs</span></div>` : ''}</div>
            ${l.keterangan ? `<p style="margin-top:6px;color:#888;font-size:11px;">📝 ${l.keterangan}</p>` : ''}
        </div>`;
    }).join("");
};