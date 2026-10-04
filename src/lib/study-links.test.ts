import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import deckJson from './data/floor-deck.json';
import lexJson from './data/lexicon.json';
import techJson from './data/techniques.json';
import recipesJson from './data/recipes.index.json';
import primersJson from './data/primers.json';
import indexJson from './data/floor-deck.index.json';
import type { House, HouseDish } from './house/house-schema';
import { deckLinks, recipeLink, studyLinksFor, type DeckCardIn, type LexiconIn, type RecipeIn } from './study-links';

const PACK: House = JSON.parse(readFileSync('static/shared/packs/brennans-new-orleans.v1.oothouse.json', 'utf8')).house;
const DECK = (deckJson as unknown as { cards: DeckCardIn[] }).cards;
const LEX = lexJson as unknown as LexiconIn[];
const RECIPES = recipesJson as unknown as RecipeIn[];
const dish = (name: string) => PACK.dishes.find((d) => d.name === name) as HouseDish;
const links = (d: HouseDish) =>
	studyLinksFor(PACK, d, {
		deck: DECK,
		lexicon: LEX,
		techniques: techJson as never,
		recipes: RECIPES,
		primers: (primersJson as unknown as { primers: never[] }).primers,
		levelNames: (indexJson as unknown as { levels: Record<string, string> }).levels
	});

describe('the links in this app, over the real data and the Brennan’s pack', () => {
	it('reach most of the menu', () => {
		const all = PACK.dishes.map(links);
		expect(all.filter((l) => l.deck.length).length).toBeGreaterThanOrEqual(40);
		expect(all.filter((l) => l.lexicon.length).length).toBeGreaterThanOrEqual(25);
		for (const l of all) {
			expect(l.deck.length).toBeLessThanOrEqual(6);
			for (const c of l.deck) expect(DECK.some((x) => x.id === c.id)).toBe(true);
			for (const e of l.lexicon) expect(LEX.some((x) => x.slug === e.slug)).toBe(true);
		}
	});

	it('link Eggs Hussarde to Cured, Poached and Hollandaise, and never to the belly-bacon card', () => {
		const terms = links(dish('Eggs Hussarde')).deck.map((c) => c.term);
		expect([...terms].sort()).toEqual(['Cured', 'Hollandaise', 'Poached']);
		const h = links(dish('Eggs Hussarde'));
		expect(h.houseWords.map((w) => w.term)).toContain('Hussarde');
		expect(h.scenarios.length).toBeGreaterThan(0);
	});

	it('do not link a common noun behind a proper adjective, but do link it plain', () => {
		const base = dish('Eggs Hussarde');
		const mustard: DeckCardIn = { id: 'fd_9999', term: 'Mustard', gist: 'planted' };
		const planted = { ...base, name: 'Planted dish', description: 'Roast pork with Creole mustard', ingredients: [], parts: undefined } as HouseDish;
		expect(deckLinks(planted, [mustard])).toEqual([]);
		const plain = { ...planted, description: 'Roast pork with mustard' } as HouseDish;
		expect(deckLinks(plain, [mustard]).map((c) => c.term)).toEqual(['Mustard']);
	});

	it('resolve overlapping names to the longest: oyster mushrooms are not the fish card', () => {
		const planted = { ...dish('Eggs Hussarde'), name: 'Planted dish', description: 'Grilled oyster mushrooms on toast', ingredients: [], parts: undefined } as HouseDish;
		const ids = deckLinks(planted, DECK).map((c) => c.id);
		const fish = DECK.find((c) => c.term === 'Oysters')!;
		expect(ids).not.toContain(fish.id);
		expect(ids).toContain(DECK.find((c) => c.term === 'Oyster Mushroom')!.id);
	});

	it('yield nothing for a name the data does not hold', () => {
		const planted = { ...dish('Eggs Hussarde'), name: 'Planted dish', description: 'Zzyzzx with qwphlarg', ingredients: [], parts: undefined } as HouseDish;
		expect(deckLinks(planted, DECK)).toEqual([]);
	});

	it('find the Library recipe for Bananas Foster and the Tarte Tatin, and honour a person’s own link', () => {
		expect(recipeLink(dish('World Famous Bananas Foster'), RECIPES)?.slug).toBe('bananas-foster');
		expect(recipeLink(dish('Pineapple Tarte Tatin'), RECIPES)?.name).toBe('Tarte Tatin');
		expect(recipeLink(dish('Eggs Hussarde'), RECIPES)).toBeNull();
		expect(recipeLink(dish('Eggs Hussarde'), RECIPES, 'bananas-foster')?.slug).toBe('bananas-foster');
	});

	it('name a primer by its level, never by its number alone', () => {
		const p = links(dish('Eggs Hussarde')).primers;
		for (const x of p) expect(x.label).toMatch(/^[A-Z][a-z]/);
	});
});

describe('verifier: every group is capped at six (docs/study-menus-design.md, 1.5)', () => {
	it('never draws more than six At the table links on a card (World Famous Bananas Foster has eight scenarios)', () => {
		for (const d of PACK.dishes) {
			const l = links(d);
			for (const g of [l.houseWords, l.deck, l.lexicon, l.techniques, l.primers, l.scenarios]) expect(g.length, d.name).toBeLessThanOrEqual(6);
		}
	});
	it('keeps the scenarios that name the fewest items, so the dish’s own wins over the generic ones', () => {
		const t = links(dish('World Famous Bananas Foster')).scenarios.map((x) => x.title);
		expect(t).toContain('Foster for one');
		expect(t).toContain('A birthday');
		expect(t).not.toContain('The tourist who wants the one thing');
		expect(t).not.toContain('Not drinking tonight');
	});
});
