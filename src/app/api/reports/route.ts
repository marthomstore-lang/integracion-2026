import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, run, data } = body;

    if (!run || !type || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const semester = data.semester || 1;

    // Upsert into reports table in Supabase
    const { error } = await supabase
      .from('reports')
      .upsert({
        student_run: run,
        type: type,
        semester: semester,
        data: data
      }, { onConflict: 'student_run,type,semester' });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Informe guardado correctamente en Supabase' });
  } catch (error: any) {
    console.error('Error saving report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const run = searchParams.get('run');
    const type = searchParams.get('type');
    const semester = parseInt(searchParams.get('semester') || '1');

    if (!run || !type) {
      return NextResponse.json({ error: 'Missing run or type' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('reports')
      .select('data')
      .eq('student_run', run)
      .eq('type', type)
      .eq('semester', semester)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data?.data || null });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



