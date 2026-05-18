// backup.js - Export/Import Data SUPER LENGKAP (Excel & JSON)

// ======================== EKSPOR JSON LENGKAP ========================
window.exportFullData = function() {
    try {
        const fullData = {
            version: '2.0',
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
        a.download = `backup_lengkap_${today()}.json`;
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
    if (!confirm("⚠️ PERINGATAN: Import akan MENIMPA semua data yang ada. Lanjutkan?")) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!imported.version || !imported.kayuList) throw new Error('File backup tidak valid');
            
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
                for (let i = 1; i <= 7; i++) {
                    window.ovenList.push({ chamber: i, volume: 0, tanggalMulai: "", status: "empty" });
                }
            } else {
                const existing = window.ovenList.map(o => o.chamber);
                for (let i = 1; i <= 7; i++) {
                    if (!existing.includes(i)) window.ovenList.push({ chamber: i, volume: 0, tanggalMulai: "", status: "empty" });
                }
                window.ovenList.sort((a,b) => a.chamber - b.chamber);
            }
            
            persistAll();
            if (typeof renderAll === 'function') renderAll();
            else location.reload();
            toast('✅ Restore data BERHASIL!');
            logActivity('Import', 'Backup', 'Full data JSON');
            setTimeout(() => location.reload(), 1000);
        } catch (err) {
            console.error(err);
            toast('❌ Gagal import JSON: ' + err.message);
        }
    };
    reader.onerror = () => toast('❌ Gagal membaca file');
    reader.readAsText(file);
};

