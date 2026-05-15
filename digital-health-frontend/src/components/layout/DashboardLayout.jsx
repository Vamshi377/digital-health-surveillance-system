import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import HealthOrbit3D from '../visuals/HealthOrbit3D'

const roleStatus = {
  hospital_admin: 'Operations monitoring',
  receptionist: 'Front desk routing',
  nurse: 'Clinical intake active',
  lab_technician: 'Diagnostics processing',
  doctor: 'AI-assisted review',
  dmo: 'District surveillance',
  patient: 'Personal health access',
}

export default function DashboardLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative min-h-screen px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="relative flex min-h-[calc(100vh-1.5rem)] gap-4">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        <div className="min-w-0 flex-1">
          <div className="app-surface min-h-[calc(100vh-1.5rem)] overflow-hidden">
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f7fbfe]/90 backdrop-blur-2xl">
              <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="pl-12 lg:pl-0">
                    <div className="flex items-start gap-3">
                      <div className="hidden sm:block">
                        <HealthOrbit3D compact />
                      </div>
                      <div className="min-w-0">
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          {roleStatus[user?.role] || 'Role access active'}
                        </div>
                        {title ? <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">{title}</h1> : null}
                        {subtitle ? <p className="mt-2 max-w-3xl text-[15px] text-slate-600">{subtitle}</p> : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#f9fcfe] px-4 py-3 text-sm text-slate-600 shadow-sm">
                      <CalendarDays size={15} className="text-slate-400" />
                      {todayLabel}
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#f9fcfe] px-3 py-2 shadow-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#14b8a6)] text-sm font-bold text-white">
                        {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
                      </div>
                      <div className="hidden sm:block">
                        <div className="text-sm font-semibold text-slate-900">{user?.fullName || 'Surveillance User'}</div>
                        <div className="text-xs text-slate-500">{todayLabel}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-[#f9fcfe] px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-[#eef6fb] focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2"
                      aria-label="Sign out"
                    >
                      <LogOut size={16} />
                      <span className="hidden sm:inline">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <motion.main
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8"
            >
              {children}
            </motion.main>
          </div>
        </div>
      </div>
    </div>
  )
}
