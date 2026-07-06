/**
 * Bus de eventos de la mascota. Cualquier pantalla emite un evento y la
 * mascota flotante (components/mascot.tsx) reacciona.
 */

export type MascotEvent =
  | 'recipe-created'
  | 'recipe-updated'
  | 'recipe-deleted'
  | 'item-added'
  | 'item-checked'
  | 'list-cleared'
  | 'searching'
  | 'results'
  | 'no-results'
  | 'error'
  | 'poke';

type Listener = (event: MascotEvent) => void;

const listeners = new Set<Listener>();

export function emitMascot(event: MascotEvent) {
  for (const listener of listeners) listener(event);
}

export function subscribeMascot(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
