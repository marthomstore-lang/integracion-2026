import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Note: In a real environment, this should be in .env.local
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { field, context, length = 'medium' } = await request.json();

    if (!API_KEY) {
      // Mock response if no API key is provided, based on common PIE requirements
      return NextResponse.json({ 
        success: true, 
        suggestions: [
          `Opción 1: Implementar apoyos visuales y segmentación de instrucciones para ${context.diagnostico}.`,
          `Opción 2: Fomentar un entorno predecible con rutinas claras para el estudiante ${context.name}.`,
          `Opción 3: Realizar pausas sensoriales y adecuaciones en el tiempo de ejecución de tareas.`
        ]
      });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Actúa como un experto en Educación Diferencial y Psicopedagogía en Chile.
      Genera 3 opciones distintas de texto profesional para el campo "${field}" de un informe escolar.
      
      DATOS DEL ESTUDIANTE:
      - Nombre: ${context.name}
      - Diagnóstico: ${context.diagnostico}
      - Nivel: ${context.course}
      
      CONTEXTO ACTUAL DEL INFORME:
      - Lo que ya está escrito en este campo: "${context.currentContent || 'Vacío'}"
      - Notas de otros profesionales (Psicólogo, Fonoaudiólogo, etc.): 
        ${JSON.stringify(context.otherProfessionalNotes || {})}

      INSTRUCCIÓN ESPECÍFICA DEL DOCENTE (PRIORIDAD ALTA):
      - "${context.userInstruction || 'Ninguna especificada'}"

      INSTRUCCIONES CRÍTICAS:
      1. Si el docente proporcionó una instrucción específica, DEBES seguirla estrictamente mientras mantienes la coherencia profesional.
      2. Si ya hay contenido en el campo, tus sugerencias deben REFINAR, AMPLIAR o CONTINUAR ese texto de forma coherente.

      2. Si hay notas de otros profesionales, asegúrate de que tus sugerencias sean CONSISTENTES y COMPLEMENTARIAS a lo que ellos observaron. Evita contradicciones.
      3. Genera 3 sugerencias con enfoques ligeramente diferentes.
      4. La extensión de cada una debe ser ${length}.
      5. Usa un lenguaje técnico pero empático.
      6. Devuelve el resultado ESTRICTAMENTE como un objeto JSON con la siguiente estructura:
         { "suggestions": ["opción 1...", "opción 2...", "opción 3..."] }
      - No incluyas texto fuera del JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Improved JSON extraction: find the first { and the last }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        if (data.suggestions && Array.isArray(data.suggestions)) {
          return NextResponse.json({ success: true, suggestions: data.suggestions });
        }
      } catch (e) {
        console.error('JSON Parse Error, text was:', text);
      }
    }

    // Fallback if AI doesn't follow instructions
    return NextResponse.json({ 
      success: true, 
      suggestions: [
        `Opción 1: Proporcionar apoyos específicos en el área de ${field} considerando el diagnóstico de ${context?.diagnostico || 'NEE'}.`,
        `Opción 2: Implementar estrategias de mediación del aprendizaje y adecuaciones curriculares según el perfil de ${context?.name || 'el estudiante'}.`,
        `Opción 3: Fomentar un ambiente de aprendizaje inclusivo y colaborativo que potencie las fortalezas individuales.`
      ]
    });
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ 
      success: true, 
      suggestions: [
        "Opción 1: Se recomienda monitoreo constante y apoyos visuales en el aula.",
        "Opción 2: Implementar pausas activas y segmentación de instrucciones.",
        "Opción 3: Fortalecer la alianza con la familia para el seguimiento de objetivos."
      ]
    });
  }
}
