'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
// Removed fallbackStudents import to ensure empty state when no data exists

export default function AlumnosPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('Todos');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/students');
        const result = await response.json();
        if (result.success && result.data) {
          setStudents(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch students:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const courses = ['Todos', ...Array.from(new Set(students.map(s => s.curso).filter(Boolean)))];

  const filteredStudents = students.filter(student => {
    const name = (student.full_name || `${student.apellidos}, ${student.nombres}`).toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || student.run.includes(searchTerm);
    const matchesCourse = courseFilter === 'Todos' || student.curso === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const stats = {
    total: students.length,
    neet: students.filter(s => s.nee === 'NEET').length,
    neep: students.filter(s => s.nee === 'NEEP').length,
    completed: students.filter(s => s.status_informe === 'COMPLETE').length
  };

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <span>Comunidad Educativa</span>
            <span>/</span>
            <span style={{ color: 'var(--text-muted)' }}>Estudiantes</span>
          </div>
          <h1>Nómina de Estudiantes</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión centralizada de matrículas y diagnósticos NEE.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/config" className="btn" style={{ border: '1px solid var(--border)', background: 'white' }}>
            ⚙️ Configurar
          </Link>
          <Link href="/config" className="btn btn-primary">
            + Nuevo Estudiante
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      {students.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <StatCard label="Total Estudiantes" value={stats.total} icon="👥" color="var(--primary)" />
            <StatCard label="Casos NEET" value={stats.neet} icon="📘" color="#0ea5e9" />
            <StatCard label="Casos NEEP" value={stats.neep} icon="📙" color="#f59e0b" />
            <StatCard label="Informes Listos" value={stats.completed} icon="✅" color="var(--success)" />
          </div>

          {/* Filters */}
          <div className="card glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', padding: '1.25rem 2rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
              <input 
                type="text" 
                placeholder="Buscar por nombre o RUT..." 
                className="select-input"
                style={{ width: '100%', paddingLeft: '2.75rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="select-input" 
              style={{ width: '200px' }}
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              {courses.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
            </select>
          </div>
        </>
      )}

      <div className="table-container shadow-lg">
        <table>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>RUN</th>
              <th>Curso</th>
              <th>Diagnóstico</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '4rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                  <p style={{ color: 'var(--text-muted)' }}>Cargando nómina de estudiantes...</p>
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '4rem' }}>
                  <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>No se encontraron estudiantes</p>
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => (
                <tr key={student.run} style={{ animationDelay: `${index * 0.05}s` }} className="animate-in">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ 
                        width: 42, 
                        height: 42, 
                        borderRadius: 12, 
                        background: index % 2 === 0 ? 'var(--primary-light)' : '#f3e8ff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: 700, 
                        color: index % 2 === 0 ? 'var(--primary)' : '#a855f7',
                        fontSize: '1.125rem'
                      }}>
                        {(student.full_name || student.apellidos || '?').charAt(0)}
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {student.full_name || `${student.apellidos}, ${student.nombres}`}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{student.run}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: 8, 
                      backgroundColor: '#f1f5f9',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#475569'
                    }}>
                      {student.curso}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: 6, 
                      backgroundColor: student.nee === 'NEEP' ? '#fef3c7' : '#e0f2fe',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: student.nee === 'NEEP' ? '#92400e' : '#0369a1'
                    }}>
                      {student.nee || 'S/I'}
                    </span>
                  </td>
                  <td>
                    <div className={`status-pill ${student.status_informe === 'COMPLETE' ? 'status-complete' : 'status-pending'}`}>
                      {student.status_informe === 'COMPLETE' ? '● Completo' : '○ Pendiente'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <Link 
                        href={`/informes?run=${student.run}`} 
                        className="action-btn"
                        title="Ver Informes"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'white',
                          border: '1px solid var(--border)',
                          color: 'var(--primary)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </Link>
                      <Link 
                        href={`/alumnos/${student.id}/edit`}
                        className="action-btn"
                        title="Editar Estudiante"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'white',
                          border: '1px solid var(--border)',
                          color: 'var(--secondary)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)',
                          textDecoration: 'none'
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(99, 102, 241, 0.1);
          border-left-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border-color: var(--primary);
          background-color: var(--primary-light) !important;
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: number, icon: string, color: string }) {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
      <div style={{ 
        width: 48, 
        height: 48, 
        borderRadius: 14, 
        backgroundColor: `${color}15`, 
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem'
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>{value}</p>
      </div>
    </div>
  );
}
