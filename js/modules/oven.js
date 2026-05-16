// oven.js - final tanpa error
(function() {
    if (!window.ovenList) window.ovenList = [];
    if (!window.ovenHistoryList) window.ovenHistoryList = [];

    function initOven() {
        for (let i = 1; i <= 7; i++) {
            if (!window.ovenList.some(o => o.chamber === i)) {
                window.ovenList.push({ chamber: i, volume: 0, tanggalMulai: "", status: "empty" });
            }
        }
        window.ovenList.sort((a, b) => a.chamber - b.chamber);
        for (let i = 1; i <= 7; i++) {
            const active = window.ovenHistoryList.find(h => h.chamber === i && h.status === 'active');
            const oven = window.ovenList.find(o => o.chamber === i);
            if (active) {
                oven.status = 'active';
                oven.volume = active.volumeMasuk;
                oven.tanggalMulai = active.tanggalMasuk;
            } else if (oven && oven.status === 'active') {
                oven.status = 'empty';
                oven.volume = 0;
                oven.tanggalMulai = "";
            }
        }
    }

    window.renderOvenStatus = function() {
        initOven();
        const container = document.getElementById("oven-container");
        if (container) {
            let html = '';
            for (let i = 1; i <= 7; i++) {
                const active = window.ovenHistoryList.find(h => h.chamber === i && h.status === 'active');
                const isActive = !!active;
                const volume = isActive ? active.volumeMasuk : 0;
                const tglMulai = isActive ? active.tanggalMasuk : '';
                let rencanaHtml = '';
                if (isActive && tglMulai) {
                    const mulai = new Date(tglMulai);
                    const rencana = new Date(mulai);
                    rencana.setDate(rencana.getDate() + 5);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const diff = Math.ceil((rencana - today) / (86400000));
                    let statusRencana = '';
                    if (diff < 0) statusRencana = `<span style="color:var(--red);">⚠️ Terlambat ${-diff} hari</span>`;
                    else if (diff === 0) statusRencana = `<span style="color:var(--gold);">📅 Hari ini</span>`;
                    else statusRencana = `<span style="color:var(--green);">✅ Sisa ${diff} hari</span>`;
                    rencanaHtml = `<div class="oven-detail">📅 Rencana Kering: ${fmtDate(rencana.toISOString().split('T')[0])} ${statusRencana}</div>`;
                }
                html += `
                    <div class="oven-card">
                        <h3>🔥 Chamber ${i}</h3>
                        <div class="oven-status ${isActive ? 'status-active' : 'status-empty'}">${isActive ? '● Berisi' : '○ Kosong'}</div>
                        <div class="oven-detail">Volume: ${volume ? fmtDec(volume,2) + ' m³' : '-'}</div>
                        <div class="oven-detail">Mulai: ${tglMulai ? fmtDate(tglMulai) : '-'}</div>
                        ${rencanaHtml}
                        ${isActive ? `<button class="btn btn-del btn-sm mt8" onclick="window.clearOven(${i})">🗑️ Kosongkan</button>` : ''}
                    </div>
                `;
            }
            container.innerHTML = html;
        }
        const tbody = document.getElementById("oven-history-tbody");
        if (tbody) {
            if (!window.ovenHistoryList.length) {
                tbody.innerHTML = '<tr><td colspan="8" class="empty">📭 Belum ada riwayat pengisian oven</td></tr>';
            } else {
                let rows = '';
                for (let h of window.ovenHistoryList) {
                    let rencana = '-';
                    if (h.tanggalMasuk) {
                        let r = new Date(h.tanggalMasuk);
                        r.setDate(r.getDate() + 5);
                        rencana = fmtDate(r.toISOString().split('T')[0]);
                    }
                    rows += `
                        <tr>
                            <td>${h.chamber}</td>
                            <td>${h.openNo || '-'}</td>
                            <td class="right">${fmtDec(h.volumeMasuk,2)} ${h.palet ? '('+h.palet.length+' plt)' : ''}</td>
                            <td>${fmtDate(h.tanggalMasuk)}</td>
                            <td>${rencana}</td>
                            <td>${h.tanggalSelesai ? fmtDate(h.tanggalSelesai) : '-'}</td>
                            <td>${h.status === 'active' ? '🟠 Aktif' : '✅ Selesai'}</td>
                            <td>${h.status === 'active' ? `<button class="btn btn-sm btn-edit" onclick="window.finishOven('${h.id}')">✔ Selesai</button>` : ''}</td>
                        </tr>
                    `;
                }
                tbody.innerHTML = rows;
            }
        }
    };

    window.clearOven = function(chamber) {
        if (!confirm(`Kosongkan Chamber ${chamber}?`)) return;
        const active = window.ovenHistoryList.find(h => h.chamber === chamber && h.status === 'active');
        if (active) {
            active.status = 'completed';
            active.tanggalSelesai = today();
        }
        const oven = window.ovenList.find(o => o.chamber === chamber);
        if (oven) oven.status = 'empty';
        if (typeof persistAll === 'function') persistAll();
        window.renderOvenStatus();
        toast(`✅ Chamber ${chamber} dikosongkan`);
        if (typeof logActivity === 'function') logActivity('Kosongkan', 'Oven', `Chamber ${chamber}`);
    };

    window.finishOven = function(historyId) {
        const history = window.ovenHistoryList.find(h => h.id === historyId);
        if (!history) return;
        let vol = prompt("Volume palet kering keluar (m³):", history.volumeMasuk);
        if (vol === null) return;
        vol = parseFloat(vol);
        if (isNaN(vol)) vol = 0;
        history.volumeKeluar = vol;
        history.tanggalSelesai = today();
        history.status = 'completed';
        const oven = window.ovenList.find(o => o.chamber === history.chamber);
        if (oven) oven.status = 'empty';
        if (typeof persistAll === 'function') persistAll();
        window.renderOvenStatus();
        toast(`✅ Oven chamber ${history.chamber} selesai`);
        if (typeof logActivity === 'function') logActivity('Selesai', 'Oven', `Chamber ${history.chamber}, keluar ${vol} m³`);
    };

    window.resetOvenData = function() {
        if (!confirm("Reset semua data oven? Semua riwayat akan hilang.")) return;
        window.ovenList = [];
        window.ovenHistoryList = [];
        for (let i = 1; i <= 7; i++) {
            window.ovenList.push({ chamber: i, volume: 0, tanggalMulai: "", status: "empty" });
        }
        if (typeof persistAll === 'function') persistAll();
        window.renderOvenStatus();
        toast("🔄 Semua oven direset");
        if (typeof logActivity === 'function') logActivity('Reset', 'Oven', 'Semua chamber');
    };

    document.addEventListener('DOMContentLoaded', function() {
        initOven();
        window.renderOvenStatus();
    });
})();