'use client';
import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { calculateAge, formatDate } from '@/lib/dateUtils';
import Toast from '@/components/Toast';
import PrintSettings from '@/components/PrintSettings';

export default function InformeForm({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>(null);
  const [semester, setSemester] = useState(1);
  const [subStep, setSubStep] = useState('Psicopedagógica');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleSave = async (isAuto = false) => {
    if (saving || !formData) return;
    setSaving(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'familia',
          run: formData.estudianteRut,
          student_data: {
            full_name: formData.estudianteNombre,
            curso: formData.estudianteCurso,
            profesor_jefe: formData.profesorJefe,
            fecha_diagnostico: formData.fechaDiagnostico,
            diagnostico: formData.diagnostico,
            establecimiento: formData.estudianteEstablecimiento
          },
          data: {
            semester,
            folio: formData.folio,
            profesor_jefe: formData.profesorJefe,
            fecha_diagnostico: formData.fechaDiagnostico,
            profesional_data: {
              nombre: formData.profesionalNombre,
              rut: formData.profesionalRut,
              cargo: formData.profesionalCargo,
              telefono: formData.profesionalTelefono,
              email: formData.profesionalEmail,
              fecha: formData.profesionalFechaInforme
            },
            apoderado_data: {
              nombre: formData.apoderadoNombre,
              rut: formData.apoderadoRut,
              relacion: formData.apoderadoRelacion
            },
            reportes_area: {
              psicopedagogico: formData.reportePsicopedagogico,
              psicologico: formData.reportePsicologico,
              fonoaudiologico: formData.reporteFonoaudiologico,
              kinesiologico: formData.reporteKinesiologico,
              terapia_ocupacional: formData.reporteTerapiaOcupacional
            },
            desempeno_acad: formData.desempenoAcademico,
            convivencia_salud: {
              convivencia: formData.convivenciaSocial,
              motivacion: formData.motivacionEscolar,
              salud: formData.saludFisicaMental
            },
            sugerencias_apoyo: formData.sugerenciasApoyo,
            firma_usuario_id: formData.firmaUsuarioId,
            firma_usuario_nombre: formData.firmaUsuarioNombre,
            firma_usuario_cargo: formData.firmaUsuarioCargo
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setLastSaved(new Date());
        if (!isAuto) showToast('Informe Guardado Correctamente', 'success');
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!formData) return;
    const timer = setTimeout(() => {
      handleSave(true);
    }, 10000); // 10 seconds for auto-save
    return () => clearTimeout(timer);
  }, [formData, semester]);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRes = await fetch(`/api/students/${params.id}`);
        const studentResult = await studentRes.json();
        
        if (studentResult.success) {
          const student = studentResult.data;
          
          const reportRes = await fetch(`/api/reports?run=${student.run}&type=familia&semester=${semester}`);
          const reportResult = await reportRes.json();
          const report = reportResult.data || {};

          setFormData({
            folio: report.folio || `2026-${params.id.slice(0, 4)}`,
            estudianteNombre: student.full_name,
            estudianteRut: student.run,
            estudianteFechaNac: formatDate(student.fecha_nacimiento), 
            estudianteEdad: calculateAge(student.fecha_nacimiento), 
            estudianteCurso: student.curso,
            estudianteEstablecimiento: report.estudianteEstablecimiento || 'LICEO CAMPANARIO',
            profesorJefe: student.profesor_jefe || report.profesor_jefe || '',
            fechaDiagnostico: student.fecha_diagnostico || report.fecha_diagnostico || '',
            profesionalNombre: report.profesional_data?.nombre || '',
            profesionalRut: report.profesional_data?.rut || '',
            profesionalCargo: report.profesional_data?.cargo || '',
            profesionalTelefono: report.profesional_data?.telefono || '',
            profesionalEmail: report.profesional_data?.email || '',
            profesionalFechaInforme: report.profesional_data?.fecha || new Date().toISOString().split('T')[0],
            apoderadoNombre: report.apoderado_data?.nombre || '',
            apoderadoRut: report.apoderado_data?.rut || '',
            apoderadoRelacion: report.apoderado_data?.relacion || 'Madre',
            diagnostico: student.diagnostico || '',
            reportePsicopedagogico: report.reportes_area?.psicopedagogico || '',
            reportePsicologico: report.reportes_area?.psicologico || '',
            reporteFonoaudiologico: report.reportes_area?.fonoaudiologico || '',
            reporteKinesiologico: report.reportes_area?.kinesiologico || '',
            reporteTerapiaOcupacional: report.reportes_area?.terapia_ocupacional || '',
            desempenoAcademico: report.desempeno_acad || '',
            convivenciaSocial: report.convivencia_salud?.convivencia || '',
            motivacionEscolar: report.convivencia_salud?.motivacion || '',
            saludFisicaMental: report.convivencia_salud?.salud || '',
            sugerenciasApoyo: report.sugerencias_apoyo || '',
            firmaUsuarioId: report.firma_usuario_id || '',
            firmaUsuarioNombre: report.firma_usuario_nombre || '',
            firmaUsuarioCargo: report.firma_usuario_cargo || '',
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
  }, [params.id, semester]);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAIField, setActiveAIField] = useState({ label: '', id: '' });
  const [aiInstruction, setAiInstruction] = useState('');

  const openAIModal = async (fieldLabel: string, fieldId: string, instruction = '') => {
    setActiveAIField({ label: fieldLabel, id: fieldId });
    setIsAIModalOpen(true);
    setAiLoading(true);
    setAiSuggestions([]);

    const currentContent = formData[fieldId] || '';
    
    const otherProfessionalNotes = {
      psicopedagogico: formData.reportePsicopedagogico,
      psicologico: formData.reportePsicologico,
      fonoaudiologico: formData.reporteFonoaudiologico,
      kinesiologico: formData.reporteKinesiologico,
      terapia_ocupacional: formData.reporteTerapiaOcupacional,
      academico: formData.desempenoAcademico,
      convivencia: formData.convivenciaSocial
    };

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: fieldLabel,
          context: {
            name: formData.estudianteNombre,
            diagnostico: formData.diagnostico,
            course: formData.estudianteCurso,
            currentContent,
            otherProfessionalNotes,
            userInstruction: instruction || aiInstruction
          },
          length: 'medium'
        })
      });

      const result = await response.json();
      if (result.success && Array.isArray(result.suggestions)) {
        setAiSuggestions(result.suggestions);
      } else {
        setAiSuggestions([]);
        showToast('Error: No se pudieron generar sugerencias. Intente nuevamente.', 'error');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const useSuggestion = (text: string) => {
    setFormData({ ...formData, [activeAIField.id]: text });
    setIsAIModalOpen(false);
  };

  const nextStep = () => setStep(s => Math.min(s + 4, 4)); // Jump logic or manual
  const setStepManual = (s: number) => setStep(s);

  if (error) return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <h3 style={{ color: '#ef4444' }}>{error}</h3>
      <p style={{ marginTop: '1rem', color: '#666' }}>
        No se pudo cargar la información del estudiante.
      </p>
      <Link href="/informes" className="btn btn-primary" style={{ marginTop: '2rem' }}>Volver a la lista</Link>
    </div>
  );

  if (!formData) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
      <p style={{ fontWeight: 600, color: 'var(--primary)' }}>Cargando datos del estudiante...</p>
    </div>
  );

  return (
    <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* AI Modal */}
      {isAIModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} className="no-print">
          <div className="card shadow-2xl" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>✨ Refinamiento Profesional con IA</h2>
              <button onClick={() => setIsAIModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
              Generando sugerencias coherentes con el resto de los profesionales para: <strong>{activeAIField.label}</strong>
            </p>
            <div style={{ background: '#f0f9ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '2rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0369a1', display: 'block', marginBottom: '0.5rem' }}>💡 ¿TIENES ALGUNA IDEA O NOTA ESPECÍFICA?</label>
              <textarea 
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="Ej: Menciona que ha mejorado en su lectura..."
                style={{ width: '100%', minHeight: '60px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #7dd3fc', fontSize: '0.9rem', marginBottom: '0.75rem' }}
              />
              <button 
                onClick={() => openAIModal(activeAIField.label, activeAIField.id)}
                className="btn"
                disabled={aiLoading}
                style={{ background: '#0369a1', color: 'white', fontSize: '0.8rem', width: '100%' }}
              >
                {aiLoading ? 'Procesando...' : '✨ Generar sugerencias con esta idea'}
              </button>
            </div>

            {aiLoading ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                <p>Analizando coherencia...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {aiSuggestions && aiSuggestions.length > 0 && aiSuggestions.map((text, idx) => (
                  <div key={idx} className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--border)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-0.75rem', left: '1rem', background: 'var(--secondary)', color: 'white', fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 700 }}>
                      PROPUESTA TÉCNICA {idx + 1}
                    </div>
                    <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: '#333', marginBottom: '1rem' }}>{text}</p>
                    <button 
                      onClick={() => {
                        useSuggestion(text);
                        setAiInstruction('');
                      }}
                      className="btn" 
                      style={{ width: '100%', background: 'var(--primary)', color: 'white', fontSize: '0.85rem' }}
                    >
                      Integrar esta Redacción
                    </button>
                  </div>
                ))}

                <button 
                  onClick={() => openAIModal(activeAIField.label, activeAIField.id)}
                  style={{ marginTop: '1rem', background: 'none', border: '1px dashed var(--primary)', color: 'var(--primary)', padding: '1rem', borderRadius: 'var(--radius)', cursor: 'pointer' }}
                >
                  🔄 Generar nuevas opciones
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} className="no-print">
        <div>
          <Link href="/informes" style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span>←</span> Volver a Informes
          </Link>
          <h1 style={{ fontSize: '1.75rem' }}>Informe para la Familia - 2026</h1>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button 
              type="button"
              onClick={() => setSemester(1)}
              className={`btn ${semester === 1 ? 'btn-primary' : ''}`} 
              style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', background: semester === 1 ? '' : '#f1f5f9', color: semester === 1 ? '' : 'var(--text)' }}
            >
              1° SEMESTRE
            </button>
            <button 
              type="button"
              onClick={() => setSemester(2)}
              className={`btn ${semester === 2 ? 'btn-primary' : ''}`} 
              style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', background: semester === 2 ? '' : '#f1f5f9', color: semester === 2 ? '' : 'var(--text)' }}
            >
              2° SEMESTRE
            </button>
          </div>
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
            <span>🖨️</span> Generar Reporte PDF
          </button>
        </div>
      </header>

      {/* Stepper Header */}
      <div className="stepper no-print" style={{ marginBottom: '3rem' }}>
        <div className={`step ${step >= 1 ? 'active' : ''}`} onClick={() => setStepManual(1)} style={{ cursor: 'pointer' }}>
          <div className="step-number">{step > 1 ? '✓' : '1'}</div>
          <span>Personales</span>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''}`} onClick={() => setStepManual(2)} style={{ cursor: 'pointer' }}>
          <div className="step-number">{step > 2 ? '✓' : '2'}</div>
          <span>Especialistas</span>
        </div>
        <div className={`step ${step >= 3 ? 'active' : ''}`} onClick={() => setStepManual(3)} style={{ cursor: 'pointer' }}>
          <div className="step-number">3</div>
          <span>Sugerencias</span>
        </div>
      </div>

      <div className="card shadow-lg" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
        {/* Header exclusivo de impresión */}
        <div className="print-header print-only" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <img 
              src="/images/logo_liceo.png" 
              alt="Logo Liceo Campanario" 
              style={{ width: '2cm', height: '2cm', objectFit: 'contain' }}
            />
            <div style={{ textAlign: 'center', flex: 1, padding: '0 1rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'black', margin: 0 }}>
                Informe para la Familia - 2026
              </h1>
              <p style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '0.5rem', color: '#475569', margin: 0 }}>
                {semester === 1 ? '1° Semestre' : '2° Semestre'}
              </p>
            </div>
            <img 
              src="/images/logo_institucion.png" 
              alt="Logo Institución" 
              style={{ width: '2cm', height: '2cm', objectFit: 'contain' }}
            />
          </div>
          <div style={{ borderBottom: '2px solid black', marginTop: '1rem', marginBottom: '1.5rem' }}></div>
        </div>

        <div style={{ flex: 1 }}>
          <div className={step === 1 ? 'animate-in' : 'print-only'}>
            <div className="form-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <section className="print-avoid-break">
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>I. Antecedentes Personales</h3>
                </div>
                
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Nombre del Estudiante</label>
                    <input type="text" className="select-input no-print" value={formData.estudianteNombre} onChange={e => setFormData({...formData, estudianteNombre: e.target.value})} />
                    <span className="print-only print-val">{formData.estudianteNombre}</span>
                  </div>
                  <div className="form-group">
                    <label>RUN</label>
                    <input type="text" className="select-input no-print" value={formData.estudianteRut} readOnly />
                    <span className="print-only print-val">{formData.estudianteRut}</span>
                  </div>
                  <div className="form-group">
                    <label>Fecha Informe</label>
                    <input type="date" className="select-input no-print" value={formData.profesionalFechaInforme} onChange={e => setFormData({...formData, profesionalFechaInforme: e.target.value})} />
                    <span className="print-only print-val">{formatDate(formData.profesionalFechaInforme)}</span>
                  </div>
                  <div className="form-group">
                    <label>Curso</label>
                    <input type="text" className="select-input no-print" value={formData.estudianteCurso} onChange={e => setFormData({...formData, estudianteCurso: e.target.value})} />
                    <span className="print-only print-val">{formData.estudianteCurso}</span>
                  </div>
                  <div className="form-group">
                    <label>Diagnóstico N.E.E.</label>
                    <input type="text" className="select-input no-print" value={formData.diagnostico} onChange={e => setFormData({...formData, diagnostico: e.target.value})} />
                    <span className="print-only print-val">{formData.diagnostico}</span>
                  </div>
                  <div className="form-group">
                    <label>Establecimiento</label>
                    <input type="text" className="select-input no-print" value={formData.estudianteEstablecimiento} onChange={(e) => setFormData({...formData, estudianteEstablecimiento: e.target.value})} />
                    <span className="print-only print-val">{formData.estudianteEstablecimiento}</span>
                  </div>
                </div>
              </section>

              <section className="print-avoid-break">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', flex: 1 }}>II. Identificación del Apoderado</h3>
                </div>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label>Nombre Apoderado</label>
                    <input type="text" className="select-input no-print" value={formData.apoderadoNombre} onChange={e => setFormData({...formData, apoderadoNombre: e.target.value})} />
                    <span className="print-only print-val">{formData.apoderadoNombre}</span>
                  </div>
                  <div className="form-group">
                    <label>RUT</label>
                    <input type="text" className="select-input no-print" value={formData.apoderadoRut} onChange={e => setFormData({...formData, apoderadoRut: e.target.value})} />
                    <span className="print-only print-val">{formData.apoderadoRut}</span>
                  </div>
                  <div className="form-group">
                    <label>Parentesco</label>
                    <input type="text" className="select-input no-print" value={formData.apoderadoRelacion} onChange={e => setFormData({...formData, apoderadoRelacion: e.target.value})} />
                    <span className="print-only print-val">{formData.apoderadoRelacion}</span>
                  </div>
                </div>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Profesor(a) Jefe</label>
                    <input type="text" className="select-input no-print" value={formData.profesorJefe} onChange={e => setFormData({...formData, profesorJefe: e.target.value})} />
                    <span className="print-only print-val">{formData.profesorJefe}</span>
                  </div>
                  <div className="form-group">
                    <label>Docente Diferencial</label>
                    <input type="text" className="select-input no-print" value={formData.profesionalNombre} onChange={e => setFormData({...formData, profesionalNombre: e.target.value})} />
                    <span className="print-only print-val">{formData.profesionalNombre}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className={step === 2 ? 'animate-in' : 'print-only'}>
            <div className="form-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem' }}>III. Reporte de Áreas de Apoyo</h3>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }} className="no-print">
                {['Psicopedagógica', 'Psicológica', 'Fonoaudiológica', 'Kinesiológica', 'Terapia Ocupacional'].map(area => (
                  <button key={area} onClick={() => setSubStep(area)} className={`btn ${subStep === area ? 'btn-primary' : ''}`} style={{ fontSize: '0.7rem' }}>{area}</button>
                ))}
              </div>

              <section className={`${subStep === 'Psicopedagógica' ? 'active-area' : 'print-area'} print-avoid-break`} style={{ padding: '1.5rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ color: 'var(--secondary)', textTransform: 'uppercase', fontSize: '0.875rem' }}>ÁREA PSICOPEDAGÓGICA</h4>
                  <button type="button" onClick={() => openAIModal('Área Psicopedagógica', 'reportePsicopedagogico')} className="btn no-print" style={{ fontSize: '0.7rem' }}>✨ IA</button>
                </div>
                <textarea className="select-input no-print" style={{ width: '100%', minHeight: '200px' }} value={formData.reportePsicopedagogico} onChange={e => setFormData({...formData, reportePsicopedagogico: e.target.value})} />
                <div className="print-only print-text-block">
                  {formData.reportePsicopedagogico || 'No presenta observaciones.'}
                </div>
              </section>
              
              <section className={`${subStep === 'Psicológica' ? 'active-area' : 'print-area'} print-avoid-break`} style={{ padding: '1.5rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ color: 'var(--secondary)', textTransform: 'uppercase', fontSize: '0.875rem' }}>ÁREA PSICOLÓGICA</h4>
                  <button type="button" onClick={() => openAIModal('Área Psicológica', 'reportePsicologico')} className="btn no-print" style={{ fontSize: '0.7rem' }}>✨ IA</button>
                </div>
                <textarea className="select-input no-print" style={{ width: '100%', minHeight: '200px' }} value={formData.reportePsicologico} onChange={e => setFormData({...formData, reportePsicologico: e.target.value})} />
                <div className="print-only print-text-block">
                  {formData.reportePsicologico || 'No presenta observaciones.'}
                </div>
              </section>
              
              <section className={`${subStep === 'Fonoaudiológica' ? 'active-area' : 'print-area'} print-avoid-break`} style={{ padding: '1.5rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ color: 'var(--secondary)', textTransform: 'uppercase', fontSize: '0.875rem' }}>ÁREA FONOAUDIOLÓGICA</h4>
                  <button type="button" onClick={() => openAIModal('Área Fonoaudiológica', 'reporteFonoaudiologico')} className="btn no-print" style={{ fontSize: '0.7rem' }}>✨ IA</button>
                </div>
                <textarea className="select-input no-print" style={{ width: '100%', minHeight: '200px' }} value={formData.reporteFonoaudiologico} onChange={e => setFormData({...formData, reporteFonoaudiologico: e.target.value})} />
                <div className="print-only print-text-block">
                  {formData.reporteFonoaudiologico || 'No presenta observaciones.'}
                </div>
              </section>
              
              <section className={`${subStep === 'Kinesiológica' ? 'active-area' : 'print-area'} print-avoid-break`} style={{ padding: '1.5rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ color: 'var(--secondary)', textTransform: 'uppercase', fontSize: '0.875rem' }}>ÁREA KINESIOLÓGICA</h4>
                  <button type="button" onClick={() => openAIModal('Área Kinesiológica', 'reporteKinesiologico')} className="btn no-print" style={{ fontSize: '0.7rem' }}>✨ IA</button>
                </div>
                <textarea className="select-input no-print" style={{ width: '100%', minHeight: '200px' }} value={formData.reporteKinesiologico} onChange={e => setFormData({...formData, reporteKinesiologico: e.target.value})} />
                <div className="print-only print-text-block">
                  {formData.reporteKinesiologico || 'No presenta observaciones.'}
                </div>
              </section>

              <section className={`${subStep === 'Terapia Ocupacional' ? 'active-area' : 'print-area'} print-avoid-break`} style={{ padding: '1.5rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ color: 'var(--secondary)', textTransform: 'uppercase', fontSize: '0.875rem' }}>ÁREA TERAPIA OCUPACIONAL</h4>
                  <button type="button" onClick={() => openAIModal('Área Terapia Ocupacional', 'reporteTerapiaOcupacional')} className="btn no-print" style={{ fontSize: '0.7rem' }}>✨ IA</button>
                </div>
                <textarea className="select-input no-print" style={{ width: '100%', minHeight: '200px' }} value={formData.reporteTerapiaOcupacional} onChange={e => setFormData({...formData, reporteTerapiaOcupacional: e.target.value})} />
                <div className="print-only print-text-block">
                  {formData.reporteTerapiaOcupacional || 'No presenta observaciones.'}
                </div>
              </section>
            </div>
          </div>

          <div className={step === 3 ? 'animate-in' : 'print-only'}>
            <div className="form-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <section className="print-avoid-break">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', flex: 1, marginTop: 0 }}>
                    IV. Sugerencias de Apoyo en el Hogar y Establecimiento
                  </h3>
                  <button type="button" onClick={() => openAIModal('Sugerencias de Apoyo en el Hogar y Establecimiento', 'sugerenciasApoyo')} className="btn no-print" style={{ fontSize: '0.7rem' }}>✨ IA</button>
                </div>
                <textarea className="select-input no-print" style={{ width: '100%', minHeight: '200px' }} value={formData.sugerenciasApoyo} onChange={e => setFormData({...formData, sugerenciasApoyo: e.target.value})} />
                <div className="print-only print-text-block">
                  {formData.sugerenciasApoyo || 'No presenta observaciones.'}
                </div>
              </section>

              {/* Controles de selección de firma en pantalla */}
              <div className="no-print" style={{ marginTop: '2rem', maxWidth: '300px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Seleccionar Profesional Firmante
                </label>
                <select 
                  value={formData.firmaUsuarioId} 
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const user = users.find(u => u.id === selectedId);
                    if (user) {
                      setFormData({
                        ...formData,
                        firmaUsuarioId: selectedId,
                        firmaUsuarioNombre: user.full_name || user.username,
                        firmaUsuarioCargo: user.role === 'admin' ? 'Equipo de Gestión' : 'Docente/Profesional'
                      });
                    } else {
                      setFormData({
                        ...formData,
                        firmaUsuarioId: '',
                        firmaUsuarioNombre: '',
                        firmaUsuarioCargo: ''
                      });
                    }
                  }}
                  className="select-input"
                  style={{ width: '100%' }}
                >
                  <option value="">--- Seleccionar Profesional ---</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.username} ({u.role === 'admin' ? 'Gestión' : 'Docente'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bloque de firmas impresas y en pantalla (Symmetric) */}
              <section className="print-avoid-break" style={{ marginTop: '4rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <div style={{ width: '80%', borderTop: '1px solid black', paddingTop: '0.5rem' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', minHeight: '1.4rem' }}>
                        {formData.firmaUsuarioNombre || 'Firma Profesional / Gestión'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', minHeight: '1.2rem' }}>
                        {formData.firmaUsuarioCargo || 'Cargo'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <div style={{ width: '80%', borderTop: '1px solid black', paddingTop: '0.5rem' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', minHeight: '1.4rem' }}>
                        {formData.apoderadoNombre || 'Firma Apoderado'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', minHeight: '1.2rem' }}>
                        {formData.apoderadoRut ? `RUT: ${formData.apoderadoRut}` : 'Apoderado'}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }} className="no-print">
          <button onClick={() => setStep(s => Math.max(s - 1, 1))} disabled={step === 1} className="btn" style={{ background: '#f1f5f9', opacity: step === 1 ? 0.5 : 1 }}>← Anterior</button>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" style={{ background: 'var(--primary)', color: 'white', fontWeight: 800, padding: '0.75rem 2rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }} onClick={() => handleSave(false)}>
              {saving ? 'Guardando...' : '💾 GUARDAR DATOS'}
            </button>
            {step < 3 ? <button onClick={() => setStep(s => Math.min(s + 1, 3))} className="btn btn-primary">Siguiente →</button> : null}
          </div>
        </div>

        {/* Floating Save Button */}
        <button 
          onClick={() => handleSave(false)}
          className="no-print"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            transition: 'transform 0.2s'
          }}
          title="Guardar Información"
        >
          {saving ? '⌛' : '💾'}
        </button>
      </div>

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
        }

        .animate-in {
          animation: fadeIn 0.5s ease-out;
          font-family: 'Inter', sans-serif;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.025em; }
        
        .select-input {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s;
          background: #f8fafc;
        }
        .select-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
          background: white;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-primary { background: var(--primary); color: white; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }

        .card {
          background: white;
          border-radius: 20px;
          border: 1px solid var(--border);
          padding: 2.5rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          border-radius: var(--radius);
          padding: 1.5rem;
        }

        .print-logo-right {
          height: 2cm;
          width: 2cm;
          object-fit: contain;
        }

        @media screen { 
          .print-only, .print-area, .print-header { display: none !important; } 
          .active-area { display: block !important; } 
        }

        @media print {
          @page { margin: 15mm !important; size: letter !important; }
          @page :first { margin-top: 10mm !important; }
          body { background: white; color: black; font-family: 'Inter', sans-serif !important; padding: 0 !important; }
          .no-print, aside, header, .stepper, .btn { display: none !important; }
          
          .card { 
            box-shadow: none !important; 
            border: none !important; 
            padding: 0 !important; 
          }
          
          .print-only, .print-area, .active-area, .print-header { 
            display: block !important; 
          }

          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-val {
            display: block !important;
            font-size: 1rem !important;
            font-weight: 700 !important;
            color: black !important;
            padding: 0.05rem 0 !important;
            border-bottom: 1px solid #cbd5e1 !important;
            min-height: 1.4rem;
          }

          .print-text-block {
            display: block !important;
            font-size: 0.9rem !important;
            line-height: 1.4 !important;
            color: black !important;
            white-space: pre-wrap !important;
            word-break: break-word !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 6px !important;
            padding: 0.5rem !important;
            background: white !important;
            min-height: 0 !important;
            margin-top: 0.15rem !important;
          }

          .print-logo-right {
            height: 2cm !important;
            width: 2cm !important;
            object-fit: contain !important;
          }

          .print-header {
            margin-bottom: 0.5rem !important;
          }

          .section-header {
            border-bottom: none !important;
            margin-bottom: 0.4rem !important;
            padding-bottom: 0 !important;
          }

          .form-container {
            gap: 0.35rem !important;
          }

          .form-grid {
            gap: 0.3rem !important;
            margin-bottom: 0.25rem !important;
          }

          .form-group {
            gap: 0.1rem !important;
          }

          label {
            margin-bottom: 0.05rem !important;
            font-size: 0.7rem !important;
          }

          h3 { 
            color: black !important; 
            border-bottom: 2px solid black !important;
            padding-bottom: 0.2rem !important;
            margin-top: 0.75rem !important;
            margin-bottom: 0.4rem !important;
            break-after: avoid;
          }

          h4 {
            margin: 0 0 0.2rem 0 !important;
            font-size: 0.85rem !important;
            color: black !important;
          }

          .select-input {
            border: none !important;
            padding: 0.25rem 0 !important;
            font-size: 1rem !important;
            font-weight: 700 !important;
            background: transparent !important;
          }

          section, .card {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
            margin-bottom: 0.6rem !important;
          }

          .card {
            display: block !important;
            min-height: 0 !important;
          }

          textarea {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            border: 1px solid #eee !important;
            padding: 1rem !important;
          }
        }
      ` }} />
      <PrintSettings />
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
