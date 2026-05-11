import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
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
    const studentsToUpsert: any[] = [];
    const neeToUpsert: any[] = [];

    for (const row of data) {
      let studentRun = row['RUT Estudiante'] || row['RUN'] || row['Run'];
      if (studentRun && row['Dígito Ver.'] !== undefined) {
        studentRun = `${studentRun}-${row['Dígito Ver.']}`;
      }
      
      let fullName = row['Nombre Completo'] || row['Nombre'];
      if (!fullName && row['Nombres']) {
        fullName = `${row['Apellido Paterno'] || ''} ${row['Apellido Materno'] || ''}, ${row['Nombres']}`.trim();
      }

      if (!studentRun || !fullName) continue;

      const studentId = row['ID'] || uuidv4();
      
      let curso = row['Curso'];
      if (!curso && row['Desc Grado']) {
        curso = `${row['Desc Grado']} ${row['Letra Curso'] || ''}`.trim();
      }

      studentsToUpsert.push({
        id: studentId,
        run: studentRun,
        full_name: fullName,
        curso: curso,
        status_informe: row['Estado Informe'] || 'PENDIENTE'
      });

      const diagnostico = row['Diagnóstico NEE'] || row['Diagnóstico'];
      if (diagnostico) {
        neeToUpsert.push({
          run: studentRun,
          diagnostico: diagnostico
        });
      }
      importedCount++;
    }

    // Upsert students
    if (studentsToUpsert.length > 0) {
      const { error: studentError } = await supabase
        .from('students')
        .upsert(studentsToUpsert, { onConflict: 'run' });
      if (studentError) throw studentError;
    }

    // Upsert NEE data
    if (neeToUpsert.length > 0) {
      const { error: neeError } = await supabase
        .from('student_nee')
        .upsert(neeToUpsert, { onConflict: 'run' });
      if (neeError) throw neeError;
    }

    return NextResponse.json({ 
      success: true, 
      count: importedCount,
      message: `${importedCount} estudiantes sincronizados con Supabase.` 
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

