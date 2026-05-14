import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function getLocalized(obj: any, currentLang: string, baseField: string = 'name') {
  if (!obj) return '';
  
  // Enterprise Fallback Chain: Current -> AM -> EN -> RU
  const fallbacks = [currentLang, 'am', 'en', 'ru'];
  // Remove duplicates while preserving order
  const chain = Array.from(new Set(fallbacks));

  for (const lang of chain) {
    const langKey = lang.charAt(0).toUpperCase() + lang.slice(1); // 'ru' -> 'Ru'
    const localizedField = `${baseField}${langKey}`; // 'nameRu'
    if (obj[localizedField] && String(obj[localizedField]).trim() !== '') {
      return obj[localizedField];
    }
  }

  return obj[baseField] || '';
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
