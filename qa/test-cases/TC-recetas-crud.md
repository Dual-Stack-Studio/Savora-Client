# Casos de prueba — CRUD de recetas

**Módulo:** Recetas · **Precondición general:** app instalada y abierta en la tab "Recetas".

**Automatizado** = cubierto por test unitario en `lib/__tests__/recipes.test.ts` (mismo ID en comentario).

## Validación del formulario

| ID | Título | Pasos | Resultado esperado | Automatizado | Estado |
|---|---|---|---|---|---|
| TC-REC-01 | Crear receta válida | 1. Tocar «+ Nueva» 2. Completar todos los campos con datos válidos 3. Tocar «Crear receta» | Vuelve a la lista y la receta aparece primera | ✅ | Pendiente |
| TC-REC-02 | Título vacío | Dejar título vacío y enviar | Error «El título es obligatorio.» bajo el campo; no se crea | ✅ | Pendiente |
| TC-REC-03 | Título solo espacios | Título = `"    "` y enviar | Mismo error que TC-REC-02 | ✅ | Pendiente |
| TC-REC-04 | Título en límite inferior | Probar con 2 y con 3 caracteres | 2 → error de mínimo; 3 → pasa | ✅ | Pendiente |
| TC-REC-05 | Título en límite superior | Probar con 80 y 81 caracteres | 80 → pasa; 81 → error de máximo | ✅ | Pendiente |
| TC-REC-06 | Sin ingredientes | Enviar sin completar ningún ingrediente | Error «Agregá al menos un ingrediente.» | ✅ | Pendiente |
| TC-REC-07 | Ingredientes solo con espacios | Ingrediente = `"   "` y enviar | Mismo error que TC-REC-06 | ✅ | Pendiente |
| TC-REC-08 | Porciones fuera de rango | Probar 0, 51 y valores no enteros | Error de porciones; 1 y 50 pasan (bordes) | ✅ | Pendiente |
| TC-REC-09 | Instrucciones muy cortas | Instrucciones = `"mezclar"` | Error de mínimo 10 caracteres | ✅ | Pendiente |

## Operaciones CRUD

| ID | Título | Pasos | Resultado esperado | Automatizado | Estado |
|---|---|---|---|---|---|
| TC-REC-10 | Receta creada aparece en lista | Crear receta válida y volver a la lista | Card visible con título, n° de ingredientes y porciones | ✅ | Pendiente |
| TC-REC-11 | Envío inválido no persiste | Enviar formulario inválido, volver a la lista | La lista no cambió | ✅ | Pendiente |
| TC-REC-12 | Normalización de espacios | Crear con título `"  Milanesas  "` e ingrediente `"  Carne  "` | Se guarda sin espacios al borde; ingredientes vacíos se descartan | ✅ | Pendiente |
| TC-REC-13 | Editar receta | Abrir detalle → «Editar» → cambiar título → guardar | Detalle y lista muestran el nuevo título | ✅ | Pendiente |
| TC-REC-14 | Editar receta inexistente | (borde técnico) Navegar a `/recipe/edit/xxx` con id falso | Pantalla «Esta receta ya no existe», sin crash | ✅ | Pendiente |
| TC-REC-15 | Eliminar receta | Detalle → «Eliminar» → confirmar | Vuelve a la lista y la receta ya no está | ✅ | Pendiente |
| TC-REC-16 | Cancelar eliminación | Detalle → «Eliminar» → cancelar | La receta sigue existiendo | Parcial (idempotencia ✅) | Pendiente |
| TC-REC-17 | Storage corrupto | (técnico) Datos inválidos en AsyncStorage | Lista vacía, sin crash | ✅ | Pendiente |
| TC-REC-18 | Orden de la lista | Crear receta A y luego B | B aparece antes que A | ✅ | Pendiente |

## Casos solo manuales (UI/UX)

| ID | Título | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-REC-19 | Estado vacío inicial | Abrir app recién instalada | Mensaje «Todavía no tenés recetas…» con guía al botón | Pendiente |
| TC-REC-20 | Teclado no tapa el formulario | En un teléfono, editar instrucciones | Se puede seguir escribiendo y ver el botón de guardar | Pendiente |
| TC-REC-21 | Doble tap en guardar | Tocar «Crear receta» dos veces rápido | Se crea UNA sola receta (botón se deshabilita en «Guardando…») | Pendiente |
| TC-REC-22 | Título largo en la card | Crear receta con título de 80 caracteres | La card no rompe el layout | Pendiente |
| TC-REC-23 | Modo oscuro | Cambiar el tema del sistema a oscuro | Textos legibles en todas las pantallas del módulo | Pendiente |
| TC-REC-24 | Persistencia tras reinicio | Crear receta, cerrar la app del todo, reabrir | La receta sigue en la lista | Pendiente |
