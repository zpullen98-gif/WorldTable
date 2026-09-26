import { describe, it, expect } from 'vitest';
import {
	DESK_INBOX_CAP,
	DESK_INBOX_KEY,
	DESK_INBOX_TTL_MS,
	clearDeskInbox,
	deskShare,
	kindsWithItems,
	markDeskTaken,
	mergeDesk,
	readDeskInbox,
	writeDeskInbox,
	type DeskStorage
} from './desk-inbox';
import {
	deskSource,
	emptyDesk,
	readDeskFile,
	type DeskDish,
	type DeskFile,
	type DeskItem,
	type DeskUnsure,
	type DeskWine
} from './desk-file';

/**
 * The slot three apps share. What is under test is the set of rules the plan
 * fixed: merge by kind and folded name with the newer read winning, a taken
 * kind replaced and its mark cleared, the 256 KB cap refusing whole, the
 * thirty-day expiry of the draft, and the key deleted once every room has
 * taken its share. A Map stands in for localStorage so every rule runs under
 * plain Node; a `refuse` flag stands in for private browsing.
 */

const NOW = Date.parse('2026-09-25T14:02:00.000Z');
const at = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();
const DAY = 24 * 60 * 60 * 1000;

function fakeStorage(opts: { refuse?: boolean } = {}): DeskStorage & { map: Map<string, string> } {
	const map = new Map<string, string>();
	return {
		map,
		getItem: (k) => map.get(k) ?? null,
		setItem: (k, v) => {
			if (opts.refuse) throw new Error('QuotaExceededError');
			map.set(k, v);
		},
		removeItem: (k) => {
			map.delete(k);
		}
	};
}

let seq = 0;
const id = () => `k-${String(++seq).padStart(8, '0')}`;

const dish = (name: string, over: Partial<DeskDish> = {}): DeskDish => ({
	id: id(),
	kind: 'dish',
	section: 'STARTERS',
	name,
	price: { printed: '9', parts: [{ amount: '9', label: '' }] },
	marks: [],
	confidence: 'high',
	why: [],
	raw: `${name}\n9`,
	lines: [0, 1],
	description: '',
	ingredientsNamed: [],
	...over
});
const wine = (name: string, over: Partial<DeskWine> = {}): DeskWine => ({
	id: id(),
	kind: 'wine',
	section: 'WINE BY GLASS',
	name,
	price: { printed: '45.00 / 22.50', parts: [] },
	marks: [],
	confidence: 'high',
	why: [],
	raw: `${name}\n45.00 / 22.50`,
	lines: [0, 1],
	producer: name,
	wine: '',
	vintage: '',
	region: '',
	country: '',
	grapes: [],
	style: '',
	bin: '',
	pours: [],
	bottle: '',
	descriptors: '',
	...over
});
const unsure = (name: string, could: DeskUnsure['could']): DeskUnsure => ({
	id: id(),
	kind: 'unsure',
	section: '',
	name,
	price: { printed: '', parts: [] },
	marks: [],
	confidence: 'low',
	why: ['Could be a wine or a cocktail.'],
	raw: name,
	lines: [0, 0],
	could
});

/** A desk read at `when` (an offset from NOW), with these rows. */
function desk(items: DeskItem[], when = 0, over: Partial<DeskFile> = {}): DeskFile {
	const source = deskSource('paste', 'table', items.map((i) => i.raw).join('\n'), {
		now: new Date(NOW + when)
	});
	return { ...emptyDesk(source, new Date(NOW + when)), items, ...over };
}

const names = (f: DeskFile | null) => (f ? f.items.map((i) => `${i.kind}:${i.name}`) : null);

