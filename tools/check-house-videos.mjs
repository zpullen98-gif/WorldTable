#!/usr/bin/env node
/* Are the house's videos still there, and are they still the videos the pack says they are?
 *
 * A pack names each video by its link, its title and its channel (house.videos, the shape in
 * src/lib/house/house-schema.ts). A link rots in two ways and only one of them is visible:
 *
 *   THE LINK DIES   The channel deletes or hides it. A server taps "Watch" on the Bananas
 *                   Foster card and gets an error page. Bad, but obvious.
 *
 *   THE LINK LIES   The link still answers and now carries something else, or was one
 *                   character off from the day it was written. A server taps a lesson on
 *                   hollandaise and gets a stranger's holiday. Worse, because nothing looks
 *                   broken.
 *
 * The second is why the pack records the title and the channel and not only the link. This
 * asks oEmbed what is at each link (YouTube's endpoint, or Vimeo's) and compares: the channel
 * must be the channel recorded and the title must be the title recorded, both folded (case,
 * accents, curly quotes and every mark of punctuation set aside, so the dash pass the builder
 * runs over a quoted title, and a channel written "LeCordon Bleu" or "Le Cordon Bleu", count as
 * the same words). No key: oEmbed answers 200 with the title and the channel for a public video
 * and 401 or 404 for one that is gone. A 403 from YouTube itself means the owner turned
 * embedding off; the wings link out and never embed, so that is not a failure here, and the
 * watch page is read for its title and channel instead.
 *
 *   node tools/check-house-videos.mjs                     the shipped Brennan's pack
 *   node tools/check-house-videos.mjs --file <path>       another pack, or a research
 *                                                         videos-*.json file (its videos[])
 *   node tools/check-house-videos.mjs --json              machine readable, for the pipeline
 *
 * NOT A GATE, modelled on the Bartender's Ledger's tools/check-films.mjs: it needs the network,
 * and a build that fails because a stranger hid a video is a build people learn to ignore. Run
 * it before a release, and before an integrator files a video:+ override (the research files
 * record a channel only where a page named it; this names it from oEmbed).
 *
 * OFFLINE IS A SKIP, SAID PLAINLY. A sandbox whose proxy refuses the host (a 403 carrying
 * x-deny-reason, or a body saying the host is not allowed), a refused connection or no DNS is
 * the network, not the video: when nothing could be asked, the run says how many videos went
 * unchecked and why, and exits 0 with "skipped", never "OK". When some answered, a video that
 * could not be asked is listed as unchecked and the rest are judged.
 *
 * Exits 1 when any video that answered is gone, carries another channel or another title, or
 * cannot be judged; 0 otherwise (including the offline skip and a pack with no videos).
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACK = path.join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json');
const REL = (/** @type {string} */ p) => path.relative(process.cwd(), p) || p;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
	console.log(`check-house-videos.mjs: ask oEmbed what is at each video the pack names and compare its title and channel.

  --file <path>  a pack (house.videos) or a research videos file (videos[]); default ${REL(PACK)}
  --json         print the findings as JSON
  --help         this text

Not a gate. Offline (the proxy refuses the host, no DNS, no connection) is a skip with exit 0.
Exits 1 when a video that answered is gone or carries another title or channel.`);
	process.exit(0);
}
for (let i = 0; i < args.length; i++) {
	const a = args[i];
	if (a === '--file') { i++; if (!args[i]) bail('--file needs a path'); continue; }
	if (a !== '--json') bail(`unknown argument ${a}; see --help`);
}
const JSON_OUT = args.includes('--json');
const fileAt = args.indexOf('--file');
const FILE = fileAt >= 0 ? path.resolve(args[fileAt + 1]) : PACK;
const say = (/** @type {string} */ m) => { if (!JSON_OUT) console.log('  ' + m); };

/** @param {string} msg @returns {never} */
function bail(msg) {
	console.error('check-house-videos: ' + msg);
	process.exit(1);
}

/**
 * @typedef {{ id: string, url: string, title: string, channel: string }} Video
 * @typedef {{ ok: true, title: string, channel: string, via: string }
 *   | { ok: false, status: number, why: string }
 *   | { unreachable: string }} Answer
 */

