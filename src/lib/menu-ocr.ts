/**
 * Reading a printed menu out of a photograph.
 *
 * This is the first half of "bring your menu in instead of typing it": it turns
 * a picture into plain text and stops there. Splitting that text into dishes,
 * and putting them in front of the cook to correct, belongs to the screen that
 * calls this.
 *
 * NOTHING HERE EVER PRODUCES AN ALLERGEN. A photograph of a menu says what a
 * dish is called and what it costs; it does not say what is in the pan. The
 * kitchen's allergen line is the one field in this app where "empty" and
 * "checked, and it holds none" must never be confused, which is why MenuDish
 * carries `allergensCheckedAt` alongside `allergens`. An importer that guessed
 * from words on a menu would write the second when it only ever knew the first.
 * So this module returns text. It does not build a MenuDish, and it must never
 * be extended to fill either field.
 *
 * Two engines, in this order:
 *
 * 1. The browser's own text recognition (the Shape Detection API's
 *    TextDetector). On a phone this is the platform OCR that already reads
 *    receipts and business cards: nothing to download, and it answers in well
 *    under a second. It is also absent from most desktop browsers, which is
 *    the whole reason there is a second engine.
 *
 * 2. tesseract.js, fetched on demand. See the download note on ENGINE_BYTES:
 *    it is about four megabytes, which is why ocrPlan() exists and why the
 *    screen has to say so before the cook picks a file.
 */

/**
 * The tesseract front end, kept OUT of the bundle on purpose.
 *
 * `?url` hands us the URL of the file copied into the build verbatim, and the
 * runtime `import()` of that URL is opaque to the bundler, so tesseract is not
 * in the main chunk and not in a lazy chunk either: it is an ASSET. That
 * distinction is what makes the precache exclusion in vite.config.ts possible
 * at all. SvelteKit names client chunks `chunks/[hash].js` with no readable
 * part (see @sveltejs/kit src/exports/vite/index.js), so a lazy chunk is
 * something no globIgnores pattern can name, while an asset keeps its filename
 * and can be excluded by it.
 *
 * dist/tesseract.esm.min.js is the library's own browser build: one ES module,
 * one default export, no bare imports and no `import.meta`, so it loads
 * straight from a URL with nothing resolving it.
 */
import tesseractUrl from 'tesseract.js/dist/tesseract.esm.min.js?url';

export type OcrProgress = (pct: number, note: string) => void;

export interface OcrResult {
	text: string;
	engine: 'native' | 'tesseract';
}

/**
 * What the first tesseract read costs on the wire, measured against the real
 * files on 2026-09-05 with tesseract.js 7.0.0, rather than estimated:
 *
 *   10,595 B  tesseract.esm.min.js  (our own origin, gzipped; 63,220 raw)
 *   31,770 B  dist/worker.min.js
 *   1,373,509 B  tesseract-core-simd-lstm.wasm.js
 *   2,952,873 B  eng.traineddata.gz
 *
 * The last three come from jsdelivr, which is where tesseract.js points by
 * default. We deliberately do not override those paths: hosting the core
 * ourselves would add 3.9 MB to every deploy of this site and would still not
 * make the feature work offline, because the language data is a separate
 * package this project does not carry.
 *
 * Which core file gets fetched depends on the device's WebAssembly SIMD
 * support, and the relaxed-SIMD build is within 600 bytes of the plain SIMD
 * one, so the total does not move.
 */
const ENGINE_BYTES = 10_595 + 31_770 + 1_373_509 + 2_952_873;

/**
 * 4.4 at those sizes. Decimal megabytes, not MiB, on purpose: that is the
 * spelling a phone's data counter and a mobile plan use, and it is the larger
 * of the two numbers. A warning that undercounts what a cook is about to spend
 * on someone's data is the wrong kind of wrong.
 */
const ENGINE_MB = Math.round(ENGINE_BYTES / 100_000) / 10;

