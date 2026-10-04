/**
 * The shipped pack at boot, in words: what the one quiet line on the house
 * bar says after the store's auto-load has called ensurePack. Pure, so the
 * wording is tested under Node; the fetch, the ensurePack call and the sync
 * live in stores/house.svelte.ts.
 *
 * Only the two results that changed the device say anything. 'current'
 * (the device already holds this edition or a newer one) and 'refused'
 * (an unreadable file, a full device) are silent: the boot never blocks
 * and never nags, and the house bar's own refusal line carries a write
 * that failed.
 */
import type { EnsureResult } from './house/house-api';

function count(n: number, one: string, many: string): string {
	return `${n} ${n === 1 ? one : many}`;
}

/** What the pack file holds, read from its text without trusting it: zeros for anything missing. */
export function packCounts(text: string): { name: string; dishes: number; cocktails: number; wines: number } {
	try {
		const pack = JSON.parse(text) as { house?: Record<string, unknown> };
		const h = pack && typeof pack === 'object' && pack.house && typeof pack.house === 'object' ? pack.house : {};
		const len = (v: unknown) => (Array.isArray(v) ? v.length : 0);
		return {
			name: typeof h.name === 'string' && h.name.trim() ? h.name.trim() : 'The house',
			dishes: len(h.dishes),
			cocktails: len(h.cocktails),
			wines: len(h.wines)
		};
	} catch {
		return { name: 'The house', dishes: 0, cocktails: 0, wines: 0 };
	}
}

/** The one line for an ensurePack result, or empty when nothing changed on the device. */
export function packLine(result: EnsureResult, text: string): string {
	const c = packCounts(text);
	if (result.action === 'added') {
		const held = `${count(c.dishes, 'dish', 'dishes')}, ${count(c.cocktails, 'drink', 'drinks')}, ${count(c.wines, 'wine', 'wines')}`;
		return result.current ? `${c.name} is loaded: ${held}.` : `${c.name} is loaded beside your house: ${held}. Switch to open it.`;
	}
	if (result.action === 'refreshed') {
		const { added, updated, removed, kept } = result.counts;
		/* kept: items where a person's touch stood against a change the edition made (a note on a
		   wine holds its printed price and vintage too), said so the person knows to look. */
		return `${c.name} updated: ${added} new` + (updated ? `, ${updated} changed` : '') + (removed ? `, ${removed} retired` : '') + (kept ? `, ${kept} left as you had them` : '') + '.';
	}
	return '';
}

/** The pack's house id, read from its text without trusting it, or empty. */
export function packId(text: string): string {
	try {
		const pack = JSON.parse(text) as { house?: { id?: unknown } };
		return pack && pack.house && typeof pack.house.id === 'string' ? pack.house.id : '';
	} catch {
		return '';
	}
}

/**
 * The line when the pack is held for her press: her own dishes are on the
 * menu with no house, so nothing was written and the house bar asks.
 */
export function heldLine(text: string): string {
	const c = packCounts(text);
	const held = `${count(c.dishes, 'dish', 'dishes')}, ${count(c.cocktails, 'drink', 'drinks')}, ${count(c.wines, 'wine', 'wines')}`;
	return `${c.name} is ready to load: ${held}. Your own dishes stay as they are until you press Load the pack; loading files them under it.`;
}
