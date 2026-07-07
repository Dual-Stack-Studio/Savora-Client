import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Favoritos locales — recetas del catálogo o de Spoonacular que el usuario
 * guardó para volver a cocinarlas. Local-first (alcance "login liviano"):
 * la cuenta de Google habilita quién puede guardar, pero los datos en sí
 * siguen en el dispositivo, no están particionados por cuenta todavía.
 */

export type FavoriteSource = 'catalog' | 'external';

export type Favorite = {
  id: string; // `${source}:${recipeId}`
  source: FavoriteSource;
  recipeId: number;
  title: string;
  image: string | null;
  addedAt: string;
};

const STORAGE_KEY = 'nicy-kitchen/favorites';

function makeId(source: FavoriteSource, recipeId: number): string {
  return `${source}:${recipeId}`;
}

export async function listFavorites(): Promise<Favorite[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function isFavorite(source: FavoriteSource, recipeId: number): Promise<boolean> {
  const favorites = await listFavorites();
  return favorites.some((f) => f.id === makeId(source, recipeId));
}

export type FavoriteInput = {
  source: FavoriteSource;
  recipeId: number;
  title: string;
  image: string | null;
};

export async function addFavorite(input: FavoriteInput): Promise<Favorite> {
  const favorites = await listFavorites();
  const id = makeId(input.source, input.recipeId);
  const existing = favorites.find((f) => f.id === id);
  if (existing) return existing;

  const favorite: Favorite = { id, ...input, addedAt: new Date().toISOString() };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([favorite, ...favorites]));
  return favorite;
}

export async function removeFavorite(source: FavoriteSource, recipeId: number): Promise<void> {
  const favorites = await listFavorites();
  const id = makeId(source, recipeId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.filter((f) => f.id !== id)));
}

/** Alterna el estado y devuelve el nuevo valor (true = quedó favorito). */
export async function toggleFavorite(input: FavoriteInput): Promise<boolean> {
  const already = await isFavorite(input.source, input.recipeId);
  if (already) {
    await removeFavorite(input.source, input.recipeId);
    return false;
  }
  await addFavorite(input);
  return true;
}
