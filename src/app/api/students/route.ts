import { NextRequest, NextResponse } from 'next/server';
import { db, neeDb } from '@/lib/db';

export async function GET() {
  try {
    const students = db.prepare('SELECT * FROM students ORDER BY full_name ASC').all();
    
    // Enrich with NEE data from the other database
    const enrichedStudents = students.map((s: any) => {
      const nee = neeDb.prepare('SELECT diagnostico FROM student_nee WHERE run = ?').get(s.run) as any;
      return {
        ...s,
        nee: nee?.diagnostico || 'S/I'
      };
    });

    return NextResponse.json({ success: true, data: enrichedStudents });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const { id, full_name, curso, run, diagnostico } = await request.json();
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    // Update main student data
    db.prepare('UPDATE students SET full_name = ?, curso = ?, run = ? WHERE id = ?')
      .run(full_name, curso, run, id);

    // Update NEE data if provided
    if (diagnostico !== undefined) {
      neeDb.prepare('INSERT OR REPLACE INTO student_nee (run, diagnostico) VALUES (?, ?)')
        .run(run, diagnostico);
    }

    return NextResponse.json({ success: true, message: 'Estudiante actualizado correctamente' });
  } catch (error: any) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
