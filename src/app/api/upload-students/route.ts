import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db, neeDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    let importedCount = 0;

    // Prepare statements
    const insertStudent = db.prepare(`
      INSERT OR REPLACE INTO students (id, run, full_name, curso, status_informe)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertGuardian = db.prepare(`
      INSERT OR REPLACE INTO guardians (id, student_run, full_name, run, relationship)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertNee = neeDb.prepare(`
      INSERT OR REPLACE INTO student_nee (run, diagnostico)
      VALUES (?, ?)
    `);

    // Transactions for data integrity and speed
    const studentTx = db.transaction((rows: any[]) => {
      for (const row of rows) {
        // Handle SIGE format (Run, Dígito Ver., Nombres, Apellido Paterno, Apellido Materno)
        let studentRun = row['RUT Estudiante'] || row['RUN'] || row['Run'];
        if (studentRun && row['Dígito Ver.'] !== undefined) {
          studentRun = `${studentRun}-${row['Dígito Ver.']}`;
        }
        
        let fullName = row['Nombre Completo'] || row['Nombre'];
        if (!fullName && row['Nombres']) {
          fullName = `${row['Apellido Paterno'] || ''} ${row['Apellido Materno'] || ''}, ${row['Nombres']}`.trim();
        }

        const studentId = row['ID'] || uuidv4();
        
        let curso = row['Curso'];
        if (!curso && row['Desc Grado']) {
          curso = `${row['Desc Grado']} ${row['Letra Curso'] || ''}`.trim();
        }

        const statusInforme = row['Estado Informe'] || 'PENDIENTE';

        if (!studentRun || !fullName) continue;

        insertStudent.run(studentId, studentRun, fullName, curso, statusInforme);

        if (row['Nombre Apoderado']) {
          insertGuardian.run(
            uuidv4(),
            studentRun,
            row['Nombre Apoderado'],
            row['RUT Apoderado'],
            row['Parentesco']
          );
        }
        importedCount++;
      }
    });

    const neeTx = neeDb.transaction((rows: any[]) => {
      for (const row of rows) {
        let studentRun = row['RUT Estudiante'] || row['RUN'] || row['Run'];
        if (studentRun && row['Dígito Ver.'] !== undefined) {
          studentRun = `${studentRun}-${row['Dígito Ver.']}`;
        }

        const diagnostico = row['Diagnóstico NEE'] || row['Diagnóstico'];

        if (studentRun && diagnostico) {
          insertNee.run(studentRun, diagnostico);
        }
      }
    });

    studentTx(data);
    neeTx(data);

    return NextResponse.json({ 
      success: true, 
      count: importedCount,
      message: `${importedCount} estudiantes importados y datos NEE sincronizados en base de datos independiente.` 
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
