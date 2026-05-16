// kayu.js - dengan filter bulan yang lebih baik (Bulan Ini sebagai default)

let kayuEditId = null;

function resetKayuForm() {
    document.getElementById("k-tanggal").value = today();
    document.getElementById("k-nonota").value = "";
    document.getElementById("k-notruk").value = "";
    document.getElementById("k-batang").value = "";
    document.getElementById("k-volume").value = "";
    document.getElementById("k-harga").value = "";
    document.getElementById("k-suplier").value = "";
    document.getElementById("k-asal").value = "";
    document.getElementById("k-jenis").value = "glondong";
    document.getElementById("k-grade").value = "bagus";
    kayuEditId = null;
    document.getElementById("kayu-form-title").textContent = "➕ Input Pembelian Kayu";
}

window.openKayuForm = function(item) {
    if (item) {
        kayuEditId = item.id;
        document.getElementById("k-tanggal").value = item.tanggal;
        document.getElementById("k-nonota").value = item.noNota;
        document.getElementById("k-notruk").value = item.noTruk || "";
        document.getElementById("k-batang").value = item.jumlahBatang;
        document.getElementById("k-volume").value = item.volume;
        document.getElementById("k-harga").value = item.harga;
        document.getElementById("k-suplier").value = item.suplier;
        document.getElementById("k-asal").value = item.asal || "";
        document.getElementById("k-jenis").value = item.jenis;
        document.getElementById("k-grade").value = item.grade;
        document.getElementById("kayu-form-title").textContent = "✏️ Edit";
    } else {
        resetKayuForm();
    }
    document.getElementById("kayu-input").classList.remove("hidden");
    document.getElementById("kayu-list").classList.add("hidden");
    const summaryPanel = document.getElementById("kayu-summary-panel");
    if (summaryPanel) summaryPanel.classList.add("hidden");
};

window.closeKayuForm = function() {
    document.getElementById("kayu-input").classList.add("hidden");
    document.getElementById("kayu-list").classList.remove("hidden");
    resetKayuForm();
};

