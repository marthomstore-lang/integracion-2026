'use client';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';

function ReportsMenu({ pathname, isCollapsed }: { pathname: string, isCollapsed: boolean }) {
  const searchParams = useSearchParams();
  const type = searchParams?.get('type');
  
  const [reportsOpen, setReportsOpen] = useState(false);

  useEffect(() => {
    if (pathname?.includes('/informe') || 
        pathname?.includes('/plan-tea') || 
        pathname?.includes('/formulario-unico') ||
        pathname === '/informes') {
      setReportsOpen(true);
    }
  }, [pathname]);

  if (isCollapsed) {
    const isAnyActive = pathname?.includes('/informe') || 
                        pathname?.includes('/plan-tea') || 
                        pathname?.includes('/formulario-unico') ||
                        pathname === '/informes';
    return (
      <Link href="/informes" className="sidebar-link" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.875rem',
        borderRadius: '12px',
        color: isAnyActive ? 'white' : 'rgba(255,255,255,0.6)',
        textDecoration: 'none',
        background: isAnyActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent'
      }}>
        <span style={{ fontSize: '1.25rem' }}>📄</span>
      </Link>
    );
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button 
        onClick={() => setReportsOpen(!reportsOpen)}
        className="sidebar-link"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.875rem 1.25rem',
          borderRadius: '12px',
          backgroundColor: 'transparent',
          color: 'rgba(255,255,255,0.6)',
          transition: 'all 0.2s',
          fontWeight: 500,
          fontSize: '0.9375rem',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.25rem', filter: 'grayscale(100%) opacity(0.6)' }}>📄</span>
          Gestión Informes
        </div>
        <span style={{ fontSize: '0.75rem', transition: 'transform 0.3s', transform: reportsOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
      </button>
      
      {reportsOpen && (
        <div style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
          <SidebarSubLink 
            href="/informes?type=familia" 
            label="Informe Familia" 
            active={(pathname === '/informes' && type === 'familia') || pathname?.includes('/informe/')} 
          />
          <SidebarSubLink 
            href="/informes?type=tea" 
            label="Plan Manejo Individual (PAEC)" 
            active={(pathname === '/informes' && type === 'tea') || pathname?.includes('/plan-tea/')} 
          />
          <SidebarSubLink 
            href="/informes?type=unico" 
            label="Formulario Único PIE" 
            active={(pathname === '/informes' && type === 'unico') || pathname?.includes('/formulario-unico/')} 
          />
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string, role: string } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split('; ').reduce((acc: any, curr) => {
      const [name, value] = curr.split('=');
      acc[name] = value;
      return acc;
    }, {});

    if (cookies.user_role) {
      setUser({ name: decodeURIComponent(cookies.user_name || 'Usuario'), role: cookies.user_role });
    } else if (pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, router]);

  useEffect(() => {
    const container = document.querySelector('.app-container');
    if (container) {
      container.setAttribute('data-sidebar-collapsed', isCollapsed.toString());
    }
  }, [isCollapsed]);

  const handleLogout = () => {
    document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "user_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/login');
  };

  if (pathname === '/login') return null;

  const isAdmin = user?.role === 'admin';

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      backgroundColor: 'var(--sidebar)',
      color: 'white',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      padding: isCollapsed ? '1.5rem 0.5rem' : '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: 40, 
            height: 32, 
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
            borderRadius: 8, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
            fontSize: '0.6rem'
          }}>
            PIE
          </div>
          {!isCollapsed && <span style={{ letterSpacing: '-0.025em', fontSize: '1.2rem' }}>PIE26.com</span>}
        </div>
        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(true)} 
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem' }}
          >
            ◀
          </button>
        )}
      </div>

      {isCollapsed && (
        <button 
          onClick={() => setIsCollapsed(false)}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: 'none', 
            color: 'white', 
            padding: '0.5rem', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            marginBottom: '2rem',
            alignSelf: 'center',
            width: '100%'
          }}
        >
          ▶
        </button>
      )}

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: isCollapsed ? '0' : '2rem' }}>
        {isAdmin && <SidebarLink href="/" label="Dashboard" icon="📊" active={pathname === '/'} isCollapsed={isCollapsed} />}
        {isAdmin && <SidebarLink href="/alumnos" label="Estudiantes" icon="👥" active={pathname === '/alumnos'} isCollapsed={isCollapsed} />}
        
        <Suspense fallback={null}>
          <ReportsMenu pathname={pathname} isCollapsed={isCollapsed} />
        </Suspense>

        {isAdmin && <SidebarLink href="/config" label="Configuración" icon="⚙️" active={pathname === '/config'} isCollapsed={isCollapsed} />}
      </nav>

      <div style={{ 
        marginTop: 'auto', 
        padding: isCollapsed ? '0.5rem' : '1rem', 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: isAdmin ? 'var(--primary)' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem' }}>
            {user?.name.substring(0, 1).toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.6rem', opacity: 0.6, textTransform: 'uppercase' }}>{user?.role}</p>
              <p style={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name}</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              padding: '0.4rem', 
              fontSize: '0.7rem', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.1)', 
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Salir
          </button>
        )}
      </div>
    </aside>
  );
}

function SidebarLink({ href, label, icon, active = false, isCollapsed }: { href: string, label: string, icon: string, active?: boolean, isCollapsed: boolean }) {
  return (
    <Link href={href} style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: isCollapsed ? 'center' : 'flex-start',
      gap: isCollapsed ? '0' : '1rem',
      padding: '0.875rem',
      borderRadius: '12px',
      backgroundColor: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
      color: active ? 'white' : 'rgba(255,255,255,0.6)',
      textDecoration: 'none',
      transition: 'all 0.2s'
    }}>
      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
      {!isCollapsed && <span style={{ fontSize: '0.9rem', fontWeight: active ? 600 : 500 }}>{label}</span>}
    </Link>
  );
}

function SidebarSubLink({ href, label, active = false }: { href: string, label: string, active?: boolean }) {
  return (
    <Link href={href} style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0.5rem 0.75rem',
      borderRadius: '8px',
      color: active ? 'white' : 'rgba(255,255,255,0.4)',
      fontSize: '0.8rem',
      textDecoration: 'none',
      transition: 'all 0.2s',
      background: active ? 'rgba(255,255,255,0.05)' : 'transparent'
    }}>
      <span style={{ marginRight: '0.5rem' }}>{active ? '●' : '○'}</span>
      {label}
    </Link>
  );
}
