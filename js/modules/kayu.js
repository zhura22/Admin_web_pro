// kayu.js - perbaikan total subtab Rangkuman

let kayuEditId = null;

// Pastikan panel ringkasan ada
function ensureSummaryPanel() {
    let panel = document.getElementById('kayu-summary-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'kayu-summary-panel';
        panel.className = 'subtab-panel hidden';
        panel.innerHTML = `
            <div class="form-card">
                <div class="form-title">📊 Rangkuman Pembelian Kayu</div>
                <div class="grid2">
                    <div class="field">
                        <label>Bulan (YYYY-MM)</label>
                        <input type="month" id="summary-bulan" value="${thisMonth()}">
                    </div>
                    <div class="field" style="justify-content: flex-end; display: flex; align-items: center;">
                        <button class="btn btn-primary" onclick="window.loadKayuSummary()">Tampilkan</button>
                    </div>
                </div>
                <div id="summary-content"></div>
            </div>
        `;
        // letakkan setelah panel kayu-list
        const kayuListPanel = document.getElementById('kayu-list');
        if (kayuListPanel) kayuListPanel.insertAdjacentElement('afterend', panel);
        else document.getElementById('tab-kayu').appendChild(panel);
    }
    return panel;
}

// Tambahkan tombol subtab Rangkuman
function addSummarySubtabButton() {
    const container = document.querySelector('#tab-kayu .subtab-toggle');
    if (!container) return;
    if (document.getElementById('kayu-summary-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'kayu-summary-btn';
    btn.className = 'btn btn-secondary subtab-btn';
    btn.setAttribute('data-subtab', 'kayu-summary-panel');
    btn.textContent = '📊 Rangkuman';
    btn.onclick = () => {
        // Sembunyikan semua subtab panel
        document.querySelectorAll('#tab-kayu .subtab-panel').forEach(p => p.classList.add('hidden'));
        // Tampilkan panel ringkasan
        const summaryPanel = ensureSummaryPanel();
        summaryPanel.classList.remove('hidden');
        // Update tampilan tombol
        document.querySelectorAll('#tab-kayu .subtab-btn').forEach(b => {
            b.classList.remove('active', 'btn-primary');
            b.classList.add('btn-secondary');
        });
        btn.classList.add('active', 'btn-primary');
        btn.classList.remove('btn-secondary');
        // Muat data
        window.loadKayuSummary();
    };
    container.appendChild(btn);
}

// Fungsi memuat ringkasan
window.loadKayuSummary = function() {
    const bulan = document.getElementById('summary-bulan')?.value;
    if (!bulan) return;
    const dataBulan = window.kayuList.filter(item => item.tanggal && item.tanggal.startsWith(bulan));
    const container = document.getElementById('summary-content');
    if (!container) return;
    
    if (dataBulan.length === 0) {
        container.innerHTML = '<div class="empty">📭 Tidak ada data pembelian kayu pada bulan ini</div>';
        return;
    }
    
    // Agregasi supplier
    const supplierMap = new Map();
    const asalMap = new Map();
    dataBulan.forEach(item => {
        const sup = item.suplier || "Tidak diketahui";
        const asal = item.asal || "Tidak diketahui";
        const vol = parseFloat(item.volume) || 0;
        const harga = parseFloat(item.harga) || 0;
        supplierMap.set(sup, {
            volume: (supplierMap.get(sup)?.volume || 0) + vol,
            harga: (supplierMap.get(sup)?.harga || 0) + harga
        });
        asalMap.set(asal, {
            volume: (asalMap.get(asal)?.volume || 0) + vol,
            harga: (asalMap.get(asal)?.harga || 0) + harga
        });
    });
    
    const supplierData = Array.from(supplierMap.entries()).map(([name, val]) => ({ name, volume: val.volume, harga: val.harga }));
    supplierData.sort((a,b) => b.volume - a.volume);
    const asalData = Array.from(asalMap.entries()).map(([name, val]) => ({ name, volume: val.volume, harga: val.harga }));
    asalData.sort((a,b) => b.volume - a.volume);
    
    const totalVolume = dataBulan.reduce((s, item) => s + (parseFloat(item.volume) || 0), 0);
    const totalHarga = dataBulan.reduce((s, item) => s + (parseFloat(item.harga) || 0), 0);
    const totalNota = dataBulan.length;
    
    container.innerHTML = `
        <div class="summary-row" style="margin-bottom: 20px;">
            <div class="summary-card"><div class="summary-label">Total Nota</div><div class="summary-value">${totalNota}</div></div>
            <div class="summary-card"><div class="summary-label">Total Volume</div><div class="summary-value">${fmtDec(totalVolume,2)} m³</div></div>
            <div class="summary-card"><div class="summary-label">Total Nilai</div><div class="summary-value">Rp ${fmt(totalHarga)}</div></div>
            <div class="summary-card"><div class="summary-label">Rata² Harga/m³</div><div class="summary-value">Rp ${fmt(Math.round(totalVolume>0?totalHarga/totalVolume:0))}</div></div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 20px;">
            <div style="flex:1; min-width: 250px;">
                <div class="section-head">📦 Per Supplier</div>
                <div class="table-wrap">
                    <table style="width:100%">
                        <thead><tr><th>Supplier</th><th>Volume (m³)</th><th>Nilai (Rp)</th><th>Rata²</th></tr></thead>
                        <tbody>${supplierData.map(s => {
                            const avg = s.volume > 0 ? s.harga / s.volume : 0;
                            return `<tr><td>${s.name}</td><td class="right">${fmtDec(s.volume,2)}</td><td class="right">Rp ${fmt(s.harga)}</td><td class="right">Rp ${fmt(Math.round(avg))}</td></tr>`;
                        }).join('')}</tbody>
                    </table>
                </div>
            </div>
            <div style="flex:1; min-width: 250px;">
                <div class="section-head">📍 Per Asal</div>
                <div class="table-wrap">
                    <table style="width:100%">
                        <thead><tr><th>Asal</th><th>Volume (m³)</th><th>Nilai (Rp)</th><th>Rata²</th></tr></thead>
                        <tbody>${asalData.map(a => {
                            const avg = a.volume > 0 ? a.harga / a.volume : 0;
                            return `<tr><td>${a.name}</td><td class="right">${fmtDec(a.volume,2)}</td><td class="right">Rp ${fmt(a.harga)}</td><td class="right">Rp ${fmt(Math.round(avg))}</td></tr>`;
                        }).join('')}</tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
};

// Fungsi CRUD (sama seperti sebelumnya)
window.openKayuForm = function(item) {
    kayuEditId = item?.id || null;
    document.getElementById("kayu-form-title").textContent = item ? "✏️ Edit" : "➕ Input";
    document.getElementById("k-tanggal").value = item?.tanggal || today();
    document.getElementById("k-nonota").value = item?.noNota || "";
    document.getElementById("k-notruk").value = item?.noTruk || "";
    document.getElementById("k-batang").value = item?.jumlahBatang || "";
    document.getElementById("k-volume").value = item?.volume || "";
    document.getElementById("k-harga").value = item?.harga || "";
    document.getElementById("k-suplier").value = item?.suplier || "";
    document.getElementById("k-asal").value = item?.asal || "";
    document.getElementById("k-jenis").value = item?.jenis || "glondong";
    document.getElementById("k-grade").value = item?.grade || "bagus";
    document.getElementById("kayu-input").classList.remove("hidden");
    document.getElementById("kayu-list").classList.add("hidden");
    document.getElementById("kayu-summary-panel")?.classList.add("hidden");
};

window.closeKayuForm = function() {
    document.getElementById("kayu-input").classList.add("hidden");
    document.getElementById("kayu-list").classList.remove("hidden");
    kayuEditId = null;
};

window.saveKayu = function() {
    const tgl = document.getElementById("k-tanggal").value.trim();
    const noNota = document.getElementById("k-nonota").value.trim();
    const suplier = document.getElementById("k-suplier").value.trim();
    if (!tgl || !noNota || !suplier) { toast("⚠️ Tanggal, Nota, Suplier wajib!"); return; }
    const item = {
        id: kayuEditId || uid(),
        tanggal: tgl,
        noNota,
        noTruk: document.getElementById("k-notruk").value.trim(),
        jumlahBatang: parseFloat(document.getElementById("k-batang").value) || 0,
        volume: parseFloat(document.getElementById("k-volume").value) || 0,
        harga: parseFloat(document.getElementById("k-harga").value) || 0,
        suplier,
        asal: document.getElementById("k-asal").value.trim(),
        jenis: document.getElementById("k-jenis").value,
        grade: document.getElementById("k-grade").value
    };
    if (kayuEditId) {
        window.kayuList = window.kayuList.map(x => x.id === kayuEditId ? item : x);
        logActivity('Update', 'Kayu', `Nota: ${item.noNota}`);
    } else {
        window.kayuList.push(item);
        logActivity('Simpan', 'Kayu', `Nota: ${item.noNota}`);
    }
    persistAll();
    closeKayuForm();
    renderKayu();
    toast("✅ Disimpan");
};

window.deleteKayu = function(id) {
    const item = window.kayuList.find(x => x.id === id);
    if (item) logActivity('Hapus', 'Kayu', `Nota: ${item.noNota}`);
    if (!confirmDialog("Hapus?")) return;
    window.kayuList = window.kayuList.filter(x => x.id !== id);
    persistAll();
    renderKayu();
    toast("🗑️ Dihapus");
};

window.editKayu = function(id) {
    const item = window.kayuList.find(x => x.id === id);
    if (item) openKayuForm(item);
};

window.renderKayu = function() {
    const q = (document.getElementById("kayu-search")?.value || "").toLowerCase();
    const sorted = sortByDateAsc(window.kayuList);
    const filtered = sorted.filter(x => 
        (x.suplier || "").toLowerCase().includes(q) || 
        (x.noNota || "").toLowerCase().includes(q) || 
        (x.asal || "").toLowerCase().includes(q)
    );
    document.getElementById("kayu-count").textContent = window.kayuList.length + " transaksi";
    const totVol = filtered.reduce((s, x) => s + (parseFloat(x.volume) || 0), 0);
    const totHarga = filtered.reduce((s, x) => s + (parseFloat(x.harga) || 0), 0);
    document.getElementById("s-k-total").textContent = filtered.length + " nota";
    document.getElementById("s-k-vol").textContent = fmtDec(totVol, 3) + " m³";
    document.getElementById("s-k-harga").textContent = "Rp " + fmt(totHarga);
    document.getElementById("s-k-avgprice").textContent = "Rp " + fmt(totVol > 0 ? Math.round(totHarga / totVol) : 0) + "/m³";
    const tbody = document.getElementById("kayu-tbody");
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="11" class="empty">📭 Belum ada data</tr>'; return; }
    tbody.innerHTML = filtered.map((r, i) => `
        <tr class="${i % 2 ? 'odd' : 'even'}">
            <td class="center">${i+1}</td>
            <td>${fmtDate(r.tanggal)}</td>
            <td class="highlight">${r.noNota}</td>
            <td>${r.suplier}</td>
            <td>${r.asal || "-"}</td>
            <td>${r.jenis === 'papan' ? 'Papan' : 'Glondong'}</td>
            <td>${r.grade === 'jelek' ? '🔴 Jelek' : '🟢 Bagus'}</td>
            <td class="right">${fmt(r.jumlahBatang)}</td>
            <td class="right">${fmtDec(r.volume, 3)}</td>
            <td class="right">Rp ${fmt(r.harga)}</td>
            <td><div class="flex gap4"><button class="btn btn-edit btn-sm" onclick="window.editKayu('${r.id}')">✏️</button><button class="btn btn-del btn-sm" onclick="window.deleteKayu('${r.id}')">🗑️</button></div></td>
        </tr>
    `).join("");
    // Pastikan tombol dan panel ringkasan ada
    ensureSummaryPanel();
    addSummarySubtabButton();
};

// Inisialisasi awal
setTimeout(() => {
    ensureSummaryPanel();
    addSummarySubtabButton();
}, 500);