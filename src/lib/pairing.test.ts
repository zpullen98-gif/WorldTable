import { describe, it, expect } from 'vitest';
import { derivePairing } from '../../tools/derive/pairing.mjs';
import { costBlob } from '../../tools/derive/cost.mjs';

interface R {
	n: string;
	c: string;
	i: string[];
	m: string[];
	p: string;
	k: string;
	v: number;
}

/** The blob pairing.mjs is meant to run on now: name+chapter+ingredients+method, no note. */
const narrowBlob = (r: R) => costBlob(r);
/** What it used to run on. */
const wideBlob = (r: R) => `${narrowBlob(r)} ${r.p}`.toLowerCase();
/** _CELLAR/_BOTTLE_NOTES are unused by derivePairing; no fixture needs real ones. */
const pairFor = (r: R, blob: string) => derivePairing(r, blob, null, null);

/**
 * `has()` matched bare substrings, so a longer word carrying one as an infix
 * or suffix triggered a branch that had nothing to do with the dish. Every
 * fixture below is real corpus text; the point is that with the note
 * stripped OUT (isolating the boundary fix alone), the buried keyword no
 * longer decides the pour.
 */
describe('has() does not match a keyword buried inside a longer word', () => {
	it('does not read "ham" inside "Champ" (its own name) as pork', () => {
		const r: R = {
			n: 'Champ',
			c: 'Irish',
			k: 'Side',
			v: 1,
			i: [
				'1kg floury potatoes',
				'1 big bunch spring onions (scallions), sliced fine',
				'200ml milk',
				'100g butter',
				'Salt, white pepper'
			],
			m: [
				'Boil potatoes; drain and steam-dry in the pot.',
				'Simmer scallions in the milk 3 min: the milk turns green-sweet.',
				'Mash potatoes; beat in the scallion milk and half the butter till fluffy.',
				'Mound, crater, remaining butter in the crater. Eat from the outside in.'
			],
			p: ''
		};
		// The genuine 'milk' still trips the pork branch's apple/fennel/milk
		// sub-choice under the OLD bug too, so the regression test is that it
		// no longer reads as PORK AT ALL - it should land on the herb-fresh /
		// vegetarian branch instead.
		expect(pairFor(r, narrowBlob(r)).pour).not.toBe('Chenin Blanc (Vouvray sec)');
	});

	it('does not read "ham" inside "béchamel" (its own name) as pork', () => {
		const r: R = {
			n: 'Sauce Béchamel',
			c: 'The Saucier',
			k: 'Sauce',
			v: 1,
			i: [
				'50g butter + 50g flour: equal weights, the white roux',
				'600ml whole milk, warm',
				'1 bay leaf, ½ onion studded with 2 cloves (the onion piqué, old school, still correct)',
				'Nutmeg, a whisper; salt, white pepper'
			],
			m: [
				'Melt butter; flour in; cook the roux 2 min, foaming, NOT coloring: white sauce, white roux.',
				'Warm milk in thirds, whisking each addition smooth before the next: lumps are just dry pockets ambushed by liquid.',
				'Onion piqué and bay in; simmer gently 8–10 min, stirring the corners: flour needs time to lose its rawness.',
				'Season with nutmeg, salt, white pepper; strain.'
			],
			p: ''
		};
		expect(pairFor(r, narrowBlob(r)).pour).not.toBe('Chenin Blanc (Vouvray sec)');
	});

	it('does not read "sole" inside "posole" as fish', () => {
		const r: R = {
			n: 'New Mexico Posole',
			c: 'New Mexico',
			k: 'Soup',
			v: 0,
			i: [
				'500g dried posole (hominy) or 2 cans hominy',
				'800g pork shoulder, cubed',
				'1 onion, diced',
				'6 garlic cloves',
				'4 dried red chiles, or 6 green chiles for green posole'
			],
			m: [
				'If using dried posole, simmer it 2-3 hours until the kernels burst open like flowers.',
				'Brown the pork, then add the onion and garlic and cook until soft.',
				'Add the posole and stock and simmer 90 min until the pork is tender.'
			],
			p: ''
		};
		// A genuine 'pork shoulder' is present, so once "sole" stops forcing the
		// lean-fish branch, this should correctly land on pork.
		const pour = pairFor(r, narrowBlob(r)).pour;
		expect(pour).not.toBe('Vermentino or Sauvignon Blanc');
		expect(pour).toBe('Riesling or Grenache');
	});

	it('does not read "lamb" inside "Flambée" as lamb', () => {
		// Flammekueche: a bacon-and-cream Alsatian tart with no lamb, pork word,
		// beef word or fish word anywhere in it - the only trigger for any
		// meat/fish branch was the collision itself.
		const r: R = {
			n: 'Flammekueche (Tarte Flambée)',
			c: 'Alsace & the North',
			k: 'Starter',
			v: 0,
			i: [
				'250 g plain flour',
				'200 g fromage blanc, drained 2 hours in a sieve',
				'100 g thick crème fraîche',
				'150 g smoked lardons',
				'1 large onion, sliced paper thin'
			],
			m: [
				'Work flour, water, oil and salt to a smooth dough.',
				'Beat the drained fromage blanc with the crème fraîche, nutmeg and pepper.',
				'Scatter the raw lardons and the onion in a single sparse layer.',
				'Bake 6 to 8 minutes, until the rim is blistered black in patches.'
			],
			p: ''
		};
		expect(pairFor(r, narrowBlob(r)).pour).not.toBe(
			'Cabernet or Rioja Reserva' // the lamb branch's non-Spanish, non-spiced default
		);
	});

	it('still catches the genuine word when it is not buried in a longer one', () => {
		const r: R = {
			n: 'Jambon-Beurre',
			c: 'French',
			k: 'Starter',
			v: 0,
			i: ['1 baguette', '4 slices ham', '40g butter'],
			m: ['Split the baguette, butter it generously, layer in the ham.'],
			p: ''
		};
		expect(pairFor(r, narrowBlob(r)).pour).toBe('Riesling or Grenache'); // entered the pork branch
	});
});

