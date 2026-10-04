/**
 * The House's videos: the link rule, the optional list, the merge by id and
 * newer stamp, the validator's refs and caps, the pack round trip and the
 * edition refresh. A video is a link out and never a player; the engine
 * checks the link against one scheme and three hosts and never fetches it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { KEYS, VIDEO_HOSTS, VIDEO_SCHEME, VIDEO_TOPIC_NONE, VIDEO_WHY_WORDS, emptyHouse, videoGroups, videoMeta, videoUrlOk, videosFor } from './house-schema';
import type { House, HouseVideo } from './house-schema';
import { FORBIDDEN_KEY, normaliseHouse } from './house-normalise';
import { validateHouse } from './house-validate';
import { mergeHouse, sameJson } from './house-merge';
import { buildPack, readPack, refreshEdition } from './house-pack';

const fixture: House = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/house-min.json', import.meta.url)), 'utf8'));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const NOW = 1790800000000;

/** A fixed random source, so a re-minted id is the same on every run. */
function seeded(seed = 1): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function video(over: Partial<HouseVideo> = {}): HouseVideo {
	return { ...clone(fixture.videos![0]), ...over };
}

describe('the link rule', () => {
	it('takes the secure scheme on the three hosts and names under them, and nothing else', () => {
		expect(VIDEO_SCHEME).toBe('https');
		expect([...VIDEO_HOSTS]).toEqual(['youtube.com', 'youtu.be', 'vimeo.com']);
		for (const ok of [
			'https://www.youtube.com/watch?v=QiGTSlzPh2E',
			'https://youtube.com/watch?v=QiGTSlzPh2E',
			'https://m.youtube.com/watch?v=QiGTSlzPh2E',
			'https://youtu.be/QiGTSlzPh2E',
			'https://vimeo.com/12345',
			'https://player.vimeo.com/video/12345'
		]) expect(videoUrlOk(ok), ok).toBe(true);
		for (const bad of [
			'http://www.youtube.com/watch?v=QiGTSlzPh2E',
			'https://youtube.com.example.org/watch',
			'https://notyoutube.com/watch',
			'https://user@youtube.com/watch',
			'https://www.youtube.com:8443/watch',
			'https://www.youtube.com/watch?v=a b',
			'javascript:alert(1)',
			'//www.youtube.com/watch',
			'',
			'https://www.youtube.com/' + 'x'.repeat(600),
			null,
			7
		]) expect(videoUrlOk(bad), String(bad)).toBe(false);
	});

	it('no key of the shape is one the client sweep refuses (the length is mins for that reason)', () => {
		for (const k of KEYS.HouseVideo) expect(FORBIDDEN_KEY.test(k), k).toBe(false);
		expect(FORBIDDEN_KEY.test('minutes')).toBe(true);
	});
});

describe('the normaliser', () => {
	it('carries the fixture video as it stands, and leaves the list out of a house that has none', () => {
		const { house, report } = normaliseHouse(clone(fixture), { rand: seeded() });
		expect(report).toEqual([]);
		expect(house.videos).toEqual(fixture.videos);
		const bare = clone(fixture) as Partial<House>;
		delete bare.videos;
		const out = normaliseHouse(bare, { rand: seeded() }).house;
		expect('videos' in out).toBe(false);
		expect('videos' in normaliseHouse({ ...clone(fixture), videos: [] }, { rand: seeded() }).house).toBe(false);
		expect('videos' in emptyHouse('h-abcdefgh', 'x', 'hand', NOW)).toBe(false);
	});

	it('drops a video whose link is not a video link, says so, and gives it no id', () => {
		const h = clone(fixture);
		h.videos = [video({ id: 'v-badlink1', url: 'http://www.youtube.com/watch?v=x' }), video({ id: 'v-second01', url: 'https://youtu.be/abc' })];
		const { house, report } = normaliseHouse(h, { rand: seeded() });
		expect(house.videos!.map((v) => v.id)).toEqual(['v-second01']);
		expect(report).toEqual([{ path: 'house.videos[0].url', code: 'video', said: expect.stringContaining('was dropped') }]);
		const none = clone(fixture);
		none.videos = [video({ url: 'https://example.org/x' })];
		expect('videos' in normaliseHouse(none, { rand: seeded() }).house).toBe(false);
	});

	it('brings each field to its shape: a bad length is 0, the flag a flag, a stray key gone, a wrong prefix re-minted', () => {
		const h = clone(fixture);
		h.videos = [{ ...video(), id: 'q-wrong001', mins: -3, house: 'yes', extra: 'drop me', itemIds: ['d-chicken1', 4, ''] } as unknown as HouseVideo];
		const { house, report } = normaliseHouse(h, { rand: seeded() });
		const v = house.videos![0];
		expect(v.mins).toBe(0);
		expect(v.house).toBe(false);
		expect(Object.keys(v).sort()).toEqual([...KEYS.HouseVideo].sort());
		expect(v.itemIds).toEqual(['d-chicken1']);
		expect(v.id).toMatch(/^v-[0-9a-z]{8}$/);
		expect(report.some((r) => r.path === 'house.videos[0].id' && r.code === 'id')).toBe(true);
	});

	it('points a video at an item or a term that was re-minted', () => {
		const h = clone(fixture);
		h.dishes[0].id = 'bad id:one';
		h.lexicon[1].id = 'bad|term';
		h.videos![0].itemIds = ['bad id:one'];
		h.videos![0].termIds = ['bad|term'];
		const { house } = normaliseHouse(h, { rand: seeded(5) });
		expect(house.videos![0].itemIds).toEqual([house.dishes[0].id]);
		expect(house.videos![0].termIds).toEqual([house.lexicon[1].id]);
	});
});

