'use client';
import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import { calculateAge, formatDate } from '@/lib/dateUtils';
import Toast from '@/components/Toast';
import PrintSettings from '@/components/PrintSettings';

const PEDAGOGICAL_ITEMS = [
  "Demuestra comprensión de instrucciones orales, escritas o en lengua de señas, respondiendo a ellas de acuerdo con sus posibilidades comunicativas y utilizando los apoyos necesarios.",
  "Manifiesta disposición para el aprendizaje, prestando atención a quien conduce la actividad y mostrando interés por las tareas.",
  "Mantiene la atención en las actividades, con o sin apoyo, durante períodos adecuados a su edad, características y necesidades educativas.",
  "Organiza su tiempo y materiales para iniciar, desarrollar y concluir una actividad, demostrando progresiva autonomía en función de los apoyos que requiere.",
  "Utiliza estrategias personales o apoyos disponibles para resolver dificultades, solicitando colaboración cuando lo necesita o respondiendo positivamente al acompañamiento del adulto.",
  "Participa en actividades grupales, colaborando según sus posibilidades, respetando turnos, aportando ideas o interactuando con sus pares con apoyo si es necesario.",
  "Muestra iniciativa en el desarrollo de tareas, proponiendo ideas, alternativas o formas propias de realizar una actividad, con o sin mediación del adulto.",
  "Expresa ideas, emociones o experiencias a través de diversos lenguajes (oral, escrito, gestual, plástico o tecnológico), utilizando los apoyos comunicativos pertinentes.",
  "Evidencia avances en la ejecución de tareas escolares, mostrando esfuerzo, persistencia y sentido de logro, considerando su punto de partida y los apoyos recibidos.",
  "Reflexiona sobre su propio proceso de aprendizaje, reconociendo sus logros y desafíos con apoyo del adulto o mediante estrategias de autorreflexión adaptadas a sus necesidades."
];

const SOCIAL_ITEMS = [
  "Atiende y muestra interés ante las interacciones comunicativas (conversaciones, exposiciones o gestos) utilizando los medios de comunicación que le resultan accesibles.",
  "Participa en intercambios comunicativos, respetando turnos e interviniendo mediante lenguaje oral, señas, gestos, apoyos visuales o sistemas aumentativos y alternativos de comunicación.",
  "Colabora y participa en actividades grupales o de juego colectivo, de acuerdo con sus intereses, posibilidades y utilizando los apoyos necesarios.",
  "Inicia interacciones sociales (conversaciones, juegos o gestos de acercamiento) y propone ideas o acciones en actividades compartidas, mostrando disposición e iniciativa para participar con otros.",
  "Participa en la organización de juegos o tareas, expresando sus ideas, escuchando a otros y negociando acuerdos, con o sin apoyo según sus necesidades.",
  "Recibe y responde a comentarios, críticas o sugerencias de sus pares o adultos, adaptando su conducta o expresando su punto de vista de forma respetuosa.",
  "Solicita ayuda o colaboración cuando la necesita, utilizando las formas de comunicación disponibles y adecuadas a su contexto.",
  "Acepta ayuda o acompañamiento de sus pares o adultos, mostrando disposición para el trabajo colaborativo y la interacción positiva.",
  "Establece y mantiene vínculos positivos con sus compañeros, participando en interacciones sociales significativas y desarrollando sentido de pertenencia al grupo.",
  "Reconoce y expresa emociones propias y de otros durante las interacciones, mostrando empatía y ajustando su conducta de manera respetuosa."
];

