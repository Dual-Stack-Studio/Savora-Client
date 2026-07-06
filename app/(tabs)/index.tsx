import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { listRecipes, Recipe } from '@/lib/recipes';

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listRecipes().then((data) => {
        if (active) setRecipes(data);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Mis recetas</ThemedText>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/recipe/new')}
          testID="add-recipe">
          <ThemedText style={styles.addButtonText}>+ Nueva</ThemedText>
        </Pressable>
      </ThemedView>

      {recipes.length === 0 ? (
        <ThemedView style={styles.empty}>
          <ThemedText style={styles.emptyText} testID="empty-state">
            Todavía no tenés recetas.{'\n'}Creá la primera con el botón «+ Nueva».
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: item.id } })}
              testID={`recipe-card-${item.id}`}>
              <ThemedView style={styles.card}>
                <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                <ThemedText style={styles.cardMeta}>
                  {item.ingredients.length} ingrediente{item.ingredients.length === 1 ? '' : 's'} ·{' '}
                  {item.servings} porcione{item.servings === 1 ? '' : 's'}
                </ThemedText>
              </ThemedView>
            </Pressable>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 10,
    padding: 14,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
    marginBottom: 10,
  },
  cardMeta: {
    fontSize: 14,
    opacity: 0.7,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