window.saveKayu = function() {
    const tgl = document.getElementById("k-tanggal").value.trim();
    const noNota = document.getElementById("k-nonota").value.trim();
    const suplier = document.getElementById("k-suplier").value.trim();
    if (!tgl || !noNota || !suplier) {
        toast("⚠️ Tanggal, Nota, Suplier wajib!");
        return;
    }
    const existing = window.kayuList.find(k => k.noNota === noNota && (kayuEditId ? k.id !== kayuEditId : true));
    if (existing) {
        toast(`⚠️ Nota ${noNota} sudah pernah diinput pada tanggal ${fmtDate(existing.tanggal)} oleh ${existing.suplier}`);
        return;
    }
    const item = {
        id: kayuEditId || uid(),
        tanggal: tgl,
        noNota: noNota,
        noTruk: document.getElementById("k-notruk").value.trim(),
        jumlahBatang: parseFloat(document.getElementById("k-batang").value) || 0,
        volume: parseFloat(document.getElementById("k-volume").value) || 0,
        harga: parseFloat(document.getElementById("k-harga").value) || 0,
        suplier: suplier,
        asal: document.getElementById("k-asal").value.trim(),
        jenis: document.getElementById("k-jenis").value,
        grade: document.getElementById("k-grade").value
    };
    if (kayuEditId) {
        window.kayuList = window.kayuList.map(x => x.id === kayuEditId ? item : x);
        logActivity('Update', 'Kayu', `Nota: ${item.noNota}`);
        toast("✅ Data berhasil diupdate");
    } else {
        window.kayuList.push(item);
        logActivity('Simpan', 'Kayu', `Nota: ${item.noNota}`);
        toast("✅ Data berhasil disimpan");
    }
    persistAll();
    resetKayuForm();
    renderKayu();
    if (typeof window.loadKayuSummary === 'function') window.loadKayuSummary();
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

// Filter bulan yang lebih baik
function getSelectedMonth() {
    const filterVal = document.getElementById("kayu-filter-bulan")?.value;
    if (!filterVal || filterVal === "all") return null;
    if (filterVal === "this_month") return thisMonth();
    return filterVal;
}

function getFilteredKayu() {
    const selectedMonth = getSelectedMonth();
    const keyword = (document.getElementById("kayu-search")?.value || "").toLowerCase();
    let filtered = [...window.kayuList];
    if (selectedMonth) {
        filtered = filtered.filter(x => x.tanggal && x.tanggal.startsWith(selectedMonth));
    }
    if (keyword) {
        filtered = filtered.filter(x => 
            (x.suplier || "").toLowerCase().includes(keyword) || 
            (x.noNota || "").toLowerCase().includes(keyword) || 
            (x.asal || "").toLowerCase().includes(keyword)
        );
    }
    return sortByDateAsc(filtered);
}

window.renderKayu = function() {
    const filtered = getFilteredKayu();
    const totalNota = filtered.length;
    const totalVolume = filtered.reduce((s, x) => s + (parseFloat(x.volume) || 0), 0);
    const totalHarga = filtered.reduce((s, x) => s + (parseFloat(x.harga) || 0), 0);
    const avgPrice = totalVolume > 0 ? totalHarga / totalVolume : 0;

    document.getElementById("kayu-count").textContent = window.kayuList.length + " transaksi (filter: " + totalNota + " tampil)";
    document.getElementById("s-k-total").textContent = totalNota + " nota";
    document.getElementById("s-k-vol").textContent = fmtDec(totalVolume, 3) + " m³";
    document.getElementById("s-k-harga").textContent = "Rp " + fmt(totalHarga);
    document.getElementById("s-k-avgprice").textContent = "Rp " + fmt(Math.round(avgPrice)) + "/m³";

    const tbody = document.getElementById("kayu-tbody");
    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="11" class="empty">📭 Tidak ada data sesuai filter</td></tr>';
        return;
    }
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
            <td class="action-buttons">
                <button class="btn btn-edit btn-sm" onclick="window.editKayu('${r.id}')">✏️</button>
                <button class="btn btn-del btn-sm" onclick="window.deleteKayu('${r.id}')">🗑️</button>
            </td>
        </tr>
    `).join("");
};

function addMonthFilterToKayu() {
    const kayuListPanel = document.getElementById("kayu-list");
    if (!kayuListPanel) return;
    if (document.getElementById("kayu-filter-bulan")) return;

    const filterContainer = document.createElement("div");
    filterContainer.className = "flex gap10 items-center wrap";
    filterContainer.style.marginBottom = "12px";
    filterContainer.style.padding = "8px";
    filterContainer.style.background = "var(--bg2)";
    filterContainer.style.borderRadius = "var(--radius-sm)";
    
    // Generate option bulan
    let options = `<option value="all">📅 Semua Bulan</option>
                   <option value="this_month" selected>📆 Bulan Ini (${thisMonth()})</option>`;
    // Tambahkan 12 bulan terakhir (kecuali bulan ini sudah diwakili)
    const currentDate = new Date();
    for (let i = 1; i <= 12; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStr = d.toISOString().slice(0, 7);
        if (monthStr !== thisMonth()) {
            options += `<option value="${monthStr}">${monthStr}</option>`;
        }
    }
    
    filterContainer.innerHTML = `
        <div class="field" style="margin:0; flex:2;">
            <label style="font-size:10px;">📅 Filter Bulan</label>
            <select id="kayu-filter-bulan" style="width:100%; padding:6px; border-radius:var(--radius-sm); background:var(--input-bg); border:1px solid var(--border); color:var(--text);">
                ${options}
            </select>
        </div>
        <div class="field" style="margin:0; flex:1;">
            <label style="font-size:10px;">🔍 Reset</label>
            <button class="btn btn-secondary btn-sm" id="kayu-reset-filter" style="width:100%;">Reset Filter</button>
        </div>
    `;
    const summaryRow = kayuListPanel.querySelector(".summary-row");
    if (summaryRow) {
        summaryRow.insertAdjacentElement("beforebegin", filterContainer);
    } else {
        kayuListPanel.prepend(filterContainer);
    }

    document.getElementById("kayu-filter-bulan").onchange = () => window.renderKayu();
    document.getElementById("kayu-reset-filter").onclick = () => {
        document.getElementById("kayu-filter-bulan").value = "this_month";
        document.getElementById("kayu-search").value = "";
        window.renderKayu();
    };
}

// Ringkasan (tidak diubah)
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
                    <div class="field"><label>Bulan (YYYY-MM)</label><input type="month" id="summary-bulan" value="${thisMonth()}"></div>
                    <div class="field"><button class="btn btn-primary" onclick="window.loadKayuSummary()">Tampilkan</button></div>
                </div>
                <div id="summary-content"></div>
            </div>
        `;
        const kayuListPanel = document.getElementById('kayu-list');
        if (kayuListPanel) kayuListPanel.insertAdjacentElement('afterend', panel);
        else document.getElementById('tab-kayu').appendChild(panel);
    }
    return panel;
}

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
        document.querySelectorAll('#tab-kayu .subtab-panel').forEach(p => p.classList.add('hidden'));
        const summaryPanel = ensureSummaryPanel();
        summaryPanel.classList.remove('hidden');
        document.querySelectorAll('#tab-kayu .subtab-btn').forEach(b => {
            b.classList.remove('active', 'btn-primary');
            b.classList.add('btn-secondary');
        });
        btn.classList.add('active', 'btn-primary');
        btn.classList.remove('btn-secondary');
        window.loadKayuSummary();
    };
    container.appendChild(btn);
}

