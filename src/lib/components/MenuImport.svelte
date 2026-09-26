<!--
  The Menu Desk: a venue's whole menu in once, sorted into three apps.

  A venue that opens this app already has a menu: it is printed, it is on a
  website, and it is a photograph on somebody's phone. Before this panel the
  only way to get it into the app was the hand form below, one dish at a time,
  which is why so many kitchens got four dishes in and stopped. Three ways in,
  then, and one review screen they all land on. And the menu is the WHOLE
  menu: the dishes stay here for the kitchen, the wines go to the Codex and
  the cocktails to the Ledger, through the desk inbox the three apps share on
  one origin (desk-inbox.ts), or as a downloaded desk file anywhere else.

  Paste comes first on purpose. It is the only one of the three that works on
  every device, with no connection and no download, so it is written as the
  normal route rather than as the fallback the other two fall back to. The
  offline reader is the first engine and always will be; the Maître d' is the
  second, a door below the box (MaitreDoor.svelte) and never a replacement.

  WHAT LEAVES THE DEVICE, AND THROUGH WHICH DOOR. Nothing, on the offline
  reader's paths: the paste is read here, the photograph is read by the
  device's own recogniser, and the address is fetched by this browser and
  nowhere else (menu-link.ts). Her doors are the exception, and each says so
  on its face before it is pressed: the pasted text goes to Anthropic when
  the person asks her to read it; the picture leaves the device only through
  her door, and only when that door is pressed; the address goes to
  Anthropic when the person asks her, and nowhere else. All of it on the
  person's own key, none of it without one, and the client that does it is
  loaded only for that press (src/lib/maitre.ts). Her read lands on this
  same table, through maitre-adopt.ts, in the same shape, with every row
  still showing the line it came from and every price checked against the
  page; if the table had been hand-edited, she asks first, because her read
  replaces it, edits included.

  THE ALLERGEN RULE, and it is the reason this panel is shaped the way it is.
  Nothing in an import knows what is in a pan. A photograph reports what the
  menu printed; a web page reports what the venue typed; neither has ever seen
  the kitchen. MenuDish carries `allergens` AND `allergensCheckedAt` precisely
  so that "this dish holds none" and "nobody has looked" cannot be confused,
  and an importer that filled either field would be answering a question it was
  never asked. So every dish this panel adds arrives with `allergens: []` and
  `allergensCheckedAt` undefined, which the menu list below reads as "Allergens
  not marked: ask the kitchen", and the panel says so in words before anybody
  picks a file. There is deliberately no allergen control here: a row of
  checkboxes on an import screen is one distracted tap away from becoming an
  affirmation nobody made.

  The reader's `marks` are not allergen information either. They are a record
  of the marks the menu printed, they are shown read-only so a cook can retype
  what matters, and they are never mapped into `allergens`.

  NEVER A PRICE INVENTED, whichever engine read the menu. Every row keeps
  `raw`, the lines it came from, and a price that does not occur in those
  lines is blanked on the way onto the table and flagged in words; the
  offline reader cannot produce such a row, and the guard is here for the
  engine that can.

  THE DESK FILE IS A DRAFT. What the reader hands back, what the inbox holds
  and what "Import a desk file" opens is the same shape, and the only thing
  this panel ever does with it is put its rows on this table for a person to
  correct and adopt one by one. It never reaches house.adopt or any other
  store method; the page's doImport sniffs its format before parseImport for
  exactly that reason.
