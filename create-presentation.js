const PptxGenJS = require("pptxgenjs");

let pres = new PptxGenJS();
pres.layout = "LAYOUT_16x9";
pres.title = "School Attendance Management System";
pres.author = "Gayathri";

let slide1 = pres.addSlide();
slide1.background = { color: "1F4E79" };
slide1.addText("School Attendance Management System", { 
  x: 0.5, y: 2.5, w: "90%", h: 1, 
  fontSize: 36, color: "FFFFFF", bold: true, align: "center" 
});
slide1.addText("A Complete Solution for Schools", { 
  x: 0.5, y: 3.7, w: "90%", h: 0.6, 
  fontSize: 18, color: "FFFFFF", align: "center" 
});
slide1.addText("Node.js • PostgreSQL • HTML/CSS/JavaScript", { 
  x: 0.5, y: 5, w: "90%", h: 0.5, 
  fontSize: 14, color: "B4C7E7", align: "center" 
});

let slide2 = pres.addSlide();
slide2.addText("Project Overview", { x: 0.5, y: 0.3, w: "90%", h: 0.8, fontSize: 28, bold: true, color: "1F4E79" });
slide2.addText("What is this project?", { x: 0.5, y: 1.3, w: "90%", h: 0.5, fontSize: 18, bold: true, color: "2E75B6" });
slide2.addText("A web-based attendance management system for schools that allows teachers to track student attendance and students to view their attendance records.", { 
  x: 0.5, y: 1.9, w: 9, h: 1.2, fontSize: 14, color: "444444" 
});
slide2.addText("Key Benefits", { x: 0.5, y: 3.3, w: "90%", h: 0.5, fontSize: 18, bold: true, color: "2E75B6" });
slide2.addText("• Automated attendance tracking\n• Real-time statistics\n• Role-based access control\n• Academic calendar integration", { 
  x: 0.5, y: 3.9, w: 9, h: 2, fontSize: 14, color: "444444" 
});

let slide3 = pres.addSlide();
slide3.addText("Features", { x: 0.5, y: 0.3, w: "90%", h: 0.8, fontSize: 28, bold: true, color: "1F4E79" });
slide3.addText("🔐 Authentication System", { x: 0.5, y: 1.2, w: 9, h: 0.4, fontSize: 16, bold: true, color: "2E75B6" });
slide3.addText("User registration with Student/Teacher roles • Secure JWT login • Auto-logout on browser close", { 
  x: 0.7, y: 1.6, w: 8.5, h: 0.4, fontSize: 12, color: "444444" 
});
slide3.addText("📅 Academic Calendar", { x: 0.5, y: 2.2, w: 9, h: 0.4, fontSize: 16, bold: true, color: "2E75B6" });
slide3.addText("2025-2026 calendar with holidays • Month navigation • Events list", { 
  x: 0.7, y: 2.6, w: 8.5, h: 0.4, fontSize: 12, color: "444444" 
});
slide3.addText("✅ Mark Attendance (Teachers)", { x: 0.5, y: 3.2, w: 9, h: 0.4, fontSize: 16, bold: true, color: "2E75B6" });
slide3.addText("Mini calendar for date selection • Present/Absent toggle • Bulk mark all", { 
  x: 0.7, y: 3.6, w: 8.5, h: 0.4, fontSize: 12, color: "444444" 
});
slide3.addText("📊 Attendance Statistics", { x: 0.5, y: 4.2, w: 9, h: 0.4, fontSize: 16, bold: true, color: "2E75B6" });
slide3.addText("Teacher: View all students' attendance • Student: View personal percentage & history", { 
  x: 0.7, y: 4.6, w: 8.5, h: 0.4, fontSize: 12, color: "444444" 
});

