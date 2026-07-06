# Casos de prueba — API de sugerencias por ingredientes

**Módulo:** Backend (`api/`) · **Cómo ejecutar manualmente:** levantar la API con `cd api && npm run dev` y probar con Postman/curl contra `http://localhost:3000`.

**Automatizado** = cubierto en `api/tests/` (mismo ID en comentario). Estos casos se ejecutan solos con `cd api && npm test`.

## Lógica de matching (unitarios en `tests/matching.test.ts`)

| ID | Título | Entrada | Resultado esperado | Automatizado |
|---|---|---|---|---|
| TC-API-01 | Normalización | `"  Carne   Picada  "` | Se procesa como `"carne picada"` | ✅ |
| TC-API-02 | Sinónimos multi-idioma | `Patata`, `POTATO`, `Kartoffel` | Todos resuelven a `papa` | ✅ |
| TC-API-03 | Plurales | `papas`, `cebollas` | Resuelven al singular | ✅ |
| TC-API-04 | Ingrediente desconocido | `unicornio` | No resuelve (null), no rompe | ✅ |
| TC-API-05 | Filtro vegetariano jerárquico | receta vegana + filtro `vegetariano` | La receta vegana SÍ aparece | ✅ |
| TC-API-06 | Filtro vegano estricto | receta vegetariana + filtro `vegano` | La receta NO aparece | ✅ |
| TC-API-07 | Ranking por score | `papa, sal` | Puré (2/2) antes que Tortilla (2/4) antes que Milanesas (1/3) | ✅ |
| TC-API-08 | Sin match no aparece | `carne picada` | Solo recetas que la contienen | ✅ |
| TC-API-09 | Matching + dieta combinados | `papa, huevo, sal` + `vegetariano` | Sin Milanesas | ✅ |
| TC-API-10 | Reporte de desconocidos | `papa, unicornio, dragón` | `unknownIngredients: [unicornio, dragón]` | ✅ |
| TC-API-11 | Duplicados no inflan score | `papa, papas, Potato` | Cuentan como un solo ingrediente | ✅ |

## Endpoints HTTP (integración en `tests/api.test.ts`)

| ID | Título | Request | Resultado esperado | Automatizado |
|---|---|---|---|---|
| TC-API-20 | Health check | `GET /health` | 200 `{status: ok}` | ✅ |
| TC-API-21 | Listar recetas | `GET /api/recipes` | 200 con las recetas del seed | ✅ |
| TC-API-22 | Filtro por query | `GET /api/recipes?diet=vegetariano` | Vegetarianas + veganas, nunca con carne | ✅ |
| TC-API-23 | Dieta inválida | `GET /api/recipes?diet=paleo` | 400 con mensaje claro | ✅ |
| TC-API-24 | Caso feliz multi-idioma | `POST /api/suggestions` con `sal, pepper, onion, papas, huevos` | Tortilla de papas primera, score 0.8, faltante: aceite | ✅ |
| TC-API-25 | Sugerencias veganas | ingredientes + `diet: vegano` | Sin tortilla (lleva huevo), con wok | ✅ |
| TC-API-26 | Validaciones de entrada | sin body / array vacío / >30 ítems / tipos no string / dieta inválida | 400 en todos, con mensaje en español | ✅ |
| TC-API-27 | Desconocidos informados | `papa, criptonita` | 200 + `unknownIngredients` | ✅ |
| TC-API-28 | Solo desconocidos | `criptonita` | 200 con `suggestions: []` (no es error) | ✅ |

## Casos manuales pendientes (exploración con Postman/curl)

| ID | Título | Qué probar | Estado |
|---|---|---|---|
| TC-API-30 | Payload gigante | Body de varios MB en `ingredients` | Pendiente |
| TC-API-31 | JSON malformado | `POST` con body `{esto no es json` | Pendiente |
| TC-API-32 | Content-Type incorrecto | Mandar el body como `text/plain` | Pendiente |
| TC-API-33 | Caracteres especiales | Ingredientes con emojis, tildes, `<script>` | Pendiente |
| TC-API-34 | Concurrencia básica | 50 requests simultáneas (ej. con `autocannon`) | Pendiente |