-->
<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { base } from '$app/paths';
	import { house } from '$lib/stores/house.svelte';
	import type { MenuDish } from '$lib/persistence/state';
	import { imageToText, ocrPlan } from '$lib/menu-ocr';
	import { linkToText } from '$lib/menu-link';
	import { priceParts, readMenu, reReadAs } from '$lib/desk/desk-reader';
	import MaitreDoor from '$lib/components/MaitreDoor.svelte';
	import type { MaitreApi, MaitreProgress, MaitreReadResult } from '$lib/maitre';
	import { adoptRead, diffAgainstOffline, NO_PRICE_WHY, type OfflineDiffers } from '$lib/maitre-adopt';
	import {
		deskSource,
		downloadDesk,
		mintDeskId,
		readDeskFile,
		type DeskFile,
		type DeskItem,
		type DeskKind,
		type DeskUnsorted,
		type DeskUnsure,
		type DeskWingKind
	} from '$lib/desk/desk-file';
	import { deskShare, markDeskTaken, readDeskInbox, writeDeskInbox } from '$lib/desk/desk-inbox';
	import { hashText } from '$lib/desk/desk-text';
	import {
		countsLine,
		deskCounts,
		handList,
		priceInRaw,
		readInName,
		sharedOrigin,
		siblingHref,
		whenRead
	} from '$lib/desk/desk-share';

	interface Props {
		/**
		 * A desk file the page was handed: "Import session…" picked one. Its
		 * rows go on this table to look over; it is never merged into a store.
		 * A new object each time, because the same file picked twice is a
		 * person asking to see it again. (Her read arrives by another road:
		 * takeHerRead below, from her door on this panel.)
		 */
		desk?: DeskFile | null;
	}
	let { desk = null }: Props = $props();

	/** A kind a person can give a row: the desk's four, or out of the menu altogether. */
	type RowKind = DeskKind | 'out';

	/** One draft row on the desk. The dish fields are editable in place; a wine or a cocktail is read-only here and edited in its own room. */
	interface Row {
		/** The desk row's id, stable across edits and re-reads, so a keyed each never re-uses an input. */
		key: string;
		/** The row as the desk last read it. Replaced whole when a person changes its kind. */
		item: DeskItem;
		kind: RowKind;
		section: string;
		name: string;
		description: string;
		price: string;
		/** Comma separated on the table, one string per ingredient on the dish. Prefilled only from a printed list. */
		ingredients: string;
		/** Ticked for the bulk controls above the table. */
		chosen: boolean;
		/** What to do when this name is already on the menu. Skipping is the default. */
		dup: 'skip' | 'add';
		/** A person changed this row's kind, so it is offered to its new room even if that room has had its share. */
		moved: boolean;
		/** The printed price was not in the row's own lines, so it was blanked and the row says so. */
		priceBlanked: boolean;
		/** What the offline read made of the same line, when the Maître d' read it and the two engines disagreed. */
		differs?: OfflineDiffers;
	}

	/**
	 * Open when there is nothing on the menu or a share is waiting, out of the
	 * way otherwise.
	 *
	 * `null` means nobody has said either way, so the panel follows the menu.
	 * The moment the cook uses the toggle their choice sticks, because a panel
	 * that reopens itself after being closed is a panel that fights the person
	 * trying to edit the dish underneath it.
	 */
	let opened = $state<boolean | null>(null);
	/** Dishes waiting in the inbox on mount: the second reason the desk opens itself. */
	let waiting = $state(0);
	const open = $derived(opened ?? (house.dishes.length === 0 || waiting > 0));

	let text = $state('');
	let rows = $state<Row[]>([]);
	let unsorted = $state<DeskUnsorted[]>([]);
	/** The file the rows came from and how it arrived. Null until something has been read, which is how "not read yet" is told from "read, and it found nothing". */
	let read = $state<{ file: DeskFile; from: 'read' | 'inbox' | 'file' } | null>(null);
	/** Which of the other rooms is open below the table, if any. */
	let showRoom = $state<'wine' | 'cocktail' | 'unplaced' | null>(null);
	/**
	 * The one live region, rendered from mount and never removed, so a screen
	 * reader has registered it before the first sentence lands in it. Every
	 * announcement the desk makes goes through here.
	 */
	let live = $state('');
	/** The same menu is already on the desk: say so instead of reading it twice. */
	let alreadyRead = $state<{ file: DeskFile; dishes: number } | null>(null);
	let deskFileError = $state('');

	/* ---- the photo ------------------------------------------------------- */

	/**
	 * Whether this device can read a photograph, asked once after mount and
	 * NEVER during prerender: there is no `window` in the SSR pass, so ocrPlan()
	 * answers "no reader here" and this page is prerendered. Baked into the
	 * HTML, that answer would be shown to every phone that can in fact read one.
	 * Null means not asked yet, and the picker waits rather than guessing.
	 */
	let plan = $state<{ native: boolean } | null>(null);
	let reading = $state(false);
	let pct = $state(0);
	let progressNote = $state('');
	let photoError = $state('');

	/* ---- the link -------------------------------------------------------- */

	let url = $state('');
	let fetching = $state(false);
	/** The refusal and the address to open by hand, which belong on screen together. */
	let linkFail = $state<{ reason: string; openUrl: string } | null>(null);

	/* ---- saving ---------------------------------------------------------- */

	let bulkSection = $state('');
	let saveError = $state('');
	/** What the last Add did: how many dishes landed here and what went next door. */
	let done = $state<{
		saved: number;
		wines: number;
		cocktails: number;
		/** True when the other rooms will find their share in the inbox. */
		handed: boolean;
		/** Why they will not, in the inbox's own words, or the download sentence off the shared origin. */
		said: string;
	} | null>(null);
	/** The desk file as it stood at the last Add, so the download after it still has something to give. */
	let lastFile = $state<DeskFile | null>(null);

	let reviewHead: HTMLHeadingElement | undefined = $state();
	let doneEl: HTMLParagraphElement | undefined = $state();
	let pasteEl: HTMLTextAreaElement | undefined = $state();

	/** The inbox is only readable by the room it is meant for on the suite's one origin. */
	const shared = sharedOrigin(base);

	onMount(() => {
		plan = ocrPlan();
		// The inbox is read here and nowhere earlier: there is no localStorage
		// in the prerender pass, and a draft another app left is the one reason
		// this panel opens itself on a menu that already has dishes.
		const inbox = readDeskInbox();
		if (inbox) {
			const share = deskShare(inbox, 'dish');
			if (share.length) {
				waiting = share.length;
				loadDesk(inbox, 'inbox', false);
			}
		}
	});

	// The page hands a desk file down as a prop (the session picker sniffed
	// one, or the Maître d' read one). untrack, because loadDesk touches half
	// the state here and none of it should re-run this.
	$effect(() => {
		const file = desk;
		if (file) untrack(() => loadDesk(file, 'file'));
	});

	/* ---- rows ------------------------------------------------------------ */

	/** The rooms a desk row is for: its own, or the ones an unsure row could be. */
	const kindsFor = (item: DeskItem): DeskKind[] => (item.kind === 'unsure' ? item.could : [item.kind]);

	/**
	 * The editable fields, from the row as read. The price guard runs here:
	 * a printed price that does not occur in the row's own lines, whole or
	 * figure by figure, is blanked, whichever engine read it, and the row
	 * says so on screen.
	 */
	function fill(row: Row) {
		const item = row.item;
		const ok = priceInRaw(item.price.printed, item.raw, item.price.parts);
		row.section = item.section;
		row.name = item.name;
		row.description = item.kind === 'wine' ? item.descriptors : item.kind === 'unsure' ? '' : item.description;
		row.price = ok ? item.price.printed : '';
		// Blanked here, or blanked already by her client's page check (the row
		// says so in its why): one flag on screen, whichever check fired.
		row.priceBlanked = !ok || item.why.includes(NO_PRICE_WHY);
		row.ingredients = item.kind === 'dish' ? item.ingredientsNamed.join(', ') : '';
	}

	/**
	 * A row a person has touched since it was read: the kind changed, or any
	 * editable field differs from what a fresh read of the same item gives.
	 * Asked before her read replaces the table, and never remembered as a
	 * flag, because a flag set on input and cleared on undo is the kind of
	 * bookkeeping that drifts.
	 */
	function touched(r: Row): boolean {
		if (r.moved || r.kind !== r.item.kind) return true;
		const fresh = toRow(r.item);
		return (
			r.section !== fresh.section ||
			r.name !== fresh.name ||
			r.description !== fresh.description ||
			r.price !== fresh.price ||
			r.ingredients !== fresh.ingredients
		);
	}

	function toRow(item: DeskItem): Row {
		const row: Row = {
			key: item.id,
			item,
			kind: item.kind,
			section: '',
			name: '',
			description: '',
			price: '',
			ingredients: '',
			chosen: false,
			dup: 'skip',
			moved: false,
			priceBlanked: false
		};
		fill(row);
		return row;
	}

	/**
	 * Which list a row is shown in. A row put out of the menu stays where it
	 * was, greyed, so the tap that put it out can be taken back; an unsure row
	 * that could be a dish is on this table with its Kind select lit, and one
	 * that could not (a spirits list, a row torn between the cellar and the
	 * bar) waits with the lines that were not placed.
	 */
	type Room = 'table' | 'wine' | 'cocktail' | 'unplaced';
	function roomOf(r: Row): Room {
		const k = r.kind === 'out' ? r.item.kind : r.kind;
		if (k === 'dish') return 'table';
		if (k === 'wine' || k === 'cocktail') return k;
		return r.item.kind === 'unsure' && r.item.could.includes('dish') ? 'table' : 'unplaced';
	}

	const tableRows = $derived(rows.filter((r) => roomOf(r) === 'table'));
	const wineRows = $derived(rows.filter((r) => roomOf(r) === 'wine' && r.kind !== 'out'));
	const cocktailRows = $derived(rows.filter((r) => roomOf(r) === 'cocktail' && r.kind !== 'out'));
	const unplacedRows = $derived(rows.filter((r) => roomOf(r) === 'unplaced'));
	const unplacedCount = $derived(unplacedRows.length + unsorted.length);
	/** The aria-label index within the table, so "row 3" is the third row a person sees. */
	const tableIndex = $derived(new Map(tableRows.map((r, i) => [r.key, i + 1])));

	const counts = $derived({
		...deskCounts(
			rows.filter((r) => r.kind !== 'out').map((r) => ({ kind: r.kind as DeskKind })),
			unsorted
		),
		lines: rows.length + unsorted.length
	});

	/** The `why` on a row the guard blanked, for the room the row goes on to. */
	const TABLE_BLANKED_WHY = 'No price on this line: the price read was not on the lines the row came from, so the desk blanked it.';

	/** Every row as it stands, edits applied to the dishes and the guard's blank to every row, for the download and the hand-off. */
	function edited(r: Row): DeskItem {
		const item = r.item;
		if (item.kind !== 'dish') {
			// The other rooms get the row as read, except a price the guard
			// blanked: a wine list handed on with a price this table just said
			// was not on the page would be the flag lying one way on screen and
			// the file the other.
			if (!r.priceBlanked || !item.price.printed) return item;
			return { ...item, price: { printed: '', parts: [] }, confidence: 'low', why: [...item.why, TABLE_BLANKED_WHY] };
		}
		const price = r.price.trim();
		return {
			...item,
			section: r.section.trim(),
			name: r.name.trim(),
			description: r.description.trim(),
			price: { printed: price, parts: priceParts(price) },
			ingredientsNamed: splitIngredients(r.ingredients)
		};
	}

	const splitIngredients = (s: string) =>
		s
			.split(',')
			.map((x) => x.trim())
			.filter(Boolean);

	function currentFile(): DeskFile | null {
		if (!read) return null;
		return {
			...read.file,
			items: rows.filter((r) => r.kind !== 'out').map(edited),
			unsorted: [...unsorted]
		};
	}

	/**
	 * Puts a desk file on the table. From a read, every row; from the inbox or
	 * a file, only the rows some room has not yet taken, because an adopted
	 * share re-offered is a duplicate waiting to be made.
	 */
	async function loadDesk(
		file: DeskFile,
		from: 'read' | 'inbox' | 'file',
		focus = true,
		differs?: Map<string, OfflineDiffers>
	) {
		const taken = file.taken ?? {};
		const visible =
			from === 'read'
				? file.items
				: file.items.filter((i) => {
						const ks = kindsFor(i);
						return ks.length === 0 || ks.some((k) => k !== 'unsure' && !taken[k]);
					});
		rows = visible.map((i) => {
			const row = toRow(i);
			const d = differs?.get(i.id);
			if (d) row.differs = d;
			return row;
		});
		unsorted = [...file.unsorted];
		read = { file, from };
		showRoom = null;
		alreadyRead = null;
		done = null;
		saveError = '';
		deskFileError = '';
		replaceOk = false;
		live = countsLine(counts);
		if (!focus) return;
		// The table is what the cook has to work through next, so the heading
		// above it is where the keyboard should land, not the button they just
		// pressed halfway up the panel.
		await tick();
		reviewHead?.focus();
	}

	/**
	 * Read the box. The same menu pasted twice is recognised by its hash and
	 * offered rather than read again, unless the person says to read it anyway.
	 */
	async function parse(source: 'paste' | 'photo' | 'link' = 'paste', opts: { url?: string; venue?: string; again?: boolean } = {}) {
		if (!text.trim()) return;
		if (!opts.again) {
			const inbox = readDeskInbox();
			if (inbox && inbox.source.hash === hashText(text)) {
				const share = deskShare(inbox, 'dish');
				if (share.length) {
					alreadyRead = { file: inbox, dishes: share.length };
					return;
				}
			}
		}
		const file = readMenu(text, deskSource(source, 'table', text, { url: opts.url }), { venue: opts.venue });
		await loadDesk(file, 'read');
	}

	/* ---- the Maître d' ------------------------------------------------------
	 * Her three doors land on this same table by one road: the client's flat
	 * desk through adoptRead, then loadDesk with from 'read'. When she read
	 * text (a paste, a fetched page), the offline reader reads the same text
	 * beside her and every row where the two disagree carries the "Differs
	 * from the offline read" flag with the offline reading; the offline read
	 * is never applied. A hand-edited table is asked about first, once per
	 * table, because her read replaces it whole.
	 */

	/** The person said her read may replace the edited table; cleared by every load. */
	let replaceOk = $state(false);
	let confirmEl: HTMLDialogElement | undefined = $state();
	let confirmResolve: ((ok: boolean) => void) | null = null;
	let confirmOpener: Element | null = null;

	function confirmReplace(): Promise<boolean> {
		if (!confirmEl || typeof confirmEl.showModal !== 'function') return Promise.resolve(true);
		return new Promise((resolve) => {
			confirmResolve = resolve;
			// The opener is remembered and refocused on close: showModal gives the
			// trap and the Escape, and the return of focus is the part browsers
			// have not always done.
			confirmOpener = document.activeElement;
			confirmEl!.showModal();
			confirmEl!.querySelector<HTMLButtonElement>('button[value="no"]')?.focus();
		});
	}
	function onConfirmClose() {
		const ok = confirmEl?.returnValue === 'yes';
		if (confirmEl) confirmEl.returnValue = '';
		const back = confirmOpener;
		confirmOpener = null;
		if (back instanceof HTMLElement && document.body.contains(back)) back.focus();
		confirmResolve?.(ok);
		confirmResolve = null;
	}

	/** True when her read may go ahead over what is on the table. */
	async function mayReplace(): Promise<boolean> {
		if (!rows.length || replaceOk || !rows.some(touched)) return true;
		const ok = await confirmReplace();
		if (ok) replaceOk = true;
		return ok;
	}

	/** Her read onto the table, with the offline read beside it where there was text to read. */
	async function takeHerRead(result: MaitreReadResult, opts: { url?: string; venue?: string }) {
		const file = adoptRead(result, { readIn: 'table', url: opts.url, venue: opts.venue });
		const sourceText = result.sourceText;
		const differs = sourceText
			? diffAgainstOffline(file, readMenu(sourceText, deskSource('paste', 'table', sourceText)))
			: undefined;
		await loadDesk(file, 'read', true, differs);
	}

	const wing = 'table' as const;
	type DoorOpts = { onProgress: (p: MaitreProgress) => void; confirmed: boolean };

	async function readWithHer(api: MaitreApi, opts: DoorOpts) {
		const body = text;
		if (!body.trim()) return '';
		if (!(await mayReplace())) return 'Kept your edits. Nothing was sent.';
		const result = await api.readMenu({ text: body }, { wing, onProgress: opts.onProgress, confirmed: opts.confirmed });
		await takeHerRead(result, {});
		return '';
	}

	async function photoWithHer(api: MaitreApi, opts: DoorOpts, files?: File[]) {
		if (!files?.length) return '';
		if (!(await mayReplace())) return 'Kept your edits. Nothing was sent.';
		const result = await api.readMenu({ images: files }, { wing, onProgress: opts.onProgress, confirmed: opts.confirmed });
		photoError = '';
		await takeHerRead(result, {});
		return '';
	}

	async function linkWithHer(api: MaitreApi, opts: DoorOpts) {
		const typed = url.trim();
		if (!typed) return '';
		if (!(await mayReplace())) return 'Kept your edits. Nothing was sent.';
		// The scheme the address box lets a person leave off, put back the way
		// menu-link's tidyUrl puts it back: https, never http.
		const address = /^https?:\/\//i.test(typed) ? typed : `https://${typed}`;
		const result = await api.readMenu({ url: address }, { wing, onProgress: opts.onProgress, confirmed: opts.confirmed });
		linkFail = null;
		await takeHerRead(result, { url: address });
		return '';
	}

	/* ---- reading a photograph -------------------------------------------- */

	async function onPhoto(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		photoError = '';
		reading = true;
		pct = 0;
		progressNote = 'Opening the photo';
		try {
			const result = await imageToText(file, (p, note) => {
				pct = p;
				progressNote = note;
			});
			// Into the same box as a paste, always. The cook can see exactly what
			// was read off the picture and mend a misread line before it becomes
			// a row, which is the whole reason the reader hands back text rather
			// than dishes.
			text = result.text;
			await parse('photo');
		} catch (err) {
			// Verbatim. Every throw out of menu-ocr is already a sentence in this
			// app's voice that says what to do next, and wrapping it in an
			// apology would bury the instruction.
			photoError = err instanceof Error ? err.message : 'That photo could not be read.';
		} finally {
			reading = false;
			// Cleared so picking the SAME file again still fires a change event,
			// which is what somebody does after retaking a blurry shot.
			input.value = '';
		}
	}

	/* ---- reading a link --------------------------------------------------- */

	async function fetchLink() {
		if (!url.trim()) return;
		fetching = true;
		linkFail = null;
		try {
			const result = await linkToText(url);
			if (result.ok) {
				text = result.text;
				await parse('link', { url: url.trim(), venue: result.title });
				return;
			}
			// Never dressed up as anything else: most restaurant sites refuse a
			// cross-origin read, and telling the cook it half-worked would cost
			// them the minute it takes to copy the page by hand instead.
			linkFail = { reason: result.reason, openUrl: result.openUrl };
		} finally {
			fetching = false;
		}
	}

	/* ---- a desk file from another device ----------------------------------- */

	async function onDeskFile(e: Event) {
		const input = e.target as HTMLInputElement;
		const picked = input.files?.[0];
		if (!picked) return;
		deskFileError = '';
		try {
			const file = readDeskFile(await picked.text());
			if (!file) {
				deskFileError = 'That is not a desk file this app can read. It wants the menu-desk file another device downloaded from here.';
				return;
			}
			await loadDesk(file, 'file');
		} finally {
			input.value = '';
		}
	}

	/* ---- the review table -------------------------------------------------- */

	/**
	 * Names already on the menu, folded for comparison only. Never used to
	 * rewrite a row: the cook's spelling is the one that goes on the plate.
	 */
	const onMenu = $derived(
		new Set(house.dishes.map((d) => d.name.trim().toLowerCase()).filter(Boolean))
	);
	const isDuplicate = (r: Row) => {
		const n = r.name.trim().toLowerCase();
		return n !== '' && onMenu.has(n);
	};

	const named = $derived(tableRows.filter((r) => r.kind === 'dish' && r.name.trim() !== ''));
	const duplicates = $derived(named.filter(isDuplicate));
	/** Rows that will actually be added: dishes, named, and not a duplicate being skipped. */
	const accepted = $derived(named.filter((r) => !(isDuplicate(r) && r.dup === 'skip')));
	const chosenCount = $derived(tableRows.filter((r) => r.chosen).length);
	const allChosen = $derived(tableRows.length > 0 && chosenCount === tableRows.length);

	/**
	 * What goes to the other rooms when the dishes are added: every wine,
	 * cocktail and undecided row, except those a room has already had its
	 * look at, unless a person moved the row there in this sitting.
	 */
	const handing = $derived.by(() => {
		const taken = read?.file.taken ?? {};
		return rows
			.filter((r) => {
				if (r.kind === 'out' || r.kind === 'dish') return false;
				if (r.moved) return true;
				return kindsFor(r.item).some((k) => k !== 'dish' && k !== 'unsure' && !taken[k]);
			})
			.map(edited);
	});
	const handingWines = $derived(handing.filter((i) => i.kind === 'wine').length);
	const handingCocktails = $derived(handing.filter((i) => i.kind === 'cocktail').length);

	/** Sections to offer: what the menu already uses, plus what this read found. */
	const sectionChoices = $derived([
		...new Set(
			[...house.dishes.map((d) => d.section), ...tableRows.map((r) => r.section)]
				.map((s) => s.trim())
				.filter(Boolean)
		)
	]);

	function chooseAll(on: boolean) {
		for (const r of tableRows) r.chosen = on;
	}

	/**
	 * A photograph loses the headings far more often than it loses the dishes:
	 * the section is set in a lighter face across the page and the reader drops
	 * it or folds it into the dish below. Retyping "Starters" onto nine rows one
	 * at a time is the point somebody gives up, so it is one control here.
	 */
	function applySection() {
		const s = bulkSection.trim();
		for (const r of tableRows) if (r.chosen) r.section = s;
	}

	/**
	 * A person's answer to the Kind column. Out of the menu is a mark on the
	 * row, reversible; a different kind is a re-read of the row's own lines
	 * (reReadAs), so a dish that turns out to be a wine gets its vintage and
	 * pours from the lines it always had and carries nothing over from the
	 * dish fields. Back to the kind it was read as restores it as read.
	 */
	function setKind(row: Row, kind: RowKind) {
		if (kind === row.kind || kind === 'unsure') return;
		if (kind === 'out') {
			row.kind = 'out';
			return;
		}
		if (kind !== row.item.kind) {
			row.item = reReadAs(row.item, kind);
			row.moved = true;
			fill(row);
		}
		row.kind = kind;
		live = countsLine(counts);
	}

	function sendChosen(kind: 'wine' | 'cocktail' | 'out') {
		for (const r of tableRows) if (r.chosen) setKind(r, kind);
	}

	/** An unplaced line made into a row of the kind a person chose, read from the line itself. */
	function place(u: DeskUnsorted, kind: DeskWingKind) {
		const seed: DeskUnsure = {
			id: mintDeskId(rows.map((r) => r.key)),
			kind: 'unsure',
			section: '',
			name: u.raw,
			price: { printed: '', parts: [] },
			marks: [],
			confidence: 'low',
			why: [],
			raw: u.raw,
			lines: [u.line, u.line],
			could: []
		};
		const row = toRow(reReadAs(seed, kind));
		row.moved = true;
		rows.push(row);
		unsorted = unsorted.filter((x) => x !== u);
		live = countsLine(counts);
	}

	/**
	 * The same mint the hand form uses: 'd-' and eight base36 characters.
	 *
	 * Copied rather than shared because a component cannot reach into the page's
	 * scope, and given the `taken` guard the hand form does not need: this mints
	 * a whole menu in one pass, so two rows colliding is a thing that can happen
	 * here and cannot happen when a person saves one dish at a time. A collision
	 * would put two dishes under one id, and the costing sheet keys on that id.
	 */
	function mintDishId(taken: Set<string>) {
		let s = '';
		do {
			s = 'd-';
			while (s.length < 10) s += Math.floor(Math.random() * 36).toString(36);
		} while (taken.has(s));
		taken.add(s);
		return s;
	}

	/**
	 * Add the dishes here and hand the rest on. On the shared origin the other
	 * rooms' rows go to the inbox and this room's share is marked taken; off
	 * it, the desk file is what carries them, and the done paragraph says so
	 * with the download beside it. A refused inbox (private browsing, a full
	 * quota, a list too big for the slot) is reported in the inbox's own words
	 * and falls back to the same download.
	 */
	async function save() {
		// The house-side guard the session import already carries. While the
		// record is blocked, addDish mutates memory and never reaches disk, so
		// without this the panel would count the dishes as landed and they would
		// be gone on the next reload.
		if (house.blocked) {
			saveError =
				'This tablet is running an older version than the one that saved your menu. Adding dishes is paused until it updates.';
			return;
		}
		if (!read) return;
		const going = accepted;
		const passing = handing;
		if (!going.length && !passing.length) return;
		const taken = new Set(house.dishes.map((d) => d.id));
		const stamp = Date.now();
		for (const r of going) {
			const dish: MenuDish = {
				id: mintDishId(taken),
				name: r.name.trim(),
				// Left blank when the menu never said, rather than filled with an
				// invented category: the list below already groups a blank section
				// under "The Menu", so nothing is lost and nothing is claimed.
				section: r.section.trim(),
				description: r.description.trim(),
				// What the row says, and the row was prefilled only from a printed
				// list: a sentence names nothing, and a person typed the rest.
				ingredients: splitIngredients(r.ingredients),
				// THE TWO FIELDS THIS FEATURE MUST NOT WRITE. An empty list with no
				// `allergensCheckedAt` is what makes the menu read "Allergens not
				// marked: ask the kitchen". Stamping the date here, on a dish read
				// off a photograph, would turn that into "checked, and it holds
				// none" for a dish nobody has looked at.
				allergens: [],
				price: r.price.trim(),
				ts: stamp
			};
			house.addDish(dish);
		}

		// The inbox as it stood BEFORE this Add writes to it: the merge below
		// puts this read's source on the merged file, so a look at the slot
		// after the write would call whatever it holds the same read as this.
		const inboxBefore = readDeskInbox();
		const file = currentFile();
		lastFile = file;
		const wines = handingWines;
		const cocktails = handingCocktails;
		let handed = false;
		let said = '';
		if (passing.length && file) {
			if (shared) {
				const res = writeDeskInbox({ ...file, items: passing });
				handed = res.ok;
				if (!res.ok) said = res.said;
			} else {
				const what = handList(wines, cocktails) || 'The rows for the other rooms';
				said = `${what} ${wines + cocktails === 1 ? 'is' : 'are'} on the desk file. Download it and import it in the Codex or the Ledger.`;
			}
		}
		// This room has had its look at the share it adopted, whether it added a
		// dish or not, and the share is never offered here twice: the rows came
		// off the inbox, or off a paste of the same read (one hash). A fresh
		// paste adopted here says nothing about another room's dish share still
		// waiting in the slot, and stamping that taken would silence it on
		// Today and on the desk without anyone having looked at it. Once every
		// room has looked the slot is cleared.
		const sameRead = !!(inboxBefore && file && inboxBefore.source.hash === file.source.hash);
		if (read.from === 'inbox' || sameRead) markDeskTaken('dish');
		waiting = 0;

		done = { saved: going.length, wines, cocktails, handed, said };
		live = going.length
			? `${going.length} ${going.length === 1 ? 'dish is' : 'dishes are'} on the menu.`
			: `${handList(wines, cocktails)} handed on.`;
		// Everything from the run just saved, the failures included: a photo error
		// or a refused address left standing would be waiting on screen the next
		// time somebody opens the panel, describing a menu that is already on.
		rows = [];
		unsorted = [];
		read = null;
		text = '';
		url = '';
		photoError = '';
		linkFail = null;
		opened = false;
		await tick();
		doneEl?.focus();
	}

	function downloadCurrent() {
		const file = currentFile() ?? lastFile;
		if (file) downloadDesk(file);
	}

	function startOver() {
		rows = [];
		unsorted = [];
		read = null;
		alreadyRead = null;
		saveError = '';
		photoError = '';
		linkFail = null;
		deskFileError = '';
		pasteEl?.focus();
	}

	/** A short read-only line under a waiting row: what the other room will see. */
	function detailOf(item: DeskItem): string {
		switch (item.kind) {
			case 'wine':
				return [item.vintage, item.descriptors].filter(Boolean).join(' · ');
			case 'cocktail':
				return item.spec.length ? item.spec.join(' | ') : item.description;
			case 'unsure':
				return item.why.join(' ');
			default:
				return item.description;
		}
	}
