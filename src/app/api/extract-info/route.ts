import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let text = '';

    if (file.name.endsWith('.pdf')) {
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      text = data.text;
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      text = XLSX.utils.sheet_to_txt(worksheet);
    } else {
      text = buffer.toString();
    }

    // Smart extraction using regex patterns
    // We look for common labels and capture the following text
    const nameMatch = text.match(/Nombre(?:\s+completo)?:?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]{3,50})/i);
    const runMatch = text.match(/(?:RUT|RUN):?\s*([\d\.-]+[Kk0-9])/i);
    const cursoMatch = text.match(/Curso:?\s*([0-9º\s\w]{1,15})/i);
    const diagnosticoMatch = text.match(/(?:Diagnóstico|NEE):?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s,]{5,100})/i);

    return NextResponse.json({
      success: true,
      data: {
        name: nameMatch ? nameMatch[1].trim() : null,
        run: runMatch ? runMatch[1].trim() : null,
        course: cursoMatch ? cursoMatch[1].trim() : null,
        diagnostico: diagnosticoMatch ? diagnosticoMatch[1].trim() : null
      }
    });
  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
