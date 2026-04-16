const { Pool } = require('pg');

async function setupDatabase() {
  // First connect to default postgres database to create our database
  const adminPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'gayathri',
    port: 5432,
  });

  try {
    // Create database if not exists
    const result = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'attendance_db'"
    );
    
    if (result.rows.length === 0) {
      await adminPool.query('CREATE DATABASE attendance_db');
      console.log('✓ Database attendance_db created successfully');
    } else {
      console.log('✓ Database attendance_db already exists');
    }
    
    await adminPool.end();
    
    // Now connect to our database and create tables
    const appPool = new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'attendance_db',
      password: 'gayathri',
      port: 5432,
    });

    // Create tables
    console.log('Creating tables...');
    
    await appPool.query(`
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
    console.log('✓ Users table created');

    await appPool.query(`
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
    console.log('✓ Students table created');

    await appPool.query(`
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
    console.log('✓ Teachers table created');

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS academic_calendar (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        event_name VARCHAR(200) NOT NULL,
        event_type VARCHAR(50) DEFAULT 'working_day',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Academic calendar table created');

    await appPool.query(`
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
    console.log('✓ Student attendance table created');

    await appPool.query(`
      ALTER TABLE student_attendance
      ALTER COLUMN status DROP DEFAULT
    `);
    await appPool.query(`
      ALTER TABLE student_attendance
      ALTER COLUMN status SET NOT NULL
    `);
    await appPool.query(`
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

    // Create admin user
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminExists = await appPool.query("SELECT id FROM users WHERE username = 'admin'");
    if (adminExists.rows.length === 0) {
      await appPool.query(
        "INSERT INTO users (username, password, email, role, is_approved) VALUES ($1, $2, $3, $4, $5)",
        ['admin', hashedPassword, 'admin@school.com', 'admin', true]
      );
      console.log('✓ Admin user created (admin/admin123)');
    }

    // Create sample students
    const studentsExist = await appPool.query("SELECT id FROM students LIMIT 1");
    if (studentsExist.rows.length === 0) {
      const students = [
        { roll_no: 1, name: 'Gayathri', class: '10' },
        { roll_no: 2, name: 'Sandhya', class: '10' },
        { roll_no: 3, name: 'Kalpana', class: '10' },
        { roll_no: 4, name: 'Sai', class: '10' },
        { roll_no: 5, name: 'Joycy', class: '10' },
      ];

      for (const student of students) {
        const studentPassword = await bcrypt.hash('student123', 10);
        const userResult = await appPool.query(
          "INSERT INTO users (username, password, email, role, is_approved) VALUES ($1, $2, $3, 'student', true) RETURNING id",
          [`student${student.roll_no}`, studentPassword, `${student.name.toLowerCase()}@school.com`]
        );
        
        await appPool.query(
          'INSERT INTO students (user_id, roll_no, name, class) VALUES ($1, $2, $3, $4)',
          [userResult.rows[0].id, student.roll_no, student.name, student.class]
        );
      }
      console.log('✓ Sample students created (Gayathri, Sandhya, Kalpana, Sai, Joycy)');
    }

    // Create sample teacher
    const teacherExists = await appPool.query("SELECT id FROM teachers LIMIT 1");
    if (teacherExists.rows.length === 0) {
      const teacherPassword = await bcrypt.hash('teacher123', 10);
      const teacherUserResult = await appPool.query(
        "INSERT INTO users (username, password, email, role, is_approved) VALUES ($1, $2, $3, 'teacher', true) RETURNING id",
        ['teacher1', teacherPassword, 'teacher@school.com']
      );
      
      await appPool.query(
        'INSERT INTO teachers (user_id, name, subject, class_assigned) VALUES ($1, $2, $3, $4)',
        [teacherUserResult.rows[0].id, 'Ms. Radha', 'Mathematics', '10']
      );
      console.log('✓ Sample teacher created (teacher1/teacher123)');
    }

    // Seed academic calendar
    const calendarExists = await appPool.query("SELECT id FROM academic_calendar LIMIT 1");
    if (calendarExists.rows.length === 0) {
      const holidays = [
        { date: '2025-06-01', event: 'School Reopening', type: 'working_day' },
        { date: '2025-06-10', event: 'Ramzan Holiday', type: 'holiday' },
        { date: '2025-08-15', event: 'Independence Day', type: 'holiday' },
        { date: '2025-10-02', event: 'Gandhi Jayanti', type: 'holiday' },
        { date: '2025-10-31', event: 'Diwali Vacation Start', type: 'holiday' },
        { date: '2025-11-01', event: 'Diwali Holiday', type: 'holiday' },
        { date: '2025-11-02', event: 'Diwali Holiday', type: 'holiday' },
        { date: '2025-11-03', event: 'Diwali Holiday', type: 'holiday' },
        { date: '2025-11-04', event: 'Diwali Holiday', type: 'holiday' },
        { date: '2025-11-05', event: 'Diwali Holiday', type: 'holiday' },
        { date: '2025-12-25', event: 'Christmas', type: 'holiday' },
        { date: '2026-01-01', event: 'New Year', type: 'holiday' },
        { date: '2026-01-14', event: 'Pongal', type: 'holiday' },
        { date: '2026-01-15', event: 'Pongal Holiday', type: 'holiday' },
        { date: '2026-01-26', event: 'Republic Day', type: 'holiday' },
        { date: '2026-04-10', event: 'Good Friday', type: 'holiday' },
        { date: '2026-04-14', event: 'Tamil New Year', type: 'holiday' },
        { date: '2026-05-01', event: 'May Day', type: 'holiday' },
      ];

      for (const h of holidays) {
        await appPool.query(
          'INSERT INTO academic_calendar (date, event_name, event_type) VALUES ($1, $2, $3) ON CONFLICT (date) DO NOTHING',
          [h.date, h.event, h.type]
        );
      }
      console.log('✓ Academic calendar seeded');
    }

    await appPool.end();
    console.log('\n✅ Database setup completed successfully!');
    console.log('\nDemo Credentials:');
    console.log('  Admin:   admin / admin123');
    console.log('  Teacher:  teacher1 / teacher123');
    console.log('  Student:  student1 / student123');

  } catch (err) {
    console.error('Error setting up database:', err.message);
    process.exit(1);
  }
}

setupDatabase();
