import { Stack, useRouter } from 'expo-router';

import { RecipeForm } from '@/components/recipe-form';
import { emitMascot } from '@/lib/mascot';
import { createRecipe } from '@/lib/recipes';

export default function NewRecipeScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Nueva receta' }} />
      <RecipeForm
        submitLabel="Crear receta"
        onSubmit={async (input) => {
          await createRecipe(input);
          emitMascot('recipe-created');
          router.back();
        }}
      />
    </>
  );
}
