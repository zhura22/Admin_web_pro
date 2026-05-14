// sezing.js - Final (tanpa riwayat stok board & tanpa stok tersedia per PO)

let penjualanEditId = null;
if (!window.boardStockList) window.boardStockList = [];

// ========== STOK BOARD MANUAL ==========
function getLatestBoardStock() {
    const latestMap = new Map();
    const sorted = [...window.boardStockList].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
    sorted.forEach(item => {
        if (!latestMap.has(item.orderId)) latestMap.set(item.orderId, item.stok);
    });
    return latestMap;
}

function renderBoardStockSummary() {
    const container = document.getElementById("board-stock-latest-container");
    if (!container) return;
    const latest = getLatestBoardStock();
    if (latest.size === 0) {
        container.innerHTML = '<div class="empty">📭 Belum ada stok board per PO. Input stok terbaru di bawah.</div>';
        return;
    }
    let html = `<div class="summary-row">`;
    for (let [orderId, stok] of latest.entries()) {
        const order = window.orderList.find(o => o.id === orderId);
        if (!order) continue;
        const kekurangan = order.volumeOrder - stok;
        const persen = order.volumeOrder > 0 ? (stok / order.volumeOrder * 100).toFixed(0) : 0;
        html += `
            <div class="summary-card">
                <div class="summary-label">${escapeHtml(order.kodePO)} - ${escapeHtml(order.perusahaan)}</div>
                <div class="summary-value">${fmtDec(stok, 2)} m³</div>
                <div style="font-size:10px;">Order: ${fmtDec(order.volumeOrder, 2)} m³</div>
                <div style="font-size:10px; color:${kekurangan > 0 ? 'var(--orange)' : 'var(--green)'};">Kekurangan: ${fmtDec(kekurangan, 2)} m³</div>
                <progress value="${persen}" max="100" style="width:100%; height:4px;"></progress>
            </div>
        `;
    }
    html += `</div>`;
    container.innerHTML = html;
}

// Fungsi riwayat stok board dikosongkan
function renderBoardStockHistory() {
    const container = document.getElementById("board-stock-history");
    if (container) container.innerHTML = '';
}

// Fungsi stok tersedia per PO dikosongkan
function renderRealtimeStock() {
    const container = document.getElementById("realtime-stock-container");
    if (container) container.innerHTML = ''; // tidak menampilkan apa pun
}

window.saveBoardStock = function() {
    const orderId = document.getElementById("board-stock-order")?.value;
    const stok = parseFloat(document.getElementById("board-stock-value")?.value);
    const tgl = document.getElementById("board-stock-tanggal")?.value || today();
    const catatan = document.getElementById("board-stock-catatan")?.value || "";
    if (!orderId || isNaN(stok) || stok < 0) {
        toast("⚠️ Pilih PO dan isi stok dengan benar");
        return;
    }
    window.boardStockList.push({
        id: uid(),
        tanggal: tgl,
        orderId: orderId,
        stok: stok,
        catatan: catatan
    });
    persistAll();
    renderBoardStockSummary();
    renderBoardStockHistory();
    renderRealtimeStock();
    toast(`✅ Stok board untuk PO disimpan (${fmtDec(stok, 2)} m³)`);
    logActivity('Simpan', 'Board Stock', `PO ${orderId}: ${stok} m³`);
    document.getElementById("board-stock-value").value = "";
    document.getElementById("board-stock-catatan").value = "";
};

window.deleteBoardStock = function(id) {
    if (!confirmDialog("Hapus riwayat stok ini?")) return;
    window.boardStockList = window.boardStockList.filter(item => item.id !== id);
    persistAll();
    renderBoardStockSummary();
    renderBoardStockHistory();
    renderRealtimeStock();
    toast("🗑️ Dihapus");
};

function initBoardStockForm() {
    const container = document.getElementById("board-stock-form-container");
    if (!container) return;
    if (container.querySelector('#board-stock-order')) return;
    container.innerHTML = `
        <div class="form-title">📦 Manual Input Stok Board per PO (Stok Terbaru)</div>
        <div class="grid3">
            <div class="field"><label>Tanggal</label><input type="date" id="board-stock-tanggal" value="${today()}"></div>
            <div class="field"><label>Pilih PO</label><select id="board-stock-order"><option value="">-- Pilih --</option>${window.orderList.map(o => `<option value="${o.id}">${escapeHtml(o.kodePO)} - ${escapeHtml(o.perusahaan)}</option>`).join('')}</select></div>
            <div class="field"><label>Stok Board (m³)</label><input type="number" step="any" id="board-stock-value" placeholder="Volume stok fisik"></div>
            <div class="field span2"><label>Catatan</label><input type="text" id="board-stock-catatan" placeholder="Misal: hasil opname gudang"></div>
            <div class="field" style="justify-content: flex-end;"><button class="btn btn-primary" onclick="window.saveBoardStock()">💾 Simpan Stok</button></div>
        </div>
    `;
}

