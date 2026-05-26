'use client';
import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';

export default function EditStudentPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    run: '',
    curso: '',
    diagnostico: '',
    fecha_nacimiento: '',
    profesor_jefe: ''
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await fetch(`/api/students/${params.id}`);
        const result = await response.json();
        if (result.success) {
          setFormData({
            full_name: result.data.full_name || '',
            run: result.data.run || '',
            curso: result.data.curso || '',
            diagnostico: result.data.diagnostico || '',
            fecha_nacimiento: result.data.fecha_nacimiento || '',
            profesor_jefe: result.data.profesor_jefe || ''
          });
        } else {
          showToast(result.error || 'No se pudo cargar la información del estudiante', 'error');
        }
      } catch (error: any) {
        console.error('Error fetching student:', error);
        showToast('Error de red al cargar la información del estudiante', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.id,
          ...formData
        })
      });
      const result = await response.json();
      if (result.success) {
        showToast('Estudiante actualizado correctamente', 'success');
        setTimeout(() => {
          router.push('/alumnos');
          router.refresh();
        }, 1500);
      } else {
        showToast(result.error || 'Error al actualizar el estudiante', 'error');
      }
    } catch (error: any) {
      console.error('Error updating student:', error);
      showToast('Error de red al actualizar el estudiante', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="animate-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <Link href="/alumnos" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          ← Volver a la lista
        </Link>
        <h1>Editar Estudiante</h1>
        <p style={{ color: 'var(--text-muted)' }}>Actualiza la información básica y el diagnóstico del alumno.</p>
      </header>

      <form onSubmit={handleSubmit} className="card shadow-lg" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Nombre Completo</label>
          <input 
            type="text" 
            className="select-input" 
            style={{ width: '100%' }}
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>RUN / RUT</label>
          <input 
            type="text" 
            className="select-input" 
            style={{ width: '100%' }}
            value={formData.run}
            onChange={(e) => setFormData({ ...formData, run: e.target.value })}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Curso</label>
          <input 
            type="text" 
            className="select-input" 
            style={{ width: '100%' }}
            value={formData.curso}
            onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Profesor Jefe</label>
          <input 
            type="text" 
            className="select-input" 
            style={{ width: '100%' }}
            value={formData.profesor_jefe}
            onChange={(e) => setFormData({ ...formData, profesor_jefe: e.target.value })}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Fecha de Nacimiento</label>
          <input 
            type="date" 
            className="select-input" 
            style={{ width: '100%' }}
            value={formData.fecha_nacimiento ? formData.fecha_nacimiento.split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Diagnóstico NEE</label>
          <select 
            className="select-input" 
            style={{ width: '100%' }}
            value={formData.diagnostico}
            onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
          >
            <option value="NEET">NEET (Transitorio)</option>
            <option value="NEEP">NEEP (Permanente)</option>
            <option value="S/I">Sin Información</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button 
            type="button" 
            className="btn" 
            style={{ flex: 1, background: '#f1f5f9' }}
            onClick={() => router.back()}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ flex: 2 }}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

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
      `}</style>
    </div>
  );
}
