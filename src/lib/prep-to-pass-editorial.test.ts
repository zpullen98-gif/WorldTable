import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import methodCards from '../../tools/derive/floor-deck/methods.mjs';

type Lesson = {
	slug: string;
	sections: { key: string; paras: string[] }[];
	cards: { stem: string; front: string; back: string }[];
	questions: { stem: string; answer: string; why: string }[];
	ratios: { label: string; value: string }[];
};
type Chapter = {
	entries: Lesson[];
	steps: { stem: string; entry: string; prompt: string; steps: string[]; why: string }[];
};
const chapter = (name: string): Chapter => JSON.parse(readFileSync(join(__dirname, '../../tools/derive/cuisine', `${name}.json`), 'utf8'));
const lesson = (name: string, slug: string) => chapter(name).entries.find(entry => entry.slug === slug)!;
const prose = (entry: Lesson) => entry.sections.flatMap(section => section.paras).join(' ');
const back = (entry: Lesson, stem: string) => entry.cards.find(card => card.stem === stem)!.back;

describe('Prep to Pass editorial consistency', () => {
	it('teaches refreshing as a preparation-ahead choice in the lesson, drill and active definition', () => {
		const entry = lesson('methods', 'boil-blanch-and-steam');
		expect(prose(entry)).toMatch(/immediate.*shocking may be unnecessary/i);
		expect(back(entry, 'refresh')).toMatch(/may not need shocking/i);
		const steps = chapter('methods').steps.find(step => step.stem === 'blanch-and-refresh-green-vegetables')!;
		expect(steps.prompt).toMatch(/later finish/);
		expect(steps.steps.join(' ')).toMatch(/testing a piece.*texture/);
		expect(steps.steps.join(' ')).not.toMatch(/set the colour/);
		const overrides = JSON.parse(readFileSync(join(__dirname, 'data/overrides.json'), 'utf8'));
		expect(overrides.lexiconDefinitions['blanch-and-shock'].definition).toMatch(/Shocking may be unnecessary/);
		expect(overrides.lexiconDefinitions['blanch-and-shock'].definition).not.toMatch(/sets chlorophyll|protects color/i);
		const card = methodCards.find(card => card.id === 'fd_0044')!;
		expect(card.why).toMatch(/immediate finishing or service may not need it/);
		expect(card.why).toMatch(/Test a piece for texture/);
		expect(`${card.guest} ${card.why} ${card.notThis}`).not.toMatch(/sets green|a minute or two|stops short/);
		const derived = JSON.parse(readFileSync(join(__dirname, 'data/floor-deck.json'), 'utf8'));
		expect(derived.cards.find((item: { id: string }) => item.id === card.id).why).toBe(card.why);
		expect(derived.cards.find((item: { id: string }) => item.id === card.id).prompt).toContain('__ almonds have their skins removed');
	});

	it('does not teach crust colour as a cooking endpoint or a pan lid as a commercial fryer fire response', () => {
		const entry = lesson('methods', 'frying');
		const response = entry.questions.find(question => question.stem === 'q-fire')!;
		expect(response.answer).toMatch(/alarm.*emergency procedure/i);
		expect(response.answer).not.toMatch(/lid|water|move/i);
		expect(response.why).toMatch(/trained.*escape route/i);
		const steps = chapter('methods').steps.find(step => step.stem === 'bread-and-fry-at-the-station')!;
		expect(steps.steps.join(' ')).toMatch(/verified cooking endpoint/);
		expect(steps.why).toMatch(/golden crust alone does not establish/i);
	});

	it('keeps emulsion texture separate from food holding controls and removes pan-touch temperature checks', () => {
		const entry = lesson('butter-emulsions', 'beurre-blanc');
		expect(prose(entry)).toMatch(/written procedure prepared in advance/);
		expect(prose(entry)).toMatch(/starting conditions, time marking and disposal/);
		expect(prose(entry)).toMatch(/not automatic permission/i);
		const steps = chapter('butter-emulsions').steps.find(step => step.stem === 'mount-a-beurre-blanc')!;
		expect(steps.steps.join(' ')).toMatch(/verified holding procedure.*measured conditions/);
		expect(steps.steps.join(' ')).not.toMatch(/pan feels|55 to 60/);
		expect(entry.ratios.map(ratio => ratio.value).join(' ')).toMatch(/batch size/);
	});

	it('uses choux consistency and structural drying instead of an unlimited-egg shortcut', () => {
		const entry = lesson('pastry', 'choux');
		expect(back(entry, 'panade')).toMatch(/More egg is not automatically better/);
		expect(back(entry, 'panade')).not.toMatch(/more egg gives a bigger puff/i);
		const why = chapter('pastry').steps.find(step => step.stem === 'make-pate-a-choux')!.why;
		expect(why).toMatch(/Steam expands.*structure/);
		expect(why).toMatch(/egg additions set consistency/);
	});

	it('distinguishes clear-syrup stages, New Orleans pralines and the brown-sugar Foster sauce', () => {
		const entry = lesson('pastry', 'caramel');
		expect(back(entry, 'stages')).toMatch(/clear syrup concentration/);
		expect(back(entry, 'stages')).toMatch(/caramel browning/);
		expect(prose(entry)).toMatch(/New Orleans pecan pralines are a different confection/);
		expect(back(entry, 'brennans')).toMatch(/brown sugar.*not a plain white-sugar colour standard/);
	});

	it('keeps the grit cake as a confirmed component without inventing its formula or a shrimp curl endpoint', () => {
		const entry = lesson('brennans', 'shrimp-and-grits');
		expect(back(entry, 'what')).toMatch(/fried pimento cheese grit cake/);
		expect(back(entry, 'ratio')).toMatch(/current formula.*controlled cooling/);
		expect(back(entry, 'grits')).toMatch(/not all grits are hominy grits/);
		expect(entry.ratios.map(ratio => ratio.value).join(' ')).not.toMatch(/1 to [45]|at least 2 hours/);
		const response = entry.questions.find(question => question.stem === 'q-shrimp')!;
		expect(response.answer).toMatch(/verified process.*thermometer/i);
		expect(response.answer).not.toMatch(/C shape|O shape|three minutes/);
		expect(back(entry, 'shrimp')).toMatch(/not a measurement/);
	});
});
