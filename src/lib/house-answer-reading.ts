/** Answer-side reading only. All editorial marks must have been kept by a
 * person. These helpers never grade, write progress or infer a house recipe. */
import { isMark, type House, type HouseItem, type Mark, type ProducerProfile } from './house/house-schema';
import { shortWho, type DrillQuestion } from './house/house-drills';
import { explainAnswer } from './house-drill-round';
import type { MenuDish } from './persistence/state';
import type { Producer } from './producers';
import type { Question } from './menu-quiz';
import type { FallItem } from './fall-menu';

export interface AnswerSection { title: string; paragraphs: string[] }
export interface AnswerReading { title: string; sections: AnswerSection[]; links: { label: string; href: string }[] }
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const kept = <T>(mark?: Mark<T>): T | undefined => isMark(mark) && mark.by === 'person' ? mark.value as T : undefined;
const items = (house: House): HouseItem[] => [...house.dishes, ...house.wines, ...house.cocktails];
function add(reading: AnswerReading, title: string, ...values: unknown[]) {
	const existing = new Set(reading.sections.flatMap(section => section.paragraphs));
	const paragraphs = values.map(text).filter(value => value && !existing.has(value));
	if (paragraphs.length) reading.sections.push({ title, paragraphs: [...new Set(paragraphs)] });
}
function link(reading: AnswerReading, item: HouseItem) {
	// The Table owns dish reading. Wine and cocktail context stays in this
	// disclosure so following it does not take a learner into another app.
	if (item.kind === 'dish' && !reading.links.some(row => row.href === '/menu#' + item.id))
		reading.links.push({ label: 'Read ' + item.name, href: '/menu#' + item.id });
}
function profile(reading: AnswerReading, p?: ProducerProfile) {
	if (!p) return;
	add(reading, p.who, p.sayIt, p.where, p.founded ? 'Recorded founding: ' + p.founded : '', p.history, ...p.facts, ...p.notes);
	add(reading, 'Ask the team', ...p.askKitchen);
}
function itemContext(reading: AnswerReading, house: House, item: HouseItem, components = true) {
	add(reading, 'Describe ' + item.name, kept(item.guest), kept(item.lines)?.s45, item.kind === 'dish' ? item.description : '');
	const p = kept(item.parts);
	if (p) add(reading, 'How it comes together', ...Object.entries(p).map(([key, value]) => value ? key[0].toUpperCase() + key.slice(1) + ': ' + value : ''));
	add(reading, 'Why it matters', kept(item.why));
	add(reading, 'Origin and background', kept(item.origin));
	add(reading, 'Pronunciation', kept(item.say));
	if (item.kind === 'dish') {
		add(reading, 'Ingredients recorded by the house', ...item.ingredients);
		const pairing = kept(item.pairing);
		if (pairing) {
			const wine = house.wines.find(w => w.id === pairing.wineId);
			const zero = house.cocktails.find(c => c.id === pairing.zeroProofId);
			add(reading, 'The house pairing', wine?.name, pairing.sayIt, pairing.why, pairing.whyThisWine, pairing.palate, pairing.serve);
			add(reading, 'Without alcohol', zero?.name, pairing.zeroProofWhy);
		}
	} else if (item.kind === 'wine') {
		add(reading, 'The wine in the glass', kept(item.profile), item.producer, item.region, item.grapes.join(', '), item.style);
		add(reading, 'Serving and pairing', kept(item.serve), kept(item.goesWith));
	} else {
		add(reading, 'The recorded build', ...item.spec, item.method, item.glass ? 'Glass: ' + item.glass : '', item.garnish ? 'Garnish: ' + item.garnish : '', item.note);
	}
	add(reading, 'At the table', kept(item.lines)?.s20, kept(item.pairs));
	if (components) for (const component of house.components ?? []) {
		if (component.itemIds.includes(item.id)) add(reading, component.name, kept(component.explain));
	}
	link(reading, item);
}

