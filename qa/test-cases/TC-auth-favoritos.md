# Casos de prueba — Login con Google y favoritos

**Módulo:** Frontend (Account/login + Favorites) · **Alcance:** login liviano (ver README) — gatea acciones, no particiona datos por cuenta.

**Precondición:** `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` configurado en `.env.local`, corriendo con `npm run web`.

## Login

| ID | Título | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-AUTH-01 | Sign in feliz | Tocar el ícono 🔑 en Home → «Sign in with Google» → completar el consentimiento | Vuelve logueado: avatar/nombre visibles en el modal y en Home; mascota reacciona ("Welcome, chef!") | Pendiente |
| TC-AUTH-02 | Persistencia de sesión | Loguearse, cerrar la app del todo, reabrir | Sigue logueado (perfil cargado desde AsyncStorage) | Pendiente |
| TC-AUTH-03 | Sign out | Estando logueado, tocar «Sign out» | Vuelve al estado "sign in"; mascota reacciona ("See you soon!") | Pendiente |
| TC-AUTH-04 | Cancelar el consentimiento | Iniciar sign-in y cerrar la ventana de Google sin elegir cuenta | No crasha; vuelve al botón de sign-in sin mensaje de error confuso | Pendiente |
| TC-AUTH-05 | Sin Client ID configurado | Vaciar `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` y reiniciar | Aviso «Google sign-in isn't configured yet…»; botón deshabilitado | Pendiente |
| TC-AUTH-06 | Expo Go en teléfono real | Abrir la app vía Expo Go en un dispositivo (no web) | Aviso «doesn't work inside Expo Go…»; botón deshabilitado, sin crash | Pendiente |
| TC-AUTH-07 | Redirect URI visible en dev | Abrir la pantalla de cuenta sin loguearse | Se ve el texto con el redirect URI (solo en `__DEV__`) para copiar a Google Cloud Console | Pendiente |

## Gate de funciones (crear recetas / favoritos)

| ID | Título | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-AUTH-08 | Crear receta sin login | Sin loguearse, tocar «+ New» en «My recipes» | Abre la pantalla de cuenta en vez del formulario | Pendiente |
| TC-AUTH-09 | Crear receta logueado | Logueado, tocar «+ New» | Abre el formulario normalmente (sin cambios respecto a antes del login) | Pendiente |
| TC-AUTH-10 | Favoritear sin login | Sin loguearse, tocar el corazón en una receta del catálogo o de Spoonacular | Abre la pantalla de cuenta; el corazón no cambia de estado | Pendiente |
| TC-AUTH-11 | Editar/eliminar receta propia sin login | Crear una receta logueado, cerrar sesión, volver a esa receta | Editar y eliminar siguen funcionando (solo se gatea la creación, no la edición) | Pendiente |

## Favoritos

| ID | Título | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-FAV-10 | Favoritear una receta del catálogo | Logueado, abrir una receta de «From your kitchen» → tocar el corazón | Corazón pasa a ❤️; mascota reacciona; aparece en la tab Favorites | Pendiente |
| TC-FAV-11 | Favoritear una receta de Spoonacular | Logueado, abrir una de «Ideas from the internet» → tocar el corazón | Igual que arriba, con imagen en la card de Favorites | Pendiente |
| TC-FAV-12 | Quitar de favoritos | Tocar el corazón de una receta ya favorita | Vuelve a 🤍; desaparece de la tab Favorites | Pendiente |
| TC-FAV-13 | Favoritos vacíos, logueado | Sin favoritos guardados | Mensaje «No favorites yet…» | Pendiente |
| TC-FAV-14 | Tab Favorites sin login | Sin loguearse, abrir la tab Favorites | CTA «Sign in to see favorites» con botón que abre el login | Pendiente |
| TC-FAV-15 | Abrir un favorito | Tocar una card en Favorites | Navega al detalle correcto (`catalog/[id]` o `external/[id]` según el origen) | Pendiente |
| TC-FAV-16 | Persistencia | Favoritear, cerrar la app, reabrir | El favorito sigue en la lista (AsyncStorage) | Pendiente |
