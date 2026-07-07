import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  addFavorite,
  FavoriteInput,
  isFavorite,
  listFavorites,
  removeFavorite,
  toggleFavorite,
} from '../favorites';

const catalogInput = (recipeId = 1): FavoriteInput => ({
  source: 'catalog',
  recipeId,
  title: 'Kartoffel-Tortilla',
  image: null,
});

const externalInput = (recipeId = 715415): FavoriteInput => ({
  source: 'external',
  recipeId,
  title: 'Red Lentil Soup',
  image: 'https://img.spoonacular.com/recipes/715415-312x231.jpg',
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('addFavorite / listFavorites', () => {
  // TC-FAV-01
  it('adds a favorite and it appears first in the list', async () => {
    const added = await addFavorite(catalogInput());
    const favorites = await listFavorites();
    expect(favorites).toHaveLength(1);
    expect(favorites[0].id).toBe(added.id);
    expect(favorites[0].title).toBe('Kartoffel-Tortilla');
  });

  // TC-FAV-02: catalog and external recipes with the same numeric id don't collide
  it('catalog and external favorites with the same recipeId stay separate', async () => {
    await addFavorite(catalogInput(1));
    await addFavorite(externalInput(1));
    const favorites = await listFavorites();
    expect(favorites).toHaveLength(2);
    expect(new Set(favorites.map((f) => f.source))).toEqual(new Set(['catalog', 'external']));
  });

  // TC-FAV-03: adding the same recipe twice does not duplicate it
  it('adding the same favorite twice does not duplicate it', async () => {
    await addFavorite(catalogInput());
    await addFavorite(catalogInput());
    expect(await listFavorites()).toHaveLength(1);
  });
});

describe('isFavorite / removeFavorite', () => {
  // TC-FAV-04
  it('isFavorite reflects current state', async () => {
    expect(await isFavorite('catalog', 1)).toBe(false);
    await addFavorite(catalogInput());
    expect(await isFavorite('catalog', 1)).toBe(true);
  });

  // TC-FAV-05
  it('removeFavorite deletes only the matching source+id', async () => {
    await addFavorite(catalogInput(1));
    await addFavorite(externalInput(1));
    await removeFavorite('catalog', 1);
    const favorites = await listFavorites();
    expect(favorites).toHaveLength(1);
    expect(favorites[0].source).toBe('external');
  });

  // TC-FAV-06: idempotent
  it('removing a favorite that is not there does not throw', async () => {
    await expect(removeFavorite('catalog', 999)).resolves.toBeUndefined();
  });
});

describe('toggleFavorite', () => {
  // TC-FAV-07
  it('toggles from not-favorite to favorite and back', async () => {
    expect(await toggleFavorite(catalogInput())).toBe(true);
    expect(await isFavorite('catalog', 1)).toBe(true);

    expect(await toggleFavorite(catalogInput())).toBe(false);
    expect(await isFavorite('catalog', 1)).toBe(false);
  });

  // TC-FAV-08: corrupted storage doesn't crash the app
  it('listFavorites returns an empty list on corrupted storage', async () => {
    await AsyncStorage.setItem('nicy-kitchen/favorites', '{not valid json');
    expect(await listFavorites()).toEqual([]);
  });
});
