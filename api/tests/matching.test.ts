import {
  dietMatches,
  normalize,
  RecipeRecord,
  resolveIngredient,
  suggest,
} from '../src/matching';

const synonyms = new Map<string, string>([
  ['papa', 'papa'],
  ['patata', 'papa'],
  ['potato', 'papa'],
  ['kartoffel', 'papa'],
  ['huevo', 'huevo'],
  ['egg', 'huevo'],
  ['cebolla', 'cebolla'],
  ['onion', 'cebolla'],
  ['sal', 'sal'],
  ['salt', 'sal'],
  ['carne picada', 'carne picada'],
]);

const recipes: RecipeRecord[] = [
  { id: 1, title: 'Tortilla de papas', diet: 'vegetariano', ingredients: ['papa', 'huevo', 'cebolla', 'sal'] },
  { id: 2, title: 'Milanesas', diet: 'con_carne', ingredients: ['carne picada', 'huevo', 'sal'] },
  { id: 3, title: 'Puré', diet: 'vegano', ingredients: ['papa', 'sal'] },
];

describe('normalize', () => {
  // TC-API-01
  it('baja a minúsculas, recorta bordes y colapsa espacios internos', () => {
    expect(normalize('  Carne   Picada  ')).toBe('carne picada');
  });
});

describe('resolveIngredient', () => {
  // TC-API-02: sinónimos en otros idiomas
  it.each(['papa', 'Patata', 'POTATO', 'Kartoffel'])('resuelve %p → papa', (input) => {
    expect(resolveIngredient(input, synonyms)).toBe('papa');
  });

  // TC-API-03: plural naive
  it('resuelve plurales: "papas" → papa, "cebollas" → cebolla', () => {
    expect(resolveIngredient('papas', synonyms)).toBe('papa');
    expect(resolveIngredient('cebollas', synonyms)).toBe('cebolla');
  });

  // TC-API-04
  it('devuelve null para ingredientes desconocidos o vacíos', () => {
    expect(resolveIngredient('unicornio', synonyms)).toBeNull();
    expect(resolveIngredient('   ', synonyms)).toBeNull();
  });
});

describe('dietMatches (filtro jerárquico)', () => {
  // TC-API-05: la regla de negocio clave
  it('filtro vegetariano incluye recetas veganas', () => {
    expect(dietMatches('vegano', 'vegetariano')).toBe(true);
    expect(dietMatches('vegetariano', 'vegetariano')).toBe(true);
    expect(dietMatches('con_carne', 'vegetariano')).toBe(false);
  });

  // TC-API-06: vegano es estricto
  it('filtro vegano excluye lo vegetariano no vegano', () => {
    expect(dietMatches('vegano', 'vegano')).toBe(true);
    expect(dietMatches('vegetariano', 'vegano')).toBe(false);
  });

  it('sin filtro pasa todo', () => {
    expect(dietMatches('con_carne')).toBe(true);
  });
});

describe('suggest (ranking)', () => {
  // TC-API-07: score y orden
  it('ordena por proporción de ingredientes matcheados', () => {
    const { suggestions } = suggest(['papa', 'sal'], recipes, synonyms);
    // Puré: 2/2 = 1.0 · Tortilla: 2/4 = 0.5 · Milanesas: 1/3 = 0.33
    expect(suggestions.map((s) => s.title)).toEqual(['Puré', 'Tortilla de papas', 'Milanesas']);
    expect(suggestions[0].score).toBe(1);
    expect(suggestions[1].missing).toEqual(['huevo', 'cebolla']);
  });

  // TC-API-08: recetas sin ningún match no aparecen
  it('excluye recetas sin ingredientes en común', () => {
    const { suggestions } = suggest(['carne picada'], recipes, synonyms);
    expect(suggestions.map((s) => s.title)).toEqual(['Milanesas']);
  });

  // TC-API-09: combinación matching + dieta
  it('aplica el filtro de dieta sobre los resultados', () => {
    const { suggestions } = suggest(['papa', 'huevo', 'sal'], recipes, synonyms, 'vegetariano');
    expect(suggestions.map((s) => s.title)).toEqual(['Puré', 'Tortilla de papas']);
  });

  // TC-API-10: reporta lo que no entendió
  it('devuelve los ingredientes no reconocidos', () => {
    const { unknownIngredients } = suggest(['papa', 'unicornio', 'dragón'], recipes, synonyms);
    expect(unknownIngredients).toEqual(['unicornio', 'dragón']);
  });

  // TC-API-11: duplicados en el input no inflan el score
  it('ingredientes repetidos cuentan una sola vez', () => {
    const { suggestions } = suggest(['papa', 'papas', 'Potato'], recipes, synonyms);
    const pure = suggestions.find((s) => s.title === 'Puré');
    expect(pure?.matched).toEqual(['papa']);
    expect(pure?.score).toBe(0.5);
  });
});
