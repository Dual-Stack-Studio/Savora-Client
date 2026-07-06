import { Platform } from 'react-native';

/**
 * Cliente del backend (nicy-kitchen-api).
 *
 * URL base:
 *  - configurable con EXPO_PUBLIC_API_URL (p. ej. la URL de Railway en prod,
 *    o la IP de tu PC para probar en un teléfono físico)
 *  - por defecto: localhost en web/iOS, 10.0.2.2 en el emulador Android
 *    (así ve al localhost de la máquina host)
 */

const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_URL;

export type Diet = 'vegan' | 'vegetarian' | 'mit_meat';

export type LocalSuggestion = {
  id: number;
  title: string;
  diet: Diet;
  matched: string[];
  missing: string[];
  score: number;
};

export type ExternalSuggestion = {
  id: number;
  title: string;
  image: string | null;
  matchedCount: number;
  missingCount: number;
  source: 'spoonacular';
};

export type SuggestResponse = {
  suggestions: LocalSuggestion[];
  unknownIngredients: string[];
  resolvedIngredients: string[];
  external?: ExternalSuggestion[];
  externalError?: string;
};

export async function fetchSuggestions(
  ingredients: string[],
  diet?: Diet
): Promise<SuggestResponse> {
  const res = await fetch(`${API_URL}/api/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients, ...(diet && { diet }) }),
    signal: AbortSignal.timeout(10000),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `El servidor respondió ${res.status}.`);
  }
  return body as SuggestResponse;
}