/** Said the same way wherever a read comes back blank, because the fix is the same. */
const NO_TEXT =
	'No text came out of that photo. Fill the frame with the menu, hold it straight on, and try again in even light.';

/**
 * Set once the tesseract front end is in memory in THIS page. Deliberately not
 * a claim about the device: the worker and the core sit in the browser's HTTP
 * cache, which we cannot inspect and which the browser is free to evict, and
 * the language data sits in IndexedDB. After a reload ocrPlan() goes back to
 * saying a download is needed, which is the direction to be wrong in. Telling
 * a cook the reader is already here and then stalling on a dead connection is
 * worse than warning twice.
 */
let tesseract: TesseractModule | null = null;

/**
 * The slice of the Shape Detection API we use. It is not in TypeScript's DOM
 * library because it never became a standard, which is also why it is reached
 * through a property check on `window` rather than a bare global.
 */
interface DetectedText {
	rawValue: string;
	boundingBox: { top: number; left: number; height: number };
}

interface TextDetectorLike {
	detect(image: ImageBitmapSource): Promise<DetectedText[]>;
}

/** The slice of tesseract.js we use, typed by hand because the module arrives as a URL. */
interface TesseractLogEvent {
	status: string;
	progress: number;
}

interface TesseractWorker {
	recognize(image: Blob): Promise<{ data: { text: string } }>;
	terminate(): Promise<void>;
}

interface TesseractModule {
	createWorker(
		langs: string,
		oem: number,
		options: { logger: (m: TesseractLogEvent) => void }
	): Promise<TesseractWorker>;
}

/** The constructor if this browser has it, else null. */
function nativeDetector(): (new () => TextDetectorLike) | null {
	if (typeof window === 'undefined') return null;
	const ctor = (window as unknown as { TextDetector?: new () => TextDetectorLike }).TextDetector;
	// createImageBitmap decodes the file for the detector, so a browser missing
	// either half cannot take the native path.
	if (typeof ctor !== 'function' || typeof createImageBitmap !== 'function') return null;
	return ctor;
}

/** What this device can do before anything is downloaded. */
export function ocrPlan(): { native: boolean; needsDownload: boolean; approxMB: number } {
	if (nativeDetector()) return { native: true, needsDownload: false, approxMB: 0 };
	if (tesseract) return { native: false, needsDownload: false, approxMB: 0 };
	return { native: false, needsDownload: true, approxMB: ENGINE_MB };
}

/**
 * Where each tesseract phase sits on the 0 to 100 bar, and what the cook is
 * told it is doing. The library reports progress 0 to 1 within each phase and
 * starts each one over at 0, so the phases have to be laid end to end here or
 * the bar runs five times.
 *
 * The order is the one a run actually reports, not the one the phase names
 * suggest: the language file is fetched BETWEEN the two initialisation steps,
 * not before them. Laid out by guesswork instead, the bar sat pinned at 73 for
 * the whole of the largest download of the five. The monotonic guard in
 * imageToText stays anyway, because this order belongs to tesseract and a
 * version bump can change it without telling anyone.
 *
 * The recognition band is the widest because it is the part whose length
 * depends on the photo. Everything before it is a fixed size.
 *
 * The notes say "loading" rather than "downloading" because tesseract reports
 * the same status either way: the language file comes from IndexedDB once it
 * has been fetched, and the core comes from the browser's own HTTP cache, and
 * neither shows up in the event. The download is what ocrPlan() is for, and it
 * is said before the file is picked, not halfway through the bar.
 */
const PHASES: Record<string, { from: number; to: number; note: string }> = {
	'loading tesseract core': { from: 5, to: 40, note: 'Loading the reader' },
	'initializing tesseract': { from: 40, to: 45, note: 'Starting the reader' },
	'loading language traineddata': { from: 45, to: 75, note: 'Loading the language' },
	'initializing api': { from: 75, to: 80, note: 'Starting the reader' },
	'recognizing text': { from: 80, to: 100, note: 'Reading the photo' }
};

