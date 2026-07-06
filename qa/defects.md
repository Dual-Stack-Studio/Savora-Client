# Registro de defectos — Nicy Kitchen

Formato: un bloque por defecto. Severidades: Crítica / Alta / Media / Baja.

---

<!-- Plantilla:

## DEF-001 — [título corto del bug]

- **Fecha:** AAAA-MM-DD
- **Módulo:** Recetas | Lista de compras
- **Severidad:** Media
- **Encontrado en:** TC-REC-xx (o exploratorio)
- **Entorno:** web / Android / iOS + versión

**Pasos para reproducir:**
1. …
2. …

**Resultado esperado:** …
**Resultado actual:** …
**Evidencia:** captura / video

**Estado:** Abierto | En curso | Resuelto | Verificado
-->

## DEF-001 — La API crashea al arrancar si no existe la carpeta `data/`

- **Fecha:** 2026-07-06
- **Módulo:** Backend (api)
- **Severidad:** Alta (la API no arranca en una instalación limpia)
- **Encontrado en:** smoke test manual (no lo detectaron los tests automatizados porque usan base `:memory:`)
- **Entorno:** Windows 11, Node 24, primera ejecución tras clonar

**Pasos para reproducir:**
1. Clonar el repo (sin carpeta `api/data/`, está en .gitignore)
2. `cd api && npm install && npm run dev`

**Resultado esperado:** la API arranca y crea la base de datos.
**Resultado actual:** crash con `TypeError: Cannot open database because the directory does not exist` (better-sqlite3 no crea directorios).

**Lección:** los tests unitarios/integración usaban `:memory:` y nunca ejercitaron el camino real de arranque — cobertura verde no garantiza que la app arranque.

**Estado:** Resuelto (`createDb` ahora crea el directorio con `fs.mkdirSync recursive`). Verificado con smoke test.
