import request from 'supertest';

import { createApp } from '../src/app';
import { createDb, Db } from '../src/db';

let db: Db;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  db = createDb(':memory:');
  app = createApp(db);
});

afterEach(() => {
  db.close();
});

describe('GET /health', () => {
  // TC-API-20
  it('responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/recipes', () => {
  // TC-API-21
  it('lista las recetas del seed', async () => {
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body.recipes.length).toBeGreaterThanOrEqual(10);
    expect(res.body.recipes[0]).toHaveProperty('title');
    expect(res.body.recipes[0]).toHaveProperty('diet');
    expect(res.body.recipes[0]).toHaveProperty('ingredients');
  });

  // TC-API-22: filtro jerárquico vía query param
  it('?diet=vegetariano devuelve vegetarianas y veganas, nunca con carne', async () => {
    const res = await request(app).get('/api/recipes?diet=vegetariano');
    expect(res.status).toBe(200);
    const diets = res.body.recipes.map((r: { diet: string }) => r.diet);
    expect(diets.length).toBeGreaterThan(0);
    expect(diets).not.toContain('con_carne');
  });

  it('?diet=vegano devuelve solo veganas', async () => {
    const res = await request(app).get('/api/recipes?diet=vegano');
    const diets: string[] = res.body.recipes.map((r: { diet: string }) => r.diet);
    expect(diets.length).toBeGreaterThan(0);
    expect(new Set(diets)).toEqual(new Set(['vegano']));
  });

  // TC-API-23
  it('?diet=paleo (inválido) responde 400 con mensaje claro', async () => {
    const res = await request(app).get('/api/recipes?diet=paleo');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/diet debe ser uno de/);
  });
});

describe('POST /api/suggestions', () => {
  // TC-API-24: el caso feliz del usuario ("sal, pepper, onion…")
  it('sugiere recetas para ingredientes en varios idiomas', async () => {
    const res = await request(app)
      .post('/api/suggestions')
      .send({ ingredients: ['sal', 'pepper', 'onion', 'papas', 'huevos'] });

    expect(res.status).toBe(200);
    const titles = res.body.suggestions.map((s: { title: string }) => s.title);
    expect(titles).toContain('Tortilla de papas');
    // Tortilla matchea 4/5 (le falta el aceite) → primera igual, score 0.8
    expect(titles[0]).toBe('Tortilla de papas');
    expect(res.body.suggestions[0].score).toBe(0.8);
    expect(res.body.suggestions[0].missing).toEqual(['aceite']);
  });

  // TC-API-25: matching + dieta juntos
  it('con diet=vegano no sugiere tortilla (lleva huevo) pero sí wok', async () => {
    const res = await request(app)
      .post('/api/suggestions')
      .send({ ingredients: ['cebolla', 'zanahoria', 'sal'], diet: 'vegano' });

    expect(res.status).toBe(200);
    const titles = res.body.suggestions.map((s: { title: string }) => s.title);
    expect(titles).toContain('Wok de verduras');
    expect(titles).not.toContain('Tortilla de papas');
  });

  // TC-API-26: validaciones
  it('sin body responde 400', async () => {
    const res = await request(app).post('/api/suggestions').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ingredients es requerido/);
  });

  it('con array vacío o solo espacios responde 400', async () => {
    for (const ingredients of [[], ['   ', '']]) {
      const res = await request(app).post('/api/suggestions').send({ ingredients });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/al menos un ingrediente/);
    }
  });

  it('con más de 30 ingredientes responde 400', async () => {
    const ingredients = Array.from({ length: 31 }, (_, i) => `ing${i}`);
    const res = await request(app).post('/api/suggestions').send({ ingredients });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Máximo 30/);
  });

  it('con ingredientes que no son texto responde 400', async () => {
    const res = await request(app)
      .post('/api/suggestions')
      .send({ ingredients: ['sal', 42, null] });
    expect(res.status).toBe(400);
  });

  it('con diet inválida responde 400', async () => {
    const res = await request(app)
      .post('/api/suggestions')
      .send({ ingredients: ['sal'], diet: 'keto' });
    expect(res.status).toBe(400);
  });

  // TC-API-27: ingredientes desconocidos se informan, no rompen
  it('informa unknownIngredients sin fallar', async () => {
    const res = await request(app)
      .post('/api/suggestions')
      .send({ ingredients: ['papa', 'criptonita'] });
    expect(res.status).toBe(200);
    expect(res.body.unknownIngredients).toEqual(['criptonita']);
  });

  // TC-API-28: solo desconocidos → 200 con lista vacía (no es un error del usuario)
  it('con solo ingredientes desconocidos devuelve sugerencias vacías', async () => {
    const res = await request(app)
      .post('/api/suggestions')
      .send({ ingredients: ['criptonita'] });
    expect(res.status).toBe(200);
    expect(res.body.suggestions).toEqual([]);
    expect(res.body.unknownIngredients).toEqual(['criptonita']);
  });
});
