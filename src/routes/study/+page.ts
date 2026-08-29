import { loadStudy, loadLexicon } from '$lib/data';
import filmsJson from '$lib/data/raw/F.json';

export const prerender = true;

/**
 * The Screening Room's twelve canon films.
 *
 * The original hard-coded these URLs twice — once in the markup (L622-633) and
 * again in the `F` map (L3786) — so the two copies could drift apart. Here the
 * extracted `F` is the only source, and the recipe pages read the same one.
 */
const ROOM: Array<{ key: keyof typeof filmsJson; kind: string; title: string; blurb: string }> = [
	{ key: 'pepinOmelet', kind: 'Foundation · Eggs', title: 'Pépin’s Omelet Techniques', blurb: 'The most famous cooking lesson on film. Two omelets, one pan, sixty years of craft — watch his wrist, not the eggs.' },
	{ key: 'ramsayBasics', kind: 'Foundation · Knife', title: 'Ramsay’s Five Basic Skills', blurb: 'Sharpening, the onion dice, rice, and more in one sitting. The claw grip alone repays the watch.' },
	{ key: 'saffitzCroissant', kind: 'Pastry · Lamination', title: 'Saffitz’s Croissants', blurb: 'A two-day project filmed honestly — every fold, chill, and proof. Lamination is temperature management; here is the proof.' },
	{ key: 'maangchiKimchi', kind: 'Fermentation', title: 'Maangchi’s Tongbaechu Kimchi', blurb: 'The definitive napa cabbage kimchi from the woman who taught the internet Korean food — salting, paste, and the onggi.' },
	{ key: 'franklinBrisket', kind: 'Live Fire', title: 'BBQ with Franklin: The Brisket', blurb: 'Austin’s brisket king on trim, rub, fire, and patience. Salt, pepper, post oak — and hours you cannot rush.' },
	{ key: 'civitielloPizza', kind: 'Dough · High Heat', title: 'Civitiello’s Neapolitan Pizza', blurb: 'A world pizza champion adapts the true Neapolitan method to a home oven — the slap, the stretch, the cornicione.' },
	{ key: 'pepinGalantine', kind: 'Butchery', title: 'Pépin’s Chicken Galantine', blurb: 'A whole chicken deboned in minutes, then rebuilt as a galantine — the knife lesson every cook should watch twice.' },
	{ key: 'ccdFriedRice', kind: 'The Wok', title: 'How to Make Any Fried Rice', blurb: 'Chinese Cooking Demystified’s framework film — one technique, three flavors, and the logic to improvise from what you have.' },
	{ key: 'htkPadThai', kind: 'Street Noodles', title: 'Pailin’s Best Pad Thai', blurb: 'The complete tutorial — tamarind balance, noodle timing, and the wok choreography of Thailand’s most famous dish.' },
	{ key: 'middleEatsHummus', kind: 'The Levant', title: 'Middle Eats’ Smoothest Hummus', blurb: 'An obsessive pursuit of silk (chickpea skins, tahini order, ice water) that settles the texture question for good.' },
	{ key: 'weissmanStarter', kind: 'Bread · Wild Yeast', title: 'Weissman’s Sourdough Starter', blurb: 'The starter guide that launched a million jars — feeding ratios, timing, and what a ready levain actually looks like.' },
	{ key: 'panlasangAdobo', kind: 'The Braise', title: 'Panlasang Pinoy’s Killer Adobo', blurb: 'The Philippines’ national dish from its most trusted teacher: soy, vinegar, garlic, and the reduction that lacquers the chicken.' }
];

export async function load() {
	const [study, lexicon] = await Promise.all([loadStudy(), loadLexicon()]);
	const films = ROOM.map((f) => ({ ...f, url: (filmsJson as Record<string, string>)[f.key as string] })).filter(
		(f) => f.url
	);
	return {
		study,
		termName: Object.fromEntries(lexicon.map((e) => [e.slug, e.term])),
		films
	};
}
