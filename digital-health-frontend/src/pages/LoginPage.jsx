import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import HealthOrbit3D from '../components/visuals/HealthOrbit3D'

const demoAccounts = [
  { role: 'hospital_admin', label: 'Admin', email: 'hospitaladmin@health.local', password: 'HospitalAdmin@123' },
  { role: 'receptionist', label: 'Reception', email: 'reception@health.local', password: 'Reception@123' },
  { role: 'nurse', label: 'Nurse', email: 'nurse@health.local', password: 'Nurse@123' },
  { role: 'lab_technician', label: 'Lab', email: 'lab@health.local', password: 'Lab@123' },
  { role: 'doctor', label: 'Doctor', email: 'doctor@health.local', password: 'Doctor@123' },
  { role: 'medical_superintendent', label: 'MS', email: 'ms@health.local', password: 'Superintendent@123' },
  { role: 'dmo', label: 'DMO', email: 'dmo@health.local', password: 'Dmo@123' },
  { role: 'patient', label: 'Patient', phoneNumber: '9177324853' },
]

const roleOptions = [
  { value: 'hospital_admin', label: 'Hospital Admin' },
  { value: 'medical_superintendent', label: 'Medical Superintendent' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'lab_technician', label: 'Lab Technician' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'dmo', label: 'DMO' },
  { value: 'patient', label: 'Patient' },
]

const roleRedirect = {
  hospital_admin: '/admin',
  medical_superintendent: '/admin',
  receptionist: '/reception',
  nurse: '/nurse',
  lab_technician: '/lab',
  doctor: '/doctor',
  dmo: '/dmo',
  patient: '/patient',
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', phoneNumber: '', role: 'doctor' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [resetForm, setResetForm] = useState({ email: '', role: 'doctor', token: '', password: '' })
  const [resetMessage, setResetMessage] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = form.role === 'patient'
        ? { role: 'patient', phoneNumber: form.phoneNumber }
        : form
      const res = await authAPI.login(payload)
      const { token, user } = res.data
      login(user, token)
      navigate(roleRedirect[user.role] || '/patient')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (account) => {
    setForm({
      email: account.email || '',
      password: account.password || '',
      phoneNumber: account.phoneNumber || '',
      role: account.role,
    })
    setError('')
  }

  const requestReset = async () => {
    setResetLoading(true)
    setResetMessage('')
    try {
      const res = await authAPI.forgotPassword({ email: resetForm.email, role: resetForm.role })
      setResetForm(prev => ({ ...prev, token: res.data.resetToken || prev.token }))
      setResetMessage(res.data.resetToken ? `Reset token: ${res.data.resetToken}` : res.data.message)
    } catch (err) {
      setResetMessage(err.response?.data?.message || err.response?.data?.error || 'Unable to generate reset token.')
    } finally {
      setResetLoading(false)
    }
  }

  const submitReset = async (e) => {
    e.preventDefault()
    setResetLoading(true)
    setResetMessage('')
    try {
      const res = await authAPI.resetPassword({ token: resetForm.token, password: resetForm.password })
      setResetMessage(res.data.message || 'Password reset successfully.')
    } catch (err) {
      setResetMessage(err.response?.data?.message || err.response?.data?.error || 'Unable to reset password.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#eef6ff_48%,#ffffff_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="order-2 lg:order-1"
        >
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#94a3ff,#4fd1c5)] shadow-[0_18px_40px_rgba(79,209,197,0.18)]">
              <Activity size={28} className="text-slate-900" />
            </div>
            <div>
              <div className="font-display text-3xl font-bold tracking-tight text-slate-900">MediSurv</div>
              <div className="text-sm text-slate-500">Digital health surveillance platform</div>
            </div>
          </div>

          <h1 className="max-w-xl font-display text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            A cleaner way for healthcare teams to sign in and start work.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
            Access the right dashboard for your role without a crowded landing page. Simple, clear, and fast.
          </p>

          <div className="mt-8 flex justify-center lg:justify-start">
            <HealthOrbit3D />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { title: 'Fast access', text: 'Jump into your workflow in a few seconds.' },
              { title: 'Role-based', text: 'Each account opens the correct workspace.' },
              { title: 'Focused UI', text: 'Only the essentials appear on this page.' },
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <div className="mb-2 text-base font-semibold text-slate-900">{item.title}</div>
                <p className="text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="order-1 lg:order-2"
        >
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="mb-8">
              <div className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600">Welcome back</div>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900">Sign in</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Use your assigned role and credentials to continue.</p>
            </div>

            <div className="mb-6">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Demo accounts</div>
              <div className="flex flex-wrap gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    onClick={() => fillDemo(acc)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold tracking-normal text-slate-700">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.role === 'patient' ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold tracking-normal text-slate-700">Mobile Number</label>
                  <input
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    placeholder="10 digit mobile number"
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold tracking-normal text-slate-700">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="user@health.local"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold tracking-normal text-slate-700">Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2563eb,#06b6d4)] text-sm font-semibold text-white shadow-[0_16px_32px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                ) : (
                  <>
                    <ArrowRight size={16} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {form.role !== 'patient' ? <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setResetOpen(value => !value)
                  setResetForm(prev => ({ ...prev, email: form.email, role: form.role }))
                  setResetMessage('')
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
              >
                <KeyRound size={16} />
                Forgot / Reset Password
              </button>
            </div> : null}

            {resetOpen ? (
              <form onSubmit={submitReset} className="mt-4 space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="email"
                    value={resetForm.email}
                    onChange={e => setResetForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Account email"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                    required
                  />
                  <select
                    value={resetForm.role}
                    onChange={e => setResetForm(prev => ({ ...prev, role: e.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  >
                    {roleOptions.filter(option => option.value !== 'patient').map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <button type="button" onClick={requestReset} disabled={resetLoading} className="w-full rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
                  Generate Reset Token
                </button>
                <input
                  value={resetForm.token}
                  onChange={e => setResetForm(prev => ({ ...prev, token: e.target.value }))}
                  placeholder="Reset token"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  required
                />
                <input
                  type="password"
                  value={resetForm.password}
                  onChange={e => setResetForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="New password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  minLength={8}
                  required
                />
                {resetMessage ? <div className="break-all rounded-2xl bg-white px-4 py-3 text-xs text-slate-600">{resetMessage}</div> : null}
                <button type="submit" disabled={resetLoading} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  Set New Password
                </button>
              </form>
            ) : null}

            <p className="mt-6 text-center text-sm text-slate-500">
              Need an account?{' '}
              <a href="/register" className="font-semibold text-sky-700 no-underline">
                Sign up
              </a>
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
