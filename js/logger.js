function logActivity(aksi, modul, detail = "") {
    if (!currentUser) return;
    window.activityLog.push({
        id: uid(),
        timestamp: new Date().toISOString(),
        user: currentUser.nama,
        role: currentUser.role,
        aksi,
        modul,
        detail
    });
    persistAll();
}

window.renderLog = function() {
    const container = document.getElementById("log-list");
    if (!container) return;
    if (!window.activityLog.length) {
        container.innerHTML = '<div class="empty">📭 Belum ada aktivitas</div>';
        return;
    }
    const recent = [...window.activityLog].reverse().slice(0, 200);
    container.innerHTML = `<div class="table-wrap"><tr><thead><tr><th>Waktu</th><th>User</th><th>Aksi</th><th>Modul</th><th>Detail</th></tr></thead><tbody>
        ${recent.map(l => `<tr><td>${new Date(l.timestamp).toLocaleString("id-ID")}</td><td>${l.user}</td><td>${l.aksi}</td><td>${l.modul}</td><td>${l.detail}</td></tr>`).join("")}
    </tbody></table></div>`;
};