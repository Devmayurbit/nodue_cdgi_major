# CDGI No-Dues Management System

A full-stack SaaS Academic Operations Platform for digitizing the No-Dues clearance workflow at CDGI (Chameli Devi Group of Institutions).

## Features

- **4 User Roles**: Student, Faculty, Admin, Super Admin
- **No-Dues Workflow**: Multi-level approval chain (Library → Accounts → Hostel → Lab → Assignment → Faculty → Admin → Super Admin)
- **Notice System**: Submit notices with file & audio uploads, 3-tier approval
- **Certificate Generation**: Auto-generated PDF certificates with embedded QR codes
- **AI Chatbot**: "CDGI Sahayak" — rule-based assistant for common queries
- **Dual Email Verification**: Online (email link) + Offline (6-digit code)
- **Access Keys**: Faculty/Admin registration requires secret access keys
- **Dark/Light Mode**: Full theme support with glassmorphism UI
- **Role-Based Dashboards**: Separate dashboards for each role
- **Audit Logging**: All system actions are logged

## Tech Stack

### Backend
- Node.js + Express.js + TypeScript
- MongoDB with Mongoose ODM
- JWT Authentication (access + refresh tokens)
- PDFKit + QRCode for certificate generation
- Nodemailer for emails
- Multer for file uploads

### Frontend
- React 18 + TypeScript + Vite
- TailwindCSS with custom theme
- React Query v5 for data fetching
- Wouter for routing
- Lucide Icons

## Project Structure

```
campusdues/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & env config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, validation, uploads, errors
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express route definitions
│   │   ├── scripts/         # Seed script
│   │   ├── services/        # Email, certificate, audit services
│   │   └── server.ts        # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Shared UI components
│   │   ├── context/         # Auth & Theme providers
│   │   ├── lib/             # API client
│   │   ├── pages/           # All page components
│   │   ├── App.tsx          # Root with routing
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Tailwind + custom styles
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Copy the example env file and fill in values:

```bash
cd backend
cp .env.example .env
```

Required `.env` variables:
```
MONGODB_URI=mongodb://localhost:27017/campusdues
JWT_SECRET=your-super-secret-jwt-key-2026
JWT_REFRESH_SECRET=your-refresh-secret-key-2026
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FACULTY_ACCESS_KEY=CDGI-FACULTY-2026
ADMIN_ACCESS_KEY=CDGI-ADMIN-2026
SUPERADMIN_ROOT_KEY=CDGI-HOD-ROOT
COLLEGE_LOGO_PATH=assets/college-logo.png

# Production-safe file storage
FILE_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
CLOUDINARY_FOLDER=campusdues
```

Certificate logo setup:
1. Place your college logo at `backend/assets/college-logo.png` (or any path you prefer).
2. Set `COLLEGE_LOGO_PATH` in `backend/.env`.
3. New certificates will include the logo automatically.

### 3. Seed the Database

```bash
cd backend
npx ts-node src/scripts/seed.ts
```

This creates:
- **Super Admin account**: `superadmin@cdgi.edu.in` / `SuperAdmin@2026`
- **10 default departments**: CSE, ECE, ME, CE, EE, IT, Library, Accounts, Hostel, Laboratory

### 4. Run Development Servers

```bash
# Terminal 1 - Backend (port 5000)
cd backend
npx ts-node src/server.ts

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```

The frontend dev server proxies `/api` requests to the backend.

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@cdgi.edu.in | SuperAdmin@2026 |

## Access Keys (for registration)

| Role | Access Key |
|------|-----------|
| Faculty | CDGI-FACULTY-2026 |
| Admin | CDGI-ADMIN-2026 |

## API Routes

All routes under `/api/v1/`:

| Method | Route | Description |
|--------|-------|-------------|
| POST | /auth/register | Student registration |
| POST | /auth/login | Login (all roles) |
| POST | /auth/verify-email | Email verification |
| POST | /auth/refresh-token | Refresh access token |
| GET | /auth/me | Current user |
| PUT | /auth/profile | Update profile |
| POST | /nodues | Submit no-dues |
| GET | /nodues/my | My no-dues |
| GET | /nodues | All no-dues (staff) |
| PUT | /nodues/:id/faculty-approve | Faculty approval |
| PUT | /nodues/:id/admin-approve | Admin approval |
| PUT | /nodues/:id/superadmin-approve | Super admin approval |
| POST | /notices | Submit notice |
| GET | /notices/my | My notices |
| GET | /notices | All notices (staff) |
| PUT | /notices/:id/faculty-approve | Faculty approval |
| PUT | /notices/:id/admin-approve | Admin approval |
| PUT | /notices/:id/superadmin-approve | Super admin approval |
| GET | /certificates/my | My certificates |
| GET | /certificates/verify/:id | Public verification |
| GET | /certificates/:id/download | Download PDF |
| GET | /admin/stats | Admin statistics |
| GET | /admin/students | Student management |
| GET | /admin/departments | Department management |
| GET | /admin/audit-logs | Audit logs |
| POST | /superadmin/create-faculty | Create faculty account |
| POST | /superadmin/create-admin | Create admin account |
| GET | /superadmin/analytics | System analytics |
| GET | /superadmin/users | All users |
| POST | /chat/message | AI chatbot |
| GET | /chat/history | Chat history |

## Production Deployment

Recommended full-stack deployment platform:
1. **Render** (best for this project): deploy backend as a Web Service and frontend as a Static Site.
2. **Railway** is also good for backend + Mongo external services.
3. **Vercel** is recommended for frontend only in this architecture.

### Data Durability Checklist (Important)
1. Use **MongoDB Atlas** (`MONGODB_URI`) for all No-Dues forms, audit logs, notices, users, and certificate metadata.
2. Use **Cloudinary** (`FILE_STORAGE_PROVIDER=cloudinary`) for certificate PDFs and uploaded attachments.
3. Never rely on backend local disk (`/uploads`) for production, because free hosting instances can reset storage.
4. In Atlas, enable backup/snapshot policy for 30-90 days retention.
5. Keep env variables set in your deployment dashboard (Render/Railway), not only in local `.env`.

### Build Frontend
```bash
cd frontend
npm run build
```

Output in `frontend/dist/` — serve with Nginx or from Express.

### Run Backend in Production
```bash
cd backend
npm run build
NODE_ENV=production node dist/server.js
```

### Recommended: Use PM2
```bash
npm install -g pm2
pm2 start dist/server.js --name campusdues-api
```

## License

MIT
