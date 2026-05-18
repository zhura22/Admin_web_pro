// lmkb.js - Laporan Mutasi Kayu Bundar (berdasarkan data Pembelian Kayu)

// Generate opsi bulan (sama seperti di kayu)
function generateMonthOptions() {
    const months = [];
    const today = new Date();
    const thisMonth = today.toISOString().slice(0,7);
    months.push(`<option value="${thisMonth}">Bulan ini (${thisMonth})</option>`);
    for (let i = 1; i <= 11; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = d.toISOString().slice(0,7);
        months.push(`<option value="${monthStr}">${monthStr}</option>`);
    }
    months.push(`<option value="all">Semua Bulan</option>`);
    return months.join("");
}

// Filter data kayu berdasarkan bulan
function getFilteredKayuForLMKB() {
    const bulan = document.getElementById("lmkb-filter-bulan")?.value || "all";
    if (bulan === "all") return [...window.kayuList];
    return window.kayuList.filter(k => k.tanggal && k.tanggal.startsWith(bulan));
}

// Render tabel LMKB
function renderLMKB() {
    const tbody = document.getElementById("lmkb-tbody");
    if (!tbody) return;
    const filtered = sortByDateAsc(getFilteredKayuForLMKB());
    const countEl = document.getElementById("lmkb-count");
    if (countEl) countEl.textContent = filtered.length + " transaksi";
    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty">📭 Tidak ada data kayu pada periode ini</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map((item, idx) => {
        // Tentukan jenis kayu dari field jenis (glondong/papan)
        let jenisKayu = item.jenis === 'glondong' ? 'Glondong' : (item.jenis === 'papan' ? 'Papan' : '-');
        // Tujuan bisa diisi dari suplier atau asal, sesuai kebutuhan
        let tujuan = item.suplier || '-';
        // Keterangan bisa diisi grade
        let keterangan = item.grade === 'bagus' ? 'Grade Bagus' : (item.grade === 'jelek' ? 'Grade Jelek' : '-');
        return `
            <tr class="${idx % 2 ? 'odd' : 'even'}">
                <td class="center">${idx+1}</td>
                <td>${fmtDate(item.tanggal)}</td>
                <td>${escapeHtml(item.noNota || '-')}</td>
                <td>${escapeHtml(item.asal || '-')}</td>
                <td>${jenisKayu}</td>
                <td class="right">${fmtDec(item.volume, 2)}</td>
                <td>${escapeHtml(item.noTruk || '-')}</td>
                <td>${escapeHtml(tujuan)}</td>
                <td>${escapeHtml(keterangan)}</td>
            </tr>
        `;
    }).join("");
}

// Inisialisasi filter bulan dan event listener
function initLMKBFilter() {
    const select = document.getElementById("lmkb-filter-bulan");
    if (!select) return;
    select.innerHTML = generateMonthOptions();
    const saved = localStorage.getItem('lmkb_filter_month');
    if (saved && select.querySelector(`option[value="${saved}"]`)) select.value = saved;
    const applyFilter = () => {
        localStorage.setItem('lmkb_filter_month', select.value);
        renderLMKB();
    };
    const btnApply = document.getElementById("lmkb-apply-filter");
    if (btnApply) btnApply.onclick = applyFilter;
    select.onchange = applyFilter;
    renderLMKB();
}

// Panggil saat tab LMKB diaktifkan
if (typeof window.switchTab === 'function') {
    const originalSwitch = window.switchTab;
    window.switchTab = function(tabName) {
        originalSwitch(tabName);
        if (tabName === 'lmkb') {
            // Pastikan data kayu sudah dimuat
            if (window.kayuList) initLMKBFilter();
            else setTimeout(initLMKBFilter, 100);
        }
    };
}

// Jika halaman dimuat dan tab LMKB aktif langsung
document.addEventListener('DOMContentLoaded', () => {
    const lmkbTab = document.getElementById("tab-lmkb");
    if (lmkbTab && !lmkbTab.classList.contains("hidden")) {
        initLMKBFilter();
    }
});