/** A complete reading of the exact item, term, component, mix-up or scenario. */
export function houseAnswerReading(house: House, id: string): AnswerReading | null {
	const reading: AnswerReading = { title: '', sections: [], links: [] };
	const item = items(house).find(row => row.id === id);
	if (item) {
		reading.title = item.name;
		itemContext(reading, house, item);
	} else {
		const term = house.lexicon.find(row => row.id === id);
		const component = house.components?.find(row => row.id === id);
		const scenario = house.scenarios.find(row => row.id === id);
		const mix = house.mixUps.find(row => row.id === id);
		const tasting = house.tastings.find(row => row.id === id);
		if (term) {
			reading.title = term.term;
			add(reading, 'Explain it to a guest', kept(term.toGuest));
			add(reading, 'Pronunciation', kept(term.say));
			for (const c of house.components ?? []) if (c.termIds.includes(id)) add(reading, c.name, kept(c.explain));
			for (const it of items(house).filter(row => term.itemIds.includes(row.id))) link(reading, it);
		} else if (component) {
			reading.title = component.name;
			add(reading, 'The full explanation', kept(component.explain), kept(component.card)?.back);
			add(reading, 'Pronunciation', kept(component.say));
			profile(reading, kept(component.producer));
			for (const it of items(house).filter(row => component.itemIds.includes(row.id))) link(reading, it);
		} else if (scenario) {
			reading.title = scenario.title;
			add(reading, 'The guest’s question', scenario.guest);
			add(reading, 'The house response', kept(scenario.you));
			add(reading, 'The service principle', kept(scenario.principle));
			for (const it of items(house).filter(row => scenario.itemIds.includes(row.id))) itemContext(reading, house, it, false);
		} else if (mix) {
			const pair = items(house).filter(row => row.id === mix.aId || row.id === mix.bId);
			reading.title = pair.map(row => row.name).join(' and ');
			add(reading, 'What distinguishes them', kept(mix.difference));
			add(reading, 'The question to ask', kept(mix.ask));
			for (const it of pair) itemContext(reading, house, it, false);
		} else if (tasting) {
			reading.title = tasting.name;
			add(reading, 'The tasting journey', tasting.line, tasting.note, tasting.supplement);
			for (const course of tasting.courses) {
				const dishes = house.dishes.filter(row => course.dishIds.includes(row.id));
				add(reading, course.label || 'Course ' + course.n, dishes.map(row => row.name).join(course.choice ? ' or ' : ', '), ...(course.printed ?? []), course.pourText);
				for (const dish of dishes) link(reading, dish);
			}
		} else return null;
	}
	return reading;
}

export function drillAnswerReading(house: House, question: DrillQuestion): AnswerReading {
	const reading = houseAnswerReading(house, question.itemId) ?? { title: question.answer, sections: [], links: [] };
	const explanation = explainAnswer(house, question);
	if (explanation) reading.sections.unshift({ title: 'Why this answer fits', paragraphs: [explanation] });
	if (question.kind === 'firstPickFor' || question.kind === 'zeroProofFor') {
		reading.sections.unshift({ title: 'What this question tests', paragraphs: ['Recall the house’s recorded recommendation. Other pairings may work; this question does not mean every other drink is unsuitable.'] });
		const dish = house.dishes.find(row => row.id === question.itemId);
		const pairing = kept(dish?.pairing);
		const target = pairing && items(house).find(row => row.id === (question.kind === 'firstPickFor' ? pairing.wineId : pairing.zeroProofId));
		if (target) itemContext(reading, house, target, false);
	}
	if (question.kind === 'producerOf') {
		for (const c of house.components ?? []) {
			const p = kept(c.producer);
			if (c.itemIds.includes(question.itemId) && p && shortWho(p.who) === question.answer) profile(reading, p);
		}
	}
	return reading;
}

/** The old typed-menu quiz has a producer PLACE as target on some questions.
 * Resolve the subject id, never mistake that place for a dish id. */
export function menuAnswerReading(house: House | null, dishes: readonly MenuDish[], producers: readonly Producer[], question: Question, subjectId: string): AnswerReading {
	const id = subjectId.replace(/^(dish|producer):/, '');
	if (subjectId.startsWith('producer:')) {
		const producer = producers.find(p => p.id === id);
		const reading: AnswerReading = { title: producer?.name ?? question.target.name, sections: [], links: [] };
		if (producer) {
			add(reading, 'The producer’s story', producer.story);
			add(reading, 'Where and what they supply', producer.place, producer.supplies);
			for (const dish of dishes.filter(d => producer.dishIds.includes(d.id))) {
				add(reading, 'On the menu', dish.name + (dish.description ? ': ' + dish.description : ''));
				if (house?.dishes.some(d => d.id === dish.id)) reading.links.push({ label: 'Read ' + dish.name, href: '/menu#' + dish.id });
			}
		}
		return reading;
	}
	const rich = house && houseAnswerReading(house, id);
	const reading: AnswerReading = rich ?? { title: question.target.name, sections: [], links: [] };
	const dish = dishes.find(d => d.id === id);
	if (dish) {
		add(reading, 'The recorded description', dish.description);
		add(reading, 'Ingredients on the record', ...dish.ingredients);
		add(reading, 'Recorded price', dish.price);
	}
	if (question.kindLabel.includes('carries it')) add(reading, 'Before speaking to a guest', 'This answer recalls the checked notes on this device. Confirm the current recipe and cross-contact arrangements with the kitchen; a quiz is not an allergen clearance.');
	return reading;
}

export function fallAnswerReading(item: FallItem | undefined): AnswerReading | null {
	if (!item) return null;
	const reading: AnswerReading = { title: item.name, sections: [], links: [] };
	add(reading, 'Describe it to a guest', item.tableside, item.shortDescription);
	add(reading, 'Ingredients on the training sheet', ...item.listedIngredients);
	for (const ingredient of item.ingredientNotes) add(reading, ingredient.name, ingredient.explanation, ingredient.houseBoundary);
	add(reading, 'Origin and background', ...item.originNotes.map(note => note.text));
	add(reading, 'Confirm for service', ...item.serviceChecks);
	reading.links.push({ label: 'Read the fall field note', href: '/menu?view=fall&kind=' + item.kind + '&item=' + encodeURIComponent(item.id) });
	return reading;
}
