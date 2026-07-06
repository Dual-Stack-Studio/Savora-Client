import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  addItem,
  clearChecked,
  ITEM_MAX,
  listItems,
  removeItem,
  toggleItem,
  validateItemName,
} from '../shopping';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('validateItemName', () => {
  // TC-SHOP-01
  it('acepta un nombre válido', () => {
    expect(validateItemName('Papas', [])).toBeNull();
  });

  // TC-SHOP-02
  it('rechaza nombre vacío o solo espacios', () => {
    expect(validateItemName('', [])).not.toBeNull();
    expect(validateItemName('   ', [])).not.toBeNull();
  });

  // TC-SHOP-03: límite de longitud
  it(`acepta ${ITEM_MAX} caracteres y rechaza ${ITEM_MAX + 1}`, () => {
    expect(validateItemName('a'.repeat(ITEM_MAX), [])).toBeNull();
    expect(validateItemName('a'.repeat(ITEM_MAX + 1), [])).not.toBeNull();
  });

  // TC-SHOP-04: duplicados ignorando mayúsculas
  it('rechaza duplicado pendiente aunque cambie mayúsculas', async () => {
    await addItem('Papas');
    const items = await listItems();
    expect(validateItemName('papas', items)).toBe('Ese ítem ya está en la lista.');
  });

  // TC-SHOP-05: se permite repetir un ítem ya comprado
  it('permite volver a agregar un ítem que ya fue tildado como comprado', async () => {
    const item = await addItem('Leche');
    await toggleItem(item.id);
    const items = await listItems();
    expect(validateItemName('Leche', items)).toBeNull();
  });
});

describe('operaciones de la lista', () => {
  // TC-SHOP-06
  it('agrega, tilda y elimina ítems', async () => {
    const item = await addItem('Huevos');
    expect((await listItems())[0].checked).toBe(false);

    await toggleItem(item.id);
    expect((await listItems())[0].checked).toBe(true);

    await removeItem(item.id);
    expect(await listItems()).toHaveLength(0);
  });

  // TC-SHOP-07
  it('clearChecked elimina solo los comprados', async () => {
    const leche = await addItem('Leche');
    await addItem('Pan');
    await toggleItem(leche.id);

    await clearChecked();
    const items = await listItems();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Pan');
  });

  // TC-SHOP-08: addItem inválido lanza y no persiste
  it('addItem con nombre vacío lanza error y no guarda nada', async () => {
    await expect(addItem('  ')).rejects.toThrow('El ítem no puede estar vacío.');
    expect(await listItems()).toHaveLength(0);
  });
});
