/**
 * HealthPulse API Service
 * Central API layer — wire up your backend endpoints here.
 * All methods return Promises and follow REST conventions.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new ApiError(err.message || `HTTP ${res.status}`, res.status);
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login:          (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout:         ()            => request('/auth/logout', { method: 'POST' }),
  me:             ()            => request('/auth/me'),
  refreshToken:   ()            => request('/auth/refresh', { method: 'POST' }),
};

// ── Patients ──────────────────────────────────────────
export const patientsApi = {
  list:           (params = {}) => request(`/patients?${new URLSearchParams(params)}`),
  get:            (id)          => request(`/patients/${id}`),
  create:         (data)        => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  update:         (id, data)    => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:         (id)          => request(`/patients/${id}`, { method: 'DELETE' }),
  search:         (query)       => request(`/patients/search?q=${encodeURIComponent(query)}`),
};

// ── Appointments ──────────────────────────────────────
export const appointmentsApi = {
  list:           (params = {}) => request(`/appointments?${new URLSearchParams(params)}`),
  get:            (id)          => request(`/appointments/${id}`),
  create:         (data)        => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  update:         (id, data)    => request(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancel:         (id)          => request(`/appointments/${id}/cancel`, { method: 'POST' }),
  today:          ()            => request('/appointments/today'),
};

// ── Vitals ────────────────────────────────────────────
export const vitalsApi = {
  list:           (patientId)   => request(`/patients/${patientId}/vitals`),
  create:         (data)        => request('/vitals', { method: 'POST', body: JSON.stringify(data) }),
  latest:         (patientId)   => request(`/patients/${patientId}/vitals/latest`),
};

// ── Medical Records ───────────────────────────────────
export const recordsApi = {
  list:           (patientId)   => request(`/patients/${patientId}/records`),
  get:            (id)          => request(`/records/${id}`),
  create:         (data)        => request('/records', { method: 'POST', body: JSON.stringify(data) }),
  update:         (id, data)    => request(`/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Lab ───────────────────────────────────────────────
export const labApi = {
  queue:          ()            => request('/lab/queue'),
  getReport:      (id)          => request(`/lab/reports/${id}`),
  listReports:    (patientId)   => request(`/patients/${patientId}/lab-reports`),
  uploadReport:   (formData)    => request('/lab/reports', {
    method: 'POST',
    headers: {},  // Remove Content-Type to let browser set multipart boundary
    body: formData,
  }),
  updateStatus:   (id, status)  => request(`/lab/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ── Diagnoses ─────────────────────────────────────────
export const diagnosesApi = {
  list:           (patientId)   => request(`/patients/${patientId}/diagnoses`),
  create:         (data)        => request('/diagnoses', { method: 'POST', body: JSON.stringify(data) }),
  update:         (id, data)    => request(`/diagnoses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Prescriptions ─────────────────────────────────────
export const prescriptionsApi = {
  list:           (patientId)   => request(`/patients/${patientId}/prescriptions`),
  create:         (data)        => request('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
  update:         (id, data)    => request(`/prescriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Notifications ─────────────────────────────────────
export const notificationsApi = {
  list:           ()            => request('/notifications'),
  markRead:       (id)          => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead:    ()            => request('/notifications/read-all', { method: 'POST' }),
};

// ── Admin ─────────────────────────────────────────────
export const adminApi = {
  pendingUsers:   ()            => request('/admin/users/pending'),
  approveUser:    (id)          => request(`/admin/users/${id}/approve`, { method: 'POST' }),
  rejectUser:     (id, reason)  => request(`/admin/users/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  allUsers:       ()            => request('/admin/users'),
  updateRole:     (id, role)    => request(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
};

// ── DMO / Analytics ───────────────────────────────────
export const analyticsApi = {
  districtSummary:  ()           => request('/analytics/district'),
  diseaseTrends:    (params = {})=> request(`/analytics/diseases?${new URLSearchParams(params)}`),
  facilityStats:    ()           => request('/analytics/facilities'),
  ageDistribution:  ()           => request('/analytics/age-distribution'),
  monthlyAdmissions:()           => request('/analytics/admissions/monthly'),
  outbreakAlerts:   ()           => request('/analytics/alerts'),
};

// ── Nurse Queue ───────────────────────────────────────
export const nurseApi = {
  queue:          ()            => request('/nurse/queue'),
  updateQueueItem:(id, data)    => request(`/nurse/queue/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export default {
  auth: authApi,
  patients: patientsApi,
  appointments: appointmentsApi,
  vitals: vitalsApi,
  records: recordsApi,
  lab: labApi,
  diagnoses: diagnosesApi,
  prescriptions: prescriptionsApi,
  notifications: notificationsApi,
  admin: adminApi,
  analytics: analyticsApi,
  nurse: nurseApi,
};
