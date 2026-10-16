import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { refreshEdition } from './house/house-pack';
import { drillableCount } from './house/house-drills';
import type { House } from './house/house-schema';

const path = fileURLToPath(new URL('../../static/shared/packs/brennans-new-orleans.v1.oothouse.json', import.meta.url));
const house = JSON.parse(readFileSync(path, 'utf8')).house as House;
const wine = (id: string, h = house) => h.wines.find(w => w.id === id)!;
const text = (value: unknown) => JSON.stringify(value);

describe('Brennan’s reviewed wine labels and service', () => {
	it('keeps both 2010 Rubicon identities while teaching the estate blend and condition-led service', () => {
		for (const id of ['w-4qmphesw', 'w-hcewiwtc']) {
			const w = wine(id);
			expect(w.vintage).toBe('2010');
			expect(w.grapes).toEqual(['Cabernet Sauvignon', 'Cabernet Franc', 'Petit Verdot', 'Merlot']);
			expect(w.profile!.value).toContain('86 percent Cabernet Sauvignon, 6 percent Cabernet Franc, 5 percent Petit Verdot and 3 percent Merlot');
			expect(w.profile!.value).toContain('released in September 2013');
			expect(w.serve!.value).toContain('stop when sediment approaches the neck');
			expect(text(w)).not.toMatch(/87 percent|sixteen years in bottle|last inch|thirty minutes|silky with age/i);
		}
		expect(wine('w-4qmphesw').price).toBe('$70 glass');
		expect(wine('w-hcewiwtc').price).toBe('$360');
		expect(wine('w-hcewiwtc').bin).toBe('18231');
	});
	it('keeps current cuvée information separate from an unverified vintage-specific recipe', () => {
		const minuty = wine('w-fesbm1v5');
		expect(minuty.grapes).toEqual([]);
		expect(minuty.serviceNote).toContain('Grenache, Syrah, Rolle and Cinsault');
		expect(minuty.serviceNote).toContain('not a verified recipe for the saved 2024 vintage');
		expect(house.components!.find(c => c.name === 'Grenache')!.itemIds).not.toContain(minuty.id);
		expect(text(minuty.compare)).not.toContain('Whispering Angel adds');
		const banyuls = wine('w-69pqytkm');
		expect(banyuls.grapes).toEqual(['Grenache Noir', 'Grenache Gris', 'Carignan']);
		expect(banyuls.serviceNote).toContain('80 percent Grenache Noir, 15 percent Grenache Gris and 5 percent Carignan');
		expect(banyuls.serviceNote).toContain('not confirmation of the restaurant bottle');
		expect(banyuls.serve!.value).toContain('assess its condition before each service');
		expect(text(banyuls)).not.toMatch(/keeps for weeks|softer and less strong/);
		expect(banyuls.compare!.value[1].different).toContain('1997 Portuguese harvest');
	});
	it('removes contradictory Extra Brut definitions from every wine and component surface', () => {
		const all = text([house.wines, house.components]);
		expect(all).not.toMatch(/Drier than Brut:|Extra Brut has less added sugar|Extra Brut[,:] (?:so |meaning )?very little sugar is added|Extra Brut, with very little sugar added|rounder than (?:our |the )?Extra Brut/);
		for (const id of ['w-s3ih8iz8', 'w-tmm38vzi']) {
			expect(wine(id).kept!.find(n => n.q === 'What do guests ask?')!.a).toContain('the ranges overlap');
		}
		expect(wine('w-a7np8xs9').profile!.value).toContain('neither name proves');
		for (const id of ['w-dbz9e960', 'w-8t8kp5ey']) {
			expect(text(wine(id))).toContain('exact bottling and blend');
			expect(wine(id).grapes).toEqual([]);
			for (const component of house.components!.filter(c => ['Chardonnay', 'Pinot Noir', 'Meunier'].includes(c.name))) {
				expect(component.itemIds).not.toContain(id);
			}
		}
		const unverified = structuredClone(house);
		for (const id of ['w-dbz9e960', 'w-8t8kp5ey']) wine(id, unverified).grapes = ['Pinot Noir', 'Meunier', 'Chardonnay'];
		expect(drillableCount(house, 'wineGrapes')).toBe(drillableCount(unverified, 'wineGrapes') - 2);
	});
	it('leaves Rare’s saved vintage intact and confirms the open bottle before making a guest promise', () => {
		const glass = wine('w-t1pktzym');
		expect(glass.name).toBe('Rare Brut 2012 (Coravin)');
		expect(glass.vintage).toBe('2012');
		expect(glass.price).toBe('$75 glass');
		expect(glass.lines!.value.s10).toContain('confirm the vintage');
		expect(glass.lines!.value.s10).not.toContain('2012');
		expect(wine('w-gcoxn5b8').compare!.value[0].different).toContain('read the open bottle');
	});
	it('distinguishes Fichet’s foundation from the next generation joining', () => {
		const w = wine('w-w23cntcx');
		expect(w.profile!.value).toContain('founded by Francis Fichet in 1976');
		expect(w.profile!.value).toContain('Pierre Yves joined in 1988');
		expect(text(w)).not.toMatch(/formed in 1988|domaine dates to 1988/);
	});
	it('updates edition-owned notes while retaining a personal note and profile', () => {
		const previous = structuredClone(house);
		const stamp = Date.parse(previous.pack!.builtAt);
		const older = Date.parse('2026-10-12T05:00:00.000Z');
		function restamp(value: unknown): unknown {
			if (value === stamp) return older;
			if (Array.isArray(value)) return value.map(restamp);
			if (value && typeof value === 'object') {
				for (const key of Object.keys(value)) {
					const object = value as Record<string, unknown>;
					object[key] = restamp(object[key]);
				}
			}
			return value;
		}
		restamp(previous);
		previous.pack!.builtAt = new Date(older).toISOString();
		const w = wine('w-4qmphesw', previous);
		w.profile = { value: 'My tasting note from lineup.', by: 'person', ts: older + 1000 };
		w.kept!.push({ q: 'My preservation note', a: 'Ask our sommelier before the first pour.', ts: older + 1000 });
		w.kept!.find(n => n.q === 'Tell me about it.')!.a = 'Old blend and service guidance.';
		const updated = refreshEdition(previous, house).house;
		expect(wine(w.id, updated).profile).toEqual(w.profile);
		expect(wine(w.id, updated).kept).toContainEqual(w.kept!.find(n => n.q === 'My preservation note'));
		expect(wine(w.id, updated).kept!.find(n => n.q === 'Tell me about it.')).toEqual(wine(w.id).kept!.find(n => n.q === 'Tell me about it.'));
	});
});
