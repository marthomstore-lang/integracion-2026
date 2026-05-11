'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
// Removed fallbackStudents import to ensure empty state when no data exists

export default function Dashboard() {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<null | any>(null);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    // Auth Check
    const checkAuth = () => {
      const cookies = document.cookie.split('; ');
      const hasRole = cookies.some(c => c.startsWith('user_role='));
      if (!hasRole) {
        window.location.href = '/login';
      } else {
        setLoadingAuth(false);
      }
    };
    checkAuth();

    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/students');
        const result = await response.json();
        if (result.success && result.data) {
          setStudents(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch students:', error);
      }
    };
    fetchStudents();
  }, []);

  if (loadingAuth) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }


  const handleFileUpload = async (e: any) => {
    if (!e.target.files?.[0]) return;
    
    setIsUploading(true);
    setExtractedData(null);

    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const response = await fetch('/api/extract-info', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.data) {
        setIsUploading(false);
        setExtractedData(result.data);
      } else {
        throw new Error(result.error || 'Error en la extracción');
      }
    } catch (error) {
      console.error('Error extracting info:', error);
      setIsUploading(false);
    }
  };

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Gestión de Informes NEE</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem' }}>Plataforma de seguimiento y documentación ministerial 2025</p>
        </div>
        <Link href="/config" className="btn btn-primary" style={{ height: 'fit-content' }}>
          + Nuevo Estudiante
        </Link>
      </header>

      {/* Upload Section */}
      <div className="card glass-card animate-in" style={{ marginBottom: '2.5rem', border: '2px dashed var(--primary)', background: 'rgba(99, 102, 241, 0.05)' }}>
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📥 Extracción Inteligente de Datos</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Sube el Informe Psicopedagógico o FUDEI (PDF/Excel) para pre-completar la ficha.</p>
          
          {!extractedData ? (
            <div 
              style={{ padding: '2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer' }}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              {isUploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div className="spinner"></div>
                  <p>Analizando documento y extrayendo campos...</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Haz clic o arrastra un archivo aquí</p>
                  <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>Formatos soportados: .pdf, .xlsx, .csv</p>
                </div>
              )}
              <input type="file" id="file-upload" hidden onChange={handleFileUpload} />
            </div>
          ) : (
            <div className="animate-in" style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius)', textAlign: 'left', border: '1px solid var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ color: 'var(--success)' }}>✅ Información Extraída con Éxito</h4>
                <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setExtractedData(null)}>Limpiar</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                <div><strong>Nombre:</strong> {extractedData.name}</div>
                <div><strong>RUT:</strong> {extractedData.run}</div>
                <div><strong>Curso:</strong> {extractedData.course}</div>
                <div><strong>Diagnóstico:</strong> {extractedData.diagnostico}</div>
              </div>
              <Link href="/informe/new" className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>
                Crear Informe con estos Datos
              </Link>
            </div>
          )}
        </div>
      </div>

      {students.length > 0 && (
        <div className="card glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
            <select className="select-input">
              <option>Todos los Cursos</option>
              <option>8º Básico A</option>
              <option>3º Básico A</option>
            </select>
            <select className="select-input">
              <option>Todas las Etapas</option>
              <option>Ingreso</option>
              <option>Reevaluación</option>
            </select>
          </div>
          <div style={{ position: 'relative', width: '350px' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input 
              type="text" 
              placeholder="Buscar por nombre o RUT..." 
              className="select-input"
              style={{ width: '100%', paddingLeft: '2.75rem' }}
            />
          </div>
        </div>
      )}

      <div className="table-container shadow-lg">
        {students.length === 0 ? (
          <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>👥</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No hay estudiantes registrados</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 2rem' }}>
              Comienza cargando la nómina de estudiantes desde la configuración o usa la extracción inteligente arriba.
            </p>
            <Link href="/config" className="btn btn-primary">
              Ir a Configuración
            </Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>RUN</th>
                <th>NEE</th>
                <th>Estado de Informe</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id || student.run} style={{ animationDelay: `${index * 0.05}s` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                        {(student.full_name || student.apellidos || '?').charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                          {student.full_name || `${student.apellidos}, ${student.nombres}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.curso}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{student.run}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: 6, 
                      backgroundColor: (student.nee || 'NEET') === 'NEET' ? '#e0f2fe' : '#fef3c7',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: (student.nee || 'NEET') === 'NEET' ? '#0369a1' : '#92400e'
                    }}>
                      {student.nee || 'NEET'}
                    </span>
                  </td>
                  <td>
                    <div className={`status-pill ${(student.status_informe || student.estado) === 'COMPLETE' ? 'status-complete' : 'status-pending'}`}>
                      {(student.status_informe || student.estado) === 'COMPLETE' ? '● COMPLETO' : '○ PENDIENTE'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link 
                        href={`/informe/${student.id}`} 
                        className="action-btn"
                        title={(student.status_informe || student.estado) === 'COMPLETE' ? 'Ver/Editar' : 'Completar'}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.625rem 1.25rem',
                          borderRadius: '10px',
                          background: (student.status_informe || student.estado) === 'COMPLETE' ? 'var(--primary-light)' : 'var(--primary)',
                          color: (student.status_informe || student.estado) === 'COMPLETE' ? 'var(--primary)' : 'white',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          border: 'none',
                          textDecoration: 'none'
                        }}
                      >
                        {(student.status_informe || student.estado) === 'COMPLETE' ? 'Ver/Editar' : 'Completar'}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
          filter: brightness(1.05);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }
      `}</style>
    </div>
  );
}
