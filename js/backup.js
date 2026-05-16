// backup.js - Export/Import Data (FULLY FIXED)

// ======================== EKSPOR JSON LENGKAP ========================
window.exportFullData = function() {
    try {
        const fullData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            kayuList: window.kayuList || [],
            sawmillList: window.sawmillList || [],
            ovenList: window.ovenList || [],
            produksiList: window.produksiList || [],
            sezingList: window.sezingList || [],
            penjualanList: window.penjualanList || [],
            orderList: window.orderList || [],
            ovenHistoryList: window.ovenHistoryList || [],
            opnameList: window.opnameList || [],
            boardStockList: window.boardStockList || [],
            appUsers: window.appUsers || [],
            activityLog: window.activityLog || [],
            appSettings: window.appSettings || {}
        };
        const jsonStr = JSON.stringify(fullData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_produksi_${today()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('✅ Backup JSON lengkap berhasil');
        logActivity('Export', 'Backup', 'Full data JSON');
    } catch (e) {
        console.error(e);
        toast('❌ Gagal ekspor JSON: ' + e.message);
    }
};

// ======================== IMPOR JSON LENGKAP ========================
window.importFullData = function(file) {
    if (!file) {
        toast('⚠️ Tidak ada file yang dipilih');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            // Validasi minimal
            if (!imported.version || !imported.kayuList) {
                throw new Error('File bukan backup yang valid (versi atau kayuList tidak ditemukan)');
            }
            // Restore semua data
            window.kayuList = imported.kayuList || [];
            window.sawmillList = imported.sawmillList || [];
            window.ovenList = imported.ovenList || [];
            window.produksiList = imported.produksiList || [];
            window.sezingList = imported.sezingList || [];
            window.penjualanList = imported.penjualanList || [];
            window.orderList = imported.orderList || [];
            window.ovenHistoryList = imported.ovenHistoryList || [];
            window.opnameList = imported.opnameList || [];
            window.boardStockList = imported.boardStockList || [];
            window.appUsers = imported.appUsers || [];
            window.activityLog = imported.activityLog || [];
            window.appSettings = imported.appSettings || {};

            // Pastikan ovenList memiliki 7 chamber
            if (!window.ovenList || window.ovenList.length === 0) {
                window.ovenList = [];
                for (let i = 1; i <= 7; i++) {
                    window.ovenList.push({ chamber: i, volume: 0, tanggalMulai: "", status: "empty" });
                }
            } else {
                const existingChambers = window.ovenList.map(o => o.chamber);
                for (let i = 1; i <= 7; i++) {
                    if (!existingChambers.includes(i)) {
                        window.ovenList.push({ chamber: i, volume: 0, tanggalMulai: "", status: "empty" });
                    }
                }
                window.ovenList.sort((a, b) => a.chamber - b.chamber);
            }

            // Simpan ke localStorage
            persistAll();

            // Render ulang seluruh antarmuka
            if (typeof renderAll === 'function') {
                renderAll();
            } else {
                // Force reload jika renderAll tidak ada
                location.reload();
            }
            toast('✅ Restore data berhasil! Halaman akan dimuat ulang.');
            logActivity('Import', 'Backup', 'Full data JSON');
            // Reload untuk memastikan konsistensi
            setTimeout(() => location.reload(), 1500);
        } catch (err) {
            console.error(err);
            toast('❌ Gagal import JSON: ' + err.message);
        }
    };
    reader.onerror = function() {
        toast('❌ Gagal membaca file');
    };
    reader.readAsText(file);
};

