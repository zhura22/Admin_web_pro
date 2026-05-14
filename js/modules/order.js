// order.js - perbaikan bug "}" dan tata letak rapi

let orderEditId = null;

// Hitung volume terkirim bersih (volume - retur)
window.getOrderTerpenuhi = function(orderId) {
    return window.penjualanList.filter(p => p.orderId === orderId).reduce((s, p) => {
        const netto = (parseFloat(p.volume) || 0) - (parseFloat(p.retur) || 0);
        return s + netto;
    }, 0);
};

// Ambil stok board terbaru untuk suatu orderId (dari boardStockList)
function getLatestStockByOrderId(orderId) {
    const stocks = (window.boardStockList || []).filter(s => s.orderId === orderId);
    if (stocks.length === 0) return 0;
    const sorted = [...stocks].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
    return sorted[0].stok || 0;
}

// Render tabel daftar order
window.renderOrder = function() {
    const container = document.getElementById("order-list");
    if (!container) return;

    if (!window.orderList || !window.orderList.length) {
        container.innerHTML = '<div class="empty-state">📭 Belum ada order. Klik "+ Order Baru" untuk menambahkan.</div>';
        document.getElementById("order-count").textContent = "0 order";
        return;
    }

    document.getElementById("order-count").textContent = window.orderList.length + " order";
    const sorted = sortByDateAsc(window.orderList);
    let html = `
        <div class="table-wrapper">
            <table class="order-table" style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: var(--bg3); border-bottom: 2px solid var(--gold-dim);">
                        <th style="padding: 10px; text-align: center;">No</th>
                        <th style="padding: 10px; text-align: left;">Tanggal</th>
                        <th style="padding: 10px; text-align: left;">Kode PO</th>
                        <th style="padding: 10px; text-align: left;">Perusahaan</th>
                        <th style="padding: 10px; text-align: right;">Volume (m³)</th>
                        <th style="padding: 10px; text-align: right;">Stok Board (m³)</th>
                        <th style="padding: 10px; text-align: right;">Terkirim (m³)</th>
                        <th style="padding: 10px; text-align: right;">Sisa (m³)</th>
                        <th style="padding: 10px; text-align: center;">Status</th>
                        <th style="padding: 10px; text-align: center;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
    `;
    sorted.forEach((o, i) => {
        const terkirim = window.getOrderTerpenuhi(o.id);
        const stokBoard = getLatestStockByOrderId(o.id);
        let sisa = o.volumeOrder - stokBoard - terkirim;
        if (sisa < 0) sisa = 0;
        const statusClass = sisa <= 0 ? 'status-badge success' : 'status-badge warning';
        const statusText = sisa <= 0 ? '✅ Selesai' : '📦 Proses';
        const rowStyle = i % 2 === 0 ? 'background: var(--row-even);' : 'background: var(--bg3);';
        html += `
            <tr style="${rowStyle} border-bottom: 1px solid var(--border);">
                <td style="padding: 8px; text-align: center;">${i+1}</td>
                <td style="padding: 8px; text-align: left;">${fmtDate(o.tanggal)}</td>
                <td style="padding: 8px; text-align: left; font-weight: bold; color: var(--gold);">${escapeHtml(o.kodePO)}</td>
                <td style="padding: 8px; text-align: left;">${escapeHtml(o.perusahaan)}</td>
                <td style="padding: 8px; text-align: right;">${fmtDec(o.volumeOrder, 2)}</td>
                <td style="padding: 8px; text-align: right;">${fmtDec(stokBoard, 2)}</td>
                <td style="padding: 8px; text-align: right;">${fmtDec(terkirim, 2)}</td>
                <td style="padding: 8px; text-align: right; color: ${sisa > 0 ? 'var(--orange)' : 'var(--green)'};">${fmtDec(sisa, 2)}</td>
                <td style="padding: 8px; text-align: center;"><span class="${statusClass}">${statusText}</span></td>
                <td style="padding: 8px; text-align: center;">
                    <button class="btn-icon edit" onclick="window.editOrder('${o.id}')" title="Edit">✏️</button>
                    <button class="btn-icon delete" onclick="window.deleteOrder('${o.id}')" title="Hapus">🗑️</button>
                </td>
            </tr>
        `;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Update ringkasan (tidak digunakan, tapi dipanggil dari luar)
window.updateAllOrderSummaries = function() {
    if (typeof renderBoardStockSummary === 'function') renderBoardStockSummary();
};

// Form edit/tambah order
window.openOrderForm = function(item) {
    orderEditId = item?.id || null;
    document.getElementById("order-tanggal").value = item?.tanggal || today();
    document.getElementById("order-po").value = item?.kodePO || "";
    document.getElementById("order-perusahaan").value = item?.perusahaan || "";
    document.getElementById("order-volume").value = item?.volumeOrder || "";
    document.getElementById("order-input").classList.remove("hidden");
    document.getElementById("order-list").classList.add("hidden");
};

window.closeOrderForm = function() {
    document.getElementById("order-input").classList.add("hidden");
    document.getElementById("order-list").classList.remove("hidden");
    orderEditId = null;
};

window.saveOrder = function() {
    const tgl = document.getElementById("order-tanggal").value.trim();
    const po = document.getElementById("order-po").value.trim();
    const perusahaan = document.getElementById("order-perusahaan").value.trim();
    const vol = document.getElementById("order-volume").value;
    if (!tgl || !po || !perusahaan || !vol || parseFloat(vol) <= 0) {
        toast("⚠️ Semua field wajib diisi!");
        return;
    }
    const item = {
        id: orderEditId || uid(),
        tanggal: tgl,
        kodePO: po,
        perusahaan: perusahaan,
        volumeOrder: parseFloat(vol)
    };
    if (orderEditId) {
        window.orderList = window.orderList.map(o => o.id === orderEditId ? item : o);
        logActivity('Update', 'Order', `PO: ${item.kodePO}`);
    } else {
        window.orderList.push(item);
        logActivity('Simpan', 'Order', `PO: ${item.kodePO}`);
    }
    persistAll();
    closeOrderForm();
    window.updateAllOrderSummaries();
    if (typeof renderPenjualan === 'function') renderPenjualan();
    if (typeof populateOrderDropdown === 'function') populateOrderDropdown();
    window.renderOrder();
    toast("✅ Order disimpan!");
};

window.deleteOrder = function(id) {
    const item = window.orderList.find(o => o.id === id);
    if (item) logActivity('Hapus', 'Order', `PO: ${item.kodePO}`);
    if (!confirmDialog("Hapus order?")) return;
    const terkait = penjualanList.filter(p => p.orderId === id);
    if (terkait.length > 0 && !confirmDialog(`Order ini memiliki ${terkait.length} pengiriman. Hapus juga?`)) {
        return;
    }
    window.penjualanList = penjualanList.filter(p => p.orderId !== id);
    window.orderList = window.orderList.filter(o => o.id !== id);
    persistAll();
    window.updateAllOrderSummaries();
    if (typeof renderPenjualan === 'function') renderPenjualan();
    window.renderOrder();
    toast("🗑️ Dihapus");
};

window.editOrder = function(id) {
    const item = window.orderList.find(o => o.id === id);
    if (item) window.openOrderForm(item);
};

// Dropdown untuk form penjualan
window.populateOrderDropdown = function(selectedOrderId = null) {
    const select = document.getElementById("jual-order");
    if (!select) return;
    select.innerHTML = '<option value="">-- Pilih Order --</option>';
    window.orderList.forEach(o => {
        const terkirim = window.getOrderTerpenuhi(o.id);
        const stokBoard = getLatestStockByOrderId(o.id);
        let sisa = o.volumeOrder - stokBoard - terkirim;
        if (sisa < 0) sisa = 0;
        if (sisa > 0 || o.id === selectedOrderId) {
            const opt = document.createElement("option");
            opt.value = o.id;
            opt.textContent = `${o.kodePO} - ${o.perusahaan} (Sisa: ${fmtDec(sisa, 2)} m³)`;
            if (o.id === selectedOrderId) opt.selected = true;
            select.appendChild(opt);
        }
    });
    if (selectedOrderId && !select.querySelector(`option[value="${selectedOrderId}"]`)) {
        const o = window.orderList.find(o => o.id === selectedOrderId);
        if (o) {
            const opt = document.createElement("option");
            opt.value = o.id;
            opt.textContent = `${o.kodePO} - ${o.perusahaan} (Selesai)`;
            opt.selected = true;
            opt.disabled = true;
            select.appendChild(opt);
        }
    }
};

// Panggil renderOrder saat halaman siap
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.orderList) window.renderOrder();
    }, 100);
});