window.loadKayuSummary = function() {
    const bulan = document.getElementById("summary-bulan")?.value || thisMonth();
    const dataBulan = window.kayuList.filter(item => item.tanggal && item.tanggal.startsWith(bulan));
    const container = document.getElementById("summary-content");
    if (!container) return;
    if (dataBulan.length === 0) {
        container.innerHTML = '<div class="empty">📭 Tidak ada data pembelian kayu pada bulan ini</div>';
        return;
    }
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
    const supplierData = Array.from(supplierMap.entries()).map(([name, val]) => ({ name, volume: val.volume, harga: val.harga })).sort((a,b) => b.volume - a.volume);
    const asalData = Array.from(asalMap.entries()).map(([name, val]) => ({ name, volume: val.volume, harga: val.harga })).sort((a,b) => b.volume - a.volume);
    const totalVolume = dataBulan.reduce((s, item) => s + (parseFloat(item.volume) || 0), 0);
    const totalHarga = dataBulan.reduce((s, item) => s + (parseFloat(item.harga) || 0), 0);
    const totalNota = dataBulan.length;
    container.innerHTML = `
        <div class="summary-row" style="margin-bottom:20px;">
            <div class="summary-card"><div class="summary-label">Total Nota</div><div class="summary-value">${totalNota}</div></div>
            <div class="summary-card"><div class="summary-label">Total Volume</div><div class="summary-value">${fmtDec(totalVolume,2)} m³</div></div>
            <div class="summary-card"><div class="summary-label">Total Nilai</div><div class="summary-value">Rp ${fmt(totalHarga)}</div></div>
            <div class="summary-card"><div class="summary-label">Rata² Harga/m³</div><div class="summary-value">Rp ${fmt(Math.round(totalVolume>0?totalHarga/totalVolume:0))}</div></div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:20px;">
            <div style="flex:1; min-width:250px;"><div class="section-head">📦 Per Supplier</div><div class="table-wrap"><table style="width:100%"><thead><tr><th>Supplier</th><th>Volume (m³)</th><th>Nilai (Rp)</th><th>Rata²</th></tr></thead><tbody>${supplierData.map(s => { const avg = s.volume > 0 ? s.harga / s.volume : 0; return `<tr><td>${s.name}</td><td class="right">${fmtDec(s.volume,2)}</td><td class="right">Rp ${fmt(s.harga)}</td><td class="right">Rp ${fmt(Math.round(avg))}</td></tr>`; }).join('')}</tbody></table></div></div>
            <div style="flex:1; min-width:250px;"><div class="section-head">📍 Per Asal</div><div class="table-wrap"><table style="width:100%"><thead><tr><th>Asal</th><th>Volume (m³)</th><th>Nilai (Rp)</th><th>Rata²</th></tr></thead><tbody>${asalData.map(a => { const avg = a.volume > 0 ? a.harga / a.volume : 0; return `<tr><td>${a.name}</td><td class="right">${fmtDec(a.volume,2)}</td><td class="right">Rp ${fmt(a.harga)}</td><td class="right">Rp ${fmt(Math.round(avg))}</td></tr>`; }).join('')}</tbody></table></div></div>
        </div>
    `;
};

setTimeout(() => {
    ensureSummaryPanel();
    addSummarySubtabButton();
    addMonthFilterToKayu();
    window.renderKayu();
}, 500);