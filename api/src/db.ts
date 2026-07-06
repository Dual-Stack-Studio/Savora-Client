import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';

import { Diet, RecipeRecord } from './matching';

/**
 * Capa de datos del backend. SQLite por ahora (cero instalación, misma SQL
 * que Postgres para lo que usamos); al desplegar en Railway se migra a
 * Postgres cambiando solo este archivo.
 *
 * Los tests usan ':memory:' para no tocar el archivo real.
 */

export type Db = Database.Database;

type SeedRecipe = {
  title: string;
  diet: Diet;
  ingredients: [name: string, quantity?: string][];
};

type SeedIngredient = {
  name: string; // canónico, en español, singular
  synonyms: string[]; // otros idiomas, variantes
};

const SEED_INGREDIENTS: SeedIngredient[] = [
  { name: 'papa', synonyms: ['patata', 'potato', 'kartoffel'] },
  { name: 'huevo', synonyms: ['egg', 'ei'] },
  { name: 'cebolla', synonyms: ['onion', 'zwiebel'] },
  { name: 'sal', synonyms: ['salt', 'salz'] },
  { name: 'pimienta', synonyms: ['pepper', 'pfeffer'] },
  { name: 'aceite', synonyms: ['oil', 'öl', 'aceite de oliva'] },
  { name: 'carne picada', synonyms: ['carne molida', 'ground beef', 'hackfleisch'] },
  { name: 'pan rallado', synonyms: ['breadcrumbs', 'semmelbrösel'] },
  { name: 'lenteja', synonyms: ['lentil', 'linse'] },
  { name: 'zanahoria', synonyms: ['carrot', 'karotte', 'möhre'] },
  { name: 'tomate', synonyms: ['tomato', 'tomate perita'] },
  { name: 'fideos', synonyms: ['pasta', 'nudeln', 'spaghetti'] },
  { name: 'albahaca', synonyms: ['basil', 'basilikum'] },
  { name: 'queso', synonyms: ['cheese', 'käse', 'queso rallado'] },
  { name: 'arroz', synonyms: ['rice', 'reis'] },
  { name: 'hongos', synonyms: ['champiñones', 'mushrooms', 'pilze', 'setas'] },
  { name: 'garbanzo', synonyms: ['chickpea', 'kichererbse'] },
  { name: 'limón', synonyms: ['lemon', 'zitrone'] },
  { name: 'ajo', synonyms: ['garlic', 'knoblauch'] },
  { name: 'morrón', synonyms: ['pimiento', 'bell pepper', 'paprika'] },
  { name: 'pollo', synonyms: ['chicken', 'hähnchen', 'pechuga'] },
  { name: 'leche', synonyms: ['milk', 'milch'] },
  { name: 'harina', synonyms: ['flour', 'mehl'] },
  { name: 'manteca', synonyms: ['mantequilla', 'butter'] },
];

const SEED_RECIPES: SeedRecipe[] = [
  {
    title: 'Tortilla de papas',
    diet: 'vegetariano',
    ingredients: [['papa', '1 kg'], ['huevo', '6'], ['cebolla', '1'], ['sal'], ['aceite']],
  },
  {
    title: 'Milanesas con puré',
    diet: 'con_carne',
    ingredients: [
      ['carne picada', '500 g'],
      ['pan rallado'],
      ['huevo', '2'],
      ['papa', '1 kg'],
      ['sal'],
      ['pimienta'],
    ],
  },
  {
    title: 'Guiso de lentejas',
    diet: 'vegano',
    ingredients: [
      ['lenteja', '400 g'],
      ['cebolla', '1'],
      ['zanahoria', '2'],
      ['tomate', '2'],
      ['ajo'],
      ['sal'],
    ],
  },
  {
    title: 'Fideos al pesto',
    diet: 'vegetariano',
    ingredients: [['fideos', '500 g'], ['albahaca'], ['queso'], ['ajo'], ['aceite'], ['sal']],
  },
  {
    title: 'Risotto de hongos',
    diet: 'vegetariano',
    ingredients: [['arroz', '300 g'], ['hongos', '250 g'], ['cebolla'], ['queso'], ['manteca'], ['sal']],
  },
  {
    title: 'Hummus',
    diet: 'vegano',
    ingredients: [['garbanzo', '400 g'], ['limón', '1'], ['ajo'], ['aceite'], ['sal']],
  },
  {
    title: 'Pollo al horno con papas',
    diet: 'con_carne',
    ingredients: [['pollo', '1'], ['papa', '1 kg'], ['morrón'], ['cebolla'], ['aceite'], ['sal'], ['pimienta']],
  },
  {
    title: 'Wok de verduras',
    diet: 'vegano',
    ingredients: [['zanahoria'], ['morrón'], ['cebolla'], ['hongos'], ['aceite'], ['sal']],
  },
  {
    title: 'Panqueques',
    diet: 'vegetariano',
    ingredients: [['harina', '250 g'], ['leche', '500 ml'], ['huevo', '2'], ['manteca'], ['sal']],
  },
  {
    title: 'Ensalada de arroz',
    diet: 'vegano',
    ingredients: [['arroz', '200 g'], ['tomate'], ['morrón'], ['cebolla'], ['limón'], ['aceite'], ['sal']],
  },
];

