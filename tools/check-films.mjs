/* Do the chosen technique films still play, and are they still the right films?
 *
 * derive/technique-films.mjs pins a YouTube id per technique. A pinned id rots
 * in two different ways and only one of them is obvious:
 *
 *   THE LINK DIES      The channel deletes or privatizes the video. A reader
 *                      clicks "Watch for: the butter block staying one sheet"
 *                      and gets an error page. Bad, but visible.
 *
 *   THE LINK LIES      The id still resolves and now points at something else,
 *                      or was one character off from the day it was written. A
 *                      reader clicks a lesson on lamination and gets a stranger
 *                      unboxing a phone. Worse, because nothing looks broken.
 *
 * The second is why technique-films.mjs records the real title and channel
 * rather than just the id. This asks YouTube what is actually at each id and
 * compares. No API key: oEmbed answers 200 with the title and channel for a
 * public video, and 401 or 404 for one that is gone.
 *
 *   node tools/check-films.mjs
 *
 * NOT a build gate, for the same reason check-videos.mjs is not: it needs the
 * network, and a build that fails because a stranger flipped a video to private
 * is a build people learn to ignore. Run it before a release.
 *
 * Exits non-zero if any film is dead or has drifted.
 */
import { TECHNIQUE_FILMS } from './derive/technique-films.mjs';

const say = (m) => console.log('  ' + m);

/* Words that carry no identity. Two cooking videos share most of these, so
   counting them as agreement would let almost any title match almost any other. */
const STOP = new Set(
	`the a an of to in on at for and or with how make making made your you video
	 tutorial guide recipe cooking cook chef kitchen best easy perfect ultimate
	 technique techniques step by part full hd 4k official`.split(/\s+/)
);

const words = (s) =>
	new Set(
		(s || '')
			.toLowerCase()
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '') /* Pepin and Pépin are the same person */
			.match(/[a-z0-9]+/g)
			?.filter((w) => w.length > 2 && !STOP.has(w)) ?? []
	);

async function lookup(id) {
	const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
		'https://www.youtube.com/watch?v=' + id
	)}&format=json`;
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
			if (res.status === 429) {
				await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
				continue;
			}
			if (res.status === 200) return { ok: true, ...(await res.json()) };
			return { ok: false, status: res.status };
		} catch (err) {
			if (attempt === 2) return { unreachable: String(err?.message || err) };
			await new Promise((r) => setTimeout(r, 1000));
		}
	}
	return { unreachable: 'rate limited after three tries' };
}

console.log(`\nChecking ${TECHNIQUE_FILMS.length} chosen technique films\n`);

const dead = [];
const drifted = [];
const unreachable = [];

const CONCURRENCY = 6;
let cursor = 0;
let done = 0;
await Promise.all(
	Array.from({ length: CONCURRENCY }, async () => {
		while (cursor < TECHNIQUE_FILMS.length) {
			const f = TECHNIQUE_FILMS[cursor++];
			const r = await lookup(f.id);
			done++;
			if (done % 25 === 0) say(`${done} of ${TECHNIQUE_FILMS.length}`);

			if (r.unreachable) {
				unreachable.push({ f, why: r.unreachable });
				continue;
			}
			if (!r.ok) {
				dead.push({ f, status: r.status });
				continue;
			}

			/* Agreement on the channel is the strong signal: a channel name is
			   distinctive and does not get rewritten for SEO. A title can be
			   re-cut ("| NYT Cooking" appended, a year added), so it is judged on
			   overlap rather than equality. */
			const realChannel = words(r.author_name);
			const channelOk = [...words(f.channel)].some((w) => realChannel.has(w));

			const claimed = words(f.title);
			const real = words(r.title);
			const shared = [...claimed].filter((w) => real.has(w)).length;
			const overlap = claimed.size ? shared / claimed.size : 0;

			if (!channelOk && overlap < 0.4) {
				drifted.push({ f, real: r.title, realChannel: r.author_name, overlap });
			}
		}
	})
);

console.log('');
if (unreachable.length) {
	say(`${unreachable.length} could not be reached; that is the network, not the film`);
	for (const u of unreachable) say(`    ${u.f.slug}  ${u.why}`);
}

/* One if/else rather than an early exit. process.exit() tears down while
   undici's keepalive sockets are still open, which trips a libuv assertion on
   Windows and prints an alarming line directly underneath a clean pass. So the
   exit code is set and Node is left to drain, which means the failure report
   has to be genuinely skipped rather than exited past. */
const bad = dead.length + drifted.length;
if (!bad) {
	const n = TECHNIQUE_FILMS.length - unreachable.length;
	say(`✓ all ${n} checked films still play, and are still themselves`);
	process.exitCode = 0;
} else {
	if (dead.length) {
		console.error(`\n  ✗ ${dead.length} film(s) no longer play:\n`);
		for (const d of dead) {
			console.error(
				`    ${String(d.status).padEnd(4)} ${d.f.slug.padEnd(32)} ${d.f.title.slice(0, 54)}`
			);
		}
	}
	if (drifted.length) {
		console.error(`\n  ✗ ${drifted.length} id(s) resolve to a different video than recorded:\n`);
		for (const d of drifted) {
			console.error(`    ${d.f.slug}`);
			console.error(`      recorded: ${d.f.title.slice(0, 66)}  [${d.f.channel}]`);
			console.error(`      actually: ${d.real.slice(0, 66)}  [${d.realChannel}]`);
		}
		console.error(`\n  Either the id was wrong, or the channel re-used it. Re-point it, or`);
		console.error(`  delete it: the technique falls back to its search link, which is fine.`);
	}
	console.error(
		`\n  ${bad} of ${TECHNIQUE_FILMS.length} techniques are promising a lesson they do not deliver.\n`
	);
	process.exitCode = 1;
}
