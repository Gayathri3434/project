const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'attendance_db',
  password: 'gayathri',
  port: 5432,
});

const initDatabase = async () => {
  const client = await pool.connect();
  try {
    // Users table with roles (admin, teacher, student)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(20) DEFAULT 'student',
        is_approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Students table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        roll_no INTEGER UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        class VARCHAR(20) NOT NULL,
        section VARCHAR(10) DEFAULT 'A',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Teachers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        subject VARCHAR(50),
        class_assigned VARCHAR(20) NOT NULL,
        section_assigned VARCHAR(10) DEFAULT 'A',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Academic Calendar table
    await client.query(`
      CREATE TABLE IF NOT EXISTS academic_calendar (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        event_name VARCHAR(200) NOT NULL,
        event_type VARCHAR(50) DEFAULT 'working_day',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Student Attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_attendance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, date)
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON student_attendance(date)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_student_attendance_student ON student_attendance(student_id)
    `);
    await client.query(`
      ALTER TABLE student_attendance
      ALTER COLUMN status DROP DEFAULT
    `);
    await client.query(`
      ALTER TABLE student_attendance
      ALTER COLUMN status SET NOT NULL
    `);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'student_attendance_status_check'
        ) THEN
          ALTER TABLE student_attendance
          ADD CONSTRAINT student_attendance_status_check
          CHECK (status IN ('present', 'absent')) NOT VALID;
        END IF;
      END
      $$;
    `);

    // Create admin user if not exists
    const adminExists = await client.query("SELECT id FROM users WHERE role = 'admin'");
    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        "INSERT INTO users (username, password, email, role, is_approved) VALUES ($1, $2, $3, $4, $5)",
        ['admin', hashedPassword, 'admin@school.com', 'admin', true]
      );
      console.log('Default admin created: admin / admin123');
    }

    // Seed academic calendar for 2025-2026 if empty
    const calendarExists = await client.query("SELECT id FROM academic_calendar LIMIT 1");
    if (calendarExists.rows.length === 0) {
      await seedAcademicCalendar(client);
    }

    // Seed sample students if none exist
    const studentsExist = await client.query("SELECT id FROM students LIMIT 1");
    if (studentsExist.rows.length === 0) {
      await seedStudents(client);
    }

    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
};

// Seed academic calendar for 2025-2026
async function seedAcademicCalendar(client) {
  const holidays2025_2026 = [
    // June 2025
    { date: '2025-06-01', event: 'School Reopening', type: 'working_day' },
    { date: '2025-06-10', event: 'Ramzan Holiday', type: 'holiday' },
    { date: '2025-06-15', event: 'Bakrid', type: 'holiday' },
    { date: '2025-06-17', event: 'Bakrid Holiday', type: 'holiday' },
    
    // July 2025
    { date: '2025-07-05', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-07-12', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-07-19', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-07-26', event: 'Saturday Holiday', type: 'holiday' },
    
    // August 2025
    { date: '2025-08-01', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-08-08', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-08-15', event: 'Independence Day', type: 'holiday' },
    { date: '2025-08-16', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-08-23', event: 'Saturday Holiday', type: 'holiday' },
    
    // September 2025
    { date: '2025-09-01', event: 'School Closed for Maintenance', type: 'holiday' },
    { date: '2025-09-05', event: "Teacher's Day", type: 'working_day' },
    { date: '2025-09-07', event: 'Ganesh Chaturthi', type: 'holiday' },
    { date: '2025-09-08', event: 'Ganesh Chaturthi Holiday', type: 'holiday' },
    { date: '2025-09-13', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-09-20', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-09-27', event: 'Saturday Holiday', type: 'holiday' },
    
    // October 2025
    { date: '2025-10-02', event: 'Gandhi Jayanti', type: 'holiday' },
    { date: '2025-10-04', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-10-11', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-10-18', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-10-25', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-10-31', event: 'Diwali Vacation Start', type: 'holiday' },
    
    // November 2025
    { date: '2025-11-01', event: 'Diwali Holiday', type: 'holiday' },
    { date: '2025-11-02', event: 'Diwali Holiday', type: 'holiday' },
    { date: '2025-11-03', event: 'Diwali Holiday', type: 'holiday' },
    { date: '2025-11-04', event: 'Diwali Holiday', type: 'holiday' },
    { date: '2025-11-05', event: 'Diwali Holiday', type: 'holiday' },
    { date: '2025-11-08', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-11-15', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-11-22', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-11-29', event: 'Saturday Holiday', type: 'holiday' },
    
    // December 2025
    { date: '2025-12-06', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-12-13', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-12-20', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2025-12-25', event: 'Christmas', type: 'holiday' },
    { date: '2025-12-27', event: 'Saturday Holiday', type: 'holiday' },
    
    // January 2026
    { date: '2026-01-01', event: 'New Year', type: 'holiday' },
    { date: '2026-01-03', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-01-10', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-01-14', event: 'Pongal', type: 'holiday' },
    { date: '2026-01-15', event: 'Pongal Holiday', type: 'holiday' },
    { date: '2026-01-17', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-01-24', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-01-26', event: 'Republic Day', type: 'holiday' },
    { date: '2026-01-31', event: 'Saturday Holiday', type: 'holiday' },
    
    // February 2026
    { date: '2026-02-07', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-02-14', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-02-21', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-02-26', event: 'Annual Day', type: 'working_day' },
    { date: '2026-02-28', event: 'Saturday Holiday', type: 'holiday' },
    
    // March 2026
    { date: '2026-03-07', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-03-14', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-03-21', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-03-28', event: 'Saturday Holiday', type: 'holiday' },
    
    // April 2026
    { date: '2026-04-01', event: 'April Fool\'s Day', type: 'working_day' },
    { date: '2026-04-04', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-04-10', event: 'Good Friday', type: 'holiday' },
    { date: '2026-04-11', event: 'Good Friday Holiday', type: 'holiday' },
    { date: '2026-04-14', event: 'Tamil New Year', type: 'holiday' },
    { date: '2026-04-18', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-04-25', event: 'Saturday Holiday', type: 'holiday' },
    
    // May 2026
    { date: '2026-05-01', event: 'May Day', type: 'holiday' },
    { date: '2026-05-02', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-05-09', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-05-16', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-05-23', event: 'Saturday Holiday', type: 'holiday' },
    { date: '2026-05-30', event: 'Saturday Holiday', type: 'holiday' },
  ];

  for (const holiday of holidays2025_2026) {
    await client.query(
      'INSERT INTO academic_calendar (date, event_name, event_type) VALUES ($1, $2, $3) ON CONFLICT (date) DO NOTHING',
      [holiday.date, holiday.event, holiday.type]
    );
  }
  console.log('Academic calendar seeded successfully');
}

// Seed sample students
async function seedStudents(client) {
  const bcrypt = require('bcrypt');
  
  const students = [
    { roll_no: 1, name: 'Gayathri', class: '10' },
    { roll_no: 2, name: 'Sandhya', class: '10' },
    { roll_no: 3, name: 'Kalpana', class: '10' },
    { roll_no: 4, name: 'Sai', class: '10' },
    { roll_no: 5, name: 'Joycy', class: '10' },
  ];

  for (const student of students) {
    // Create user for student
    const hashedPassword = await bcrypt.hash('student123', 10);
    const userResult = await client.query(
      "INSERT INTO users (username, password, email, role, is_approved) VALUES ($1, $2, $3, 'student', true) RETURNING id",
      [`student${student.roll_no}`, hashedPassword, `${student.name.toLowerCase()}@school.com`]
    );
    
    // Create student record
    await client.query(
      'INSERT INTO students (user_id, roll_no, name, class) VALUES ($1, $2, $3, $4)',
      [userResult.rows[0].id, student.roll_no, student.name, student.class]
    );
  }
  
  // Create a sample teacher
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacherUserResult = await client.query(
    "INSERT INTO users (username, password, email, role, is_approved) VALUES ($1, $2, $3, 'teacher', true) RETURNING id",
    ['teacher1', teacherPassword, 'teacher@school.com']
  );
  
  await client.query(
    'INSERT INTO teachers (user_id, name, subject, class_assigned) VALUES ($1, $2, $3, $4)',
    [teacherUserResult.rows[0].id, 'Ms. Radha', 'Mathematics', '10']
  );
  
  console.log('Sample students and teacher created');
}

module.exports = { pool, initDatabase };
