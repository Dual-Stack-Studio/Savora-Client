# Nicy Kitchen 🍳

App de recetas y cocina construida con [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/) + expo-router + TypeScript. Proyecto de práctica dev + QA.

## Roadmap

- [x] **M1 — Núcleo:** CRUD de recetas propias + lista de compras (persistencia local)
- [x] **M2a — Backend (actual):** API de sugerencias por ingredientes con filtro de dieta (repo [nicy-kitchen-api](../nicy-kitchen-api))
- [ ] **M2b — Backend:** auth, recetas del usuario en el servidor, deploy en Railway (SQLite → Postgres)
- [ ] **M3 — Social:** amigos, compartir/editar recetas, partner de lista de compras
- [ ] **M4 — Media & IA:** OCR de PDF/fotos, subida de fotos/videos, sugerencias por ingredientes
- [ ] **M5 — Extras:** productos regionales, recordatorio de stock, multi-idioma

## Correr el proyecto

```bash
npm install
npm run web       # navegador
npm run android   # emulador/dispositivo Android
```

**Backend** (repo separado): la API de sugerencias vive en `../nicy-kitchen-api`:

```bash
cd ../nicy-kitchen-api
npm install
npm run dev       # http://localhost:3000
```

## Testing

```bash
npm test          # Jest + jest-expo
npm run test:watch
```

- **Plan de pruebas:** [qa/test-plan.md](qa/test-plan.md)
- **Casos de prueba manuales:** [qa/test-cases/](qa/test-cases/)
- **Registro de defectos:** [qa/defects.md](qa/defects.md)

## Estructura

```
app/              pantallas (expo-router, file-based routing)
  (tabs)/         tabs: Recetas y Compras
  recipe/         detalle, alta y edición de recetas
components/       componentes compartidos (RecipeForm, etc.)
lib/              capa de datos + reglas de negocio (testeable)
  __tests__/      tests unitarios
qa/               plan de pruebas, casos de prueba, defectos de la app
```

El backend (Express + TypeScript + SQLite) es un repo hermano: `../nicy-kitchen-api`.

La persistencia vive aislada en `lib/` (AsyncStorage por ahora) para poder cambiarla por un backend en M2 sin tocar pantallas ni validaciones.
