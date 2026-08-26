import { ReactNode } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { ThemeToggle } from './ThemeToggle';
import logo from '../assets/logo.png';

interface SidebarItem {
  key: string;
  label: string;
  icon: string;
}

interface SidebarLayoutProps {
  children: ReactNode;
  items: SidebarItem[];
  activeItem: string;
  onItemSelect: (key: string) => void;
  title: string;
  subtitle: string;
  gradient: string;
  icon: ReactNode;
}

export function SidebarLayout({
  children,
  items,
  activeItem,
  onItemSelect,
  title: _title,
  subtitle,
  gradient,
  icon: _icon,
}: SidebarLayoutProps) {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex bg-logo">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--bg-card)] border-r border-[var(--border-primary)] flex flex-col fixed h-full">
        {/* Logo / Brand */}
        <div className="p-6 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Vision One"
              className="w-10 h-10 rounded-xl object-contain"
            />
            <div>
              <h1 className="font-bold text-[var(--text-primary)]">Vision Therapy</h1>
              <p className="text-xs text-[var(--text-tertiary)]">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => onItemSelect(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeItem === item.key
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-[var(--border-primary)]">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-semibold text-sm`}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
