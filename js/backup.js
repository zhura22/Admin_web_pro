// backup.js - Export/Import Excel dengan SheetJS

// Fungsi memuat SheetJS dari CDN jika belum ada
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

// Export semua data ke file Excel (multiple sheets)
window.exportToExcel = function() {
    ensureSheetJS(() => {
        try {
            const workbook = XLSX.utils.book_new();
            
            // Siapkan data per sheet
            const sheets = {
                'Kayu': window.kayuList.map(x => ({
                    'Tanggal': x.tanggal,
                    'No Nota': x.noNota,
                    'No Truk': x.noTruk,
                    'Jumlah Batang': x.jumlahBatang,
                    'Volume (m³)': x.volume,
                    'Harga (Rp)': x.harga,
                    'Suplier': x.suplier,
                    'Asal': x.asal,
                    'Jenis': x.jenis,
                    'Grade': x.grade
                })),
                'Sawmill': window.sawmillList.map(s => ({
                    'Tanggal': s.tanggal,
                    'Proses (m³)': s.prosesSawmill,
                    'Rendemen (%)': s.randemanSawmill,
                    'Open No': s.openNo,
                    'Total Palet (m³)': s.totalVolumePalet,
                    'Tenaga Masuk': s.tenagaMasuk,
                    'Tenaga Tidak Masuk': s.tenagaTidakMasuk,
                    'Catatan': s.catatan,
                    'Chamber': s.chamber,
                    'Volume Oven': s.volumeOven,
                    'Tgl Mulai Oven': s.tanggalOven
                })),
                'Oven History': window.ovenHistoryList.map(h => ({
                    'Chamber': h.chamber,
                    'Open No': h.openNo,
                    'Volume Masuk': h.volumeMasuk,
                    'Volume Keluar': h.volumeKeluar,
                    'Tgl Masuk': h.tanggalMasuk,
                    'Tgl Selesai': h.tanggalSelesai,
                    'Status': h.status
                })),
                'Produksi': window.produksiList.map(p => {
                    const s1 = p.shift1 || {}, s2 = p.shift2 || {};
                    return {
                        'Tanggal': p.tanggal,
                        'Batch': p.openNo,
                        'Sumber Palet': (p.asalPalet || []).map(sp => `${sp.openNo}:${sp.jumlahPalet}plt`).join('; '),
                        'Planer Bagus S1': s1.planerBagus,
                        'Planer Bagus S2': s2.planerBagus,
                        'Total Planer Bagus': (s1.planerBagus||0)+(s2.planerBagus||0),
                        'Ripsaw Input S1': s1.ripsawIn,
                        'Ripsaw Input S2': s2.ripsawIn,
                        'Seri S1': s1.seri,
                        'Seri S2': s2.seri,
                        'Press S1': s1.press,
                        'Press S2': s2.press,
                        'Limbah': p.limbah,
                        'Reject': p.reject,
                        'Keterangan': p.keterangan
                    };
                }),
                'Sezing': window.sezingList.map(s => ({
                    'Tanggal': s.tanggal,
                    'Volume (m³)': s.volume
                })),
                'Penjualan': window.penjualanList.map(p => {
                    const order = window.orderList.find(o => o.id === p.orderId);
                    return {
                        'Tanggal': p.tanggal,
                        'Order PO': order ? order.kodePO : '',
                        'Perusahaan': order ? order.perusahaan : '',
                        'Pcs': p.pcs,
                        'Volume (m³)': p.volume,
                        'No Truk': p.truk,
                        'Tujuan': p.tujuan,
                        'Total Harga (Rp)': p.harga,
                        'Retur (m³)': p.retur
                    };
                }),
                'Order': window.orderList.map(o => ({
                    'Tanggal': o.tanggal,
                    'Kode PO': o.kodePO,
                    'Perusahaan': o.perusahaan,
                    'Volume Order (m³)': o.volumeOrder
                })),
                'Settings': [{
                    'Target Planer': window.appSettings.targetPlaner,
                    'Target Ripsaw': window.appSettings.targetRipsaw,
                    'Target Seri': window.appSettings.targetSeri,
                    'Target Press': window.appSettings.targetPress,
                    'Min Stok Kering': window.appSettings.minStokKering,
                    'Rendemen Min': window.appSettings.rendemenMin,
                    'Target Kayu Harian': window.appSettings.targetKayuHarian,
                    'Target Sawmill Harian': window.appSettings.targetSawmillHarian,
                    'Target Sezing Harian': window.appSettings.targetSezingHarian,
                    'Stok Awal Kayu': window.appSettings.stokAwalKayu
                }]
            };
            
            for (const [sheetName, data] of Object.entries(sheets)) {
                if (data.length === 0) continue;
                const ws = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(workbook, ws, sheetName);
            }
            
            XLSX.writeFile(workbook, `data_produksi_${today()}.xlsx`);
            toast('✅ Data berhasil diekspor ke Excel');
        } catch(e) {
            console.error(e);
            toast('❌ Gagal ekspor: ' + e.message);
        }
    });
};

