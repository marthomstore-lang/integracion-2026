import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { run, full_name, curso, diagnostico } = await request.json();

    if (!run || !full_name) {
      return NextResponse.json({ error: 'RUT y Nombre son obligatorios' }, { status: 400 });
    }

    const studentId = uuidv4();

    // Insert student
    const { error: studentError } = await supabase
      .from('students')
      .insert({ id: studentId, run, full_name, curso, status_informe: 'PENDIENTE' });

    if (studentError) throw studentError;

    // Insert NEE if provided
    if (diagnostico) {
      const { error: neeError } = await supabase
        .from('student_nee')
        .insert({ run, diagnostico });
      if (neeError) throw neeError;
    }

    return NextResponse.json({ success: true, message: 'Estudiante creado correctamente' });
  } catch (error: any) {
    console.error('Error creating student:', error);
    if (error.message.includes('unique')) {
      return NextResponse.json({ error: 'El RUT ya está registrado' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {

    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('*')
      .order('full_name', { ascending: true });

    if (studentError) throw studentError;
    
    const { data: neeData, error: neeError } = await supabase
      .from('student_nee')
      .select('run, diagnostico');

    if (neeError) throw neeError;

    // Enrich with NEE data
    const enrichedStudents = students.map((s: any) => {
      const nee = neeData.find((n: any) => n.run === s.run);
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
    const { error: updateError } = await supabase
      .from('students')
      .update({ full_name, curso, run })
      .eq('id', id);

    if (updateError) throw updateError;

    // Update NEE data if provided
    if (diagnostico !== undefined) {
      const { error: neeError } = await supabase
        .from('student_nee')
        .upsert({ run, diagnostico });
      if (neeError) throw neeError;
    }

    return NextResponse.json({ success: true, message: 'Estudiante actualizado correctamente' });
  } catch (error: any) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