describe('writing and reading the slot', () => {
	it('round-trips a desk file through the slot', () => {
		const storage = fakeStorage();
		const written = desk([dish('Soup'), wine('Ployez-Jacquemart')]);
		const result = writeDeskInbox(written, storage, NOW);
		expect(result.ok).toBe(true);
		expect(storage.map.has(DESK_INBOX_KEY)).toBe(true);
		expect(readDeskInbox(storage, NOW)).toEqual(written);
	});

	it('is empty with nothing waiting, and with no storage at all', () => {
		expect(readDeskInbox(fakeStorage(), NOW)).toBeNull();
		expect(readDeskInbox(null, NOW)).toBeNull();
	});

	it('refuses without storage, naming the download as the next step', () => {
		const result = writeDeskInbox(desk([dish('Soup')]), null, NOW);
		expect(result).toMatchObject({ ok: false, reason: 'no-storage' });
		if (!result.ok) expect(result.said).toMatch(/Download the desk file/);
	});

	it('refuses a browser that will not take the write, and writes nothing', () => {
		const storage = fakeStorage({ refuse: true });
		const result = writeDeskInbox(desk([dish('Soup')]), storage, NOW);
		expect(result).toMatchObject({ ok: false, reason: 'refused' });
		expect(storage.map.size).toBe(0);
	});

	it('refuses a merged file over the cap, whole, and leaves what was waiting', () => {
		const storage = fakeStorage();
		const waiting = desk([wine('Ployez-Jacquemart')]);
		expect(writeDeskInbox(waiting, storage, NOW).ok).toBe(true);
		const before = storage.map.get(DESK_INBOX_KEY);

		const huge = desk(
			Array.from({ length: 500 }, (_, i) => dish(`Dish ${i}`, { description: 'x'.repeat(600) }))
		);
		expect(JSON.stringify(huge).length).toBeGreaterThan(DESK_INBOX_CAP);
		const result = writeDeskInbox(huge, storage, NOW);
		expect(result).toMatchObject({ ok: false, reason: 'too-big' });
		// Not half of it, not the wines lost to the dishes: the slot as it was.
		expect(storage.map.get(DESK_INBOX_KEY)).toBe(before);
		expect(names(readDeskInbox(storage, NOW))).toEqual(['wine:Ployez-Jacquemart']);
	});

	it('writes every refusal in the house voice', () => {
		const said = [
			writeDeskInbox(desk([dish('Soup')]), null, NOW),
			writeDeskInbox(desk([dish('Soup')]), fakeStorage({ refuse: true }), NOW),
			writeDeskInbox(desk([dish('x', { description: 'x'.repeat(600) })].concat(Array.from({ length: 499 }, (_, i) => dish(`D${i}`, { description: 'x'.repeat(600) })))), fakeStorage(), NOW)
		];
		for (const r of said) {
			expect(r.ok).toBe(false);
			if (r.ok) continue;
			expect(r.said).not.toContain('\u2014');
			expect(r.said).not.toMatch(/\s--\s/);
			expect(r.said.trim()).toMatch(/\.$/);
		}
	});

	it('clears the slot', () => {
		const storage = fakeStorage();
		writeDeskInbox(desk([dish('Soup')]), storage, NOW);
		clearDeskInbox(storage);
		expect(storage.map.size).toBe(0);
		expect(readDeskInbox(storage, NOW)).toBeNull();
		// And is harmless on nothing, and on no storage.
		clearDeskInbox(storage);
		clearDeskInbox(null);
	});
});

