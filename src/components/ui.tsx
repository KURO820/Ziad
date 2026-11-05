import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-navy-50 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-turquoise-500 to-turquoise-700 flex items-center justify-center animate-pulse-slow">
          <Spinner size={28} className="text-white" />
        </div>
      </div>
      <p className="text-navy-500 font-medium">{message}</p>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-6 ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
        {subtitle && <p className="text-navy-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-navy-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-navy-400" />
      </div>
      <h3 className="text-lg font-semibold text-navy-700">{title}</h3>
      {description && <p className="text-navy-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, trend, color = 'turquoise' }: { label: string; value: string | number; icon: React.ElementType; trend?: string; color?: 'turquoise' | 'navy' | 'accent' | 'red' | 'blue' }) {
  const colorMap = {
    turquoise: 'bg-turquoise-50 text-turquoise-600',
    navy: 'bg-navy-100 text-navy-600',
    accent: 'bg-accent-50 text-accent-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        {trend && <span className="text-xs font-medium text-turquoise-600">{trend}</span>}
      </div>
      <p className="text-2xl font-bold text-navy-900">{value}</p>
      <p className="text-sm text-navy-400 mt-0.5">{label}</p>
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; maxWidth?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative card w-full ${maxWidth} max-h-[90vh] overflow-y-auto scrollbar-thin animate-scale-in`}>
        <div className="flex items-center justify-between p-6 border-b border-navy-100">
          <h2 className="text-lg font-bold text-navy-900">{title}</h2>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-700 transition-colors p-1 rounded-lg hover:bg-navy-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error' | 'info'; onClose: () => void }) {
  const colors = {
    success: 'bg-turquoise-600',
    error: 'bg-red-500',
    info: 'bg-navy-800',
  };
  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-down">
      <div className={`${colors[type]} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm`}>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; danger?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-navy-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { className: string; label: string }> = {
    active: { className: 'badge-success', label: 'Active' },
    suspended: { className: 'badge-danger', label: 'Suspended' },
    expired: { className: 'badge-warning', label: 'Expired' },
    pending: { className: 'badge-warning', label: 'Pending' },
    confirmed: { className: 'badge-success', label: 'Confirmed' },
    completed: { className: 'badge-info', label: 'Completed' },
    cancelled: { className: 'badge-danger', label: 'Cancelled' },
    open: { className: 'badge-warning', label: 'Open' },
    investigating: { className: 'badge-info', label: 'Investigating' },
    resolved: { className: 'badge-success', label: 'Resolved' },
    dismissed: { className: 'badge-neutral', label: 'Dismissed' },
    verified: { className: 'badge-success', label: 'Verified' },
    mismatch: { className: 'badge-danger', label: 'Mismatch' },
    not_found: { className: 'badge-warning', label: 'Not Found' },
  };
  const cfg = map[status] || { className: 'badge-neutral', label: status };
  return <span className={cfg.className}>{cfg.label}</span>;
}
