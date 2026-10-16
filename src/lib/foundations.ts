import data from './data/culinary-foundations.json';
import type { DeckCard, FloorDeck, LexiconEntry } from './types';
import { dayKey, type CookEntry } from './repertoire';

export interface FoundationSource { title: string; url: string }
export interface FoundationEntry {
	id: string; term: string; category: string; aliases: string[];
	ref?: string; relatedLexiconSlug?: string;
	definition?: string; guest?: string; kitchen?: string; compare?: string;
	correction?: string; sources: FoundationSource[]; reviewedOn?: string;
}
export const foundationsCategories = data.categories;
export const foundationsEntries: FoundationEntry[] = data.entries;
export const foundationRef = (entry: FoundationEntry): string => entry.ref || `u:${entry.id}`;
export const foundationEntryById = new Map(foundationsEntries.map(entry => [entry.id, entry]));
export const foundationEntryByRef = new Map(foundationsEntries.map(entry => [foundationRef(entry), entry]));

/** The original Floor Deck identity keeps its history. Other self-assessment
 * belongs to this collection and cannot promote a Lexicon term or a level. */
export function foundationLogKey(entry: FoundationEntry): string {
	return entry.ref?.startsWith('c:') ? entry.ref.slice(2) : `foundation:${entry.id}`;
}

export function foundationsMembers(deckId: string): string[] {
	if (deckId.startsWith('foundations:category:')) return foundationsEntries.filter(e => e.category === deckId.slice(21)).map(foundationRef);
	if (deckId.startsWith('foundations:item:')) {
		const entry = foundationEntryById.get(deckId.slice(17));
		return entry ? [foundationRef(entry)] : [];
	}
	return ['foundations', 'foundations:today', 'foundations:misses'].includes(deckId) ? foundationsEntries.map(foundationRef) : [];
}

export function foundationsDeckName(deckId: string): string {
	if (deckId === 'foundations:today') return 'Today’s culinary terms';
	if (deckId === 'foundations:misses') return 'Culinary terms to revisit';
	if (deckId.startsWith('foundations:category:')) return foundationsCategories.find(c => c.id === deckId.slice(21))?.title || 'Culinary terms';
	if (deckId.startsWith('foundations:item:')) return foundationEntryById.get(deckId.slice(17))?.term || 'One culinary term';
	return 'Your culinary terms';
}

function lastEntries(log: readonly CookEntry[], now: number): Map<string, CookEntry> {
	const out = new Map<string, CookEntry>();
	for (const record of log) {
		if (!Number.isFinite(record.at) || record.at > now) continue;
		const previous = out.get(record.slug);
		if (!previous || record.at >= previous.at) out.set(record.slug, record);
	}
	return out;
}

function interleave(entries: readonly FoundationEntry[]): FoundationEntry[] {
	const groups = foundationsCategories.map(category => entries.filter(entry => entry.category === category.id));
	const result: FoundationEntry[] = [];
	for (let round = 0; groups.some(group => round < group.length); round++) {
		for (const group of groups) if (group[round]) result.push(group[round]);
	}
	return result;
}

/** Ten manageable cards, without a level filter. Misses lead, followed by
 * unseen terms across categories, then older practice. The first judgement
 * of a local day stands; a reload does not rewrite or reset that record. */
export function foundationsPractice(log: readonly CookEntry[], now = Date.now(), limit = 10): string[] {
	const latest = lastEntries(log, now);
	const rank = (entry: FoundationEntry) => latest.get(foundationLogKey(entry));
	const studiedToday = (entry: FoundationEntry) => !!rank(entry) && dayKey(rank(entry)!.at) === dayKey(now);
	const missed = foundationsEntries.filter(entry => rank(entry)?.grade === 'missed' && !studiedToday(entry))
		.sort((a, b) => (rank(a)?.at ?? 0) - (rank(b)?.at ?? 0));
	const unseen = interleave(foundationsEntries.filter(entry => !rank(entry)));
	const older = foundationsEntries.filter(entry => rank(entry) && rank(entry)?.grade !== 'missed' && !studiedToday(entry))
		.sort((a, b) => (rank(a)?.at ?? 0) - (rank(b)?.at ?? 0));
	const today = foundationsEntries.filter(studiedToday).sort((a, b) => (rank(a)?.at ?? 0) - (rank(b)?.at ?? 0));
	return [...missed, ...unseen, ...older, ...today].slice(0, Math.max(0, limit)).map(foundationRef);
}

export function foundationRecordable(log: readonly CookEntry[], entry: FoundationEntry, now = Date.now()): boolean {
	const key = foundationLogKey(entry);
	return !log.some(record => record.slug === key && Number.isFinite(record.at) && record.at <= now && dayKey(record.at) === dayKey(now));
}

export function resolveFoundation(entry: FoundationEntry, deck?: FloorDeck | readonly DeckCard[] | null, lexicon?: readonly LexiconEntry[] | null) {
	const cards: readonly DeckCard[] = Array.isArray(deck) ? deck : (deck as FloorDeck | undefined)?.cards || [];
	const card = entry.ref?.startsWith('c:') ? cards.find(c => c.id === entry.ref?.slice(2)) : undefined;
	const lexical = entry.ref?.startsWith('t:') ? lexicon?.find(e => e.slug === entry.ref?.slice(2)) : undefined;
	return {
		term: entry.term, title: entry.term,
		definition: entry.definition || card?.gist || lexical?.definition || '',
		guest: entry.guest || card?.guest || '',
		kitchen: entry.kitchen || lexical?.prep || card?.why || '',
		compare: entry.compare || card?.notThis || '',
		correction: entry.correction || '', sources: entry.sources,
		background: card?.why || '', ref: foundationRef(entry)
	};
}
