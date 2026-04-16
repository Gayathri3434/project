const API_URL = '/api';
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  const currentPage = window.location.pathname;
  
  if (currentPage.includes('dashboard.html')) {
    const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');
    
    if (!token || !userData) {
      window.location.href = '/login.html';
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        logout();
        return;
      }

      currentUser = await response.json();
      displayUserInterface();
      
      if (currentUser.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        loadPendingUsers();
        loadAllUsers();
      }
      
      loadStats();
      loadEmployees();
      loadAttendance();
      setupFormHandlers();
      setDefaultDates();
    } catch (err) {
      console.error('Auth check failed:', err);
      logout();
    }
  }
});

function displayUserInterface() {
  document.getElementById('mainContainer').style.display = 'block';
  document.getElementById('welcomeText').textContent = `Welcome, ${currentUser.username}`;
  
  if (currentUser.role === 'admin') {
    document.getElementById('welcomeText').textContent = `Welcome, ${currentUser.username} (Admin)`;
  }
}

function logout() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.location.href = '/index.html';
}

function setupFormHandlers() {
  document.getElementById('employeeForm').addEventListener('submit', addEmployee);
}

function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
  document.getElementById('endDate').value = today;
}

function showSection(section) {
  const sections = ['checkin', 'checkout', 'attendance', 'report', 'addEmployee'];
  sections.forEach(s => {
    const el = document.getElementById(`${s}Section`);
    if (el) {
      el.classList.add('section-hidden');
    }
  });

  const target = document.getElementById(`${section}Section`);
  if (target) {
    target.classList.remove('section-hidden');
  }

  if (section === 'checkin' || section === 'checkout') {
    loadEmployees();
  }
}

function showAdminTab(tab) {
  document.getElementById('pendingUsersSection').style.display = tab === 'pending' ? 'block' : 'none';
  document.getElementById('allUsersSection').style.display = tab === 'all' ? 'block' : 'none';
  
  document.querySelectorAll('.admin-tab').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  };
}

