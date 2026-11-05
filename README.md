# EDUNEXUS — School Management System

EDUNEXUS is a modern, unified School Management System built with Next.js App Router, TypeScript, Tailwind CSS, MongoDB Atlas, and Mongoose. It delivers distinct role-based portals for **Administrators**, **Teachers**, and **Students**, with strict server-side authorization and data isolation.

---

## 🌟 Modules & Features

### 1. Authentication & Role-Based Access Control
- JWT cookie-based session authentication (`httpOnly`, `sameSite: lax`, `secure` in production).
- Strict role isolation across 3 user types:
  - **Admin**: Full operational control across all institutional records.
  - **Teacher**: Scoped exclusively to assigned classes, timetable periods, student rosters, and homework grading.
  - **Student**: Scoped strictly to personal profile, attendance history, homework submissions, published results, and fee ledgers.
- Dedicated logout invalidation and role redirection (`/admin`, `/teacher`, `/student`).

### 2. Administrator Portal (`/admin`)
- **Student Management**: Student directory, enrollment, roll numbering, and contact profiles.
- **Teacher Management**: Faculty directory, department assignments, and specializations.
- **Classes & Sections**: Class/section configuration, capacity tracking, class teacher assignments, and pupil rosters.
- **Attendance Management**: Daily attendance marking (present, absent, late, half-day), attendance logs, and analytical reports.
- **Timetable Scheduling**: Multi-class period scheduling with conflict detection (no overlapping periods, teacher double-booking, or room collisions).
- **Examinations & Grading**: Exam scheduling, subject passing criteria, marks entry, and automated letter grades (A+ to F).
- **Fee Management**: Fee structure scheduling, student ledger billing, payment receipt generation, and overpayment guards.
- **Noticeboard**: Campus announcement publishing with audience targeting (`all`, `teachers`, `students`).

### 3. Teacher Portal (`/teacher`)
- **Dashboard**: Today's timetable schedule, assigned class metrics, total pupil headcount, pending submission counters, and bulletins.
- **My Classes**: Read-only pupil rosters for assigned classes.
- **My Timetable**: Weekly period schedule grouped Monday to Saturday with timings and room numbers.
- **Class Attendance**: Interactive attendance marker with bulk present/absent actions and history logs.
- **Assignments**: Homework creation, deadline enforcement, student submission tracking, and grading with marks and feedback remarks.

### 4. Student Portal (`/student`)
- **Dashboard**: Overall attendance percentage, pending homework alerts, fee balance, and today's period schedule.
- **My Profile**: Read-only academic enrollment details, roll number, admission number, and guardian contact info.
- **My Attendance**: Session attendance history with status filter (`present`, `absent`, `late`, `half-day`) and month filtering.
- **My Timetable**: Official weekly class routine (Monday–Saturday).
- **Assignments & Coursework**: Assignment listings, submission drawer, anti-duplicate submission protection, and graded marks/feedback review.
- **Examination Results**: Certified report cards for officially published exams only (drafts and unpublished exams remain hidden).
- **Fee Details & Receipts**: Fee invoices, verified payment history, and browser-printable payment receipts in Indian Rupees (₹).

---

## 🛠 Technology Stack

- **Framework**: Next.js 16.4.5 (App Router, Turbopack / Webpack build)
- **Language**: TypeScript (strict type checking)
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas
- **ODM**: Mongoose 9.x
- **Authentication**: Custom JWT with `jose` and `bcryptjs`
- **Validation**: Zod
- **Icons**: Lucide React

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory for local development. In production (e.g. Vercel), add these keys to your project's Environment Variables settings:

| Variable Name | Description | Example / Note |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas SRV connection string | `mongodb+srv://user:pass@cluster.mongodb.net/edunexus` |
| `JWT_SECRET` | Secret key for signing and verifying JWT tokens | Minimum 32-character random string |
| `ADMIN_EMAIL` | Initial administrator login email | e.g. `admin@edunexus.edu` |
| `ADMIN_PASSWORD` | Initial administrator login password | e.g. `AdminSecurePassword!123` |

> ⚠️ **Never commit `.env` or `.env.local` to Git.** Ensure `.env*` remains listed in `.gitignore`.

---

## 🚀 Local Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Edu-Nexus
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the project root with the variables listed above.

4. **Initialize / Seed Admin Account**:
   Start the development server:
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000/login`. On first launch or database connection, the default admin account specified by `ADMIN_EMAIL` and `ADMIN_PASSWORD` will be verified and created if it does not already exist.

5. **Type Check**:
   ```bash
   npx tsc --noEmit
   ```

6. **Production Build**:
   ```bash
   npm run build
   ```

7. **Start Production Server**:
   ```bash
   npm run start
   ```

---

## 🌐 Vercel Deployment Guide

1. **Push your code to GitHub / GitLab / Bitbucket**:
   Ensure all changes are committed and `.env.local` is ignored:
   ```bash
   git status
   git push origin main
   ```

2. **MongoDB Atlas Network Access**:
   - In MongoDB Atlas, navigate to **Network Access** under Security.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) or configure VPC peering so serverless Vercel function instances can connect to the database.

3. **Import to Vercel**:
   - Log in to your [Vercel Dashboard](https://vercel.com).
   - Click **Add New...** → **Project** and import your Git repository.
   - Keep Framework Preset as **Next.js**.

4. **Set Production Environment Variables**:
   Under **Environment Variables**, configure:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`

5. **Deploy**:
   - Click **Deploy**. Vercel will run `npm run build` and deploy all static assets and serverless functions.
   - Log in with your admin credentials at `https://<your-project>.vercel.app/login`.