export function createDb(filename: string): Db {
  if (filename !== ':memory:') {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS ingredient_synonyms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
      alias TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      diet TEXT NOT NULL CHECK (diet IN ('vegano', 'vegetariano', 'con_carne'))
    );
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
      quantity TEXT,
      PRIMARY KEY (recipe_id, ingredient_id)
    );
  `);

  seedIfEmpty(db);
  return db;
}

function seedIfEmpty(db: Db) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM recipes').get() as { n: number };
  if (count.n > 0) return;

  const insertIngredient = db.prepare('INSERT INTO ingredients (name) VALUES (?)');
  const insertSynonym = db.prepare(
    'INSERT INTO ingredient_synonyms (ingredient_id, alias) VALUES (?, ?)'
  );
  const insertRecipe = db.prepare('INSERT INTO recipes (title, diet) VALUES (?, ?)');
  const insertRecipeIngredient = db.prepare(
    'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (?, ?, ?)'
  );

  const seed = db.transaction(() => {
    const idByName = new Map<string, number>();
    for (const ingredient of SEED_INGREDIENTS) {
      const { lastInsertRowid } = insertIngredient.run(ingredient.name);
      const id = Number(lastInsertRowid);
      idByName.set(ingredient.name, id);
      for (const alias of ingredient.synonyms) {
        insertSynonym.run(id, alias.toLowerCase());
      }
    }
    for (const recipe of SEED_RECIPES) {
      const { lastInsertRowid } = insertRecipe.run(recipe.title, recipe.diet);
      for (const [name, quantity] of recipe.ingredients) {
        const ingredientId = idByName.get(name);
        if (!ingredientId) throw new Error(`Seed inconsistente: falta el ingrediente "${name}"`);
        insertRecipeIngredient.run(Number(lastInsertRowid), ingredientId, quantity ?? null);
      }
    }
  });
  seed();
}

/** alias normalizado → canónico (incluye cada canónico apuntando a sí mismo). */
export function loadSynonymMap(db: Db): Map<string, string> {
  const map = new Map<string, string>();
  const canonicals = db.prepare('SELECT name FROM ingredients').all() as { name: string }[];
  for (const { name } of canonicals) map.set(name, name);

  const synonyms = db
    .prepare(
      `SELECT s.alias, i.name FROM ingredient_synonyms s JOIN ingredients i ON i.id = s.ingredient_id`
    )
    .all() as { alias: string; name: string }[];
  for (const { alias, name } of synonyms) map.set(alias, name);
  return map;
}

export function loadRecipes(db: Db): RecipeRecord[] {
  const rows = db
    .prepare(
      `SELECT r.id, r.title, r.diet, i.name AS ingredient
       FROM recipes r
       JOIN recipe_ingredients ri ON ri.recipe_id = r.id
       JOIN ingredients i ON i.id = ri.ingredient_id
       ORDER BY r.id`
    )
    .all() as { id: number; title: string; diet: RecipeRecord['diet']; ingredient: string }[];

  const byId = new Map<number, RecipeRecord>();
  for (const row of rows) {
    const existing = byId.get(row.id);
    if (existing) {
      existing.ingredients.push(row.ingredient);
    } else {
      byId.set(row.id, {
        id: row.id,
        title: row.title,
        diet: row.diet,
        ingredients: [row.ingredient],
      });
    }
  }
  return [...byId.values()];
}
