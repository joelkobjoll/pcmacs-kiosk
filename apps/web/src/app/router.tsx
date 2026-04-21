import { LoginPage } from '@/features/auth/pages/login-page';
import { SetupPage } from '@/features/auth/pages/setup-page';
import { DisplayPage } from '@/features/display/pages/display-page';
import { MediaPage } from '@/features/media/pages/media-page';
import { PlaylistPage } from '@/features/playlist/pages/playlist-page';
import { SettingsPage } from '@/features/settings/pages/settings-page';
import { AdminLayout } from '@/shared/components/layout/admin-layout';
import { Navigate, createBrowserRouter } from 'react-router';
import { AuthGuard } from './auth-guard';
import { SetupGuard } from './setup-guard';

export const router = createBrowserRouter([
  {
    path: '/setup',
    element: <SetupPage />,
  },
  {
    path: '/display',
    element: <DisplayPage />,
  },
  {
    path: '/',
    element: <SetupGuard />,
    children: [
      { index: true, element: <LoginPage /> },
      {
        element: <AuthGuard />,
        children: [
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="/admin/playlist" replace /> },
              { path: 'playlist', element: <PlaylistPage /> },
              { path: 'media', element: <MediaPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
