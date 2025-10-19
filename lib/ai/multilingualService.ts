import { supabase } from '@/lib/supabase';

interface SynonymMapping {
  localTerm: string;
  canonicalName: string;
  language: string;
  region?: string;
  category?: string;
}

const NUMERAL_PATTERNS: Record<string, number> = {
  'एक': 1,
  'ek': 1,
  'दो': 2,
  'do': 2,
  'तीन': 3,
  'teen': 3,
  'चार': 4,
  'char': 4,
  'पांच': 5,
  'paanch': 5,
  'पाँच': 5,
};

const HINDI_UNITS = [
  'रोटी', 'कटोरी', 'कप', 'प्याला', 'अंडा',
  'roti', 'katori', 'cup', 'anda',
];

export async function loadSynonyms(): Promise<SynonymMapping[]> {
  try {
    const { data, error } = await supabase
      .from('multilingual_synonyms')
      .select('*');

    if (error) throw error;

    return (data || []).map((row) => ({
      localTerm: row.local_term,
      canonicalName: row.canonical_name,
      language: row.language,
      region: row.region,
      category: row.category,
    }));
  } catch (error) {
    console.error('Failed to load synonyms:', error);
    return [];
  }
}

export function translateToEnglish(
  text: string,
  synonyms: SynonymMapping[]
): string {
  let translated = text.toLowerCase();

  for (const [hindi, english] of Object.entries(NUMERAL_PATTERNS)) {
    const regex = new RegExp(hindi, 'gi');
    translated = translated.replace(regex, String(english));
  }

  for (const synonym of synonyms) {
    const regex = new RegExp(`\\b${synonym.localTerm}\\b`, 'gi');
    translated = translated.replace(regex, synonym.canonicalName);
  }

  return translated;
}

export function detectLanguage(text: string): 'en' | 'hi' | 'mixed' {
  const hindiCharPattern = /[\u0900-\u097F]/;
  const hasHindi = hindiCharPattern.test(text);

  const hindiWords = HINDI_UNITS.filter((unit) =>
    text.toLowerCase().includes(unit)
  ).length;

  if (hasHindi) return 'hi';
  if (hindiWords > 0) return 'mixed';
  return 'en';
}

export function normalizeUserNote(
  note: string,
  synonyms: SynonymMapping[]
): string {
  const language = detectLanguage(note);

  if (language === 'en') {
    return note;
  }

  return translateToEnglish(note, synonyms);
}

export function extractQuantityFromHindi(text: string): number | null {
  for (const [hindi, value] of Object.entries(NUMERAL_PATTERNS)) {
    const regex = new RegExp(`\\b${hindi}\\b`, 'i');
    if (regex.test(text)) {
      return value;
    }
  }

  const digitMatch = text.match(/\d+/);
  if (digitMatch) {
    return parseInt(digitMatch[0], 10);
  }

  return null;
}

export function buildMultilingualPromptHint(
  synonyms: SynonymMapping[]
): string {
  const hindiTerms = synonyms
    .filter((s) => s.language === 'hi')
    .slice(0, 10)
    .map((s) => s.localTerm)
    .join(', ');

  return `\nSupported Terms: English and Hindi (e.g., ${hindiTerms}). Numerals can be in Devanagari or Roman script.`;
}
