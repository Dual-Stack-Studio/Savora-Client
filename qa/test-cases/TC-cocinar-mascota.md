# Casos de prueba — Pantalla "¿Qué cocino?" y mascota Ñoqui

**Módulo:** Frontend (tab "¿Qué cocino?" + mascota flotante) · **Precondición:** backend corriendo (`npm run dev` en `nicy-kitchen-api`), app en `npm run web`.

## ¿Qué cocino? (integración con backend real)

| ID | Título | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-COOK-01 | Búsqueda feliz | Agregar `egg`, `potato`, `onion` → Buscar | Cards locales con % de match y barra; sección "Ideas de internet" con imágenes (si hay key) | Pendiente |
| TC-COOK-02 | Chips rápidos | Tocar `+ egg` en las sugerencias rápidas | Se agrega como chip rosa y desaparece de las rápidas | Pendiente |
| TC-COOK-03 | Quitar ingrediente | Tocar un chip agregado (`egg ✕`) | El chip desaparece | Pendiente |
| TC-COOK-04 | Duplicados | Agregar `egg` dos veces | Aparece una sola vez | Pendiente |
| TC-COOK-05 | Filtro vegano | Agregar `onion`, `carrot` + dieta 🌱 Vegana → Buscar | Solo recetas veganas (¡sin salchichas! ver DEF-002 del backend) | Pendiente |
| TC-COOK-06 | Ingrediente desconocido | Agregar `papa` (español) → Buscar | Aviso "🤷 Estos no los conozco: papa" | Pendiente |
| TC-COOK-07 | Backend caído | Apagar el backend → Buscar | Mensaje de error amable con hint de levantar el backend; sin crash | Pendiente |
| TC-COOK-08 | Botón deshabilitado | Sin ingredientes agregados | "Buscar recetas" está deshabilitado (opaco, no clickeable) | Pendiente |
| TC-COOK-09 | Sin resultados | Buscar solo `kryptonite` | Mensaje "🥺 No encontré nada…" (no error) | Pendiente |
| TC-COOK-10 | Doble tap en buscar | Tocar Buscar dos veces rápido | Una sola búsqueda (spinner bloquea) | Pendiente |

## Mascota Ñoqui 🍪

| ID | Título | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-MASC-01 | Siempre presente | Navegar por las 3 tabs y el detalle de receta | Ñoqui flota abajo a la derecha en todas las pantallas | Pendiente |
| TC-MASC-02 | Idle vivo | No tocar nada 10 segundos | Respira (sube/baja) y parpadea cada ~4 s | Pendiente |
| TC-MASC-03 | Reacción a crear receta | Crear una receta válida | Salta + globo tipo "¡Ñami! Receta nueva" | Pendiente |
| TC-MASC-04 | Reacción a compras | Agregar y tildar ítems de la lista | Globos "¡A la lista!" / "¡Conseguido!" | Pendiente |
| TC-MASC-05 | Reacción a búsqueda | Buscar recetas | "Mmm… pensando…" durante la búsqueda y festejo con resultados | Pendiente |
| TC-MASC-06 | Poke | Tocar a Ñoqui | Se sacude y saluda ("¡Hola! Soy Ñoqui") | Pendiente |
| TC-MASC-07 | Error | Buscar con el backend apagado | Cara 😵 "¡Ups! Algo salió mal" | Pendiente |
| TC-MASC-08 | No bloquea | Intentar tocar un botón que quede cerca de Ñoqui | Los botones de la app siguen siendo tocables (pointerEvents) | Pendiente |
