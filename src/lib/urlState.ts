/**
 * Filter state <-> query string.
 *
 * A filtered view is a thing people send each other ("here, the vegetarian
 * mains under 40 minutes"), so it belongs in the URL. Keystrokes are written
 * with replaceState: typing six characters into the search box should not cost
 * six presses of the Back button. A chip, a select or a clear is a DISCRETE
 * choice and pushes, so Back undoes it - it never did, and a cook who toggled
 * three chips and pressed Back left the app. discreteSearch() below is how
 * RecipeBrowser tells the two apart.
 */
import type { Course, Difficulty, FilterState } from './types';
import { EMPTY_FILTERS } from './types';
import { COURSES } from './data';

/**
 * Read a course out of the URL, or nothing.
 *
 * This used to be `(p.get('course') as Course) || null`: a cast, on the line
 * directly above a difficulty check that validates properly. A cast is not a
 * check, and filter.ts compares with `r.course !== f.course`, so any string
 * that was not one of the ten authored courses matched no recipe at all.
 * `?course=main` kept 0 of 1844, in every chapter, for as long as it was set.
 *
 * It was the worst kind of empty. The Toolbar's select has no option whose
 * value is "main", so it sat at selectedIndex -1 showing no filter name, and
 * filtersToSearch wrote the dead value back onto every later URL, so clearing
 * the search box did not clear it. The site root forwards its query string to
 * /recipes verbatim, so /?course=main reached it too.
 *
 * Case is FOLDED rather than rejected. Someone hand-editing ?course=main means
 * Main, and answering that with an empty library is obtuse; canonicalising also
 * lets filtersToSearch write the value back in its authored spelling, so a bad
 * link heals itself on first load. Anything that is not a course under any
 * casing becomes null, which shows the whole library rather than none of it,
 * and is what the difficulty check beside it already does with a 4.
 *
 * The list is COURSES from ./data, derived from the shipped corpus rather than
 * written out again here, so it cannot drift from the recipes.
 */
function courseFromURL(raw: string | null): Course | null {
	if (!raw) return null;
	const want = raw.trim().toLowerCase();
	const hit = (COURSES as readonly string[]).find((c) => c.toLowerCase() === want);
	return (hit as Course | undefined) ?? null;
}

export function filtersFromURL(url: URL, chapter: string | null = null): FilterState {
	const p = url.searchParams;
	const diff = Number(p.get('diff'));
	return {
		q: p.get('q') ?? '',
		chapter,
		course: courseFromURL(p.get('course')),
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

/**
 * The query string with q removed: what a chip or select change looks like
 * from the URL's point of view. Two states with the same discreteSearch differ
 * only by typing.
 */
export function discreteSearch(f: FilterState): string {
	return filtersToSearch({ ...f, q: '' });
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