function refreshBoardStockOrders() {
    const select = document.getElementById("board-stock-order");
    if (select) {
        const oldVal = select.value;
        select.innerHTML = '<option value="">-- Pilih --</option>' + window.orderList.map(o => `<option value="${o.id}">${escapeHtml(o.kodePO)} - ${escapeHtml(o.perusahaan)}</option>`).join('');
        if (oldVal) select.value = oldVal;
    }
}

// ========== SEZING ==========
window.saveSezing = function() {
    const tgl = document.getElementById("sezing-tanggal")?.value;
    const vol = parseFloat(document.getElementById("sezing-volume")?.value);
    if (!tgl || !vol || vol <= 0) { toast("⚠️ Tanggal dan volume wajib diisi!"); return; }
    window.sezingList.push({ id: uid(), tanggal: tgl, volume: vol });
    persistAll();
    renderSezing();
    document.getElementById("sezing-volume").value = "";
    toast("✅ Sezing disimpan");
    logActivity('Simpan', 'Sezing', `${fmtDec(vol, 2)} m³`);
};

window.deleteSezing = function(id) {
    if (!confirmDialog("Hapus data sezing?")) return;
    window.sezingList = window.sezingList.filter(s => s.id !== id);
    persistAll();
    renderSezing();
    toast("🗑️ Dihapus");
};

window.renderSezing = function() {
    const container = document.getElementById("sezing-list-content");
    if (!container) return;
    const bulanIni = thisMonth();
    const totalSezingBulanIni = window.sezingList.filter(s => s.tanggal?.startsWith(bulanIni)).reduce((sum, s) => sum + (s.volume || 0), 0);
    const totalSezingAll = window.sezingList.reduce((sum, s) => sum + (s.volume || 0), 0);
    let html = `
        <div class="summary-row" style="margin-bottom: 16px;">
            <div class="summary-card"><div class="summary-label">📏 Total Sezing Bulan Ini</div><div class="summary-value">${fmtDec(totalSezingBulanIni, 2)} m³</div></div>
            <div class="summary-card"><div class="summary-label">📦 Total Sezing Keseluruhan</div><div class="summary-value">${fmtDec(totalSezingAll, 2)} m³</div></div>
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
        <div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Volume (m³)</th><th>Aksi</th></tr></thead><tbody>
            ${sorted.map(s => `<tr><td>${fmtDate(s.tanggal)}</td><td class="right">${fmtDec(s.volume, 3)}</td><td><button class="btn btn-del btn-sm" onclick="window.deleteSezing('${s.id}')">🗑️</button></td></tr>`).join('')}
        </tbody></table></div>
    `;
    container.innerHTML = html;
};

