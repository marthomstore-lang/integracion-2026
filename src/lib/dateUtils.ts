/**
 * Calculates age in years and months from a birth date.
 * @param birthDateString ISO date string (YYYY-MM-DD)
 * @returns Formatted string "X Años Y Meses" or "X Años" if months is 0.
 */
export function calculateAge(birthDateString: string): string {
  if (!birthDateString || birthDateString === '---') return '---';
  
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return '---';
  
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  
  if (today.getDate() < birthDate.getDate()) {
    months--;
    if (months < 0) {
      months = 11;
      years--;
    }
  }

  if (years < 0) return '---';

  if (months === 0) {
    return `${years} Años`;
  }
  
  return `${years} Años ${months} Meses`;
}

/**
 * Formats a date string to a more readable format for reports if needed.
 * @param dateString ISO date string
 * @returns Formatted date
 */
export function formatDate(dateString: string): string {
  if (!dateString || dateString === '---') return '---';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '---';
  
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
