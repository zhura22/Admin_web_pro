# 🪵 Admin Web Pro

> Sistem Manajemen Produksi Sawmill, Oven, Palet, Stok, dan Penjualan berbasis Web.

![License](https://img.shields.io/badge/license-Custom-blue)
![HTML5](https://img.shields.io/badge/HTML5-Frontend-orange)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![Storage](https://img.shields.io/badge/Storage-LocalStorage-green)

---

## 📖 Tentang Project

**Admin Web Pro** adalah aplikasi administrasi dan monitoring produksi yang dirancang untuk industri kayu, sawmill, pengeringan oven, produksi palet, serta pengelolaan stok dan penjualan.

Aplikasi dibuat menggunakan **HTML, CSS, dan JavaScript murni** tanpa backend sehingga dapat dijalankan secara lokal maupun dihosting pada server statis.

### Keunggulan

- ✅ Tanpa database
- ✅ Tanpa backend
- ✅ Ringan dan cepat
- ✅ Dapat berjalan offline
- ✅ Multi-theme modern
- ✅ Export laporan PDF
- ✅ Backup & restore data
- ✅ Dashboard statistik interaktif

---

## ✨ Fitur

### 📊 Dashboard
- Ringkasan produksi
- Statistik penjualan
- Grafik Chart.js
- Monitoring aktivitas

### 🪵 Manajemen Kayu
- Input pembelian kayu
- Riwayat transaksi
- Monitoring bahan baku

### ⚙️ Sawmill
- Input hasil potong
- Rekap produksi
- Monitoring output

### 🔥 Oven
- Pencatatan proses oven
- Tracking siklus pengeringan
- Riwayat produksi oven

### 🏭 Produksi
- Input hasil produksi
- Monitoring target
- Rekap harian

### 📦 Sezing
- Pengelolaan ukuran produk
- Monitoring hasil sezing

### 🛒 Order & Penjualan
- Data order pelanggan
- Riwayat penjualan
- Monitoring transaksi

### 📋 Stock Opname
- Pencatatan stok aktual
- Validasi stok gudang

### 📈 Rekapitulasi
- Rekap produksi
- Rekap penjualan
- Ringkasan bulanan

### 👤 User Management
- Login system
- Session management
- View Only mode
- Lockout protection

---

## 🎨 Tema yang Tersedia

- Light
- Noir
- Gold
- Green
- Blue
- Teak
- Glass Purple
- Liquid Glass

---

## 🗂️ Struktur Project

```text
Admin_web_pro-fixed
│
├── index.html
├── css/
│   └── style.css
│
└── js/
    ├── app.js
    ├── auth.js
    ├── dashboard.js
    ├── storage.js
    ├── settings.js
    ├── alerts.js
    ├── backup.js
    ├── export-pdf.js
    ├── logger.js
    ├── ui.js
    ├── utils.js
    ├── config.js
    │
    ├── components/
    │   ├── modal.js
    │   └── toast.js
    │
    ├── modules/
    │   ├── kayu.js
    │   ├── sawmill.js
    │   ├── oven.js
    │   ├── produksi.js
    │   ├── sezing.js
    │   ├── order.js
    │   ├── opname.js
    │   ├── rekap.js
    │   └── lmkb.js
    │
    └── themes/
```

---

## 🚀 Instalasi

### Clone Repository

```bash
git clone https://github.com/USERNAME/Admin-Web-Pro.git
```

### Jalankan Lokal

Buka:

```text
index.html
```

atau gunakan web server:

```bash
python -m http.server 8000
```

kemudian:

```text
http://localhost:8000
```

---

## 💾 Penyimpanan Data

Data disimpan menggunakan Browser LocalStorage.

Contoh key:

```text
prodAdmin_kayu
prodAdmin_sawmill
prodAdmin_oven
prodAdmin_produksi
prodAdmin_order
prodAdmin_penjualan
prodAdmin_opname
prodAdmin_users
prodAdmin_settings
```

---

## 🔒 Keamanan

- Session timeout
- Auto logout warning
- Login lockout
- View-only mode
- Activity logging
- User session management

---

## 📄 Export Data

Mendukung:

- PDF Export
- Backup JSON
- Restore Data
- Rekap Laporan

---

## 🖥️ Browser Support

| Browser | Support |
|----------|----------|
| Chrome | ✅ |
| Edge | ✅ |
| Firefox | ✅ |
| Opera | ✅ |
| Brave | ✅ |

---

## 🛣️ Roadmap

- [ ] Multi-user online
- [ ] Sinkronisasi cloud
- [ ] API backend
- [ ] Mobile application
- [ ] Notifikasi real-time
- [ ] Integrasi barcode/QR

---

## 🤝 Kontribusi

Pull Request dan Issue sangat diterima untuk pengembangan lebih lanjut.

---

## ⭐ Dukungan

Jika project ini membantu pekerjaan Anda:

⭐ Beri Star pada repository GitHub.

---

## 📜 Lisensi

Lisensi menyesuaikan kebutuhan pemilik project.
