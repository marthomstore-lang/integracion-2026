/**
 * Obtiene el peso de ordenamiento de un curso de acuerdo a la secuencia requerida:
 * - Pre-Kinder
 * - Kinder
 * - 1 Básico a 8 Básico
 * - Taller Laboral
 * - 1 Medio
 * - 2 Medio A
 * - 2 Medio B
 * - 3 Mecánica
 * - 3 Párvulo
 * - 4 Mecánica
 * - 4 Párvulo
 */
export function getCourseWeight(courseName: string): number {
  if (!courseName) return 999;
  
  const normalized = courseName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[°º]/g, "") // Quitar símbolos de grado
    .replace(/-/g, " ") // Reemplazar guiones por espacios
    .trim();

  if (normalized.startsWith('pre kinder') || normalized.startsWith('prekinder')) return 1;
  if (normalized.startsWith('kinder')) return 2;
  
  if (normalized.startsWith('1 basico')) return 3;
  if (normalized.startsWith('2 basico')) return 4;
  if (normalized.startsWith('3 basico')) return 5;
  if (normalized.startsWith('4 basico')) return 6;
  if (normalized.startsWith('5 basico')) return 7;
  if (normalized.startsWith('6 basico')) return 8;
  if (normalized.startsWith('7 basico')) return 9;
  if (normalized.startsWith('8 basico')) return 10;
  
  if (normalized.startsWith('taller laboral')) return 11;
  if (normalized.startsWith('1 medio')) return 12;
  
  if (normalized.startsWith('2 medio a')) return 13;
  if (normalized.startsWith('2 medio b')) return 14;
  if (normalized.startsWith('2 medio')) return 13.5;
  
  if (normalized.startsWith('3 mecanica')) return 15;
  if (normalized.startsWith('3 parvulo')) return 16;
  
  if (normalized.startsWith('4 mecanica')) return 17;
  if (normalized.startsWith('4 parvulo')) return 18;

  // Si no coincide con ninguno conocido, ordenar alfabéticamente al final
  return 100 + normalized.charCodeAt(0);
}

/**
 * Ordena un arreglo de estudiantes primero por curso (según la secuencia de pesos)
 * y luego alfabéticamente por nombre completo.
 */
export function sortStudentsByCourse(students: any[]): any[] {
  return [...students].sort((a, b) => {
    const weightA = getCourseWeight(a.curso || a.course);
    const weightB = getCourseWeight(b.curso || b.course);
    
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    
    const nameA = a.full_name || '';
    const nameB = b.full_name || '';
    return nameA.localeCompare(nameB, 'es');
  });
}
