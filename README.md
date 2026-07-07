# Nicy Kitchen 🍳

App de recetas y cocina construida con [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/) + expo-router + TypeScript. Proyecto de práctica dev + QA.

## Roadmap

- [x] **M1 — Núcleo:** CRUD de recetas propias + lista de compras (persistencia local)
- [x] **M2a — Backend:** API de sugerencias por ingredientes con filtro de dieta (repo [nicy-kitchen-api](../nicy-kitchen-api))
- [x] **M2b — UI:** tema "de la nona", animaciones, mascota 🐑 y tab "What to cook?" conectada al backend
- [x] **M2c — Home:** carruseles de noticias de comida/salud (NewsData.io vía backend)
- [x] **M2d — Login (actual):** Google Sign-In (liviano) gatea crear recetas y favoritos
- [ ] **M2e — Backend:** cuentas reales en el servidor (recetas/favoritos por usuario), deploy en Railway (SQLite → Postgres)
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

La tab "¿Qué cocino?" le pega al backend: en web/iOS usa `localhost:3000`, en el emulador Android `10.0.2.2:3000`. Para un teléfono físico o producción, seteá `EXPO_PUBLIC_API_URL` (p. ej. `EXPO_PUBLIC_API_URL=http://192.168.0.10:3000 npm start`).

**Tema y mascota:** paleta inspirada en [losalfajoresdelanona.com](https://losalfajoresdelanona.com) en [constants/theme.ts](constants/theme.ts); la mascota vive en [components/mascot.tsx](components/mascot.tsx) y reacciona a los eventos que emiten las pantallas vía [lib/mascot.ts](lib/mascot.ts).

## Login con Google

Alcance actual ("login liviano"): Google Sign-In autentica al usuario (Authorization Code + PKCE, sin backend ni client secret). Habilita crear recetas propias y guardar favoritos, pero esos datos siguen viviendo en el dispositivo (AsyncStorage) — no se particionan por cuenta todavía. Ver [contexts/auth-context.tsx](contexts/auth-context.tsx).

Para activarlo:

1. Ir a [Google Cloud Console](https://console.cloud.google.com/) → *APIs & Services* → *Credentials* → *Create Credentials* → *OAuth client ID* → tipo **Web application**.
2. En *Authorized JavaScript origins* agregar `http://localhost:8081` (el puerto de `npm run web`).
3. En *Authorized redirect URIs* agregar el mismo origen. La pantalla de cuenta (`Account`, ícono 🔑 en Home) muestra en modo dev el redirect URI exacto que Expo generó, por si difiere.
4. Copiar el Client ID a `.env.local`:
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu-client-id.apps.googleusercontent.com
   ```
5. Reiniciar `npm run web`.

**Limitación conocida:** dentro de Expo Go en un teléfono real, Google rechaza el redirect dinámico `exp://...` que genera AuthSession (el proxy de Expo para esto ya no existe). Andá con `npm run web` mientras tanto; para Android/iOS nativo hace falta un dev client + Client IDs de tipo Android/iOS (SHA-1 y bundle id), que quedó fuera de este alcance.

**Favoritos:** botón de corazón en las recetas del catálogo (`app/catalog/[id].tsx`) y de Spoonacular (`app/external/[id].tsx`); se ven en la tab Favorites. Datos en [lib/favorites.ts](lib/favorites.ts).

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