describe('the merge, by kind and folded name', () => {
	it('returns the incoming file as it is when nothing is waiting', () => {
		const incoming = desk([dish('Soup')]);
		expect(mergeDesk(null, incoming)).toBe(incoming);
	});

	it('takes the newer read of the same row and keeps rows only one side has', () => {
		const first = desk([dish('Crème Brûlée', { description: 'first read' }), dish('Soup')], 0);
		const second = desk([dish('Creme Brulee', { description: 'second read' }), dish('Gumbo')], 60_000);
		const merged = mergeDesk(first, second);
		expect(names(merged)).toEqual(['dish:Creme Brulee', 'dish:Soup', 'dish:Gumbo']);
		expect((merged.items[0] as DeskDish).description).toBe('second read');
		expect(merged.source).toBe(second.source);
		expect(merged.createdAt).toBe(second.createdAt);
	});

	it('keeps the stored row when the incoming file is the older read', () => {
		// Importing a desk file downloaded last week over a fresh read: the
		// fresh read wins on a clash, and the old file's other rows still land.
		const fresh = desk([dish('Soup', { description: 'fresh' })], 0);
		const old = desk([dish('Soup', { description: 'stale' }), dish('Pie')], -7 * DAY);
		const merged = mergeDesk(fresh, old);
		// The older read's order, with the fresh row in the clashing slot.
		expect(names(merged)).toEqual(['dish:Soup', 'dish:Pie']);
		expect((merged.items[0] as DeskDish).description).toBe('fresh');
		expect(merged.source).toBe(fresh.source);
	});

	it('keeps a dish and a cocktail of the same name apart', () => {
		const merged = mergeDesk(desk([dish('Margarita')]), desk([wine('Margarita')], 1));
		expect(names(merged)).toEqual(['dish:Margarita', 'wine:Margarita']);
	});

	it('replaces a kind the wing already took, and clears its mark', () => {
		const stored = desk([dish('Soup'), dish('Pie'), wine('Ployez-Jacquemart')], 0, {
			taken: { dish: at(1000) }
		});
		const again = desk([dish('Soup'), dish('Gumbo')], 60_000);
		const merged = mergeDesk(stored, again);
		// Pie was adopted already; keeping it would offer the kitchen a
		// duplicate. The wines were never taken and stay.
		expect(names(merged)).toEqual(['wine:Ployez-Jacquemart', 'dish:Soup', 'dish:Gumbo']);
		expect(merged.taken).toBeUndefined();
	});

	it('leaves a taken kind alone when the incoming read has none of it', () => {
		const stored = desk([dish('Soup'), wine('Ployez-Jacquemart')], 0, { taken: { dish: at(1000) } });
		const merged = mergeDesk(stored, desk([wine('Petit-Freylon')], 60_000));
		expect(names(merged)).toEqual(['dish:Soup', 'wine:Ployez-Jacquemart', 'wine:Petit-Freylon']);
		expect(merged.taken).toEqual({ dish: at(1000) });
	});

	it('counts an unsure row for every kind it could be when deciding what a wing took', () => {
		const stored = desk([unsure('Kiss the Crab', ['cocktail', 'dish'])], 0, { taken: { cocktail: at(1) } });
		const merged = mergeDesk(stored, desk([wine('X')], 60_000));
		expect(merged.taken).toEqual({ cocktail: at(1) });
		const replaced = mergeDesk(stored, desk([dish('Y')], 60_000));
		// The dish room is not the cocktail room, so the mark stays and the
		// unsure row is offered to the kitchen alongside the new dish.
		expect(replaced.taken).toEqual({ cocktail: at(1) });
		expect(names(replaced)).toEqual(['unsure:Kiss the Crab', 'dish:Y']);
	});

	it('unions the set-aside lines by their text', () => {
		const a = desk([dish('Soup')], 0, { unsorted: [{ raw: '9.50', line: 3, reason: 'orphan-price' }] });
		const b = desk([dish('Soup')], 1, {
			unsorted: [
				{ raw: '9.50', line: 8, reason: 'orphan-price' },
				{ raw: '~Finished~', line: 9, reason: 'heading-note' }
			]
		});
		expect(mergeDesk(a, b).unsorted).toEqual([
			{ raw: '9.50', line: 3, reason: 'orphan-price' },
			{ raw: '~Finished~', line: 9, reason: 'heading-note' }
		]);
	});

	it('takes the newer venue and notice, and the older when the newer has none', () => {
		const a = desk([], 0, { venue: 'A', notice: 'first' });
		const b = desk([], 1, { venue: 'B' });
		expect(mergeDesk(a, b)).toMatchObject({ venue: 'B', notice: 'first' });
		expect(mergeDesk(b, a)).toMatchObject({ venue: 'B', notice: 'first' });
		expect('notice' in mergeDesk(desk([], 0), desk([], 1))).toBe(false);
	});

	it('merges on write, so a second app adds to the slot rather than replacing it', () => {
		const storage = fakeStorage();
		writeDeskInbox(desk([dish('Soup')], 0), storage, NOW);
		const result = writeDeskInbox(desk([wine('Ployez-Jacquemart')], 1000), storage, NOW + 1000);
		expect(result.ok).toBe(true);
		expect(names(readDeskInbox(storage, NOW + 1000))).toEqual(['dish:Soup', 'wine:Ployez-Jacquemart']);
	});
});

describe('the thirty-day expiry of the draft', () => {
	it('deletes a draft older than the TTL on read', () => {
		const storage = fakeStorage();
		writeDeskInbox(desk([dish('Soup')]), storage, NOW);
		expect(readDeskInbox(storage, NOW + DESK_INBOX_TTL_MS + 1)).toBeNull();
		expect(storage.map.has(DESK_INBOX_KEY)).toBe(false);
	});

	it('keeps one inside it', () => {
		const storage = fakeStorage();
		writeDeskInbox(desk([dish('Soup')]), storage, NOW);
		expect(readDeskInbox(storage, NOW + 29 * DAY)).not.toBeNull();
		expect(storage.map.has(DESK_INBOX_KEY)).toBe(true);
	});

	it('leaves a value it cannot read where it is, because a newer build may have written it', () => {
		const storage = fakeStorage();
		const newer = JSON.stringify({ ...desk([dish('Soup')]), version: 2 });
		storage.map.set(DESK_INBOX_KEY, newer);
		expect(readDeskInbox(storage, NOW)).toBeNull();
		expect(storage.map.get(DESK_INBOX_KEY)).toBe(newer);
		storage.map.set(DESK_INBOX_KEY, '{not json');
		expect(readDeskInbox(storage, NOW)).toBeNull();
		expect(storage.map.get(DESK_INBOX_KEY)).toBe('{not json');
	});

	it('validates what it reads through readDeskFile, so a hand-edited slot is repaired not trusted', () => {
		const storage = fakeStorage();
		const edited = { ...desk([{ ...dish('Soup'), allergens: ['nuts'] } as never]) };
		storage.map.set(DESK_INBOX_KEY, JSON.stringify(edited));
		const read = readDeskInbox(storage, NOW)!;
		expect(read).toEqual(readDeskFile(edited, NOW));
		expect('allergens' in read.items[0]).toBe(false);
	});
});

