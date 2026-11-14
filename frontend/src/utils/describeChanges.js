// Changes smaller than this (in percent) are everyday variation, not worth showing
const MIN_CHANGE = 20;

// How to describe each value when it goes down or up
const FIELDS = [
  { key: 'food', down: 'Ate', up: 'Ate', suffix: 'than usual' },
  { key: 'water', down: 'Drank', up: 'Drank', suffix: 'than usual' },
  { key: 'activity', down: 'Active', up: 'Active', suffix: 'than usual' },
  { key: 'weight', down: 'Weighed', up: 'Weighed', suffix: 'than usual' },
];

/**
 * Percent change from usual, rounded. Returns null if it can't be calculated.
 *
 * @param {number} value - Today's value
 * @param {number} usual - The pet's usual value
 * @returns {number|null} Percent change, like -63, or null
 */
export function percentChange(value, usual) {
  if (
    typeof value !== 'number' ||
    typeof usual !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isFinite(usual) ||
    usual <= 0
  ) {
    return null;
  }
  return Math.round(((value - usual) / usual) * 100);
}

/**
 * Describes the big changes between an entry and the pet's usual values,
 * biggest first.
 *
 * @param {Object} entry - Today's entry
 * @param {Object|null} usual - The pet's usual values, or null if there's no history
 * @returns {{key: string, percent: number, text: string}[]}
 */
export function describeChanges(entry, usual) {
  if (!entry || !usual) {
    return [];
  }

  const changes = [];
  for (const field of FIELDS) {
    const percent = percentChange(entry[field.key], usual[field.key]);
    if (percent === null || Math.abs(percent) < MIN_CHANGE) {
      continue;
    }
    const verb = percent < 0 ? field.down : field.up;
    const direction = percent < 0 ? 'less' : 'more';
    changes.push({
      key: field.key,
      percent,
      text: `${verb} ${Math.abs(percent)}% ${direction} ${field.suffix}`,
    });
  }

  return changes.sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent));
}