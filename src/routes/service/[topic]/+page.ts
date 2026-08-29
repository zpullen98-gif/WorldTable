import { error } from '@sveltejs/kit';
import { loadServiceTrack, loadLexicon } from '$lib/data';

export const prerender = true;

/** One page per module, 27 of them, all known at build time. */
export async function entries() {
	const track = await loadServiceTrack();
	return track.modules.map((m) => ({ topic: m.key }));
}

export async function load({ params }) {
	const [track, lexicon] = await Promise.all([loadServiceTrack(), loadLexicon()]);
	const index = track.modules.findIndex((m) => m.key === params.topic);
	if (index < 0) error(404, 'No such module');

	const module = track.modules[index];
	const bySlug = new Map(lexicon.map((e) => [e.slug, e]));

	return {
		module,
		// Definitions are resolved HERE rather than shipped in service-track.json:
		// inlining the 176 costs 65KB gzipped and duplicates lexicon.json, which
		// this load already has open.
		terms: module.terms.map((t) => ({
			...t,
			definition: bySlug.get(t.slug)?.definition ?? ''
		})),
		prev: index > 0 ? track.modules[index - 1] : null,
		next: index + 1 < track.modules.length ? track.modules[index + 1] : null,
		count: track.modules.length
	};
}
