import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  addItem,
  clearChecked,
  listItems,
  removeItem,
  ShoppingItem,
  toggleItem,
} from '@/lib/shopping';

export default function ShoppingScreen() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#ccc', dark: '#555' }, 'icon');

  const refresh = useCallback(() => {
    listItems().then(setItems);
  }, []);

  useFocusEffect(refresh);

  const handleAdd = async () => {
    try {
      await addItem(newItem);
      setNewItem('');
      setError(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agregar el ítem.');
    }
  };

  const handleToggle = async (id: string) => {
    await toggleItem(id);
    refresh();
  };

  const handleRemove = async (id: string) => {
    await removeItem(id);
    refresh();
  };

  const handleClearChecked = async () => {
    await clearChecked();
    refresh();
  };

  const hasChecked = items.some((i) => i.checked);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Lista de compras
      </ThemedText>

      <ThemedView style={styles.inputRow}>
        <TextInput
          style={[styles.input, { color: textColor, borderColor }]}
          value={newItem}
          onChangeText={setNewItem}
          placeholder="Ej: Papas"
          placeholderTextColor="#999"
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          testID="shopping-input"
        />
        <Pressable style={styles.addButton} onPress={handleAdd} testID="shopping-add">
          <ThemedText style={styles.addButtonText}>Agregar</ThemedText>
        </Pressable>
      </ThemedView>
      {error && (
        <ThemedText style={styles.error} testID="shopping-error">
          {error}
        </ThemedText>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText} testID="shopping-empty">
            La lista está vacía.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <ThemedView style={styles.itemRow}>
            <Pressable
              style={styles.itemToggle}
              onPress={() => handleToggle(item.id)}
              testID={`shopping-toggle-${item.id}`}>
              <ThemedText style={item.checked ? styles.itemChecked : undefined}>
                {item.checked ? '☑' : '☐'} {item.name}
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => handleRemove(item.id)} testID={`shopping-remove-${item.id}`}>
              <ThemedText style={styles.remove}>✕</ThemedText>
            </Pressable>
          </ThemedView>
        )}
      />

      {hasChecked && (
        <Pressable style={styles.clearButton} onPress={handleClearChecked} testID="shopping-clear">
          <ThemedText type="link">Quitar comprados</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
    paddingHorizontal: 16,
  },
  title: {
    paddingBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#d32f2f',
    fontSize: 14,
    paddingTop: 6,
  },
  list: {
    paddingVertical: 12,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  itemToggle: {
    flex: 1,
  },
  itemChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  remove: {
    color: '#d32f2f',
    paddingHorizontal: 8,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    paddingTop: 24,
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