describe('the validator', () => {
	it('finds nothing to say about the fixture video', () => {
		expect(validateHouse(normaliseHouse(clone(fixture), { rand: seeded() }).house)).toEqual({ problems: [], fatalCount: 0 });
	});

	it('names an item or a term that is not in the house, a long why, a missing title or why, and a bad link on a house nobody normalised', () => {
		const h = clone(fixture);
		const words = Array.from({ length: VIDEO_WHY_WORDS + 1 }, (_, i) => 'w' + i).join(' ');
		h.videos = [
			video({ itemIds: ['d-nowhere1'], termIds: ['x-nowhere1', 'd-chicken1'] }),
			video({ id: 'v-second01', why: words }),
			video({ id: 'v-third001', title: ' ', why: '' }),
			video({ id: 'v-fourth01', url: 'https://example.org/x' })
		];
		const { problems, fatalCount } = validateHouse(h);
		const by = (code: string) => problems.filter((p) => p.code === code).map((p) => p.path);
		expect(by('ref')).toEqual(['house.videos[0].itemIds[0]', 'house.videos[0].termIds[0]', 'house.videos[0].termIds[1]']);
		expect(by('word-cap')).toEqual(['house.videos[1].why']);
		expect(by('video')).toEqual(['house.videos[2].title', 'house.videos[2].why', 'house.videos[3].url']);
		expect(fatalCount).toBe(problems.length);
	});

	it('holds a dash in a title to the house rule like any other string', () => {
		const h = clone(fixture);
		h.videos![0].title = 'Salt Baking ' + String.fromCharCode(0x2014) + ' the Crust';
		expect(validateHouse(h).problems.map((p) => p.code)).toEqual(['dash']);
	});
});

describe('the merge', () => {
	it('settles a video by id on the newer stamp and carries one only one side holds', () => {
		const mine = clone(fixture);
		const theirs = clone(fixture);
		theirs.videos![0] = { ...theirs.videos![0], title: 'Retitled', ts: theirs.videos![0].ts + 1 };
		theirs.videos!.push(video({ id: 'v-theirs01', house: true }));
		const { house, counts } = mergeHouse(mine, theirs);
		expect(house.videos!.map((v) => [v.id, v.title])).toEqual([['v-saltbak1', 'Retitled'], ['v-theirs01', fixture.videos![0].title]]);
		expect(counts.updated).toBe(1);
		expect(counts.added).toBe(1);
		const older = clone(fixture);
		older.videos![0] = { ...older.videos![0], title: 'Older', ts: older.videos![0].ts - 1 };
		expect(mergeHouse(clone(fixture), older).house.videos![0].title).toBe(fixture.videos![0].title);
	});

	it('never re-stamps the house flag with a house id, whichever house it joins', () => {
		const theirs = clone(fixture);
		theirs.id = 'h-otherone';
		theirs.videos![0].house = true;
		const { house } = mergeHouse({ ...clone(fixture), videos: [] } as House, theirs);
		expect(house.videos![0].house).toBe(true);
		expect(house.dishes[0].house).toBe(fixture.id);
	});

	it('drops a video a newer tombstone names, and writes no list when none is left', () => {
		const theirs = clone(fixture);
		theirs.videos = [];
		theirs.removed = { 'v-saltbak1': fixture.videos![0].ts + 1 };
		const { house, counts } = mergeHouse(clone(fixture), theirs);
		expect('videos' in house).toBe(false);
		expect(counts.removed).toBe(1);
	});

	it('merges two houses from before the list into one that still has none, symmetrically and idempotently', () => {
		const bare = clone(fixture) as Partial<House>;
		delete bare.videos;
		const once = mergeHouse(clone(bare) as House, clone(bare) as House).house;
		expect('videos' in once).toBe(false);
		const a = mergeHouse(clone(bare) as House, clone(fixture)).house;
		const b = mergeHouse(clone(fixture), clone(bare) as House).house;
		expect(a.videos).toEqual(fixture.videos);
		expect(b.videos).toEqual(fixture.videos);
		expect(sameJson(mergeHouse(a, clone(fixture)).house.videos, a.videos)).toBe(true);
	});
});

