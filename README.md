# WebBinOps Monorepo

Repository ini telah dikonfigurasi sebagai **Monorepo** menggunakan **npm Workspaces**.

## 📁 Struktur Direktori

```text
WebBinOps/
├── apps/
│   ├── backend/             (@webbinops/backend - Node.js Express API & Prisma)
│   └── frontend/            (@webbinops/frontend - React + Vite + Tailwind CSS)
├── packages/                (Disediakan untuk shared library/types/utility)
├── package.json             (Root package.json)
├── README.md                (Dokumentasi Monorepo)
└── .gitignore               (Unified gitignore)
```

## 🚀 Perintah Pengembangan (Scripts)

Jalankan semua perintah ini dari **root direktori**:

### 1. Install Seluruh Dependensi
```bash
npm install
```

### 2. Jalankan Server Dev (Backend & Frontend Bersamaan)
```bash
npm run dev
```

### 3. Jalankan Aplikasi Secara Terpisah
- **Backend Sahaja:** `npm run dev:backend`
- **Frontend Sahaja:** `npm run dev:frontend`

### 4. Database (Prisma)
- **Generate Prisma Client:** `npm run db:generate`
- **Jalankan Database Migration:** `npm run db:migrate`

### 5. Build Seluruh Aplikasi
```bash
npm run build
```
