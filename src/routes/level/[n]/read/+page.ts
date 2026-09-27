/**
 * One level's reader: its primers, one per subsection, prerendered for each
 * of the four levels.
 *
 * Unlike the level page, whose load bakes in only counts because the items
 * would inline hundreds of slugs, this page IS its text: the primers are the
 * content, so they are returned whole and rendered into the HTML, where a
 * search engine, a screen reader and a reader without JavaScript all find
 * them. The same chunk is precached, so the shell rebuilds the page offline.
 */
import { error } from '@sveltejs/kit';
import { loadLevels, loadPrimers } from '$lib/data';
import type { DeckLevel } from '$lib/types';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => [{ n: '1' }, { n: '2' }, { n: '3' }, { n: '4' }];

export const load: PageLoad = async ({ params }) => {
	const n = Number(params.n);
	const [levels, primers] = await Promise.all([loadLevels(), loadPrimers()]);
	const info = levels.levels.find((l) => l.level === n);
	if (!info) error(404, 'Not a level');
	const titles = new Map(levels.subsections.map((s) => [s.key, s.title]));
	const counts = levels.counts[String(n)] ?? {};
	return {
		level: n as DeckLevel,
		info,
		primers: primers.primers
			.filter((p) => p.level === n)
			.map((p) => ({ ...p, title: titles.get(p.subsection) ?? p.subsection, count: counts[p.subsection] ?? 0 }))
	};
};
