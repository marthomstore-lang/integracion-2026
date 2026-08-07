'use client';
import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import Toast from '@/components/Toast';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export default function CertificadoSimcePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [formData, setFormData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Fetch users (for signatures)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setUsers(result.data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  // Fetch student and existing report data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRes = await fetch(`/api/students/${params.id}`);
        const studentResult = await studentRes.json();
        
        if (studentResult.success) {
          const student = studentResult.data;
          
          const reportRes = await fetch(`/api/reports?run=${student.run}&type=simce`);
          const reportResult = await reportRes.json();
          const report = reportResult.data || {};

          const currentDate = new Date();

          setFormData({
            folio: report.folio || `2026-SIMCE-${params.id.slice(0, 4)}`,
            estudianteNombre: report.estudianteNombre || student.full_name || '',
            estudianteRut: report.estudianteRut || student.run || '',
            estudianteCurso: report.estudianteCurso || student.curso || '',
            diagnostico: report.diagnostico || student.diagnostico || '',
            diagnosticoAdicional: report.diagnosticoAdicional || '',
            dia: report.dia || currentDate.getDate().toString(),
            mes: report.mes || MESES[currentDate.getMonth()],
            anio: report.anio || '2026',
            directorNombre: report.directorNombre || '',
            coordinadorNombre: report.coordinadorNombre || '',
            directorUsuarioId: report.directorUsuarioId || '',
            coordinadorUsuarioId: report.coordinadorUsuarioId || ''
          });
        } else {
          setError(studentResult.error || 'No se encontró el estudiante.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error de conexión con la base de datos.');
      }
    };
    fetchData();
  }, [params.id]);

  const handleSave = async (isAuto = false) => {
    if (saving || !formData) return;
    setSaving(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'simce',
          run: formData.estudianteRut,
          student_data: {
            full_name: formData.estudianteNombre,
            curso: formData.estudianteCurso,
            diagnostico: formData.diagnostico
          },
          data: {
            folio: formData.folio,
            estudianteNombre: formData.estudianteNombre,
            estudianteRut: formData.estudianteRut,
            estudianteCurso: formData.estudianteCurso,
            diagnostico: formData.diagnostico,
            diagnosticoAdicional: formData.diagnosticoAdicional,
            dia: formData.dia,
            mes: formData.mes,
            anio: formData.anio,
            directorNombre: formData.directorNombre,
            coordinadorNombre: formData.coordinadorNombre,
            directorUsuarioId: formData.directorUsuarioId,
            coordinadorUsuarioId: formData.coordinadorUsuarioId
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setLastSaved(new Date());
        if (!isAuto) showToast('Certificado Guardado Correctamente', 'success');
      } else {
        showToast('Error al guardar: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showToast('Error de red al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save logic every 10 seconds
  useEffect(() => {
    if (!formData) return;
    const timer = setTimeout(() => {
      handleSave(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [formData]);

  if (error) return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <h3 style={{ color: '#ef4444' }}>{error}</h3>
      <Link href="/informes" className="btn btn-primary" style={{ marginTop: '2rem' }}>Volver a la lista</Link>
    </div>
  );

  if (!formData) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
      <p style={{ fontWeight: 600, color: 'var(--primary)' }}>Cargando datos del certificado...</p>
    </div>
  );

  const fullDiagnosisText = formData.diagnostico + (formData.diagnosticoAdicional ? `, ${formData.diagnosticoAdicional}` : '');

  return (
    <div className="animate-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header controls */}
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} className="no-print">
        <div>
          <Link href="/informes?type=simce" style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span>←</span> Volver a Certificados SIMCE
          </Link>
          <h1 style={{ fontSize: '1.75rem' }}>Certificado SIMCE - 2026</h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {lastSaved ? `Último guardado: ${lastSaved.toLocaleTimeString()}` : 'No guardado aún'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}>
            FOLIO: {formData.folio}
          </div>
          <button 
            type="button"
            onClick={() => window.print()} 
            className="btn" 
            style={{ background: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>🖨️</span> Imprimir Certificado
          </button>
        </div>
      </header>

      <div className="main-layout-container">
        {/* Editor Form (Left Side) */}
        <aside className="card no-print" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', margin: 0 }}>
            ✏️ Editar Contenido
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Nombre del Estudiante</label>
              <input 
                type="text" 
                className="select-input" 
                value={formData.estudianteNombre} 
                onChange={e => setFormData({...formData, estudianteNombre: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label>RUN</label>
              <input 
                type="text" 
                className="select-input" 
                value={formData.estudianteRut} 
                onChange={e => setFormData({...formData, estudianteRut: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label>Curso</label>
              <input 
                type="text" 
                className="select-input" 
                value={formData.estudianteCurso} 
                onChange={e => setFormData({...formData, estudianteCurso: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label>Diagnóstico Base</label>
              <input 
                type="text" 
                className="select-input" 
                value={formData.diagnostico} 
                onChange={e => setFormData({...formData, diagnostico: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label>Información Adicional del Diagnóstico</label>
              <textarea 
                className="select-input" 
                style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                value={formData.diagnosticoAdicional} 
                placeholder="Ej: y Trastorno del Espectro Autista Grado 1..."
                onChange={e => setFormData({...formData, diagnosticoAdicional: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label>Fecha de Emisión</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="select-input" 
                  style={{ width: '50px', textAlign: 'center', padding: '0.5rem 0.25rem' }} 
                  value={formData.dia} 
                  onChange={e => setFormData({...formData, dia: e.target.value})} 
                />
                <select 
                  className="select-input" 
                  style={{ flex: 1, padding: '0.5rem 0.5rem' }}
                  value={formData.mes} 
                  onChange={e => setFormData({...formData, mes: e.target.value})}
                >
                  {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input 
                  type="text" 
                  className="select-input" 
                  style={{ width: '70px', textAlign: 'center', padding: '0.5rem 0.25rem' }} 
                  value={formData.anio} 
                  onChange={e => setFormData({...formData, anio: e.target.value})} 
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Firmas del Certificado
              </h3>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Firma Director/a</label>
                <select 
                  className="select-input" 
                  value={formData.directorUsuarioId} 
                  onChange={e => {
                    const uid = e.target.value;
                    const u = users.find(x => x.id === uid);
                    setFormData({
                      ...formData, 
                      directorUsuarioId: uid, 
                      directorNombre: u ? (u.full_name || u.username) : ''
                    });
                  }}
                >
                  <option value="">-- Seleccionar Director --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.username} ({u.role === 'admin' ? 'Gestión' : 'Docente'})</option>)}
                </select>
                <input 
                  type="text" 
                  className="select-input" 
                  style={{ marginTop: '0.25rem' }}
                  placeholder="Nombre personalizado director" 
                  value={formData.directorNombre} 
                  onChange={e => setFormData({...formData, directorNombre: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label>Firma Coordinador/a PIE</label>
                <select 
                  className="select-input" 
                  value={formData.coordinadorUsuarioId} 
                  onChange={e => {
                    const uid = e.target.value;
                    const u = users.find(x => x.id === uid);
                    setFormData({
                      ...formData, 
                      coordinadorUsuarioId: uid, 
                      coordinadorNombre: u ? (u.full_name || u.username) : ''
                    });
                  }}
                >
                  <option value="">-- Seleccionar Coordinador --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.username} ({u.role === 'admin' ? 'Gestión' : 'Docente'})</option>)}
                </select>
                <input 
                  type="text" 
                  className="select-input" 
                  style={{ marginTop: '0.25rem' }}
                  placeholder="Nombre personalizado coordinador" 
                  value={formData.coordinadorNombre} 
                  onChange={e => setFormData({...formData, coordinadorNombre: e.target.value})} 
                />
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => handleSave(false)} 
              disabled={saving}
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', fontWeight: 800 }}
            >
              {saving ? 'Guardando...' : '💾 GUARDAR CAMBIOS'}
            </button>
          </div>
        </aside>

        {/* Certificate Preview / Print Sheet (Right Side) */}
        <main className="card print-sheet" style={{ flex: 1, backgroundColor: 'white', minHeight: '800px', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header block */}
          <div className="print-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.5rem' }}>
            <img 
              src="/images/logo_liceo.png" 
              alt="Logo Liceo Campanario" 
              style={{ width: '2cm', height: '2cm', objectFit: 'contain' }}
            />
            <div style={{ textAlign: 'center', flex: 1, padding: '0 1.5rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.15rem 0', letterSpacing: '0.05em', color: 'black' }}>LICEO T.P. CAMPANARIO</h2>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'black' }}>MARCOS DELUCCHI FONCK</h3>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0, color: 'black' }}>Programa de Integración Escolar (PIE)</p>
            </div>
            <img 
              src="/images/logo_institucion.png" 
              alt="Logo Institución" 
              style={{ width: '2cm', height: '2cm', objectFit: 'contain' }}
            />
          </div>

          <div style={{ borderBottom: '2px solid black', width: '100%', marginBottom: '2rem' }}></div>

          {/* Certificate Title */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', textDecoration: 'underline', color: 'black', letterSpacing: '0.025em', margin: 0 }}>
              CERTIFICADO ESTUDIANTE CON NEEP
            </h1>
          </div>

          {/* Body Text */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '1.05rem', lineHeight: '1.8', color: 'black', textAlign: 'justify' }}>
            <p>
              Por medio del presente, se certifica que el/la estudiante <strong>{formData.estudianteNombre}</strong>, 
              RUT <strong>{formData.estudianteRut}</strong>, del curso <strong>{formData.estudianteCurso}</strong>, 
              pertenece al Programa de Integración Escolar 2026 del Liceo T.P Campanario, RBD: 3941-1, Comuna de Yungay, 
              y presenta Necesidades Educativas Permanentes bajo el diagnóstico de <strong>{fullDiagnosisText}</strong>.
            </p>
            
            <p>
              Se extiende el presente certificado para ser presentado en la Plataforma de Certificados SIMCE, 
              para los fines de acreditación que correspondan.
            </p>
            
            <p>
              Se adjuntan los documentos requeridos del estudiante donde se valida la información mencionada.
            </p>
            
            <p style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              Campanario, {formData.dia} de {formData.mes} de {formData.anio}.
            </p>
          </div>

          {/* Signatures block */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', textAlign: 'center', marginTop: '4rem', marginBottom: '1.5rem' }}>
            
            {/* Left signature */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
              <div style={{ width: '85%', borderTop: '1px solid black', paddingTop: '0.5rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'black' }}>
                  {formData.directorNombre || 'DIRECTOR/A'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'black', marginTop: '0.1rem' }}>
                  Director/a
                </div>
                <div style={{ fontSize: '0.75rem', color: 'black' }}>
                  Liceo T.P. Campanario
                </div>
              </div>
            </div>

            {/* Right signature */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
              <div style={{ width: '85%', borderTop: '1px solid black', paddingTop: '0.5rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'black' }}>
                  {formData.coordinadorNombre || 'COORDINADOR/A PIE'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'black', marginTop: '0.1rem' }}>
                  Coordinador/a PIE
                </div>
                <div style={{ fontSize: '0.75rem', color: 'black' }}>
                  Programa de Integración Escolar
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* Styled overrides for page rendering and printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

        :root {
          --primary: #4f46e5;
          --primary-light: #e0e7ff;
          --secondary: #0f172a;
          --text: #1e293b;
          --text-muted: #64748b;
          --border: #e2e8f0;
          --radius: 12px;
          --radius-sm: 8px;
        }

        .animate-in {
          animation: fadeIn 0.4s ease-out;
          font-family: 'Inter', sans-serif;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .main-layout-container {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        label {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .select-input {
          padding: 0.6rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
          background: #f8fafc;
          width: 100%;
        }

        .select-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
          background: white;
        }

        .btn {
          padding: 0.65rem 1.25rem;
          border-radius: var(--radius-sm);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
        }

        .card {
          background: white;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(6px);
          border-radius: var(--radius-sm);
        }

        @media screen {
          .print-header {
            display: flex !important;
          }
          .print-sheet {
            padding: 3rem !important;
            border: 1px solid var(--border) !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.04) !important;
          }
        }

        @media print {
          @page {
            margin: 15mm !important;
            size: letter !important;
          }
          @page :first {
            margin-top: 10mm !important;
          }
          
          body {
            background: white !important;
            color: black !important;
            font-family: 'Inter', sans-serif !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .no-print, aside, header, .btn {
            display: none !important;
          }

          .main-layout-container {
            display: block !important;
            width: 100% !important;
          }

          .print-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Ensure high quality text and layout in PDF */
          strong {
            font-weight: 700 !important;
          }
        }
      `}} />
    </div>
  );
}
