'use client';
import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { calculateAge } from '@/lib/dateUtils';
import Toast from '@/components/Toast';
import PrintSettings from '@/components/PrintSettings';

export default function FormularioUnico({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [formData, setFormData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAIField, setActiveAIField] = useState({ label: '', id: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRes = await fetch(`/api/students/${params.id}`);
        const studentResult = await studentRes.json();
        
        if (studentResult.success) {
          const student = studentResult.data;
          
          // Fetch existing report
          const reportRes = await fetch(`/api/reports?run=${student.run}&type=unico`);
          const reportResult = await reportRes.json();
          const report = reportResult.data || {};

          setFormData({
            // Estudiante
            nombreIdentidad: student.full_name || '',
            run: student.run || '',
            nombreSocial: student.nombre_social || report.nombreSocial || '',
            fechaNacimiento: student.fecha_nacimiento || report.fechaNacimiento || '',
            edad: calculateAge(student.fecha_nacimiento || report.fechaNacimiento) || report.edad || '',
            cursoNivel: student.curso || '',
            establecimiento: report.establecimiento || 'LICEO CAMPANARIO',

            // Profesional
            profNombre: student.profesor_jefe || report.profNombre || '',
            profRut: report.profRut || '',
            profSocial: report.profSocial || '',
            profRol: report.profRol || '',
            profTelefono: report.profTelefono || '',
            profEmail: report.profEmail || '',
            fechaEntrega: report.fechaEntrega || new Date().toISOString().split('T')[0],

            // Persona que recibe
            recibeNombre: report.recibeNombre || '',
            recibeRut: report.recibeRut || '',
            recibeSocial: report.recibeSocial || '',
            recibeTelefono: report.recibeTelefono || '',
            recibeEmail: report.recibeEmail || '',
            recibeRelacion: report.recibeRelacion || '',
            recibeTitular: report.recibeTitular || false,
            recibeSuplente: report.recibeSuplente || false,
            recibePoder: report.recibePoder || 'No',
            presenciaDe: report.presenciaDe || '',

            // Evaluación
            motivo: report.motivo || 'Ingreso',
            instrumentos: report.instrumentos || '',
            fechaEvaluacion: report.fechaEvaluacion || '',
            diagnostico: student.diagnostico || report.diagnostico || '',

            // Ámbitos
            pedagogicoFortalezas: report.pedagogicoFortalezas || '',
            pedagogicoNecesidades: report.pedagogicoNecesidades || '',
            socialFortalezas: report.socialFortalezas || '',
            socialNecesidades: report.socialNecesidades || '',
            trabajoColaborativo: report.trabajoColaborativo || '',
            apoyoHogar: report.apoyoHogar || '',
            acuerdos: report.acuerdos || '',
            fechasEvaluacion: report.fechasEvaluacion || ['', '', '', '', '', '']
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [params.id]);

  // Recalculate age when birth date changes
  useEffect(() => {
    if (formData?.fechaNacimiento) {
      const newAge = calculateAge(formData.fechaNacimiento);
      if (newAge !== '---' && newAge !== formData.edad) {
        setFormData((prev: any) => ({ ...prev, edad: newAge }));
      }
    }
  }, [formData?.fechaNacimiento]);

  const openAIModal = async (fieldLabel: string, fieldId: string) => {
    setActiveAIField({ label: fieldLabel, id: fieldId });
    setIsAIModalOpen(true);
    setAiLoading(true);
    setAiSuggestions([]);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: `Formulario Único Ministerial: ${fieldLabel}`,
          context: { 
            name: formData.nombreIdentidad, 
            diagnostico: formData.diagnostico, 
            course: formData.cursoNivel 
          },
          length: 'medium'
        })
      });
      const result = await response.json();
      if (result.success && Array.isArray(result.suggestions)) setAiSuggestions(result.suggestions);
    } catch (e) { console.error(e); }
    finally { setAiLoading(false); }
  };

  const useSuggestion = (text: string) => {
    setFormData({ ...formData, [activeAIField.id]: text });
    setIsAIModalOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'unico',
          run: formData.run,
          student_data: {
            full_name: formData.nombreIdentidad,
            curso: formData.cursoNivel,
            fecha_nacimiento: formData.fechaNacimiento,
            nombre_social: formData.nombreSocial,
            diagnostico: formData.diagnostico,
            profesor_jefe: formData.profNombre // Usually the one filling it is the teacher
          },
          data: formData
        })
      });

      const result = await response.json();
      if (result.success) {
        showToast('Formulario Guardado Correctamente', 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      showToast('Error al guardar: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!formData) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando Formulario Ministerial...</div>;

  return (
    <div className="form-container">
      {/* AI Modal */}
      {isAIModalOpen && (
        <div className="modal-overlay no-print">
          <div className="modal-content card shadow-2xl">
            <div className="modal-header">
              <h2>✨ Asistente IA para Formulario Ministerial</h2>
              <button onClick={() => setIsAIModalOpen(false)}>×</button>
            </div>
            {aiLoading ? <div className="loading-state">Generando propuestas técnicas...</div> : (
              <div className="suggestions-list">
                {aiSuggestions.map((text, idx) => (
                  <div key={idx} className="suggestion-card">
                    <p>{text}</p>
                    <button onClick={() => useSuggestion(text)} className="btn btn-primary">Aplicar Sugerencia</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <header className="page-header no-print">
        <Link href="/informes" className="back-link">← Volver a Informes</Link>
        <div className="header-actions">
          <button onClick={handleSave} className="btn btn-save" disabled={saving}>
            {saving ? 'Guardando...' : '💾 Guardar Cambios'}
          </button>
          <button onClick={() => window.print()} className="btn btn-print">🖨️ Imprimir Formato Ministerial</button>
        </div>
      </header>

      {/* DOCUMENT START */}
      <div className="document-sheet shadow-2xl">
        <div className="doc-header">
          <div className="gov-logo">
            <img src="/images/logo_mineduc.jpg" alt="Mineduc" />
          </div>
          <div className="doc-title">
            <p>Evaluación Diagnóstica Integral de Ingreso a Modalidad de Educación Especial</p>
            <h1>INFORME PARA LA FAMILIA</h1>
          </div>
        </div>

        <div className="doc-notice">
          Según el Decreto Nº 170/2010, y reconociendo el rol fundamental de la familia en el proceso educativo, se entregan los resultados de la evaluación de su pupilo/a.
        </div>

        {/* SECTION 1: IDENTIFICACIÓN ESTUDIANTE */}
        <section className="doc-section">
          <h2 className="section-title">IDENTIFICACIÓN DEL ESTUDIANTE</h2>
          <div className="grid-table">
            <div className="cell span-2"><label>Nombre de identidad</label><input value={formData.nombreIdentidad} onChange={e => setFormData({...formData, nombreIdentidad: e.target.value})} /></div>
            <div className="cell"><label>RUT / IPE</label><input value={formData.run} readOnly /></div>
            
            <div className="cell span-2"><label>Nombre social</label><input value={formData.nombreSocial} onChange={e => setFormData({...formData, nombreSocial: e.target.value})} /></div>
            <div className="cell"><label>Fecha nacimiento</label><input type="date" value={formData.fechaNacimiento} onChange={e => setFormData({...formData, fechaNacimiento: e.target.value})} /></div>
            
            <div className="cell"><label>Edad</label><input value={formData.edad} onChange={e => setFormData({...formData, edad: e.target.value})} /></div>
            <div className="cell"><label>Curso / Nivel</label><input value={formData.cursoNivel} onChange={e => setFormData({...formData, cursoNivel: e.target.value})} /></div>
            <div className="cell"><label>Establecimiento</label><input value={formData.establecimiento} onChange={e => setFormData({...formData, establecimiento: e.target.value})} /></div>
          </div>
        </section>

        {/* SECTION 2: IDENTIFICACIÓN PROFESIONAL */}
        <section className="doc-section">
          <h2 className="section-title">IDENTIFICACIÓN DEL PROFESIONAL</h2>
          <div className="grid-table">
            <div className="cell span-2"><label>Nombre de identidad</label><input value={formData.profNombre} onChange={e => setFormData({...formData, profNombre: e.target.value})} /></div>
            <div className="cell"><label>Rut</label><input value={formData.profRut} onChange={e => setFormData({...formData, profRut: e.target.value})} /></div>
            
            <div className="cell span-2"><label>Nombre social</label><input value={formData.profSocial} onChange={e => setFormData({...formData, profSocial: e.target.value})} /></div>
            <div className="cell"><label>Rol/cargo</label><input value={formData.profRol} onChange={e => setFormData({...formData, profRol: e.target.value})} /></div>
            
            <div className="cell"><label>Teléfono</label><input value={formData.profTelefono} onChange={e => setFormData({...formData, profTelefono: e.target.value})} /></div>
            <div className="cell"><label>E-mail de contacto</label><input value={formData.profEmail} onChange={e => setFormData({...formData, profEmail: e.target.value})} /></div>
            <div className="cell"><label>Fecha entrega del informe</label><input type="date" value={formData.fechaEntrega} onChange={e => setFormData({...formData, fechaEntrega: e.target.value})} /></div>
          </div>
        </section>

        {/* SECTION 3: PERSONA QUE RECIBE */}
        <section className="doc-section">
          <h2 className="section-title">IDENTIFICACIÓN DE LA PERSONA QUE RECIBE LA INFORMACIÓN</h2>
          <div className="grid-table">
            <div className="cell span-2"><label>Nombre de identidad</label><input value={formData.recibeNombre} onChange={e => setFormData({...formData, recibeNombre: e.target.value})} /></div>
            <div className="cell"><label>Rut / Pasaporte</label><input value={formData.recibeRut} onChange={e => setFormData({...formData, recibeRut: e.target.value})} /></div>
            
            <div className="cell span-2"><label>Nombre social</label><input value={formData.recibeSocial} onChange={e => setFormData({...formData, recibeSocial: e.target.value})} /></div>
            <div className="cell"><label>Teléfono</label><input value={formData.recibeTelefono} onChange={e => setFormData({...formData, recibeTelefono: e.target.value})} /></div>
            
            <div className="cell span-2"><label>E-mail de contacto</label><input value={formData.recibeEmail} onChange={e => setFormData({...formData, recibeEmail: e.target.value})} /></div>
            <div className="cell"><label>Relación con el/la estudiante</label><input placeholder="madre, padre, abuelo/a, tutor/a" value={formData.recibeRelacion} onChange={e => setFormData({...formData, recibeRelacion: e.target.value})} /></div>

            <div className="cell span-2" style={{ flexDirection: 'row', gap: '1rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="checkbox" checked={formData.recibeTitular} onChange={e => setFormData({...formData, recibeTitular: e.target.checked})} /> Apoderado/a titular
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="checkbox" checked={formData.recibeSuplente} onChange={e => setFormData({...formData, recibeSuplente: e.target.checked})} /> Apoderado/a suplente
              </label>
            </div>
            <div className="cell">
              <label>Presenta Poder Simple (Suplente)</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                <label><input type="radio" checked={formData.recibePoder === 'Sí'} onChange={() => setFormData({...formData, recibePoder: 'Sí'})} /> Sí</label>
                <label><input type="radio" checked={formData.recibePoder === 'No'} onChange={() => setFormData({...formData, recibePoder: 'No'})} /> No</label>
              </div>
            </div>

            <div className="cell span-3"><label>En presencia de (miembro de la familia, intérprete, otro/a)</label><input value={formData.presenciaDe} onChange={e => setFormData({...formData, presenciaDe: e.target.value})} /></div>
          </div>
        </section>

        {/* SECTION 4: RESULTADOS */}
        <section className="doc-section">
          <h2 className="section-title">RESULTADOS DE LA EVALUACIÓN</h2>
          <div className="grid-table" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <div className="cell">
              <label>MOTIVO DE LA EVALUACIÓN</label>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                <label><input type="radio" checked={formData.motivo === 'Ingreso'} onChange={() => setFormData({...formData, motivo: 'Ingreso'})} /> Evaluación de Ingreso</label>
                <label><input type="radio" checked={formData.motivo === 'Reevaluación'} onChange={() => setFormData({...formData, motivo: 'Reevaluación'})} /> Reevaluación fin año 2</label>
              </div>
            </div>
            <div className="cell"><label>Fecha de evaluación</label><input type="date" value={formData.fechaEvaluacion} onChange={e => setFormData({...formData, fechaEvaluacion: e.target.value})} /></div>
            
            <div className="cell">
              <div className="field-header">INSTRUMENTOS APLICADOS (test, pautas, otros) <button onClick={() => openAIModal('Instrumentos Aplicados', 'instrumentos')} className="no-print">✨ IA</button></div>
              <textarea value={formData.instrumentos} onChange={e => setFormData({...formData, instrumentos: e.target.value})} style={{ minHeight: '100px' }} />
            </div>
            <div className="cell">
              <label>Diagnóstico NEE</label>
              <textarea value={formData.diagnostico} onChange={e => setFormData({...formData, diagnostico: e.target.value})} style={{ minHeight: '100px' }} placeholder="No utilice siglas" />
            </div>
          </div>
        </section>

        {/* PAGE BREAK (Mental for PDF) */}
        <div className="page-break"></div>

        {/* SECTION 5: FORTALEZAS */}
        <section className="doc-section">
          <h2 className="section-title">FORTALEZAS Y NECESIDADES</h2>
          
          <div className="ambito-container">
            <h3 className="ambito-title">ÁMBITO PEDAGÓGICO</h3>
            <div className="grid-table" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="cell">
                <div className="field-header">Fortalezas - Logros - Talentos <button onClick={() => openAIModal('Fortalezas Pedagógicas', 'pedagogicoFortalezas')} className="no-print">✨ IA</button></div>
                <textarea value={formData.pedagogicoFortalezas} onChange={e => setFormData({...formData, pedagogicoFortalezas: e.target.value})} style={{ minHeight: '200px' }} />
              </div>
              <div className="cell">
                <div className="field-header">Necesidades de Apoyo <button onClick={() => openAIModal('Necesidades Pedagógicas', 'pedagogicoNecesidades')} className="no-print">✨ IA</button></div>
                <textarea value={formData.pedagogicoNecesidades} onChange={e => setFormData({...formData, pedagogicoNecesidades: e.target.value})} style={{ minHeight: '200px' }} />
              </div>
            </div>
          </div>

          <div className="ambito-container">
            <h3 className="ambito-title">ÁMBITO SOCIAL/AFECTIVO</h3>
            <div className="grid-table" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="cell">
                <div className="field-header">Fortalezas - Logros - Talent <button onClick={() => openAIModal('Fortalezas Sociales', 'socialFortalezas')} className="no-print">✨ IA</button></div>
                <textarea value={formData.socialFortalezas} onChange={e => setFormData({...formData, socialFortalezas: e.target.value})} style={{ minHeight: '200px' }} />
              </div>
              <div className="cell">
                <div className="field-header">Necesidades de Apoyo <button onClick={() => openAIModal('Necesidades Sociales', 'socialNecesidades')} className="no-print">✨ IA</button></div>
                <textarea value={formData.socialNecesidades} onChange={e => setFormData({...formData, socialNecesidades: e.target.value})} style={{ minHeight: '200px' }} />
              </div>
            </div>
          </div>
        </section>

        <section className="doc-section">
          <h2 className="section-title">TRABAJO COLABORATIVO</h2>
          <div className="cell no-border">
            <div className="field-header" style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>Participación en sala de clases, sala de recursos, comunidad educativa, articulación profesional, etc. <button onClick={() => openAIModal('Trabajo Colaborativo', 'trabajoColaborativo')} className="no-print">✨ IA</button></div>
            <textarea value={formData.trabajoColaborativo} onChange={e => setFormData({...formData, trabajoColaborativo: e.target.value})} style={{ minHeight: '150px' }} />
          </div>
        </section>

        {/* SECTION 6: HOGAR Y ACUERDOS */}
        <section className="doc-section">
          <h2 className="section-title">APOYOS HOGAR</h2>
          <div className="cell no-border">
            <div className="field-header" style={{ fontSize: '0.7rem' }}>Autoestima, asistencia regular, apoyo escolar, hábitos, higiene, compromiso, salud, etc. <button onClick={() => openAIModal('Apoyos Hogar', 'apoyoHogar')} className="no-print">✨ IA</button></div>
            <textarea value={formData.apoyoHogar} onChange={e => setFormData({...formData, apoyoHogar: e.target.value})} style={{ minHeight: '120px' }} />
          </div>
        </section>

        <section className="doc-section">
          <h2 className="section-title">ACUERDOS Y COMPROMISOS</h2>
          <textarea value={formData.acuerdos} onChange={e => setFormData({...formData, acuerdos: e.target.value})} style={{ minHeight: '150px', border: 'none', width: '100%', padding: '1rem' }} />
        </section>

        <section className="doc-section">
          <h2 className="section-title">FECHAS EVALUACIÓN</h2>
          <div className="grid-table" style={{ gridTemplateColumns: '2fr repeat(6, 1fr)' }}>
            <div className="cell" style={{ fontSize: '0.7rem' }}>(Solo consignar las fechas determinadas por el establecimiento)</div>
            {formData.fechasEvaluacion.map((fecha: string, i: number) => (
              <div key={i} className="cell">
                <input 
                  type="text" 
                  placeholder="---" 
                  value={fecha} 
                  onChange={e => {
                    const newFechas = [...formData.fechasEvaluacion];
                    newFechas[i] = e.target.value;
                    setFormData({...formData, fechasEvaluacion: newFechas});
                  }} 
                  style={{ textAlign: 'center' }}
                />
              </div>
            ))}
          </div>
        </section>

        <footer className="doc-footer">
          <div className="signatures-row">
            <div className="signature-area">
              <div className="sig-line"></div>
              <p>Firma y timbre responsable equipo gestión</p>
            </div>
            <div className="signature-area">
              <div className="sig-line"></div>
              <p>Firma familiar o representante</p>
            </div>
          </div>
          <div className="format-stamp">FORMATO MINISTERIAL OBLIGATORIO PARA LA EVALUACIÓN DE INGRESO Y REEVALUACIÓN (fin año 2)</div>
        </footer>
      </div>

      {/* Floating Save Button */}
      <button onClick={handleSave} className="floating-save no-print" title="Guardar cambios">
        {saving ? '⌛' : '💾'}
      </button>

      <PrintSettings />
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

        .form-container { 
          background: #f8fafc; 
          min-height: 100vh; 
          padding: 3rem 1rem; 
          font-family: 'Inter', sans-serif; 
          color: #0f172a;
        }
        
        .back-link { 
          color: #64748b; 
          font-weight: 600; 
          text-decoration: none; 
          font-size: 0.875rem; 
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s; 
        }
        .back-link:hover { color: #4f46e5; transform: translateX(-4px); }
        
        .page-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          max-width: 900px; 
          margin: 0 auto 2.5rem; 
        }
        .header-actions { display: flex; gap: 0.75rem; }
        
        .btn { 
          padding: 0.75rem 1.5rem; 
          border-radius: 12px; 
          font-weight: 700; 
          cursor: pointer; 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
          border: none; 
          font-size: 0.875rem; 
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-save { 
          background: #0f172a; 
          color: white; 
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
        }
        .btn-print { 
          background: #4f46e5; 
          color: white; 
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
        .btn:active { transform: translateY(0); }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .document-sheet {
          background: white;
          width: 8.5in;
          min-height: 11in;
          margin: 0 auto;
          padding: 10mm 12mm;
          position: relative;
          color: #000;
          line-height: 1.35;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .doc-header { 
          display: flex; 
          align-items: center; 
          gap: 2rem; 
          margin-bottom: 0.5rem; 
          border-bottom: 3px solid #000; 
          padding-bottom: 0.5rem; 
          padding-top: 0;
        }
        .gov-logo img { 
          height: 60px; 
          filter: grayscale(0.2); 
          transition: all 0.3s ease;
        }
        .doc-title { text-align: center; flex: 1; }
        .doc-title p { font-size: 0.65rem; font-weight: 800; margin: 0; color: #475569; letter-spacing: 0.5px; }
        .doc-title h1 { font-size: 1.25rem; font-weight: 900; margin: 0.2rem 0; letter-spacing: -0.5px; line-height: 1.1; }

        .doc-notice { 
          background: #f1f5f9;
          border: 1px solid #cbd5e1; 
          padding: 1rem 1.5rem; 
          font-size: 0.75rem; 
          text-align: justify; 
          font-weight: 600; 
          margin-bottom: 1.5rem; 
          border-radius: 4px;
          line-height: 1.5;
        }

        .doc-section { 
          margin-bottom: 0.75rem; 
          border: 1.5px solid #000; 
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .section-title { 
          background: #fee2e2; 
          padding: 0.3rem 0.6rem; 
          font-size: 0.75rem; 
          font-weight: 900; 
          border-bottom: 1.5px solid #000; 
          margin: 0; 
          text-transform: uppercase;
          color: #991b1b;
        }
        
        .grid-table { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; background: #000; }
        .cell { 
          background: white; 
          border: 0.5px solid #000; 
          padding: 0.2rem 0.5rem; 
          display: flex; 
          flex-direction: column; 
          min-height: 35px;
        }
        .span-2 { grid-column: span 2; }
        .span-3 { grid-column: span 3; }
        
        .cell label { 
          font-size: 0.6rem; 
          font-weight: 900; 
          text-transform: uppercase; 
          color: #64748b; 
          margin-bottom: 0.15rem; 
          letter-spacing: 0.025em;
        }
        .cell input, .cell textarea { 
          border: none; 
          font-size: 0.9rem; 
          font-weight: 600;
          padding: 0.1rem 0; 
          width: 100%; 
          outline: none; 
          background: transparent; 
          font-family: inherit; 
          color: #1e293b;
        }
        .cell textarea { resize: none; min-height: 80px; }

        .field-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          font-size: 0.6rem; 
          font-weight: 900; 
          text-transform: uppercase; 
          margin-bottom: 0.4rem; 
          color: #64748b;
        }
        .field-header button { 
          font-size: 0.6rem; 
          padding: 0.2rem 0.6rem; 
          background: #4f46e5; 
          color: white; 
          border: none; 
          border-radius: 6px; 
          cursor: pointer;
          font-weight: 800;
        }

        .ambito-container { margin-bottom: 0; }
        .ambito-title { 
          background: #f8fafc; 
          border-bottom: 1px solid #000; 
          border-top: 1px solid #000; 
          margin: 0; 
          padding: 0.4rem 0.75rem; 
          font-size: 0.75rem; 
          font-weight: 900; 
          color: #334155;
          letter-spacing: 0.05em;
        }

        .doc-footer { 
          margin-top: 3.5rem; 
          padding: 0 2rem; 
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }
        .signatures-row {
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 5rem; 
        }
        .signature-area { text-align: center; }
        .sig-line { border-top: 2px solid #000; margin-bottom: 0.75rem; }
        .signature-area p { font-size: 0.7rem; font-weight: 800; margin: 0; line-height: 1.4; color: #334155; }

        .format-stamp { 
          text-align: center; 
          font-size: 0.65rem; 
          font-weight: 900; 
          text-transform: uppercase; 
          color: #94a3b8;
          letter-spacing: 1.5px;
          margin-top: 1rem;
        }

        .floating-save { 
          position: fixed; 
          bottom: 2.5rem; 
          right: 2.5rem; 
          width: 60px; 
          height: 60px; 
          border-radius: 20px; 
          background: #0f172a; 
          color: white; 
          border: none; 
          font-size: 1.5rem; 
          cursor: pointer; 
          box-shadow: 0 20px 40px rgba(0,0,0,0.3); 
          z-index: 1000; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .floating-save:hover { transform: scale(1.1) rotate(5deg); background: #4f46e5; }

        /* MODAL */
        .modal-overlay { 
          position: fixed; 
          inset: 0; 
          background: rgba(15, 23, 42, 0.8); 
          backdrop-filter: blur(8px);
          z-index: 2000; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          padding: 2rem; 
        }
        .modal-content { 
          background: white; 
          width: 100%; 
          max-width: 850px; 
          max-height: 85vh; 
          overflow-y: auto; 
          padding: 3rem; 
          border-radius: 24px; 
          box-shadow: 0 40px 100px rgba(0,0,0,0.4);
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .modal-header h2 { font-size: 1.5rem; color: #0f172a; margin: 0; font-weight: 900; letter-spacing: -0.5px; }
        .modal-header button { font-size: 2.5rem; background: none; border: none; cursor: pointer; color: #94a3b8; transition: color 0.2s; }
        .modal-header button:hover { color: #ef4444; }
        .suggestion-card { 
          background: #f8fafc; 
          border: 1px solid #e2e8f0; 
          padding: 2rem; 
          border-radius: 20px; 
          margin-bottom: 1.5rem; 
          transition: all 0.2s;
        }
        .suggestion-card:hover { border-color: #4f46e5; background: #f5f3ff; }
        .suggestion-card p { font-size: 0.95rem; line-height: 1.7; color: #334155; margin-bottom: 1.5rem; font-weight: 500; }

        @media print {
          @page { 
            margin: 0 !important; 
            size: letter !important; 
          }
          body { background: white; }
          .form-container { padding: 0; background: white; }
          .no-print { display: none !important; }
          .document-sheet { 
            width: 100%; 
            height: auto; 
            margin: 0; 
            padding: 5mm 12mm; 
            border: none; 
            box-shadow: none; 
          }
          .doc-section { 
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            border: 2px solid #000 !important;
            margin-bottom: 0.5rem !important;
          }
          .grid-table { background: #000 !important; }
          .cell { border: 0.5px solid #000 !important; padding: 0.2rem 0.5rem !important; }
          .section-title { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            background: #f8fafc !important; 
            color: black !important; 
            border-bottom: 2px solid #000 !important;
          }
          .ambito-title { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #f8fafc !important; }
          .doc-notice { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; border: 1px solid #000 !important; }
          
          textarea { height: auto !important; min-height: 0 !important; overflow: visible !important; }
          input, textarea { font-weight: 700 !important; color: #000 !important; font-size: inherit !important; }
          
          .page-break { 
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

