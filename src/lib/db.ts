import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists if we want to store it there, 
// but for now we'll put it in the root of the project as per common patterns in these tasks
const isVercel = process.env.VERCEL === '1';
const storagePath = isVercel ? '/tmp' : process.cwd();

const DB_PATH = path.join(storagePath, 'students.db');
const NEE_DB_PATH = path.join(storagePath, 'nee_data.db');

export const db = new Database(DB_PATH);
export const neeDb = new Database(NEE_DB_PATH);


// Initialize main students database
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    run TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    curso TEXT,
    profesor_jefe TEXT,
    status_informe TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS guardians (
    id TEXT PRIMARY KEY,
    student_run TEXT,
    full_name TEXT,
    run TEXT,
    relationship TEXT,
    FOREIGN KEY (student_run) REFERENCES students(run)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL -- 'admin' or 'docente'
  );

  -- Insert default admin if not exists
  INSERT OR IGNORE INTO users (id, username, password, full_name, role) 
  VALUES ('1', 'admin', 'admin123', 'Administrador', 'admin');
  
  -- Insert a default teacher for testing
  INSERT OR IGNORE INTO users (id, username, password, full_name, role) 
  VALUES ('2', 'docente', 'profe123', 'Docente General', 'docente');
`);


// Initialize separate NEE database as requested
neeDb.exec(`
  CREATE TABLE IF NOT EXISTS student_nee (
    run TEXT PRIMARY KEY,
    diagnostico TEXT,
    fecha_diagnostico TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );


  CREATE TABLE IF NOT EXISTS informe_familia (
    student_run TEXT,
    semester INTEGER,
    folio TEXT,
    profesor_jefe TEXT, -- Added
    fecha_diagnostico TEXT, -- Added
    profesional_data TEXT, -- JSON string
    apoderado_data TEXT,   -- JSON string
    reportes_area TEXT,    -- JSON string (psicoped, psic, fono)
    desempeno_acad TEXT,
    convivencia_salud TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_run, semester)
  );


  CREATE TABLE IF NOT EXISTS plan_paec (
    student_run TEXT PRIMARY KEY,
    folio TEXT,
    fecha_elaboracion TEXT,
    perfil_data TEXT,     -- JSON string (fortalezas, gatilladores, etc)
    matriz_crisis TEXT,   -- JSON string
    acuerdos TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS formulario_unico (
    student_run TEXT PRIMARY KEY,
    folio TEXT,
    sintesis_evaluacion TEXT,
    apoyos_recomendados TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS student_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_run TEXT,
    name TEXT,
    description TEXT,
    created_by TEXT,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);


// Migrations for existing databases
try { db.exec("ALTER TABLE students ADD COLUMN profesor_jefe TEXT;"); } catch (e) {}
try { neeDb.exec("ALTER TABLE student_nee ADD COLUMN fecha_diagnostico TEXT;"); } catch (e) {}
try { neeDb.exec("ALTER TABLE informe_familia ADD COLUMN profesor_jefe TEXT;"); } catch (e) {}
try { neeDb.exec("ALTER TABLE informe_familia ADD COLUMN fecha_diagnostico TEXT;"); } catch (e) {}

export function initDynamicTable(columns: string[]) {


  // This could be used to ensure the table matches the Excel file
  // but for now we'll stick to the defined schema which covers the requested fields.
}
