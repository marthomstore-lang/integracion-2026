import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    if (studentError || !student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    const { data: nee, error: neeError } = await supabase
      .from('student_nee')
      .select('diagnostico, fecha_diagnostico')
      .eq('run', student.run)
      .single();
    
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



