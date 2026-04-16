const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'school_attendance_secret_key_2025';

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Please login.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Session expired. Please login again.' });
  }
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to require teacher role
const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Teacher access required' });
  }
  next();
};

const isValidAttendanceStatus = (status) => status === 'present' || status === 'absent';
const isValidDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const ATTENDANCE_TIMEZONE = process.env.ATTENDANCE_TIMEZONE || 'Asia/Kolkata';
const getTodayDateString = () => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ATTENDANCE_TIMEZONE }).format(new Date());
};

// ============== PAGE ROUTES ==============

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.get('/teacher-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teacher-dashboard.html'));
});

app.get('/student-dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student-dashboard.html'));
});

// ============== AUTH ROUTES ==============

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password, email, role } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'teacher' ? 'teacher' : 'student';
    
    const result = await pool.query(
      'INSERT INTO users (username, password, email, role, is_approved) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role',
      [username, hashedPassword, email, userRole, true] // Auto-approve for demo
    );
    
    res.json({ 
      message: 'Registration successful! Redirecting to login...',
      redirect: 'login.html',
      user: result.rows[0] 
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    if (err.code === 'ECONNREFUSED') {
      return res.status(500).json({ error: 'Database connection failed. Please check your PostgreSQL settings.' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    if (!user.is_approved) {
      return res.status(403).json({ error: 'Your account is pending approval.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Role-based redirects to specific dashboards
    let redirectUrl;
    if (user.role === 'admin') {
      redirectUrl = 'admin-dashboard.html';
    } else if (user.role === 'teacher') {
      redirectUrl = 'teacher-dashboard.html';
    } else if (user.role === 'student') {
      redirectUrl = 'student-dashboard.html';
    } else {
      redirectUrl = 'dashboard.html';
    }

    res.json({ 
      token, 
      user: { id: user.id, username: user.username, role: user.role, email: user.email },
      redirect: redirectUrl,
      message: 'Login successful!' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, is_approved FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get additional info based on role
    let additionalInfo = {};
    if (result.rows[0].role === 'student') {
      const studentInfo = await pool.query('SELECT * FROM students WHERE user_id = $1', [req.user.id]);
      if (studentInfo.rows.length > 0) {
        additionalInfo = studentInfo.rows[0];
      }
    } else if (result.rows[0].role === 'teacher') {
      const teacherInfo = await pool.query('SELECT * FROM teachers WHERE user_id = $1', [req.user.id]);
      if (teacherInfo.rows.length > 0) {
        additionalInfo = teacherInfo.rows[0];
      }
    }
    
    res.json({ ...result.rows[0], ...additionalInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ============== ACADEMIC CALENDAR ROUTES ==============

// Get academic calendar
app.get('/api/calendar', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.query;
    let query = 'SELECT * FROM academic_calendar';
    const params = [];
    
    if (year && month) {
      query += ' WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2';
      params.push(year, month);
    } else if (year) {
      query += ' WHERE EXTRACT(YEAR FROM date) = $1';
      params.push(year);
    }
    
    query += ' ORDER BY date ASC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get calendar events for a month
app.get('/api/calendar/month/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    const result = await pool.query(
      'SELECT * FROM academic_calendar WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2 ORDER BY date ASC',
      [year, month]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============== STUDENT ROUTES ==============

// Get all students
app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    const { class: classFilter } = req.query;
    let query = 'SELECT s.*, u.email FROM students s JOIN users u ON s.user_id = u.id';
    const params = [];
    
    if (classFilter) {
      query += ' WHERE s.class = $1';
      params.push(classFilter);
    }
    
    query += ' ORDER BY s.roll_no ASC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get students by class (for teachers)
app.get('/api/students/class/:class/:section', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { class: classNum, section } = req.params;
    const result = await pool.query(
      'SELECT s.*, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.class = $1 AND s.section = $2 ORDER BY s.roll_no ASC',
      [classNum, section]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============== ATTENDANCE ROUTES ==============

// Get attendance for a specific date
app.get('/api/attendance/date/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;

    if (!isValidDateString(date)) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
    }

    if (req.user.role === 'student') {
      const studentResult = await pool.query(
        'SELECT id FROM students WHERE user_id = $1',
        [req.user.id]
      );

      if (studentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Student record not found' });
      }

      const result = await pool.query(
        `SELECT sa.*, s.name, s.roll_no, s.class, s.section
         FROM student_attendance sa
         JOIN students s ON sa.student_id = s.id
         WHERE sa.date = $1 AND sa.student_id = $2
         ORDER BY s.roll_no ASC`,
        [date, studentResult.rows[0].id]
      );

      return res.json(result.rows);
    }

if (req.user.role === 'teacher') {
      const teacherResult = await pool.query(
        'SELECT * FROM teachers WHERE user_id = $1',
        [req.user.id]
      );

      if (teacherResult.rows.length === 0) {
        return res.status(404).json({ error: 'Teacher record not found' });
      }

      const teacher = teacherResult.rows[0];
      
      // Get total enrolled students count for the teacher's class
      let totalStudentsResult = await pool.query(
        'SELECT COUNT(*) as total FROM students WHERE class = $1 AND section = $2',
        [teacher.class_assigned, teacher.section_assigned]
      );
      
      // Fallback for older data
      if (parseInt(totalStudentsResult.rows[0].total) === 0) {
        totalStudentsResult = await pool.query(
          'SELECT COUNT(*) as total FROM students WHERE class = $1',
          [teacher.class_assigned]
        );
      }
      
      const totalEnrolledStudents = parseInt(totalStudentsResult.rows[0].total) || 0;
      
      let result = await pool.query(
        `SELECT sa.*, s.name, s.roll_no, s.class, s.section
         FROM student_attendance sa
         JOIN students s ON sa.student_id = s.id
         WHERE sa.date = $1 AND s.class = $2 AND s.section = $3
         ORDER BY s.roll_no ASC`,
        [date, teacher.class_assigned, teacher.section_assigned]
      );

      // Fallback for older data where section may not align.
      if (result.rows.length === 0) {
        result = await pool.query(
          `SELECT sa.*, s.name, s.roll_no, s.class, s.section
           FROM student_attendance sa
           JOIN students s ON sa.student_id = s.id
           WHERE sa.date = $1 AND s.class = $2
           ORDER BY s.roll_no ASC`,
          [date, teacher.class_assigned]
        );
      }

      return res.json({
        attendance: result.rows,
        totalEnrolledStudents: totalEnrolledStudents
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT sa.*, s.name, s.roll_no, s.class, s.section 
       FROM student_attendance sa 
       JOIN students s ON sa.student_id = s.id 
       WHERE sa.date = $1 
       ORDER BY s.roll_no ASC`,
      [date]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Mark attendance (teacher only)
app.post('/api/attendance/mark', authenticateToken, requireTeacher, async (req, res) => {
  const { student_id, date, status, teacher_id } = req.body;

  if (!student_id || !date || !status) {
    return res.status(400).json({ error: 'Student ID, date, and status are required' });
  }

  if (!isValidDateString(date)) {
    return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
  }

  if (!isValidAttendanceStatus(status)) {
    return res.status(400).json({ error: 'Status must be present or absent' });
  }

  const todayDate = getTodayDateString();
  if (date !== todayDate) {
    return res.status(400).json({ error: `Attendance can only be marked for today (${todayDate})` });
  }

  try {
    // Check if attendance already exists
    const existing = await pool.query(
      'SELECT * FROM student_attendance WHERE student_id = $1 AND date = $2',
      [student_id, date]
    );

    if (existing.rows.length > 0) {
      // Update existing record
      const result = await pool.query(
        'UPDATE student_attendance SET status = $1, teacher_id = $2 WHERE student_id = $3 AND date = $4 RETURNING *',
        [status, teacher_id, student_id, date]
      );
      res.json({ message: 'Attendance updated', data: result.rows[0] });
    } else {
      // Insert new record
      const result = await pool.query(
        'INSERT INTO student_attendance (student_id, date, status, teacher_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [student_id, date, status, teacher_id]
      );
      res.json({ message: 'Attendance marked', data: result.rows[0] });
    }
    } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Toggle single student attendance (for quick correction)
app.patch('/api/attendance/toggle', authenticateToken, requireTeacher, async (req, res) => {
  const { student_id, date, new_status } = req.body;

  if (!student_id || !date || !new_status) {
    return res.status(400).json({ error: 'Student ID, date, and status are required' });
  }

  if (!isValidDateString(date)) {
    return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
  }

  if (!isValidAttendanceStatus(new_status)) {
    return res.status(400).json({ error: 'Status must be present or absent' });
  }

  try {
    const teacherResult = await pool.query(
      'SELECT * FROM teachers WHERE user_id = $1',
      [req.user.id]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher record not found' });
    }

    const teacher_id = teacherResult.rows[0].id;

    // Check if attendance record exists
    const existing = await pool.query(
      'SELECT * FROM student_attendance WHERE student_id = $1 AND date = $2',
      [student_id, date]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing record
      result = await pool.query(
        'UPDATE student_attendance SET status = $1, teacher_id = $2 WHERE student_id = $3 AND date = $4 RETURNING *',
        [new_status, teacher_id, student_id, date]
      );
    } else {
      // Create new record
      result = await pool.query(
        'INSERT INTO student_attendance (student_id, date, status, teacher_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [student_id, date, new_status, teacher_id]
      );
    }

    // Get updated counts for percentage calculation
    let totalStudentsResult = await pool.query(
      'SELECT COUNT(*) as total FROM students WHERE class = $1 AND section = $2',
      [teacherResult.rows[0].class_assigned, teacherResult.rows[0].section_assigned]
    );
    
    // Fallback for older data
    if (parseInt(totalStudentsResult.rows[0].total) === 0) {
      totalStudentsResult = await pool.query(
        'SELECT COUNT(*) as total FROM students WHERE class = $1',
        [teacherResult.rows[0].class_assigned]
      );
    }
    
    const totalEnrolled = parseInt(totalStudentsResult.rows[0].total) || 0;
    
    let allAttendanceForDate = await pool.query(
      'SELECT status FROM student_attendance sa JOIN students s ON sa.student_id = s.id WHERE sa.date = $1 AND s.class = $2 AND s.section = $3',
      [date, teacherResult.rows[0].class_assigned, teacherResult.rows[0].section_assigned]
    );
    
    // Fallback for older data
    if (allAttendanceForDate.rows.length === 0) {
      allAttendanceForDate = await pool.query(
        'SELECT status FROM student_attendance sa JOIN students s ON sa.student_id = s.id WHERE sa.date = $1 AND s.class = $2',
        [date, teacherResult.rows[0].class_assigned]
      );
    }
    
    const presentCount = allAttendanceForDate.rows.filter(r => r.status === 'present').length;
    const percentage = totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

    res.json({ 
      message: 'Attendance updated', 
      data: result.rows[0],
      stats: {
        presentCount,
        totalEnrolled,
        percentage
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Bulk mark attendance
app.post('/api/attendance/bulk-mark', authenticateToken, requireTeacher, async (req, res) => {
  const { attendanceData, date, teacher_id } = req.body;

  if (!Array.isArray(attendanceData) || attendanceData.length === 0 || !date) {
    return res.status(400).json({ error: 'Attendance data and date are required' });
  }

  if (!isValidDateString(date)) {
    return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
  }

  const todayDate = getTodayDateString();
  if (date !== todayDate) {
    return res.status(400).json({ error: `Attendance can only be marked for today (${todayDate})` });
  }

  const normalizedData = attendanceData.map(item => ({
    student_id: Number(item.student_id),
    status: item.status
  }));

  const hasInvalidItem = normalizedData.some(item => (
    !Number.isInteger(item.student_id) ||
    item.student_id <= 0 ||
    !isValidAttendanceStatus(item.status)
  ));

  if (hasInvalidItem) {
    return res.status(400).json({ error: 'Each attendance item must include a valid student_id and status (present/absent)' });
  }

  let resolvedTeacherId = teacher_id || null;

  if (req.user.role === 'teacher') {
    const teacherResult = await pool.query(
      'SELECT * FROM teachers WHERE user_id = $1',
      [req.user.id]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher record not found' });
    }

    const teacher = teacherResult.rows[0];
    resolvedTeacherId = teacher.id;

    let students = await pool.query(
      'SELECT id FROM students WHERE class = $1 AND section = $2 ORDER BY roll_no ASC',
      [teacher.class_assigned, teacher.section_assigned]
    );

    // Fallback for older or inconsistent records where section may not align.
    if (students.rows.length === 0) {
      students = await pool.query(
        'SELECT id FROM students WHERE class = $1 ORDER BY roll_no ASC',
        [teacher.class_assigned]
      );
    }

    const assignedStudentIds = students.rows.map(row => Number(row.id));
    const assignedSet = new Set(assignedStudentIds);
    const submittedIds = normalizedData.map(item => item.student_id);
    const submittedSet = new Set(submittedIds);

    const hasDuplicates = submittedSet.size !== submittedIds.length;
    const hasUnexpected = submittedIds.some(id => !assignedSet.has(id));
    const hasMissing = assignedStudentIds.some(id => !submittedSet.has(id));

    if (hasDuplicates || hasUnexpected || hasMissing) {
      return res.status(400).json({ error: 'Please mark attendance for all students in your assigned class before submitting' });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const results = [];
    for (const item of normalizedData) {
      const existing = await client.query(
        'SELECT * FROM student_attendance WHERE student_id = $1 AND date = $2',
        [item.student_id, date]
      );

      if (existing.rows.length > 0) {
        await client.query(
          'UPDATE student_attendance SET status = $1, teacher_id = $2 WHERE student_id = $3 AND date = $4',
          [item.status, resolvedTeacherId, item.student_id, date]
        );
      } else {
        await client.query(
          'INSERT INTO student_attendance (student_id, date, status, teacher_id) VALUES ($1, $2, $3, $4)',
          [item.student_id, date, item.status, resolvedTeacherId]
        );
      }
      results.push(item);
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Attendance marked successfully', count: results.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

// ============== ATTENDANCE STATISTICS ROUTES ==============

// Get student statistics (for both students and teachers)
app.get('/api/stats/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const studentId = Number(req.params.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({ error: 'Invalid student id' });
    }

    if (req.user.role === 'student') {
      const ownStudentResult = await pool.query(
        'SELECT id FROM students WHERE user_id = $1',
        [req.user.id]
      );

      if (ownStudentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Student record not found' });
      }

      if (Number(ownStudentResult.rows[0].id) !== studentId) {
        return res.status(403).json({ error: 'Students can only view their own attendance' });
      }
    } else if (req.user.role === 'teacher') {
      const teacherResult = await pool.query(
        'SELECT class_assigned, section_assigned FROM teachers WHERE user_id = $1',
        [req.user.id]
      );

      if (teacherResult.rows.length === 0) {
        return res.status(404).json({ error: 'Teacher record not found' });
      }

      const teacher = teacherResult.rows[0];
      let allowedStudents = await pool.query(
        'SELECT id FROM students WHERE class = $1 AND section = $2',
        [teacher.class_assigned, teacher.section_assigned]
      );

      // Fallback for older records where section values may be inconsistent.
      if (allowedStudents.rows.length === 0) {
        allowedStudents = await pool.query(
          'SELECT id FROM students WHERE class = $1',
          [teacher.class_assigned]
        );
      }

      const allowedStudentIds = new Set(allowedStudents.rows.map(row => Number(row.id)));
      if (!allowedStudentIds.has(studentId)) {
        return res.status(403).json({ error: 'You can only view attendance for your assigned students' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get student info
    const studentResult = await pool.query(
      'SELECT s.*, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = $1',
      [studentId]
    );
    
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const student = studentResult.rows[0];
    
    // Get attendance statistics
    const totalDays = await pool.query(
      `SELECT COUNT(*) as total FROM student_attendance WHERE student_id = $1`,
      [studentId]
    );
    
    const presentDays = await pool.query(
      `SELECT COUNT(*) as present FROM student_attendance WHERE student_id = $1 AND status = 'present'`,
      [studentId]
    );
    
    const absentDays = await pool.query(
      `SELECT COUNT(*) as absent FROM student_attendance WHERE student_id = $1 AND status = 'absent'`,
      [studentId]
    );
    
    // Get attendance history
    const history = await pool.query(
      `SELECT * FROM student_attendance WHERE student_id = $1 ORDER BY date DESC LIMIT 30`,
      [studentId]
    );
    
    // Get working days count from calendar
    const workingDays = await pool.query(
      `SELECT COUNT(*) as working_days FROM academic_calendar WHERE event_type = 'working_day'`
    );
    
    res.json({
      student: student,
      statistics: {
        total_marked: parseInt(totalDays.rows[0].total),
        present: parseInt(presentDays.rows[0].present),
        absent: parseInt(absentDays.rows[0].absent),
        percentage: totalDays.rows[0].total > 0 
          ? Math.round((presentDays.rows[0].present / totalDays.rows[0].total) * 100) 
          : 0,
        working_days: parseInt(workingDays.rows[0].working_days)
      },
      history: history.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get my statistics (for logged in student)
app.get('/api/stats/me', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const studentResult = await pool.query(
        'SELECT * FROM students WHERE user_id = $1',
        [req.user.id]
      );
      
      if (studentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Student record not found' });
      }
      
      const studentId = studentResult.rows[0].id;
      
      // Get attendance statistics
      const totalDays = await pool.query(
        `SELECT COUNT(*) as total FROM student_attendance WHERE student_id = $1`,
        [studentId]
      );
      
      const presentDays = await pool.query(
        `SELECT COUNT(*) as present FROM student_attendance WHERE student_id = $1 AND status = 'present'`,
        [studentId]
      );
      
      const absentDays = await pool.query(
        `SELECT COUNT(*) as absent FROM student_attendance WHERE student_id = $1 AND status = 'absent'`,
        [studentId]
      );
      
      const history = await pool.query(
        `SELECT * FROM student_attendance WHERE student_id = $1 ORDER BY date DESC LIMIT 30`,
        [studentId]
      );
      
      res.json({
        student: studentResult.rows[0],
        statistics: {
          total_marked: parseInt(totalDays.rows[0].total),
          present: parseInt(presentDays.rows[0].present),
          absent: parseInt(absentDays.rows[0].absent),
          percentage: totalDays.rows[0].total > 0 
            ? Math.round((presentDays.rows[0].present / totalDays.rows[0].total) * 100) 
            : 0
        },
        history: history.rows
      });
    } else if (req.user.role === 'teacher' || req.user.role === 'admin') {
      // For teachers, get all students they teach
      const teacherResult = await pool.query(
        'SELECT * FROM teachers WHERE user_id = $1',
        [req.user.id]
      );
      
      let students = [];
      if (teacherResult.rows.length > 0) {
        const teacher = teacherResult.rows[0];
        students = await pool.query(
          'SELECT s.*, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.class = $1 AND s.section = $2 ORDER BY s.roll_no ASC',
          [teacher.class_assigned, teacher.section_assigned]
        );

        // Fallback for older or inconsistent records where section may not align.
        if (students.rows.length === 0) {
          students = await pool.query(
            'SELECT s.*, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.class = $1 ORDER BY s.roll_no ASC',
            [teacher.class_assigned]
          );
        }
      } else {
        students = await pool.query(
          'SELECT s.*, u.email FROM students s JOIN users u ON s.user_id = u.id ORDER BY s.class, s.roll_no ASC'
        );
      }
      
      res.json({
        is_teacher: true,
        students: students.rows
      });
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const totalStudents = await pool.query('SELECT COUNT(*) FROM students');
    const totalTeachers = await pool.query('SELECT COUNT(*) FROM teachers');
    const today = getTodayDateString();
    
    const todayAttendance = await pool.query(
      `SELECT COUNT(*) as marked FROM student_attendance WHERE date = $1`,
      [today]
    );
    
    const presentToday = await pool.query(
      `SELECT COUNT(*) as present FROM student_attendance WHERE date = $1 AND status = 'present'`,
      [today]
    );

    const totalWorkingDays = await pool.query(
      `SELECT COUNT(*) as total FROM academic_calendar WHERE event_type = 'working_day'`
    );
    
    res.json({
      totalStudents: parseInt(totalStudents.rows[0].count),
      totalTeachers: parseInt(totalTeachers.rows[0].count),
      todayAttendance: parseInt(todayAttendance.rows[0].marked),
      presentToday: parseInt(presentToday.rows[0].present),
      totalWorkingDays: parseInt(totalWorkingDays.rows[0].total)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============== TEACHER ROUTES ==============

// Get teacher info
app.get('/api/teacher/me', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM teachers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher record not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get students assigned to teacher
app.get('/api/teacher/students', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const teacherResult = await pool.query(
      'SELECT * FROM teachers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher record not found' });
    }
    
    const teacher = teacherResult.rows[0];
    
    let students = await pool.query(
      'SELECT s.*, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.class = $1 AND s.section = $2 ORDER BY s.roll_no ASC',
      [teacher.class_assigned, teacher.section_assigned]
    );

    // Fallback for older or inconsistent records where section may not align.
    if (students.rows.length === 0) {
      students = await pool.query(
        'SELECT s.*, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.class = $1 ORDER BY s.roll_no ASC',
        [teacher.class_assigned]
      );
    }
    
    res.json({
      teacher: teacher,
      students: students.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============== ADMIN ROUTES ==============

// Create a student user and student profile
app.post('/api/admin/students', authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, email, name, roll_no, class: className, section } = req.body;

  if (!username || !password || !email || !name || !roll_no || !className) {
    return res.status(400).json({ error: 'Username, password, email, name, roll number, and class are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (username, password, email, role, is_approved)
       VALUES ($1, $2, $3, 'student', true)
       RETURNING id, username, email, role`,
      [username, hashedPassword, email]
    );

    const studentResult = await client.query(
      `INSERT INTO students (user_id, roll_no, name, class, section)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userResult.rows[0].id, roll_no, name, className, section || 'A']
    );

    await client.query('COMMIT');

    res.json({
      message: 'Student added successfully',
      user: userResult.rows[0],
      student: studentResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create student error:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username, email, or roll number already exists' });
    }
    res.status(500).json({ error: 'Failed to add student' });
  } finally {
    client.release();
  }
});

// Create a teacher user and teacher profile
app.post('/api/admin/teachers', authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, email, name, subject, class_assigned, section_assigned } = req.body;

  if (!username || !password || !email || !name || !class_assigned) {
    return res.status(400).json({ error: 'Username, password, email, name, and assigned class are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (username, password, email, role, is_approved)
       VALUES ($1, $2, $3, 'teacher', true)
       RETURNING id, username, email, role`,
      [username, hashedPassword, email]
    );

    const teacherResult = await client.query(
      `INSERT INTO teachers (user_id, name, subject, class_assigned, section_assigned)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userResult.rows[0].id, name, subject || '', class_assigned, section_assigned || 'A']
    );

    await client.query('COMMIT');

    res.json({
      message: 'Teacher added successfully',
      user: userResult.rows[0],
      teacher: teacherResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create teacher error:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Failed to add teacher' });
  } finally {
    client.release();
  }
});

// Delete a non-admin user and any linked student/teacher record
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const userResult = await pool.query(
      'SELECT id, role, username FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Admin user cannot be deleted' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: `${user.role} deleted successfully` });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, is_approved, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Attendance Management System running on http://localhost:${PORT}`);
    console.log(`Admin credentials: admin / admin123`);
  });
});
