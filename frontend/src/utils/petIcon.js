// Species a user can pick, with the icon shown next to the pet's name
export const SPECIES = [
  { value: 'dog', label: 'Dog', icon: '🐶' },
  { value: 'cat', label: 'Cat', icon: '🐱' },
  { value: 'bird', label: 'Bird', icon: '🐦' },
  { value: 'rabbit', label: 'Rabbit', icon: '🐰' },
  { value: 'hamster', label: 'Hamster', icon: '🐹' },
  { value: 'guinea pig', label: 'Guinea pig', icon: '🐹' },
  { value: 'fish', label: 'Fish', icon: '🐟' },
  { value: 'turtle', label: 'Turtle', icon: '🐢' },
  { value: 'lizard', label: 'Lizard', icon: '🦎' },
  { value: 'snake', label: 'Snake', icon: '🐍' },
  { value: 'horse', label: 'Horse', icon: '🐴' },
  { value: 'other', label: 'Other', icon: '🐾' },
];

// Fallback for anything not on the list
const DEFAULT_ICON = '🐾';

/**
 * Returns the icon for a species, or a paw if it isn't on the list.
 *
 * @param {string} species - The pet's species, like 'dog'
 * @returns {string} An emoji icon
 */
export function petIcon(species) {
  if (typeof species !== 'string') {
    return DEFAULT_ICON;
  }
  const match = SPECIES.find((s) => s.value === species.trim().toLowerCase());
  return match ? match.icon : DEFAULT_ICON;
}