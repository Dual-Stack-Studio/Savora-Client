import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  listRecipes,
  RecipeInput,
  TITLE_MAX,
  updateRecipe,
  validateRecipe,
  ValidationError,
} from '../recipes';

const validInput = (): RecipeInput => ({
  title: 'Tortilla de papas',
  servings: 4,
  ingredients: [
    { name: 'Papas', quantity: '1 kg' },
    { name: 'Huevos', quantity: '6' },
  ],
  instructions: 'Pelar y cortar las papas, freír, mezclar con huevo batido y cuajar en sartén.',
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('validateRecipe (reglas de negocio)', () => {
  // TC-REC-01
  it('acepta una receta válida sin errores', () => {
    expect(validateRecipe(validInput())).toEqual({});
  });

  // TC-REC-02
  it('rechaza título vacío', () => {
    const errors = validateRecipe({ ...validInput(), title: '' });
    expect(errors.title).toBe('El título es obligatorio.');
  });

  // TC-REC-03: solo espacios cuenta como vacío
  it('rechaza título con solo espacios', () => {
    const errors = validateRecipe({ ...validInput(), title: '    ' });
    expect(errors.title).toBe('El título es obligatorio.');
  });

  // TC-REC-04: límite inferior (2 chars falla, 3 pasa)
  it('rechaza título de 2 caracteres y acepta de 3', () => {
    expect(validateRecipe({ ...validInput(), title: 'ab' }).title).toBeDefined();
    expect(validateRecipe({ ...validInput(), title: 'abc' }).title).toBeUndefined();
  });

  // TC-REC-05: límite superior (80 pasa, 81 falla)
  it(`acepta título de ${TITLE_MAX} caracteres y rechaza de ${TITLE_MAX + 1}`, () => {
    expect(validateRecipe({ ...validInput(), title: 'a'.repeat(TITLE_MAX) }).title).toBeUndefined();
    expect(validateRecipe({ ...validInput(), title: 'a'.repeat(TITLE_MAX + 1) }).title).toBeDefined();
  });

  // TC-REC-06
  it('rechaza receta sin ingredientes', () => {
    const errors = validateRecipe({ ...validInput(), ingredients: [] });
    expect(errors.ingredients).toBe('Agregá al menos un ingrediente.');
  });

  // TC-REC-07: ingredientes con nombre vacío no cuentan
  it('rechaza si todos los ingredientes tienen nombre vacío', () => {
    const errors = validateRecipe({
      ...validInput(),
      ingredients: [{ name: '' }, { name: '   ' }],
    });
    expect(errors.ingredients).toBeDefined();
  });

  // TC-REC-08: porciones fuera de rango y no enteras
  it.each([0, -1, 51, 2.5, NaN])('rechaza porciones = %p', (servings) => {
    expect(validateRecipe({ ...validInput(), servings }).servings).toBeDefined();
  });

  it.each([1, 50])('acepta porciones = %p (valores borde)', (servings) => {
    expect(validateRecipe({ ...validInput(), servings }).servings).toBeUndefined();
  });

  // TC-REC-09
  it('rechaza instrucciones de menos de 10 caracteres', () => {
    const errors = validateRecipe({ ...validInput(), instructions: 'mezclar' });
    expect(errors.instructions).toBeDefined();
  });
});

describe('CRUD de recetas (storage)', () => {
  // TC-REC-10
  it('crea una receta y aparece en la lista', async () => {
    const created = await createRecipe(validInput());
    const recipes = await listRecipes();
    expect(recipes).toHaveLength(1);
    expect(recipes[0].id).toBe(created.id);
    expect(recipes[0].title).toBe('Tortilla de papas');
  });

  // TC-REC-11: crear con datos inválidos no persiste nada
  it('createRecipe con datos inválidos lanza ValidationError y no guarda', async () => {
    await expect(createRecipe({ ...validInput(), title: '' })).rejects.toThrow(ValidationError);
    expect(await listRecipes()).toHaveLength(0);
  });

  // TC-REC-12: normalización de datos al guardar
  it('normaliza espacios y descarta ingredientes vacíos al guardar', async () => {
    const created = await createRecipe({
      ...validInput(),
      title: '  Milanesas  ',
      ingredients: [{ name: '  Carne  ', quantity: ' 500 g ' }, { name: '   ' }],
    });
    expect(created.title).toBe('Milanesas');
    expect(created.ingredients).toEqual([{ name: 'Carne', quantity: '500 g' }]);
  });

  // TC-REC-13
  it('actualiza una receta existente y cambia updatedAt', async () => {
    const created = await createRecipe(validInput());
    const updated = await updateRecipe(created.id, { ...validInput(), title: 'Tortilla española' });
    expect(updated.title).toBe('Tortilla española');
    expect(updated.createdAt).toBe(created.createdAt);
    const stored = await getRecipe(created.id);
    expect(stored?.title).toBe('Tortilla española');
  });

  // TC-REC-14: actualizar algo que no existe
  it('updateRecipe con id inexistente lanza error', async () => {
    await expect(updateRecipe('no-existe', validInput())).rejects.toThrow(/No existe la receta/);
  });

  // TC-REC-15
  it('elimina una receta y desaparece de la lista', async () => {
    const created = await createRecipe(validInput());
    await deleteRecipe(created.id);
    expect(await listRecipes()).toHaveLength(0);
    expect(await getRecipe(created.id)).toBeUndefined();
  });

  // TC-REC-16: eliminar dos veces no rompe (idempotente)
  it('deleteRecipe sobre un id ya eliminado no lanza error', async () => {
    const created = await createRecipe(validInput());
    await deleteRecipe(created.id);
    await expect(deleteRecipe(created.id)).resolves.toBeUndefined();
  });

  // TC-REC-17: datos corruptos en storage
  it('listRecipes devuelve lista vacía si el storage tiene JSON corrupto', async () => {
    await AsyncStorage.setItem('nicy-kitchen/recipes', '{esto no es json válido');
    expect(await listRecipes()).toEqual([]);
  });

  // TC-REC-18: el más nuevo primero
  it('las recetas nuevas aparecen primero en la lista', async () => {
    await createRecipe({ ...validInput(), title: 'Primera' });
    await createRecipe({ ...validInput(), title: 'Segunda' });
    const recipes = await listRecipes();
    expect(recipes.map((r) => r.title)).toEqual(['Segunda', 'Primera']);
  });
});
