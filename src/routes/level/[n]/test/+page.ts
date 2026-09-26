/**
 * The level test's page, prerendered for each of the four with the level's
 * name only; the deck, its traps, the drill cards and the Lexicon load in
 * the browser once the reader begins (see +page.svelte).
 */
import { error } from '@sveltejs/kit';
import { loadLevels } from '$lib/data';
import type { DeckLevel } from '$lib/types';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => [{ n: '1' }, { n: '2' }, { n: '3' }, { n: '4' }];

export const load: PageLoad = async ({ params }) => {
	const n = Number(params.n);
	const levels = await loadLevels();
	const info = levels.levels.find((l) => l.level === n);
	if (!info) error(404, 'Not a level');
	return { level: n as DeckLevel, info };
};