async function loadStats() {
  try {
    const response = await fetch(`${API_URL}/stats`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    document.getElementById('totalEmployees').textContent = data.totalEmployees;
    document.getElementById('presentToday').textContent = data.presentToday;
    document.getElementById('todayAttendance').textContent = data.todayAttendance;
    
    if (currentUser && currentUser.role === 'admin') {
      document.getElementById('pendingUsers').textContent = data.pendingUsers;
    }
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

async function loadPendingUsers() {
  try {
    const response = await fetch(`${API_URL}/admin/pending-users`, {
      headers: getAuthHeaders()
    });
    const users = await response.json();
    const tbody = document.getElementById('pendingUsersTableBody');

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No pending users</td></tr>';
    } else {
      tbody.innerHTML = users.map(user => `
        <tr>
          <td>${user.id}</td>
          <td>${user.username}</td>
          <td>${user.email}</td>
          <td>${new Date(user.created_at).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-success" onclick="approveUser(${user.id})">✅ Approve</button>
            <button class="btn btn-danger" onclick="rejectUser(${user.id})">❌ Reject</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading pending users:', err);
  }
}

async function loadAllUsers() {
  try {
    const response = await fetch(`${API_URL}/admin/all-users`, {
      headers: getAuthHeaders()
    });
    const users = await response.json();
    const tbody = document.getElementById('allUsersTableBody');

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No users found</td></tr>';
    } else {
      tbody.innerHTML = users.map(user => `
        <tr>
          <td>${user.id}</td>
          <td>${user.username}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>${user.is_approved ? '✅ Approved' : '⏳ Pending'}</td>
          <td>
            ${user.role !== 'admin' ? `<button class="btn btn-danger" onclick="deleteUser(${user.id})">🗑️ Delete</button>` : '-'}
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
}

async function approveUser(id) {
  try {
    const response = await fetch(`${API_URL}/admin/approve-user/${id}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      showToast('User approved successfully!');
      loadPendingUsers();
      loadAllUsers();
      loadStats();
    }
  } catch (err) {
    console.error('Error approving user:', err);
    showToast('Error approving user', 'error');
  }
}

async function rejectUser(id) {
  if (!confirm('Are you sure you want to reject this user?')) return;

  try {
    const response = await fetch(`${API_URL}/admin/reject-user/${id}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      showToast('User rejected!');
      loadPendingUsers();
      loadAllUsers();
      loadStats();
    }
  } catch (err) {
    console.error('Error rejecting user:', err);
    showToast('Error rejecting user', 'error');
  }
}

async function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) return;

  try {
    const response = await fetch(`${API_URL}/admin/delete-user/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      showToast('User deleted!');
      loadAllUsers();
      loadStats();
    }
  } catch (err) {
    console.error('Error deleting user:', err);
    showToast('Error deleting user', 'error');
  }
}

async function loadEmployees() {
  try {
    const response = await fetch(`${API_URL}/employees`, {
      headers: getAuthHeaders()
    });
    const employees = await response.json();

    const checkinSelect = document.getElementById('checkinEmployee');
    const checkoutSelect = document.getElementById('checkoutEmployee');
    const employeeTableBody = document.getElementById('employeeTableBody');

    checkinSelect.innerHTML = '<option value="">-- Select Employee --</option>';
    checkoutSelect.innerHTML = '<option value="">-- Select Employee --</option>';

    employees.forEach(emp => {
      checkinSelect.innerHTML += `<option value="${emp.id}">${emp.name} (${emp.department || 'N/A'})</option>`;
      checkoutSelect.innerHTML += `<option value="${emp.id}">${emp.name} (${emp.department || 'N/A'})</option>`;
    });

    if (employees.length === 0) {
      employeeTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No employees found</td></tr>';
    } else {
      employeeTableBody.innerHTML = employees.map(emp => `
        <tr>
          <td>${emp.id}</td>
          <td>${emp.name}</td>
          <td>${emp.email}</td>
          <td>${emp.department || 'N/A'}</td>
          <td>
            <button class="btn btn-danger" onclick="deleteEmployee(${emp.id})">🗑️ Delete</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading employees:', err);
    showToast('Error loading employees', 'error');
  }
}

async function addEmployee(e) {
  e.preventDefault();

  const name = document.getElementById('empName').value;
  const email = document.getElementById('empEmail').value;
  const department = document.getElementById('empDepartment').value;

  try {
    const response = await fetch(`${API_URL}/employees`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, email, department })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add employee');
    }

    showToast('Employee added successfully!');
    document.getElementById('empName').value = '';
    document.getElementById('empEmail').value = '';
    document.getElementById('empDepartment').value = '';

    loadEmployees();
    loadStats();
  } catch (err) {
    console.error('Error adding employee:', err);
    showToast(err.message || 'Error adding employee', 'error');
  }
}

async function deleteEmployee(id) {
  if (!confirm('Are you sure you want to delete this employee?')) return;

  try {
    const response = await fetch(`${API_URL}/employees/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to delete employee');
    }

    showToast('Employee deleted successfully!');
    loadEmployees();
    loadStats();
  } catch (err) {
    console.error('Error deleting employee:', err);
    showToast('Error deleting employee', 'error');
  }
}

async function checkIn() {
  const employeeId = document.getElementById('checkinEmployee').value;

  if (!employeeId) {
    showToast('Please select an employee', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/attendance/checkin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employee_id: parseInt(employeeId) })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to check in');
    }

    showToast('Checked in successfully!');
    document.getElementById('checkinEmployee').value = '';
    loadAttendance();
    loadStats();
  } catch (err) {
    console.error('Error checking in:', err);
    showToast(err.message || 'Error checking in', 'error');
  }
}

async function checkOut() {
  const employeeId = document.getElementById('checkoutEmployee').value;

  if (!employeeId) {
    showToast('Please select an employee', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/attendance/checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employee_id: parseInt(employeeId) })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to check out');
    }

    showToast('Checked out successfully!');
    document.getElementById('checkoutEmployee').value = '';
    loadAttendance();
    loadStats();
  } catch (err) {
    console.error('Error checking out:', err);
    showToast(err.message || 'Error checking out', 'error');
  }
}

async function loadAttendance() {
  try {
    const response = await fetch(`${API_URL}/attendance`, {
      headers: getAuthHeaders()
    });
    const records = await response.json();
    const tbody = document.getElementById('attendanceTableBody');

    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No attendance records</td></tr>';
    } else {
      tbody.innerHTML = records.map(record => `
        <tr>
          <td>${record.name}</td>
          <td>${record.department || 'N/A'}</td>
          <td>${record.check_in || '-'}</td>
          <td>${record.check_out || '-'}</td>
          <td><span class="status-badge ${record.status}">${record.status}</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading attendance:', err);
  }
}

async function generateReport() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    showToast('Please select date range', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/attendance/report?startDate=${startDate}&endDate=${endDate}`, {
      headers: getAuthHeaders()
    });
    const records = await response.json();
    const tbody = document.getElementById('reportTableBody');

    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No records found for selected dates</td></tr>';
    } else {
      tbody.innerHTML = records.map(record => `
        <tr>
          <td>${record.date}</td>
          <td>${record.name}</td>
          <td>${record.department || 'N/A'}</td>
          <td>${record.check_in || '-'}</td>
          <td>${record.check_out || '-'}</td>
          <td>${record.status}</td>
        </tr>
      `).join('');
    }

    showToast(`Found ${records.length} records`);
  } catch (err) {
    console.error('Error generating report:', err);
    showToast('Error generating report', 'error');
  }
}
