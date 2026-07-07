import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
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
  { value: undefined, label: 'All' },
  { value: 'vegan', label: '🌱 Vegan' },
  { value: 'vegetarian', label: '🥚 Vegetarian' },
  { value: 'mit_meat', label: '🥩 With meat' },
];

export default function CookScreen() {
  const router = useRouter();
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
      setError(e instanceof Error ? e.message : 'Could not reach the kitchen.');
      emitMascot('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">What to cook? 🍳</ThemedText>
        <ThemedText style={[styles.hint, { color: mutedColor }]}>
          Tell me what you have in the fridge (in English or German) and I&apos;ll tell you what you can cook.
        </ThemedText>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { color: textColor, borderColor, backgroundColor: cardColor }]}
            value={input}
            onChangeText={setInput}
            placeholder="E.g.: egg, Kartoffel, onion…"
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
            <ThemedText style={styles.searchButtonText}>Find recipes 🔍</ThemedText>
          )}
        </BouncyPressable>

        {error && (
          <Animated.View entering={FadeInUp} style={styles.errorBox}>
            <ThemedText style={styles.errorText}>😵 {error}</ThemedText>
            <ThemedText style={[styles.errorHint, { color: mutedColor }]}>
              Is the backend running? (npm run dev in nicy-kitchen-api)
            </ThemedText>
          </Animated.View>
        )}

        {result && result.unknownIngredients.length > 0 && (
          <Animated.View entering={FadeInUp} style={[styles.unknownBox, { borderColor }]}>
            <ThemedText style={[styles.unknownText, { color: mutedColor }]}>
              🤷 I don&apos;t know these: {result.unknownIngredients.join(', ')}
            </ThemedText>
          </Animated.View>
        )}

        {result && result.suggestions.length === 0 && (result.external?.length ?? 0) === 0 && !error && (
          <Animated.View entering={FadeInUp} style={styles.emptyBox}>
            <ThemedText style={{ color: mutedColor, textAlign: 'center' }}>
              🥺 Nothing found with that… try adding more ingredients!
            </ThemedText>
          </Animated.View>
        )}

        {/* Recetas locales */}
        {result && result.suggestions.length > 0 && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              From your kitchen 🏠
            </ThemedText>
            {result.suggestions.map((s, index) => (
              <Animated.View key={s.id} entering={FadeInDown.delay(index * 90).springify()}>
                <BouncyPressable
                  onPress={() =>
                    router.push({
                      pathname: '/catalog/[id]',
                      params: { id: s.id, matched: s.matched.join(','), missing: s.missing.join(',') },
                    })
                  }
                  testID={`suggestion-card-${s.id}`}>
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
                      ✅ You have: {s.matched.join(', ')}
                    </ThemedText>
                    {s.missing.length > 0 && (
                      <ThemedText style={[styles.cardDetail, { color: mutedColor }]}>
                        🛒 Missing: {s.missing.join(', ')}
                      </ThemedText>
                    )}
                  </View>
                </BouncyPressable>
              </Animated.View>
            ))}
          </>
        )}

        {/* Recetas de Spoonacular */}
        {result?.external && result.external.length > 0 && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Ideas from the internet 🌍
            </ThemedText>
            {result.external.map((s, index) => (
              <Animated.View key={s.id} entering={FadeInDown.delay(index * 90).springify()}>
                <BouncyPressable
                  onPress={() => router.push({ pathname: '/external/[id]', params: { id: s.id } })}
                  testID={`external-card-${s.id}`}>
                  <View style={[styles.card, styles.externalCard, { backgroundColor: cardColor, borderColor }]}>
                    {s.image && <Image source={{ uri: s.image }} style={styles.externalImage} contentFit="cover" />}
                    <View style={styles.externalInfo}>
                      <ThemedText type="defaultSemiBold" numberOfLines={2}>
                        {s.title}
                      </ThemedText>
                      <ThemedText style={[styles.cardDetail, { color: mutedColor }]}>
                        Uses {s.matchedCount} of yours · missing {s.missingCount}
                      </ThemedText>
                    </View>
                  </View>
                </BouncyPressable>
              </Animated.View>
            ))}
          </>
        )}

        {result?.externalError && (
          <ThemedText style={[styles.cardDetail, { color: mutedColor, textAlign: 'center', marginTop: 8 }]}>
            🌍 Internet ideas are not available right now ({result.externalError})
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
