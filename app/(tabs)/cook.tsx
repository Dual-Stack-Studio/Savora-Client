import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Diet, fetchSuggestions, SuggestResponse } from '@/lib/api';
import { emitMascot } from '@/lib/mascot';

const QUICK_INGREDIENTS = ['egg', 'potato', 'onion', 'tomato', 'rice', 'cheese', 'garlic', 'pasta'];

const DIET_OPTIONS: { value?: Diet; label: string }[] = [
  { value: undefined, label: 'Todas' },
  { value: 'vegan', label: '🌱 Vegana' },
  { value: 'vegetarian', label: '🥚 Vegetariana' },
  { value: 'mit_meat', label: '🥩 Con carne' },
];

export default function CookScreen() {
  const [input, setInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [diet, setDiet] = useState<Diet | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuggestResponse | null>(null);

  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted');

  const addIngredient = (raw: string) => {
    const value = raw.trim().toLowerCase();
    if (!value) return;
    if (!ingredients.includes(value)) setIngredients((prev) => [...prev, value]);
    setInput('');
  };

  const removeIngredient = (value: string) => {
    setIngredients((prev) => prev.filter((i) => i !== value));
  };

  const search = async () => {
    if (ingredients.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    emitMascot('searching');
    try {
      const data = await fetchSuggestions(ingredients, diet);
      setResult(data);
      const total = data.suggestions.length + (data.external?.length ?? 0);
      emitMascot(total > 0 ? 'results' : 'no-results');
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'No se pudo conectar con la cocina.');
      emitMascot('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">¿Qué cocino? 🍳</ThemedText>
        <ThemedText style={[styles.hint, { color: mutedColor }]}>
          Contame qué tenés en la heladera (en inglés o alemán) y te digo qué podés cocinar.
        </ThemedText>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { color: textColor, borderColor, backgroundColor: cardColor }]}
            value={input}
            onChangeText={setInput}
            placeholder="Ej: egg, Kartoffel, onion…"
            placeholderTextColor={mutedColor}
            onSubmitEditing={() => addIngredient(input)}
            returnKeyType="done"
            autoCapitalize="none"
            testID="cook-input"
          />
          <BouncyPressable style={styles.addButton} onPress={() => addIngredient(input)} testID="cook-add">
            <ThemedText style={styles.addButtonText}>+</ThemedText>
          </BouncyPressable>
        </View>

        {/* Sugerencias rápidas para no tipear */}
        <View style={styles.chipsRow}>
          {QUICK_INGREDIENTS.filter((q) => !ingredients.includes(q)).map((q) => (
            <BouncyPressable
              key={q}
              style={[styles.quickChip, { borderColor }]}
              onPress={() => addIngredient(q)}
              testID={`quick-${q}`}>
              <ThemedText style={[styles.quickChipText, { color: mutedColor }]}>+ {q}</ThemedText>
            </BouncyPressable>
          ))}
        </View>

        {/* Lo que ya agregó */}
        {ingredients.length > 0 && (
          <View style={styles.chipsRow}>
            {ingredients.map((ing) => (
              <BouncyPressable
                key={ing}
                style={styles.chip}
                onPress={() => removeIngredient(ing)}
                testID={`chip-${ing}`}>
                <ThemedText style={styles.chipText}>{ing} ✕</ThemedText>
              </BouncyPressable>
            ))}
          </View>
        )}

        {/* Dieta */}
        <View style={styles.dietRow}>
          {DIET_OPTIONS.map((option) => {
            const active = diet === option.value;
            return (
              <BouncyPressable
                key={option.label}
                style={[styles.dietChip, { borderColor }, active && styles.dietChipActive]}
                onPress={() => setDiet(option.value)}
                testID={`diet-${option.value ?? 'all'}`}>
                <ThemedText style={[styles.dietChipText, active && styles.dietChipTextActive]}>
                  {option.label}
                </ThemedText>
              </BouncyPressable>
            );
          })}
        </View>

        <BouncyPressable
          style={[styles.searchButton, (ingredients.length === 0 || loading) && styles.searchButtonDisabled]}
          onPress={search}
          disabled={ingredients.length === 0 || loading}
          testID="cook-search">
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.searchButtonText}>Buscar recetas 🔍</ThemedText>
          )}
        </BouncyPressable>

        {error && (
          <Animated.View entering={FadeInUp} style={styles.errorBox}>
            <ThemedText style={styles.errorText}>😵 {error}</ThemedText>
            <ThemedText style={[styles.errorHint, { color: mutedColor }]}>
              ¿Está corriendo el backend? (npm run dev en nicy-kitchen-api)
            </ThemedText>
          </Animated.View>
        )}

        {result && result.unknownIngredients.length > 0 && (
          <Animated.View entering={FadeInUp} style={[styles.unknownBox, { borderColor }]}>
            <ThemedText style={[styles.unknownText, { color: mutedColor }]}>
              🤷 Estos no los conozco: {result.unknownIngredients.join(', ')}
            </ThemedText>
          </Animated.View>
        )}

        {result && result.suggestions.length === 0 && (result.external?.length ?? 0) === 0 && !error && (
          <Animated.View entering={FadeInUp} style={styles.emptyBox}>
            <ThemedText style={{ color: mutedColor, textAlign: 'center' }}>
              🥺 No encontré nada con eso… ¡probá agregando más ingredientes!
            </ThemedText>
          </Animated.View>
        )}

        {/* Recetas locales */}
        {result && result.suggestions.length > 0 && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              De tu cocina 🏠
            </ThemedText>
            {result.suggestions.map((s, index) => (
              <Animated.View key={s.id} entering={FadeInDown.delay(index * 90).springify()}>
                <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
                  <View style={styles.cardHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                      {s.title}
                    </ThemedText>
                    <View style={styles.scoreBadge}>
                      <ThemedText style={styles.scoreText}>{Math.round(s.score * 100)}%</ThemedText>
                    </View>
                  </View>
                  <View style={styles.scoreBarTrack}>
                    <View style={[styles.scoreBarFill, { width: `${Math.round(s.score * 100)}%` }]} />
                  </View>
                  <ThemedText style={[styles.cardDetail, { color: mutedColor }]}>
                    ✅ Tenés: {s.matched.join(', ')}
                  </ThemedText>
                  {s.missing.length > 0 && (
                    <ThemedText style={[styles.cardDetail, { color: mutedColor }]}>
                      🛒 Te falta: {s.missing.join(', ')}
                    </ThemedText>
                  )}
                </View>
              </Animated.View>
            ))}
          </>
        )}

        {/* Recetas de Spoonacular */}
        {result?.external && result.external.length > 0 && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Ideas de internet 🌍
            </ThemedText>
            {result.external.map((s, index) => (
              <Animated.View key={s.id} entering={FadeInDown.delay(index * 90).springify()}>
                <View style={[styles.card, styles.externalCard, { backgroundColor: cardColor, borderColor }]}>
                  {s.image && <Image source={{ uri: s.image }} style={styles.externalImage} contentFit="cover" />}
                  <View style={styles.externalInfo}>
                    <ThemedText type="defaultSemiBold" numberOfLines={2}>
                      {s.title}
                    </ThemedText>
                    <ThemedText style={[styles.cardDetail, { color: mutedColor }]}>
                      Usa {s.matchedCount} de los tuyos · faltan {s.missingCount}
                    </ThemedText>
                  </View>
                </View>
              </Animated.View>
            ))}
          </>
        )}

        {result?.externalError && (
          <ThemedText style={[styles.cardDetail, { color: mutedColor, textAlign: 'center', marginTop: 8 }]}>
            🌍 Las ideas de internet no están disponibles ahora ({result.externalError})
          </ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingTop: 64,
    paddingHorizontal: 16,
    paddingBottom: 140,
    gap: 10,
  },
  hint: {
    fontSize: 14,
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
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quickChipText: {
    fontSize: 13,
  },
  chip: {
    backgroundColor: Palette.pinkSoft,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: Palette.chocolate,
    fontSize: 14,
    fontWeight: '600',
  },
  dietRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  dietChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dietChipActive: {
    backgroundColor: Palette.rose,
    borderColor: Palette.rose,
  },
  dietChipText: {
    fontSize: 14,
  },
  dietChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  searchButton: {
    backgroundColor: Palette.rose,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Palette.chocolate,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  errorText: {
    color: Palette.danger,
    fontWeight: '600',
  },
  errorHint: {
    fontSize: 13,
  },
  unknownBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 10,
  },
  unknownText: {
    fontSize: 13,
  },
  emptyBox: {
    padding: 24,
  },
  sectionTitle: {
    marginTop: 14,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
  },
  scoreBadge: {
    backgroundColor: Palette.pinkSoft,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scoreText: {
    color: Palette.chocolate,
    fontWeight: '700',
    fontSize: 13,
  },
  scoreBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.pinkSoft,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Palette.rose,
  },
  cardDetail: {
    fontSize: 13,
  },
  externalCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  externalImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  externalInfo: {
    flex: 1,
    gap: 4,
  },
});