if (!existsSync(FILE)) bail(`${REL(FILE)}: missing`);
/** @type {any} */
let raw;
try { raw = JSON.parse(readFileSync(FILE, 'utf8')); } catch (e) { bail(`${REL(FILE)}: not JSON: ${e instanceof Error ? e.message : e}`); }
const list = Array.isArray(raw?.house?.videos) ? raw.house.videos : Array.isArray(raw?.videos) ? raw.videos : raw?.house ? [] : null;
if (!list) bail(`${REL(FILE)}: neither a pack (house.videos) nor a research videos file (videos[])`);
/** @type {Video[]} */
const VIDEOS = list.map((/** @type {any} */ v, /** @type {number} */ i) => ({
	id: typeof v?.id === 'string' ? v.id : `#${i}`,
	url: typeof v?.url === 'string' ? v.url : '',
	title: typeof v?.title === 'string' ? v.title : '',
	channel: typeof v?.channel === 'string' ? v.channel : ''
}));
if (!VIDEOS.length) {
	if (JSON_OUT) console.log(JSON.stringify({ file: REL(FILE), total: 0, skipped: false }, null, 1));
	else say(`${REL(FILE)} holds no videos yet; nothing to check.`);
	(JSON_OUT ? console.error : console.log)('check-house-videos: OK (no videos)');
	process.exit(0);
}

/**
 * Words with the noise taken out: lower case, accents off, curly quotes straight, and
 * every run of anything that is not a letter or a figure as one space.
 * @param {string} s
 */
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[‘’]/g, "'").toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/** The same with the spaces gone too, so "LeCordon Bleu" and "Le Cordon Bleu" are one name. @param {string} s */
const squash = (s) => fold(s).replace(/ /g, '');

/** @param {string} url @returns {string} the oEmbed address for a link, or '' for a host this does not know */
function oembedFor(url) {
	let host = '';
	try { host = new URL(url).hostname.toLowerCase(); } catch { return ''; }
	const under = (/** @type {string} */ h) => host === h || host.endsWith('.' + h);
	if (under('youtube.com') || under('youtu.be')) return 'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(url);
	if (under('vimeo.com')) return 'https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(url);
	return '';
}

/** A proxy's refusal of the host, which is the network and not the video. @param {Response} res @param {string} body */
function proxyRefused(res, body) {
	return res.status === 403 && (res.headers.has('x-deny-reason') || /not in allowlist|host_not_allowed|egress/i.test(body));
}

/** The title and channel off a YouTube watch page, when oEmbed will not give them. @param {string} url @returns {Promise<Answer>} */
async function watchPage(url) {
	try {
		const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0', 'accept-language': 'en' } });
		const body = await res.text();
		if (proxyRefused(res, body)) return { unreachable: 'the proxy refuses the host' };
		const title = (body.match(/<meta name="title" content="([^"]*)"/) || [])[1] || '';
		const channel = (body.match(/"ownerChannelName":"([^"]*)"/) || body.match(/"author":"([^"]*)"/) || [])[1] || '';
		const status = (body.match(/"playabilityStatus":\{"status":"([A-Z_]+)"/) || [])[1] || '';
		if (title && channel && status === 'OK') return { ok: true, title: decode(title), channel: decode(channel), via: 'the watch page (embedding is off; the wings link out, so that is fine)' };
		return { ok: false, status: 403, why: status ? 'the watch page says ' + status : 'oEmbed refused and the watch page named nothing' };
	} catch (e) {
		return { unreachable: e instanceof Error ? e.message : String(e) };
	}
}

/** HTML entities and JSON escapes a page leaves in a title. @param {string} s */
function decode(s) {
	return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
		.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

/** What oEmbed says is at a link, three tries against a rate limit. @param {string} url @returns {Promise<Answer>} */
async function lookup(url) {
	const endpoint = oembedFor(url);
	if (!endpoint) return { ok: false, status: 0, why: 'not a YouTube or Vimeo link' };
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const res = await fetch(endpoint, { headers: { 'user-agent': 'Mozilla/5.0' } });
			if (res.status === 429) { await new Promise((r) => setTimeout(r, 2000 * (attempt + 1))); continue; }
			if (res.status === 200) {
				const j = await res.json();
				return { ok: true, title: String(j.title || ''), channel: String(j.author_name || ''), via: 'oEmbed' };
			}
			const body = await res.text();
			if (proxyRefused(res, body)) return { unreachable: 'the proxy refuses the host (' + (res.headers.get('x-deny-reason') || 'HTTP 403') + ')' };
			if (res.status === 403 && endpoint.includes('youtube.com')) return watchPage(url);
			return { ok: false, status: res.status, why: res.status === 404 || res.status === 401 ? 'gone, private or never there' : 'HTTP ' + res.status };
		} catch (e) {
			const err = /** @type {any} */ (e);
			if (attempt === 2) return { unreachable: String(err?.cause?.code || err?.message || err) };
			await new Promise((r) => setTimeout(r, 1000));
		}
	}
	return { unreachable: 'rate limited after three tries' };
}

