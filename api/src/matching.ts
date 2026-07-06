/**
 * Lógica de matching ingredientes → recetas. Pura (sin DB, sin Express)
 * para poder testearla unitariamente.
 *
 * Reglas de negocio:
 *  - Normalización: minúsculas, sin espacios al borde, espacios internos colapsados.
 *  - Resolución de ingredientes: nombre canónico o cualquier sinónimo; si no
 *    matchea y termina en "s"/"es", se reintenta en singular naive.
 *  - Solo se sugieren recetas con al menos 1 ingrediente matcheado.
 *  - Ranking: mayor score primero (matcheados / total de la receta); a igual
 *    score, menos faltantes primero; a igual todo, orden alfabético.
 *  - Filtro de dieta jerárquico: "vegano" ⊂ "vegetariano". Filtrar por
 *    vegetariano incluye recetas veganas; filtrar por vegano solo veganas;
 *    "con_carne" solo platos con carne. Sin filtro, se sugiere todo.
 */

export const DIETS = ['vegano', 'vegetariano', 'con_carne'] as const;
export type Diet = (typeof DIETS)[number];

export type RecipeRecord = {
  id: number;
  title: string;
  diet: Diet;
  ingredients: string[]; // nombres canónicos
};

export type Suggestion = {
  id: number;
  title: string;
  diet: Diet;
  matched: string[];
  missing: string[];
  score: number; // 0..1, redondeado a 2 decimales
};

export type SuggestResult = {
  suggestions: Suggestion[];
  unknownIngredients: string[]; // inputs que no resolvimos a ningún ingrediente conocido
};

export function normalize(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** synonymMap: alias normalizado → nombre canónico (incluye el canónico como alias de sí mismo). */
export function resolveIngredient(input: string, synonymMap: Map<string, string>): string | null {
  const normalized = normalize(input);
  if (normalized.length === 0) return null;

  const direct = synonymMap.get(normalized);
  if (direct) return direct;

  // Singular naive: "cebollas" → "cebolla", "tomates" → "tomate"
  for (const suffix of ['es', 's']) {
    if (normalized.endsWith(suffix)) {
      const singular = synonymMap.get(normalized.slice(0, -suffix.length));
      if (singular) return singular;
    }
  }
  return null;
}

export function dietMatches(recipeDiet: Diet, filter?: Diet): boolean {
  if (!filter) return true;
  if (filter === 'vegetariano') return recipeDiet === 'vegetariano' || recipeDiet === 'vegano';
  return recipeDiet === filter;
}

export function suggest(
  inputs: string[],
  recipes: RecipeRecord[],
  synonymMap: Map<string, string>,
  diet?: Diet
): SuggestResult {
  const resolved = new Set<string>();
  const unknownIngredients: string[] = [];

  for (const input of inputs) {
    const canonical = resolveIngredient(input, synonymMap);
    if (canonical) {
      resolved.add(canonical);
    } else if (normalize(input).length > 0) {
      unknownIngredients.push(input.trim());
    }
  }

  const suggestions: Suggestion[] = [];
  for (const recipe of recipes) {
    if (!dietMatches(recipe.diet, diet)) continue;

    const matched = recipe.ingredients.filter((i) => resolved.has(i));
    if (matched.length === 0) continue;

    const missing = recipe.ingredients.filter((i) => !resolved.has(i));
    suggestions.push({
      id: recipe.id,
      title: recipe.title,
      diet: recipe.diet,
      matched,
      missing,
      score: Math.round((matched.length / recipe.ingredients.length) * 100) / 100,
    });
  }

  suggestions.sort(
    (a, b) =>
      b.score - a.score ||
      a.missing.length - b.missing.length ||
      a.title.localeCompare(b.title, 'es')
  );

  return { suggestions, unknownIngredients };
}
