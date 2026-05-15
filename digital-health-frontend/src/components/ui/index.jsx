import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
}

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[linear-gradient(135deg,#0ea5e9,#14b8a6)] text-white shadow-[0_14px_28px_rgba(14,165,233,0.22)] hover:-translate-y-0.5',
        secondary: 'border border-slate-200 bg-[#f9fcfe] text-slate-700 hover:bg-[#f1f7fc]',
        ghost: 'text-slate-600 hover:bg-[#eef5fa] hover:text-slate-900',
        danger: 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
        blue: 'bg-[linear-gradient(135deg,#2563eb,#0ea5e9)] text-white shadow-[0_14px_28px_rgba(37,99,235,0.20)] hover:-translate-y-0.5',
      },
      size: {
        sm: 'h-10 px-4 text-xs',
        md: 'h-11 px-5',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export function Card({ children, className, style = {}, glass = false }) {
  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        'relative overflow-hidden rounded-[24px] border border-slate-200 shadow-panel',
        glass
          ? 'bg-[#f8fbfe]/88 backdrop-blur-2xl'
          : 'bg-[linear-gradient(180deg,rgba(248,251,254,0.98),rgba(241,247,252,0.96))]',
        className
      )}
      style={style}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />
      {children}
    </motion.div>
  )
}

export function StatCard({ label, value, icon: Icon, accent = 'var(--accent-primary)', change, suffix = '', className }) {
  return (
    <Card className={cn('p-5 sm:p-6', className)}>
      <div className="absolute -right-8 top-0 h-24 w-24 rounded-full blur-3xl" style={{ background: accent, opacity: 0.18 }} />
      <div className="flex min-h-[138px] items-start justify-between gap-4">
        <div className="flex flex-1 flex-col justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <div className="flex items-end gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{value}</span>
            {suffix ? <span className="pb-1 text-sm text-slate-500">{suffix}</span> : null}
          </div>
          {change !== undefined ? (
            <div className={cn('text-xs font-semibold', change >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
              {change >= 0 ? 'Up' : 'Down'} {Math.abs(change)}% vs last week
            </div>
          ) : (
            <div className="text-xs text-slate-500">Updated from live surveillance streams</div>
          )}
        </div>
        {Icon ? (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-[#f1f7fc]"
            style={{ boxShadow: `inset 0 0 0 1px ${accent}20` }}
          >
            <Icon size={20} color={accent} />
          </div>
        ) : null}
      </div>
    </Card>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  style = {},
  disabled = false,
  type = 'button',
  icon: Icon,
  loading = false,
  className,
  asChild = false,
}) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      type={asChild ? undefined : type}
      onClick={onClick}
      disabled={asChild ? undefined : disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      style={style}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </Comp>
  )
}

export function FormField({ label, children, error, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {label ? <label>{label}</label> : null}
      {children}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  )
}

export function SectionHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon ? (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-[#f1f7fc] text-slate-400">
          <Icon size={28} />
        </div>
      ) : null}
      <h3 className="font-display text-lg font-semibold text-slate-900">{title}</h3>
      {subtitle ? <p className="mt-2 max-w-md text-sm text-slate-500">{subtitle}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function LoadingSpinner({ size = 44, label = 'Loading analytics...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <div
        className="rounded-full border-2 border-slate-200 border-t-sky-500 animate-spin"
        style={{ width: size, height: size }}
      />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

export function LoadingSkeleton({ className }) {
  return <div className={cn('animate-pulse rounded-2xl bg-[#e8f0f6]', className)} />
}

export function SkeletonGrid({ cards = 4 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: cards }).map((_, index) => (
        <Card key={index} className="p-5">
          <LoadingSkeleton className="mb-4 h-3 w-28" />
          <LoadingSkeleton className="mb-4 h-10 w-24" />
          <LoadingSkeleton className="h-3 w-36" />
        </Card>
      ))}
    </div>
  )
}

export function Modal({ open, onClose, title, children, width = '680px' }) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-slate-900/20 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[100] max-h-[88vh] w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,251,254,0.99),rgba(241,247,252,0.98))] shadow-[0_30px_80px_rgba(15,23,42,0.14)] data-[state=open]:animate-in data-[state=closed]:animate-out"
          style={{ maxWidth: width }}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <Dialog.Title className="font-display text-lg font-semibold text-slate-900">{title}</Dialog.Title>
            <Dialog.Close className="rounded-full border border-slate-200 bg-[#f9fcfe] p-2 text-slate-500 transition hover:text-slate-900">
              <X size={16} />
            </Dialog.Close>
          </div>
          <div className="max-h-[calc(88vh-72px)] overflow-y-auto px-6 py-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function AlertBanner({ type = 'info', message }) {
  const iconMap = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
  }

  const palette = {
    info: 'border-sky-200 bg-sky-50 text-sky-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
  }

  const Icon = iconMap[type] || Info

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm', palette[type] || palette.info)}
    >
      <Icon size={16} />
      <span>{message}</span>
    </motion.div>
  )
}

export function PageSection({ eyebrow, title, description, actions, children, className }) {
  return (
    <Card className={cn('p-5 sm:p-6', className)}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">{eyebrow}</p> : null}
          <h3 className="font-display text-xl font-bold tracking-tight text-slate-900">{title}</h3>
          {description ? <p className="max-w-2xl text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </Card>
  )
}