// ======================== EKSPOR EXCEL SUPER LENGKAP (SEMUA DATA) ========================
window.exportToExcel = function() {
    ensureSheetJS(() => {
        try {
            const workbook = XLSX.utils.book_new();
            
            // 1. Sheet Kayu
            const kayuSheet = XLSX.utils.json_to_sheet((window.kayuList || []).map(k => ({
                'Tanggal': k.tanggal,
                'No Nota': k.noNota,
                'No Truk': k.noTruk || '',
                'Suplier': k.suplier,
                'Asal': k.asal || '',
                'Jenis': k.jenis || 'glondong',
                'Grade': k.grade || 'bagus',
                'Jumlah Batang': k.jumlahBatang || 0,
                'Volume (m³)': k.volume || 0,
                'Harga (Rp)': k.harga || 0,
                'Harga per m³': k.volume > 0 ? (k.harga / k.volume).toFixed(2) : 0
            })));
            XLSX.utils.book_append_sheet(workbook, kayuSheet, 'Kayu');
            
            // 2. Sheet Sawmill
            const sawmillSheet = XLSX.utils.json_to_sheet((window.sawmillList || []).map(s => ({
                'Tanggal': s.tanggal,
                'Shift': s.shift || 'full',
                'Batch Kayu': s.batchKayu || '',
                'Open No': s.openNo || '',
                'Proses Sawmill (m³)': s.prosesSawmill || 0,
                'Total Volume Palet (m³)': s.totalVolumePalet || 0,
                'Rendemen (%)': s.randemanSawmill || 0,
                'Total Palet (pcs)': s.totalPalet || 0,
                'Total SAP (lbr)': s.totalSap || 0,
                'Tenaga Masuk': s.tenagaMasuk || 0,
                'Tenaga Tidak Masuk': s.tenagaTidakMasuk || 0,
                'Produktivitas (m³/org)': s.produktivitas || 0,
                'Catatan': s.catatan || '',
                'Chamber Oven': s.chamber || '',
                'Volume Oven (m³)': s.volumeOven || 0,
                'Tgl Mulai Oven': s.tanggalOven || ''
            })));
            XLSX.utils.book_append_sheet(workbook, sawmillSheet, 'Sawmill');
            
            // 3. Sheet Oven (Status)
            const ovenSheet = XLSX.utils.json_to_sheet((window.ovenList || []).map(o => ({
                'Chamber': o.chamber,
                'Status': o.status,
                'Volume (m³)': o.volume || 0,
                'Tanggal Mulai': o.tanggalMulai || ''
            })));
            XLSX.utils.book_append_sheet(workbook, ovenSheet, 'Oven_Status');
            
            // 4. Sheet Oven History
            const ovenHistSheet = XLSX.utils.json_to_sheet((window.ovenHistoryList || []).map(h => ({
                'Chamber': h.chamber,
                'Open No': h.openNo || '',
                'Volume Masuk (m³)': h.volumeMasuk || 0,
                'Volume Keluar (m³)': h.volumeKeluar || 0,
                'Tanggal Masuk': h.tanggalMasuk || '',
                'Tanggal Selesai': h.tanggalSelesai || '',
                'Status': h.status
            })));
            XLSX.utils.book_append_sheet(workbook, ovenHistSheet, 'Oven_History');
            
            // 5. Sheet Produksi
            const produksiSheet = XLSX.utils.json_to_sheet((window.produksiList || []).map(p => {
                const s1 = p.shift1 || {}, s2 = p.shift2 || {};
                return {
                    'Tanggal': p.tanggal,
                    'Batch': p.openNo || '',
                    'Sumber Palet': (p.asalPalet || []).map(a => `${a.openNo}:${a.jumlahPalet}plt`).join('; '),
                    'Shift1_PlanerPalet': s1.planerPalet || 0,
                    'Shift1_PlanerBagus(m³)': s1.planerBagus || 0,
                    'Shift1_PlanerMis(sap)': s1.planerMis || 0,
                    'Shift1_RipsawIn(m³)': s1.ripsawIn || 0,
                    'Shift1_Seri(lbr)': s1.seri || 0,
                    'Shift1_Press(lbr)': s1.press || 0,
                    'Shift1_TenagaMasuk': s1.masuk || 0,
                    'Shift1_TenagaTidak': s1.tidakMasuk || 0,
                    'Shift2_PlanerPalet': s2.planerPalet || 0,
                    'Shift2_PlanerBagus(m³)': s2.planerBagus || 0,
                    'Shift2_PlanerMis(sap)': s2.planerMis || 0,
                    'Shift2_RipsawIn(m³)': s2.ripsawIn || 0,
                    'Shift2_Seri(lbr)': s2.seri || 0,
                    'Shift2_Press(lbr)': s2.press || 0,
                    'Shift2_TenagaMasuk': s2.masuk || 0,
                    'Shift2_TenagaTidak': s2.tidakMasuk || 0,
                    'Limbah (m³)': p.limbah || 0,
                    'Reject (pcs)': p.reject || 0,
                    'Keterangan': p.keterangan || ''
                };
            }));
            XLSX.utils.book_append_sheet(workbook, produksiSheet, 'Produksi');
            
            // 6. Sheet Sezing
            const sezingSheet = XLSX.utils.json_to_sheet((window.sezingList || []).map(s => ({
                'Tanggal': s.tanggal,
                'Volume (m³)': s.volume || 0
            })));
            XLSX.utils.book_append_sheet(workbook, sezingSheet, 'Sezing');
            
            // 7. Sheet Penjualan
            const penjualanSheet = XLSX.utils.json_to_sheet((window.penjualanList || []).map(p => {
                const order = (window.orderList || []).find(o => o.id === p.orderId);
                return {
                    'Tanggal': p.tanggal,
                    'Kode PO': order ? order.kodePO : '-',
                    'Perusahaan': order ? order.perusahaan : '-',
                    'PCS': p.pcs || 0,
                    'Volume (m³)': p.volume || 0,
                    'Retur (m³)': p.retur || 0,
                    'Netto (m³)': (p.volume || 0) - (p.retur || 0),
                    'No Truk': p.truk || '',
                    'Tujuan': p.tujuan || '',
                    'Total Harga (Rp)': p.harga || 0
                };
            }));
            XLSX.utils.book_append_sheet(workbook, penjualanSheet, 'Penjualan');
            
            // 8. Sheet Order
            const orderSheet = XLSX.utils.json_to_sheet((window.orderList || []).map(o => ({
                'Tanggal': o.tanggal,
                'Kode PO': o.kodePO,
                'Perusahaan': o.perusahaan,
                'Volume Order (m³)': o.volumeOrder || 0,
                'Deadline': o.deadline || '',
                'Prioritas': o.prioritas || 'normal',
                'Catatan': o.catatan || ''
            })));
            XLSX.utils.book_append_sheet(workbook, orderSheet, 'Order');
            
            // 9. Sheet Opname
            const opnameSheet = XLSX.utils.json_to_sheet((window.opnameList || []).map(op => ({
                'Bulan': op.bulan,
                'Stok Kayu Log (m³)': op.log || 0,
                'Stok Palet Basah (m³)': op.basah || 0,
                'Stok Palet Kering (m³)': op.kering || 0,
                'Stok Board (m³)': op.board || 0,
                'Stok Limbah (m³)': op.limbah || 0,
                'Stok Awal Board (m³)': op.awalBoard || 0,
                'Catatan': op.catatan || ''
            })));
            XLSX.utils.book_append_sheet(workbook, opnameSheet, 'Opname');
            
            // 10. Sheet Board Stock (manual)
            const boardStockSheet = XLSX.utils.json_to_sheet((window.boardStockList || []).map(b => {
                const order = (window.orderList || []).find(o => o.id === b.orderId);
                return {
                    'Tanggal': b.tanggal,
                    'Kode PO': order ? order.kodePO : '-',
                    'Stok Board (m³)': b.stok || 0,
                    'Catatan': b.catatan || ''
                };
            }));
            XLSX.utils.book_append_sheet(workbook, boardStockSheet, 'BoardStock');
            
            // 11. Sheet Users (sensitive, optional)
            const usersSheet = XLSX.utils.json_to_sheet((window.appUsers || []).map(u => ({
                'Username': u.username,
                'Nama': u.nama || '',
                'Role': u.role
                // password tidak diekspor demi keamanan
            })));
            XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');
            
            // 12. Sheet Activity Log
            const logSheet = XLSX.utils.json_to_sheet((window.activityLog || []).map(l => ({
                'Waktu': l.timestamp,
                'User': l.user,
                'Aksi': l.aksi,
                'Modul': l.modul,
                'Detail': l.detail
            })));
            XLSX.utils.book_append_sheet(workbook, logSheet, 'ActivityLog');
            
            // 13. Sheet Settings
            const settingsSheet = XLSX.utils.json_to_sheet([window.appSettings || {}]);
            XLSX.utils.book_append_sheet(workbook, settingsSheet, 'Settings');
            
            // Simpan file
            XLSX.writeFile(workbook, `data_lengkap_produksi_${today()}.xlsx`);
            toast('✅ Export Excel SUPER LENGKAP berhasil! Semua data tersimpan.');
            logActivity('Export', 'Excel', 'Full data export');
        } catch(e) {
            console.error(e);
            toast('❌ Gagal export Excel: ' + e.message);
        }
    });
};

