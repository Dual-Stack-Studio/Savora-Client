import { useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import { IntroVideo } from '@/components/intro-video';
import { Mascot } from '@/components/mascot';
import { Colors, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Mantiene visible el splash nativo hasta que el video de intro esté listo
// para mostrar su primer frame (IntroVideo llama a hideAsync ahí).
SplashScreen.preventAutoHideAsync();

const NonaLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Palette.rose,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const NonaDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Palette.pinkSoft,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? NonaDark : NonaLight}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        {/* Ñoqui vive arriba de todo, siempre presente */}
        <Mascot />
        {!introFinished && <IntroVideo onFinish={() => setIntroFinished(true)} />}
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