describe("a wing's share", () => {
	const f = desk([
		dish('Soup'),
		wine('Ployez-Jacquemart'),
		unsure('Kiss the Crab', ['cocktail', 'dish']),
		unsure('Zacapa 23', []),
		unsure('Petit-Freylon', ['wine'])
	]);

	it('is the rows of its kind plus the unsure rows that could be its kind', () => {
		expect(deskShare(f, 'dish').map((i) => i.name)).toEqual(['Soup', 'Kiss the Crab']);
		expect(deskShare(f, 'wine').map((i) => i.name)).toEqual(['Ployez-Jacquemart', 'Petit-Freylon']);
		expect(deskShare(f, 'cocktail').map((i) => i.name)).toEqual(['Kiss the Crab']);
	});

	it('is empty once the wing has taken it', () => {
		expect(deskShare({ ...f, taken: { dish: at(0) } }, 'dish')).toEqual([]);
		expect(deskShare({ ...f, taken: { dish: at(0) } }, 'wine')).toHaveLength(2);
	});

	it('knows which kinds a desk has rows for, counting an unsure row for each it could be', () => {
		expect(kindsWithItems(f)).toEqual(['dish', 'wine', 'cocktail']);
		expect(kindsWithItems(desk([unsure('Zacapa 23', [])]))).toEqual([]);
		expect(kindsWithItems(desk([unsure('X', ['wine'])]))).toEqual(['wine']);
	});
});

describe('marking a share taken', () => {
	it('stamps the kind and keeps the rest waiting', () => {
		const storage = fakeStorage();
		writeDeskInbox(desk([dish('Soup'), wine('Ployez-Jacquemart')]), storage, NOW);
		const left = markDeskTaken('dish', storage, NOW + 5000);
		expect(left?.taken).toEqual({ dish: at(5000) });
		const back = readDeskInbox(storage, NOW + 5000)!;
		expect(back.taken).toEqual({ dish: at(5000) });
		expect(deskShare(back, 'dish')).toEqual([]);
		expect(deskShare(back, 'wine')).toHaveLength(1);
	});

	it('deletes the key once every kind with rows is taken', () => {
		const storage = fakeStorage();
		writeDeskInbox(desk([dish('Soup'), wine('Ployez-Jacquemart')]), storage, NOW);
		expect(markDeskTaken('dish', storage, NOW)).not.toBeNull();
		expect(markDeskTaken('wine', storage, NOW)).toBeNull();
		expect(storage.map.has(DESK_INBOX_KEY)).toBe(false);
	});

	it('deletes a desk of nothing but rows no wing keeps on the first take', () => {
		const storage = fakeStorage();
		writeDeskInbox(desk([unsure('Zacapa 23', [])]), storage, NOW);
		expect(markDeskTaken('dish', storage, NOW)).toBeNull();
		expect(storage.map.has(DESK_INBOX_KEY)).toBe(false);
	});

	it('does nothing with nothing waiting, or with no storage', () => {
		expect(markDeskTaken('dish', fakeStorage(), NOW)).toBeNull();
		expect(markDeskTaken('dish', null, NOW)).toBeNull();
	});

	it('hands back the unmarked file when the browser refuses the mark, so the share is offered again', () => {
		const storage = fakeStorage();
		writeDeskInbox(desk([dish('Soup'), wine('X')]), storage, NOW);
		const refusing: DeskStorage = {
			getItem: (k) => storage.getItem(k),
			setItem: () => {
				throw new Error('QuotaExceededError');
			},
			removeItem: (k) => storage.removeItem(k)
		};
		const result = markDeskTaken('dish', refusing, NOW);
		expect(result?.taken).toBeUndefined();
		expect(deskShare(readDeskInbox(storage, NOW)!, 'dish')).toHaveLength(1);
	});
});