// ======================== FUNGSI PEMBANTU SHEETJS ========================
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

// ======================== TAMPILAN UI ========================
function initBackupUI() {
    const exportPanel = document.getElementById('tab-export');
    if (!exportPanel) return;
    const formCard = exportPanel.querySelector('.form-card');
    if (!formCard) return;
    if (document.getElementById('backup-group')) return;
    
    // Hapus tombol lama yang mungkin rancu
    const existing = formCard.querySelectorAll('button,label');
    existing.forEach(btn => btn.remove());
    
    const groupDiv = document.createElement('div');
    groupDiv.id = 'backup-group';
    groupDiv.style.display = 'flex';
    groupDiv.style.flexDirection = 'column';
    groupDiv.style.gap = '12px';
    groupDiv.style.marginTop = '10px';
    groupDiv.style.alignItems = 'center';
    
    // JSON Row
    const jsonRow = document.createElement('div');
    jsonRow.style.display = 'flex';
    jsonRow.style.gap = '12px';
    jsonRow.style.flexWrap = 'wrap';
    jsonRow.style.justifyContent = 'center';
    jsonRow.innerHTML = `
        <button id="json-export-btn" class="btn btn-primary" style="min-width:180px">💾 Backup Lengkap (JSON)</button>
        <label id="json-import-label" class="btn btn-secondary" style="cursor:pointer; min-width:160px; text-align:center">📂 Restore Data
            <input type="file" id="json-import-file" accept=".json" style="display:none">
        </label>
        <span style="font-size:10px; color:var(--muted);">⚠️ Restore akan MENIMPA semua data</span>
    `;
    
    // Excel Row
    const excelRow = document.createElement('div');
    excelRow.style.display = 'flex';
    excelRow.style.gap = '12px';
    excelRow.style.flexWrap = 'wrap';
    excelRow.style.justifyContent = 'center';
    excelRow.innerHTML = `
        <button id="excel-export-btn" class="btn btn-secondary btn-sm" style="min-width:160px">📎 Export Excel (Lengkap)</button>
        <span style="font-size:10px; color:var(--muted);">⚠️ Excel mencakup SEMUA data</span>
    `;
    
    groupDiv.appendChild(jsonRow);
    groupDiv.appendChild(excelRow);
    formCard.appendChild(groupDiv);
    
    // Event listeners
    document.getElementById('json-export-btn')?.addEventListener('click', () => window.exportFullData());
    document.getElementById('excel-export-btn')?.addEventListener('click', () => window.exportToExcel());
    const jsonImportFile = document.getElementById('json-import-file');
    if (jsonImportFile) {
        jsonImportFile.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) window.importFullData(e.target.files[0]);
            e.target.value = '';
        });
    }
}

// Jalankan inisialisasi
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBackupUI);
else initBackupUI();
setTimeout(initBackupUI, 1000);