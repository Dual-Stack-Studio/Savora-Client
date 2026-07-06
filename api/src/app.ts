import cors from 'cors';
import express from 'express';

import { Db, loadRecipes, loadSynonymMap } from './db';
import { Diet, DIETS, suggest } from './matching';

/**
 * API HTTP de Nicy Kitchen.
 *
 * POST /api/suggestions  { ingredients: string[], diet?: Diet }
 *   → { suggestions, unknownIngredients }
 * GET  /api/recipes      ?diet=vegano|vegetariano|con_carne (jerárquico)
 * GET  /health
 *
 * Validaciones de /api/suggestions:
 *  - ingredients: requerido, array de strings, entre 1 y 30 ítems no vacíos
 *  - diet: opcional, uno de DIETS
 */

export const MAX_INGREDIENTS = 30;

function parseDiet(value: unknown): { diet?: Diet; error?: string } {
  if (value === undefined || value === null || value === '') return {};
  if (typeof value === 'string' && (DIETS as readonly string[]).includes(value)) {
    return { diet: value as Diet };
  }
  return { error: `diet debe ser uno de: ${DIETS.join(', ')}.` };
}

export function createApp(db: Db) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/recipes', (req, res) => {
    const { diet, error } = parseDiet(req.query.diet);
    if (error) return res.status(400).json({ error });

    const recipes = loadRecipes(db).filter(
      (r) =>
        !diet ||
        (diet === 'vegetariano' ? r.diet === 'vegetariano' || r.diet === 'vegano' : r.diet === diet)
    );
    res.json({ recipes });
  });

  app.post('/api/suggestions', (req, res) => {
    const body = req.body ?? {};

    if (!Array.isArray(body.ingredients)) {
      return res.status(400).json({ error: 'ingredients es requerido y debe ser un array.' });
    }
    if (!body.ingredients.every((i: unknown) => typeof i === 'string')) {
      return res.status(400).json({ error: 'Todos los ingredientes deben ser texto.' });
    }
    const nonEmpty = body.ingredients.filter((i: string) => i.trim().length > 0);
    if (nonEmpty.length === 0) {
      return res.status(400).json({ error: 'Mandá al menos un ingrediente.' });
    }
    if (nonEmpty.length > MAX_INGREDIENTS) {
      return res
        .status(400)
        .json({ error: `Máximo ${MAX_INGREDIENTS} ingredientes por consulta.` });
    }

    const { diet, error } = parseDiet(body.diet);
    if (error) return res.status(400).json({ error });

    const result = suggest(nonEmpty, loadRecipes(db), loadSynonymMap(db), diet);
    res.json(result);
  });

  return app;
}
