# SlidesMakerIARE

A full-stack presentation-maker starter inspired by the modern visual style of the reference site, with original branding and implementation.

## Stack
- React + Vite
- Node.js + Express
- MySQL
- JWT authentication
- bcrypt password hashing

## Requirements
- Node.js 18+
- MySQL 8+

## 1. Database

Create the database using:

```sql
SOURCE database/schema.sql;
```

Or paste `database/schema.sql` into MySQL Workbench.

## 2. Backend

```bash
cd backend
npm install
```

Edit `.env` and set your MySQL password.

```bash
npm run dev
```

Backend: http://localhost:5000

## 3. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Features
- Landing page
- Login
- Sign up
- JWT authentication
- Protected dashboard
- Presentation cards
- New presentation flow
- Basic slide editor
- Add/delete slides
- Editable title and text
- Save presentation state locally
- Responsive UI

This is an original implementation; replace branding/assets as needed for your own project.
