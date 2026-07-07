import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
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
} from "react-native-reanimated";

import { Palette } from "@/constants/theme";
import { emitMascot, MascotEvent, subscribeMascot } from "@/lib/mascot";

/**
 * Wooly 🐑 — the Nicy Kitchen tamagotchi, modeled after a black plush sheep
 * (dark wool, cream face, embroidered features, purple ribbon).
 * Esta versión usa las imágenes en formato ICONO (PNG sin fondo).
 * Se ha ajustado el timing para asegurar que las animaciones de parpadeo sean visibles.
 */

// ⚠️ IMPORTANTE: Asegúrate de que estos dos archivos sean PNGs con transparencia real
// (sin fondo blanco ni de colores) para que se comporten como iconos flotantes.
const SHEEP_OPEN = require("../assets/images/sheep_open.png-removebg-preview.png");
const SHEEP_CLOSED = require("../assets/images/sheep_closed.png-removebg-preview.png");

type Eyes = "open" | "closed" | "happy" | "dizzy";

type Mood = { eyes: Eyes; mouth: string; message: string };

const REACTIONS: Record<MascotEvent, Mood[]> = {
  "recipe-created": [
    { eyes: "happy", mouth: "ᵕ", message: "Yummy! A new recipe" },
    { eyes: "happy", mouth: "o", message: "Baa! I want to try that one!" },
  ],
  "recipe-updated": [
    { eyes: "happy", mouth: "ᵕ", message: "Even better now!" },
  ],
  "recipe-deleted": [
    { eyes: "closed", mouth: "‸", message: "Bye bye, recipe…" },
  ],
  "item-added": [
    { eyes: "happy", mouth: "ᵕ", message: "On the list!" },
    { eyes: "open", mouth: "o", message: "Noted!" },
  ],
  "item-checked": [
    { eyes: "happy", mouth: "ᵕ", message: "Got it!" },
    { eyes: "happy", mouth: "o", message: "One less to go!" },
  ],
  "list-cleared": [{ eyes: "happy", mouth: "ᵕ", message: "All clean!" }],
  searching: [{ eyes: "closed", mouth: "~", message: "Hmm… thinking…" }],
  results: [
    { eyes: "happy", mouth: "o", message: "Look what I found!" },
    { eyes: "happy", mouth: "ᵕ", message: "My mouth is watering!" },
  ],
  "no-results": [
    { eyes: "closed", mouth: "‸", message: "Couldn't find anything…" },
  ],
  error: [{ eyes: "dizzy", mouth: "o", message: "Oops! Something went wrong" }],
  poke: [
    { eyes: "happy", mouth: "ᵕ", message: "Baa! Let's cook!" },
    { eyes: "open", mouth: "ᵕ", message: "Hi! I'm Linna" },
    { eyes: "happy", mouth: "o", message: "Will you share a bite?" },
  ],
  "signed-in": [
    { eyes: "happy", mouth: "ᵕ", message: "Welcome, chef!" },
    { eyes: "happy", mouth: "o", message: "Yay, you're in!" },
  ],
  "signed-out": [{ eyes: "closed", mouth: "‸", message: "See you soon!" }],
  favorited: [
    { eyes: "happy", mouth: "ᵕ", message: "Saved to favorites!" },
    { eyes: "happy", mouth: "o", message: "Great pick!" },
  ],
  unfavorited: [{ eyes: "open", mouth: "‸", message: "Removed from favorites" }],
};

const IDLE: Pick<Mood, "eyes" | "mouth"> = { eyes: "open", mouth: "ᵕ" };

function pick<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

export function Mascot() {
  const [eyes, setEyes] = useState<Eyes>(IDLE.eyes);
  const [mouth, setMouth] = useState(IDLE.mouth);
  const [message, setMessage] = useState<string | null>(null);
  const reacting = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bob = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  // Breathing: gentle up and down, forever.
  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [bob]);

  // Blink every few seconds so she feels alive.
  useEffect(() => {
    const blink = setInterval(() => {
      if (reacting.current) return;
      setEyes("closed");
      setTimeout(() => {
        if (!reacting.current) setEyes(IDLE.eyes);
      }, 500); // ⏱️ AUMENTADO DE 320 a 500 para dar tiempo a renderizar la imagen alternativa
    }, 4200);
    return () => clearInterval(blink);
  }, []);

  useEffect(() => {
    const react = (event: MascotEvent) => {
      const mood = pick(REACTIONS[event]);
      reacting.current = true;
      setEyes(mood.eyes);
      setMouth(mood.mouth); // Se mantiene en el estado aunque no lo rendericemos visualmente en la imagen
      setMessage(mood.message);

      // Happy jump (or a wiggle for pokes and errors)
      scale.value = withSequence(
        withSpring(1.22, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 8, stiffness: 200 }),
      );
      if (event === "poke" || event === "error") {
        rotate.value = withSequence(
          withTiming(-12, { duration: 80 }),
          withTiming(12, { duration: 80 }),
          withTiming(-8, { duration: 80 }),
          withTiming(0, { duration: 80 }),
        );
      }

      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        reacting.current = false;
        setEyes(IDLE.eyes);
        setMouth(IDLE.mouth);
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

  // Determinamos qué imagen mostrar basándonos en el estado de "eyes"
  // Añadí 'happy' a las reacciones que cierran los ojos para que haya más interacción visible
  const currentImage =
    eyes === "closed" || eyes === "dizzy" || eyes === "happy"
      ? SHEEP_CLOSED
      : SHEEP_OPEN;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {message && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(200)}
          style={styles.bubble}
        >
          <Text style={styles.bubbleText}>{message}</Text>
        </Animated.View>
      )}
      <Animated.View style={bodyStyle} pointerEvents="box-none">
        <Image source={currentImage} style={styles.mascotImage} resizeMode="contain" />
        <Pressable
          onPress={() => emitMascot("poke")}
          testID="mascot"
          accessibilityLabel="Wooly the sheep"
          style={styles.mascotHitArea}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: -50,
    bottom: 30,
    alignItems: "flex-end",
    zIndex: 1000,
  },
  mascotImage: {
    width: 200,
    height: 200,
    // Conserva la posición que antes daba el padding del Pressable
    margin: 10,
    // Las sombras nativas funcionan bien con PNGs transparentes en iOS,
    // pero en Android podrías necesitar ajustar 'elevation' si la sombra se ve cuadrada.
    shadowColor: Palette.chocolate,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  // Zona táctil acotada al cuerpo visible de la oveja: el PNG es 200x200 pero
  // casi todo es transparente, y un Pressable de ese tamaño bloqueaba los
  // botones y cards de abajo. Solo esta caja captura toques; el resto pasa.
  mascotHitArea: {
    position: "absolute",
    left: 45,
    top: 50,
    width: 105,
    height: 130,
  },
  bubble: {
    backgroundColor: Palette.rose,
    right: 60,
    borderRadius: 14,
    borderBottomRightRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: -30,
    maxWidth: 250,
    shadowColor: Palette.chocolate,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bubbleText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});
