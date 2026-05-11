import { NextRequest, NextResponse } from 'next/server';
import { neeDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, run, data } = body;

    if (!run || !type || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'familia') {
      const { semester, folio, profesor_jefe, fecha_diagnostico, profesional_data, apoderado_data, reportes_area, desempeno_acad, convivencia_salud } = data;
      neeDb.prepare(`
        INSERT OR REPLACE INTO informe_familia 
        (student_run, semester, folio, profesor_jefe, fecha_diagnostico, profesional_data, apoderado_data, reportes_area, desempeno_acad, convivencia_salud)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        run, semester, folio, profesor_jefe, fecha_diagnostico,
        JSON.stringify(profesional_data), 
        JSON.stringify(apoderado_data), 
        JSON.stringify(reportes_area), 
        desempeno_acad, 
        JSON.stringify(convivencia_salud)
      );

    } else if (type === 'paec') {
      const { folio, fecha_elaboracion, perfil_data, matriz_crisis, acuerdos } = data;
      neeDb.prepare(`
        INSERT OR REPLACE INTO plan_paec 
        (student_run, folio, fecha_elaboracion, perfil_data, matriz_crisis, acuerdos)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        run, folio, fecha_elaboracion, 
        JSON.stringify(perfil_data), 
        JSON.stringify(matriz_crisis), 
        acuerdos
      );
    } else if (type === 'unico') {
      const { folio, sintesis_evaluacion, apoyos_recomendados } = data;
      neeDb.prepare(`
        INSERT OR REPLACE INTO formulario_unico 
        (student_run, folio, sintesis_evaluacion, apoyos_recomendados)
        VALUES (?, ?, ?, ?)
      `).run(run, folio, sintesis_evaluacion, apoyos_recomendados);
    }

    return NextResponse.json({ success: true, message: 'Informe guardado correctamente' });
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
    const semester = searchParams.get('semester') || '1';

    if (!run || !type) {
      return NextResponse.json({ error: 'Missing run or type' }, { status: 400 });
    }

    let data = null;
    if (type === 'familia') {
      data = neeDb.prepare('SELECT * FROM informe_familia WHERE student_run = ? AND semester = ?').get(run, semester);
    } else if (type === 'paec') {
      data = neeDb.prepare('SELECT * FROM plan_paec WHERE student_run = ?').get(run);
    } else if (type === 'unico') {
      data = neeDb.prepare('SELECT * FROM formulario_unico WHERE student_run = ?').get(run);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
