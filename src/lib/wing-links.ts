/**
 * The links across the rooms (docs/study-menus-design.md, 1.7): a dish's
 * first pick opens the bottle in the Codex, its drink without alcohol opens
 * in the Ledger.
 *
 * A cross-room link is drawn only when all three hold:
 *
 * 1. The page is on the suite's shared origin (`sharedOrigin(base)`). A
 *    standalone build draws none, because another origin's storage cannot be
 *    known to hold the item.
 * 2. The target item is in the current house. The rooms share the one house,
 *    and each projects its own kind on boot.
 * 3. The network is up, or the room is installed here: `wingInstalled` asks
 *    the caches for the room's own entry point, never a cache NAME, because
 *    an install cut off on a weak signal leaves the name and no shell, and
 *    the link would then lead offline to the browser's error page.
 *
 * `roomHref` is pure and returns '' when the first two fail; every caller
 * draws a link only for a non-empty address and words otherwise.
 */
import { sharedOrigin } from './desk/desk-share';
import type { CompareEntry, House } from './house/house-schema';

export type Room = 'codex' | 'ledger' | 'table';

export const ROOM_NAMES: Readonly<Record<Room, string>> = { codex: 'Codex', ledger: 'Ledger', table: 'World Table' };

/** The id shape every room accepts, and nothing looser. */
export const ITEM_ID_RE = /^[dbw]-[a-z0-9]{8}$/;

/** The address of an item in another room, or '' when no link may be drawn for it. */
export function roomHref(room: Room, id: string, base: string, house: House | null | undefined): string {
	if (!house || !sharedOrigin(base) || !ITEM_ID_RE.test(id)) return '';
	if (room === 'codex') return (house.wines ?? []).some((w) => w.id === id) ? `/codex/#wine=${id}` : '';
	if (room === 'ledger') return (house.cocktails ?? []).some((c) => c.id === id) ? `/ledger/#drink=${id}` : '';
	return (house.dishes ?? []).some((d) => d.id === id) ? `${base}/menu#${id}` : '';
}

/** The address of another room's study view, or '' off the shared origin. */
export function roomListHref(room: Room, base: string): string {
	if (!sharedOrigin(base)) return '';
	if (room === 'codex') return '/codex/#list';
	if (room === 'ledger') return '/ledger/#/menu';
	return `${base}/menu`;
}

/** The room's own entry points, the first of which a cache must answer for the room to count as installed. */
export const ROOM_ENTRIES: Readonly<Record<Room, readonly string[]>> = {
	codex: ['/codex/index.html', '/codex/'],
	ledger: ['/ledger/index.html', '/ledger/'],
	table: ['/table/shell.html']
};

/** True when this device's caches answer for the room's entry point; false when they do not or cannot be asked. */
export async function wingInstalled(room: Room): Promise<boolean> {
	try {
		if (typeof caches === 'undefined') return false;
		for (const url of ROOM_ENTRIES[room]) {
			const hit = await caches.match(url, { ignoreSearch: true });
			if (hit) return true;
		}
		return false;
	} catch {
		return false;
	}
}

/** The Ledger's own slug rule (ui-new.js slugify), so a link lands on the canon drink's Library page. */
export function ledgerSlug(name: string): string {
	return String(name).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** The address a Table ref opens: recipe/<slug> or technique/<slug>, the builder's tableRef. */
export const TABLE_REF_RE = /^(recipe|technique)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Where a comparison opens, and in which room: a Table recipe or technique
 * here (always), a Ledger cocktail's Library page or a Codex door on the
 * shared origin only (a house wine by its card, a grape, producer or primer
 * through the Codex's #ref= door), and nothing for a classic, which is
 * words. `room` is the room a cross-room link needs installed or online
 * (rule 3 above); null for a link inside the Table.
 */
export function compareHref(e: Pick<CompareEntry, 'app' | 'ref'>, base: string, house: House | null | undefined): { href: string; room: Room | null } {
	const ref = typeof e.ref === 'string' ? e.ref.trim() : '';
	if (!ref) return { href: '', room: null };
	if (e.app === 'table') return { href: TABLE_REF_RE.test(ref) ? `${base}/${ref}` : '', room: null };
	if (!sharedOrigin(base)) return { href: '', room: null };
	if (e.app === 'ledger') {
		const slug = ledgerSlug(ref);
		return { href: slug ? `/ledger/#/library/${slug}` : '', room: 'ledger' };
	}
	if (e.app === 'codex') {
		if (/^w-[a-z0-9]{8}$/.test(ref)) return { href: roomHref('codex', ref, base, house), room: 'codex' };
		return { href: `/codex/#ref=${encodeURIComponent(ref)}`, room: 'codex' };
	}
	return { href: '', room: null };
}
