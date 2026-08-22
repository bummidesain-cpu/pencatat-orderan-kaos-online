# 🚀 Backend PHP + MySQL - Sistem Manajemen Order Sablon & Konveksi

Backend REST API siap pakai berbasis **PHP Native (PDO)** dan **MySQL / MariaDB** untuk Sistem Manajemen Order, Kasir POS, Tracking Produksi, dan Laporan Keuangan Konveksi Sablon.

---

## 📁 Struktur Direktori Backend

```text
backend/
├── database.sql           # Schema MySQL + Data Default (Users, Settings, Sample Data)
├── .htaccess              # Konfigurasi Apache & CORS Rewrite Rules
├── README.md              # Dokumentasi & Panduan Instalasi
├── config/
│   ├── database.php       # Handler Koneksi PDO MySQL & Setting Timezone
│   ├── cors.php           # Middleware Header CORS & Preflight OPTIONS
│   └── auth.php           # Token Generator & Helper Otorisasi Akses
├── api/
│   ├── auth.php           # Login, Session Check, CRUD Akun Pengguna
│   ├── orders.php         # CRUD Transaksi Pesanan, Kanban Produksi & Pembayaran
│   ├── customers.php      # CRUD Database Pelanggan & Riwayat Kontak
│   ├── expenses.php       # CRUD Pengeluaran Operasional, Belanja Bahan & Gaji
│   ├── pricelist.php      # CRUD Master Daftar Harga / Paket Sablon
│   ├── settings.php       # Pengaturan Profil Toko, Bank & Target Omset
│   ├── stats.php          # Ringkasan Statistik, Omset & Progress Target
│   ├── upload.php         # Upload Logo, Desain Mockup & Bukti Nota
│   └── state.php          # Backup, Restore & Sinkronisasi Full State
└── uploads/               # Direktori Penyimpanan File & Gambar
```

---

## 🛠️ Panduan Instalasi & Menjalankan

### A. Menggunakan XAMPP (Localhost)
1. **Jalankan XAMPP Control Panel**: Start modul **Apache** dan **MySQL**.
2. **Buat Database**: Buka browser ke `http://localhost/phpmyadmin/`. Buat database baru bernama `db_order_management`.
3. **Import database.sql**: Klik tab **Import** pada database tersebut, pilih file `backend/database.sql`, lalu klik **Go / Kirim**.
4. **Pindahkan Folder Backend**: Salin seluruh isi folder `backend/` ke dalam direktori:
   - Windows: `C:/xampp/htdocs/order-api/`
   - Mac (MAMP): `/Applications/MAMP/htdocs/order-api/`
   - Linux: `/var/www/html/order-api/`
5. **Konfigurasi database.php**:
   Buka `config/database.php`, pastikan kredensial sesuai:
   ```php
   define('DB_HOST', '127.0.0.1');
   define('DB_NAME', 'db_order_management');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   ```
6. **Uji Coba Endpoint**:
   Buka browser ke `http://localhost/order-api/api/settings.php`. Jika muncul JSON berisi data profil usaha, backend sudah berhasil aktif! 🎉

---

### B. Menggunakan Laragon
1. Klik kanan ikon Laragon > **MySQL > Create database...** > Masukkan nama `db_order_management`.
2. Buka **HeidiSQL / phpMyAdmin**, import file `backend/database.sql`.
3. Letakkan folder di `C:/laragon/www/order-api/`.
4. Akses via `http://order-api.test/api/settings.php`.

---

### C. Deploy ke cPanel Hosting / Shared Hosting
1. Masuk ke **cPanel** > Buka menu **MySQL Database Wizard**:
   - Buat database (contoh: `u1234_ordermanagement`).
   - Buat user database & password. Berikan hak akses **ALL PRIVILEGES**.
2. Buka menu **phpMyAdmin** di cPanel, pilih database tadi, lalu **Import** file `database.sql`.
3. Buka **File Manager** > masuk ke `public_html/api/` (atau subdomain `api.domainanda.com`).
4. Upload semua file PHP backend.
5. Edit file `config/database.php` dan sesuaikan `DB_NAME`, `DB_USER`, `DB_PASS` dengan kredensial cPanel Anda.

---

## 📡 Daftar Endpoint REST API

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/auth.php?action=login` | Login pengguna (Owner, Admin, Produksi) |
| `GET` | `/api/auth.php?action=me` | Ambil sesi profil pengguna yang sedang login |
| `GET` | `/api/auth.php?action=users` | Ambil seluruh daftar pengguna |
| `POST` | `/api/auth.php?action=users` | Tambah atau perbarui data pengguna |
| `GET` | `/api/orders.php` | Ambil semua daftar orderan (dukung filter & cari) |
| `GET` | `/api/orders.php?id={id}` | Ambil detail 1 order beserta rincian item & DP |
| `POST` | `/api/orders.php` | Simpan / update transaksi order & jadwal produksi |
| `DELETE`| `/api/orders.php?id={id}` | Hapus 1 transaksi pesanan |
| `GET` | `/api/customers.php` | Ambil daftar data pelanggan |
| `POST` | `/api/customers.php` | Tambah atau perbarui data pelanggan |
| `GET` | `/api/expenses.php` | Ambil daftar buku pengeluaran / belanja |
| `POST` | `/api/expenses.php` | Catat pengeluaran baru (kain, sablon, gaji) |
| `GET` | `/api/pricelist.php` | Ambil daftar harga produk & sablon |
| `POST` | `/api/pricelist.php` | Simpan / update item harga |
| `GET` | `/api/settings.php` | Ambil pengaturan profil bisnis & nomor rekening |
| `POST` | `/api/settings.php` | Simpan / update pengaturan bisnis |
| `GET` | `/api/stats.php` | Ringkasan omset, profit, piutang, target bulanan |
| `POST` | `/api/upload.php` | Upload file gambar/dokumen pendukung |
| `GET` | `/api/state.php` | Export seluruh isi database ke JSON |

---

## 🔐 Akun Default Awal

| Role | Nama Pengguna / Email | Password Default |
|---|---|---|
| **Owner (Pemilik)** | `owner@ordermanagement.com` | `owner123` |
| **Admin Sales** | `admin@ordermanagement.com` | `admin123` |
| **Kepala Produksi** | `produksi@ordermanagement.com` | `produksi123` |
