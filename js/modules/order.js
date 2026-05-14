let orderEditId = null;

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
    if (!tgl || !po || !perusahaan || !vol || parseFloat(vol) <= 0) { toast("⚠️ Semua field wajib!"); return; }
    const item = { id: orderEditId || uid(), tanggal: tgl, kodePO: po, perusahaan, volumeOrder: parseFloat(vol) };
    if (orderEditId) {
        window.orderList = window.orderList.map(o => o.id === orderEditId ? item : o);
        logActivity('Update', 'Order', `PO: ${item.kodePO}`);
    } else {
        window.orderList.push(item);
        logActivity('Simpan', 'Order', `PO: ${item.kodePO}`);
    }
    persistAll();
    closeOrderForm();
    renderOrder();
    renderPenjualan();
    toast("✅ Order disimpan!");
};

window.deleteOrder = function(id) {
    const item = window.orderList.find(o => o.id === id);
    if (item) logActivity('Hapus', 'Order', `PO: ${item.kodePO}`);
    if (!confirmDialog("Hapus order?")) return;
    const terkait = penjualanList.filter(p => p.orderId === id);
    if (terkait.length > 0 && !confirmDialog(`Order ini memiliki ${terkait.length} pengiriman. Hapus juga?`)) return;
    window.penjualanList = penjualanList.filter(p => p.orderId !== id);
    window.orderList = window.orderList.filter(o => o.id !== id);
    persistAll();
    renderOrder();
    renderPenjualan();
    toast("🗑️ Dihapus");
};

window.editOrder = function(id) {
    const item = window.orderList.find(o => o.id === id);
    if (item) openOrderForm(item);
};

// Dijadikan window agar bisa dipanggil dari sezing.js tanpa risiko urutan load script
window.getOrderTerpenuhi = function(orderId) {
    return window.penjualanList.filter(p => p.orderId === orderId).reduce((s, p) => s + (parseFloat(p.volume) || 0), 0);
};

window.populateOrderDropdown = function(selectedOrderId = null) {
    const select = document.getElementById("jual-order");
    if (!select) return;
    select.innerHTML = '<option value="">-- Pilih Order --</option>';
    window.orderList.forEach(o => {
        const terkirim = window.getOrderTerpenuhi(o.id);
        const sisa = o.volumeOrder - terkirim;
        if (sisa > 0 || o.id === selectedOrderId) {
            const opt = document.createElement("option");
            opt.value = o.id;
            opt.textContent = `${o.kodePO} - ${o.perusahaan} (Sisa:${fmtDec(sisa, 2)}m³)`;
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

window.renderOrder = function() {
    document.getElementById("order-count").textContent = window.orderList.length + " order";
    const container = document.getElementById("order-list");
    if (!window.orderList.length) { container.innerHTML = '<div class="empty">📭 Belum ada order</div>'; return; }
    const sorted = sortByDateAsc(window.orderList);
    let html = '<div class="table-wrap"><table><thead><tr><th>No</th><th>Tanggal</th><th>Kode PO</th><th>Perusahaan</th><th>Vol</th><th>Terkirim</th><th>Sisa</th><th>Status</th><th>Aksi</th></tr></thead><tbody>';
    sorted.forEach((o, i) => {
        const terkirim = window.getOrderTerpenuhi(o.id);
        const sisa = o.volumeOrder - terkirim;
        html += `<tr class="${i % 2 ? 'odd' : 'even'}"><td class="center">${i+1}</td><td>${fmtDate(o.tanggal)}</td><td class="highlight">${o.kodePO}</td><td>${o.perusahaan}</td><td class="right">${fmtDec(o.volumeOrder,2)}</td><td class="right">${fmtDec(terkirim,2)}</td><td class="right" style="color:${sisa > 0 ? 'var(--orange)' : 'var(--green)'}">${fmtDec(sisa,2)}</td><td>${sisa <= 0 ? '✅ Selesai' : '📦 Proses'}</td><td><div class="flex gap4"><button class="btn btn-edit btn-sm" onclick="window.editOrder('${o.id}')">✏️</button><button class="btn btn-del btn-sm" onclick="window.deleteOrder('${o.id}')">🗑️</button></div></td></tr>`;
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
};