# School Attendance Management System

A complete school attendance management system built with Node.js, PostgreSQL, and vanilla HTML/CSS/JavaScript frontend.

## Features

### 🔐 Authentication System
- User registration (Student/Teacher roles)
- Secure login with JWT tokens
- Auto-logout when browser is closed
- Role-based access control

### 📅 Academic Calendar
- 2025-2026 calendar with working days and holidays
- Holidays marked with special red color
- Interactive month navigation
- Events list with date details

### ✅ Mark Attendance (Teachers Only)
- Mini calendar for date selection
- Student list with roll numbers (Gayathri, Sandhya, Kalpana, Sai, Joycy)
- Present/Absent toggle buttons for each student
- Bulk mark all present/absent
- Submit attendance to database

### 📊 Attendance Statistics
- **For Teachers**: View all students' attendance details
- **For Students**: View personal attendance percentage, history
- Statistics include: Present days, Absent days, Percentage, Working days

## Tech Stack

- **Frontend**: HTML5, CSS3 (Advanced styling), Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens), bcrypt for password hashing

## Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

### Setup Steps

1. **Install PostgreSQL and create database:**
```sql
CREATE DATABASE attendance_db;
```

2. **Update database credentials in `db.js`:**
```javascript
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'attendance_db',
  password: 'your_password',  // Update this
  port: 5432,
});
```

3. **Install dependencies:**
```bash
npm install
```

4. **Start the server:**
```bash
npm start
```

5. **Open in browser:**
```
http://localhost:3000
```

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Teacher | teacher1 | teacher123 |
| Student | student1 | student123 |

## Default Student Data

The system comes pre-seeded with:
- Roll No 1: Gayathri
- Roll No 2: Sandhya
- Roll No 3: Kalpana
- Roll No 4: Sai
- Roll No 5: Joycy

## Project Structure

```
project/
├── db.js                 # Database configuration and schema
├── server.js             # Express server and API routes
├── package.json          # Node.js dependencies
├── public/
│   ├── index.html        # Landing page
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   ├── dashboard.html    # Main dashboard
│   └── styles.css        # All styling
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Academic Calendar
- `GET /api/calendar` - Get all calendar events
- `GET /api/calendar/month/:year/:month` - Get events for specific month

### Attendance
- `GET /api/attendance/date/:date` - Get attendance for a date
- `POST /api/attendance/mark` - Mark single student attendance
- `POST /api/attendance/bulk-mark` - Mark bulk attendance

### Statistics
- `GET /api/stats/me` - Get current user's stats
- `GET /api/stats/student/:id` - Get specific student's stats
- `GET /api/dashboard/stats` - Get dashboard statistics

### Teacher
- `GET /api/teacher/me` - Get teacher info
- `GET /api/teacher/students` - Get assigned students

## User Flows

### Registration Flow
1. Visit landing page → Click Register
2. Fill registration form (select Student or Teacher)
3. Automatically redirected to login page
4. Login with new credentials

### Attendance Flow (Teacher)
1. Login as teacher
2. Click "Mark Attendance" feature
3. Select date from mini calendar
4. Mark Present/Absent for each student
5. Click Submit to save

### Statistics Flow
- **Teachers**: See all students, click any to view their detailed attendance
- **Students**: See own attendance percentage, present/absent days, history

### Auto-Logout
- Token is stored in localStorage
- When browser is closed, token is cleared
- On next visit, user must login again
