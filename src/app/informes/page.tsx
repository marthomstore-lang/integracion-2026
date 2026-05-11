'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import fallbackStudents from '@/data/students.json';


function InformesContent() {
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<any[]>([]);
  const [filterCourse, setFilterCourse] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const typeParam = searchParams?.get('type');
  const runParam = searchParams?.get('run');

  // Derive filterType directly from URL to ensure instant updates
  const filterType = typeParam === 'tea' ? 'PAEC' : 
                    typeParam === 'familia' ? 'Familia' : 
                    typeParam === 'unico' ? 'Único' : 'Todos';

  useEffect(() => {
    if (runParam) setSearchQuery(runParam);

    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/students');
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          setStudents(result.data);
        } else {
          setStudents(fallbackStudents);
        }
      } catch (error) {
        console.error('Failed to fetch students:', error);
        setStudents(fallbackStudents);
      }
    };
    fetchStudents();
  }, [runParam]);

  const courses = Array.from(new Set(students.map(s => s.curso || s.course))).filter(Boolean);

  const filteredStudents = students.filter(student => {
    const nameMatch = (student.full_name || `${student.nombres} ${student.apellidos}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
                     student.run.toLowerCase().includes(searchQuery.toLowerCase());
    const courseMatch = filterCourse === 'Todos' || (student.curso || student.course) === filterCourse;
    const statusMatch = filterStatus === 'Todos' || 
                       (filterStatus === 'Completo' && (student.status_informe || student.estado) === 'COMPLETE') ||
                       (filterStatus === 'Pendiente' && (student.status_informe || student.estado) !== 'COMPLETE');
    
    return nameMatch && courseMatch && statusMatch;
  });

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            {filterType === 'Todos' ? '📄 Gestión de Informes' : filterType === 'PAEC' ? '📄 Plan de Manejo Individual (PAEC)' : `📄 Informe ${filterType}`}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>
            {filterType === 'Todos' 
              ? 'Administración y seguimiento de documentos técnicos PIE.' 
              : `Listado de estudiantes para generar o editar el ${filterType === 'PAEC' ? 'Plan de Manejo Individual' : `Informe de ${filterType}`}.`}
          </p>
        </div>
        {filterType !== 'Todos' && (
          <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.875rem' }}>
            MODO: {filterType.toUpperCase()}
          </div>
        )}
      </header>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="card glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Estudiantes</p>
          <p style={{ fontSize: '2rem', fontWeight: 800 }}>{students.length}</p>
        </div>
        <div className="card glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Completados</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>
            {students.filter(s => (s.status_informe || s.estado) === 'COMPLETE').length}
          </p>
        </div>
        <div className="card glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pendientes</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>
            {students.filter(s => (s.status_informe || s.estado) !== 'COMPLETE').length}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card glass-card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', padding: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>BUSCAR ESTUDIANTE</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Nombre o RUN..." 
              className="select-input"
              style={{ width: '100%', paddingLeft: '2.75rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div style={{ width: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>CURSO</label>
          <select className="select-input" style={{ width: '100%' }} value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
            <option>Todos</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ width: '200px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>ESTADO</label>
          <select className="select-input" style={{ width: '100%' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option>Todos</option>
            <option>Completo</option>
            <option>Pendiente</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="table-container shadow-lg">
        <table>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Curso</th>
              <th>Última Actualización</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? filteredStudents.map((student, index) => (
              <tr key={student.id || student.run} style={{ animationDelay: `${index * 0.05}s` }}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {student.full_name || `${student.apellidos}, ${student.nombres}`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{student.run}</div>
                </td>
                <td>{student.curso || student.course}</td>
                <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {student.created_at ? new Date(student.created_at).toLocaleDateString() : '31/03/2025'}
                </td>
                <td>
                  <div className={`status-pill ${(student.status_informe || student.estado) === 'COMPLETE' ? 'status-complete' : 'status-pending'}`}>
                    {(student.status_informe || student.estado) === 'COMPLETE' ? '● COMPLETO' : '○ PENDIENTE'}
                  </div>
                </td>
                <td style={{ width: '320px' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    {(filterType === 'Todos' || filterType === 'Familia') && (
                      <Link 
                        href={`/informe/${student.id}`} 
                        className="btn" 
                        style={{ 
                          padding: '0.35rem 0.6rem', 
                          fontSize: '0.7rem', 
                          background: filterType === 'Familia' ? 'var(--primary)' : 'var(--primary-light)', 
                          color: filterType === 'Familia' ? 'white' : 'var(--primary)',
                          fontWeight: 700,
                          border: '1px solid var(--primary-light)',
                          flex: filterType === 'Familia' ? 1 : 'none'
                        }}
                      >
                        {filterType === 'Familia' ? '+ AGREGAR INFORME FAMILIA' : 'FAMILIA'}
                      </Link>
                    )}
                    {(filterType === 'Todos' || filterType === 'PAEC') && (
                      <Link 
                        href={`/plan-tea/${student.id}`} 
                        className="btn" 
                        style={{ 
                          padding: '0.35rem 0.6rem', 
                          fontSize: '0.7rem', 
                          background: filterType === 'PAEC' ? '#7c3aed' : '#f5f3ff', 
                          color: filterType === 'PAEC' ? 'white' : '#7c3aed',
                          fontWeight: 700,
                          border: '1px solid #ddd6fe',
                          flex: filterType === 'PAEC' ? 1 : 'none'
                        }}
                      >
                        {filterType === 'PAEC' ? '+ AGREGAR PLAN PAEC' : 'PAEC'}
                      </Link>
                    )}

                    {(filterType === 'Todos' || filterType === 'Único') && (
                      <Link 
                        href={`/formulario-unico/${student.id}`} 
                        className="btn" 
                        style={{ 
                          padding: '0.35rem 0.6rem', 
                          fontSize: '0.7rem', 
                          background: filterType === 'Único' ? '#475569' : '#f1f5f9', 
                          color: filterType === 'Único' ? 'white' : '#475569',
                          fontWeight: 700,
                          border: '1px solid #e2e8f0',
                          flex: filterType === 'Único' ? 1 : 'none'
                        }}
                      >
                        {filterType === 'Único' ? '+ AGREGAR FORMULARIO PIE' : 'SÍNTESIS'}
                      </Link>
                    )}
                  </div>
                </td>

              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  No se encontraron estudiantes con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default function InformesList() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Cargando filtros...</div>}>
      <InformesContent />
    </Suspense>
  );
}