</script>

<section class="import" id="desk" data-print="hide">
	<!-- Rendered whatever the panel is doing: a live region that appears with
	     its first message is one many screen readers never announce. -->
	<p class="sr" role="status" aria-live="polite">{live}</p>
	{#if !open}
		<div class="collapsed">
			<button
				class="chip big"
				onclick={() => {
					opened = true;
					done = null;
				}}>Bring a menu in ▸</button
			>
			<span class="collapsedhint">Paste it, photograph it, or give the app the address.</span>
		</div>
		{#if done}
			<!-- tabindex -1 so the focus that moved here after Add has something to
			     land on: the panel it came from has just closed. -->
			<p class="done" bind:this={doneEl} tabindex="-1">
				{#if done.saved}
					<b>{done.saved} {done.saved === 1 ? 'dish is' : 'dishes are'} on the menu.</b>
					Allergens are not marked on any of them. Open each dish, check it against its build, and
					tick the allergen box before it goes to a table.
				{/if}
				{#if done.wines || done.cocktails}
					{#if done.handed}
						<span class="waitlinks">
							{#if done.wines}
								<a href={siblingHref('wine', base)}
									>{done.wines} {done.wines === 1 ? 'wine is' : 'wines are'} waiting in the Codex ▸</a
								>
							{/if}
							{#if done.cocktails}
								<a href={siblingHref('cocktail', base)}
									>{done.cocktails}
									{done.cocktails === 1 ? 'cocktail is' : 'cocktails are'} waiting in the Ledger ▸</a
								>
							{/if}
						</span>
					{:else}
						<span class="waitlinks">{done.said}</span>
						<button class="chip" onclick={downloadCurrent}>Download the desk file</button>
					{/if}
				{/if}
			</p>
		{/if}
	{:else}
		<div class="head">
			<h3 class="sec">The Menu Desk</h3>
			<!-- Closable even on an empty menu. It opens itself there because that is
			     the visit it exists for, but somebody who would rather type the first
			     dish in by hand should not have to scroll past a panel they have
			     already decided against. -->
			<button class="chip" onclick={() => (opened = false)}>Close</button>
		</div>
		<p class="hint">
			Paste a venue's whole menu, photograph it, or give the app the address. Dishes stay here for
			the kitchen, wines go to the Codex and cocktails to the Ledger, and every row is shown for you
			to correct before anything is saved.
		</p>
		<!--
			Said once, at the top, before a file is picked. This is the sentence
			that keeps the feature honest: see the allergen rule in the file header.
		-->
		<p class="allergenote">
			<b>Importing fills in no allergen information.</b> Every dish arrives unchecked and has to be checked
			against its build, dish by dish, before it goes to a table.
		</p>

		{#if house.blocked}
			<p class="warn" role="alert">
				This tablet is running an older version than the one that saved your menu. Dishes cannot be
				added until it updates.
			</p>
		{/if}

		<div class="ways">
			<div class="way paste">
				<label class="fieldlabel" for="import-paste">Paste your menu</label>
				<p class="waynote">
					Works on any device, with no connection. Copy the menu from wherever it is and drop it in.
				</p>
				<textarea
					id="import-paste"
					rows="6"
					bind:this={pasteEl}
					bind:value={text}
					placeholder={'STARTERS\nCrispy squid, lemon aioli 9.50\nSoup of the day 6'}
				></textarea>
				<!-- The two engines, in this order and never the other way round:
				     the offline reader is the normal route, and she is the second. -->
				<div class="engines">
					<div class="engine">
						<button class="chip go" onclick={() => parse()} disabled={!text.trim()}>Read it here</button>
						<span class="enginenote">On this device. Free, instant, works offline.</span>
					</div>
					<div class="engine">
						<!-- The second engine. Without a key the door is her one chip;
						     with one and no network it is a sentence; the button says
						     what it sends before it is pressed. -->
						<MaitreDoor
							label="Ask the Maître d' to read it"
							sends="Sends the menu text to Anthropic."
							task="read"
							input={text.trim() ? { text } : null}
							disabled={!text.trim()}
							run={readWithHer}
						/>
					</div>
				</div>
				{#if alreadyRead}
					<div class="warn" role="alert">
						<p>
							This menu was read {readInName(alreadyRead.file.source.readIn)}
							{whenRead(alreadyRead.file.source.at)}. {alreadyRead.dishes}
							{alreadyRead.dishes === 1 ? 'dish is' : 'dishes are'} already waiting here.
						</p>
						<div class="chips">
							<button class="chip" onclick={() => alreadyRead && loadDesk(alreadyRead.file, 'inbox')}
								>Look them over</button
							>
							<button class="chip" onclick={() => parse('paste', { again: true })}>Read it again anyway</button>
						</div>
					</div>
				{/if}
			</div>

			<div class="way">
				<span class="fieldlabel">Or photograph it</span>
				<!-- Said BEFORE the picker, out of ocrPlan(). A browser with no reader
				     is told so here rather than after somebody has taken the picture,
				     and the picker is withheld: a control that can only fail is worse
				     than no control. Nothing is fetched on this path any more, so there
				     is no longer anyone to disclose. -->
				{#if plan === null}
					<p class="waynote">Point the camera at the printed menu, or pick a photo you already took.</p>
				{:else if plan.native}
					<p class="waynote">
						This device reads photos itself, and nothing is downloaded to read one. The picture
						leaves the device only through the Maître d's door, when you press it.
					</p>
				{:else}
					<p class="waynote">
						This browser cannot read photographs, and this app will not fetch a reader to do
						it. On a phone, hold your finger on the text in the picture, copy it, and paste it
						into the box above. Or give the address of the menu below. Or, with her key on this
						device, send the picture to the Maître d': it leaves the device through her door and
						no other.
					</p>
				{/if}
				<!--
					No `capture` attribute, deliberately. It forces the camera open and
					hides the camera roll, and the photo of the menu is very often one
					somebody took last week. `accept` alone still offers the camera as a
					choice on both phone platforms.
				-->
				{#if plan === null || plan.native}
					<label class="filebtn chip">
						<input
							type="file"
							accept="image/*"
							onchange={onPhoto}
							disabled={reading}
						/>
						{reading ? 'Reading…' : 'Choose a photo'}
					</label>
				{/if}
				{#if reading}
					<div class="progline">
						<!-- The bar is the picture; the sentence beside it is what gets
						     announced. Marking the bar up as well would read the same
						     progress out twice, once per percent. -->
						<progress max="100" value={pct} aria-hidden="true"></progress>
						<span class="note" role="status">{progressNote} · {pct}%</span>
					</div>
				{/if}
				{#if photoError}
					<p class="warn" role="alert">{photoError}</p>
				{/if}
				<!-- Her picker, only when she is here: the engine row above already
				     says "bring her in" and "online only" for the whole panel. The
				     picture is sent to her and the device's own reader never sees it;
				     she draws it down to 1600 px first, on the device. -->
				<div class="herdoor">
					<MaitreDoor
						quiet
						label="Send a photo to the Maître d'"
						sends="Sends the picture to Anthropic, sized down on this device first. The picture leaves the device through this door and no other."
						task="read"
						input={{ images: [{}], lines: 40 }}
						accept="image/*"
						multiple
						run={photoWithHer}
					/>
				</div>
			</div>

			<div class="way">
				<label class="fieldlabel" for="import-url">Or read it off a web page</label>
				<p class="waynote">
					Most restaurant sites will not let another app read them. If this one will not, the address
					opens in a new tab so you can copy the menu across; or the Maître d' can fetch it, and
					then the address goes to Anthropic when you ask her, and nowhere else.
				</p>
				<div class="urlrow">
					<input
						id="import-url"
						type="url"
						inputmode="url"
						bind:value={url}
						placeholder="joesdiner.com/menu"
					/>
					<button class="chip go" onclick={fetchLink} disabled={!url.trim() || fetching}>
						{fetching ? 'Reading…' : 'Read the page'}
					</button>
				</div>
				{#if linkFail}
					<div class="warn" role="alert">
						<p>{linkFail.reason}</p>
						{#if linkFail.openUrl}
							<!-- Hidden when there is nothing safe to open: menu-link returns an
							     empty address for one it refused to fetch at all, and turning
							     that into a link is exactly what the refusal was for. -->
							<p>
								<a class="chip" href={linkFail.openUrl} target="_blank" rel="noopener noreferrer"
									>Open the page ▸</a
								>
							</p>
							<p class="waynote">Copy the menu from that page and paste it into the box above.</p>
						{/if}
					</div>
				{/if}
				<!-- Her fetch: the one path on this panel that can read a site that
				     refuses this browser, because Anthropic's fetch is not bound by
				     the site's cross-origin rule. The address is the whole of what
				     goes, and the fetched page is what her prices are checked against. -->
				<div class="herdoor">
					<MaitreDoor
						quiet
						label="Ask the Maître d' to read the page"
						sends="Sends the address to Anthropic, which fetches the page for her. The address goes nowhere else."
						task="read"
						input={url.trim() ? { url: url.trim() } : null}
						disabled={!url.trim()}
						run={linkWithHer}
					/>
				</div>
			</div>

			<div class="way deskfile">
				<label class="filebtn chip">
					<input type="file" accept=".json,application/json" onchange={onDeskFile} />
					Import a desk file
				</label>
				<span class="waynote">
					The menu-desk file another device downloaded from here. Its rows come to this table to look
					over; nothing is saved until you add them.
				</span>
				{#if deskFileError}<p class="warn" role="alert">{deskFileError}</p>{/if}
			</div>
		</div>

		<!-- Asked once per table, before her read replaces a table somebody has
		     typed into. A native dialog: the trap, the Escape and the backdrop
		     are the browser's, and focus goes back to the door that opened it. -->
		<dialog class="confirm" bind:this={confirmEl} aria-labelledby="desk-confirm-h" onclose={onConfirmClose}>
			<form method="dialog">
				<p id="desk-confirm-h"><b>Her read replaces the table, edits included.</b></p>
				<div class="chips">
					<button class="chip go" value="yes">Read it anyway</button>
					<button class="chip" value="no">Keep my edits</button>
				</div>
			</form>
		</dialog>

		{#if read}
			<h3 class="sec" bind:this={reviewHead} tabindex="-1">Check it before it goes on</h3>
			{#if read.from === 'inbox'}
				<p class="fromdesk">
					<b>From the Menu Desk: {tableRows.length} {tableRows.length === 1 ? 'dish' : 'dishes'} waiting.</b>
					Read {readInName(read.file.source.readIn)}, {whenRead(read.file.source.at)}.
				</p>
			{/if}
			<p class="counts">{countsLine(counts)}</p>
			{#if read.file.source.kind === 'photo'}
				<p class="hint">Check the prices: a reader mistakes 8 for 3 and drops decimals.</p>
			{:else if read.file.source.kind === 'agent'}
				<p class="hint">Read by the Maître d'. Every row still shows the line it came from.</p>
			{/if}
			{#if read.file.notice}
				<p class="warn" role="alert">{read.file.notice}</p>
			{/if}
			{#if duplicates.length}
				<p class="hint">{duplicates.length} already on the menu.</p>
			{/if}

			{#if tableRows.length}
				<div class="bulk">
					<label class="fieldlabel" for="import-bulk">Set the section on the ticked rows</label>
					<div class="urlrow">
						<input
							id="import-bulk"
							list="import-sections"
							bind:value={bulkSection}
							placeholder="Starters, Mains…"
						/>
						<button class="chip" onclick={applySection} disabled={chosenCount === 0}>
							Apply to {chosenCount}
							{chosenCount === 1 ? 'row' : 'rows'}
						</button>
					</div>
					<datalist id="import-sections">
						{#each sectionChoices as s (s)}<option value={s}></option>{/each}
					</datalist>
					<div class="sendrow" role="group" aria-label="Send the ticked rows to">
						<span class="fieldlabel" aria-hidden="true">Send the ticked rows to:</span>
						<button class="chip" onclick={() => sendChosen('wine')} disabled={chosenCount === 0}>The cellar</button>
						<button class="chip" onclick={() => sendChosen('cocktail')} disabled={chosenCount === 0}>The bar</button>
						<button class="chip" onclick={() => sendChosen('out')} disabled={chosenCount === 0}>Leave out</button>
					</div>
				</div>

				<!-- Its own scroller above 640px: on a tablet this table is wider than
				     the glass, and a page that slides sideways loses the buttons. Under
				     640px each row becomes a card and the header goes off screen, so
				     nothing has to scroll sideways on a phone at all. -->
				<div class="tablewrap">
					<table class="review">
						<caption class="sr">Rows read from your menu, ready to correct</caption>
						<thead>
							<tr>
								<th scope="col" class="tick">
									<input
										type="checkbox"
										checked={allChosen}
										onchange={(e) => chooseAll(e.currentTarget.checked)}
										aria-label="Tick every row"
									/>
								</th>
								<th scope="col">Kind</th>
								<th scope="col">Section</th>
								<th scope="col">Dish</th>
								<th scope="col">Description</th>
								<th scope="col">Price</th>
								<th scope="col">Ingredients</th>
								<th scope="col">Row</th>
							</tr>
						</thead>
						<tbody>
							{#each rows as row (row.key)}
								{#if roomOf(row) === 'table'}
									{@const n = tableIndex.get(row.key) ?? 0}
									{@const dupe = row.kind === 'dish' && isDuplicate(row)}
									{@const out = row.kind === 'out'}
									{@const unsure = row.kind === 'unsure'}
									<tr
										class:low={row.item.confidence === 'low' || row.priceBlanked}
										class:dropped={out || (dupe && row.dup === 'skip')}
									>
										<td class="tick" data-label="Tick">
											<!-- The label is the tap target, 44px like every other control
											     on the desk; the native tick inside it stays the size the OS
											     draws, because a checkbox stretched to 44px is a box, not a
											     tick. The aria-label on the input is still its name. -->
											<label class="tickbox">
												<input type="checkbox" bind:checked={row.chosen} aria-label="Tick row {n}" />
											</label>
										</td>
										<td data-label="Kind">
											<!-- Before Section on purpose: a row that is a wine gets said
											     so before anyone types into its dish fields. -->
											<select
												class="kind"
												class:ask={unsure}
												value={row.kind}
												onchange={(e) => setKind(row, e.currentTarget.value as RowKind)}
												aria-label="Kind, row {n}"
											>
												{#if unsure}<option value="unsure">Not sure</option>{/if}
												<option value="dish">Dish</option>
												<option value="wine">Wine</option>
												<option value="cocktail">Cocktail</option>
												<option value="out">Not a menu line</option>
											</select>
										</td>
										<td data-label="Section">
											<input
												bind:value={row.section}
												list="import-sections"
												aria-label="Section, row {n}"
											/>
										</td>
										<td data-label="Dish">
											<input bind:value={row.name} aria-label="Dish name, row {n}" />
										</td>
										<td data-label="Description">
											<input bind:value={row.description} aria-label="Description, row {n}" />
										</td>
										<td class="price" data-label="Price">
											<input bind:value={row.price} aria-label="Price, row {n}" />
										</td>
										<td data-label="Ingredients">
											<input
												bind:value={row.ingredients}
												placeholder="Comma separated"
												aria-label="Ingredients, row {n}"
											/>
										</td>
										<td class="notes" data-label="Row">
											<!-- A word and a rule, never a colour on its own: this gets
											     read at an angle on a bench under a hot lamp. -->
											{#if unsure}
												<span class="flag">Not sure what this is</span>
												<span class="raw">{row.item.why.join(' ')}</span>
											{/if}
											{#if row.priceBlanked}
												<span class="flag">No price on this line</span>
											{/if}
											{#if read.file.source.kind === 'photo' && row.price}
												<span class="flag">Photo: check the price</span>
											{/if}
											{#if row.differs}
												<span class="flag">Differs from the offline read: {row.differs.name} · {row.differs.price}</span>
											{/if}
											{#if row.item.confidence === 'low' && !unsure}
												<span class="flag">Check this row</span>
											{/if}
											{#if row.item.confidence === 'low' || row.priceBlanked}
												<span class="raw">Read as: {row.item.raw}</span>
											{/if}
											{#if dupe}
												<span class="flag">Already on the menu</span>
												<div class="chips" role="group" aria-label="Duplicate, row {n}">
													<button
														class="chip"
														class:on={row.dup === 'skip'}
														aria-pressed={row.dup === 'skip'}
														onclick={() => (row.dup = 'skip')}>Skip it</button
													>
													<button
														class="chip"
														class:on={row.dup === 'add'}
														aria-pressed={row.dup === 'add'}
														onclick={() => (row.dup = 'add')}>Add it anyway</button
													>
												</div>
											{/if}
											{#if row.item.marks.length}
												<span class="raw">Marks printed: {row.item.marks.join(' · ')}</span>
											{/if}
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				</div>
				{#if tableRows.some((r) => r.item.marks.length)}
					<p class="hint">
						Marks printed on the menu are shown so you can retype them where they belong. They are
						not saved and they are not an allergen check.
					</p>
				{/if}
			{:else if !counts.lines}
				<p class="warn" role="alert">
					No dishes were read out of that text. Check the box above has the menu in it, or type the
					dishes in below.
				</p>
			{/if}

			{#if wineRows.length || cocktailRows.length || unplacedCount}
				<div class="rooms">
					<h4 class="roomshead">Waiting for the other rooms</h4>
					<div class="chips">
						{#if wineRows.length}
							<button
								class="chip"
								aria-expanded={showRoom === 'wine'}
								onclick={() => (showRoom = showRoom === 'wine' ? null : 'wine')}
								>{showRoom === 'wine' ? 'Hide' : 'Show'} the {wineRows.length}
								{wineRows.length === 1 ? 'wine' : 'wines'} for the Codex</button
							>
						{/if}
						{#if cocktailRows.length}
							<button
								class="chip"
								aria-expanded={showRoom === 'cocktail'}
								onclick={() => (showRoom = showRoom === 'cocktail' ? null : 'cocktail')}
								>{showRoom === 'cocktail' ? 'Hide' : 'Show'} the {cocktailRows.length}
								{cocktailRows.length === 1 ? 'cocktail' : 'cocktails'} for the Ledger</button
							>
						{/if}
						{#if unplacedCount}
							<button
								class="chip"
								aria-expanded={showRoom === 'unplaced'}
								onclick={() => (showRoom = showRoom === 'unplaced' ? null : 'unplaced')}
								>{showRoom === 'unplaced' ? 'Hide' : 'Show'} the {unplacedCount}
								{unplacedCount === 1 ? 'line' : 'lines'} I could not place</button
							>
						{/if}
					</div>
					{#if showRoom}
						<ul class="roomlist">
							{#each rows as row (row.key)}
								{#if roomOf(row) === showRoom}
									<li class:dropped={row.kind === 'out'}>
										<div class="roomrow">
											<b>{row.item.name}</b>
											{#if row.item.section}<span class="raw">{row.item.section}</span>{/if}
											{#if row.price}<span class="raw">{row.price}</span>{/if}
										</div>
										{#if detailOf(row.item)}<span class="raw">{detailOf(row.item)}</span>{/if}
										{#if row.priceBlanked}<span class="flag">No price on this line</span>{/if}
										{#if row.item.kind === 'unsure' && row.item.could.length === 0}
											<span class="flag">No room here keeps this</span>
										{/if}
										<select
											class="kind"
											class:ask={row.kind === 'unsure'}
											value={row.kind}
											onchange={(e) => setKind(row, e.currentTarget.value as RowKind)}
											aria-label="Kind, {row.item.name}"
										>
											{#if row.kind === 'unsure'}<option value="unsure">Not sure</option>{/if}
											<option value="dish">Dish</option>
											<option value="wine">Wine</option>
											<option value="cocktail">Cocktail</option>
											<option value="out">Not a menu line</option>
										</select>
									</li>
								{/if}
							{/each}
							{#if showRoom === 'unplaced'}
								{#each unsorted as u (u.line + ':' + u.raw)}
									<li>
										<span class="raw">{u.raw}</span>
										<div class="chips" role="group" aria-label="Place the line: {u.raw}">
											<button class="chip" onclick={() => place(u, 'dish')}>Make it a dish</button>
											<button class="chip" onclick={() => place(u, 'wine')}>Make it a wine</button>
											<button class="chip" onclick={() => place(u, 'cocktail')}>Make it a cocktail</button>
										</div>
									</li>
								{/each}
							{/if}
						</ul>
					{/if}
				</div>
			{/if}

			{#if saveError}<p class="warn" role="alert">{saveError}</p>{/if}
			<div class="saverow">
				{#if accepted.length || !handing.length}
					<button class="chip go" onclick={save} disabled={!accepted.length || house.blocked}>
						Add {accepted.length}
						{accepted.length === 1 ? 'dish' : 'dishes'} to the menu
					</button>
				{:else}
					<button class="chip go" onclick={save} disabled={house.blocked}>
						Hand {handList(handingWines, handingCocktails) || 'the rest'} on
					</button>
				{/if}
				<button class="chip" onclick={downloadCurrent}>Download the desk file</button>
				<button class="chip" onclick={startOver}>Start again</button>
				{#if named.length !== accepted.length}
					<span class="hint">
						{named.length - accepted.length} skipped as already on the menu.
					</span>
				{/if}
			</div>
		{/if}
	{/if}
</section>

<style>
	.import {
		border: 1px solid var(--line);
		border-left: 3px solid var(--turmeric-deep);
		border-radius: var(--radius);
		padding: 14px 16px;
		margin: 12px 0 20px;
		background: var(--paper-raised);
		/* The #desk anchor lands below the sticky bar rather than under it. */
		scroll-margin-top: 90px;
	}
	.collapsed {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
	}
	.collapsedhint,
	.waynote,
	.hint,
	.enginenote {
		font-size: var(--t-micro);
		color: var(--ink-soft);
		font-style: italic;
		margin: 0;
	}
	.hint {
		margin: 6px 0 0;
		max-width: var(--measure);
	}
	.head {
		display: flex;
		gap: 10px;
		align-items: baseline;
		justify-content: space-between;
	}
	.sec {
		font-family: var(--text);
		font-size: var(--t-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--muted);
		border-bottom: 1px solid var(--line);
		padding-bottom: 5px;
		margin: 0 0 8px;
		font-weight: 500;
		flex: 1;
	}
	.sec:focus-visible {
		outline: 2px solid var(--turmeric-deep);
		outline-offset: 3px;
	}
	.chip {
		border: 1px solid var(--line);
		background: var(--card);
		padding: 8px 14px;
		border-radius: var(--radius);
		cursor: pointer;
		font-size: 14px;
		font-family: inherit;
		color: var(--ink);
		/* 44px, because this is tapped with a thumb beside a hot pass. Every
		   control on the desk, the small ones included: there is no small chip. */
		min-height: 44px;
	}
	.chip:hover:not(:disabled) {
		border-color: var(--turmeric);
	}
	.chip:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.chip.go {
		border-color: var(--turmeric-deep);
		font-weight: 600;
	}
	.chip.big {
		font-size: 15px;
		padding: 10px 18px;
	}
	.chip.on {
		border-color: var(--turmeric-deep);
		color: var(--turmeric-deep);
		font-weight: 700;
	}
	a.chip {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
	}
	/*
	 * The file input is hidden inside its own label, so the label IS the button
	 * and clicking it opens the picker. Kept in the tab order and reachable by
	 * keyboard: display:none on the input would take the control out entirely.
	 */
	.filebtn {
		display: inline-flex;
		align-items: center;
		width: fit-content;
	}
	.filebtn input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}
	.filebtn:focus-within {
		border-color: var(--turmeric-deep);
		outline: 2px solid var(--turmeric-deep);
		outline-offset: 2px;
	}
	.allergenote {
		margin: 8px 0 12px;
		padding: 10px 12px;
		border: 1px solid var(--chili);
		border-left-width: 3px;
		border-radius: var(--radius);
		font-size: var(--t-small);
		line-height: 1.55;
		max-width: var(--measure);
	}
	.warn {
		margin: 8px 0 0;
		padding: 8px 12px;
		border-left: 2px solid var(--chili);
		background: var(--card);
		font-size: var(--t-small);
		line-height: 1.5;
		max-width: var(--measure);
	}
	.warn p {
		margin: 0 0 6px;
	}
	.done,
	.fromdesk {
		margin: 10px 0 0;
		padding: 10px 12px;
		border-left: 3px solid var(--turmeric-deep);
		background: var(--card);
		font-size: var(--t-small);
		line-height: 1.55;
		max-width: var(--measure);
	}
	.fromdesk {
		margin: 0 0 8px;
	}
	.done:focus-visible {
		outline: 2px solid var(--turmeric-deep);
		outline-offset: 2px;
	}
	.waitlinks {
		display: block;
		margin-top: 6px;
	}
	.waitlinks a {
		color: inherit;
		margin-right: 14px;
	}
	.ways {
		display: grid;
		gap: 16px;
	}
	.fieldlabel {
		display: block;
		font-weight: 600;
		font-size: 14.5px;
		margin-bottom: 2px;
	}
	textarea,
	input[type='url'],
	.bulk input,
	.review input,
	.kind {
		border: 1px solid var(--field-line);
		background: var(--card);
		border-radius: var(--radius);
		padding: 8px 12px;
		font-size: 14.5px;
		font-family: inherit;
		color: var(--ink);
	}
	textarea {
		display: block;
		width: 100%;
		margin: 6px 0 8px;
		resize: vertical;
	}
	.engines {
		display: grid;
		gap: 8px;
	}
	.engine {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 12px;
		align-items: center;
	}
	.herdoor {
		margin-top: 8px;
	}
	/* The one dialog this panel draws, in the desk's own furniture. */
	.confirm {
		border: 1px solid var(--line);
		border-left: 3px solid var(--turmeric-deep);
		border-radius: var(--radius);
		background: var(--paper-raised);
		color: var(--ink);
		padding: 16px 18px;
		max-width: min(100% - 32px, 420px);
	}
	.confirm::backdrop {
		background: rgba(0, 0, 0, 0.45);
	}
	.confirm p {
		margin: 0 0 4px;
		font-size: var(--t-small);
		line-height: 1.5;
	}
	.urlrow {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 6px;
	}
	.urlrow input {
		flex: 1;
		min-width: 180px;
		min-height: 44px;
	}
	.deskfile {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 12px;
		align-items: center;
	}
	.deskfile .waynote {
		flex: 1 1 240px;
	}
	.deskfile .warn {
		flex-basis: 100%;
	}
	.progline {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
		margin-top: 8px;
	}
	.progline progress {
		width: 160px;
	}
	.progline .note {
		font-size: var(--t-small);
		color: var(--ink-soft);
		font-variant-numeric: tabular-nums;
	}
	.counts {
		margin: 0 0 8px;
		font-size: var(--t-small);
		font-weight: 600;
	}
	.bulk {
		margin: 10px 0 12px;
	}
	.sendrow,
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		margin-top: 8px;
	}
	.sendrow .fieldlabel {
		margin: 0;
	}
	.tablewrap {
		overflow-x: auto;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--card);
	}
	.review {
		border-collapse: collapse;
		width: 100%;
		min-width: 900px;
	}
	.review th {
		text-align: left;
		font-size: var(--t-micro);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
		font-weight: 500;
		padding: 8px 6px;
		border-bottom: 1px solid var(--line);
	}
	.review td {
		padding: 6px;
		border-bottom: 1px dotted var(--line);
		vertical-align: top;
	}
	.review td input,
	.kind {
		width: 100%;
		min-height: 44px;
	}
	.review .tick {
		width: 44px;
	}
	.review .tickbox {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		cursor: pointer;
	}
	.review .tick input {
		width: 22px;
		height: 22px;
		min-height: 22px;
		accent-color: var(--leaf);
	}
	.review .price input {
		min-width: 74px;
	}
	.review .notes {
		min-width: 190px;
	}
	/* The select the desk wants an answer from: a rule and a weight, and the
	   "Not sure what this is" flag beside it, never a hue alone. */
	.kind.ask {
		border-color: var(--turmeric-deep);
		border-width: 2px;
		font-weight: 700;
	}
	/* A rule and a word, so a row worth checking is not told apart by hue alone. */
	.review tr.low td:first-child {
		border-left: 3px solid var(--turmeric-deep);
	}
	.review tr.dropped td,
	.roomlist li.dropped {
		opacity: 0.55;
	}
	.flag {
		display: block;
		font-size: var(--t-micro);
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--turmeric-deep);
		margin-bottom: 3px;
	}
	.review tr.dropped .flag {
		color: var(--chili);
	}
	.raw {
		display: block;
		font-size: var(--t-micro);
		color: var(--muted);
		margin-bottom: 4px;
		white-space: pre-wrap;
	}
	.rooms {
		margin: 12px 0 4px;
	}
	.roomshead {
		font-family: var(--text);
		font-size: var(--t-small);
		font-weight: 600;
		margin: 0;
	}
	.roomlist {
		list-style: none;
		margin: 8px 0 0;
		padding: 0;
		border-top: 1px solid var(--line);
	}
	.roomlist li {
		padding: 8px 0;
		border-bottom: 1px dotted var(--line);
	}
	.roomlist .roomrow {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 12px;
		align-items: baseline;
	}
	.roomlist .roomrow .raw {
		display: inline;
		margin: 0;
	}
	.roomlist .kind {
		width: auto;
		min-width: 160px;
		margin-top: 6px;
	}
	.saverow {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
		margin-top: 12px;
	}
	/* Off screen, still read aloud: the live region and the table's caption
	   name things for a screen reader without putting them on the page. */
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	/*
	 * Under 640px the table is cards. The header row goes off screen (the
	 * labels come back through data-label on every cell), each row stands as
	 * a block with its own rule, and nothing has to scroll sideways at 320:
	 * a review table a thumb has to drag across is a review nobody finishes.
	 */
	@media (max-width: 639px) {
		.tablewrap {
			overflow-x: visible;
			border: 0;
			background: none;
		}
		.review {
			min-width: 0;
		}
		.review thead {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
		}
		.review tr {
			display: block;
			padding: 8px 0 8px 8px;
			border-bottom: 1px solid var(--line);
			border-left: 3px solid transparent;
		}
		.review tr.low {
			border-left-color: var(--turmeric-deep);
		}
		.review td {
			display: block;
			padding: 4px 0;
			border: 0;
		}
		.review tr.low td:first-child {
			border-left: 0;
		}
		.review td::before {
			content: attr(data-label);
			display: block;
			font-size: var(--t-micro);
			letter-spacing: 0.06em;
			text-transform: uppercase;
			color: var(--muted);
			margin-bottom: 2px;
		}
		.review .tick {
			width: auto;
		}
		.review .notes {
			min-width: 0;
		}
	}
</style>
