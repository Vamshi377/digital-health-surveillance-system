import axios from 'axios';

const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
  login:   (credentials)   => http.post('/auth/login', credentials),
  logout:  ()              => http.post('/auth/logout'),
  getMe:   ()              => http.get('/auth/me'),
  refresh: ()              => http.post('/auth/refresh'),
  changePassword: (payload)=> http.put('/auth/password', payload),
};

// ── Clinical ─────────────────────────────────────────────────────────────────
export const clinicalService = {
  // Patients
  getPatients:      (params)   => http.get('/clinical/patients', { params }),
  getPatient:       (id)       => http.get(`/clinical/patients/${id}`),
  registerPatient:  (payload)  => http.post('/clinical/patients', payload),
  updatePatient:    (id, data) => http.put(`/clinical/patients/${id}`, data),

  // Appointments
  getAppointments:  (params)   => http.get('/clinical/appointments', { params }),
  getAppointment:   (id)       => http.get(`/clinical/appointments/${id}`),
  createAppointment:(payload)  => http.post('/clinical/appointments', payload),
  updateAppointment:(id, data) => http.put(`/clinical/appointments/${id}`, data),
  cancelAppointment:(id)       => http.delete(`/clinical/appointments/${id}`),

  // Queue
  getQueue:         (params)   => http.get('/clinical/queue', { params }),
  addToQueue:       (payload)  => http.post('/clinical/queue', payload),
  updateQueueItem:  (id, data) => http.put(`/clinical/queue/${id}`, data),
  removeFromQueue:  (id)       => http.delete(`/clinical/queue/${id}`),

  // Vitals
  getVitals:        (patientId)=> http.get(`/clinical/patients/${patientId}/vitals`),
  recordVitals:     (payload)  => http.post('/clinical/vitals', payload),

  // Consultations
  getConsultations: (params)   => http.get('/clinical/consultations', { params }),
  getConsultation:  (id)       => http.get(`/clinical/consultations/${id}`),
  createConsultation:(payload) => http.post('/clinical/consultations', payload),
  updateConsultation:(id, data)=> http.put(`/clinical/consultations/${id}`, data),

  // Prescriptions
  getPrescriptions: (params)   => http.get('/clinical/prescriptions', { params }),
  createPrescription:(payload) => http.post('/clinical/prescriptions', payload),

  // Lab orders
  getLabOrders:     (params)   => http.get('/clinical/lab-orders', { params }),
  getLabOrder:      (id)       => http.get(`/clinical/lab-orders/${id}`),
  createLabOrder:   (payload)  => http.post('/clinical/lab-orders', payload),
  updateLabOrder:   (id, data) => http.put(`/clinical/lab-orders/${id}`, data),
  uploadLabResult:  (id, form) => http.put(`/clinical/lab-orders/${id}/result`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Medical history
  getMedicalHistory:(patientId)=> http.get(`/clinical/patients/${patientId}/history`),

  // Wards / beds
  getBeds:          (params)   => http.get('/clinical/beds', { params }),
  assignBed:        (payload)  => http.post('/clinical/beds/assign', payload),
  releaseBed:       (id)       => http.post(`/clinical/beds/${id}/release`),

  // Nursing tasks
  getNursingTasks:  (params)   => http.get('/clinical/nursing-tasks', { params }),
  completeTask:     (id)       => http.put(`/clinical/nursing-tasks/${id}/complete`),
};

// ── Admin ────────────────────────────────────────────────────────────────────
export const adminService = {
  // Staff
  getStaff:         (params)   => http.get('/admin/staff', { params }),
  getStaffMember:   (id)       => http.get(`/admin/staff/${id}`),
  createStaff:      (payload)  => http.post('/admin/staff', payload),
  updateStaff:      (id, data) => http.put(`/admin/staff/${id}`, data),
  deactivateStaff:  (id)       => http.delete(`/admin/staff/${id}`),

  // Roles & permissions
  getRoles:         ()         => http.get('/admin/roles'),
  updateRole:       (id, data) => http.put(`/admin/roles/${id}`, data),

  // Departments
  getDepartments:   ()         => http.get('/admin/departments'),
  createDepartment: (payload)  => http.post('/admin/departments', payload),

  // Billing
  getBills:         (params)   => http.get('/admin/billing', { params }),
  getBill:          (id)       => http.get(`/admin/billing/${id}`),
  createBill:       (payload)  => http.post('/admin/billing', payload),
  updateBill:       (id, data) => http.put(`/admin/billing/${id}`, data),

  // Inventory
  getInventory:     (params)   => http.get('/admin/inventory', { params }),
  updateInventory:  (id, data) => http.put(`/admin/inventory/${id}`, data),
  reorderItem:      (payload)  => http.post('/admin/inventory/reorder', payload),

  // Audit logs
  getAuditLogs:     (params)   => http.get('/admin/audit-logs', { params }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsService = {
  getOverview:          (params)  => http.get('/analytics/overview', { params }),
  getPatientStats:      (params)  => http.get('/analytics/patients', { params }),
  getAppointmentStats:  (params)  => http.get('/analytics/appointments', { params }),
  getRevenueStats:      (params)  => http.get('/analytics/revenue', { params }),
  getLabStats:          (params)  => http.get('/analytics/lab', { params }),
  getOpdStats:          (params)  => http.get('/analytics/opd', { params }),
  getIpdStats:          (params)  => http.get('/analytics/ipd', { params }),
  getDepartmentStats:   (params)  => http.get('/analytics/departments', { params }),
  getDoctorPerformance: (params)  => http.get('/analytics/doctors', { params }),
  exportReport:         (payload) => http.post('/analytics/export', payload, { responseType: 'blob' }),
};

export default http;