/**
 * Six at a time, the cadence the suite's other checkers settled on.
 * @template T, R
 * @param {T[]} items @param {number} n @param {(item: T) => Promise<R>} fn
 * @returns {Promise<R[]>}
 */
async function pool(items, n, fn) {
	/** @type {R[]} */
	const out = new Array(items.length);
	let i = 0;
	await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
		while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
	}));
	return out;
}

const results = await pool(VIDEOS, 6, async (v) => ({ v, r: await lookup(v.url) }));

/** @type {Array<{ v: Video, status: number, why: string }>} */ const dead = [];
/** @type {Array<{ v: Video, title: string, channel: string, titleOk: boolean, channelOk: boolean }>} */ const drifted = [];
/** @type {Array<{ v: Video, why: string }>} */ const unreachable = [];
/** @type {Array<{ v: Video, title: string, channel: string }>} */ const unrecorded = [];
/** @type {Array<{ v: Video, via: string }>} */ const fine = [];
for (const { v, r } of results) {
	if ('unreachable' in r) { unreachable.push({ v, why: r.unreachable }); continue; }
	if (!r.ok) { dead.push({ v, status: r.status, why: r.why }); continue; }
	/* A research record with no channel yet is not drift: it is what this tool is for. Say what
	   oEmbed names, so the integrator can file it, and judge the title alone. */
	const channelOk = v.channel ? squash(v.channel) === squash(r.channel) : true;
	const titleOk = squash(v.title) === squash(r.title);
	if (!v.channel) unrecorded.push({ v, title: r.title, channel: r.channel });
	if (!channelOk || !titleOk) drifted.push({ v, title: r.title, channel: r.channel, titleOk, channelOk });
	else fine.push({ v, via: r.via });
}

const asked = VIDEOS.length - unreachable.length;
const skipped = asked === 0;
const failed = dead.length + drifted.length;

if (JSON_OUT) {
	console.log(JSON.stringify({
		file: REL(FILE), total: VIDEOS.length, asked, skipped, fine: fine.length,
		dead: dead.map((d) => ({ id: d.v.id, url: d.v.url, status: d.status, why: d.why })),
		drifted: drifted.map((d) => ({ id: d.v.id, url: d.v.url, recorded: { title: d.v.title, channel: d.v.channel }, found: { title: d.title, channel: d.channel }, titleOk: d.titleOk, channelOk: d.channelOk })),
		unrecorded: unrecorded.map((d) => ({ id: d.v.id, url: d.v.url, title: d.title, channel: d.channel })),
		unchecked: unreachable.map((d) => ({ id: d.v.id, url: d.v.url, why: d.why }))
	}, null, 1));
} else {
	say(`${VIDEOS.length} video(s) in ${REL(FILE)}`);
	if (skipped) {
		say(`the network is not reachable from here, so none was checked: ${unreachable[0].why}.`);
		say('this is a skip, not a pass: run it again somewhere oEmbed answers before a release.');
	} else {
		say(`${fine.length} still answer with the title and the channel recorded`);
		for (const d of dead) say(`GONE  ${d.v.id}  ${d.v.url}  ${d.why}`);
		for (const d of drifted) {
			say(`DRIFTED  ${d.v.id}  ${d.v.url}  (${[d.channelOk ? '' : 'the channel', d.titleOk ? '' : 'the title'].filter(Boolean).join(' and ')} differ)`);
			say(`    recorded: ${d.v.title}  by ${d.v.channel || '(no channel yet)'}`);
			say(`    found:    ${d.title}  by ${d.channel}`);
		}
		for (const d of unrecorded) say(`no channel recorded for ${d.v.id}; oEmbed names ${d.channel}`);
		for (const d of unreachable) say(`unchecked (the network, not the video): ${d.v.id}  ${d.why}`);
	}
}
/* The verdict line goes to stderr under --json, so stdout stays one JSON document. */
const verdict = JSON_OUT ? console.error : console.log;
if (skipped) verdict(`check-house-videos: skipped, offline (${VIDEOS.length} unchecked); exit 0 because this is not a gate`);
else if (failed) console.error(`check-house-videos: ${failed} video(s) need a person: ${dead.length} gone, ${drifted.length} drifted`);
else verdict(`check-house-videos: OK (${fine.length} checked${unreachable.length ? ', ' + unreachable.length + ' unchecked' : ''})`);
process.exit(failed ? 1 : 0);
