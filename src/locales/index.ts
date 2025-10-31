import { ar } from './ar';
import { en } from './en';
import { fr } from './fr';
import { de } from './de';
import { es } from './es';

export const translations = {
  ar,
  en,
  fr,
  de,
  es
};

export type Language = 'ar' | 'en' | 'fr' | 'de' | 'es';
export type TranslationKey = keyof typeof ar;