let slide4 = pres.addSlide();
slide4.addText("Technology Stack", { x: 0.5, y: 0.3, w: "90%", h: 0.8, fontSize: 28, bold: true, color: "1F4E79" });
slide4.addText("Frontend", { x: 0.5, y: 1.2, w: 3, h: 0.4, fontSize: 16, bold: true, color: "2E75B6" });
slide4.addText("• HTML5\n• CSS3 (Advanced styling)\n• Vanilla JavaScript", { 
  x: 0.5, y: 1.6, w: 3.5, h: 1.5, fontSize: 12, color: "444444" 
});
slide4.addText("Backend", { x: 4.2, y: 1.2, w: 3, h: 0.4, fontSize: 16, bold: true, color: "2E75B6" });
slide4.addText("• Node.js\n• Express.js\n�� RESTful APIs", { 
  x: 4.2, y: 1.6, w: 3.5, h: 1.5, fontSize: 12, color: "444444" 
});
slide4.addText("Database", { x: 0.5, y: 3.3, w: 3, h: 0.4, fontSize: 16, bold: true, color: "2E75B6" });
slide4.addText("• PostgreSQL\n• pg library\n• SQL queries", { 
  x: 0.5, y: 3.7, w: 3.5, h: 1.5, fontSize: 12, color: "444444" 
});
slide4.addText("Authentication", { x: 4.2, y: 3.3, w: 3, h: 0.4, fontSize: 16, bold: true, color: "2E75B6" });
slide4.addText("• JWT (JSON Web Tokens)\n• bcrypt for hashing\n• Role-based access", { 
  x: 4.2, y: 3.7, w: 3.5, h: 1.5, fontSize: 12, color: "444444" 
});

let slide5 = pres.addSlide();
slide5.addText("User Flows", { x: 0.5, y: 0.3, w: "90%", h: 0.8, fontSize: 28, bold: true, color: "1F4E79" });
slide5.addText("Registration Flow", { x: 0.5, y: 1.1, w: 4, h: 0.4, fontSize: 14, bold: true, color: "2E75B6" });
slide5.addText("1. Landing → Register\n2. Fill form (select role)\n3. Auto-redirect to login\n4. Login with new credentials", { 
  x: 0.5, y: 1.5, w: 4, h: 1.5, fontSize: 11, color: "444444" 
});
slide5.addText("Attendance Flow (Teacher)", { x: 5.2, y: 1.1, w: 4, h: 0.4, fontSize: 14, bold: true, color: "2E75B6" });
slide5.addText("1. Login as teacher\n2. Mark Attendance\n3. Select date\n4. Mark Present/Absent\n5. Submit", { 
  x: 5.2, y: 1.5, w: 4, h: 1.5, fontSize: 11, color: "444444" 
});
slide5.addText("Statistics Flow", { x: 0.5, y: 3.3, w: 4, h: 0.4, fontSize: 14, bold: true, color: "2E75B6" });
slide5.addText("Teachers: View all → Click student\nStudents: View own percentage, present/absent days", { 
  x: 0.5, y: 3.7, w: 4, h: 1, fontSize: 11, color: "444444" 
});
slide5.addText("Auto-Logout Feature", { x: 5.2, y: 3.3, w: 4, h: 0.4, fontSize: 14, bold: true, color: "2E75B6" });
slide5.addText("Token stored in localStorage\nCleared when browser closes\nForces re-login on next visit", { 
  x: 5.2, y: 3.7, w: 4, h: 1, fontSize: 11, color: "444444" 
});

let slide6 = pres.addSlide();
slide6.addText("API Endpoints", { x: 0.5, y: 0.3, w: "90%", h: 0.8, fontSize: 28, bold: true, color: "1F4E79" });
slide6.addText("Authentication", { x: 0.5, y: 1.1, w: 3, h: 0.35, fontSize: 13, bold: true, color: "2E75B6" });
slide6.addText("POST /api/auth/register\nPOST /api/auth/login\nGET /api/auth/me", { 
  x: 0.5, y: 1.5, w: 3, h: 1, fontSize: 10, color: "444444" 
});
slide6.addText("Calendar", { x: 3.8, y: 1.1, w: 3, h: 0.35, fontSize: 13, bold: true, color: "2E75B6" });
slide6.addText("GET /api/calendar\nGET /api/calendar/month/:year/:month", { 
  x: 3.8, y: 1.5, w: 3, h: 1, fontSize: 10, color: "444444" 
});
slide6.addText("Attendance", { x: 7.1, y: 1.1, w: 3, h: 0.35, fontSize: 13, bold: true, color: "2E75B6" });
slide6.addText("GET /api/attendance/date/:date\nPOST /api/attendance/mark\nPOST /api/attendance/bulk-mark", { 
  x: 7.1, y: 1.5, w: 3, h: 1, fontSize: 10, color: "444444" 
});
slide6.addText("Statistics", { x: 0.5, y: 2.8, w: 3, h: 0.35, fontSize: 13, bold: true, color: "2E75B6" });
slide6.addText("GET /api/stats/me\nGET /api/stats/student/:id\nGET /api/dashboard/stats", { 
  x: 0.5, y: 3.2, w: 3, h: 1, fontSize: 10, color: "444444" 
});
slide6.addText("Teacher", { x: 3.8, y: 2.8, w: 3, h: 0.35, fontSize: 13, bold: true, color: "2E75B6" });
slide6.addText("GET /api/teacher/me\nGET /api/teacher/students", { 
  x: 3.8, y: 3.2, w: 3, h: 1, fontSize: 10, color: "444444" 
});