/**
 * Reads a photograph of a menu and returns its text, one line per line of the
 * menu as best the engine can tell.
 *
 * @param file the picture, straight from a file input or a camera capture
 * @param onProgress called with 0 to 100 and a short note; safe to omit
 * @throws Error with a sentence the cook can act on, never a raw engine message
 */
export async function imageToText(file: Blob, onProgress?: OcrProgress): Promise<OcrResult> {
	// Monotonic on purpose. Each tesseract phase restarts its own progress at 0,
	// and the events do not always arrive in the order the phases are laid out
	// below, so the bar is only ever allowed forwards: one that slides back
	// reads as a fault rather than as bookkeeping.
	let shown = 0;
	const report = (pct: number, note: string) => {
		shown = Math.max(shown, pct);
		onProgress?.(Math.round(shown), note);
	};

	// An empty type is left alone rather than rejected: a Blob assembled in code
	// often carries none, and the decoder below gives a better answer than a
	// guess would. A type we can read and that is not an image is refused here,
	// because "that is a PDF" is worth saying before four megabytes move.
	if (file.type && !file.type.startsWith('image/')) {
		throw new Error(
			`That is ${describeType(file.type)}, not a photo. Take a picture of the menu, or pick a JPEG, PNG or WebP file.`
		);
	}

	const native = nativeDetector();
	if (native) {
		report(0, 'Reading the photo');
		const text = await detectNative(native, file);
		report(100, 'Done reading');
		return { text, engine: 'native' };
	}

	return { text: await detectTesseract(file, report), engine: 'tesseract' };
}

/**
 * The platform's own recogniser.
 *
 * A failure here is NOT quietly retried on tesseract. The screen has already
 * told this cook, out of ocrPlan(), that reading a photo on this device costs
 * no download; starting a four megabyte fetch behind that promise is the kind
 * of surprise that happens on a phone tethered to somebody's data plan.
 */
async function detectNative(ctor: new () => TextDetectorLike, file: Blob): Promise<string> {
	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		throw new Error(
			'That picture would not open. Try a JPEG or PNG straight from the camera roll.'
		);
	}

	let blocks: DetectedText[];
	try {
		blocks = await new ctor().detect(bitmap);
	} catch {
		// Chrome exposes TextDetector on platforms whose OCR backend is missing,
		// where every detect() rejects. Nothing this app can do about it, so say
		// what it means rather than what threw.
		throw new Error(
			'This browser will not read photographs. Open the app in Chrome on the phone, or type the dishes in on the menu screen.'
		);
	} finally {
		bitmap.close();
	}

	// The detector returns blocks in whatever order it found them, and a menu is
	// read down the page and then across. A dish and its price are two blocks a
	// long way apart on one line, and keeping them on one line is exactly what
	// the screen after this one needs; sorting on the top edge alone splits
	// them, because the two boxes are never at quite the same height.
	//
	// The tempting fix, comparing tops with a tolerance inside the sort, is a
	// trap: "within half a block of each other" is not transitive, so a column
	// of dishes each a pixel lower than the last chains together and comes out
	// in an order nobody can predict. The blocks are cut into lines first, top
	// to bottom, and only then read left to right inside a line.
	const lines: DetectedText[][] = [];
	let line: DetectedText[] | null = null;
	for (const b of blocks.slice().sort((a, z) => a.boundingBox.top - z.boundingBox.top)) {
		const head = line === null ? undefined : line[0];
		if (
			line !== null &&
			head !== undefined &&
			b.boundingBox.top - head.boundingBox.top <
				Math.min(head.boundingBox.height, b.boundingBox.height) / 2
		) {
			line.push(b);
		} else {
			line = [b];
			lines.push(line);
		}
	}

	// A single space between blocks on a line, because that is what tesseract
	// hands back for the same menu, and one output shape is one parser.
	const text = lines
		.map((l) =>
			l
				.sort((a, z) => a.boundingBox.left - z.boundingBox.left)
				.map((b) => b.rawValue.trim())
				.filter(Boolean)
				.join(' ')
		)
		.filter(Boolean)
		.join('\n');

	if (!text) throw new Error(NO_TEXT);
	return text;
}

