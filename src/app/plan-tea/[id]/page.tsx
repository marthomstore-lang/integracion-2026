'use client';
import { useState, use, useEffect } from 'react';
import Link from 'next/link';

export default function PlanTeaForm({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [formData, setFormData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAIField, setActiveAIField] = useState({ label: '', id: '' });
  const [aiInstruction, setAiInstruction] = useState('');

  // Initial Fetch
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const studentRes = await fetch(`/api/students/${params.id}`);
        const studentResult = await studentRes.json();
        
        const reportRes = await fetch(`/api/reports?run=${studentResult.data.run}&type=paec`);
        const reportResult = await reportRes.json();

        if (studentResult.success) {
          const student = studentResult.data;
          const report = reportResult.data || {};
          const perfil = report.perfil_data ? JSON.parse(report.perfil_data) : {};
          const crisis = report.matriz_crisis ? JSON.parse(report.matriz_crisis) : {};

          setFormData({
            folio: report.folio || `PAEC-${student.run.slice(0, 4)}-${new Date().getFullYear()}`,
            fechaElaboracion: report.fecha_elaboracion || new Date().toISOString().split('T')[0],
            estudianteNombre: student.full_name,
            estudianteRut: student.run,
            estudianteCurso: student.curso,
            estudianteNombreSocial: perfil.nombreSocial || '',
            estudianteFechaNac: perfil.fechaNac || '',
            estudianteEdad: perfil.edad || '',
            diagnostico: student.diagnostico || 'TEA',
            profesorJefe: student.profesor_jefe || '',
            estudianteCelular: perfil.celular || '',
            estudianteCorreo: perfil.correo || '',
            
            // Apoderados
            apoderadoPreferente: perfil.apoderadoPreferente || { nombres: '', paterno: '', materno: '', run: '', nombreSocial: '', celular: '', correo: '', parentesco: '' },
            apoderadoAlternativo: perfil.apoderadoAlternativo || { nombres: '', paterno: '', materno: '', run: '', nombreSocial: '', celular: '', correo: '', parentesco: '' },
            
            // Profesionales (Lista dinámica)
            equipoProfesionales: perfil.equipoProfesionales || [{ nombre: '', profesion: '', responsabilidad: '', celular: '', correo: '' }],
            
            // Indicaciones y Perfil
            indicacionesVulnerabilidad: perfil.indicacionesVulnerabilidad || '',
            indicacionesMedicas: perfil.indicacionesMedicas || { posee: 'no', detalle: '' },
            medicamentos: perfil.medicamentos || { ingiere: 'no', detalle: '' },
            fortalezasDesafios: perfil.fortalezasDesafios || '',
            causasManifestaciones: perfil.causasManifestaciones || '',
            habilidadesNecesidades: perfil.habilidadesNecesidades || '',
            gatilladores: perfil.gatilladores || '',
            intereses: perfil.intereses || '',
            estimulos: perfil.estimulos || '',
            objetosInteres: perfil.objetosInteres || '',
            palabrasClave: perfil.palabrasClave || '',
            
            // Diagnóstico Externo
            diagnosticoExterno: perfil.diagnosticoExterno || [{ nombre: '', paterno: '', materno: '', profesion: '', telefono: '' }],

            // Matriz de Crisis
            matrizCrisis: crisis || {
              inicio: { manifestaciones: '', estrategias: '' },
              crecimiento: { manifestaciones: '', estrategias: '' },
              explosion: { manifestaciones: '', estrategias: '' },
              recuperacion: { manifestaciones: '', estrategias: '' },
            },
            
            observaciones: report.observaciones || '',
            colaboracionFamilia: perfil.colaboracionFamilia || '',
            seguimiento: perfil.seguimiento || { fecha: '', comentarios: '' }
          });
          
          // Fetch documents
          const docsRes = await fetch(`/api/uploads?run=${student.run}`);
          const docsData = await docsRes.json();
          if (docsData.success) setDocuments(docsData.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    fetchAllData();
  }, [params.id]);

  const [documents, setDocuments] = useState<any[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('run', formData.estudianteRut);
    fd.append('description', 'Certificado / Documento adjunto');
    
    try {
      const res = await fetch('/api/uploads', { method: 'POST', body: fd });
      if (res.ok) {
        alert('Documento subido con éxito');
        // Refresh docs
        const docsRes = await fetch(`/api/uploads?run=${formData.estudianteRut}`);
        const docsData = await docsRes.json();
        if (docsData.success) setDocuments(docsData.data);
      }
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { folio, fechaElaboracion, observaciones, matrizCrisis, ...perfilRest } = formData;
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'paec',
          run: formData.estudianteRut,
          data: {
            folio,
            fecha_elaboracion: fechaElaboracion,
            perfil_data: JSON.stringify(perfilRest),
            matriz_crisis: JSON.stringify(matrizCrisis),
            acuerdos: formData.observaciones // Using acuerdos column for main observations
          }
        })
      });
      if (response.ok) alert('Plan PAEC actualizado con éxito');
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const openAIModal = async (fieldLabel: string, fieldId: string, instruction = '') => {
    setActiveAIField({ label: fieldLabel, id: fieldId });
    setIsAIModalOpen(true);
    setAiLoading(true);
    setAiSuggestions([]);
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
            userInstruction: instruction || aiInstruction
          },
          length: 'medium'
        })
      });
      const result = await response.json();
      if (result.success) setAiSuggestions(result.suggestions);
    } catch (error) { console.error(error); }
    finally { setAiLoading(false); }
  };

  const useSuggestion = (text: string) => {
    // Check if it's a nested field
    if (activeAIField.id.includes('.')) {
      const parts = activeAIField.id.split('.');
      const newData = { ...formData };
      let current = newData;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = text;
      setFormData(newData);
    } else {
      setFormData({ ...formData, [activeAIField.id]: text });
    }
    setIsAIModalOpen(false);
    setAiInstruction('');
  };

  const addRow = (listKey: string, emptyObj: any) => {
    setFormData({ ...formData, [listKey]: [...formData[listKey], emptyObj] });
  };

  if (!formData) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando Estructura PAEC...</div>;

  return (
    <div className="animate-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* AI Modal */}
      {isAIModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} className="no-print">
          <div className="card shadow-2xl" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#7c3aed' }}>✨ Asistente IA</h2>
              <button onClick={() => setIsAIModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ background: '#f5f3ff', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7c3aed' }}>INDICACIÓN ESPECÍFICA</label>
              <textarea value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} placeholder="Ej: Redacta en base a su nivel cognitivo..." style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd6fe' }} />
              <button onClick={() => openAIModal(activeAIField.label, activeAIField.id)} className="btn" style={{ width: '100%', marginTop: '0.5rem', background: '#7c3aed', color: 'white' }}>Generar Sugerencias</button>
            </div>
            {aiLoading ? <div style={{ textAlign: 'center', padding: '2rem' }}>Generando ideas...</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {aiSuggestions.map((text, i) => (
                  <div key={i} className="glass-card" style={{ padding: '1rem', border: '1px solid #eee' }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{text}</p>
                    <button onClick={() => useSuggestion(text)} className="btn" style={{ width: '100%', background: '#7c3aed', color: 'white' }}>Aplicar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <Link href="/informes" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>← Volver</Link>
          <h1 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>Plan de Acompañamiento Estratégico (PAEC)</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleSave} className="btn" style={{ background: 'white', border: '1px solid #7c3aed', color: '#7c3aed' }}>{saving ? '...' : '💾 Guardar'}</button>
          <button onClick={() => window.print()} className="btn" style={{ background: '#7c3aed', color: 'white' }}>🖨️ Imprimir</button>
        </div>
      </header>

      <div className="card shadow-lg" style={{ padding: '0', overflow: 'hidden', border: 'none' }}>
        
        {/* SECTION 1: IDENTIFICACIÓN */}
        <div className="form-section">
          <h4 className="section-header">Identificación del niño/a, adolescente o joven</h4>
          <div className="grid-table">
            <div className="cell"><label>N° Folio</label><input value={formData.folio} readOnly /></div>
            <div className="cell"><label>Fecha Elaboración</label><input type="date" value={formData.fechaElaboracion} onChange={e => setFormData({...formData, fechaElaboracion: e.target.value})} /></div>
            
            <div className="cell span-2"><label>Nombre completo</label><input value={formData.estudianteNombre} readOnly /></div>
            <div className="cell"><label>RUN</label><input value={formData.estudianteRut} readOnly /></div>
            
            <div className="cell span-3"><label>Nombre Social</label><input value={formData.estudianteNombreSocial} onChange={e => setFormData({...formData, estudianteNombreSocial: e.target.value})} /></div>
            
            <div className="cell span-2"><label>Fecha Nacimiento</label><input type="date" value={formData.estudianteFechaNac} onChange={e => setFormData({...formData, estudianteFechaNac: e.target.value})} /></div>
            <div className="cell"><label>Edad</label><input value={formData.estudianteEdad} onChange={e => setFormData({...formData, estudianteEdad: e.target.value})} /></div>
            
            <div className="cell span-2">
              <label>Diagnóstico N.E.E.</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem' }}><input type="checkbox" /> NEET</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem' }}><input type="checkbox" /> NEEP</label>
                <input style={{ marginLeft: '1rem', borderBottom: '1px solid #ccc' }} value={formData.diagnostico} readOnly />
              </div>
            </div>
            <div className="cell"><label>Curso</label><input value={formData.estudianteCurso} readOnly /></div>
            
            <div className="cell span-3"><label>Profesor(a) Jefe</label><input value={formData.profesorJefe} onChange={e => setFormData({...formData, profesorJefe: e.target.value})} /></div>
            
            <div className="cell span-2"><label>Celular</label><input value={formData.estudianteCelular} onChange={e => setFormData({...formData, estudianteCelular: e.target.value})} /></div>
            <div className="cell"><label>Correo</label><input value={formData.estudianteCorreo} onChange={e => setFormData({...formData, estudianteCorreo: e.target.value})} /></div>
          </div>
        </div>

        {/* SECTION 2: APODERADOS */}
        <div className="form-section">
          <h4 className="section-header">Identificación apoderado preferente y forma de contacto</h4>
          <div className="grid-table">
            <div className="cell span-2"><label>Nombres</label><input value={formData.apoderadoPreferente.nombres} onChange={e => setFormData({...formData, apoderadoPreferente: {...formData.apoderadoPreferente, nombres: e.target.value}})} /></div>
            <div className="cell"><label>Apellido Paterno</label><input value={formData.apoderadoPreferente.paterno} onChange={e => setFormData({...formData, apoderadoPreferente: {...formData.apoderadoPreferente, paterno: e.target.value}})} /></div>
            
            <div className="cell"><label>Apellido Materno</label><input value={formData.apoderadoPreferente.materno} onChange={e => setFormData({...formData, apoderadoPreferente: {...formData.apoderadoPreferente, materno: e.target.value}})} /></div>
            <div className="cell span-2"><label>Run</label><input value={formData.apoderadoPreferente.run} onChange={e => setFormData({...formData, apoderadoPreferente: {...formData.apoderadoPreferente, run: e.target.value}})} /></div>
            
            <div className="cell span-3"><label>Nombre Social</label><input value={formData.apoderadoPreferente.nombreSocial} onChange={e => setFormData({...formData, apoderadoPreferente: {...formData.apoderadoPreferente, nombreSocial: e.target.value}})} /></div>
            
            <div className="cell span-2"><label>Celular</label><input value={formData.apoderadoPreferente.celular} onChange={e => setFormData({...formData, apoderadoPreferente: {...formData.apoderadoPreferente, celular: e.target.value}})} /></div>
            <div className="cell"><label>Correo</label><input value={formData.apoderadoPreferente.correo} onChange={e => setFormData({...formData, apoderadoPreferente: {...formData.apoderadoPreferente, correo: e.target.value}})} /></div>
            
            <div className="cell span-3"><label>Parentesco</label><input value={formData.apoderadoPreferente.parentesco} onChange={e => setFormData({...formData, apoderadoPreferente: {...formData.apoderadoPreferente, parentesco: e.target.value}})} /></div>
          </div>
        </div>

        {/* SECTION 3: EQUIPO PROFESIONAL */}
        <div className="form-section">
          <h4 className="section-header">Equipo de profesionales a cargo y sus funciones</h4>
          {formData.equipoProfesionales.map((prof: any, i: number) => (
            <div key={i} className="grid-table" style={{ marginBottom: '1rem' }}>
              <div className="cell span-2"><label>Nombre Completo</label><input value={prof.nombre} onChange={e => {
                const newList = [...formData.equipoProfesionales];
                newList[i].nombre = e.target.value;
                setFormData({...formData, equipoProfesionales: newList});
              }} /></div>
              <div className="cell"><label>Profesión</label><input value={prof.profesion} onChange={e => {
                const newList = [...formData.equipoProfesionales];
                newList[i].profesion = e.target.value;
                setFormData({...formData, equipoProfesionales: newList});
              }} /></div>
              <div className="cell span-3"><label>Responsabilidad</label><input value={prof.responsabilidad} onChange={e => {
                const newList = [...formData.equipoProfesionales];
                newList[i].responsabilidad = e.target.value;
                setFormData({...formData, equipoProfesionales: newList});
              }} /></div>
              <div className="cell span-2"><label>Celular</label><input value={prof.celular} onChange={e => {
                const newList = [...formData.equipoProfesionales];
                newList[i].celular = e.target.value;
                setFormData({...formData, equipoProfesionales: newList});
              }} /></div>
              <div className="cell"><label>Correo</label><input value={prof.correo} onChange={e => {
                const newList = [...formData.equipoProfesionales];
                newList[i].correo = e.target.value;
                setFormData({...formData, equipoProfesionales: newList});
              }} /></div>
            </div>
          ))}
          <button onClick={() => addRow('equipoProfesionales', { nombre: '', profesion: '', responsabilidad: '', celular: '', correo: '' })} className="btn no-print" style={{ width: '100%', fontSize: '0.7rem', background: '#f8fafc' }}>+ Agregar Profesional</button>
        </div>

        {/* SECTION 4: INDICACIONES Y PERFIL (Image 2 & 3) */}
        <div className="form-section">
          <div className="field-group">
            <div className="field-header">Indicaciones especiales ante una situación de mayor vulnerabilidad emocional... <button onClick={() => openAIModal('Indicaciones Vulnerabilidad', 'indicacionesVulnerabilidad')}>✨ IA</button></div>
            <textarea value={formData.indicacionesVulnerabilidad} onChange={e => setFormData({...formData, indicacionesVulnerabilidad: e.target.value})} />
          </div>

          <div className="field-group">
            <div className="field-header">¿Posee Indicaciones médicas y de especialistas? <button onClick={() => openAIModal('Indicaciones Médicas', 'indicacionesMedicas.detalle')}>✨ IA</button></div>
            <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem' }}>
              <label><input type="radio" checked={formData.indicacionesMedicas.posee === 'si'} onChange={() => setFormData({...formData, indicacionesMedicas: {...formData.indicacionesMedicas, posee: 'si'}})} /> SÍ</label>
              <label><input type="radio" checked={formData.indicacionesMedicas.posee === 'no'} onChange={() => setFormData({...formData, indicacionesMedicas: {...formData.indicacionesMedicas, posee: 'no'}})} /> NO</label>
              <textarea value={formData.indicacionesMedicas.detalle} onChange={e => setFormData({...formData, indicacionesMedicas: {...formData.indicacionesMedicas, detalle: e.target.value}})} style={{ flex: 1, minHeight: '60px' }} placeholder="Detalle aquí..." />
            </div>
          </div>

          <div className="field-group">
            <div className="field-header">¿Ingiere algún medicamento? <button onClick={() => openAIModal('Medicamentos', 'medicamentos.detalle')}>✨ IA</button></div>
            <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem' }}>
              <label><input type="radio" checked={formData.medicamentos.ingiere === 'si'} onChange={() => setFormData({...formData, medicamentos: {...formData.medicamentos, ingiere: 'si'}})} /> SÍ</label>
              <label><input type="radio" checked={formData.medicamentos.ingiere === 'no'} onChange={() => setFormData({...formData, medicamentos: {...formData.medicamentos, ingiere: 'no'}})} /> NO</label>
              <textarea value={formData.medicamentos.detalle} onChange={e => setFormData({...formData, medicamentos: {...formData.medicamentos, detalle: e.target.value}})} style={{ flex: 1, minHeight: '60px' }} placeholder="Detalle aquí..." />
            </div>
          </div>

          {[
            { id: 'fortalezasDesafios', label: 'Fortalezas y Desafíos' },
            { id: 'causasManifestaciones', label: 'Eventuales causas, intenciones comunicativas y manifestaciones frecuentes...' },
            { id: 'habilidadesNecesidades', label: 'Habilidades y Necesidades de Apoyo' },
            { id: 'gatilladores', label: 'Identificación de "gatilladores/gatillantes o estresores" en el establecimiento' },
            { id: 'intereses', label: 'Intereses y Experiencias de Disfrute' },
            { id: 'estimulos', label: 'Estímulos sensoriales o elementos del entorno que favorecen o interfieren...' },
            { id: 'objetosInteres', label: 'Objetos, pictogramas o actividades de interés para cambiar su foco de atención' },
            { id: 'palabrasClave', label: 'Palabras, frases, gestos, pictogramas o actitudes claves para atender su situación...' }
          ].map(field => (
            <div key={field.id} className="field-group">
              <div className="field-header">{field.label} <button onClick={() => openAIModal(field.label, field.id)}>✨ IA</button></div>
              <textarea value={formData[field.id]} onChange={e => setFormData({...formData, [field.id]: e.target.value})} />
            </div>
          ))}
        </div>

        {/* SECTION 5: MATRIZ DE CRISIS (Image 4) */}
        <div className="form-section">
          <h4 className="section-header">Estrategias Individuales ante situaciones desafiantes:</h4>
          <table className="paec-table">
            <thead>
              <tr>
                <th>Fase</th>
                <th>Manifestaciones Comunes <button onClick={() => openAIModal('Manifestaciones Crisis', 'matrizCrisis.manifestaciones')}>✨ IA</button></th>
                <th>Estrategias para desarrollar <button onClick={() => openAIModal('Estrategias Crisis', 'matrizCrisis.estrategias')}>✨ IA</button></th>
              </tr>
            </thead>
            <tbody>
              {['inicio', 'crecimiento', 'explosion', 'recuperacion'].map(fase => (
                <tr key={fase}>
                  <td style={{ textTransform: 'capitalize', fontWeight: 800, background: '#f8fafc' }}>{fase}</td>
                  <td><textarea value={formData.matrizCrisis[fase].manifestaciones} onChange={e => {
                    const newMatrix = {...formData.matrizCrisis};
                    newMatrix[fase].manifestaciones = e.target.value;
                    setFormData({...formData, matrizCrisis: newMatrix});
                  }} /></td>
                  <td><textarea value={formData.matrizCrisis[fase].estrategias} onChange={e => {
                    const newMatrix = {...formData.matrizCrisis};
                    newMatrix[fase].estrategias = e.target.value;
                    setFormData({...formData, matrizCrisis: newMatrix});
                  }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 6: OBSERVACIONES Y SEGUIMIENTO */}
        <div className="form-section">
          <button className="btn no-print" style={{ margin: '1rem', background: '#059669', color: 'white' }}>+ Agregar Nuevo Seguimiento</button>
          
          <div style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Opción para subir documentos o certificados.</p>
            <label className="btn" style={{ background: '#2563eb', color: 'white', cursor: 'pointer' }}>
              Subir documento
              <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>

          <table className="paec-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Creado Por</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documents.length > 0 ? documents.map((doc, i) => (
                <tr key={doc.id}>
                  <td>{i + 1}</td>
                  <td>{doc.name}</td>
                  <td>{doc.description}</td>
                  <td>{doc.created_by}</td>
                  <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td><a href={doc.file_path} target="_blank" style={{ color: '#2563eb' }}>Ver</a></td>
                </tr>
              )) : (
                <tr><td colSpan={6} style={{ textAlign: 'center', opacity: 0.5 }}>No hay documentos subidos</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SECTION 7: FIRMAS */}
        <div className="form-section" style={{ border: 'none' }}>
          <div className="grid-table" style={{ background: '#f1f5f9', gap: '1px', border: '1px solid #e2e8f0' }}>
            <div className="cell" style={{ minHeight: '120px', borderRight: '1px solid #e2e8f0' }}>
              <select className="select-input" style={{ marginBottom: 'auto', border: 'none', background: 'transparent' }}>
                <option>Seleccionar Profesional...</option>
              </select>
              <div style={{ borderTop: '1px solid #334155', paddingTop: '0.5rem', marginTop: '1rem' }}>
                <label style={{ textAlign: 'center', width: '100%' }}>Nombre, firma y timbre del profesional</label>
              </div>
            </div>
            <div className="cell" style={{ minHeight: '120px' }}>
              <div style={{ flex: 1 }}></div>
              <div style={{ borderTop: '1px solid #334155', paddingTop: '0.5rem', marginTop: '1rem' }}>
                <label style={{ textAlign: 'center', width: '100%' }}>Nombre y Firma apoderado</label>
              </div>
            </div>
          </div>
        </div>


      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .form-section { margin-bottom: 2rem; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; }
        .section-header { background: #f1f5f9; padding: 0.75rem 1rem; font-size: 0.9rem; font-weight: 800; color: #334155; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; }
        
        .grid-table { display: grid; grid-template-columns: repeat(3, 1fr); background: #e2e8f0; gap: 1px; }
        .cell { background: white; padding: 0.5rem 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
        .span-2 { grid-column: span 2; }
        .span-3 { grid-column: span 3; }
        
        .cell label { font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .cell input { border: none; font-size: 0.9rem; padding: 0.25rem 0; width: 100%; outline: none; }
        
        .field-group { border-bottom: 1px solid #e2e8f0; }
        .field-header { background: #f8fafc; padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: 700; color: #475569; display: flex; justifyContent: space-between; alignItems: center; }
        .field-header button { font-size: 0.65rem; background: #6366f1; color: white; border: none; padding: 0.2rem 0.5rem; borderRadius: 4px; cursor: pointer; }
        .field-group textarea { width: 100%; min-height: 120px; padding: 1rem; border: none; font-size: 0.9375rem; line-height: 1.6; resize: vertical; }
        
        .paec-table { width: 100%; border-collapse: collapse; }
        .paec-table th { background: #f1f5f9; padding: 0.75rem; font-size: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .paec-table td { padding: 0.5rem; border-bottom: 1px solid #f1f5f9; }
        .paec-table textarea { width: 100%; border: none; min-height: 80px; font-size: 0.875rem; padding: 0.5rem; }

        @media print {
          @page { margin: 1cm; size: auto; }
          .no-print, header, .btn { display: none !important; }
          .card { border: none !important; box-shadow: none !important; }
          .form-section { break-inside: avoid; border: 1px solid #000 !important; margin-bottom: 1rem; }
          .section-header { background: #eee !important; border-bottom: 1px solid #000 !important; color: black !important; }
          .grid-table { background: #000 !important; }
          .cell { background: white !important; }
          .field-header { background: #eee !important; color: black !important; border-bottom: 1px solid #000 !important; }
          .field-header button { display: none !important; }
          textarea { height: auto !important; min-height: 0 !important; overflow: visible !important; }
        }
      ` }} />
    </div>
  );
}
