import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  Calendar,
  FlaskConical,
  Heart,
  LogOut,
  Menu,
  Shield,
  Stethoscope,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'

const roleNavMap = {
  hospital_admin: [
    { to: '/admin', icon: Shield, label: 'Operations' },
    { to: '/reception', icon: Calendar, label: 'Reception Flow' },
  ],
  receptionist: [{ to: '/reception', icon: Calendar, label: 'Reception Flow' }],
  nurse: [{ to: '/nurse', icon: Heart, label: 'Nurse Station' }],
  lab_technician: [{ to: '/lab', icon: FlaskConical, label: 'Lab Console' }],
  doctor: [{ to: '/doctor', icon: Stethoscope, label: 'Clinical Review' }],
  dmo: [{ to: '/dmo', icon: BarChart3, label: 'Surveillance' }],
  patient: [{ to: '/patient', icon: User, label: 'Health Records' }],
}

const roleAccentMap = {
  hospital_admin: '#42f5c8',
  receptionist: '#3ba3ff',
  nurse: '#ff7a94',
  lab_technician: '#f6b04d',
  doctor: '#8f95ff',
  dmo: '#42f5c8',
  patient: '#57e5a8',
}

const roleLabelMap = {
  hospital_admin: 'Hospital Admin',
  receptionist: 'Reception Desk',
  nurse: 'Nurse',
  lab_technician: 'Lab Technician',
  doctor: 'Doctor',
  dmo: 'District Medical Officer',
  patient: 'Patient',
}

export default function Sidebar({ open, setOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = roleNavMap[user?.role] || []
  const accent = roleAccentMap[user?.role] || '#42f5c8'

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate('/login', { replace: true })
  }

  const sidebarBody = (
    <motion.aside
      initial={{ x: -28, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -24, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="app-surface flex h-full w-[272px] flex-col rounded-none border-l-0 border-t-0 border-b-0 lg:rounded-[28px] lg:border lg:border-slate-200/80"
    >
      <div className="border-b border-slate-200 px-5 py-5">
        <div className="mb-5 flex items-center justify-between lg:hidden">
          <div className="metric-chip">Menu</div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-soft"
            style={{ background: `linear-gradient(135deg, ${accent}, rgba(255,255,255,0.16))` }}
          >
            <Activity size={20} className="text-slate-950" />
          </div>
          <div>
            <div className="font-display text-xl font-bold tracking-tight text-slate-900">MediTrack</div>
            <div className="text-xs text-slate-500">Disease intelligence network</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,rgba(243,248,252,0.95),rgba(236,244,250,0.92))] p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-slate-950"
              style={{ background: `linear-gradient(135deg, ${accent}, rgba(255,255,255,0.2))` }}
            >
              {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{user?.fullName || user?.email}</p>
              <p className="truncate text-xs text-slate-500">{roleLabelMap[user?.role] || user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pb-4">
        <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Navigation</div>
        <nav className="space-y-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              {({ isActive }) => (
                <div
                  className={cn(
                    'group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-sm transition-all duration-200',
                    isActive
                      ? 'border-sky-200 bg-[linear-gradient(135deg,rgba(224,242,254,0.85),rgba(236,253,245,0.75))] text-slate-900'
                      : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-[#f3f8fc] hover:text-slate-900'
                  )}
                >
                  {isActive ? (
                    <motion.div
                      layoutId="active-sidebar-pill"
                      className="absolute inset-0 rounded-2xl"
                      style={{ background: `linear-gradient(90deg, ${accent}22, transparent)` }}
                    />
                  ) : null}
                  <div
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-[#fbfdff]"
                    style={isActive ? { boxShadow: `inset 0 0 0 1px ${accent}33` } : undefined}
                  >
                    <Icon size={17} color={isActive ? accent : undefined} />
                  </div>
                  <span className="relative font-medium">{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-[#f9fcfe] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#f1f7fc]"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </motion.aside>
  )

  return (
    <>
      <div className="hidden lg:block lg:w-[272px] lg:flex-shrink-0">{sidebarBody}</div>

      <div className="lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="fixed left-4 top-4 z-40 rounded-2xl border border-slate-200 bg-[#f9fcfe] p-3 text-slate-800 shadow-sm backdrop-blur-xl"
        >
          <Menu size={18} />
        </button>

        <AnimatePresence>
          {open ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-slate-900/20 backdrop-blur-sm"
                onClick={() => setOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 z-[80]">{sidebarBody}</div>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  )
}
