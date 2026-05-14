window.renderOvenStatus = function() {
    const c = document.getElementById("oven-container");
    if (!c) return;
    c.innerHTML = window.ovenList.map(o => `
        <div class="oven-card"><h3>🔥 Chamber ${o.chamber}</h3><div class="oven-status ${o.status === 'active' ? 'status-active' : 'status-empty'}">${o.status === 'active' ? '● Berisi' : '○ Kosong'}</div><div class="oven-detail">Vol: ${o.volume ? fmtDec(o.volume, 2) + " m³" : "-"}</div><div class="oven-detail">Mulai: ${o.tanggalMulai ? fmtDate(o.tanggalMulai) : "-"}</div>${o.status === 'active' ? `<button class="btn btn-del btn-sm mt8" onclick="window.clearOven(${o.chamber})">🗑️ Kosongkan</button>` : ''}</div>
    `).join("");
    const tbody = document.getElementById("oven-history-tbody");
    if (!tbody) return;
    if (!window.ovenHistoryList.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty">Belum ada riwayat</td></tr>'; return; }
    tbody.innerHTML = window.ovenHistoryList.map(h => `
        <tr>
            <td>${h.chamber}</td>
            <td>${h.openNo}</td>
            <td class="right">${fmtDec(h.volumeMasuk, 2)}${h.palet ? ' (' + h.palet.length + ' plt)' : ''}</td>
            <td>${fmtDate(h.tanggalMasuk)}</td>
            <td>${h.tanggalSelesai ? fmtDate(h.tanggalSelesai) : "-"}</td>
            <td>${h.status === 'active' ? '🟠 Aktif' : '✅ Selesai'}</td>
            <td>${h.status === 'active' ? `<button class="btn btn-sm btn-edit" onclick="window.finishOven('${h.id}')">✔ Selesai</button>` : ''}</td>
        </tr>
    `).join("");
};

window.clearOven = function(ch) {
    if (!confirmDialog(`Kosongkan Chamber ${ch}?`)) return;
    const idx = window.ovenList.findIndex(o => o.chamber == ch);
    if (idx !== -1) window.ovenList[idx] = { chamber: ch, volume: 0, tanggalMulai: "", status: "empty" };
    window.ovenHistoryList.forEach(h => { if (h.chamber == ch && h.status === 'active') { h.status = 'completed'; h.tanggalSelesai = today(); } });
    persistAll();
    renderOvenStatus();
    toast(`✅ Chamber ${ch} dikosongkan`);
    logActivity('Kosongkan', 'Oven', `Chamber ${ch}`);
};

window.finishOven = function(historyId) {
    const history = window.ovenHistoryList.find(h => h.id === historyId);
    if (!history) return;
    const volKeluar = prompt("Volume palet kering keluar (m³):", history.volumeMasuk);
    if (volKeluar === null) return;
    history.volumeKeluar = parseFloat(volKeluar) || 0;
    history.tanggalSelesai = today();
    history.status = 'completed';
    const masihAktif = window.ovenHistoryList.some(h => h.chamber == history.chamber && h.status === 'active');
    if (!masihAktif) {
        const oven = window.ovenList.find(o => o.chamber == history.chamber);
        if (oven) oven.status = 'empty';
    }
    persistAll();
    renderOvenStatus();
    toast("✅ Oven selesai");
    logActivity('Selesai', 'Oven', `Chamber ${history.chamber}, keluar ${history.volumeKeluar} m³`);
};

window.resetOvenData = function() {
    if (!confirmDialog("Reset semua oven?")) return;
    window.ovenList = [];
    for (let i = 1; i <= 7; i++) window.ovenList.push({ chamber: i, volume: 0, tanggalMulai: "", status: "empty" });
    window.ovenHistoryList = [];
    persistAll();
    renderOvenStatus();
    toast("🔄 Semua oven direset");
    logActivity('Reset', 'Oven', 'Semua chamber');
};