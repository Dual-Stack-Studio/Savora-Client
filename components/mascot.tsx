import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/constants/theme';
import { emitMascot, MascotEvent, subscribeMascot } from '@/lib/mascot';

/**
 * Ñoqui 🍪 — la mascota tamagotchi de Nicy Kitchen.
 * Vive flotando abajo a la derecha, respira, parpadea, y reacciona
 * a todo lo que hace el usuario (via lib/mascot.ts).
 */

type Mood = { face: string; message: string };

const REACTIONS: Record<MascotEvent, Mood[]> = {
  'recipe-created': [
    { face: '😋', message: '¡Ñami! Receta nueva' },
    { face: '🤩', message: '¡Esa la quiero probar!' },
  ],
  'recipe-updated': [{ face: '😊', message: '¡Quedó mejor todavía!' }],
  'recipe-deleted': [{ face: '🫡', message: 'Chau receta…' }],
  'item-added': [
    { face: '😄', message: '¡A la lista!' },
    { face: '🛒', message: '¡Anotado!' },
  ],
  'item-checked': [
    { face: '🥳', message: '¡Conseguido!' },
    { face: '😄', message: '¡Uno menos!' },
  ],
  'list-cleared': [{ face: '✨', message: '¡Lista limpia!' }],
  searching: [{ face: '🤔', message: 'Mmm… pensando…' }],
  results: [
    { face: '🤩', message: '¡Mirá lo que encontré!' },
    { face: '😋', message: '¡Se me hace agua la boca!' },
  ],
  'no-results': [{ face: '🥺', message: 'No encontré nada…' }],
  error: [{ face: '😵', message: '¡Ups! Algo salió mal' }],
  poke: [
    { face: '🤭', message: '¡Jiji! ¿Qué cocinamos?' },
    { face: '😊', message: '¡Hola! Soy Ñoqui' },
    { face: '😋', message: '¿Me convidás?' },
  ],
};

const IDLE_FACE = '😊';
const BLINK_FACE = '😌';

function pick<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

export function Mascot() {
  const [face, setFace] = useState(IDLE_FACE);
  const [message, setMessage] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bob = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  // Respiración: sube y baja suave, siempre.
  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [bob]);

  // Parpadeo cada tanto para que se sienta vivo.
  useEffect(() => {
    const blink = setInterval(() => {
      setFace((current) => {
        if (current !== IDLE_FACE) return current; // no interrumpir una reacción
        setTimeout(() => setFace((f) => (f === BLINK_FACE ? IDLE_FACE : f)), 350);
        return BLINK_FACE;
      });
    }, 4200);
    return () => clearInterval(blink);
  }, []);

  useEffect(() => {
    const react = (event: MascotEvent) => {
      const mood = pick(REACTIONS[event]);
      setFace(mood.face);
      setMessage(mood.message);

      // Salto de alegría (o sacudida si es un poke)
      scale.value = withSequence(
        withSpring(1.25, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      if (event === 'poke' || event === 'error') {
        rotate.value = withSequence(
          withTiming(-12, { duration: 80 }),
          withTiming(12, { duration: 80 }),
          withTiming(-8, { duration: 80 }),
          withTiming(0, { duration: 80 })
        );
      }

      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        setFace(IDLE_FACE);
        setMessage(null);
      }, 2400);
    };

    const unsubscribe = subscribeMascot(react);
    return () => {
      unsubscribe();
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [scale, rotate]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <View style={styles.container} pointerEvents="box-none">
      {message && (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(200)} style={styles.bubble}>
          <Text style={styles.bubbleText}>{message}</Text>
        </Animated.View>
      )}
      <Animated.View style={bodyStyle}>
        <Pressable
          onPress={() => emitMascot('poke')}
          testID="mascot"
          accessibilityLabel="Ñoqui, la mascota">
          <View style={styles.body}>
            <Text style={styles.face}>{face}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 14,
    bottom: 96,
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  body: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.pinkSoft,
    borderWidth: 2.5,
    borderColor: Palette.rose,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.chocolate,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  face: {
    fontSize: 28,
    lineHeight: 34,
  },
  bubble: {
    backgroundColor: Palette.rose,
    borderRadius: 14,
    borderBottomRightRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 8,
    maxWidth: 190,
    shadowColor: Palette.chocolate,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bubbleText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});
