'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ConfigPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<null | 'success' | 'error'>(null);
  const [rowCount, setRowCount] = useState(0);

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
  const [newUser, setNewUser] = useState({ username: '', password: '', full_name: '', role: 'docente' });
  const [userLoading, setUserLoading] = useState(false);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    if (data.success) setUsers(data.data);
  };

  useState(() => {
    fetchUsers();
  });

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
        alert('Usuario creado');
        setNewUser({ username: '', password: '', full_name: '', role: 'docente' });
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error al crear usuario');
    } finally {
      setUserLoading(false);
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
    if (data.success) fetchUsers();
    else alert(data.error);
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
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', opacity: u.id === '1' ? 0.2 : 1 }}
                            disabled={u.id === '1'}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
    </div>
  );
}
