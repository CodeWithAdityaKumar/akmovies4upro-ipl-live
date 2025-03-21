"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is authenticated
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken && pathname !== '/admin/login') {
      setIsAuthenticated(true);
    } else if (!adminToken && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
    setIsLoading(false);
  }, [pathname, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Login page doesn't need the admin layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-500">IPL Admin</h1>
          <p className="text-gray-400 text-sm">Manage your streaming platform</p>
        </div>
        
        <nav className="space-y-1">
          <NavLink href="/admin/dashboard" currentPath={pathname}>Dashboard</NavLink>
          <NavLink href="/admin/matches" currentPath={pathname}>Matches</NavLink>
          <NavLink href="/admin/streams" currentPath={pathname}>Live Streams</NavLink>
          <NavLink href="/admin/teams" currentPath={pathname}>Teams</NavLink>
          <NavLink href="/admin/settings" currentPath={pathname}>Settings</NavLink>
        </nav>
        
        <div className="mt-auto pt-8">
          <button
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded text-white"
            onClick={() => {
              localStorage.removeItem('adminToken');
              router.push('/admin/login');
            }}
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
}

// Navigation link component
function NavLink({ href, children, currentPath }) {
  const isActive = currentPath === href || (href !== '/admin/dashboard' && currentPath.startsWith(href));
  
  return (
    <Link 
      href={href}
      className={`block py-2 px-4 rounded ${isActive 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-300 hover:bg-gray-700'}`}
    >
      {children}
    </Link>
  );
}
