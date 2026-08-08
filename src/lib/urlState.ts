/**
 * Filter state <-> query string.
 *
 * A filtered view is a thing people send each other ("here, the vegetarian
 * mains under 40 minutes"), so it belongs in the URL. Written with replaceState
 * rather than pushState: typing six characters into the search box should not
 * cost six presses of the Back button.
 */
import type { Course, Difficulty, FilterState } from './types';
import { EMPTY_FILTERS } from './types';

export function filtersFromURL(url: URL, chapter: string | null = null): FilterState {
	const p = url.searchParams;
	const diff = Number(p.get('diff'));
	return {
		q: p.get('q') ?? '',
		chapter,
		course: (p.get('course') as Course) || null,
		difficulty: diff === 1 || diff === 2 || diff === 3 ? (diff as Difficulty) : null,
		quick: p.get('quick') === '1',
		vegetarian: p.get('veg') === '1',
		season: p.get('season') === '1'
	};
}

/** Only non-default values are written, so a clean view has a clean URL. */
export function filtersToSearch(f: FilterState): string {
	const p = new URLSearchParams();
	if (f.q.trim()) p.set('q', f.q.trim());
	if (f.course) p.set('course', f.course);
	if (f.difficulty) p.set('diff', String(f.difficulty));
	if (f.quick) p.set('quick', '1');
	if (f.vegetarian) p.set('veg', '1');
	if (f.season) p.set('season', '1');
	const s = p.toString();
	return s ? `?${s}` : '';
}

export function isDefault(f: FilterState): boolean {
	return (
		!f.q.trim() &&
		!f.course &&
		!f.difficulty &&
		!f.quick &&
		!f.vegetarian &&
		!f.season
	);
}

export { EMPTY_FILTERS };
