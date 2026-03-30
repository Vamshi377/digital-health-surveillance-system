import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' }
});

http.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('dhr_auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    }
  } catch {
    // ignore malformed cache
  }
  return config;
});

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

export const authService = {
  login: (credentials) => http.post('/api/auth/login', credentials),
  getMe: () => http.get('/api/auth/me')
};

export const clinicalService = {
  searchPatient: ({ phone, aadharNumber }) => http.get('/api/clinical/patients/search', { params: { phone, aadharNumber } }),
  registerPatient: (payload) => http.post('/api/clinical/patients', payload),
  createAppointment: (patientIdentifier, payload) => http.post(`/api/clinical/patients/${patientIdentifier}/appointments`, payload),
  getNurseQueue: () => http.get('/api/clinical/nurse/queue'),
  createMedicalRecord: (appointmentId, payload) => http.post(`/api/clinical/appointments/${appointmentId}/records`, payload),
  getLabQueue: () => http.get('/api/clinical/lab/queue'),
  uploadLabReport: (recordId, formData) => http.post(`/api/clinical/records/${recordId}/lab-reports`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDoctorDashboard: () => http.get('/api/clinical/doctor/dashboard'),
  getRecordSummary: (recordId) => http.get(`/api/clinical/records/${recordId}/summary`),
  submitDiagnosis: (recordId, payload) => http.post(`/api/clinical/records/${recordId}/diagnosis`, payload),
  getPatientHistory: (patientId) => http.get(`/api/clinical/patients/${patientId}/history`),
  getPatientHistoryByCode: (patientCode) => http.get(`/api/clinical/patients/by-code/${patientCode}/history`),
  getMyHistory: () => http.get('/api/clinical/patient/me/history')
};

export const adminService = {
  listUsers: (params = {}) => http.get('/api/admin/users', { params }),
  reviewApproval: (userId, payload) => http.patch(`/api/admin/users/${userId}/approval`, payload),
  createUser: (payload) => http.post('/api/admin/users', payload),
  updateRole: (userId, payload) => http.patch(`/api/admin/users/${userId}/role`, payload),
  updateStatus: (userId, payload) => http.patch(`/api/admin/users/${userId}/status`, payload)
};

export const analyticsService = {
  getOverview: (params = {}) => http.get('/api/analytics/dmo/overview', { params }),
  getDiseaseBurden: (params = {}) => http.get('/api/analytics/dmo/disease-burden', { params }),
  getPatientCluster: (params = {}) => http.get('/api/analytics/dmo/patient-cluster', { params })
};

export default http;
