import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { emitMascot } from '@/lib/mascot';
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
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted');

  const refresh = useCallback(() => {
    listItems().then(setItems);
  }, []);

  useFocusEffect(refresh);

  const handleAdd = async () => {
    try {
      await addItem(newItem);
      setNewItem('');
      setError(null);
      emitMascot('item-added');
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agregar el ítem.');
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    await toggleItem(item.id);
    if (!item.checked) emitMascot('item-checked');
    refresh();
  };

  const handleRemove = async (id: string) => {
    await removeItem(id);
    refresh();
  };

  const handleClearChecked = async () => {
    await clearChecked();
    emitMascot('list-cleared');
    refresh();
  };

  const hasChecked = items.some((i) => i.checked);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Lista de compras 🛒
      </ThemedText>

      <ThemedView style={styles.inputRow}>
        <TextInput
          style={[styles.input, { color: textColor, borderColor, backgroundColor: cardColor }]}
          value={newItem}
          onChangeText={setNewItem}
          placeholder="Ej: Kartoffeln"
          placeholderTextColor={mutedColor}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          testID="shopping-input"
        />
        <BouncyPressable style={styles.addButton} onPress={handleAdd} testID="shopping-add">
          <ThemedText style={styles.addButtonText}>Agregar</ThemedText>
        </BouncyPressable>
      </ThemedView>
      {error && (
        <Animated.View entering={FadeInUp}>
          <ThemedText style={styles.error} testID="shopping-error">
            {error}
          </ThemedText>
        </Animated.View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <ThemedView style={styles.emptyBox}>
            <ThemedText style={styles.emptyEmoji}>🧺</ThemedText>
            <ThemedText style={[styles.emptyText, { color: mutedColor }]} testID="shopping-empty">
              La lista está vacía.
            </ThemedText>
          </ThemedView>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50)}>
            <ThemedView
              style={[styles.itemRow, { backgroundColor: cardColor, borderColor }]}
              lightColor={cardColor}
              darkColor={cardColor}>
              <BouncyPressable
                style={styles.itemToggle}
                onPress={() => handleToggle(item)}
                testID={`shopping-toggle-${item.id}`}>
                <ThemedText style={item.checked ? styles.itemChecked : undefined}>
                  {item.checked ? '✅' : '⬜'} {item.name}
                </ThemedText>
              </BouncyPressable>
              <BouncyPressable
                onPress={() => handleRemove(item.id)}
                testID={`shopping-remove-${item.id}`}>
                <ThemedText style={styles.remove}>✕</ThemedText>
              </BouncyPressable>
            </ThemedView>
          </Animated.View>
        )}
      />

      {hasChecked && (
        <BouncyPressable
          style={styles.clearButton}
          onPress={handleClearChecked}
          testID="shopping-clear">
          <ThemedText style={styles.clearButtonText}>✨ Quitar comprados</ThemedText>
        </BouncyPressable>
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
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: Palette.rose,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  error: {
    color: Palette.danger,
    fontSize: 14,
    paddingTop: 6,
  },
  list: {
    paddingVertical: 12,
    paddingBottom: 140,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemToggle: {
    flex: 1,
  },
  itemChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.45,
  },
  remove: {
    color: Palette.danger,
    paddingHorizontal: 8,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 32,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 44,
    lineHeight: 52,
  },
  emptyText: {
    textAlign: 'center',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  clearButtonText: {
    color: Palette.rose,
    fontWeight: '700',
  },
});
