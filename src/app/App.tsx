import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { UserPage } from './pages/UserPage';
import { AdminPage } from './pages/AdminPage';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl font-black text-gray-200 mb-4">404</p>
        <h1 className="text-xl font-bold text-gray-700 mb-2">Page Not Found</h1>
        <a href="/" className="text-blue-600 hover:underline text-sm">← Back to Stall Map</a>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    Component: UserPage,
  },
  {
    path: '/admin',
    Component: AdminPage,
  },
  {
    path: '*',
    Component: NotFoundPage,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
