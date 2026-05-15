import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medisurv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global response error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('medisurv_token')
      localStorage.removeItem('medisurv_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── AUTH ──────────────────────────────────────────────────
export const authAPI = {
  login:    (data)   => api.post('/api/auth/login', data),
  register: (data)   => api.post('/api/auth/register', data),
  patientRegister: (data) => api.post('/api/auth/patient/register', data),
  forgotPassword: (data) => api.post('/api/auth/forgot-password', data),
  resetPassword:  (data) => api.post('/api/auth/reset-password', data),
  me:       ()       => api.get('/api/auth/me'),
}

// ── ADMIN ─────────────────────────────────────────────────
export const adminAPI = {
  getUsers:       ()               => api.get('/api/admin/users'),
  getAuditLogs:   (params)         => api.get('/api/admin/audit-logs', { params }),
  createUser:     (data)           => api.post('/api/admin/users', data),
  updateApproval: (userId, status) => api.patch(`/api/admin/users/${userId}/approval`, { status }),
  toggleActive:   (userId, data)   => api.patch(`/api/admin/users/${userId}/status`, data),
}

// ── CLINICAL ──────────────────────────────────────────────
export const clinicalAPI = {
  // Reception
  searchPatient:        (params) => api.get('/api/clinical/patients/search', { params }),
  searchPatientByPhone: (phone) => api.get('/api/clinical/patients/search', { params: { phone } }),
  createPatient:        (data)  => api.post('/api/clinical/patients', data),
  createAppointment:    (patientId, data) => api.post(`/api/clinical/patients/${patientId}/appointments`, data),

  // Nurse
  getNurseQueue:        ()               => api.get('/api/clinical/nurse/queue'),
  createRecord:         (appointmentId, data) => api.post(`/api/clinical/appointments/${appointmentId}/records`, data),

  // Lab
  getLabQueue:          ()               => api.get('/api/clinical/lab/queue'),
  submitLabReport:      (recordId, data) => api.post(`/api/clinical/records/${recordId}/lab-reports`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Doctor
  getDoctorDashboard:   ()        => api.get('/api/clinical/doctor/dashboard'),
  getRecordSummary:     (recordId)=> api.get(`/api/clinical/records/${recordId}/summary`),
  submitDiagnosis:      (recordId, data) => api.post(`/api/clinical/records/${recordId}/diagnosis`, data),

  // Patient history
  getPatientHistory:    (patientId) => api.get(`/api/clinical/patients/${patientId}/history`),
  getMyHistory:         ()          => api.get('/api/clinical/patient/me/history'),
  getMyNotifications:   ()          => api.get('/api/clinical/patient/me/notifications'),
  exportMyHistory:      ()          => api.get('/api/clinical/patient/me/export', { responseType: 'blob' }),
  getHistoryByCode:     (code)      => api.get(`/api/clinical/patients/by-code/${code}/history`),
}

// ── DMO ANALYTICS ─────────────────────────────────────────
export const analyticsAPI = {
  getOverview:       (params) => api.get('/api/analytics/dmo/overview', { params }),
  getDiseaseBurden:  (params) => api.get('/api/analytics/dmo/disease-burden', { params }),
  getPatientCluster: (params) => api.get('/api/analytics/dmo/patient-cluster', { params }),
  getAlerts:         (params) => api.get('/api/analytics/dmo/alerts', { params }),
  exportDiseaseBurden: (params) => api.get('/api/analytics/dmo/export', { params, responseType: 'blob' }),
}

export default api