export default function PsicopedagogicoForm({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>(null);
  const [semester, setSemester] = useState(1);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // AI assistant state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAIField, setActiveAIField] = useState({ label: '', id: '' });
  const [aiInstruction, setAiInstruction] = useState('');

  const handleSave = async (isAuto = false) => {
    if (saving || !formData) return;
    setSaving(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'psicopedagogico',
          run: formData.estudianteRut,
          student_data: {
            full_name: formData.estudianteNombre,
            nombre_social: formData.estudianteNombreSocial,
            curso: formData.estudianteCurso,
            diagnostico: formData.diagnostico,
            fecha_diagnostico: formData.fechaEmisionDiagnostico
          },
          data: {
            semester,
            folio: formData.folio,
            estudianteNombreSocial: formData.estudianteNombreSocial,
            fechaEvaluacion: formData.fechaEvaluacion,
            fechaEmisionDiagnostico: formData.fechaEmisionDiagnostico,
            
            motivoEvaluacion: formData.motivoEvaluacion,
            motivoOtrosDetalle: formData.motivoOtrosDetalle,
            instrumentosAplicados: formData.instrumentosAplicados,
            antecedentesEscolares: formData.antecedentesEscolares,
            
            analisisCognitivo: formData.analisisCognitivo,
            analisisSocioemocional: formData.analisisSocioemocional,
            analisisMotor: formData.analisisMotor,
            
            sintesisCognitivo: formData.sintesisCognitivo,
            sintesisSocioemocional: formData.sintesisSocioemocional,
            sintesisMotor: formData.sintesisMotor,
            sintesisConclusion: formData.sintesisConclusion,
            
            sugerenciasEstablecimiento: formData.sugerenciasEstablecimiento,
            sugerenciasEquipoAula: formData.sugerenciasEquipoAula,
            sugerenciasEstudiante: formData.sugerenciasEstudiante,
            sugerenciasFamilia: formData.sugerenciasFamilia,
            sugerenciasOtros: formData.sugerenciasOtros,
            
            profesionalNombre: formData.profesionalNombre,
            profesionalRut: formData.profesionalRut,
            profesionalProfesion: formData.profesionalProfesion,
            profesionalRegistro: formData.profesionalRegistro,
            
            fechaAplicacionPauta: formData.fechaAplicacionPauta,
            pautaPedagogica: formData.pautaPedagogica,
            pautaSocial: formData.pautaSocial,
            
            docenteNombre: formData.docenteNombre,
            docenteRut: formData.docenteRut,
            docenteProfesion: formData.docenteProfesion
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setLastSaved(new Date());
        if (!isAuto) showToast('Informe Guardado Correctamente', 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (!formData) return;
    const timer = setTimeout(() => {
      handleSave(true);
    }, 10000); // 10 seconds of idle
    return () => clearTimeout(timer);
  }, [formData, semester]);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRes = await fetch(`/api/students/${params.id}`);
        const studentResult = await studentRes.json();
        
        if (studentResult.success) {
          const student = studentResult.data;
          
          const reportRes = await fetch(`/api/reports?run=${student.run}&type=psicopedagogico&semester=${semester}`);
          const reportResult = await reportRes.json();
          const report = reportResult.data || {};

          // Initial state for observation scales
          const initialPautaPedagogica = report.pautaPedagogica || {};
          const initialPautaSocial = report.pautaSocial || {};

          setFormData({
            folio: report.folio || `PP-2026-${params.id.slice(0, 4)}`,
            estudianteNombre: student.full_name,
            estudianteNombreSocial: student.nombre_social || report.estudianteNombreSocial || '',
            estudianteRut: student.run,
            estudianteFechaNac: formatDate(student.fecha_nacimiento), 
            estudianteEdad: calculateAge(student.fecha_nacimiento), 
            estudianteCurso: student.curso,
            estudianteEstablecimiento: report.estudianteEstablecimiento || 'LICEO CAMPANARIO',
            fechaEvaluacion: report.fechaEvaluacion || new Date().toISOString().split('T')[0],
            diagnostico: student.diagnostico || '',
            fechaEmisionDiagnostico: student.fecha_diagnostico || report.fechaEmisionDiagnostico || '',
            
            motivoEvaluacion: report.motivoEvaluacion || 'reevaluacion', // 'ingreso' | 'reevaluacion' | 'otro'
            motivoOtrosDetalle: report.motivoOtrosDetalle || '',
            instrumentosAplicados: report.instrumentosAplicados || '',
            antecedentesEscolares: report.antecedentesEscolares || '',
            
            analisisCognitivo: report.analisisCognitivo || '',
            analisisSocioemocional: report.analisisSocioemocional || '',
            analisisMotor: report.analisisMotor || '',
            
            sintesisCognitivo: report.sintesisCognitivo || '',
            sintesisSocioemocional: report.sintesisSocioemocional || '',
            sintesisMotor: report.sintesisMotor || '',
            sintesisConclusion: report.sintesisConclusion || '',
            
            sugerenciasEstablecimiento: report.sugerenciasEstablecimiento || '',
            sugerenciasEquipoAula: report.sugerenciasEquipoAula || '',
            sugerenciasEstudiante: report.sugerenciasEstudiante || '',
            sugerenciasFamilia: report.sugerenciasFamilia || '',
            sugerenciasOtros: report.sugerenciasOtros || '',
            
            profesionalNombre: report.profesionalNombre || '',
            profesionalRut: report.profesionalRut || '',
            profesionalProfesion: report.profesionalProfesion || 'Psicopedagogo/a',
            profesionalRegistro: report.profesionalRegistro || '',
            
            fechaAplicacionPauta: report.fechaAplicacionPauta || new Date().toISOString().split('T')[0],
            pautaPedagogica: initialPautaPedagogica,
            pautaSocial: initialPautaSocial,
            
            docenteNombre: report.docenteNombre || '',
            docenteRut: report.docenteRut || '',
            docenteProfesion: report.docenteProfesion || 'Docente de Aula Regular'
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

  const openAIModal = async (fieldLabel: string, fieldId: string, instruction = '') => {
    setActiveAIField({ label: fieldLabel, id: fieldId });
    setIsAIModalOpen(true);
    setAiLoading(true);
    setAiSuggestions([]);

    const currentContent = formData[fieldId] || '';
    
    // Pass other fields to ensure context is maintained
    const otherContext = {
      motivo: formData.motivoEvaluacion,
      antecedentes: formData.antecedentesEscolares,
      instrumentos: formData.instrumentosAplicados,
      analisisCognitivo: formData.analisisCognitivo,
      analisisSocioemocional: formData.analisisSocioemocional,
      analisisMotor: formData.analisisMotor
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
            otherProfessionalNotes: otherContext,
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

  const handlePautaChange = (pautaType: 'pautaPedagogica' | 'pautaSocial', index: number, value: string) => {
    setFormData({
      ...formData,
      [pautaType]: {
        ...formData[pautaType],
        [index]: value
      }
    });
  };

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
              Generando sugerencias coherentes con el resto de la evaluación para: <strong>{activeAIField.label}</strong>
            </p>
            <div style={{ background: '#f0f9ff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '2rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0369a1', display: 'block', marginBottom: '0.5rem' }}>💡 ¿TIENES ALGUNA IDEA O NOTA ESPECÍFICA?</label>
              <textarea 
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="Ej: Destacar avances en razonamiento matemático o pedir más apoyo familiar..."
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

      {/* Header View */}
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} className="no-print">
        <div>
          <Link href="/informes?type=psicopedagogico" style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span>←</span> Volver a Lista
          </Link>
          <h1 style={{ fontSize: '1.75rem' }}>Evaluación Psicopedagógica (Decreto 170)</h1>
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
            style={{ background: '#0891b2', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>🖨️</span> Generar Reporte PDF
          </button>
        </div>
      </header>

      {/* Stepper Navigation */}
      <div className="stepper no-print" style={{ marginBottom: '3rem', maxWidth: '850px' }}>
        {[
          { num: 1, text: "Identificación" },
          { num: 2, text: "Análisis" },
          { num: 3, text: "Síntesis" },
          { num: 4, text: "Sugerencias" },
          { num: 5, text: "Obs. Pedagógica" },
          { num: 6, text: "Obs. Social" }
        ].map(s => (
          <div key={s.num} className={`step ${step >= s.num ? 'active' : ''}`} onClick={() => setStep(s.num)} style={{ cursor: 'pointer' }}>
            <div className="step-number">{step > s.num ? '✓' : s.num}</div>
            <span>{s.text}</span>
          </div>
        ))}
      </div>

      {/* Form Container */}
      <div className="card shadow-lg no-print" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          
          {/* STEP 1: IDENTIFICACION & MOTIVO */}
          <div className={step === 1 ? 'animate-in' : 'print-only'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <section className="print-section-break">
                <div className="print-header-block" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Decreto 170/2010</p>
                  <p style={{ fontSize: '0.8rem', margin: '0.2rem 0' }}>Evaluación Diagnóstica Integral de Necesidades Educativas Especiales</p>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)', margin: '0.5rem 0' }}>INFORME DE EVALUACIÓN PSICOPEDAGÓGICA</h2>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, fontStyle: 'italic', margin: 0 }}>(Detección de NEE)</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>No se debe modificar el formato oficial; cada apartado debe conservar su estructura e información base.</p>
                </div>

                <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>I. IDENTIFICACIÓN</h3>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-grid-2col">
                  <div className="form-group"><label>Nombre del Estudiante</label><input type="text" className="select-input" value={formData.estudianteNombre} onChange={e => setFormData({...formData, estudianteNombre: e.target.value})} /></div>
                  <div className="form-group"><label>Nombre Social del Estudiante</label><input type="text" className="select-input" value={formData.estudianteNombreSocial} onChange={e => setFormData({...formData, estudianteNombreSocial: e.target.value})} /></div>
                  <div className="form-group"><label>RUT / RUN</label><input type="text" className="select-input" value={formData.estudianteRut} readOnly /></div>
                  <div className="form-group"><label>Fecha de Nacimiento</label><input type="text" className="select-input" value={formData.estudianteFechaNac} readOnly /></div>
                  <div className="form-group"><label>Edad</label><input type="text" className="select-input" value={formData.estudianteEdad} readOnly /></div>
                  <div className="form-group"><label>Establecimiento</label><input type="text" className="select-input" value={formData.estudianteEstablecimiento} onChange={e => setFormData({...formData, estudianteEstablecimiento: e.target.value})} /></div>
                  <div className="form-group"><label>Curso / Nivel</label><input type="text" className="select-input" value={formData.estudianteCurso} onChange={e => setFormData({...formData, estudianteCurso: e.target.value})} /></div>
                  <div className="form-group"><label>Fecha de Evaluación</label><input type="date" className="select-input" value={formData.fechaEvaluacion} onChange={e => setFormData({...formData, fechaEvaluacion: e.target.value})} /></div>
                  <div className="form-group"><label>Diagnóstico NEE</label><input type="text" className="select-input" value={formData.diagnostico} onChange={e => setFormData({...formData, diagnostico: e.target.value})} /></div>
                  <div className="form-group"><label>Fecha de Emisión de Diagnóstico</label><input type="date" className="select-input" value={formData.fechaEmisionDiagnostico} onChange={e => setFormData({...formData, fechaEmisionDiagnostico: e.target.value})} /></div>
                </div>
              </section>

              <section className="print-avoid-break">
                <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>II. MOTIVO DE EVALUACIÓN PSICOPEDAGÓGICA</h3>
                </div>
                
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }} className="no-print">
                  {['ingreso', 'reevaluacion', 'otro'].map(op => (
                    <label key={op} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="radio" 
                        name="motivo" 
                        value={op} 
                        checked={formData.motivoEvaluacion === op} 
                        onChange={e => setFormData({...formData, motivoEvaluacion: e.target.value})} 
                      />
                      {op === 'ingreso' ? 'INGRESO' : op === 'reevaluacion' ? 'REEVALUACIÓN' : 'OTRO'}
                    </label>
                  ))}
                </div>

                <div className="print-only" style={{ marginBottom: '1rem' }}>
                  <strong>MOTIVO DE EVALUACIÓN: </strong>
                  <span>[ {formData.motivoEvaluacion === 'ingreso' ? 'X' : ' '} ] INGRESO &nbsp;&nbsp;&nbsp;&nbsp; [ {formData.motivoEvaluacion === 'reevaluacion' ? 'X' : ' '} ] REEVALUACIÓN &nbsp;&nbsp;&nbsp;&nbsp; [ {formData.motivoEvaluacion === 'otro' ? 'X' : ' '} ] OTRO</span>
                </div>

                {formData.motivoEvaluacion === 'otro' && (
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label>Especifique otro motivo</label>
                    <input type="text" className="select-input" value={formData.motivoOtrosDetalle} onChange={e => setFormData({...formData, motivoOtrosDetalle: e.target.value})} />
                  </div>
                )}

                <div className="form-group">
                  <label>Instrumentos Aplicados</label>
                  <textarea 
                    className="select-input" 
                    placeholder="Listar los tests, baterías o pautas psicopedagógicas aplicadas..." 
                    style={{ width: '100%', minHeight: '120px' }} 
                    value={formData.instrumentosAplicados} 
                    onChange={e => setFormData({...formData, instrumentosAplicados: e.target.value})} 
                  />
                </div>
              </section>

              <section className="print-avoid-break">
                <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>III. ANTECEDENTES RELEVANTES SOBRE LA HISTORIA ESCOLAR</h3>
                </div>
                <div className="form-group">
                  <textarea 
                    className="select-input" 
                    placeholder="Resumen de historia escolar, repitencias, apoyos previos, asistencia..." 
                    style={{ width: '100%', minHeight: '150px' }} 
                    value={formData.antecedentesEscolares} 
                    onChange={e => setFormData({...formData, antecedentesEscolares: e.target.value})} 
                  />
                </div>
              </section>
            </div>
          </div>

          {/* STEP 2: ANALISIS CUALITATIVO */}
          <div className={step === 2 ? 'animate-in' : 'print-only'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <section className="print-section-break">
                <div className="print-header-block print-only" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Decreto 170/2010</p>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text)', margin: '0.5rem 0' }}>INFORME DE EVALUACIÓN PSICOPEDAGÓGICA</h2>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No se debe modificar el formato oficial; cada apartado debe conservar su estructura e información base. (Pág. 2)</p>
                </div>

                <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>IV. ANÁLISIS CUALITATIVO DE INSTRUMENTOS APLICADOS</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>(Incorporar análisis cuantitativo de ser necesario)</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>a) Habilidades Cognitivas y Comunicativas</label>
                      <button type="button" onClick={() => openAIModal('Habilidades Cognitivas y Comunicativas (Análisis)', 'analisisCognitivo')} className="btn no-print" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>✨ IA</button>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Atención y concentración, Memoria, Funciones ejecutivas, Razonamiento lógico-matemático, Resolución de problemas, Lenguaje oral/escrito, Comprensión lectora.</span>
                    <textarea className="select-input" style={{ width: '100%', minHeight: '180px' }} value={formData.analisisCognitivo} onChange={e => setFormData({...formData, analisisCognitivo: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>b) Habilidades Personales, Socioemocionales y de Aproximación al Aprendizaje</label>
                      <button type="button" onClick={() => openAIModal('Habilidades Personales y Socioemocionales (Análisis)', 'analisisSocioemocional')} className="btn no-print" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>✨ IA</button>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Autoestima, motivación, manejo de emociones, tolerancia a la frustración, trabajo en equipo, empatía, flexibilidad cognitiva.</span>
                    <textarea className="select-input" style={{ width: '100%', minHeight: '180px' }} value={formData.analisisSocioemocional} onChange={e => setFormData({...formData, analisisSocioemocional: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>c) Habilidades Motoras, de Autonomía y Sensoriales</label>
                      <button type="button" onClick={() => openAIModal('Habilidades Motoras y Sensoriales (Análisis)', 'analisisMotor')} className="btn no-print" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>✨ IA</button>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Motricidad gruesa y fina, autonomía funcional, cuidado de sí mismo, capacidades sensoperceptivas (visión, audición, integración sensorial).</span>
                    <textarea className="select-input" style={{ width: '100%', minHeight: '180px' }} value={formData.analisisMotor} onChange={e => setFormData({...formData, analisisMotor: e.target.value})} />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* STEP 3: SINTESIS Y CONCLUSION */}
          <div className={step === 3 ? 'animate-in' : 'print-only'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <section className="print-section-break">
                <div className="print-header-block print-only" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Decreto 170/2010</p>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text)', margin: '0.5rem 0' }}>INFORME DE EVALUACIÓN PSICOPEDAGÓGICA</h2>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No se debe modificar el formato oficial; cada apartado debe conservar su estructura e información base. (Pág. 3)</p>
                </div>

                <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>V. SÍNTESIS</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>(Fortalezas, Desafíos o necesidades, Progresos, Factores de Contexto, Recomendaciones y Estrategias efectivas)</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>a) Habilidades Cognitivas y Comunicativas</label>
                      <button type="button" onClick={() => openAIModal('Habilidades Cognitivas y Comunicativas (Síntesis)', 'sintesisCognitivo')} className="btn no-print" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>✨ IA</button>
                    </div>
                    <textarea className="select-input" style={{ width: '100%', minHeight: '140px' }} value={formData.sintesisCognitivo} onChange={e => setFormData({...formData, sintesisCognitivo: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>b) Habilidades Personales, Socioemocionales y de Aproximación al Aprendizaje</label>
                      <button type="button" onClick={() => openAIModal('Habilidades Personales y Socioemocionales (Síntesis)', 'sintesisSocioemocional')} className="btn no-print" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>✨ IA</button>
                    </div>
                    <textarea className="select-input" style={{ width: '100%', minHeight: '140px' }} value={formData.sintesisSocioemocional} onChange={e => setFormData({...formData, sintesisSocioemocional: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>c) Habilidades Motoras, de Autonomía y Sensoriales</label>
                      <button type="button" onClick={() => openAIModal('Habilidades Motoras y Sensoriales (Síntesis)', 'sintesisMotor')} className="btn no-print" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>✨ IA</button>
                    </div>
                    <textarea className="select-input" style={{ width: '100%', minHeight: '140px' }} value={formData.sintesisMotor} onChange={e => setFormData({...formData, sintesisMotor: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Conclusión</label>
                      <button type="button" onClick={() => openAIModal('Conclusión Diagnóstica/Pedagógica', 'sintesisConclusion')} className="btn no-print" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>✨ IA</button>
                    </div>
                    <textarea className="select-input" style={{ width: '100%', minHeight: '120px' }} value={formData.sintesisConclusion} onChange={e => setFormData({...formData, sintesisConclusion: e.target.value})} />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* STEP 4: SUGERENCIAS */}
          <div className={step === 4 ? 'animate-in' : 'print-only'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <section className="print-section-break">
                <div className="print-header-block print-only" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Decreto 170/2010</p>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text)', margin: '0.5rem 0' }}>INFORME DE EVALUACIÓN PSICOPEDAGÓGICA</h2>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No se debe modificar el formato oficial; cada apartado debe conservar su estructura e información base. (Pág. 4)</p>
                </div>

                <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>VI. SUGERENCIAS</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>1.- Al establecimiento educacional</label>
                      <button type="button" onClick={() => openAIModal('Sugerencias al Establecimiento', 'sugerenciasEstablecimiento')} className="btn no-print" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>✨ IA</button>
                    </div>
                    <textarea className="select-input" style={{ width: '100%', minHeight: '100px' }} value={formData.sugerenciasEstablecimiento} onChange={e => setFormData({...formData, sugerenciasEstablecimiento: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>2.- Al equipo de aula</label>
                      <button type="button" onClick={() => openAIModal('Sugerencias al Equipo de Aula', 'sugerenciasEquipoAula')} className="btn no-print" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>✨ IA</button>
                    </div>
                    <textarea className="select-input" style={{ width: '100%', minHeight: '100px' }} value={formData.sugerenciasEquipoAula} onChange={e => setFormData({...formData, sugerenciasEquipoAula: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>3.- Al estudiante</label>
                      <button type="button" onClick={() => openAIModal('Sugerencias al Estudiante', 'sugerenciasEstudiante')} className="btn no-print" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>✨ IA</button>
                    </div>
                    <textarea className="select-input" style={{ width: '100%', minHeight: '100px' }} value={formData.sugerenciasEstudiante} onChange={e => setFormData({...formData, sugerenciasEstudiante: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>4.- A la familia</label>
                      <button type="button" onClick={() => openAIModal('Sugerencias a la Familia', 'sugerenciasFamilia')} className="btn no-print" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>✨ IA</button>
                    </div>
                    <textarea className="select-input" style={{ width: '100%', minHeight: '100px' }} value={formData.sugerenciasFamilia} onChange={e => setFormData({...formData, sugerenciasFamilia: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>5.- Otros</label>
                      <button type="button" onClick={() => openAIModal('Otras sugerencias', 'sugerenciasOtros')} className="btn no-print" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>✨ IA</button>
                    </div>
                    <textarea className="select-input" style={{ width: '100%', minHeight: '100px' }} value={formData.sugerenciasOtros} onChange={e => setFormData({...formData, sugerenciasOtros: e.target.value})} />
                  </div>
                </div>
              </section>

              <section className="print-avoid-break" style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>IDENTIFICACIÓN DEL PROFESIONAL QUE EMITE EL INFORME</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-grid-2col">
                  <div className="form-group"><label>Nombre Completo</label><input type="text" className="select-input" value={formData.profesionalNombre} onChange={e => setFormData({...formData, profesionalNombre: e.target.value})} /></div>
                  <div className="form-group"><label>RUT</label><input type="text" className="select-input" value={formData.profesionalRut} onChange={e => setFormData({...formData, profesionalRut: e.target.value})} /></div>
                  <div className="form-group"><label>Profesión</label><input type="text" className="select-input" value={formData.profesionalProfesion} onChange={e => setFormData({...formData, profesionalProfesion: e.target.value})} /></div>
                  <div className="form-group"><label>N° de Registro Mineduc</label><input type="text" className="select-input" value={formData.profesionalRegistro} onChange={e => setFormData({...formData, profesionalRegistro: e.target.value})} /></div>
                </div>
                
                <div className="print-only" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', padding: '0 2rem' }}>
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ borderTop: '1px solid black', paddingTop: '0.5rem', fontSize: '0.8rem' }}>Firma y Timbre</div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* STEP 5: PAUTA PEDAGOGICA */}
          <div className={step === 5 ? 'animate-in' : 'print-only'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <section className="print-section-break">
                <div className="print-header-block print-only" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Decreto 170/2010</p>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text)', margin: '0.5rem 0' }}>INFORME DE EVALUACIÓN PSICOPEDAGÓGICA</h2>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No se debe modificar el formato oficial; cada apartado debe conservar su estructura e información base. (Pág. 5)</p>
                </div>

                <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>PAUTA DE EVALUACIÓN Y OBSERVACIÓN PEDAGÓGICA DEL ESTUDIANTE EN EL CONTEXTO ESCOLAR</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }} className="pauta-header-grid">
                  <div className="form-group"><label>Nombre Estudiante</label><input type="text" className="select-input" value={formData.estudianteNombre} readOnly /></div>
                  <div className="form-group"><label>Curso</label><input type="text" className="select-input" value={formData.estudianteCurso} readOnly /></div>
                  <div className="form-group"><label>Fecha de Aplicación</label><input type="date" className="select-input" value={formData.fechaAplicacionPauta} onChange={e => setFormData({...formData, fechaAplicacionPauta: e.target.value})} /></div>
                </div>

                <div className="glass-card" style={{ padding: '1rem', marginBottom: '2rem', border: '1px solid var(--primary-light)', background: 'var(--primary-light)' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>Escala de logro para indicadores:</p>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                    <span><strong>1.- En inicio:</strong> Aún no cumple de forma independiente y requiere apoyo permanente.</span>
                    <span><strong>2.- En desarrollo:</strong> Cumple en algunas ocasiones o requiere apoyo frecuente.</span>
                    <span><strong>3.- Logrado:</strong> Cumple de manera constante y autónoma.</span>
                    <span><strong>N/O:</strong> No Observado.</span>
                  </div>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '60%' }}>Antecedentes pedagógicos</th>
                        <th style={{ textAlign: 'center', width: '10%' }}>1</th>
                        <th style={{ textAlign: 'center', width: '10%' }}>2</th>
                        <th style={{ textAlign: 'center', width: '10%' }}>3</th>
                        <th style={{ textAlign: 'center', width: '10%' }}>N/O</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PEDAGOGICAL_ITEMS.map((item, idx) => {
                        const score = formData.pautaPedagogica[idx] || '';
                        return (
                          <tr key={idx}>
                            <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{idx + 1}. {item}</td>
                            {['1', '2', '3', 'N/O'].map(val => (
                              <td key={val} style={{ textAlign: 'center' }}>
                                <input 
                                  type="radio" 
                                  name={`ped-${idx}`} 
                                  value={val} 
                                  checked={score === val}
                                  onChange={() => handlePautaChange('pautaPedagogica', idx, val)}
                                  style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>

          {/* STEP 6: PAUTA SOCIAL y DOCENTE REGULAR */}
          <div className={step === 6 ? 'animate-in' : 'print-only'}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <section className="print-section-break">
                <div className="print-header-block print-only" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Decreto 170/2010</p>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text)', margin: '0.5rem 0' }}>INFORME DE EVALUACIÓN PSICOPEDAGÓGICA</h2>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No se debe modificar el formato oficial; cada apartado debe conservar su estructura e información base. (Pág. 6)</p>
                </div>

                <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--primary)', margin: 0 }}>Antecedentes sociales y comunicativos</h3>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '60%' }}>Antecedentes sociales y comunicativos</th>
                        <th style={{ textAlign: 'center', width: '10%' }}>1</th>
                        <th style={{ textAlign: 'center', width: '10%' }}>2</th>
                        <th style={{ textAlign: 'center', width: '10%' }}>3</th>
                        <th style={{ textAlign: 'center', width: '10%' }}>N/O</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SOCIAL_ITEMS.map((item, idx) => {
                        const score = formData.pautaSocial[idx] || '';
                        return (
                          <tr key={idx}>
                            <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{idx + 1}. {item}</td>
                            {['1', '2', '3', 'N/O'].map(val => (
                              <td key={val} style={{ textAlign: 'center' }}>
                                <input 
                                  type="radio" 
                                  name={`soc-${idx}`} 
                                  value={val} 
                                  checked={score === val}
                                  onChange={() => handlePautaChange('pautaSocial', idx, val)}
                                  style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="print-avoid-break" style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>IDENTIFICACIÓN DEL DOCENTE DE AULA REGULAR QUE EMITE EL INFORME</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-grid-2col">
                  <div className="form-group"><label>Nombre Completo</label><input type="text" className="select-input" value={formData.docenteNombre} onChange={e => setFormData({...formData, docenteNombre: e.target.value})} /></div>
                  <div className="form-group"><label>RUT</label><input type="text" className="select-input" value={formData.docenteRut} onChange={e => setFormData({...formData, docenteRut: e.target.value})} /></div>
                  <div className="form-group"><label>Profesión</label><input type="text" className="select-input" value={formData.docenteProfesion} onChange={e => setFormData({...formData, docenteProfesion: e.target.value})} /></div>
                </div>
                
                <div className="print-only" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', padding: '0 2rem' }}>
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ borderTop: '1px solid black', paddingTop: '0.5rem', fontSize: '0.8rem' }}>Firma Docente</div>
                  </div>
                </div>
              </section>
            </div>
          </div>

        </div>

        {/* Form Actions Footer */}
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }} className="no-print">
          <button onClick={() => setStep(s => Math.max(s - 1, 1))} disabled={step === 1} className="btn" style={{ background: '#f1f5f9', opacity: step === 1 ? 0.5 : 1 }}>← Anterior</button>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" style={{ background: 'var(--primary)', color: 'white', fontWeight: 800, padding: '0.75rem 2rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }} onClick={() => handleSave(false)}>
              {saving ? 'Guardando...' : '💾 GUARDAR DATOS'}
            </button>
            {step < 6 ? <button onClick={() => setStep(s => Math.min(s + 1, 6))} className="btn btn-primary">Siguiente →</button> : null}
          </div>
        </div>

        {/* Floating Autoguardado Badge */}
        <div 
          className="no-print"
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '2rem',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '99px',
            padding: '0.5rem 1rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            zIndex: 100
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: saving ? 'var(--warning)' : 'var(--success)' }}></span>
          {saving ? 'Guardando cambios...' : lastSaved ? `Autoguardado: ${lastSaved.toLocaleTimeString()}` : 'Sin guardar'}
        </div>
      </div>

      {/* Print only Document (Carta 6-page replica) */}
      <div className="pdf-print-container print-only">
        {/* PAGE 1 */}
        <div className="pdf-page">
          <div className="pdf-page-header">
            <img src="/images/logo_mineduc.jpg" alt="Mineduc Logo" className="pdf-header-logo" />
            <div className="pdf-header-text">
              <div className="pdf-header-subtitle">Decreto 170/2010</div>
              <div className="pdf-header-subtitle2">Evaluación Diagnóstica Integral de Necesidades Educativas Especiales</div>
              <div className="pdf-header-title">INFORME DE EVALUACIÓN PSICOPEDAGÓGICA</div>
              <div className="pdf-header-title-sub">(Detección de NEE)</div>
            </div>
            <img src="/images/logo_institucion.png" alt="Logo Institución" className="pdf-header-institution-logo" />
          </div>

          <div className="pdf-section-title-bar">I. IDENTIFICACIÓN</div>
          <table className="pdf-table-grid">
            <tbody>
              <tr>
                <td className="pdf-label" style={{ width: '35%' }}>NOMBRE DE IDENTIDAD ESTUDIANTE</td>
                <td className="pdf-value" style={{ width: '65%' }}>{formData.estudianteNombre}</td>
              </tr>
              <tr>
                <td className="pdf-label">NOMBRE SOCIAL DEL ESTUDIANTE</td>
                <td className="pdf-value">{formData.estudianteNombreSocial}</td>
              </tr>
              <tr>
                <td className="pdf-label">FECHA DE NACIMIENTO</td>
                <td className="pdf-value">{formData.estudianteFechaNac}</td>
              </tr>
              <tr>
                <td className="pdf-label">EDAD</td>
                <td className="pdf-value">{formData.estudianteEdad}</td>
              </tr>
              <tr>
                <td className="pdf-label">ESTABLECIMIENTO</td>
                <td className="pdf-value">{formData.estudianteEstablecimiento}</td>
              </tr>
              <tr>
                <td className="pdf-label">CURSO/NIVEL</td>
                <td className="pdf-value">{formData.estudianteCurso}</td>
              </tr>
              <tr>
                <td className="pdf-label">FECHA DE EVALUACIÓN</td>
                <td className="pdf-value">{formData.fechaEvaluacion ? formatDate(formData.fechaEvaluacion) : ''}</td>
              </tr>
              <tr>
                <td className="pdf-label">DIAGNÓSTICO</td>
                <td className="pdf-value">{formData.diagnostico}</td>
              </tr>
              <tr>
                <td className="pdf-label">FECHA DE EMISIÓN DE DIAGNÓSTICO</td>
                <td className="pdf-value">{formData.fechaEmisionDiagnostico ? formatDate(formData.fechaEmisionDiagnostico) : ''}</td>
              </tr>
            </tbody>
          </table>

          <div className="pdf-section-title-bar" style={{ marginTop: '0.4rem' }}>II. MOTIVO DE EVALUACIÓN PSICOPEDAGOGICA</div>
          <table className="pdf-table-grid">
            <tbody>
              <tr>
                <td style={{ width: '33.3%', padding: '0.35rem', borderRight: '1px solid black' }}>
                  <strong>INGRESO:</strong> <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', marginLeft: '0.5rem' }}>{formData.motivoEvaluacion === 'ingreso' ? '[X]' : '[  ]'}</span>
                </td>
                <td style={{ width: '33.3%', padding: '0.35rem', borderRight: '1px solid black' }}>
                  <strong>REEVALUACIÓN:</strong> <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', marginLeft: '0.5rem' }}>{formData.motivoEvaluacion === 'reevaluacion' ? '[X]' : '[  ]'}</span>
                </td>
                <td style={{ width: '33.3%', padding: '0.35rem' }}>
                  <strong>OTRO:</strong> <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', marginLeft: '0.5rem' }}>{formData.motivoEvaluacion === 'otro' ? `[X] ${formData.motivoOtrosDetalle}` : '[  ]'}</span>
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="pdf-table-header-cell">INSTRUMENTOS APLICADOS</td>
              </tr>
              <tr>
                <td colSpan={3} className="pdf-text-cell" style={{ minHeight: '60px', height: '65px', verticalAlign: 'top' }}>
                  {formData.instrumentosAplicados}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="pdf-section-title-bar" style={{ marginTop: '0.4rem' }}>III. ANTECEDENTES RELEVANTES SOBRE LA HISTORIA ESCOLAR</div>
          <table className="pdf-table-grid">
            <tbody>
              <tr>
                <td className="pdf-text-cell" style={{ minHeight: '100px', height: '100px', verticalAlign: 'top' }}>
                  {formData.antecedentesEscolares}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="pdf-page-footer">
            <div className="pdf-footer-text">No se debe modificar el formato oficial; cada apartado debe conservar su estructura e información base.</div>
            <div className="pdf-footer-page-num">1</div>
            <div className="pdf-footer-bar">
              <div className="pdf-footer-bar-blue"></div>
              <div className="pdf-footer-bar-red"></div>
            </div>
          </div>
        </div>

        {/* PAGE 2 */}
        <div className="pdf-page">
          <div className="pdf-page-header">
            <img src="/images/logo_mineduc.jpg" alt="Mineduc Logo" className="pdf-header-logo" />
            <div className="pdf-header-text">
              <div className="pdf-header-subtitle">Decreto 170/2010</div>
              <div className="pdf-header-subtitle2">Evaluación Diagnóstica Integral de Necesidades Educativas Especiales</div>
              <div className="pdf-header-title">INFORME DE EVALUACIÓN PSICOPEDAGÓGICA</div>
              <div className="pdf-header-title-sub">(Detección de NEE)</div>
            </div>
            <img src="/images/logo_institucion.png" alt="Logo Institución" className="pdf-header-institution-logo" />
          </div>

                  <table className="pdf-table-grid" style={{ flex: 1, marginBottom: '0.8rem' }}>
            <tbody>
              <tr>
                <td className="pdf-subheading-cell">
                  <strong>a) Habilidades Cognitivas y Comunicativas</strong>
                  <span className="pdf-desc-text">
                    (Atención y concentración, Memoria (a corto y largo plazo), Funciones ejecutivas (planificación, organización, control inhibitorio), Razonamiento lógico-matemático, Resolución de problemas y creatividad, Lenguaje oral y escrito (vocabulario, gramática, coherencia), Comprensión lectora y auditiva, Expresión oral y escrita, Uso de sistemas alternativos o aumentativos de comunicación (cuando es necesario), Relaciones lógico-matemáticas, lectura, escritura, aprendizajes matemáticos, Habilidades digitales (manejo de tecnología), Habilidades adaptativas (transferencia de aprendizajes a contextos nuevos).
                  </span>
                </td>
              </tr>
              <tr>
                <td className="pdf-text-cell" style={{ minHeight: '120px', height: '120px', verticalAlign: 'top' }}>
                  {formData.analisisCognitivo}
                </td>
              </tr>
              <tr>
                <td className="pdf-subheading-cell">
                  <strong>b) Habilidades Personales, Socioemocionales y de Aproximación al Aprendizaje</strong>
                  <span className="pdf-desc-text">
                    (autoestima y autoconfianza, motivación intrínseca, talentos e intereses personales, manejo de emociones y autorregulación emocional, tolerancia a la frustración, trabajo en equipo y cooperación, empatía y respeto por la diversidad, resolución de conflictos, habilidades para pedir ayuda y ofrecer apoyo, curiosidad e interés, persistencia y esfuerzo, estrategias para aprender — organización, uso de recursos, autocontrol — y flexibilidad cognitiva para adaptarse a cambios y nuevos desafíos).
                  </span>
                </td>
              </tr>
              <tr>
                <td className="pdf-text-cell" style={{ minHeight: '120px', height: '120px', verticalAlign: 'top' }}>
                  {formData.analisisSocioemocional}
                </td>
              </tr>
              <tr>
                <td className="pdf-subheading-cell">
                  <strong>b) Habilidades motoras, de autonomía y sensoriales</strong>
                  <span className="pdf-desc-text">
                    (motricidad gruesa (equilibrio, desplazamiento, coordinación general), motricidad fina (destreza manual, escritura, manipulación de objetos), autonomía funcional / cuidado de sí mismo (higiene personal, alimentación, vestuario, manejo del tiempo y rutinas, seguridad personal y autocuidado) y capacidades sensoperceptivas (visión, audición, tacto, gusto y olfato, integración sensorial, uso de ayudas técnicas como audífonos, lentes o bastón).
                  </span>
                </td>
              </tr>
              <tr>
                <td className="pdf-text-cell" style={{ minHeight: '90px', height: '90px', verticalAlign: 'top' }}>
                  {formData.analisisMotor}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="pdf-page-footer">
            <div className="pdf-footer-text">No se debe modificar el formato oficial; cada apartado debe conservar su estructura e información base.</div>
            <div className="pdf-footer-page-num">2</div>
            <div className="pdf-footer-bar">
              <div className="pdf-footer-bar-blue"></div>
              <div className="pdf-footer-bar-red"></div>
            </div>
          </div>
        </div>

        {/* PAGE 3 */}
        <div className="pdf-page">
          <div className="pdf-page-header">
            <img src="/images/logo_mineduc.jpg" alt="Mineduc Logo" className="pdf-header-logo" />
            <div className="pdf-header-text">
              <div className="pdf-header-subtitle">Decreto 170/2010</div>
              <div className="pdf-header-subtitle2">Evaluación Diagnóstica Integral de Necesidades Educativas Especiales</div>
              <div className="pdf-header-title">INFORME DE EVALUACIÓN PSICOPEDAGÓGICA</div>
              <div className="pdf-header-title-sub">(Detección de NEE)</div>
            </div>
            <img src="/images/logo_institucion.png" alt="Logo Institución" className="pdf-header-institution-logo" />
          </div>

          <div className="pdf-section-title-bar">V. SINTESIS</div>
          <div className="pdf-section-subtitle-bar">
            (Fortalezas: los aspectos positivos o recursos del/la estudiante — capacidades, avances, intereses, Desafíos o necesidades: dificultades, barreras o aspectos por mejorar, Progresos: cómo ha evolucionado respecto de evaluaciones previas o metas establecidas, Contexto: factores del entorno que influyen — familia, escuela, apoyos, condiciones socioemocionales, Recomendaciones / proyecciones: sugerencias para continuar el apoyo, adaptaciones, objetivos próximos, Estrategias que han funcionado: prácticas, metodologías o recursos que han sido efectivos)
          </div>

          <table className="pdf-table-grid" style={{ flex: 1, marginBottom: '0.8rem' }}>
            <tbody>
              <tr>
                <td className="pdf-subheading-cell"><strong>a) Habilidades Cognitivas y Comunicativas</strong></td>
              </tr>
              <tr>
                <td className="pdf-text-cell" style={{ minHeight: '90px', height: '90px', verticalAlign: 'top' }}>
                  {formData.sintesisCognitivo}
                </td>
              </tr>
              <tr>
                <td className="pdf-subheading-cell"><strong>b) Habilidades Personales, Socioemocionales y de Aproximación al Aprendizaje</strong></td>
              </tr>
              <tr>
                <td className="pdf-text-cell" style={{ minHeight: '90px', height: '90px', verticalAlign: 'top' }}>
                  {formData.sintesisSocioemocional}
                </td>
              </tr>
              <tr>
                <td className="pdf-subheading-cell"><strong>c) Habilidades motoras, de autonomía y sensoriales</strong></td>
              </tr>
              <tr>
                <td className="pdf-text-cell" style={{ minHeight: '90px', height: '90px', verticalAlign: 'top' }}>
                  {formData.sintesisMotor}
                </td>
              </tr>
              <tr>
                <td className="pdf-subheading-cell"><strong>Conclusión</strong></td>
              </tr>
              <tr>
                <td className="pdf-text-cell" style={{ minHeight: '95px', height: '95px', verticalAlign: 'top' }}>
                  {formData.sintesisConclusion}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="pdf-page-footer">
            <div className="pdf-footer-text">No se debe modificar el formato oficial; cada apartado debe conservar su estructura e información base.</div>
            <div className="pdf-footer-page-num">3</div>
            <div className="pdf-footer-bar">
              <div className="pdf-footer-bar-blue"></div>
              <div className="pdf-footer-bar-red"></div>
            </div>
          </div>
        </div>

        {/* PAGE 4 */}
        <div className="pdf-page">
          <div className="pdf-page-header">
            <img src="/images/logo_mineduc.jpg" alt="Mineduc Logo" className="pdf-header-logo" />
            <div className="pdf-header-text">
              <div className="pdf-header-subtitle">Decreto 170/2010</div>
              <div className="pdf-header-subtitle2">Evaluación Diagnóstica Integral de Necesidades Educativas Especiales</div>
              <div className="pdf-header-title">INFORME DE EVALUACIÓN PSICOPEDAGÓGICA</div>
              <div className="pdf-header-title-sub">(Detección de NEE)</div>
            </div>
            <img src="/images/logo_institucion.png" alt="Logo Institución" className="pdf-header-institution-logo" />
          </div>

          <div className="pdf-section-title-bar">VI. Sugerencias</div>
          <table className="pdf-table-grid" style={{ marginBottom: '1.2rem' }}>
            <tbody>
              <tr>
                <td className="pdf-subheading-cell"><strong>1.- Al establecimiento educacional</strong></td>
              </tr>
              <tr>
                <td className="pdf-text-cell" style={{ minHeight: '45px', height: '45px', verticalAlign: 'top' }}>
                  {formData.sugerenciasEstablecimiento}
                </td>
              </tr>
              <tr>
                <td className="pdf-subheading-cell"><strong>2.- Al equipo de aula</strong></td>
              </tr>
              <tr>
                <td className="pdf-text-cell" style={{ minHeight: '45px', height: '45px', verticalAlign: 'top' }}>
                  {formData.sugerenciasEquipoAula}
                </td>
              </tr>
              <tr>
                <td className="pdf-subheading-cell"><strong>3.- Al estudiante</strong></td>
              </tr>
              <tr>
                <td className="pdf-text-cell" style={{ minHeight: '45px', height: '45px', verticalAlign: 'top' }}>
                  {formData.sugerenciasEstudiante}
                </td>
              </tr>
              <tr>
                <td className="pdf-subheading-cell"><strong>4.- A la familia</strong></td>
              </tr>
              <tr>
                <td className="pdf-text-cell" style={{ minHeight: '45px', height: '45px', verticalAlign: 'top' }}>
                  {formData.sugerenciasFamilia}
                </td>
              </tr>
              <tr>
                <td className="pdf-subheading-cell"><strong>5.- Otros</strong></td>
              </tr>
              <tr>
                <td className="pdf-text-cell" style={{ minHeight: '45px', height: '45px', verticalAlign: 'top' }}>
                  {formData.sugerenciasOtros}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="pdf-section-title-bar">IDENTIFICACIÓN DEL PROFESIONAL QUE EMITE EL INFORME</div>
          <table className="pdf-table-grid" style={{ marginBottom: '1rem' }}>
            <tbody>
              <tr>
                <td className="pdf-label" style={{ width: '30%', padding: '0.3rem 0.5rem' }}>Nombre completo</td>
                <td className="pdf-value" style={{ width: '70%', padding: '0.3rem 0.5rem' }}>{formData.profesionalNombre}</td>
              </tr>
              <tr>
                <td className="pdf-label" style={{ padding: '0.3rem 0.5rem' }}>RUT</td>
                <td className="pdf-value" style={{ padding: '0.3rem 0.5rem' }}>{formData.profesionalRut}</td>
              </tr>
              <tr>
                <td className="pdf-label" style={{ padding: '0.3rem 0.5rem' }}>Profesión</td>
                <td className="pdf-value" style={{ padding: '0.3rem 0.5rem' }}>{formData.profesionalProfesion}</td>
              </tr>
              <tr>
                <td className="pdf-label" style={{ padding: '0.3rem 0.5rem' }}>N° de registro</td>
                <td className="pdf-value" style={{ padding: '0.3rem 0.5rem' }}>{formData.profesionalRegistro}</td>
              </tr>
              <tr>
                <td className="pdf-label" style={{ height: '60px', padding: '0.2rem 0.4rem' }}>Firma y Timbre</td>
                <td className="pdf-value" style={{ height: '60px', padding: '0.2rem 0.4rem' }}></td>
              </tr>
            </tbody>
          </table>

          <div className="pdf-page-footer">
            <div className="pdf-footer-text">No se debe modificar el formato oficial; cada apartado debe conservar su estructura e información base.</div>
            <div className="pdf-footer-page-num">4</div>
            <div className="pdf-footer-bar">
              <div className="pdf-footer-bar-blue"></div>
              <div className="pdf-footer-bar-red"></div>
            </div>
          </div>
        </div>

        {/* PAGE 5 */}
        <div className="pdf-page">
          <div className="pdf-page-header">
            <img src="/images/logo_mineduc.jpg" alt="Mineduc Logo" className="pdf-header-logo" />
            <div className="pdf-header-text">
              <div className="pdf-header-subtitle">Decreto 170/2010</div>
              <div className="pdf-header-subtitle2">Evaluación Diagnóstica Integral de Necesidades Educativas Especiales</div>
              <div className="pdf-header-title">INFORME DE EVALUACIÓN PSICOPEDAGÓGICA</div>
              <div className="pdf-header-title-sub">(Detección de NEE)</div>
            </div>
            <img src="/images/logo_institucion.png" alt="Logo Institución" className="pdf-header-institution-logo" />
          </div>

          <div className="pdf-observation-title">
            PAUTA DE EVALUACIÓN Y OBSERVACIÓN PEDAGÓGICA DEL ESTUDIANTE EN EL CONTEXTO ESCOLAR
          </div>

          <div className="pdf-section-title-bar-green">IDENTIFICACIÓN</div>
          <table className="pdf-table-grid" style={{ marginBottom: '0.8rem' }}>
            <tbody>
              <tr>
                <td className="pdf-label" style={{ width: '30%', padding: '0.3rem 0.5rem' }}>NOMBRE ESTUDIANTE</td>
                <td className="pdf-value" style={{ width: '70%', padding: '0.3rem 0.5rem' }}>{formData.estudianteNombre}</td>
              </tr>
              <tr>
                <td className="pdf-label" style={{ padding: '0.3rem 0.5rem' }}>CURSO</td>
                <td className="pdf-value" style={{ padding: '0.3rem 0.5rem' }}>{formData.estudianteCurso}</td>
              </tr>
              <tr>
                <td className="pdf-label" style={{ padding: '0.3rem 0.5rem' }}>FECHA DE APLICACIÓN</td>
                <td className="pdf-value" style={{ padding: '0.3rem 0.5rem' }}>{formData.fechaAplicacionPauta ? formatDate(formData.fechaAplicacionPauta) : ''}</td>
              </tr>
            </tbody>
          </table>

          <table className="pdf-table-scale" style={{ marginBottom: '0.8rem' }}>
            <thead>
              <tr>
                <th colSpan={4}>Escala de logro para indicadores</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ width: '25%' }}>
                  <strong>1.- En inicio</strong>
                  <p>El/la estudiante aún no cumple el indicador de forma independiente y requiere apoyo permanente.</p>
                </td>
                <td style={{ width: '25%' }}>
                  <strong>2.- En desarrollo:</strong>
                  <p>El/la estudiante cumple el indicador en algunas ocasiones o requiere apoyo frecuente.</p>
                </td>
                <td style={{ width: '25%' }}>
                  <strong>3.- Logrado:</strong>
                  <p>El/la estudiante cumple el indicador de manera constante y autónoma, o con los apoyos necesarios</p>
                </td>
                <td style={{ width: '25%' }}>
                  <strong>N/O</strong>
                  <p>No Observado</p>
                </td>
              </tr>
            </tbody>
          </table>

          <table className="pdf-table-pauta">
            <thead>
              <tr>
                <th style={{ width: '60%', textAlign: 'left', padding: '0.3rem 0.5rem' }}>Antecedentes pedagógicos</th>
                <th style={{ width: '10%', padding: '0.3rem 0.5rem' }}>1</th>
                <th style={{ width: '10%', padding: '0.3rem 0.5rem' }}>2</th>
                <th style={{ width: '10%', padding: '0.3rem 0.5rem' }}>3</th>
                <th style={{ width: '10%', padding: '0.3rem 0.5rem' }}>N/O</th>
              </tr>
            </thead>
            <tbody>
              {PEDAGOGICAL_ITEMS.map((item, idx) => {
                const score = formData.pautaPedagogica[idx] || '';
                return (
                  <tr key={idx}>
                    <td className="pdf-pauta-item-text" style={{ padding: '0.22rem 0.4rem', fontSize: '7.8pt' }}>{idx + 1}. {item}</td>
                    {['1', '2', '3', 'N/O'].map(val => (
                      <td key={val} className="pdf-pauta-score-cell" style={{ padding: '0.22rem 0.4rem' }}>
                        <span className={`pdf-checkmark-circle ${score === val ? 'checked' : ''}`}></span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="pdf-page-footer">
            <div className="pdf-footer-text">No se debe modificar el formato oficial; cada apartado debe conservar su estructura e información base.</div>
            <div className="pdf-footer-page-num">5</div>
            <div className="pdf-footer-bar">
              <div className="pdf-footer-bar-blue"></div>
              <div className="pdf-footer-bar-red"></div>
            </div>
          </div>
        </div>

        {/* PAGE 6 */}
        <div className="pdf-page">
          <div className="pdf-page-header">
            <img src="/images/logo_mineduc.jpg" alt="Mineduc Logo" className="pdf-header-logo" />
            <div className="pdf-header-text">
              <div className="pdf-header-subtitle">Decreto 170/2010</div>
              <div className="pdf-header-subtitle2">Evaluación Diagnóstica Integral de Necesidades Educativas Especiales</div>
              <div className="pdf-header-title">INFORME DE EVALUACIÓN PSICOPEDAGÓGICA</div>
              <div className="pdf-header-title-sub">(Detección de NEE)</div>
            </div>
            <img src="/images/logo_institucion.png" alt="Logo Institución" className="pdf-header-institution-logo" />
          </div>

          <table className="pdf-table-pauta" style={{ marginTop: '0.2rem', marginBottom: '1.2rem' }}>
            <thead>
              <tr>
                <th style={{ width: '60%', textAlign: 'left', padding: '0.3rem 0.5rem' }}>Antecedentes sociales y comunicativos</th>
                <th style={{ width: '10%', padding: '0.3rem 0.5rem' }}>1</th>
                <th style={{ width: '10%', padding: '0.3rem 0.5rem' }}>2</th>
                <th style={{ width: '10%', padding: '0.3rem 0.5rem' }}>3</th>
                <th style={{ width: '10%', padding: '0.3rem 0.5rem' }}>N/O</th>
              </tr>
            </thead>
            <tbody>
              {SOCIAL_ITEMS.map((item, idx) => {
                const score = formData.pautaSocial[idx] || '';
                return (
                  <tr key={idx}>
                    <td className="pdf-pauta-item-text" style={{ padding: '0.22rem 0.4rem', fontSize: '7.8pt' }}>{idx + 1}. {item}</td>
                    {['1', '2', '3', 'N/O'].map(val => (
                      <td key={val} className="pdf-pauta-score-cell" style={{ padding: '0.22rem 0.4rem' }}>
                        <span className={`pdf-checkmark-circle ${score === val ? 'checked' : ''}`}></span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="pdf-section-title-bar-green">IDENTIFICACIÓN DEL DOCENTE DE AULA REGULAR QUE EMITE EL INFORME</div>
          <table className="pdf-table-grid" style={{ marginBottom: '1rem' }}>
            <tbody>
              <tr>
                <td className="pdf-label" style={{ width: '30%', padding: '0.3rem 0.5rem' }}>Nombre completo</td>
                <td className="pdf-value" style={{ width: '70%', padding: '0.3rem 0.5rem' }}>{formData.docenteNombre}</td>
              </tr>
              <tr>
                <td className="pdf-label" style={{ padding: '0.3rem 0.5rem' }}>RUT</td>
                <td className="pdf-value" style={{ padding: '0.3rem 0.5rem' }}>{formData.docenteRut}</td>
              </tr>
              <tr>
                <td className="pdf-label" style={{ padding: '0.3rem 0.5rem' }}>Profesión</td>
                <td className="pdf-value" style={{ padding: '0.3rem 0.5rem' }}>{formData.docenteProfesion}</td>
              </tr>
              <tr>
                <td className="pdf-label" style={{ height: '70px', padding: '0.3rem 0.5rem' }}>Firma</td>
                <td className="pdf-value" style={{ height: '70px', padding: '0.3rem 0.5rem' }}></td>
              </tr>
            </tbody>
          </table>

          <div className="pdf-page-footer">
            <div className="pdf-footer-text">No se debe modificar el formato oficial; cada apartado debe conservar su estructura e información base.</div>
            <div className="pdf-footer-page-num">6</div>
            <div className="pdf-footer-bar">
              <div className="pdf-footer-bar-blue"></div>
              <div className="pdf-footer-bar-red"></div>
            </div>
          </div>
        </div>
      </div>

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

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

  .animate-in {
    animation: fadeIn 0.4s ease-out;
    font-family: 'Outfit', sans-serif;
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
    font-family: inherit;
  }
  .select-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-light);
    background: white;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .btn-primary { background: var(--primary); color: white; }

  .card {
    background: white;
    border-radius: 20px;
    border: 1px solid var(--border);
    padding: 2.5rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* --- Print layout css --- */
  @media screen { 
    .print-only { display: none !important; } 
  }

  @media print {
    @page { 
      size: letter !important;
    }
    
    body { 
      background: white !important; 
      color: black !important; 
      font-family: Arial, sans-serif !important; 
      font-size: 8.5pt !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    
    .pdf-print-container {
      display: block !important;
      width: 100%;
      margin: 0 auto;
      background: white;
    }

    .pdf-page {
      width: 100%;
      height: 244mm;
      box-sizing: border-box;
      position: relative;
      page-break-after: always;
      break-after: page;
      background: white;
      color: black;
      display: flex;
      flex-direction: column;
    }

    .pdf-page-header {
      display: flex;
      align-items: center;
      border-bottom: 2px solid black;
      padding-bottom: 0.3rem;
      margin-bottom: 0.4rem;
    }
    
    .pdf-header-logo {
      height: 55px;
      margin-right: 1rem;
    }

    .pdf-header-institution-logo {
      height: 2cm !important;
      width: 2cm !important;
      object-fit: contain !important;
      margin-left: 1rem;
    }

    .pdf-header-text {
      flex: 1;
      text-align: center;
    }

    .pdf-header-subtitle {
      font-size: 8pt;
      font-weight: bold;
      margin: 0;
    }

    .pdf-header-subtitle2 {
      font-size: 7.5pt;
      margin: 1px 0;
    }

    .pdf-header-title {
      font-size: 11pt;
      font-weight: 900;
      margin: 2px 0;
      letter-spacing: -0.5px;
    }

    .pdf-header-title-sub {
      font-size: 8.5pt;
      font-weight: bold;
      font-style: italic;
    }

    .pdf-section-title-bar {
      background: #e5e7eb;
      border: 1px solid black;
      border-bottom: none;
      padding: 0.2rem 0.4rem;
      font-weight: bold;
      font-size: 8pt;
      text-transform: uppercase;
      color: black;
    }

    .pdf-section-title-bar-green {
      background: #d1e2dd;
      border: 1px solid black;
      border-bottom: none;
      padding: 0.2rem 0.4rem;
      font-weight: bold;
      font-size: 8pt;
      text-transform: uppercase;
      color: black;
    }

    .pdf-section-subtitle-bar {
      border-left: 1px solid black;
      border-right: 1px solid black;
      padding: 0.15rem 0.5rem;
      font-size: 7.5pt;
      font-style: italic;
      color: #374151;
      background: white;
    }

    .pdf-observation-title {
      text-align: center;
      font-weight: bold;
      font-size: 10pt;
      margin: 0.2rem 0 0.8rem 0;
      border-bottom: 2px solid black;
      padding-bottom: 0.2rem;
    }

    .pdf-table-grid {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid black;
    }

    .pdf-table-grid td {
      border: 1px solid black;
      padding: 0.18rem 0.4rem !important;
      font-size: 8pt !important;
    }

    .pdf-label {
      font-weight: bold;
      color: black;
      background: #f3f4f6;
      font-size: 7.5pt !important;
      padding: 0.18rem 0.4rem !important;
    }

    .pdf-value {
      font-weight: normal;
      color: black;
    }

    .pdf-table-header-cell {
      background: #e5e7eb;
      font-weight: bold;
      text-align: center;
      font-size: 8pt;
    }

    .pdf-subheading-cell {
      background: #f3f4f6;
      padding: 0.25rem 0.5rem !important;
    }

    .pdf-subheading-cell strong {
      display: block;
      font-size: 8pt;
    }

    .pdf-desc-text {
      display: block;
      font-size: 7.2pt;
      font-weight: normal;
      color: #4b5563;
      font-style: italic;
      margin-top: 1px;
      line-height: 1.25;
    }

    .pdf-text-cell {
      padding: 0.3rem !important;
      font-size: 8pt !important;
      line-height: 1.3 !important;
      white-space: pre-wrap;
      color: black;
    }

    .pdf-table-scale {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid black;
    }

    .pdf-table-scale th {
      background: #d1e2dd;
      border: 1px solid black;
      padding: 0.25rem;
      font-size: 8pt;
      font-weight: bold;
      text-align: center;
    }

    .pdf-table-scale td {
      border: 1px solid black;
      padding: 0.3rem 0.4rem;
      font-size: 7.2pt;
      vertical-align: top;
      background: #f0f6f4;
    }

    .pdf-table-scale td strong {
      display: block;
      font-size: 7.5pt;
      margin-bottom: 2px;
    }

    .pdf-table-scale td p {
      margin: 0;
      line-height: 1.2;
      color: #374151;
    }

    .pdf-table-pauta {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid black;
    }

    .pdf-table-pauta th {
      background: #d1e2dd;
      border: 1px solid black;
      padding: 0.3rem 0.5rem;
      font-size: 8pt;
      font-weight: bold;
      text-align: center;
    }

    .pdf-table-pauta td {
      border: 1px solid black;
      padding: 0.35rem 0.4rem;
      font-size: 8pt;
    }

    .pdf-pauta-item-text {
      font-weight: 500;
      line-height: 1.25;
      color: black;
    }

    .pdf-pauta-score-cell {
      text-align: center;
      vertical-align: middle;
    }

    .pdf-checkmark-circle {
      display: inline-block;
      width: 13px;
      height: 13px;
      border: 1px solid black;
      border-radius: 50%;
      position: relative;
    }

    .pdf-checkmark-circle.checked::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 7px;
      height: 7px;
      background: black;
      border-radius: 50%;
    }

    .pdf-page-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .pdf-footer-text {
      font-size: 6.8pt;
      color: #4b5563;
      text-align: center;
      margin-bottom: 2px;
    }

    .pdf-footer-page-num {
      font-size: 8pt;
      font-weight: bold;
      text-align: right;
      margin-right: 0.5rem;
    }

    .pdf-footer-bar {
      display: flex;
      height: 3.5px;
      width: 100%;
    }

    .pdf-footer-bar-blue {
      width: 40%;
      background: #1e3a8a;
    }

    .pdf-footer-bar-red {
      width: 60%;
      background: #dc2626;
    }
  }
`;

// Inject styles tag dynamically
if (typeof document !== 'undefined') {
  const id = 'pdf-print-styles';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    el.innerHTML = styles;
    document.head.appendChild(el);
  } else {
    el.innerHTML = styles;
  }
}

