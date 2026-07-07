import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { FavoriteSource, isFavorite, toggleFavorite } from '@/lib/favorites';
import { emitMascot } from '@/lib/mascot';

type Props = {
  source: FavoriteSource;
  recipeId: number;
  title: string;
  image: string | null;
  /** Se llama cuando el usuario toca el corazón sin estar logueado. */
  onRequireSignIn: () => void;
};

export function FavoriteButton({ source, recipeId, title, image, onRequireSignIn }: Props) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    isFavorite(source, recipeId).then((value) => {
      if (active) {
        setFavorited(value);
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, [source, recipeId]);

  const handlePress = async () => {
    if (!user) {
      onRequireSignIn();
      return;
    }
    const nowFavorited = await toggleFavorite({ source, recipeId, title, image });
    setFavorited(nowFavorited);
    emitMascot(nowFavorited ? 'favorited' : 'unfavorited');
  };

  return (
    <BouncyPressable
      style={styles.button}
      onPress={handlePress}
      testID={`favorite-${source}-${recipeId}`}
      accessibilityLabel={favorited ? 'Remove from favorites' : 'Add to favorites'}>
      <ThemedText style={styles.icon}>{loaded && favorited ? '❤️' : '🤍'}</ThemedText>
    </BouncyPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  icon: {
    fontSize: 26,
  },
});