// Impor dari file Excel (menambahkan data baru, tidak menghapus yang lama)
window.importFromExcel = function(file) {
    if (!file) return;
    ensureSheetJS(() => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                function getSheetData(sheetName) {
                    const sheet = workbook.Sheets[sheetName];
                    if (!sheet) return [];
                    return XLSX.utils.sheet_to_json(sheet);
                }
                
                // Impor Kayu
                const kayuData = getSheetData('Kayu');
                kayuData.forEach(row => {
                    if (row['Tanggal'] && row['No Nota']) {
                        window.kayuList.push({
                            id: uid(),
                            tanggal: row['Tanggal'],
                            noNota: row['No Nota'],
                            noTruk: row['No Truk'] || '',
                            jumlahBatang: parseFloat(row['Jumlah Batang']) || 0,
                            volume: parseFloat(row['Volume (m³)']) || 0,
                            harga: parseFloat(row['Harga (Rp)']) || 0,
                            suplier: row['Suplier'] || '',
                            asal: row['Asal'] || '',
                            jenis: row['Jenis'] || 'glondong',
                            grade: row['Grade'] || 'bagus'
                        });
                    }
                });
                
                // Impor Sawmill
                const sawmillData = getSheetData('Sawmill');
                sawmillData.forEach(row => {
                    window.sawmillList.push({
                        id: uid(),
                        tanggal: row['Tanggal'] || '',
                        prosesSawmill: parseFloat(row['Proses (m³)']) || 0,
                        randemanSawmill: parseFloat(row['Rendemen (%))']) || 0,
                        openNo: row['Open No'] || '',
                        totalVolumePalet: parseFloat(row['Total Palet (m³)']) || 0,
                        tenagaMasuk: parseInt(row['Tenaga Masuk']) || 0,
                        tenagaTidakMasuk: parseInt(row['Tenaga Tidak Masuk']) || 0,
                        catatan: row['Catatan'] || '',
                        chamber: row['Chamber'] || '',
                        volumeOven: parseFloat(row['Volume Oven']) || 0,
                        tanggalOven: row['Tgl Mulai Oven'] || '',
                        hasilPalet: []
                    });
                });
                
                // Impor Oven History
                const ovenData = getSheetData('Oven History');
                ovenData.forEach(row => {
                    window.ovenHistoryList.push({
                        id: uid(),
                        chamber: parseInt(row['Chamber']) || 0,
                        openNo: row['Open No'] || '',
                        volumeMasuk: parseFloat(row['Volume Masuk']) || 0,
                        volumeKeluar: parseFloat(row['Volume Keluar']) || 0,
                        tanggalMasuk: row['Tgl Masuk'] || '',
                        tanggalSelesai: row['Tgl Selesai'] || '',
                        status: row['Status'] || 'completed',
                        palet: []
                    });
                });
                
                // Impor Produksi
                const produksiData = getSheetData('Produksi');
                produksiData.forEach(row => {
                    window.produksiList.push({
                        id: uid(),
                        tanggal: row['Tanggal'] || '',
                        openNo: row['Batch'] || '',
                        asalPalet: [],
                        shift1: {
                            planerBagus: parseFloat(row['Planer Bagus S1']) || 0,
                            ripsawIn: parseFloat(row['Ripsaw Input S1']) || 0,
                            seri: parseInt(row['Seri S1']) || 0,
                            press: parseInt(row['Press S1']) || 0
                        },
                        shift2: {
                            planerBagus: parseFloat(row['Planer Bagus S2']) || 0,
                            ripsawIn: parseFloat(row['Ripsaw Input S2']) || 0,
                            seri: parseInt(row['Seri S2']) || 0,
                            press: parseInt(row['Press S2']) || 0
                        },
                        limbah: parseFloat(row['Limbah']) || 0,
                        reject: parseInt(row['Reject']) || 0,
                        keterangan: row['Keterangan'] || ''
                    });
                });
                
                // Impor Sezing
                const sezingData = getSheetData('Sezing');
                sezingData.forEach(row => {
                    window.sezingList.push({
                        id: uid(),
                        tanggal: row['Tanggal'] || '',
                        volume: parseFloat(row['Volume (m³)']) || 0
                    });
                });
                
                // Impor Order (perlu sebelum penjualan)
                const orderData = getSheetData('Order');
                orderData.forEach(row => {
                    window.orderList.push({
                        id: uid(),
                        tanggal: row['Tanggal'] || '',
                        kodePO: row['Kode PO'] || '',
                        perusahaan: row['Perusahaan'] || '',
                        volumeOrder: parseFloat(row['Volume Order (m³)']) || 0
                    });
                });
                
                // Impor Penjualan (cari orderId berdasarkan kodePO)
                const penjualanData = getSheetData('Penjualan');
                penjualanData.forEach(row => {
                    const order = window.orderList.find(o => o.kodePO === row['Order PO']);
                    window.penjualanList.push({
                        id: uid(),
                        tanggal: row['Tanggal'] || '',
                        pcs: parseInt(row['Pcs']) || 0,
                        volume: parseFloat(row['Volume (m³)']) || 0,
                        truk: row['No Truk'] || '',
                        tujuan: row['Tujuan'] || '',
                        harga: parseFloat(row['Total Harga (Rp)']) || 0,
                        retur: parseFloat(row['Retur (m³)']) || 0,
                        orderId: order ? order.id : null
                    });
                });
                
                persistAll();
                renderAll();
                toast('✅ Import Excel berhasil! Data ditambahkan.');
            } catch(err) {
                console.error(err);
                toast('❌ Gagal import file: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    });
};

// Tambah tombol export/import Excel di tab Export
function addExcelButtons() {
    const exportPanel = document.getElementById('tab-export');
    if (!exportPanel) return;
    const btnContainer = exportPanel.querySelector('.form-card');
    if (!btnContainer) return;
    if (document.getElementById('excel-export-btn')) return;
    
    const btnGroup = document.createElement('div');
    btnGroup.style.display = 'flex';
    btnGroup.style.gap = '10px';
    btnGroup.style.marginTop = '10px';
    btnGroup.innerHTML = `
        <button class="btn btn-primary" id="excel-export-btn">📎 Export ke Excel</button>
        <label class="btn btn-secondary" style="cursor:pointer;">📂 Import dari Excel
            <input type="file" id="excel-import-file" accept=".xlsx, .xls" style="display:none">
        </label>
    `;
    btnContainer.appendChild(btnGroup);
    
    document.getElementById('excel-export-btn').onclick = () => window.exportToExcel();
    document.getElementById('excel-import-file').onchange = (e) => {
        if (e.target.files[0]) window.importFromExcel(e.target.files[0]);
        e.target.value = '';
    };
}

// Jalankan setelah DOM siap
setTimeout(addExcelButtons, 1000);