let slide7 = pres.addSlide();
slide7.addText("Demo Credentials", { x: 0.5, y: 0.3, w: "90%", h: 0.8, fontSize: 28, bold: true, color: "1F4E79" });
slide7.addText("Role", { x: 0.5, y: 1.3, w: 3, h: 0.4, fontSize: 14, bold: true, color: "2E75B6" });
slide7.addText("Username", { x: 3.8, y: 1.3, w: 3, h: 0.4, fontSize: 14, bold: true, color: "2E75B6" });
slide7.addText("Password", { x: 7.1, y: 1.3, w: 3, h: 0.4, fontSize: 14, bold: true, color: "2E75B6" });
slide7.addText("Admin", { x: 0.5, y: 1.8, w: 3, h: 0.4, fontSize: 12, color: "444444" });
slide7.addText("admin", { x: 3.8, y: 1.8, w: 3, h: 0.4, fontSize: 12, color: "444444" });
slide7.addText("admin123", { x: 7.1, y: 1.8, w: 3, h: 0.4, fontSize: 12, color: "444444" });
slide7.addText("Teacher", { x: 0.5, y: 2.3, w: 3, h: 0.4, fontSize: 12, color: "444444" });
slide7.addText("teacher1", { x: 3.8, y: 2.3, w: 3, h: 0.4, fontSize: 12, color: "444444" });
slide7.addText("teacher123", { x: 7.1, y: 2.3, w: 3, h: 0.4, fontSize: 12, color: "444444" });
slide7.addText("Student", { x: 0.5, y: 2.8, w: 3, h: 0.4, fontSize: 12, color: "444444" });
slide7.addText("student1", { x: 3.8, y: 2.8, w: 3, h: 0.4, fontSize: 12, color: "444444" });
slide7.addText("student123", { x: 7.1, y: 2.8, w: 3, h: 0.4, fontSize: 12, color: "444444" });
slide7.addText("Pre-seeded Students", { x: 0.5, y: 3.6, w: 4, h: 0.4, fontSize: 14, bold: true, color: "2E75B6" });
slide7.addText("Gayathri (Roll No 1) • Sandhya (Roll No 2) • Kalpana (Roll No 3) • Sai (Roll No 4) • Joycy (Roll No 5)", { 
  x: 0.5, y: 4.1, w: 9, h: 0.6, fontSize: 11, color: "444444" 
});

let slide8 = pres.addSlide();
slide8.background = { color: "1F4E79" };
slide8.addText("Thank You!", { 
  x: 0.5, y: 2.5, w: "90%", h: 1, 
  fontSize: 36, color: "FFFFFF", bold: true, align: "center" 
});
slide8.addText("Questions?", { 
  x: 0.5, y: 3.7, w: "90%", h: 0.6, 
  fontSize: 24, color: "B4C7E7", align: "center" 
});
slide8.addText("GitHub: gayathri-project", { 
  x: 0.5, y: 5, w: "90%", h: 0.5, 
  fontSize: 14, color: "B4C7E7", align: "center" 
});

pres.writeFile({ fileName: "School_Attendance_System_Presentation.pptx" })
  .then(fileName => {
    console.log(`Presentation created: ${fileName}`);
  })
  .catch(err => {
    console.error(err);
  });