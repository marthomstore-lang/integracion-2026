import { NextRequest, NextResponse } from 'next/server';
import { db, neeDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
    
    if (!student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    const nee = neeDb.prepare('SELECT diagnostico, fecha_diagnostico FROM student_nee WHERE run = ?').get(student.run) as any;
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...student,
        diagnostico: nee?.diagnostico || 'S/I',
        fecha_diagnostico: nee?.fecha_diagnostico || ''
      } 
    });
  } catch (error: any) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