// ======================== EKSPOR / IMPOR EXCEL ========================
function ensureSheetJS(callback) {
    if (typeof XLSX !== 'undefined') {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
    script.onload = () => callback();
    script.onerror = () => toast('❌ Gagal memuat SheetJS, cek koneksi internet');
    document.head.appendChild(script);
}

window.exportToExcel = function() {
    ensureSheetJS(() => {
        try {
            const workbook = XLSX.utils.book_new();
            const sheets = {
                'Kayu': (window.kayuList || []).map(x => ({
                    'Tanggal': x.tanggal, 'No Nota': x.noNota, 'Suplier': x.suplier,
                    'Volume (m³)': x.volume, 'Harga (Rp)': x.harga
                })),
                'Sawmill': (window.sawmillList || []).map(s => ({
                    'Tanggal': s.tanggal, 'Proses (m³)': s.prosesSawmill,
                    'Rendemen (%)': s.randemanSawmill, 'Total Palet (m³)': s.totalVolumePalet
                })),
                'Produksi': (window.produksiList || []).map(p => ({
                    'Tanggal': p.tanggal, 'Batch': p.openNo,
                    'Planer Bagus': (p.shift1?.planerBagus||0)+(p.shift2?.planerBagus||0),
                    'Limbah': p.limbah
                })),
                'Penjualan': (window.penjualanList || []).map(p => ({
                    'Tanggal': p.tanggal, 'Volume (m³)': p.volume, 'Retur (m³)': p.retur
                })),
                'Order': (window.orderList || []).map(o => ({
                    'Tanggal': o.tanggal, 'Kode PO': o.kodePO, 'Volume (m³)': o.volumeOrder
                }))
            };
            for (const [sheetName, data] of Object.entries(sheets)) {
                if (data.length) {
                    const ws = XLSX.utils.json_to_sheet(data);
                    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
                }
            }
            XLSX.writeFile(workbook, `data_produksi_${today()}.xlsx`);
            toast('✅ Export Excel berhasil');
        } catch(e) {
            console.error(e);
            toast('❌ Gagal export Excel: ' + e.message);
        }
    });
};

window.importFromExcel = function(file) {
    if (!file) {
        toast('⚠️ Tidak ada file Excel dipilih');
        return;
    }
    ensureSheetJS(() => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const getSheet = (name) => {
                    const sheet = workbook.Sheets[name];
                    return sheet ? XLSX.utils.sheet_to_json(sheet) : [];
                };
                // Impor Kayu (contoh, hanya menambah data baru)
                const kayuData = getSheet('Kayu');
                kayuData.forEach(row => {
                    if (row['Tanggal'] && row['No Nota']) {
                        window.kayuList.push({
                            id: uid(),
                            tanggal: row['Tanggal'],
                            noNota: row['No Nota'],
                            suplier: row['Suplier'] || '',
                            volume: parseFloat(row['Volume (m³)']) || 0,
                            harga: parseFloat(row['Harga (Rp)']) || 0,
                            jumlahBatang: 0,
                            noTruk: '',
                            asal: '',
                            jenis: 'glondong',
                            grade: 'bagus'
                        });
                    }
                });
                // Anda dapat menambahkan impor untuk sheet lain jika perlu
                persistAll();
                toast('✅ Import Excel selesai (data ditambahkan). Refresh halaman.');
                logActivity('Import', 'Excel', 'Tambah data dari Excel');
                setTimeout(() => location.reload(), 1500);
            } catch(err) {
                console.error(err);
                toast('❌ Gagal import Excel: ' + err.message);
            }
        };
        reader.onerror = () => toast('❌ Gagal membaca file Excel');
        reader.readAsArrayBuffer(file);
    });
};

// ======================== TAMPILAN RINGKAS (TOMbol PASTI BERFUNGSI) ========================
function initBackupUI() {
    const exportPanel = document.getElementById('tab-export');
    if (!exportPanel) return;
    const formCard = exportPanel.querySelector('.form-card');
    if (!formCard) return;
    if (document.getElementById('backup-group')) return; // sudah ada

    const groupDiv = document.createElement('div');
    groupDiv.id = 'backup-group';
    groupDiv.style.display = 'flex';
    groupDiv.style.flexDirection = 'column';
    groupDiv.style.gap = '12px';
    groupDiv.style.marginTop = '10px';
    groupDiv.style.alignItems = 'center';

    // Baris 1: Backup & Restore JSON
    const jsonRow = document.createElement('div');
    jsonRow.style.display = 'flex';
    jsonRow.style.gap = '12px';
    jsonRow.style.flexWrap = 'wrap';
    jsonRow.style.justifyContent = 'center';
    jsonRow.innerHTML = `
        <button id="json-export-btn" class="btn btn-primary" style="min-width:160px">💾 Backup Lengkap (JSON)</button>
        <label id="json-import-label" class="btn btn-secondary" style="cursor:pointer; min-width:160px; text-align:center">📂 Restore Data
            <input type="file" id="json-import-file" accept=".json" style="display:none">
        </label>
    `;

    // Baris 2: Export & Import Excel
    const excelRow = document.createElement('div');
    excelRow.style.display = 'flex';
    excelRow.style.gap = '12px';
    excelRow.style.flexWrap = 'wrap';
    excelRow.style.justifyContent = 'center';
    excelRow.style.alignItems = 'center';
    excelRow.innerHTML = `
        <button id="excel-export-btn" class="btn btn-secondary btn-sm" style="min-width:130px">📎 Export Excel</button>
        <label id="excel-import-label" class="btn btn-secondary btn-sm" style="cursor:pointer; min-width:130px; text-align:center">📂 Import Excel
            <input type="file" id="excel-import-file" accept=".xlsx, .xls" style="display:none">
        </label>
        <span style="font-size:10px; color:var(--muted);">⚠️ Import Excel hanya menambah data</span>
    `;

    groupDiv.appendChild(jsonRow);
    groupDiv.appendChild(excelRow);
    formCard.appendChild(groupDiv);

    // Pasang event listener (tidak menggunakan onclick agar lebih aman)
    const jsonExportBtn = document.getElementById('json-export-btn');
    if (jsonExportBtn) jsonExportBtn.addEventListener('click', () => window.exportFullData());

    const jsonImportFile = document.getElementById('json-import-file');
    if (jsonImportFile) {
        jsonImportFile.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                window.importFullData(e.target.files[0]);
            }
            e.target.value = ''; // reset
        });
    }

    const excelExportBtn = document.getElementById('excel-export-btn');
    if (excelExportBtn) excelExportBtn.addEventListener('click', () => window.exportToExcel());

    const excelImportFile = document.getElementById('excel-import-file');
    if (excelImportFile) {
        excelImportFile.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                window.importFromExcel(e.target.files[0]);
            }
            e.target.value = '';
        });
    }
}

// Jalankan setelah DOM siap dan juga setelah tab mungkin dirender ulang
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackupUI);
} else {
    initBackupUI();
}
// Panggil lagi setelah beberapa saat karena tab mungkin dibuat dinamis
setTimeout(initBackupUI, 1000);