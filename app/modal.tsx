import { ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AccountScreen() {
  const { user, loading, signingIn, error, configured, unsupportedEnvironment, redirectUri, signInAsync, signOutAsync } =
    useAuth();
  const mutedColor = useThemeColor({}, 'muted');
  const borderColor = useThemeColor({}, 'border');

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={Palette.rose} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {user ? (
        <>
          {user.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <ThemedText style={styles.avatarFallback}>🐑</ThemedText>
          )}
          <ThemedText type="title">{user.name}</ThemedText>
          <ThemedText style={{ color: mutedColor }}>{user.email}</ThemedText>

          <BouncyPressable style={styles.signOutButton} onPress={signOutAsync} testID="sign-out">
            <ThemedText style={styles.signOutText}>Sign out</ThemedText>
          </BouncyPressable>
        </>
      ) : (
        <>
          <ThemedText style={styles.emoji}>👋</ThemedText>
          <ThemedText type="title" style={styles.title}>
            Sign in to save recipes
          </ThemedText>
          <ThemedText style={[styles.hint, { color: mutedColor }]}>
            Sign in with Google to create your own recipes and save favorites.
          </ThemedText>

          {!configured && (
            <ThemedView style={[styles.warningBox, { borderColor }]}>
              <ThemedText style={styles.warningText}>
                ⚙️ Google sign-in isn’t configured yet. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in
                .env.local (see README).
              </ThemedText>
            </ThemedView>
          )}

          {unsupportedEnvironment && (
            <ThemedView style={[styles.warningBox, { borderColor }]}>
              <ThemedText style={styles.warningText}>
                📱 Google sign-in doesn’t work inside Expo Go on a phone. Try it with npm run web.
              </ThemedText>
            </ThemedView>
          )}

          <BouncyPressable
            style={[styles.signInButton, (signingIn || !configured || unsupportedEnvironment) && styles.disabled]}
            onPress={signInAsync}
            disabled={signingIn || !configured || unsupportedEnvironment}
            testID="sign-in-google">
            {signingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.signInText}>Sign in with Google</ThemedText>
            )}
          </BouncyPressable>

          {error && (
            <ThemedText style={styles.error} testID="auth-error">
              😵 {error}
            </ThemedText>
          )}

          {__DEV__ && (
            <ThemedText style={[styles.devHint, { color: mutedColor }]}>
              Redirect URI for Google Cloud Console: {redirectUri}
            </ThemedText>
          )}
        </>
      )}

      <Link href=".." dismissTo style={styles.dismissLink}>
        <ThemedText type="link">Close</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 44,
    lineHeight: 52,
  },
  title: {
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarFallback: {
    fontSize: 56,
    lineHeight: 64,
  },
  signInButton: {
    backgroundColor: Palette.rose,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: 8,
  },
  signInText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  signOutButton: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  signOutText: {
    color: Palette.danger,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    color: Palette.danger,
    textAlign: 'center',
    marginTop: 4,
  },
  warningBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    textAlign: 'center',
  },
  devHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
  dismissLink: {
    marginTop: 20,
    paddingVertical: 10,
  },
});
