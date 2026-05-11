'use client';
import { useState, use, useEffect } from 'react';
import Link from 'next/link';

export default function FormularioUnico({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [formData, setFormData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAIField, setActiveAIField] = useState({ label: '', id: '' });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await fetch(`/api/students/${params.id}`);
        const result = await response.json();
        if (result.success) {
          const student = result.data;
          setFormData({
            folio: `FU-2026-${params.id.slice(0, 4)}`,
            estudianteNombre: student.full_name || `${student.nombres} ${student.apellidos}`,
            estudianteRut: student.run,
            diagnostico: student.diagnostico || 'NEE',
            curso: student.curso,
            profesorJefe: student.profesor_jefe || '',
            fechaDiagnostico: student.fecha_diagnostico || '',
          });
        }
      } catch (error) {
        console.error('Error fetching student:', error);
      }
    };
    fetchStudent();
  }, [params.id]);

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
          field: `Formulario Único: ${fieldLabel}`,
          context: { name: formData.estudianteNombre, diagnostico: formData.diagnostico, course: formData.curso },
          length: 'long'
        })
      });
      const result = await response.json();
      if (result.success && Array.isArray(result.suggestions)) setAiSuggestions(result.suggestions);
      else {
        setAiSuggestions([]);
        alert('Error: No se pudieron generar sugerencias.');
      }
    } catch (e) { console.error(e); }
    finally { setAiLoading(false); }
  };

  const useSuggestion = (text: string) => {
    const textarea = document.getElementById(activeAIField.id) as HTMLTextAreaElement;
    if (textarea) textarea.value = text;
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
          run: formData.estudianteRut,
          data: {
            folio: formData.folio,
            sintesis_evaluacion: (document.getElementById('fu-sintesis') as HTMLTextAreaElement)?.value || '',
            apoyos_recomendados: (document.getElementById('fu-apoyos') as HTMLTextAreaElement)?.value || ''
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Formulario Único Guardado Correctamente');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar el Formulario Único');
    } finally {
      setSaving(false);
    }
  };

  if (!formData) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando Formulario Único...</div>;

  return (
    <div className="animate-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* AI Modal */}
      {isAIModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} className="no-print">
          <div className="card shadow-2xl" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>✨ Asistente de Ideas IA</h2>
              <button onClick={() => setIsAIModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            {aiLoading ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                <p>Analizando normativa y perfil del estudiante...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {aiSuggestions && aiSuggestions.length > 0 && aiSuggestions.map((text, idx) => (
                  <div key={idx} className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--border)', position: 'relative' }}>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>{text}</p>
                    <button onClick={() => useSuggestion(text)} className="btn" style={{ width: '100%', background: 'var(--primary)', color: 'white' }}>Seleccionar esta Versión</button>
                  </div>
                ))}
                <button onClick={() => openAIModal(activeAIField.label, activeAIField.id)} style={{ padding: '1rem', border: '1px dashed var(--primary)', color: 'var(--primary)', cursor: 'pointer', borderRadius: '8px', background: 'none' }}>🔄 Regenerar más opciones</button>
              </div>
            )}
          </div>
        </div>
      )}

      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <Link href="/informes" style={{ color: 'var(--primary)', fontWeight: 600 }}>← Volver</Link>
          <h1 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>Formulario Único - Ingreso / Reevaluación</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleSave} className="btn" style={{ border: '1px solid var(--border)' }} disabled={saving}>
            {saving ? 'Guardando...' : '💾 Guardar Datos'}
          </button>
          <button onClick={() => window.print()} className="btn btn-primary">🖨️ Imprimir Formato Ministerial</button>
        </div>
      </header>

      <div className="card shadow-lg" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem', borderBottom: '2px solid black', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase' }}>SÍNTESIS EVALUACIÓN DE INGRESO / REEVALUACIÓN</h2>
          <p style={{ fontSize: '0.9rem' }}>Decreto Supremo Nº 170/2009</p>
        </div>

        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ background: '#f1f5f9', padding: '0.5rem', fontSize: '1rem', marginBottom: '1rem' }}>1. IDENTIFICACIÓN DEL ESTUDIANTE</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group"><label>Nombre</label><input className="select-input" defaultValue={formData.estudianteNombre} /></div>
            <div className="form-group"><label>RUN</label><input className="select-input" defaultValue={formData.estudianteRut} /></div>
            <div className="form-group"><label>Curso</label><input className="select-input" defaultValue={formData.curso} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group"><label>Profesor Jefe</label><input className="select-input" value={formData.profesorJefe} onChange={(e) => setFormData({...formData, profesorJefe: e.target.value})} /></div>
            <div className="form-group"><label>Diagnóstico</label><input className="select-input" defaultValue={formData.diagnostico} /></div>
            <div className="form-group"><label>Fecha Diagnóstico</label><input type="date" className="select-input" value={formData.fechaDiagnostico} onChange={(e) => setFormData({...formData, fechaDiagnostico: e.target.value})} /></div>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ background: '#f1f5f9', padding: '0.5rem', fontSize: '1rem', width: '100%' }}>2. SÍNTESIS DE LA EVALUACIÓN DE NEE</h3>
            <button type="button" onClick={() => openAIModal('Síntesis Evaluación NEE', 'fu-sintesis')} className="btn no-print" style={{ fontSize: '0.7rem', marginLeft: '1rem' }}>✨ IA</button>
          </div>
          <textarea id="fu-sintesis" className="select-input" style={{ width: '100%', minHeight: '300px' }} placeholder="Resuma los resultados de la evaluación integral..." />
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ background: '#f1f5f9', padding: '0.5rem', fontSize: '1rem', width: '100%' }}>3. APOYOS ESPECIALIZADOS RECOMENDADOS</h3>
            <button type="button" onClick={() => openAIModal('Apoyos Recomendados', 'fu-apoyos')} className="btn no-print" style={{ fontSize: '0.7rem', marginLeft: '1rem' }}>✨ IA</button>
          </div>
          <textarea id="fu-apoyos" className="select-input" style={{ width: '100%', minHeight: '200px' }} placeholder="Indique los apoyos de profesionales y curriculares..." />
        </section>

        <section className="print-only" style={{ marginTop: '5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
            <div style={{ borderTop: '1px solid black', textAlign: 'center', paddingTop: '0.5rem' }}>Firma Profesional Evaluador</div>
            <div style={{ borderTop: '1px solid black', textAlign: 'center', paddingTop: '0.5rem' }}>Firma Coordinador(a) PIE</div>
          </div>
        </section>
      </div>

      <div className="print-header" style={{ display: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid black', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>LICEO CAMPANARIO</h2>
            <p style={{ fontSize: '0.75rem', margin: 0 }}>Unidad de Apoyo a la Integración</p>
            <p style={{ fontSize: '0.7rem', margin: 0 }}>Yungay, Chile</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#000' }}>PIE26.com</div>
            <p style={{ fontSize: '0.75rem', margin: 0 }}>Formulario Único (FU)</p>
            <p style={{ fontSize: '0.7rem', margin: 0 }}>Folio: {formData.folio}</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
        label { font-size: 0.7rem; font-weight: 800; color: #475569; }
        
        @media screen {
          .print-header { display: none !important; }
        }

        @media print {
          @page { margin: 2cm; size: letter; }
          body { font-family: "Times New Roman", Times, serif !important; color: black !important; }
          .print-header { display: block !important; }
          .no-print, :global(aside), :global(header), .btn { display: none !important; }
          :global(.main-content) { margin: 0 !important; padding: 0 !important; }
          .card { box-shadow: none !important; border: 1px solid #000 !important; padding: 2rem !important; }
          textarea, input { border: none !important; background: transparent !important; color: black !important; font-size: 1rem !important; width: 100% !important; overflow: visible !important; height: auto !important; }
          h3 { background: #eee !important; border: 1px solid #000 !important; color: black !important; }
        }
      ` }} />
    </div>
  );
}
