# Plan de pruebas — Nicy Kitchen

**Versión:** 0.1 · **Fecha:** 2026-07-06 · **Autor:** Sebi (QA)

## 1. Alcance

### En alcance
- **M1:** CRUD de recetas propias, lista de compras, persistencia local (AsyncStorage)
- **M2a:** API de sugerencias por ingredientes (`api/`): matching con sinónimos multi-idioma, ranking por score, filtro de dieta jerárquico (vegano ⊂ vegetariano)

### Fuera de alcance (milestones futuros)
- Auth y recetas del usuario en el servidor, deploy (M2b)
- OCR de PDF/fotos, subida de video/imagen
- Social: amigos, compartir recetas, partner de lista de compras
- Productos regionales, notificaciones de stock, multi-idioma de UI

## 2. Estrategia de pruebas

| Nivel | Herramienta | Qué cubre | Dónde |
|---|---|---|---|
| Unitario | Jest (`jest-expo`) | Reglas de validación y capa de datos | `lib/__tests__/` |
| Manual | Casos de prueba documentados | Flujos de UI, usabilidad, casos borde visuales | `qa/test-cases/` |
| Backend | Jest + Supertest + smoke tests | Matching, endpoints, validaciones | repo `nicy-kitchen-api` (`tests/` y `qa/`) |
| Componente (próximo) | React Native Testing Library | Formularios y pantallas | pendiente |
| E2E (próximo) | Maestro | Flujos completos en dispositivo/emulador | pendiente |

**Trazabilidad:** cada test automatizado referencia el ID del caso manual (ej. `// TC-REC-05`).

## 3. Reglas de negocio a verificar

Documentadas en el código ([lib/recipes.ts](../lib/recipes.ts) y [lib/shopping.ts](../lib/shopping.ts)):

**Recetas**
- Título: obligatorio, 3–80 caracteres (se ignoran espacios al borde)
- Ingredientes: mínimo 1 con nombre no vacío
- Porciones: entero entre 1 y 50
- Instrucciones: mínimo 10 caracteres

**Lista de compras**
- Ítem: obligatorio, máximo 60 caracteres
- Sin duplicados (case-insensitive) entre ítems *pendientes*; un ítem ya comprado sí se puede volver a agregar

## 4. Riesgos identificados

| # | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| R1 | Datos corruptos en AsyncStorage crashean la app | Alto | La capa de datos devuelve lista vacía ante JSON inválido (cubierto por TC-REC-17) |
| R2 | Pérdida de datos al migrar a backend | Alto | Toda la persistencia está aislada en `lib/`; planificar migración con export |
| R3 | Editar/borrar una receta abierta en otra pantalla | Medio | Las pantallas recargan con `useFocusEffect`; detalle muestra "ya no existe" |
| R4 | Validación solo en frontend | Medio | Cuando exista backend, duplicar validación del lado servidor |

## 5. Criterios de entrada / salida

**Entrada a testing:** la app compila y arranca (`npm run web` / `npm run android`), tests unitarios en verde.

**Salida (milestone 1 aprobado):**
- 100% de casos manuales de `qa/test-cases/` ejecutados
- 0 defectos críticos o altos abiertos
- Tests unitarios en verde (`npm test`)

## 6. Registro de defectos

Los bugs encontrados se registran en `qa/defects.md` con: ID, severidad, pasos para reproducir, resultado esperado vs. actual, evidencia.
