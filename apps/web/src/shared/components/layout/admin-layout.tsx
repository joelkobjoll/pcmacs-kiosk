import { Outlet, useLocation } from 'react-router';
import { AdminSidebar } from './admin-sidebar';

const ROUTE_TITLES: Record<string, string> = {
  '/admin/playlist': 'Playlist Editor',
  '/admin/media': 'Media Library',
  '/admin/settings': 'Player Settings',
};

function PageTitle() {
  const { pathname } = useLocation();
  const title = ROUTE_TITLES[pathname] ?? 'Admin Dashboard';
  return <h1 className="text-lg font-semibold text-white">{title}</h1>;
}

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-200 overflow-hidden">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur flex items-center px-8">
          <PageTitle />
        </header>

        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
