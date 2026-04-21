import { useAuth } from '@/features/auth/auth-context';
import { cn } from '@/shared/utils/cn';
import { Film, LayoutDashboard, LogOut, MonitorPlay, Settings } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router';

const NAV_ITEMS = [
  { label: 'Playlist', path: '/admin/playlist', icon: LayoutDashboard },
  { label: 'Media Library', path: '/admin/media', icon: Film },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
] as const;

export function AdminSidebar() {
  const { clearToken } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate('/');
  }

  return (
    <aside className="w-64 border-r border-neutral-800 bg-neutral-900 flex flex-col shrink-0">
      <div className="p-6 border-b border-neutral-800 flex flex-col items-center">
        <img src="/pcmacs.svg" alt="PC Macs" className="w-36 mb-2" />
        <span className="text-xs tracking-widest uppercase text-neutral-500 font-semibold">
          Signage Control
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all border',
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border-blue-600/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800 border-transparent',
              )
            }
          >
            <item.icon className="h-5 w-5 mr-3 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-800 space-y-1">
        <NavLink
          to="/display"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all"
        >
          <MonitorPlay className="h-5 w-5 mr-3" />
          Launch Display
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent transition-all"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