/**
 * 'milk' is the one deliberate exception: a left boundary would reject it
 * inside "buttermilk" (a SUFFIX collision, the opposite shape from the
 * prefix collisions above), and buttermilk cornbread genuinely wants the
 * fruitier pork pour.
 */
describe('milk stays a bare match, for buttermilk', () => {
	it('still reads buttermilk as milk, for the pork branch sub-choice', () => {
		const r: R = {
			n: 'Skillet Cornbread',
			c: 'American',
			k: 'Bread',
			v: 1,
			i: [
				'240g cornmeal (+ 60g flour, or go 100% corn, Southern-style)',
				'1 tbsp baking powder, ½ tsp soda, 1 tsp salt',
				'2 eggs, 400ml buttermilk',
				'80g butter or bacon fat, melted in the skillet'
			],
			m: [
				'Put the empty cast-iron skillet in a 220°C oven with the fat.',
				'Whisk wet into dry just barely.',
				'Pour batter into the screaming-hot fat: it must sizzle on contact.',
				'Bake 20–22 min; flip out crust-side up.'
			],
			p: ''
		};
		expect(pairFor(r, narrowBlob(r)).pour).toBe('Chenin Blanc (Vouvray sec)');
	});
});

/**
 * costBlob, not the note-bearing blob: the note is editorial prose about the
 * dish, the same line cost.mjs already draws. A negation in the note ("no
 * lobster necessary") used to move the pour on a word the recipe itself
 * never asks for.
 */
describe('the note cannot move the pour', () => {
	it('does not read a negated ingredient out of the note', () => {
		const r: R = {
			n: 'Bouillabaisse',
			c: 'Provençal',
			k: 'Main',
			v: 0,
			i: [
				'1.5kg mixed rockfish and firm fish (red mullet, monkfish, sea bass, gurnard)',
				'2 leeks, 1 fennel bulb, 4 tomatoes, 6 garlic cloves, saffron, thyme, bay',
				'150ml olive oil'
			],
			m: [
				'Make the base: sweat leeks, fennel, tomato and garlic in olive oil; add fish heads/bones, saffron, water to cover; boil hard 25 min.',
				'Poach the fish in the broth in order of firmness.'
			],
			p: 'No lobster necessary; the rockfish variety does the talking.'
		};
		const narrow = pairFor(r, narrowBlob(r)).pour;
		const wide = pairFor(r, wideBlob(r)).pour;
		expect(narrow).not.toBe(wide);
		expect(narrow).not.toBe('Albariño'); // the shellfish branch the negated note used to trigger
	});

	it('does not read a comparison to a different food out of the note', () => {
		const r: R = {
			n: 'South Dakota Pheasant with Cream Gravy',
			c: 'South Dakota',
			k: 'Main',
			v: 0,
			i: ['2 pheasants, cut in pieces', '250ml buttermilk', '200g flour', 'Oil and butter for frying'],
			m: [
				'Soak the pheasant in buttermilk 1 hour.',
				'Dredge in seasoned flour.',
				'Brown in oil and butter, then cover and cook gently 25-30 min.'
			],
			p: 'Pheasant is far leaner than chicken, so baste it well.'
		};
		const narrow = pairFor(r, narrowBlob(r)).pour;
		const wide = pairFor(r, wideBlob(r)).pour;
		expect(narrow).not.toBe(wide);
		expect(narrow).not.toBe('Chardonnay (village Burgundy)'); // the chicken branch the note comparison used to trigger
	});
});
