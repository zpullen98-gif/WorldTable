import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	LENGTH_CHIPS,
	SAY_LENGTHS,
	SERVICE_EYEBROW,
	SPEECH_SENTENCE,
	VERDICT_WORDS,
	gradeGuest,
	gradeSaid,
	guestDeck,
	kitchensCard,
	guestKey,
	lengthFor,
	pickNext,
	sayCounts,
	sayKey,
	saySections,
	serviceNoteOf
} from './house-say';
import { heldLine, packCounts, packId, packLine } from './house-autoload';
import type { House } from './house/house-schema';

/**
 * Say it back and Guest at the table, offline: the lists by section over
 * kept lines only, the keys a record goes under, the guest deck of kept
 * scenarios and mix-ups asked as which is which, the grade through the
 * engine's own graders, and the words the auto-load's line says. Run over
 * the widened kept fixture the e2e seeds and over the shipped Brennan's pack.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const drillHouse = () => JSON.parse(readFileSync(here('./house/fixtures/house-drill.json'), 'utf8')) as House;
const packText = () => readFileSync(here('../../static/shared/packs/brennans-new-orleans.v1.oothouse.json'), 'utf8');
const brennans = () => (JSON.parse(packText()) as { house: House }).house;

const DASH = new RegExp(['\\u2014', '\\u2013', '&' + 'mdash;', ' ' + '-- '].join('|'));

function seeded(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

describe('Say it back', () => {
	it('lists only items with a kept timed line, grouped by section, of the kinds chosen', () => {
		const h = drillHouse();
		const dishes = saySections(h, ['dish']);
		const names = dishes.flatMap((s) => s.items.map((i) => i.name));
		expect(names).toContain('Lantern Roast Chicken');
		// Her unkept lines never reach the list, and a dish with none is left out.
		expect(names).not.toContain('Smoked Eel Toast');
		expect(names).not.toContain('Beetroot and Apple Salad');
		for (const s of dishes) for (const i of s.items) expect(i.kind).toBe('dish');
		const all = saySections(h, ['dish', 'cocktail', 'wine']).flatMap((s) => s.items.map((i) => i.name));
		expect(all).toContain('The Lantern Collins');
		expect(all).toContain('Quay Lane Harbour White 2024');
		expect(sayCounts(h)).toEqual({ dish: 5, cocktail: 1, wine: 1 });
	});

	it('over the shipped pack, every dish, drink and wine can be said back', () => {
		const h = brennans();
		const c = sayCounts(h);
		expect(c.dish).toBe(h.dishes.filter((d) => d.lines?.by === 'person').length);
		expect(c.cocktail).toBe(h.cocktails.length);
		expect(c.wine).toBe(h.wines.length);
		const sections = saySections(h, ['dish']);
		expect(sections.length).toBeGreaterThan(3);
		for (const s of sections) expect(s.section).toBeTruthy();
	});

	it('records under house:<houseId>:<itemId>:say-<length>, and the chips say the seconds', () => {
		expect(sayKey('h-x', 'd-y', 's20')).toBe('house:h-x:d-y:say-s20');
		expect(SAY_LENGTHS.map((l) => LENGTH_CHIPS[l])).toEqual(['10 seconds', '20 seconds', '45 seconds']);
		expect(VERDICT_WORDS).toEqual({ met: 'Met', close: 'Close', missed: 'Missed' });
	});

	it('grades the kept line read back as met, and a stray sentence as missed with notes', () => {
		const h = drillHouse();
		const item = saySections(h, ['dish'])[0].items[0];
		const line = (h.dishes.find((d) => d.id === item.id)!.lines!.value as unknown as Record<string, string>).s20;
		const met = gradeSaid(h, item.id, 's20', line)!;
		expect(met.verdict).toBe('met');
		const miss = gradeSaid(h, item.id, 's20', 'It is very nice tonight.')!;
		expect(miss.verdict).toBe('missed');
		expect(miss.notes.length).toBeGreaterThan(0);
	});

	it('picks a length the item carries, and Next never repeats while another exists', () => {
		const item = { id: 'd', kind: 'dish' as const, name: 'D', section: 'S', lengths: ['s10' as const] };
		expect(lengthFor(item, 's20')).toBe('s10');
		expect(lengthFor(null, 's45')).toBe('s45');
		const list = [{ id: 'a' }, { id: 'b' }];
		const r = seeded(3);
		for (let i = 0; i < 20; i++) expect(pickNext(list, 'a', r)!.id).toBe('b');
		expect(pickNext([{ id: 'a' }], 'a', r)!.id).toBe('a');
		expect(pickNext([], '', r)).toBeNull();
	});

	it('reads a service note as the person\'s words, and the fixed sentences carry no dash', () => {
		const h = brennans();
		const d = h.dishes.find((x) => x.serviceNote)!;
		expect(serviceNoteOf(h, d.id)).toBe(d.serviceNote.trim());
		expect(serviceNoteOf(h, 'd-none')).toBe('');
		expect(SERVICE_EYEBROW).toBe('Your words. Allergens: confirm at lineup.');
		expect(SPEECH_SENTENCE).toBe("Your voice goes to your browser's speech service, not to Anthropic.");
		for (const s of [SERVICE_EYEBROW, SPEECH_SENTENCE, ...Object.values(LENGTH_CHIPS), ...Object.values(VERDICT_WORDS)]) expect(s).not.toMatch(DASH);
	});
});

describe('Guest at the table', () => {
	it('deals kept scenarios, then mix-ups with a kept difference asked as which is which', () => {
		const h = drillHouse();
		const deck = guestDeck(h);
		expect(deck.filter((c) => c.kind === 'scenario').map((c) => c.title)).toEqual(['A table in a hurry']);
		const mix = deck.filter((c) => c.kind === 'mixUp');
		expect(mix.length).toBe(h.mixUps.length);
		for (const m of mix) {
			expect(m.title).toMatch(/^Which is which: .+ and .+$/);
			expect(m.guest).toBeTruthy();
		}
		// An unkept answer never sits down.
		const unkept = structuredClone(h);
		for (const s of unkept.scenarios) if (s.you) s.you.by = 'maitre';
		for (const m of unkept.mixUps) if (m.difference) m.difference.by = 'maitre';
		expect(guestDeck(unkept)).toEqual([]);
	});

	it('grades a scenario and a mix-up through gradeScenario, the kept answer met and a stray one missed', () => {
		const h = drillHouse();
		for (const card of guestDeck(h)) {
			const kept =
				card.kind === 'scenario'
					? (h.scenarios.find((s) => s.id === card.id)!.you!.value as string)
					: (h.mixUps.find((m) => m.id === card.id)!.difference!.value as string);
			const g = gradeGuest(h, card, kept)!;
			expect(g.verdict).toBe('met');
			expect(g.keptYou).toBe(kept.trim());
			expect(gradeGuest(h, card, 'Let me check.')!.verdict).toBe('missed');
		}
		expect(guestKey('h-x', 's-y')).toBe('house:h-x:s-y:guest');
	});

	it('over the shipped pack, every scenario sits down but the kitchen\'s, and the mix-ups follow', () => {
		const h = brennans();
		const deck = guestDeck(h);
		const kitchens = h.scenarios.filter((s) => kitchensCard(s.title, s.guest, typeof s.you?.value === 'string' ? s.you.value : ''));
		expect(kitchens.map((s) => s.title).sort()).toEqual(['Gluten', 'Is the tofu vegan?', 'Shellfish allergy', 'Shellfish and nuts at one table', 'Vegan at breakfast']);
		expect(deck.filter((c) => c.kind === 'scenario')).toHaveLength(h.scenarios.length - kitchens.length);
		for (const s of kitchens) {
			expect(deck.some((c) => c.id === s.id)).toBe(false);
			expect(gradeGuest(h, { id: s.id, kind: 'scenario', title: s.title, guest: s.guest }, 'anything')).toBeNull();
		}
		expect(kitchensCard('Pregnant guest and raw oysters', 'I’m pregnant. Are the oysters OK?', 'raw shellfish carries a risk')).toBe(false);
		expect(deck.filter((c) => c.kind === 'mixUp').length).toBeGreaterThan(0);
	});
});

describe('the auto-load line', () => {
	it('holds the pack for her press in words, and reads the pack id without trusting the file', () => {
		const text = JSON.stringify({ house: { id: 'h-x', name: 'Brennan’s', dishes: [1, 2], cocktails: [1], wines: [] } });
		expect(heldLine(text)).toBe('Brennan’s is ready to load: 2 dishes, 1 drink, 0 wines. Your own dishes stay as they are until you press Load the pack; loading files them under it.');
		expect(packId(text)).toBe('h-x');
		expect(packId('{ not json')).toBe('');
	});

	it('counts the pack, and says loaded, updated or nothing', () => {
		const text = packText();
		const h = brennans();
		expect(packCounts(text)).toEqual({ name: h.name, dishes: h.dishes.length, cocktails: h.cocktails.length, wines: h.wines.length });
		expect(packLine({ action: 'added', id: h.id, current: true }, text)).toBe(
			`${h.name} is loaded: ${h.dishes.length} dishes, ${h.cocktails.length} drinks, ${h.wines.length} wines.`
		);
		expect(packLine({ action: 'added', id: h.id, current: false }, text)).toContain('Switch to open it.');
		expect(packLine({ action: 'refreshed', id: h.id, counts: { added: 3, updated: 0, kept: 1 } }, text)).toBe(`${h.name} updated: 3 new.`);
		expect(packLine({ action: 'refreshed', id: h.id, counts: { added: 0, updated: 2, kept: 0 } }, text)).toBe(`${h.name} updated: 0 new, 2 changed.`);
		expect(packLine({ action: 'current', id: h.id }, text)).toBe('');
		expect(packLine({ action: 'refused', said: 'no' }, text)).toBe('');
		expect(packCounts('not json')).toEqual({ name: 'The house', dishes: 0, cocktails: 0, wines: 0 });
		expect(packLine({ action: 'added', id: h.id, current: true }, text)).not.toMatch(DASH);
	});
});
