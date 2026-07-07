import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useEventListener } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import { useVideoPlayer, VideoView } from 'expo-video';

import { useColorScheme } from '@/hooks/use-color-scheme';

const introSource = require('@/assets/videos/intro.mp4');

// Si el video no termina por algún motivo (fallo de carga, etc.), no queremos
// dejar al usuario trabado en la pantalla de carga para siempre.
const FALLBACK_TIMEOUT_MS = 10000;

export function IntroVideo({ onFinish }: { onFinish: () => void }) {
  const colorScheme = useColorScheme();

  const player = useVideoPlayer(introSource, (player) => {
    player.muted = true;
    player.play();
  });

  useEventListener(player, 'playToEnd', onFinish);

  useEffect(() => {
    const timeout = setTimeout(onFinish, FALLBACK_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [onFinish]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff' },
      ]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        onFirstFrameRender={() => {
          SplashScreen.hideAsync();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
  },
});
