'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import Toast from '@/components/Toast';

export default function ConfigPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<null | 'success' | 'error'>(null);
  const [rowCount, setRowCount] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const [courseTeachers, setCourseTeachers] = useState<Record<string, string>>({});
  const [ctLoading, setCtLoading] = useState(false);

  const [printSettings, setPrintSettings] = useState({
    margin_top: 15,
    margin_bottom: 15,
    margin_left: 15,
    margin_right: 15,
    font_size_print: '10pt',
    line_height_print: 1.4,
    force_page_breaks: true
  });
  const [psLoading, setPsLoading] = useState(false);

  const fetchPrintSettings = async () => {
    try {
      const res = await fetch('/api/reports?run=SYSTEM&type=print_settings');
      const data = await res.json();
      if (data.success && data.data && data.data.mapping) {
        const mapping = data.data.mapping;
        setPrintSettings({
          margin_top: Number(mapping.margin_top) ?? 15,
          margin_bottom: Number(mapping.margin_bottom) ?? 15,
          margin_left: Number(mapping.margin_left) ?? 15,
          margin_right: Number(mapping.margin_right) ?? 15,
          font_size_print: mapping.font_size_print || '10pt',
          line_height_print: Number(mapping.line_height_print) ?? 1.4,
          force_page_breaks: mapping.force_page_breaks !== false
        });
      }
    } catch (e) {
      console.error('Error fetching print settings:', e);
    }
  };

  const handleSavePrintSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setPsLoading(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'print_settings',
          run: 'SYSTEM',
          data: {
            semester: 1,
            mapping: printSettings
          }
        })
      });
      const result = await res.json();
      if (result.success) {
        showToast('Ajustes de impresión guardados con éxito', 'success');
      } else {
        showToast(result.error || 'Error al guardar configuración', 'error');
      }
    } catch (e) {
      showToast('Error al guardar ajustes de impresión', 'error');
    } finally {
      setPsLoading(false);
    }
  };

  const fetchCourseTeachers = async () => {
    try {
      const res = await fetch('/api/reports?run=SYSTEM&type=course_teachers');
      const data = await res.json();
      if (data.success && data.data) {
        setCourseTeachers(data.data.mapping || {});
      }
    } catch (e) {
      console.error('Error fetching course teachers:', e);
    }
  };

  const handleSaveCourseTeacher = async (curso: string, teacher: string) => {
    setCtLoading(true);
    try {
      const updatedMapping = { ...courseTeachers, [curso]: teacher };
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'course_teachers',
          run: 'SYSTEM',
          data: {
            semester: 1,
            mapping: updatedMapping
          }
        })
      });
      const result = await res.json();
      if (result.success) {
        setCourseTeachers(updatedMapping);
        showToast('Profesor Jefe asignado al curso', 'success');
      } else {
        showToast(result.error, 'error');
      }
    } catch (e) {
      showToast('Error al guardar asignación', 'error');
    } finally {
      setCtLoading(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const response = await fetch('/api/upload-students', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setIsUploading(false);
        setUploadStatus('success');
        setRowCount(result.count);
        fetchStudents();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsUploading(false);
      setUploadStatus('error');
    }
  };

  const [users, setUsers] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', full_name: '', role: 'docente' });
  const [userLoading, setUserLoading] = useState(false);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    if (data.success) setUsers(data.data);
  };

  const fetchStudents = async () => {
    const res = await fetch('/api/students');
    const data = await res.json();
    if (data.success) setAllStudents(data.data);
  };

  useEffect(() => {
    fetchUsers();
    fetchStudents();
    fetchCourseTeachers();
    fetchPrintSettings();
  }, []);

  const handleDownloadDatabase = () => {
    if (allStudents.length === 0) {
      showToast("No hay datos para descargar", "info");
      return;
    }

    // Map data to the expected Excel format
    const exportData = allStudents.map(student => ({
      'Nombre Completo': student.full_name,
      'RUN': student.run,
      'Curso': student.curso,
      'Diagnóstico NEE': student.nee || 'S/I',
      'Estado Informe': student.status_informe || 'PENDIENTE',
      'Fecha Nacimiento': student.fecha_nacimiento || '',
      'Nombre Social': student.nombre_social || '',
      'Profesor Jefe': student.profesor_jefe || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estudiantes");
    
    // Auto-size columns
    const maxWidths = Object.keys(exportData[0]).map(key => ({
      wch: Math.max(key.length, ...exportData.map(row => (row[key as keyof typeof row]?.toString().length || 0))) + 2
    }));
    worksheet['!cols'] = maxWidths;

    XLSX.writeFile(workbook, `Nomina_Estudiantes_LiceoPro_${new Date().toISOString().split('T')[0]}.xlsx`);
  };


  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Usuario creado con éxito', 'success');
        setNewUser({ username: '', password: '', full_name: '', role: 'docente' });
        fetchUsers();
      } else {
        showToast(data.error, 'error');
      }
    } catch (err) {
      showToast('Error al crear usuario', 'error');
    } finally {
      setUserLoading(false);
    }
  };

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordUpdate = async (id: string) => {
    if (!newPassword) return;
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Contraseña actualizada con éxito', 'success');
        setEditingUser(null);
        setNewPassword('');
      } else {
        showToast(data.error, 'error');
      }
    } catch (err) {
      showToast('Error al actualizar contraseña', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('Usuario eliminado con éxito', 'success');
      fetchUsers();
    } else {
      showToast(data.error, 'error');
    }
  };


  return (
    <div className="animate-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>Configuración del Sistema</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Administración central de PIE26.com</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* User Management Section */}
        <section className="card shadow-xl" style={{ border: '1px solid rgba(99, 102, 241, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2rem', background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '16px' }}>👤</div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Gestión de Usuarios</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Crea y administra cuentas para profesionales y administración</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem' }}>
            {/* Create User Form */}
            <form onSubmit={handleCreateUser} style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Nuevo Usuario</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7 }}>NOMBRE COMPLETO</label>
                <input 
                  type="text" 
                  className="select-input" 
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7 }}>USUARIO (LOGIN)</label>
                <input 
                  type="text" 
                  className="select-input" 
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="Ej: jperez"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7 }}>CONTRASEÑA</label>
                <input 
                  type="password" 
                  className="select-input" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7 }}>ROL / PERFIL</label>
                <select 
                  className="select-input" 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="docente">Profesional (Solo Informes)</option>
                  <option value="admin">Administración (Acceso Total)</option>
                </select>
              </div>

              <button disabled={userLoading} className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>
                {userLoading ? 'Creando...' : '➕ Crear Cuenta'}
              </button>
            </form>

            {/* User List */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Usuarios Activos</h3>
              <div className="table-container shadow-sm" style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <table style={{ fontSize: '0.875rem' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '1rem' }}>Usuario</th>
                      <th style={{ padding: '1rem' }}>Rol</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>@{u.username}</div>
                          {editingUser === u.id && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                              <input 
                                type="password" 
                                placeholder="Nueva clave" 
                                className="select-input" 
                                style={{ fontSize: '0.75rem', padding: '0.3rem' }} 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                              />
                              <button onClick={() => handlePasswordUpdate(u.id)} className="btn btn-primary" style={{ fontSize: '0.6rem', padding: '0.3rem 0.6rem' }}>✓</button>
                              <button onClick={() => setEditingUser(null)} className="btn" style={{ fontSize: '0.6rem', padding: '0.3rem 0.6rem' }}>×</button>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '1rem', 
                            fontSize: '0.7rem', 
                            fontWeight: 700,
                            background: u.role === 'admin' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: u.role === 'admin' ? 'var(--primary)' : 'var(--success)'
                          }}>
                            {u.role === 'admin' ? 'ADMIN' : 'PROFESIONAL'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => setEditingUser(editingUser === u.id ? null : u.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '1.1rem' }}
                              title="Cambiar Contraseña"
                            >
                              🔑
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', opacity: u.id === '1' ? 0.2 : 1 }}
                              disabled={u.id === '1'}
                              title="Eliminar Usuario"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Manual Student Entry Section */}
        <section className="card shadow-lg" style={{ border: '1px solid rgba(16, 185, 129, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '16px' }}>📝</div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ingreso Manual de Estudiante</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Agrega un estudiante con todos sus datos técnicos</p>
            </div>
          </div>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const studentData = {
                run: target.run.value,
                full_name: target.full_name.value,
                curso: target.curso.value,
                profesor_jefe: target.profesor_jefe.value,
                diagnostico: target.diagnostico.value,
                fecha_diagnostico: target.fecha_diagnostico.value,
                fecha_nacimiento: target.fecha_nacimiento.value
              };
              
              try {
                const res = await fetch('/api/students', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(studentData)
                });
                const result = await res.json();
                if (result.success) {
                  showToast('Estudiante agregado con éxito', 'success');
                  target.reset();
                  fetchStudents();
                } else {
                  showToast(result.error, 'error');
                }
              } catch (err) {
                showToast('Error al conectar con el servidor', 'error');
              }
            }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}
          >
            <div className="form-group"><label style={{ fontSize: '0.7rem', fontWeight: 700 }}>RUT / RUN</label><input type="text" name="run" className="select-input" placeholder="12.345.678-9" required /></div>
            <div className="form-group"><label style={{ fontSize: '0.7rem', fontWeight: 700 }}>NOMBRE COMPLETO</label><input type="text" name="full_name" className="select-input" placeholder="Nombres Apellidos" required /></div>
            <div className="form-group">
              <label style={{ fontSize: '0.7rem', fontWeight: 700 }}>CURSO</label>
              <input 
                type="text" 
                name="curso" 
                className="select-input" 
                placeholder="Ej: 4° Básico A" 
                required 
                onChange={(e) => {
                  const teacher = courseTeachers[e.target.value.trim()];
                  if (teacher && e.target.form) {
                    const profInput = e.target.form.elements.namedItem('profesor_jefe') as HTMLInputElement;
                    if (profInput) profInput.value = teacher;
                  }
                }}
              />
            </div>
            <div className="form-group"><label style={{ fontSize: '0.7rem', fontWeight: 700 }}>PROFESOR JEFE</label><input type="text" name="profesor_jefe" className="select-input" placeholder="Nombre del Profesor" /></div>
            <div className="form-group"><label style={{ fontSize: '0.7rem', fontWeight: 700 }}>FECHA NACIMIENTO</label><input type="date" name="fecha_nacimiento" className="select-input" /></div>
            <div className="form-group"><label style={{ fontSize: '0.7rem', fontWeight: 700 }}>DIAGNÓSTICO NEE</label><input type="text" name="diagnostico" className="select-input" placeholder="Ej: TEA, TDAH..." /></div>
            <div className="form-group"><label style={{ fontSize: '0.7rem', fontWeight: 700 }}>FECHA DIAGNÓSTICO</label><input type="date" name="fecha_diagnostico" className="select-input" /></div>
            
            <div style={{ gridColumn: 'span 3', marginTop: '1rem' }}>
              <button type="submit" className="btn" style={{ background: 'var(--success)', color: 'white', width: '100%', padding: '1rem', fontWeight: 700 }}>
                ➕ Registrar Estudiante Permanentemente
              </button>
            </div>
          </form>
        </section>

        {/* Students List Management */}
        <section className="card shadow-lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>👥</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Gestión de Estudiantes</h2>
            </div>
            <button 
              onClick={async () => {
                if(confirm('¿BORRAR TODOS LOS ESTUDIANTES? Esta acción no se puede deshacer.')) {
                  const res = await fetch('/api/students', { method: 'DELETE', body: JSON.stringify({ all: true }) });
                  if ((await res.json()).success) {
                    showToast('Base de datos de estudiantes limpiada', 'success');
                    fetchStudents();
                  } else {
                    showToast('Error al limpiar base de datos', 'error');
                  }
                }
              }}
              className="btn" 
              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '0.8rem' }}
            >
              🗑️ Borrar Todos (Limpiar Base de Datos)
            </button>
          </div>

          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>RUT</th>
                  <th>Curso</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {allStudents.map((s: any) => (
                  <tr key={s.id}>
                    <td>{s.full_name}</td>
                    <td style={{ fontSize: '0.8rem', opacity: 0.7 }}>{s.run}</td>
                    <td>{s.curso}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={async () => {
                          if(confirm('¿Eliminar a ' + s.full_name + '?')) {
                            const res = await fetch('/api/students', { 
                              method: 'DELETE', 
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: s.id }) 
                            });
                            if ((await res.json()).success) {
                              showToast('Estudiante eliminado', 'success');
                              fetchStudents();
                            } else {
                              showToast('Error al eliminar estudiante', 'error');
                            }
                          }
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
                {allStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No hay estudiantes registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Excel Upload Section */}
        <section className="card shadow-lg">


          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2rem', background: 'var(--secondary)', color: 'white', padding: '0.75rem', borderRadius: '16px' }}>📊</div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Carga Masiva de Estudiantes</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Importa la nómina de estudiantes desde un archivo Excel (.xlsx)</p>
            </div>
          </div>
...

          <div 
            style={{ 
              border: '2px dashed var(--border)', 
              borderRadius: 'var(--radius)', 
              padding: '3rem', 
              textAlign: 'center',
              backgroundColor: isUploading ? 'var(--primary-light)' : '#f8fafc',
              transition: 'all 0.3s'
            }}
          >
            {!uploadStatus ? (
              <>
                {isUploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div className="spinner"></div>
                    <p style={{ fontWeight: 600 }}>Procesando archivo y creando base de datos...</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Mapeando columnas: Nombre, RUN, Curso, Diagnóstico...</p>
                  </div>
                ) : (
                  <div>
                    <input 
                      type="file" 
                      id="excel-upload" 
                      hidden 
                      accept=".xlsx, .xls" 
                      onChange={handleExcelUpload}
                    />
                    <label 
                      htmlFor="excel-upload" 
                      className="btn btn-primary" 
                      style={{ padding: '1rem 2rem', cursor: 'pointer', marginBottom: '1rem' }}
                    >
                      Seleccionar Archivo Excel
                    </label>
                    
                    <button 
                      onClick={handleDownloadDatabase}
                      className="btn"
                      style={{ 
                        padding: '1rem 2rem', 
                        marginLeft: '1rem', 
                        background: '#f8fafc', 
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        fontWeight: 600
                      }}
                    >
                      📥 Descargar Nómina Actual
                    </button>

                    <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: '1rem' }}>
                      Asegúrate de que las columnas coincidan con los campos del informe ministerial.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="animate-in" style={{ color: 'var(--success)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ marginBottom: '0.5rem' }}>¡Base de Datos Actualizada!</h3>
                <p>Se han importado **{rowCount} estudiantes** exitosamente.</p>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <Link href="/" className="btn btn-primary">Ir al Dashboard</Link>
                  <button className="btn" onClick={() => setUploadStatus(null)} style={{ background: '#f1f5f9' }}>Subir otro</button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Course Teachers Mapping Section */}
        <section className="card shadow-lg" style={{ border: '1px solid rgba(124, 58, 237, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2rem', background: 'rgba(124, 58, 237, 0.15)', padding: '0.75rem', borderRadius: '16px' }}>🏫</div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Profesores Jefes por Curso</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Asigna un Profesor Jefe a cada curso para autocompletar en los informes</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
            {/* Form */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const target = e.target as any;
                const curso = target.curso.value;
                const teacher = target.teacher.value;
                if (!curso || !teacher) return;
                await handleSaveCourseTeacher(curso, teacher);
                target.reset();
              }}
              style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Asignar / Actualizar Curso</h3>
              <div className="form-group">
                <label style={{ fontSize: '0.65rem', fontWeight: 700 }}>Curso</label>
                <input type="text" name="curso" className="select-input" placeholder="Ej: 1° Básico" required />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.65rem', fontWeight: 700 }}>Profesor Jefe</label>
                <input type="text" name="teacher" className="select-input" placeholder="Ej: Marcela Soto" required />
              </div>
              <button disabled={ctLoading} className="btn btn-primary" style={{ padding: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                {ctLoading ? 'Guardando...' : '💾 Asignar Profesor'}
              </button>
            </form>

            {/* List */}
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Asignaciones Activas</h3>
              <div className="table-container shadow-sm" style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', maxHeight: '250px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.75rem' }}>Curso</th>
                      <th style={{ padding: '0.75rem' }}>Profesor Jefe</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(courseTeachers).length > 0 ? (
                      Object.entries(courseTeachers).map(([curso, teacher]) => (
                        <tr key={curso} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{curso}</td>
                          <td style={{ padding: '0.75rem' }}>{teacher}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <button 
                              onClick={async () => {
                                if (confirm(`¿Eliminar asignación para ${curso}?`)) {
                                  const updatedMapping = { ...courseTeachers };
                                  delete updatedMapping[curso];
                                  // Save to Supabase
                                  const res = await fetch('/api/reports', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      type: 'course_teachers',
                                      run: 'SYSTEM',
                                      data: { semester: 1, mapping: updatedMapping }
                                    })
                                  });
                                  if ((await res.json()).success) {
                                    setCourseTeachers(updatedMapping);
                                    showToast('Asignación eliminada', 'success');
                                  }
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No hay asignaciones de profesores</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Print Settings Section */}
        <section className="card shadow-lg" style={{ border: '1px solid rgba(14, 165, 233, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2rem', background: 'rgba(14, 165, 233, 0.15)', padding: '0.75rem', borderRadius: '16px' }}>🖨️</div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ajustes de Impresión de Informes</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Configura los márgenes, fuentes e interlineado generales para la descarga en PDF o impresión física</p>
            </div>
          </div>

          <form onSubmit={handleSavePrintSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Margen Superior (mm)</label>
                <input 
                  type="number" 
                  className="select-input" 
                  min="0" 
                  max="50" 
                  value={printSettings.margin_top}
                  onChange={(e) => setPrintSettings({ ...printSettings, margin_top: parseInt(e.target.value) || 0 })}
                  required 
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Margen Inferior (mm)</label>
                <input 
                  type="number" 
                  className="select-input" 
                  min="0" 
                  max="50" 
                  value={printSettings.margin_bottom}
                  onChange={(e) => setPrintSettings({ ...printSettings, margin_bottom: parseInt(e.target.value) || 0 })}
                  required 
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Margen Izquierdo (mm)</label>
                <input 
                  type="number" 
                  className="select-input" 
                  min="0" 
                  max="50" 
                  value={printSettings.margin_left}
                  onChange={(e) => setPrintSettings({ ...printSettings, margin_left: parseInt(e.target.value) || 0 })}
                  required 
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Margen Derecho (mm)</label>
                <input 
                  type="number" 
                  className="select-input" 
                  min="0" 
                  max="50" 
                  value={printSettings.margin_right}
                  onChange={(e) => setPrintSettings({ ...printSettings, margin_right: parseInt(e.target.value) || 0 })}
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Tamaño de Fuente</label>
                <select 
                  className="select-input"
                  style={{ width: '100%' }}
                  value={printSettings.font_size_print}
                  onChange={(e) => setPrintSettings({ ...printSettings, font_size_print: e.target.value })}
                >
                  <option value="9pt">Muy Pequeño (9pt)</option>
                  <option value="10pt">Normal (10pt)</option>
                  <option value="11pt">Grande (11pt)</option>
                  <option value="12pt">Muy Grande (12pt)</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.65rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Interlineado / Espaciado</label>
                <select 
                  className="select-input"
                  style={{ width: '100%' }}
                  value={printSettings.line_height_print}
                  onChange={(e) => setPrintSettings({ ...printSettings, line_height_print: parseFloat(e.target.value) || 1.4 })}
                >
                  <option value="1.15">Muy Compacto (1.15)</option>
                  <option value="1.3">Compacto (1.3)</option>
                  <option value="1.45">Normal (1.45)</option>
                  <option value="1.6">Espacioso (1.6)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  style={{ width: '18px', height: '18px' }} 
                  checked={printSettings.force_page_breaks}
                  onChange={(e) => setPrintSettings({ ...printSettings, force_page_breaks: e.target.checked })}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Forzar saltos de página rígidos (Mantiene estructura oficial)</span>
              </label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '1.75rem', marginTop: '0.25rem' }}>
                Si se desactiva, el contenido fluirá dinámicamente según el espacio disponible de la impresora, eliminando hojas semi-vacías en descripciones cortas.
              </p>
            </div>

            <button disabled={psLoading} className="btn btn-primary" style={{ padding: '1rem', width: '100%', marginTop: '0.5rem', background: 'var(--primary)' }}>
              {psLoading ? 'Guardando Ajustes...' : '💾 Guardar Ajustes de Impresión'}
            </button>
          </form>
        </section>

        {/* Database Schema Preview */}
        <section className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Estructura de la Base de Datos
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            {['ID', 'Nombre Completo', 'RUT Estudiante', 'Curso', 'Diagnóstico NEE', 'Nombre Apoderado', 'RUT Apoderado', 'Parentesco', 'Estado Informe'].map(field => (
              <div key={field} style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600 }}>
                • {field}
              </div>
            ))}
          </div>
        </section>

        {/* System Settings */}
        <section className="card">
          <h3 style={{ marginBottom: '1rem' }}>Preferencias del Sistema</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
              <span>Sincronización automática con FUDEI</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
              <span>Generar copias de seguridad semanales</span>
            </label>
          </div>
        </section>

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
      `}</style>
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
