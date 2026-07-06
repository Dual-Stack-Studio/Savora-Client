import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  Ingredient,
  RecipeErrors,
  RecipeInput,
  validateRecipe,
} from '@/lib/recipes';

type Props = {
  initialValue?: RecipeInput;
  submitLabel: string;
  onSubmit: (input: RecipeInput) => Promise<void>;
};

const EMPTY_INGREDIENT: Ingredient = { name: '', quantity: '' };

export function RecipeForm({ initialValue, submitLabel, onSubmit }: Props) {
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [servings, setServings] = useState(String(initialValue?.servings ?? 2));
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialValue?.ingredients.length ? initialValue.ingredients : [{ ...EMPTY_INGREDIENT }]
  );
  const [instructions, setInstructions] = useState(initialValue?.instructions ?? '');
  const [errors, setErrors] = useState<RecipeErrors>({});
  const [saving, setSaving] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted');

  const inputStyle = [styles.input, { color: textColor, borderColor, backgroundColor: cardColor }];

  const setIngredient = (index: number, patch: Partial<Ingredient>) => {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)));
  };

  const buildInput = (): RecipeInput => ({
    title,
    servings: Number(servings),
    ingredients,
    instructions,
  });

  const handleSubmit = async () => {
    const input = buildInput();
    const validation = validateRecipe(input);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);
    try {
      await onSubmit(input);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <ThemedText type="defaultSemiBold">Título</ThemedText>
      <TextInput
        style={inputStyle}
        value={title}
        onChangeText={setTitle}
        placeholder="Ej: Kartoffel-Tortilla"
        placeholderTextColor={mutedColor}
        testID="recipe-title"
      />
      {errors.title && (
        <ThemedText style={styles.error} testID="error-title">
          {errors.title}
        </ThemedText>
      )}

      <ThemedText type="defaultSemiBold">Porciones</ThemedText>
      <TextInput
        style={inputStyle}
        value={servings}
        onChangeText={setServings}
        keyboardType="number-pad"
        testID="recipe-servings"
      />
      {errors.servings && (
        <ThemedText style={styles.error} testID="error-servings">
          {errors.servings}
        </ThemedText>
      )}

      <ThemedText type="defaultSemiBold">Ingredientes</ThemedText>
      {ingredients.map((ingredient, index) => (
        <ThemedView key={index} style={styles.ingredientRow}>
          <TextInput
            style={[...inputStyle, styles.ingredientName]}
            value={ingredient.name}
            onChangeText={(name) => setIngredient(index, { name })}
            placeholder="Ingrediente"
            placeholderTextColor={mutedColor}
            testID={`ingredient-name-${index}`}
          />
          <TextInput
            style={[...inputStyle, styles.ingredientQty]}
            value={ingredient.quantity ?? ''}
            onChangeText={(quantity) => setIngredient(index, { quantity })}
            placeholder="Cantidad"
            placeholderTextColor={mutedColor}
            testID={`ingredient-qty-${index}`}
          />
        </ThemedView>
      ))}
      {errors.ingredients && (
        <ThemedText style={styles.error} testID="error-ingredients">
          {errors.ingredients}
        </ThemedText>
      )}
      <BouncyPressable
        onPress={() => setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }])}
        testID="add-ingredient">
        <ThemedText style={styles.addIngredient}>+ Agregar ingrediente</ThemedText>
      </BouncyPressable>

      <ThemedText type="defaultSemiBold">Instrucciones</ThemedText>
      <TextInput
        style={[...inputStyle, styles.instructions]}
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Paso a paso de la preparación…"
        placeholderTextColor={mutedColor}
        multiline
        testID="recipe-instructions"
      />
      {errors.instructions && (
        <ThemedText style={styles.error} testID="error-instructions">
          {errors.instructions}
        </ThemedText>
      )}

      <BouncyPressable
        style={[styles.submit, saving && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={saving}
        testID="submit-recipe">
        <ThemedText style={styles.submitText}>{saving ? 'Guardando…' : submitLabel}</ThemedText>
      </BouncyPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 140,
    gap: 8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
  },
  ingredientName: {
    flex: 2,
  },
  ingredientQty: {
    flex: 1,
  },
  instructions: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  error: {
    color: Palette.danger,
    fontSize: 14,
  },
  addIngredient: {
    color: Palette.rose,
    fontWeight: '600',
    paddingVertical: 4,
  },
  submit: {
    backgroundColor: Palette.rose,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: Palette.chocolate,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