describe('the pack and the edition', () => {
	it('round trips a house with videos byte for byte through buildPack and readPack', () => {
		const read = readPack(JSON.stringify(buildPack(clone(fixture), 'tools', NOW)), { rand: seeded() });
		expect(read.ok).toBe(true);
		if (!read.ok) return;
		expect(read.report).toEqual([]);
		expect(read.fatalCount).toBe(0);
		expect(JSON.stringify(read.house.videos)).toBe(JSON.stringify(fixture.videos));
	});

	it('reads a pack from before the list as a house with none, unchanged', () => {
		const bare = clone(fixture) as Partial<House>;
		delete bare.videos;
		const read = readPack(buildPack(bare as House, 'tools', NOW), { rand: seeded() });
		expect(read.ok && 'videos' in read.house).toBe(false);
		expect(read.ok && sameJson(read.house, bare)).toBe(true);
	});

	it('a newer edition brings its videos to a device copy that had none, keeps the flag, and retires one by tombstone', () => {
		const device = clone(fixture) as Partial<House>;
		delete device.videos;
		const shipped = clone(fixture);
		shipped.videos![0].house = true;
		const first = refreshEdition(device as House, shipped).house;
		expect(first.videos!.map((v) => [v.id, v.house])).toEqual([['v-saltbak1', true]]);
		const next = clone(shipped);
		next.videos = [];
		next.removed = { 'v-saltbak1': NOW };
		const retired = refreshEdition(first, next).house;
		expect('videos' in retired).toBe(false);
	});
});

describe('what a card and the study view list', () => {
	const house = (): House => {
		const h = clone(fixture);
		h.videos = [
			video({ id: 'v-direct01', topic: 'The kitchen' }),
			video({ id: 'v-viaterm1', itemIds: [], termIds: ['x-verjus01'], topic: 'The bar' }),
			video({ id: 'v-house001', itemIds: [], termIds: [], house: true, topic: 'The house' }),
			video({ id: 'v-notopic1', itemIds: ['d-chicken1'], topic: ' ', channel: '', mins: 0 })
		];
		return h;
	};

	it('a card lists the videos naming the item first, then those naming a term that reaches it, each once', () => {
		const h = house();
		const verjusItem = h.lexicon.find((t) => t.id === 'x-verjus01')!.itemIds[0];
		expect(videosFor(h, 'd-chicken1').map((v) => v.id)).toEqual(['v-direct01', 'v-notopic1']);
		expect(videosFor(h, verjusItem).map((v) => v.id)).toEqual(['v-viaterm1']);
		expect(videosFor(h, 'w-lantern1')).toEqual([]);
		const bare = clone(h) as Partial<House>;
		delete bare.videos;
		expect(videosFor(bare as House, 'd-chicken1')).toEqual([]);
	});

	it('the study view groups by topic with the house videos leading, and a video with no topic under its own heading', () => {
		expect(videoGroups(house()).map((g) => [g.topic, g.videos.map((v) => v.id)])).toEqual([
			['The house', ['v-house001']],
			['The kitchen', ['v-direct01']],
			['The bar', ['v-viaterm1']],
			[VIDEO_TOPIC_NONE, ['v-notopic1']]
		]);
		expect(videoGroups(emptyHouse('h-abcdefgh', 'x', 'hand', NOW))).toEqual([]);
	});

	it('the small line names the channel and the length, leaving out what nobody measured', () => {
		expect(videoMeta({ channel: "Brennan's", mins: 6.4 })).toBe("Brennan's, 6 min");
		expect(videoMeta({ channel: '', mins: 0.3 })).toBe('1 min');
		expect(videoMeta({ channel: ' ', mins: 0 })).toBe('');
	});
});
