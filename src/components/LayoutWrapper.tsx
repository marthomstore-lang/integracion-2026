'use client';
import { usePathname } from 'next/navigation';
import Sidebar from "./Sidebar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login' || (typeof window !== 'undefined' && window.location.pathname === '/login');
  console.log(`LayoutWrapper render: pathname=${pathname} isLoginPage=${isLoginPage} windowPath=${typeof window !== 'undefined' ? window.location.pathname : 'server'}`);

  return (
    <div className="app-container">
      {!isLoginPage && <Sidebar />}
      <main 
        className="main-content" 
        style={{ 
          marginLeft: isLoginPage ? 0 : undefined,
          padding: isLoginPage ? 0 : undefined 
        }}
      >
        {children}
      </main>
    </div>
  );
}