// ========== PENJUALAN ==========
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
    if (orderId && typeof getOrderTerpenuhi === 'function') {
        const order = window.orderList.find(o => o.id === orderId);
        if (order) {
            let terkirim = getOrderTerpenuhi(orderId);
            if (penjualanEditId) {
                const oldItem = window.penjualanList.find(p => p.id === penjualanEditId);
                if (oldItem) {
                    const oldNetto = (oldItem.volume || 0) - (oldItem.retur || 0);
                    terkirim -= oldNetto;
                }
            }
            const sisa = order.volumeOrder - terkirim;
            if (vol > sisa && !confirmDialog(`Volume melebihi sisa order (sisa ${fmtDec(sisa, 2)} m³). Tetap simpan?`)) return;
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
        retur
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
    if (typeof updateAllOrderSummaries === 'function') updateAllOrderSummaries();
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
    if (typeof updateAllOrderSummaries === 'function') updateAllOrderSummaries();
    if (typeof renderOrder === 'function') renderOrder();
    toast("🗑️ Penjualan dihapus");
};

window.editPenjualan = function(id) {
    const item = window.penjualanList.find(p => p.id === id);
    if (item) {
        fillJualForm(item);
        document.querySelector('#tab-sezing .subtab-btn[data-subtab="sezing-input"]').click();
    }
};

window.renderPenjualan = function() {
    const container = document.getElementById("penjualan-list-content");
    if (!container) return;
    const bulanIni = thisMonth();
    const totalPenjualanNettoBulanIni = window.penjualanList.filter(p => p.tanggal?.startsWith(bulanIni)).reduce((sum, p) => sum + ((p.volume || 0) - (p.retur || 0)), 0);
    const totalPenjualanAll = window.penjualanList.reduce((sum, p) => sum + (p.volume || 0), 0);
    const totalHargaBulanIni = window.penjualanList.filter(p => p.tanggal?.startsWith(bulanIni)).reduce((sum, p) => sum + (p.harga || 0), 0);
    const totalReturBulanIni = window.penjualanList.filter(p => p.tanggal?.startsWith(bulanIni)).reduce((sum, p) => sum + (p.retur || 0), 0);
    let html = `
        <div class="summary-row" style="margin-bottom: 16px; margin-top: 16px;">
            <div class="summary-card"><div class="summary-label">💰 Total Penjualan (Netto) Bulan Ini</div><div class="summary-value">${fmtDec(totalPenjualanNettoBulanIni, 2)} m³</div><div style="font-size:10px;">Rp ${fmt(totalHargaBulanIni)}</div><div style="font-size:10px;">Retur: ${fmtDec(totalReturBulanIni, 2)} m³</div></div>
            <div class="summary-card"><div class="summary-label">📊 Total Penjualan (Bruto) Keseluruhan</div><div class="summary-value">${fmtDec(totalPenjualanAll, 2)} m³</div></div>
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
        <div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Order</th><th>Pcs</th><th>Volume (m³)</th><th>No. Truk</th><th>Tujuan</th><th>Total Harga</th><th>Retur</th><th>Aksi</th></tr></thead><tbody>
            ${sorted.map(p => {
                const order = window.orderList.find(o => o.id === p.orderId);
                const orderKode = order ? order.kodePO : '-';
                return `<tr><td>${fmtDate(p.tanggal)}</td><td class="highlight">${orderKode}</td><td class="right">${fmt(p.pcs)}</td><td class="right">${fmtDec(p.volume, 3)}</td><td>${p.truk}</td><td>${p.tujuan}</td><td class="right">Rp ${fmt(p.harga)}</td><td class="right">${fmtDec(p.retur, 3)}</td><td><div class="flex gap4"><button class="btn btn-edit btn-sm" onclick="window.editPenjualan('${p.id}')">✏️</button><button class="btn btn-del btn-sm" onclick="window.deletePenjualan('${p.id}')">🗑️</button></div></td></tr>`;
            }).join('')}
        </tbody></table></div>
    `;
    container.innerHTML = html;
};

// Override render untuk form dan ringkasan (tanpa riwayat dan tanpa stok tersedia)
const originalRenderSezing = window.renderSezing;
window.renderSezing = function() {
    if (originalRenderSezing) originalRenderSezing();
    initBoardStockForm();
    renderBoardStockSummary();
    renderBoardStockHistory(); // kosong
    renderRealtimeStock();    // kosong
    refreshBoardStockOrders();
};

const originalRenderPenjualan = window.renderPenjualan;
window.renderPenjualan = function() {
    if (originalRenderPenjualan) originalRenderPenjualan();
    renderRealtimeStock(); // kosong
};

// Override saveOrder dan deleteOrder untuk refresh dropdown
if (typeof window.saveOrder === 'function') {
    const originalSaveOrder = window.saveOrder;
    window.saveOrder = function() {
        originalSaveOrder();
        refreshBoardStockOrders();
        renderBoardStockSummary();
        renderRealtimeStock();
    };
}
if (typeof window.deleteOrder === 'function') {
    const originalDeleteOrder = window.deleteOrder;
    window.deleteOrder = function(id) {
        originalDeleteOrder(id);
        refreshBoardStockOrders();
        renderBoardStockSummary();
        renderRealtimeStock();
    };
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    const btnSave = document.getElementById("btn-save-penjualan");
    if (btnSave) btnSave.onclick = () => window.savePenjualan();
    initBoardStockForm();
    renderBoardStockSummary();
    renderBoardStockHistory();
    renderRealtimeStock();
    refreshBoardStockOrders();
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}