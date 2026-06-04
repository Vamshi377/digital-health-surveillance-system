import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarDays, RefreshCw, Search, UserPlus, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import FormField, { Input, Select, Textarea } from '../components/ui/FormField';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import StatCard from '../components/ui/StatCard';
import { clinicalService } from '../services/api';
import { TELANGANA_DISTRICTS } from '../constants/locations';

const EMPTY_PATIENT_FORM = {
  fullName: '',
  dateOfBirth: '',
  gender: 'male',
  city: '',
  mandal: '',
  area: '',
  addressLine: '',
  contactNumber: '',
  aadharNumber: ''
};

const EMPTY_APPOINTMENT_FORM = {
  patientIdentifier: '',
  scheduledAt: '',
  visitDate: '',
  reason: ''
};

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

function buildPatientPayload(form) {
  const area = form.area.trim();
  const district = form.city.trim();

  return {
    fullName: form.fullName.trim(),
    dateOfBirth: form.dateOfBirth,
    gender: form.gender,
    district,
    city: district,
    mandal: form.mandal.trim(),
    village: area,
    area,
    addressLine: form.addressLine.trim(),
    contactNumber: digitsOnly(form.contactNumber),
    aadharNumber: digitsOnly(form.aadharNumber)
  };
}

export default function ReceptionDashboard() {
  const location = useLocation();
  const [search, setSearch] = useState({ phone: '', aadharNumber: '' });
  const [registerForm, setRegisterForm] = useState(EMPTY_PATIENT_FORM);
  const [appointmentForm, setAppointmentForm] = useState(EMPTY_APPOINTMENT_FORM);
  const [patient, setPatient] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [savingAppointment, setSavingAppointment] = useState(false);

  const searchReady = Number(Boolean(search.phone || search.aadharNumber));
  const patientFound = Number(Boolean(patient));
  const bookingReady = Number(Boolean((appointmentForm.patientIdentifier || patient?.hospitalPatientId || patient?.patientCode) && appointmentForm.scheduledAt));
  const viewMode = location.pathname.includes('/reception/appointments') ? 'appointments' : 'patients';

  const resetFeedback = () => {
    setMessage('');
    setError('');
  };

  const handleSearch = async () => {
    resetFeedback();
    setLoadingSearch(true);
    try {
      const data = await clinicalService.searchPatient({
        phone: digitsOnly(search.phone),
        aadharNumber: digitsOnly(search.aadharNumber)
      });
      setPatient(data?.patient || null);
      if (data?.patient) {
        setMessage(`Patient found: ${data.patient.fullName}. Hospital Patient ID: ${data.patient.hospitalPatientId || '-'}. Global Patient ID: ${data.patient.patientCode}`);
        setAppointmentForm((prev) => ({ ...prev, patientIdentifier: data.patient.hospitalPatientId || data.patient.patientCode }));
      } else {
        setMessage('No patient found for the entered mobile number or Aadhaar number.');
      }
    } catch (err) {
      setError(err.message);
      setPatient(null);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleRegister = async () => {
    resetFeedback();
    const payload = buildPatientPayload(registerForm);
    if (!payload.fullName || !payload.dateOfBirth || !payload.gender || !payload.district || !payload.mandal || !payload.area || !payload.contactNumber || !payload.aadharNumber) {
      setError('Please fill all required patient registration fields.');
      return;
    }
    if (payload.contactNumber.length !== 10) {
      setError('Contact number must be exactly 10 digits.');
      return;
    }
    if (payload.aadharNumber.length !== 12) {
      setError('Aadhaar number must be exactly 12 digits.');
      return;
    }

    setSavingPatient(true);
    try {
      const data = await clinicalService.registerPatient(payload);
      const createdPatient = data?.patient || null;
      setPatient(createdPatient);
      setRegisterForm(EMPTY_PATIENT_FORM);
      setAppointmentForm((prev) => ({ ...prev, patientIdentifier: createdPatient?.hospitalPatientId || createdPatient?.patientCode || prev.patientIdentifier }));
      setMessage(`Patient registered successfully. Hospital Patient ID: ${createdPatient?.hospitalPatientId || '-'}. Global Patient ID: ${createdPatient?.patientCode}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPatient(false);
    }
  };

  const handleBookAppointment = async () => {
    resetFeedback();
    setSavingAppointment(true);
    try {
      const patientIdentifier = appointmentForm.patientIdentifier || patient?.hospitalPatientId || patient?.patientCode;
      await clinicalService.createAppointment(patientIdentifier, {
        scheduledAt: appointmentForm.scheduledAt,
        visitDate: appointmentForm.visitDate || appointmentForm.scheduledAt,
        reason: appointmentForm.reason
      });
      setAppointmentForm(EMPTY_APPOINTMENT_FORM);
      setMessage(`Appointment booked for Hospital Patient ID ${patientIdentifier}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingAppointment(false);
    }
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="Patient Intake"
        subtitle="Search patients, register new profiles, and schedule visits with date and time"
        icon={Users}
        actions={[<Button key="search" icon={RefreshCw} variant="secondary" onClick={handleSearch}>Refresh Search</Button>]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard title="Search Ready" value={searchReady} gradient="stat-gradient-blue" icon={Search} sub="phone or Aadhar" />
        <StatCard title="Patient Found" value={patientFound} gradient="stat-gradient-teal" icon={Users} sub="existing profile" />
        <StatCard title="Booking Ready" value={bookingReady} gradient="stat-gradient-amber" icon={CalendarDays} sub="appointment form state" />
      </div>

      {(message || error) && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: 18, borderColor: error ? 'rgba(239,68,68,0.3)' : 'var(--neutral-100)' }}>
          <div style={{ color: error ? 'var(--danger-700)' : 'var(--success-700)', fontWeight: 600, fontSize: '0.88rem' }}>{error || message}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        {viewMode === 'patients' && (
          <SectionCard title="Find Existing Patient" subtitle="Search by registered mobile number or Aadhaar number">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Phone Number">
              <Input value={search.phone} maxLength={10} inputMode="numeric" onChange={(event) => setSearch((prev) => ({ ...prev, phone: digitsOnly(event.target.value).slice(0, 10) }))} placeholder="10 digit phone" />
            </FormField>
            <FormField label="Aadhaar Number">
              <Input value={search.aadharNumber} maxLength={12} inputMode="numeric" onChange={(event) => setSearch((prev) => ({ ...prev, aadharNumber: digitsOnly(event.target.value).slice(0, 12) }))} placeholder="12 digit Aadhaar" />
            </FormField>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <Button icon={Search} loading={loadingSearch} onClick={handleSearch}>Search Patient</Button>
            </div>
          </div>

          <div style={{ marginTop: 20, padding: '16px', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-100)' }}>
            {patient ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.86rem' }}>
                <div><strong>Name:</strong> {patient.fullName}</div>
                <div><strong>Global Patient ID:</strong> {patient.patientCode}</div>
                <div><strong>Hospital Patient ID:</strong> {patient.hospitalPatientId || '-'}</div>
                <div><strong>Phone:</strong> {patient.contactNumber}</div>
                <div><strong>Aadhaar:</strong> {patient.aadharNumber || '-'}</div>
                <div><strong>District:</strong> {patient.district}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {patient.addressLine}</div>
              </div>
            ) : (
              <div style={{ color: 'var(--neutral-500)', fontSize: '0.85rem' }}>No patient selected yet.</div>
            )}
          </div>
          </SectionCard>
        )}

        {viewMode === 'patients' && (
          <SectionCard title="Register New Patient" subtitle="Create a new patient profile">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="Full Name" required><Input value={registerForm.fullName} onChange={(event) => setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))} /></FormField>
            <FormField label="Date of Birth" required><Input type="date" value={registerForm.dateOfBirth} onChange={(event) => setRegisterForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))} /></FormField>
            <FormField label="Gender" required>
              <Select value={registerForm.gender} onChange={(event) => setRegisterForm((prev) => ({ ...prev, gender: event.target.value }))}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
            <FormField label="District / City" required>
              <Select value={registerForm.city} onChange={(event) => setRegisterForm((prev) => ({ ...prev, city: event.target.value }))}>
                <option value="">Select district</option>
                {TELANGANA_DISTRICTS.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Mandal" required><Input value={registerForm.mandal} onChange={(event) => setRegisterForm((prev) => ({ ...prev, mandal: event.target.value }))} /></FormField>
            <FormField label="Area / Village" required><Input value={registerForm.area} onChange={(event) => setRegisterForm((prev) => ({ ...prev, area: event.target.value }))} /></FormField>
            <FormField label="Contact Number" required><Input value={registerForm.contactNumber} maxLength={10} inputMode="numeric" onChange={(event) => setRegisterForm((prev) => ({ ...prev, contactNumber: digitsOnly(event.target.value).slice(0, 10) }))} /></FormField>
            <FormField label="Aadhaar Number" required><Input value={registerForm.aadharNumber} maxLength={12} inputMode="numeric" onChange={(event) => setRegisterForm((prev) => ({ ...prev, aadharNumber: digitsOnly(event.target.value).slice(0, 12) }))} /></FormField>
            <FormField label="Address" style={{ gridColumn: '1 / -1' }}><Textarea value={registerForm.addressLine} onChange={(event) => setRegisterForm((prev) => ({ ...prev, addressLine: event.target.value }))} /></FormField>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <Button icon={UserPlus} loading={savingPatient} onClick={handleRegister}>Register Patient</Button>
            </div>
          </div>
          {patient && (
            <div style={{ marginTop: 20, padding: '16px', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-100)' }}>
              <div style={{ fontSize: '0.86rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><strong>Generated Global Patient ID:</strong> {patient.patientCode}</div>
                <div><strong>Generated Hospital Patient ID:</strong> {patient.hospitalPatientId || '-'}</div>
                <div><strong>Mobile:</strong> {patient.contactNumber}</div>
                <div><strong>Name:</strong> {patient.fullName}</div>
              </div>
            </div>
          )}
          </SectionCard>
        )}

        <SectionCard title="Book Appointment" subtitle="Create a new appointment for an existing patient" style={{ gridColumn: viewMode === 'appointments' ? '1 / -1' : '1 / -1' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}>
            <FormField label="Hospital Patient ID" required><Input value={appointmentForm.patientIdentifier || patient?.hospitalPatientId || patient?.patientCode || ''} onChange={(event) => setAppointmentForm((prev) => ({ ...prev, patientIdentifier: event.target.value }))} placeholder="HOSP-PAT-XXXX" /></FormField>
            <FormField label="Scheduled At" required><Input type="datetime-local" value={appointmentForm.scheduledAt} onChange={(event) => setAppointmentForm((prev) => ({ ...prev, scheduledAt: event.target.value }))} /></FormField>
            <FormField label="Visit Date & Time"><Input type="datetime-local" value={appointmentForm.visitDate} onChange={(event) => setAppointmentForm((prev) => ({ ...prev, visitDate: event.target.value }))} /></FormField>
            <FormField label="Reason"><Input value={appointmentForm.reason} onChange={(event) => setAppointmentForm((prev) => ({ ...prev, reason: event.target.value }))} placeholder="Fever / checkup" /></FormField>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <Button icon={CalendarDays} loading={savingAppointment} onClick={handleBookAppointment}>Book Appointment</Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
