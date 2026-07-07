import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Capa de datos de recetas — milestone 1 (local-first).
 * La persistencia es AsyncStorage; cuando exista el backend, solo esta capa
 * cambia (las pantallas y las reglas de validación quedan iguales).
 *
 * Reglas de negocio (fuente de verdad para los casos de prueba en qa/):
 *  - título: requerido, 3 a 80 caracteres (sin contar espacios al borde)
 *  - ingredientes: al menos 1, cada uno con nombre no vacío
 *  - porciones: entero entre 1 y 50
 *  - instrucciones: requeridas, mínimo 10 caracteres
 */

export type Ingredient = {
  name: string;
  quantity?: string;
};

export type Recipe = {
  id: string;
  title: string;
  servings: number;
  ingredients: Ingredient[];
  instructions: string;
  createdAt: string;
  updatedAt: string;
};

export type RecipeInput = {
  title: string;
  servings: number;
  ingredients: Ingredient[];
  instructions: string;
};

export type RecipeErrors = Partial<Record<'title' | 'servings' | 'ingredients' | 'instructions', string>>;

export const TITLE_MIN = 3;
export const TITLE_MAX = 80;
export const SERVINGS_MIN = 1;
export const SERVINGS_MAX = 50;
export const INSTRUCTIONS_MIN = 10;

const STORAGE_KEY = 'nicy-kitchen/recipes';

export function validateRecipe(input: RecipeInput): RecipeErrors {
  const errors: RecipeErrors = {};

  const title = input.title.trim();
  if (title.length === 0) {
    errors.title = 'Title is required.';
  } else if (title.length < TITLE_MIN) {
    errors.title = `Title must be at least ${TITLE_MIN} characters.`;
  } else if (title.length > TITLE_MAX) {
    errors.title = `Title can't be longer than ${TITLE_MAX} characters.`;
  }

  if (!Number.isInteger(input.servings) || input.servings < SERVINGS_MIN || input.servings > SERVINGS_MAX) {
    errors.servings = `Servings must be a whole number between ${SERVINGS_MIN} and ${SERVINGS_MAX}.`;
  }

  const validIngredients = input.ingredients.filter((i) => i.name.trim().length > 0);
  if (validIngredients.length === 0) {
    errors.ingredients = 'Add at least one ingredient.';
  }

  if (input.instructions.trim().length < INSTRUCTIONS_MIN) {
    errors.instructions = `Instructions must be at least ${INSTRUCTIONS_MIN} characters.`;
  }

  return errors;
}

export class ValidationError extends Error {
  errors: RecipeErrors;

  constructor(errors: RecipeErrors) {
    super('Recipe failed validation.');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

function normalize(input: RecipeInput): Omit<RecipeInput, 'ingredients'> & { ingredients: Ingredient[] } {
  return {
    title: input.title.trim(),
    servings: input.servings,
    instructions: input.instructions.trim(),
    ingredients: input.ingredients
      .filter((i) => i.name.trim().length > 0)
      .map((i) => ({ name: i.name.trim(), quantity: i.quantity?.trim() || undefined })),
  };
}

export async function listRecipes(): Promise<Recipe[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Datos corruptos: preferimos lista vacía a crashear la app.
    return [];
  }
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  const recipes = await listRecipes();
  return recipes.find((r) => r.id === id);
}

export async function createRecipe(input: RecipeInput): Promise<Recipe> {
  const errors = validateRecipe(input);
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);

  const now = new Date().toISOString();
  const recipe: Recipe = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...normalize(input),
    createdAt: now,
    updatedAt: now,
  };

  const recipes = await listRecipes();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([recipe, ...recipes]));
  return recipe;
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<Recipe> {
  const errors = validateRecipe(input);
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);

  const recipes = await listRecipes();
  const index = recipes.findIndex((r) => r.id === id);
  if (index === -1) throw new Error(`Recipe with id ${id} does not exist.`);

  const updated: Recipe = {
    ...recipes[index],
    ...normalize(input),
    updatedAt: new Date().toISOString(),
  };
  recipes[index] = updated;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  return updated;
}

export async function deleteRecipe(id: string): Promise<void> {
  const recipes = await listRecipes();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipes.filter((r) => r.id !== id)));
}
