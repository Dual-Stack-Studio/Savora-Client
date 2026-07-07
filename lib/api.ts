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

export type NewsTopic = 'food' | 'health';

export type NewsArticle = {
  id: string;
  title: string;
  link: string;
  description: string | null;
  image: string | null;
  source: string | null;
  publishedAt: string | null;
};

/** Noticias de comida/salud para la home (proxy a NewsData.io con caché en el backend). */
export async function fetchNews(topic: NewsTopic): Promise<NewsArticle[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/news?topic=${topic}`, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `El servidor respondió ${res.status}.`);
  }
  return (body as { articles: NewsArticle[] }).articles;
}

export type RecipeDetail = {
  id: number;
  title: string;
  diet: Diet;
  instructions: string;
  ingredients: { name: string; quantity: string | null }[];
};

export type ExternalRecipeDetail = {
  id: number;
  title: string;
  image: string | null;
  servings: number | null;
  readyInMinutes: number | null;
  sourceUrl: string | null;
  ingredients: { name: string; original: string }[];
  instructions: string[];
};

/** Detalle de una receta del catálogo (las que aparecen en "From your kitchen"). */
export async function fetchRecipeDetail(id: number): Promise<RecipeDetail> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/recipes/${id}`, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `El servidor respondió ${res.status}.`);
  }
  return (body as { recipe: RecipeDetail }).recipe;
}

/** Detalle de una receta externa (las que aparecen en "Ideas from the internet"). */
export async function fetchExternalRecipeDetail(id: number): Promise<ExternalRecipeDetail> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/external/${id}`, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `El servidor respondió ${res.status}.`);
  }
  return (body as { recipe: ExternalRecipeDetail }).recipe;
}

export async function fetchSuggestions(
  ingredients: string[],
  diet?: Diet
): Promise<SuggestResponse> {
  // AbortSignal.timeout() no existe en Hermes (Android/iOS); se emula con AbortController
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients, ...(diet && { diet }) }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `El servidor respondió ${res.status}.`);
  }
  return body as SuggestResponse;
}
