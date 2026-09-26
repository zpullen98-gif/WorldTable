/**
 * One level's page, prerendered for each of the four.
 *
 * What is baked in is small and static: the level's name and blurb, the
 * seven subsections in order, and "N at this level" for each (the emitted
 * counts). The items themselves and the word and figure arrive on the
 * client from the levels store, which reads the record; a load that returned
 * the item lists would inline hundreds of slugs into every level page.
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
	return {
		level: n as DeckLevel,
		info,
		counts: levels.counts[String(n)],
		subsections: levels.subsections
	};
};
