import { type ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const navByRole: Record<UserRole, NavItem[]> = {
  traveler: [
    { label: 'Dashboard', path: '/traveler', icon: LayoutDashboard },
    { label: 'My Identity', path: '/traveler/identity', icon: IdCard },
    { label: 'Scan Passport', path: '/traveler/scan', icon: ScanLine },
    { label: 'My Trips', path: '/traveler/trips', icon: Plane },
    { label: 'Verification History', path: '/traveler/verifications', icon: ShieldCheck },
    { label: 'Settings', path: '/traveler/settings', icon: Settings },
  ],
  business: [
    { label: 'Dashboard', path: '/business', icon: LayoutDashboard },
    { label: 'Scan & Verify', path: '/business/scan', icon: ScanLine },
    { label: 'Bookings', path: '/business/bookings', icon: Calendar },
    { label: 'Verification History', path: '/business/verifications', icon: ShieldCheck },
    { label: 'Mismatch Reports', path: '/business/reports', icon: AlertTriangle },
    { label: 'Settings', path: '/business/settings', icon: Settings },
  ],
  admin: [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Bookings', path: '/admin/bookings', icon: Calendar },
    { label: 'Verifications', path: '/admin/verifications', icon: ShieldCheck },
    { label: 'Mismatch Reports', path: '/admin/reports', icon: AlertTriangle },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ],
};

import {
  LayoutDashboard, IdCard, ScanLine, Plane, ShieldCheck, Settings,
  Calendar, AlertTriangle, Users,
} from 'lucide-react';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!profile) return null;

  const navItems = navByRole[profile.role] || [];
  const roleLabel = profile.role.charAt(0).toUpperCase() + profile.role.slice(1) + ' Portal';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === `/${profile.role}`) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-navy-50 flex">
      {/* Sidebar - Desktop */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-navy-900 text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-white/10">
          <Logo light size="md" />
        </div>

        <div className="px-6 py-4 border-b border-white/10">
          <p className="text-xs font-medium text-turquoise-400 tracking-wider uppercase">{roleLabel}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-turquoise-600 text-white shadow-lg shadow-turquoise-600/20'
                    : 'text-navy-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-navy-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-navy-900/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-navy-100">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-navy-50 text-navy-600"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="hidden lg:block">
              <p className="text-sm text-navy-400">Welcome back,</p>
              <p className="text-sm font-semibold text-navy-900">{profile.full_name}</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-navy-50 text-navy-600">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-turquoise-500 rounded-full" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-navy-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center text-white text-sm font-semibold">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown size={16} className="text-navy-400" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 card p-2 z-20 animate-slide-down">
                      <div className="px-3 py-2 border-b border-navy-100 mb-1">
                        <p className="text-sm font-semibold text-navy-900">{profile.full_name}</p>
                        <p className="text-xs text-navy-400 capitalize">{profile.role} account</p>
                      </div>
                      <button
                        onClick={() => { navigate(`/${profile.role}/settings`); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-navy-600 hover:bg-navy-50"
                      >
                        <Settings size={16} />
                        Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
