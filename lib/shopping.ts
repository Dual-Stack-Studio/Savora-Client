import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Lista de compras — milestone 1 (local-first).
 * Reglas de negocio:
 *  - nombre del ítem: requerido, 1 a 60 caracteres (sin espacios al borde)
 *  - no se permiten duplicados exactos (ignorando mayúsculas) entre ítems pendientes
 */

export type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
  createdAt: string;
};

export const ITEM_MAX = 60;

const STORAGE_KEY = 'nicy-kitchen/shopping';

export function validateItemName(name: string, existing: ShoppingItem[]): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'El ítem no puede estar vacío.';
  if (trimmed.length > ITEM_MAX) return `El ítem no puede superar los ${ITEM_MAX} caracteres.`;
  const duplicate = existing.some(
    (i) => !i.checked && i.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) return 'Ese ítem ya está en la lista.';
  return null;
}

export async function listItems(): Promise<ShoppingItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addItem(name: string): Promise<ShoppingItem> {
  const items = await listItems();
  const error = validateItemName(name, items);
  if (error) throw new Error(error);

  const item: ShoppingItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    checked: false,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...items]));
  return item;
}

export async function toggleItem(id: string): Promise<void> {
  const items = await listItems();
  const next = items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function removeItem(id: string): Promise<void> {
  const items = await listItems();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items.filter((i) => i.id !== id)));
}

export async function clearChecked(): Promise<void> {
  const items = await listItems();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items.filter((i) => !i.checked)));
}
