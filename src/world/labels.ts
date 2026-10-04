import { Vector3 } from 'three';

/** DOM elements of on-screen labels, keyed by interactable id or 'avatar'. */
export const labelEls = new Map<string, HTMLElement>();

/** World position above the player's head, written by Avatar every frame. */
export const avatarLabelPos = new Vector3();

export const registerLabel = (key: string) => (el: HTMLElement | null) => {
  if (el) labelEls.set(key, el);
  else labelEls.delete(key);
};
