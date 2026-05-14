const DAYS = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const fmt = n => Number(n||0).toLocaleString("id-ID");
const fmtDec = (n,d=2) => Number(n||0).toFixed(d);
const today = () => new Date().toISOString().split("T")[0];
const thisMonth = () => today().slice(0,7);

function fmtDate(d) {
    if(!d) return "-";
    const dt = new Date(d + "T00:00:00");
    if(isNaN(dt.getTime())) return d;
    return `${DAYS[dt.getDay()]}, ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function confirmDialog(msg) {
    return confirm(msg);
}

function sortByDateAsc(arr) {
    return [...arr].sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));
}

function getDateRange() {
    let awal = document.getElementById("rekap-tgl-awal")?.value;
    let akhir = document.getElementById("rekap-tgl-akhir")?.value;
    if (!awal || !akhir) {
        akhir = today();
        const d = new Date();
        d.setDate(d.getDate() - 30);
        awal = d.toISOString().split("T")[0];
        if (document.getElementById("rekap-tgl-awal")) document.getElementById("rekap-tgl-awal").value = awal;
        if (document.getElementById("rekap-tgl-akhir")) document.getElementById("rekap-tgl-akhir").value = akhir;
    }
    return { awal, akhir };
}

function filterByDateRange(items, awal, akhir) {
    return items.filter(item => item.tanggal && item.tanggal >= awal && item.tanggal <= akhir);
}

function showHelp() {
    alert("📘 PANDUAN SISTEM PRODUKSI\n\n🏠 DASHBOARD: Ringkasan harian, stok real-time, target produksi, grafik tren 30 hari.\n\n🪵 PEMBELIAN KAYU: Catat setiap pembelian log (nota, suplier, volume, harga).\n\n📑 ORDER MASUK: Buat PO customer, lacak sisa volume.\n\n📋 LAPORAN SAWMILL: Input proses gergaji, hasil palet (dimensi otomatis hitung volume), kirim ke oven.\n\n🔥 STATUS OVEN: Monitor 7 chamber, riwayat pengeringan, selesaikan oven.\n\n📦 LAPORAN PRODUKSI: Input per shift, reject board, limbah, sumber palet dari oven.\n\n📏 SEZING & PENJUALAN: Catat hasil laminating board, penjualan dengan retur, terhubung ke order.\n\n🔗 BATCH TRACKING: Lacak aliran per openNo dari log hingga produk jadi.\n\n🧮 STOK OPNAME: Rekonsiliasi stok fisik vs sistem, termasuk rekonsiliasi sezing.\n\n📊 REKAP & ALIRAN: Filter tanggal custom, lihat aliran material dan rendemen.\n\n⚙️ PENGATURAN: Target produksi, batas stok, rendemen minimal.\n\n📁 EXPORT/IMPORT: Backup & restore semua data ke file JSON.\n\nUntuk bantuan lebih lanjut, hubungi administrator.");
}