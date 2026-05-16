// sezing.js – Lengkap dengan ringkasan total sezing & penjualan

let penjualanEditId = null;

// ======================= SEZING =======================
window.saveSezing = function() {
    const tgl = document.getElementById("sezing-tanggal")?.value;
    const vol = document.getElementById("sezing-volume")?.value;
    if (!tgl || vol === "" || parseFloat(vol) < 0) { toast("⚠️ Isi dengan benar!"); return; }
    window.sezingList.push({ id: uid(), tanggal: tgl, volume: parseFloat(vol) || 0 });
    persistAll();
    renderSezing();
    document.getElementById("sezing-volume").value = "";
    toast("✅ Sezing disimpan");
    logActivity('Simpan', 'Sezing', `${fmtDec(parseFloat(vol), 2)} m³`);
};

window.deleteSezing = function(id) {
    if (!confirmDialog("Hapus?")) return;
    window.sezingList = window.sezingList.filter(s => s.id !== id);
    persistAll();
    renderSezing();
    toast("🗑️ Dihapus");
    logActivity('Hapus', 'Sezing', '');
};

window.renderSezing = function() {
    const container = document.getElementById("sezing-list-content");
    if (!container) return;
    
    // Hitung total sezing (bulan ini dan keseluruhan)
    const bulanIni = thisMonth();
    const totalSezingBulanIni = window.sezingList.filter(s => s.tanggal?.startsWith(bulanIni)).reduce((sum, s) => sum + (s.volume || 0), 0);
    const totalSezingAll = window.sezingList.reduce((sum, s) => sum + (s.volume || 0), 0);
    
    let html = `
        <div class="summary-row" style="margin-bottom: 16px;">
            <div class="summary-card">
                <div class="summary-label">📏 Total Sezing Bulan Ini</div>
                <div class="summary-value">${fmtDec(totalSezingBulanIni, 2)} m³</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">📦 Total Sezing Keseluruhan</div>
                <div class="summary-value">${fmtDec(totalSezingAll, 2)} m³</div>
            </div>
        </div>
    `;
    
    if (!window.sezingList.length) {
        html += '<div class="empty">📭 Belum ada data sezing</div>';
        container.innerHTML = html;
        return;
    }
    
    const sorted = sortByDateAsc(window.sezingList);
    html += `
        <div class="section-head">📏 Daftar Hasil Sezing</div>
        <div class="table-wrap">
            <table>
                <thead><tr><th>Tanggal</th><th>Volume (m³)</th><th>Aksi</th></tr></thead>
                <tbody>${sorted.map(s => `
                    <tr>
                        <td>${fmtDate(s.tanggal)}</td>
                        <td class="right">${fmtDec(s.volume, 3)}</td>
                        <td><button class="btn btn-del btn-sm" onclick="window.deleteSezing('${s.id}')">🗑️</button></td>
                    </tr>
                `).join('')}</tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
};

// ======================= PENJUALAN =======================
window.resetJualForm = function() {
    document.getElementById("jual-tanggal").value = today();
    document.getElementById("jual-pcs").value = "";
    document.getElementById("jual-volume").value = "";
    document.getElementById("jual-truk").value = "";
    document.getElementById("jual-tujuan").value = "";
    document.getElementById("jual-harga").value = "";
    document.getElementById("jual-retur").value = "0";
    penjualanEditId = null;
    if (typeof populateOrderDropdown === 'function') populateOrderDropdown(null);
};

window.fillJualForm = function(item) {
    document.getElementById("jual-tanggal").value = item.tanggal;
    document.getElementById("jual-pcs").value = item.pcs;
    document.getElementById("jual-volume").value = item.volume;
    document.getElementById("jual-truk").value = item.truk;
    document.getElementById("jual-tujuan").value = item.tujuan;
    document.getElementById("jual-harga").value = item.harga;
    document.getElementById("jual-retur").value = item.retur || 0;
    penjualanEditId = item.id;
    if (typeof populateOrderDropdown === 'function') populateOrderDropdown(item.orderId || null);
};

window.savePenjualan = function() {
    const tgl = document.getElementById("jual-tanggal")?.value;
    const pcs = document.getElementById("jual-pcs")?.value;
    const vol = parseFloat(document.getElementById("jual-volume")?.value) || 0;
    const truk = document.getElementById("jual-truk")?.value.trim();
    const tujuan = document.getElementById("jual-tujuan")?.value.trim();
    const harga = document.getElementById("jual-harga")?.value;
    const orderId = document.getElementById("jual-order")?.value;
    const retur = parseFloat(document.getElementById("jual-retur")?.value) || 0;
    if (!tgl || !pcs || !vol || !truk || !tujuan || !harga || !orderId) {
        toast("⚠️ Semua field wajib diisi!");
        return;
    }
    
    // Validasi sisa order
    if (orderId && typeof getOrderTerpenuhi === 'function') {
        const order = window.orderList.find(o => o.id === orderId);
        if (order) {
            let terkirim = getOrderTerpenuhi(orderId);
            if (penjualanEditId) {
                const oldVol = window.penjualanList.find(p => p.id === penjualanEditId)?.volume || 0;
                terkirim -= oldVol;
            }
            const sisa = order.volumeOrder - terkirim;
            if (vol > sisa && !confirmDialog(`Volume melebihi sisa order (sisa ${fmtDec(sisa,2)} m³). Tetap simpan?`)) {
                return;
            }
        }
    }
    
    const item = {
        id: penjualanEditId || uid(),
        tanggal: tgl,
        pcs: parseInt(pcs) || 0,
        volume: vol,
        truk,
        tujuan,
        harga: parseFloat(harga) || 0,
        orderId,
        retur: retur
    };
    if (penjualanEditId) {
        window.penjualanList = window.penjualanList.map(p => p.id === penjualanEditId ? item : p);
        logActivity('Update', 'Penjualan', `${item.truk} ke ${item.tujuan}`);
    } else {
        window.penjualanList.push(item);
        logActivity('Simpan', 'Penjualan', `${item.truk} ke ${item.tujuan}`);
    }
    persistAll();
    renderPenjualan();
    if (typeof renderOrder === 'function') renderOrder();
    resetJualForm();
    toast("✅ Penjualan disimpan");
};

window.deletePenjualan = function(id) {
    const item = window.penjualanList.find(p => p.id === id);
    if (item) logActivity('Hapus', 'Penjualan', `${item.truk} ke ${item.tujuan}`);
    if (!confirmDialog("Hapus penjualan?")) return;
    window.penjualanList = window.penjualanList.filter(p => p.id !== id);
    persistAll();
    renderPenjualan();
    if (typeof renderOrder === 'function') renderOrder();
    toast("🗑️ Penjualan dihapus");
};

window.editPenjualan = function(id) {
    const item = window.penjualanList.find(p => p.id === id);
    if (item) {
        fillJualForm(item);
        // Otomatis pindah ke subtab input
        const panel = document.getElementById("tab-sezing");
        const inputBtn = panel?.querySelector('.subtab-btn[data-subtab="sezing-input"]');
        if (inputBtn) inputBtn.click();
    }
};

window.renderPenjualan = function() {
    const container = document.getElementById("penjualan-list-content");
    if (!container) return;
    
    // Hitung total penjualan (bulan ini dan keseluruhan)
    const bulanIni = thisMonth();
    const totalPenjualanBulanIni = window.penjualanList.filter(p => p.tanggal?.startsWith(bulanIni)).reduce((sum, p) => sum + (p.volume || 0), 0);
    const totalPenjualanAll = window.penjualanList.reduce((sum, p) => sum + (p.volume || 0), 0);
    const totalHargaBulanIni = window.penjualanList.filter(p => p.tanggal?.startsWith(bulanIni)).reduce((sum, p) => sum + (p.harga || 0), 0);
    const totalReturBulanIni = window.penjualanList.filter(p => p.tanggal?.startsWith(bulanIni)).reduce((sum, p) => sum + (p.retur || 0), 0);
    
    let html = `
        <div class="summary-row" style="margin-bottom: 16px; margin-top: 16px;">
            <div class="summary-card">
                <div class="summary-label">💰 Total Penjualan Bulan Ini</div>
                <div class="summary-value">${fmtDec(totalPenjualanBulanIni, 2)} m³</div>
                <div style="font-size:10px;">Rp ${fmt(totalHargaBulanIni)}</div>
                <div style="font-size:10px;">Retur: ${fmtDec(totalReturBulanIni,2)} m³</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">📊 Total Penjualan Keseluruhan</div>
                <div class="summary-value">${fmtDec(totalPenjualanAll, 2)} m³</div>
            </div>
        </div>
    `;
    
    if (!window.penjualanList.length) {
        html += '<div class="empty">📭 Belum ada penjualan</div>';
        container.innerHTML = html;
        return;
    }
    
    const sorted = sortByDateAsc(window.penjualanList);
    html += `
        <div class="section-head">💰 Daftar Penjualan</div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr><th>Tanggal</th><th>Order</th><th>Pcs</th><th>Volume (m³)</th><th>No. Truk</th><th>Tujuan</th><th>Total Harga</th><th>Retur</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                    ${sorted.map(p => {
                        const order = window.orderList.find(o => o.id === p.orderId);
                        const orderKode = order ? order.kodePO : '-';
                        return `<tr>
                            <td>${fmtDate(p.tanggal)}</td>
                            <td class="highlight">${orderKode}</td>
                            <td class="right">${fmt(p.pcs)}</td>
                            <td class="right">${fmtDec(p.volume, 3)}</td>
                            <td>${p.truk}</td>
                            <td>${p.tujuan}</td>
                            <td class="right">Rp ${fmt(p.harga)}</td>
                            <td class="right">${fmtDec(p.retur, 3)}</td>
                            <td><div class="flex gap4"><button class="btn btn-edit btn-sm" onclick="window.editPenjualan('${p.id}')">✏️</button><button class="btn btn-del btn-sm" onclick="window.deletePenjualan('${p.id}')">🗑️</button></div></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
};

// Event listener untuk tombol simpan penjualan
document.addEventListener('DOMContentLoaded', () => {
    const btnSave = document.getElementById("btn-save-penjualan");
    if (btnSave) btnSave.onclick = () => window.savePenjualan();
});