// backup.js - Export/Import data dengan tampilan ringkas

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
        toast('✅ Backup lengkap (JSON) berhasil');
        logActivity('Export', 'Backup', 'Full data JSON');
    } catch (e) {
        console.error(e);
        toast('❌ Gagal ekspor: ' + e.message);
    }
};

window.importFullData = function(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!imported.version || !imported.kayuList) throw new Error('Format file tidak valid');
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
            // Pastikan oven 7 chamber
            if (!window.ovenList || window.ovenList.length === 0) {
                window.ovenList = [];
                for (let i = 1; i <= 7; i++) window.ovenList.push({ chamber: i, volume: 0, tanggalMulai: "", status: "empty" });
            } else {
                const existing = window.ovenList.map(o => o.chamber);
                for (let i = 1; i <= 7; i++) if (!existing.includes(i)) window.ovenList.push({ chamber: i, volume: 0, tanggalMulai: "", status: "empty" });
                window.ovenList.sort((a, b) => a.chamber - b.chamber);
            }
            persistAll();
            if (typeof renderAll === 'function') renderAll();
            else location.reload();
            toast('✅ Restore data berhasil! Halaman akan dimuat ulang.');
            logActivity('Import', 'Backup', 'Full data JSON');
            setTimeout(() => location.reload(), 1500);
        } catch (err) {
            toast('❌ Gagal import: ' + err.message);
        }
    };
    reader.readAsText(file);
};

// ======================== EKSPOR / IMPOR EXCEL (tetap tersedia) ========================
function ensureSheetJS(callback) {
    if (typeof XLSX !== 'undefined') { callback(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
    script.onload = () => callback();
    script.onerror = () => toast('❌ Gagal memuat SheetJS');
    document.head.appendChild(script);
}

window.exportToExcel = function() {
    ensureSheetJS(() => {
        try {
            const workbook = XLSX.utils.book_new();
            const sheets = {
                'Kayu': (window.kayuList || []).map(x => ({ 'Tanggal': x.tanggal, 'No Nota': x.noNota, 'Suplier': x.suplier, 'Volume (m³)': x.volume, 'Harga (Rp)': x.harga })),
                'Sawmill': (window.sawmillList || []).map(s => ({ 'Tanggal': s.tanggal, 'Proses (m³)': s.prosesSawmill, 'Rendemen (%)': s.randemanSawmill, 'Total Palet (m³)': s.totalVolumePalet })),
                'Produksi': (window.produksiList || []).map(p => ({ 'Tanggal': p.tanggal, 'Batch': p.openNo, 'Planer Bagus': (p.shift1?.planerBagus||0)+(p.shift2?.planerBagus||0), 'Limbah': p.limbah })),
                'Penjualan': (window.penjualanList || []).map(p => ({ 'Tanggal': p.tanggal, 'Volume (m³)': p.volume, 'Retur (m³)': p.retur })),
                'Order': (window.orderList || []).map(o => ({ 'Tanggal': o.tanggal, 'Kode PO': o.kodePO, 'Volume (m³)': o.volumeOrder }))
            };
            for (const [sheetName, data] of Object.entries(sheets)) {
                if (data.length) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), sheetName);
            }
            XLSX.writeFile(workbook, `data_produksi_${today()}.xlsx`);
            toast('✅ Export Excel berhasil');
        } catch(e) { toast('❌ Gagal: ' + e.message); }
    });
};

window.importFromExcel = function(file) {
    if (!file) return;
    ensureSheetJS(() => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                function getSheet(name) { return XLSX.utils.sheet_to_json(workbook.Sheets[name]) || []; }
                // Contoh impor: hanya menambah data (tidak menghapus)
                getSheet('Kayu').forEach(row => {
                    if (row['Tanggal'] && row['No Nota']) window.kayuList.push({ id: uid(), tanggal: row['Tanggal'], noNota: row['No Nota'], suplier: row['Suplier'] || '', volume: parseFloat(row['Volume (m³)']) || 0, harga: parseFloat(row['Harga (Rp)']) || 0 });
                });
                persistAll();
                toast('✅ Import Excel selesai (data ditambahkan)');
                location.reload();
            } catch(err) { toast('❌ Gagal: ' + err.message); }
        };
        reader.readAsArrayBuffer(file);
    });
};

// ======================== TAMPILAN RINGKAS (HANYA 2 BARIS) ========================
function addBackupButtons() {
    const exportPanel = document.getElementById('tab-export');
    if (!exportPanel) return;
    const formCard = exportPanel.querySelector('.form-card');
    if (!formCard) return;
    if (document.getElementById('backup-group')) return;

    const container = document.createElement('div');
    container.id = 'backup-group';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.marginTop = '10px';

    // Baris 1: Backup/Restore JSON (rekomendasi)
    const jsonRow = document.createElement('div');
    jsonRow.style.display = 'flex';
    jsonRow.style.gap = '10px';
    jsonRow.style.justifyContent = 'center';
    jsonRow.innerHTML = `
        <button class="btn btn-primary" id="json-export-btn" style="min-width:140px">💾 Backup Lengkap (JSON)</button>
        <label class="btn btn-secondary" style="cursor:pointer; min-width:140px">📂 Restore Data
            <input type="file" id="json-import-file" accept=".json" style="display:none">
        </label>
    `;

    // Baris 2: Export/Import Excel (opsional)
    const excelRow = document.createElement('div');
    excelRow.style.display = 'flex';
    excelRow.style.gap = '10px';
    excelRow.style.justifyContent = 'center';
    excelRow.innerHTML = `
        <button class="btn btn-secondary btn-sm" id="excel-export-btn" style="min-width:120px">📎 Export Excel</button>
        <label class="btn btn-secondary btn-sm" style="cursor:pointer; min-width:120px">📂 Import Excel
            <input type="file" id="excel-import-file" accept=".xlsx, .xls" style="display:none">
        </label>
        <span style="font-size:10px; color:var(--muted);">⚠️ Import Excel hanya menambah data</span>
    `;

    container.appendChild(jsonRow);
    container.appendChild(excelRow);
    formCard.appendChild(container);

    // Event handlers
    document.getElementById('json-export-btn').onclick = () => window.exportFullData();
    document.getElementById('json-import-file').onchange = (e) => { if(e.target.files[0]) window.importFullData(e.target.files[0]); e.target.value = ''; };
    document.getElementById('excel-export-btn').onclick = () => window.exportToExcel();
    document.getElementById('excel-import-file').onchange = (e) => { if(e.target.files[0]) window.importFromExcel(e.target.files[0]); e.target.value = ''; };
}

setTimeout(addBackupButtons, 1000);