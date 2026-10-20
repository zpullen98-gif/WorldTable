/** Small, user-controlled sittings; the underlying cards and grade rules stay unchanged. */
export const PRACTICE_ROUND = 20;

/** These decks already have a deliberate short queue or a named item's teaching order. */
export function offersRoundLength(id: string): boolean {
	return !(
		id === 'due' || id.includes('misses') || id.endsWith(':today') ||
		id.startsWith('item:') || id.startsWith('item-components:') || id.startsWith('item-producers:') ||
		id.startsWith('foundations:item:') || id.startsWith('fall:item:') ||
		id === 'tastings' || id.startsWith('tasting:') || id.startsWith('cz:') || id.startsWith('deck')
	);
}

export function shortPractice<T>(id: string, cards: readonly T[], full = false): T[] {
	return full || !offersRoundLength(id) ? [...cards] : cards.slice(0, PRACTICE_ROUND);
}

/** Match each search word, regardless of accents, punctuation or their order. */
export function practiceMatches(query: string, ...labels: string[]): boolean {
	const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, '');
	const words = fold(query).trim().split(/\s+/).filter(Boolean);
	const text = fold(labels.join(' '));
	return words.every(word => text.includes(word));
}