/** The downloaded engine, for every browser without one built in. */
async function detectTesseract(file: Blob, report: OcrProgress): Promise<string> {
	report(0, 'Getting the reader');

	// Checked before the worker is spawned so the message names the real
	// problem. Offline, the failure otherwise arrives as a worker error event
	// with nothing in it, several seconds later.
	if (!tesseract && typeof navigator !== 'undefined' && navigator.onLine === false) {
		throw new Error(offlineMessage());
	}

	if (!tesseract) {
		try {
			// @vite-ignore: the specifier is a build-time URL, and keeping the
			// bundler out of it is the point. See the note on tesseractUrl.
			const mod = (await import(/* @vite-ignore */ tesseractUrl)) as { default: TesseractModule };
			tesseract = mod.default;
		} catch {
			throw new Error(offlineMessage());
		}
	}

	report(5, 'Getting the reader');

	let worker: TesseractWorker;
	try {
		// 'eng', then 1 for the LSTM engine, which is the default and the only
		// one whose language data we fetch. The paths to the worker, the core
		// and the language file are left at the library's own defaults so the
		// versions can never drift out of step with package.json.
		worker = await tesseract.createWorker('eng', 1, {
			logger: (m) => {
				const phase = PHASES[m.status];
				if (!phase) return;
				const p = Math.min(1, Math.max(0, m.progress));
				report(phase.from + (phase.to - phase.from) * p, phase.note);
			}
		});
	} catch {
		// Deliberately not the offline sentence. Everything the worker pulls in
		// after the front end does come off the network, so a dead connection is
		// the likeliest cause, but a browser that refuses to spawn a worker at
		// all lands here too, and telling that cook to find a signal would send
		// them chasing the wrong thing.
		throw new Error(
			`The reader would not start. It fetches about ${ENGINE_MB} MB the first time on a device, so check the connection and try again, or type the dishes in on the menu screen.`
		);
	}

	try {
		// The photo goes in at full size. Downscaling large camera images would
		// certainly be faster, and might well read just as accurately, but a
		// menu's smallest type is its allergen footnotes and its prices, so
		// trading resolution away on a guess is not a trade worth making
		// without a measurement this session could not take.
		const { data } = await worker.recognize(file);
		const text = data.text.trim();
		if (!text) throw new Error(NO_TEXT);
		report(100, 'Done reading');
		return text;
	} finally {
		// The worker holds a wasm heap of tens of megabytes. Left alive after a
		// failed read it stays there until the tab closes.
		await worker.terminate().catch(() => {});
	}
}

/**
 * The first read on a device pulls the engine down. Nothing here promises it
 * will still be there tomorrow: the browser owns that cache and can drop it,
 * and a promise the code cannot keep is worse than a warning repeated.
 */
function offlineMessage(): string {
	return `Reading a photo needs a connection the first time on this device, to fetch about ${ENGINE_MB} MB of reader. Get a signal and try again, or type the dishes in on the menu screen.`;
}

/**
 * Names what was actually handed over, so the refusal is about this file and
 * not about files in general.
 *
 * Anything off the short list is quoted as its own media type rather than
 * squeezed into a sentence: "a file of type application/vnd.ms-excel" reads,
 * where the obvious shortcut ("an application/vnd.ms-excel file") does not.
 */
function describeType(type: string): string {
	const [group, sub = ''] = type.split(';')[0].trim().toLowerCase().split('/');
	if (sub === 'pdf') return 'a PDF';
	if (group === 'video') return 'a video';
	if (group === 'audio') return 'a sound file';
	if (group === 'text') return 'a text file';
	return `a file of type ${group}${sub ? `/${sub}` : ''}`;
}
