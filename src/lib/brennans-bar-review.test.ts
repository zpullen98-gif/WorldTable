import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { refreshEdition } from './house/house-pack';
import type { House } from './house/house-schema';

const path = fileURLToPath(new URL('../../static/shared/packs/brennans-new-orleans.v1.oothouse.json', import.meta.url));
const house = JSON.parse(readFileSync(path, 'utf8')).house as House;
const drink = (id: string, h = house) => h.cocktails.find(d => d.id === id)!;
const component = (id: string, h = house) => h.components!.find(c => c.id === id)!;
const note = (id: string, question: string, h = house) => drink(id, h).kept!.find(n => n.q === question)!.a;
const text = (value: unknown) => JSON.stringify(value);

describe('Brennan’s reviewed bar facts and service boundaries', () => {
	it('distinguishes a product technical sheet from the saved Chandon house specification', () => {
		const spritz = drink('b-o4yfzgkn');
		expect(spritz.name).toBe('Chandon Garden Spritz');
		expect(spritz.spec).toEqual(['bitter orange liqueur', 'Chandon Brut sparkling wine']);
		const chandon = component('c-uk2f0dw5');
		expect(chandon.explain!.value).toMatch(/Argentine|Argentina/);
		expect(chandon.explain!.value).toMatch(/second fermentation[^.]*tank/);
		expect(chandon.explain!.value).toContain('Long Charmat');
		expect(chandon.explain!.value).toMatch(/not confirmation[^.]*Brennan/);
		expect(chandon.producer!.value.askKitchen!.join(' ')).toMatch(/separate ingredients[^?]*prepared bottle/);
		// The forty-five says what the menu prints and claims neither a build nor a prepared bottle;
		// the open question is the bar's at lineup.
		expect(spritz.lines!.value.s45).toMatch(/bitter orange liqueur with Chandon Brut/);
		expect(spritz.lines!.value.s45).not.toMatch(/ready to serve|ready made|prepared|we build|built at the bar|bottled spritz/i);
		expect(house.askAtLineup!.some(a => a.itemIds.includes(spritz.id) && /built at the bar or poured ready made/.test(a.question))).toBe(true);
		expect(text(spritz.compare)).not.toMatch(/both[^.]*traditional method|same[^.]*bottle fermentation/i);
	});

	it('keeps wine aperitifs distinct from liqueurs without rewriting the printed menu', () => {
		const riviera = drink('b-e6zfgyhu');
		expect(riviera.spec).toEqual(['Lillet Blanc', 'sparkling wine', 'lemon']);
		const comparison = riviera.compare!.value.find(c => c.ref === 'Kir Royale')!;
		expect(comparison.different).toMatch(/cassis, a liqueur/);
		expect(comparison.different).toMatch(/Lillet Blanc, a wine aperitif/);
		const spoonbill = drink('b-h6w1b886');
		expect(spoonbill.spec).toContain('Cap Corse Mattei Blanc Quinquina vermouth');
		expect(component('c-6n3zqcs3').explain!.value).toMatch(/strictly it is a quinquina/);
	});

	it('teaches that the listed Kahlua supplies caffeine even without additional coffee', () => {
		const espresso = drink('b-z5ckwig5');
		expect(espresso.spec).toEqual(['chicory', 'vodka', 'Frangelico', 'Kahlua']);
		const questions = note(espresso.id, 'What do guests ask?');
		expect(questions).toMatch(/Kahlua[^.]*contains caffeine/);
		expect(questions).toMatch(/total depends on the measures[^.]*additional coffee/i);
		expect(note(espresso.id, 'What should I watch for?')).toMatch(/contains caffeine, even if[^.]*no additional coffee/);
		const kahlua = component('c-l3o229y4');
		expect(kahlua.card!.value.back).toMatch(/contains caffeine/);
		expect(kahlua.card!.value.back).toMatch(/Confirm measures[^.]*total/);
		expect(kahlua.producer!.value.notes.join(' ')).toMatch(/Kahlua contains caffeine/);
		expect(text(espresso)).not.toMatch(/caffeine depends on whether|caffeine free if|if[^.]*chicory alone[^.]*caffeine free/i);
	});

	it('acknowledges published Milk Punch recipes without importing their measures or promising egg absence', () => {
		const punch = drink('b-c0ei23l2');
		expect(punch.spec).toEqual(['Brandy', 'heavy cream', 'vanilla bean', 'nutmeg']);
		const recipe = note(punch.id, 'Is there a published recipe?');
		expect(recipe).toMatch(/Published recipes[^.]*Brennan/);
		expect(recipe).toContain('Explore Louisiana');
		expect(recipe).toMatch(/not a measured current bar build/);
		expect(note(punch.id, 'What should I watch for?')).toMatch(/do not infer egg absence/i);
		expect(component('c-o3pqo0qs').explain!.value).toMatch(/published version, not today/);
		expect(text(punch)).not.toMatch(/never published|no published recipe|eggnog without (?:the )?eggs?|ours (?:has|contains) no eggs?/i);
	});

	it('does not turn clarification into a milk absence or storage guarantee', () => {
		const prisoner = drink('b-0ro4u0qk');
		expect(prisoner.spec).toContain('clarified heavy cream');
		expect(prisoner.parts!.value.technique).toMatch(/process[^;]*not supplied/);
		expect(note(prisoner.id, 'What do guests ask?')).toMatch(/Clarification does not establish milk absence/);
		expect(note(prisoner.id, 'What should I watch for?')).toMatch(/do not promise[^.]*extended holding time/);
		expect(component('c-o3pqo0qs').card!.value.back).toMatch(/never assume milk absence or shelf life/);
		expect(text(prisoner)).not.toMatch(/cream is removed|dairy is removed|milk is removed|keeps for (?:weeks|months)|shelf stable/i);
	});

	it('does not rank the strength of unmeasured drinks by their ingredient categories', () => {
		const ralph = drink('b-strzgc5a');
		const riviera = drink('b-e6zfgyhu');
		expect(note(ralph.id, 'What do guests ask?')).toMatch(/cannot rank[^.]*ingredient list/);
		expect(note(riviera.id, 'What do guests ask?')).toMatch(/check the actual measures before comparing strength/);
		expect(text([ralph, riviera])).not.toMatch(/gentlest|lightest|less strong|weaker than|lower in alcohol than/i);
		expect(text(ralph.compare)).toContain('without inferring absence');
	});

	it('does not infer beef absence from a Bloody Mary menu description', () => {
		const mary = drink('b-vvhi9iji');
		expect(mary.spec).toEqual(['housemade Bloody Mary mix', 'vodka', 'pickled okra', 'spicy beans']);
		expect(note(mary.id, 'What do guests ask?')).toMatch(/does not establish beef absence/);
		expect(note(mary.id, 'What should I watch for?')).toMatch(/complete mix recipe before recommending/);
		expect(text(mary)).not.toMatch(/rather skip beef|without (?:the )?beef|no beef|beef free|beef-free/i);
		const bull = drink('b-xid4q2qi');
		expect(bull.why!.value).toMatch(/confirm another drink's complete recipe/i);
		expect(bull.why!.value).not.toMatch(/Mary[^.]*without beef|Mary[^.]*beef free/i);
	});

	it('refreshes edition guidance while retaining personal notes, timed lines, formula and producer profile', () => {
		const previous = structuredClone(house);
		const stamp = Date.parse(previous.pack!.builtAt);
		const older = Date.parse('2026-10-15T22:00:00.000Z');
		function restamp(value: unknown): unknown {
			if (value === stamp) return older;
			if (Array.isArray(value)) return value.map(restamp);
			if (value && typeof value === 'object') {
				const object = value as Record<string, unknown>;
				for (const key of Object.keys(object)) object[key] = restamp(object[key]);
			}
			return value;
		}
		restamp(previous);
		previous.pack!.builtAt = new Date(older).toISOString();
		const espresso = drink('b-z5ckwig5', previous);
		espresso.parts = { ...espresso.parts!, value: { ...espresso.parts!.value, technique: 'My confirmed preparation from lineup.' }, by: 'person', ts: older + 1000 };
		espresso.lines = { ...espresso.lines!, value: { ...espresso.lines!.value, s10: 'My practised guest description.' }, by: 'person', ts: older + 1000 };
		espresso.kept!.push({ q: 'My lineup note', a: 'Ask about the current coffee preparation.', ts: older + 1000 });
		espresso.kept!.find(n => n.q === 'What do guests ask?')!.a = 'Old caffeine advice to replace.';
		const kahlua = component('c-l3o229y4', previous);
		kahlua.producer = { ...kahlua.producer!, value: { ...kahlua.producer!.value, notes: ['My bottle observations from lineup.'] }, by: 'person', ts: older + 1000 };
		const before = text(previous);
		const updated = refreshEdition(previous, house).house;
		const refreshed = drink(espresso.id, updated);
		expect(refreshed.parts).toEqual(espresso.parts);
		expect(refreshed.lines).toEqual(espresso.lines);
		expect(refreshed.kept).toContainEqual(espresso.kept!.find(n => n.q === 'My lineup note'));
		expect(note(espresso.id, 'What do guests ask?', updated)).toEqual(note(espresso.id, 'What do guests ask?'));
		expect(component(kahlua.id, updated).producer).toEqual(kahlua.producer);
		expect(component(kahlua.id, updated).card).toEqual(component(kahlua.id).card);
		expect(updated.cocktails.map(d => d.id)).toEqual(house.cocktails.map(d => d.id));
		expect(updated.pack!.builtAt).toBe(house.pack!.builtAt);
		expect(text(previous)).toBe(before);
	});
});
