# 🍾 BSH Inventory - "I'm Helping!"

A Ralph Wiggum-themed inventory management system for Bradshaw Social House.

## Features

- 🔐 **Role-based access**: Admin, Manager, Staff roles with different permissions
- 📊 **Real-time inventory tracking**: Par levels, current counts, status indicators
- 📤 **CSV bulk upload**: Import inventory from spreadsheets
- 🔔 **Low stock alerts**: Browser notifications when items need restocking
- 📱 **Mobile responsive**: Works on phones and tablets
- 🎨 **Ralph Wiggum style**: Because "Me fail inventory? That's unpossible!"

## Tech Stack

- **Next.js 14** - React framework
- **Supabase** - Database, Auth, Real-time
- **Tailwind CSS** - Styling
- **Vercel** - Hosting

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Copy your project URL and anon key from Settings > API

### 2. Configure Environment

Create a `.env.local` file:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

### 3. Install & Run

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### 4. Create First Admin User

1. Sign up with your email
2. In Supabase Dashboard > Table Editor > profiles
3. Change your role from 'staff' to 'admin'

## User Roles

| Role | View | Add Items | Edit Counts | Delete |
|------|------|-----------|-------------|--------|
| Staff | ✅ | ❌ | ✅ | ❌ |
| Manager | ✅ | ✅ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ |

## CSV Format

\`\`\`
Code, Name, Category, Par Level, Cost, Unit Type
TITO-750, Tito's Vodka 750ml, liquor, 6, 19.99, bottle
BUD-CASE, Budweiser 24pk, beer, 10, 22.99, case
\`\`\`

---

*"The doctor said I wouldn't have so many inventory errors if I kept my finger outta there!"* - Ralph Wiggum
