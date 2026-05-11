'use client';
import { useState, use, useEffect } from 'react';
import Link from 'next/link';

export default function InformeForm({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>(null);
  const [semester, setSemester] = useState(1);
  const [subStep, setSubStep] = useState('Psicopedagógica');
  const [showGrades, setShowGrades] = useState(false);
  const [showGuardian, setShowGuardian] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

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
              psicopedagogico: (document.getElementById('area-Psicopedagógica') as HTMLTextAreaElement)?.value || '',
              psicologico: (document.getElementById('area-Psicológica') as HTMLTextAreaElement)?.value || '',
              fonoaudiologico: (document.getElementById('area-Fonoaudiológica') as HTMLTextAreaElement)?.value || '',
              kinesiologico: (document.getElementById('area-Kinesiológica') as HTMLTextAreaElement)?.value || ''
            },
            desempeno_acad: (document.getElementById('desempeno-acad') as HTMLTextAreaElement)?.value || '',
            convivencia_salud: {
              convivencia: (document.getElementById('conv-social') as HTMLTextAreaElement)?.value || '',
              motivacion: (document.getElementById('motiv-escolar') as HTMLTextAreaElement)?.value || '',
              salud: (document.getElementById('salud-est') as HTMLTextAreaElement)?.value || ''
            }
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setLastSaved(new Date());
        if (!isAuto) alert('Informe Guardado Correctamente en la Base de Datos');
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
    }, 5000);
    return () => clearTimeout(timer);
  }, [step, semester]);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await fetch(`/api/students/${params.id}`);
        const result = await response.json();
        if (result.success) {
          const student = result.data;
          setFormData({
            folio: `2026-${params.id.slice(0, 4)}`,
            estudianteNombre: student.full_name,
            estudianteRut: student.run,
            estudianteFechaNac: '---', 
            estudianteEdad: '---', 
            estudianteCurso: student.curso,
            estudianteEstablecimiento: 'LICEO CAMPANARIO',
            profesorJefe: student.profesor_jefe || '',
            fechaDiagnostico: student.fecha_diagnostico || '',
            profesionalNombre: '',
            profesionalRut: '',
            profesionalCargo: '',
            profesionalTelefono: '',
            profesionalEmail: '',
            profesionalFechaInforme: new Date().toISOString().split('T')[0],
            apoderadoNombre: '',
            apoderadoRut: '',
            apoderadoRelacion: 'Madre',
            diagnostico: student.diagnostico,
            reportePsicopedagogico: '',
            reportePsicologico: '',
            reporteFonoaudiologico: '',
            desempenoAcademico: '',
            convivenciaSocial: '',
            motivacionEscolar: '',
            saludFisicaMental: '',
          });
        } else {
          setError(result.error || 'No se encontró el estudiante en esta sesión.');
        }
      } catch (err) {
        console.error('Error fetching student:', err);
        setError('Error de conexión con la base de datos temporal.');
      }
    };
    fetchStudent();
  }, [params.id]);

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

    const currentContent = (document.getElementById(fieldId) as HTMLTextAreaElement)?.value || '';
    
    const otherProfessionalNotes = {
      psicopedagogico: (document.getElementById('area-Psicopedagógica') as HTMLTextAreaElement)?.value || '',
      psicologico: (document.getElementById('area-Psicológica') as HTMLTextAreaElement)?.value || '',
      fonoaudiologico: (document.getElementById('area-Fonoaudiológica') as HTMLTextAreaElement)?.value || '',
      kinesiologico: (document.getElementById('area-Kinesiológica') as HTMLTextAreaElement)?.value || '',
      academico: (document.getElementById('desempeno-acad') as HTMLTextAreaElement)?.value || '',
      convivencia: (document.getElementById('conv-social') as HTMLTextAreaElement)?.value || ''
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
        alert('Error: No se pudieron generar sugerencias. Intente nuevamente.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const useSuggestion = (text: string) => {
    const textarea = document.getElementById(activeAIField.id) as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = text;
    }
    setIsAIModalOpen(false);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  if (error) return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <h3 style={{ color: '#ef4444' }}>{error}</h3>
      <p style={{ marginTop: '1rem', color: '#666' }}>
        Parece que la base de datos temporal de Vercel se ha reiniciado.<br/>
        Por favor, vuelve a subir la nómina en <strong>Configuración</strong> para continuar o solicita la migración a base de datos permanente.
      </p>
      <Link href="/config" className="btn btn-primary" style={{ marginTop: '2rem' }}>Re-subir Alumnos</Link>
    </div>
  );

  if (!formData) return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
      <p style={{ fontWeight: 600, color: 'var(--primary)' }}>Cargando datos del estudiante...</p>
      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem' }}>Verificando persistencia en servidor Vercel...</p>
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
                placeholder="Ej: Menciona que ha mejorado en su lectura pero aún le cuesta concentrarse en tareas largas..."
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
                <p>Analizando coherencia y tus instrucciones...</p>
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
        <div className={`step ${step >= 1 ? 'active' : ''}`} onClick={() => setStep(1)} style={{ cursor: 'pointer' }}>
          <div className="step-number">{step > 1 ? '✓' : '1'}</div>
          <span>Personales</span>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''}`} onClick={() => setStep(2)} style={{ cursor: 'pointer' }}>
          <div className="step-number">{step > 2 ? '✓' : '2'}</div>
          <span>Especialistas</span>
        </div>
        <div className={`step ${step >= 3 ? 'active' : ''}`} onClick={() => setStep(3)} style={{ cursor: 'pointer' }}>
          <div className="step-number">{step > 3 ? '✓' : '3'}</div>
          <span>Académico</span>
        </div>
        <div className={`step ${step >= 4 ? 'active' : ''}`} onClick={() => setStep(4)} style={{ cursor: 'pointer' }}>
          <div className="step-number">4</div>
          <span>Salud y Social</span>
        </div>
      </div>

      <div className="card shadow-lg" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <div className={step === 1 ? 'animate-in' : 'print-only'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>I. Antecedentes Personales</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SEMESTRE {semester}</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group"><label>Nombre del Estudiante</label><input type="text" className="select-input" defaultValue={formData.estudianteNombre} /></div>
                  <div className="form-group"><label>RUN</label><input type="text" className="select-input" defaultValue={formData.estudianteRut} /></div>
                  <div className="form-group"><label>Fecha Informe</label><input type="date" className="select-input" defaultValue={formData.profesionalFechaInforme} /></div>
                  <div className="form-group"><label>Curso</label><input type="text" className="select-input" defaultValue={formData.estudianteCurso} /></div>
                  <div className="form-group"><label>Diagnóstico N.E.E.</label><input type="text" className="select-input" defaultValue={formData.diagnostico} /></div>
                  <div className="form-group"><label>Establecimiento</label><input type="text" className="select-input" value={formData.estudianteEstablecimiento} onChange={(e) => setFormData({...formData, estudianteEstablecimiento: e.target.value})} /></div>
                </div>
              </section>

              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', flex: 1 }}>II. Identificación del Apoderado</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group"><label>Nombre Apoderado</label><input type="text" className="select-input" defaultValue={formData.apoderadoNombre} /></div>
                  <div className="form-group"><label>RUT</label><input type="text" className="select-input" defaultValue={formData.apoderadoRut} /></div>
                  <div className="form-group"><label>Parentesco</label><input type="text" className="select-input" defaultValue={formData.apoderadoRelacion} /></div>
                </div>
              </section>
            </div>
          </div>

          <div className={step === 2 ? 'animate-in' : 'print-only'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem' }}>II. Reporte de Áreas de Apoyo</h3>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }} className="no-print">
                {['Psicopedagógica', 'Psicológica', 'Fonoaudiológica', 'Kinesiológica'].map(area => (
                  <button key={area} onClick={() => setSubStep(area)} className={`btn ${subStep === area ? 'btn-primary' : ''}`} style={{ fontSize: '0.7rem' }}>{area}</button>
                ))}
              </div>

              {['Psicopedagógica', 'Psicológica', 'Fonoaudiológica', 'Kinesiológica'].map(area => (
                <section key={area} className={subStep === area ? 'active-area' : 'print-area'} style={{ padding: '1.5rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ color: 'var(--secondary)', textTransform: 'uppercase', fontSize: '0.875rem' }}>ÁREA {area.toUpperCase()}</h4>
                    <button type="button" onClick={() => openAIModal(`Área ${area}`, `area-${area}`)} className="btn no-print" style={{ fontSize: '0.7rem' }}>✨ IA</button>
                  </div>
                  <textarea id={`area-${area}`} className="select-input" style={{ width: '100%', minHeight: '200px' }} placeholder={`Escriba el reporte...`} />
                </section>
              ))}
            </div>
          </div>

          <div className={step === 3 ? 'animate-in' : 'print-only'}>
            <section>
              <h3 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>III. Desempeño Académico</h3>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label>Observaciones</label>
                  <button type="button" onClick={() => openAIModal('Rendimiento Académico', 'desempeno-acad')} className="btn no-print" style={{ fontSize: '0.7rem' }}>✨ IA</button>
                </div>
                <textarea id="desempeno-acad" className="select-input" style={{ width: '100%', minHeight: '250px' }} />
              </div>
            </section>
          </div>

          <div className={step === 4 ? 'animate-in' : 'print-only'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <h3 style={{ color: 'var(--primary)', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem' }}>IV. Convivencia y Salud</h3>
              <section className="card shadow-sm" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.9rem' }}>PARTICIPACIÓN SOCIAL</h4>
                  <button type="button" onClick={() => openAIModal('Convivencia Social', 'conv-social')} className="btn no-print" style={{ fontSize: '0.7rem' }}>✨ IA</button>
                </div>
                <textarea id="conv-social" className="select-input" style={{ width: '100%', minHeight: '120px' }} />
              </section>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }} className="no-print">
          <button onClick={prevStep} disabled={step === 1} className="btn" style={{ background: '#f1f5f9', opacity: step === 1 ? 0.5 : 1 }}>← Anterior</button>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" style={{ background: 'transparent' }} onClick={() => handleSave(false)}>Guardar</button>
            {step < 4 ? <button onClick={nextStep} className="btn btn-primary">Siguiente</button> : <button onClick={() => handleSave(false)} className="btn" style={{ background: 'var(--success)', color: 'white' }}>Finalizar</button>}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        label { font-size: 0.8125rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
        @media screen { .print-only, .print-area, .print-header { display: none !important; } .active-area { display: block !important; } }
        @media print {
          @page { margin: 2cm; size: letter; }
          body { font-family: "Times New Roman", Times, serif !important; color: black !important; }
          .print-header { display: block !important; }
          aside, header, .stepper, .btn, .no-print { display: none !important; }
          .card { box-shadow: none !important; border: none !important; padding: 0 !important; }
          .print-only, .print-area, .active-area { display: block !important; margin-top: 1rem; }
        }
        .spinner { width: 40px; height: 40px; border: 4px solid rgba(99, 102, 241, 0.1); border-left-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      ` }} />
    </div>
  );
}
