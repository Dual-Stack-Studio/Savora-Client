import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/constants/theme';

/**
 * Pantalla de carga: la oveja de la app girando sobre fondo rosa crema.
 * Reemplaza al video de intro — arranca al instante, pesa nada y usa
 * las mismas imágenes de la mascota.
 */

const SHEEP_OPEN = require('../assets/images/sheep_open.png-removebg-preview.png');
const SHEEP_CLOSED = require('../assets/images/sheep_closed.png-removebg-preview.png');

const INTRO_BG = '#FBE3DE'; // rosa crema: mezcla de Palette.cream y Palette.pinkSoft
const MIN_DURATION_MS = 2600;
const SPIN_MS = 1500;

export function IntroSplash({ onFinish }: { onFinish: () => void }) {
  const [blink, setBlink] = useState(false);

  const spin = useSharedValue(0);
  const bounce = useSharedValue(0);

  useEffect(() => {
    // Nuestro splash ya está listo: escondemos el nativo de una.
    SplashScreen.hideAsync();

    // Giro completo continuo, con una pausa chiquita entre vueltas.
    spin.value = withRepeat(
      withSequence(
        withTiming(360, { duration: SPIN_MS, easing: Easing.inOut(Easing.cubic) }),
        withTiming(360, { duration: 250 }) // respiro antes de la próxima vuelta
      ),
      -1,
      false
    );

    // Rebote suave mientras gira, como si rodara contenta.
    bounce.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 420, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) })
      ),
      -1,
      true
    );

    // Parpadeo entre vueltas para que se sienta viva.
    const blinkTimer = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 350);
    }, 1750);

    const finishTimer = setTimeout(onFinish, MIN_DURATION_MS);
    return () => {
      clearInterval(blinkTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish, spin, bounce]);

  const sheepStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }, { rotate: `${spin.value % 360}deg` }],
  }));

  return (
    <Animated.View exiting={FadeOut.duration(450)} style={styles.container}>
      <Animated.View style={sheepStyle}>
        <Image
          source={blink ? SHEEP_CLOSED : SHEEP_OPEN}
          style={styles.sheep}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={styles.title}>Nicy Kitchen</Text>
      <Text style={styles.subtitle}>cooking something yummy…</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    backgroundColor: INTRO_BG,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sheep: {
    width: 190,
    height: 190,
  },
  title: {
    marginTop: 18,
    fontSize: 30,
    fontWeight: '800',
    color: Palette.chocolate,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.brown,
    fontStyle: 'italic',
  },
});
