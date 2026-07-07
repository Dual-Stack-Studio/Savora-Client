import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

import { emitMascot } from '@/lib/mascot';

/**
 * Google Sign-In — alcance "login liviano": autentica al usuario contra
 * Google (Authorization Code + PKCE, sin backend ni client secret), pero
 * las recetas propias y favoritos siguen viviendo en el dispositivo
 * (ver lib/recipes.ts y lib/favorites.ts). El login solo habilita esas
 * acciones; no particiona los datos por cuenta todavía.
 *
 * Requiere EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en .env.local (ver README).
 *
 * Limitación conocida: dentro de Expo Go en un teléfono real, Google
 * rechaza el redirect dinámico `exp://...` que genera AuthSession (el
 * proxy auth.expo.io está descontinuado). Funciona bien con `npm run web`;
 * en Expo Go mostramos un aviso en vez de un botón roto.
 */

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  picture: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signingIn: boolean;
  error: string | null;
  /** true si EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID está seteado. */
  configured: boolean;
  /** true si estamos en Expo Go en un dispositivo nativo (login no soportado ahí). */
  unsupportedEnvironment: boolean;
  /** Solo en __DEV__: para pegar en "Authorized redirect URIs" de Google Cloud. */
  redirectUri: string;
  signInAsync: () => Promise<void>;
  signOutAsync: () => Promise<void>;
};

const STORAGE_KEY = 'nicy-kitchen/auth-user';
const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const SCOPES = ['openid', 'profile', 'email'];

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');
  const redirectUri = useMemo(() => AuthSession.makeRedirectUri(), []);
  const unsupportedEnvironment = Constants.appOwnership === 'expo' && Platform.OS !== 'web';

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID || 'not-configured',
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success' && discovery) {
      (async () => {
        try {
          const tokenResult = await AuthSession.exchangeCodeAsync(
            {
              clientId: CLIENT_ID,
              code: response.params.code,
              redirectUri,
              extraParams: { code_verifier: request?.codeVerifier ?? '' },
            },
            discovery
          );

          const profileRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
          });
          if (!profileRes.ok) {
            throw new Error(`Google profile request failed (${profileRes.status}).`);
          }
          const profile = (await profileRes.json()) as {
            id: string;
            name?: string;
            email?: string;
            picture?: string;
          };

          const nextUser: AuthUser = {
            id: profile.id,
            name: profile.name ?? profile.email ?? 'Chef',
            email: profile.email ?? '',
            picture: profile.picture ?? null,
          };
          setUser(nextUser);
          setError(null);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
          emitMascot('signed-in');
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not sign in with Google.');
          emitMascot('error');
        } finally {
          setSigningIn(false);
        }
      })();
    } else if (response.type === 'error') {
      setError(response.error?.message ?? 'Google sign-in was cancelled or failed.');
      setSigningIn(false);
    } else {
      // 'cancel' | 'dismiss' | 'locked'
      setSigningIn(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const signInAsync = async () => {
    if (!CLIENT_ID) {
      setError('Google sign-in isn’t configured yet. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env.local.');
      return;
    }
    if (unsupportedEnvironment) {
      setError('Google sign-in doesn’t work inside Expo Go on a phone. Try it with npm run web.');
      return;
    }
    setError(null);
    setSigningIn(true);
    const result = await promptAsync();
    if (result.type !== 'success') setSigningIn(false);
  };

  const signOutAsync = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
    emitMascot('signed-out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signingIn,
        error,
        configured: Boolean(CLIENT_ID),
        unsupportedEnvironment,
        redirectUri,
        signInAsync,
        signOutAsync,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider.');
  return ctx;
}
