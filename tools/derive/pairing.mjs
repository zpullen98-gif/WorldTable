/**
 * Wine / beer / zero-proof pairing: ported from `pairingFull` (L3600).
 *
 * Transcribed faithfully, including branch order, which is load-bearing: dessert
 * and drink short-circuit first, then fire, then the ingredient tree top to
 * bottom. Reordering the else-if chain silently changes what 970 dishes pour.
 *
 * The only structural change is that the recipe's flavor tags are passed in
 * rather than recomputed via `flavorFor(r)`: the original called it inside a
 * function that itself ran over the whole array, so the tags were derived
 * hundreds of times per render.
 */
export function derivePairing(r, blob, _CELLAR, _BOTTLE_NOTES, tags = []) {
	const t = blob;
	const has = (...ks) => ks.some((k) => t.includes(k));
	const tag = (x) => tags.includes(x);
	const c = r.c;
	const k = r.k;

	const P = (pour, alt, beer, zeroProof, why) => ({ pour, alt, beer, zeroProof, why });

	/* ---- course shortcuts ---- */
	if (k === 'Dessert') {
		if (has('chocolate', 'cocoa'))
			return P('Banyuls or Ruby Port', 'PX Sherry', 'Imperial stout', 'Espresso',
				'Chocolate wants fortified sweetness or roast-bitter contrast: the wine must out-sweet the plate, or oppose it entirely.');
		if (has('citrus', 'lemon', 'lime', 'passion'))
			return P('Moscato d’Asti', 'Late-harvest Riesling', 'Witbier', 'Sparkling elderflower',
				'Citrus desserts need a wine sweeter than they are, with acid enough to keep up: light, frothy, and low-proof wins.');
		if (has('caramel', 'toffee', 'butterscotch', 'dulce', 'maple'))
			return P('Tawny Port', 'PX Sherry or bourbon', 'Barleywine', 'Cold-brew coffee',
				'Caramel echoing caramel: oxidative aging built the same flavors into the glass that the pan built into the plate.');
		if (has('coconut', 'mango', 'pineapple', 'tropical', 'banana'))
			return P('Demi-sec Champagne', 'Off-dry Chenin (Vouvray)', 'Fruited sour', 'Coconut water with lime',
				'Tropical sweetness wants bubbles or Chenin’s honeyed acid: richness met with lift, not more weight.');
		return P('Sauternes', 'Demi-sec Champagne', 'Belgian tripel', 'Jasmine tea',
			'The sweetness rule is absolute: the pour must be sweeter than the plate, and acid keeps it from cloying.');
	}

	if (k === 'Drink')
		return P('It is the pour', 'Serve alongside something salty and fried', '-',
			'Already zero-proof unless you made it otherwise',
			'This is the glass, not the plate: judge it on temperature, dilution, and balance, and let the food do the answering.');

	if (k === 'Breakfast')
		return P('Mimosa (weekends only)', 'Cava, straight', '-', 'Fresh orange juice & café au lait',
			'Morning food wants brightness and bubbles, or honest coffee: nothing that argues before noon.');

	/* ---- fire first ---- */
	if (
		tag('fiery') ||
		(tag('gently hot') &&
			(['Thai', 'Indian', 'Korean', 'Malaysian', 'Indonesian', 'Vietnamese', 'Sri Lankan',
				'Caribbean', 'Ethiopian', 'Mexican'].includes(c) ||
				has('curry', 'laksa', 'vindaloo', 'jerk', 'kimchi', 'sichuan', 'gochujang',
					'som tam', 'tom yum', 'sambal', 'berbere', 'harissa')))
	) {
		return P(
			'Off-dry Riesling (Mosel Kabinett)',
			'Gewürztraminer or off-dry Chenin',
			c === 'Mexican' ? 'Mexican lager with lime' : 'Crisp lager or pilsner',
			c === 'Indian'
				? 'Sweet lassi'
				: c === 'Korean'
					? 'Cold barley tea (boricha)'
					: c === 'Thai' || c === 'Vietnamese' || c === 'Malaysian'
						? 'Limeade or young coconut'
						: 'Agua fresca or iced jasmine tea',
			'Sugar, cold, and low alcohol are the fire code: sweetness tames capsaicin while acid resets the palate; tannin would fan the flames.'
		);
	}

	/* ---- regional + ingredient tree ---- */
	if (has('oyster,', 'oysters') && !has('rocky mountain', 'calf fries', 'testicle'))
		return P('Muscadet or Chablis', 'Fino Sherry or Champagne', 'Dry stout, the old alliance',
			'Cucumber-mint sparkling water',
			'Brine wants saline, steely whites: merroir meeting minerality, with bubbles or stout as the classic dissents.');

	if (has('clam', 'mussel', 'vongole', 'octopus', 'polvo', 'squid', 'calamari', 'cuttlefish'))
		return P('Albariño or Muscadet', 'Assyrtiko or Vermentino', 'Witbier', 'Sparkling water with lemon',
			'The Atlantic’s whites beside the sea’s own liquor: salinity in sympathy, acid keeping everything bright.');

	if (has('anchov', 'sardine', 'salt cod', 'bacalao', 'bacalhau'))
		return P('Fino or Manzanilla Sherry', 'Muscadet or dry Riesling', 'Pilsner', 'Sparkling water with lemon',
			'Salt-cured fish wants a bone-dry, saline partner: Sherry and Atlantic whites answer the cure without fighting it.');

	if (has('scallop', 'shrimp', 'prawn', 'crab', 'lobster', 'crawfish'))
		return P(
			has('butter', 'cream') ? 'Barrel-aged Chardonnay (Meursault style)' : 'Albariño',
			'Champagne', 'Pilsner or witbier', 'White grape & tonic',
			has('butter', 'cream')
				? 'Butter-dressed shellfish climbs a weight class: oak-and-cream Chardonnay matches it richness for richness.'
				: 'Shellfish sweetness meets acid, salinity, and bubbles, precision instruments for delicate meat.'
		);

	if (k === 'Salad' && has('tuna', 'anchov', 'niçoise'))
		return P('Provence rosé', 'Bandol rosé or Vermentino', 'Bière blanche', 'Citron pressé',
			'The Niçoise law: the salad and the pink wine grew up on the same coast: salt, oil, and sun answered in kind.');

	if (has('salmon', 'tuna'))
		return P('Pinot Noir (Willamette or Burgundy)', 'Chilled Gamay (cru Beaujolais)', 'Saison',
			'Hibiscus iced tea',
			'The fatty fish that cross the red line: silk-textured, low-tannin reds meet their oils without a metallic clash.');

	if (
		(c === 'Japanese' || has('dashi', 'sushi', 'sashimi', 'soba', 'udon', 'ramen', 'tsuyu')) &&
		has('miso', 'dashi', 'soy sauce', 'teriyaki', 'sushi', 'sashimi', 'mirin')
	)
		return P('Junmai or Ginjo sake', 'Dry Riesling or Grüner Veltliner', 'Japanese rice lager',
			'Cold green tea (sencha)',
			'Umami bridges best with umami: sake’s amino depth shakes hands with dashi and soy where tannic wine would argue.');

	if (
		/\bfish\b(?!\s*sauce)/.test(t) ||
		has('cod', 'halibut', 'snapper', 'branzino', 'sole', 'sea bass', 'fillet', 'tilapia', 'barramundi')
	)
		return P(
			c === 'Greek' ? 'Assyrtiko' : 'Vermentino or Sauvignon Blanc',
			'Albariño', 'Witbier', 'Sparkling water with citrus',
			'Lean fish, bright acid, done: coastal whites built beside the same boats; the fresher the fish, the leaner the pour.'
		);

	if (has('duck'))
		return P('Pinot Noir (the classic)', 'Cru Beaujolais (Morgon)', 'Belgian dubbel', 'Black cherry spritz',
			'Acid and silk against duck fat: the oldest marriage in Burgundy, with Gamay as its cheerful younger witness.');

	if (has('lamb'))
		return P(
			c === 'Spanish'
				? 'Rioja Gran Reserva'
				: has('yogurt', 'cumin', 'harissa', 'tagine', 'merguez')
					? 'Syrah or Grenache/GSM'
					: 'Cabernet or Rioja Reserva',
			'Malbec', 'Porter', 'Pomegranate spritz',
			'Lamb’s sweet grass-fat wants structure: tannin from Cabernet, smoke-echo from Rioja’s oak, or Syrah’s pepper for the spiced routes.'
		);

	if (
		has('beef', 'brisket', 'short rib', 'oxtail', 'steak', 'ribeye', 'venison', 'tri-tip',
			'tri tip', 'backstrap', 'prime rib', 'pot roast', 'chuck roast', 'elk', 'moose',
			'bison', 'jerky', 'calf fries', 'pastrami', 'corned beef', 'flank', 'matambre')
	) {
		if (tag('smoky') || has('barbecue', 'bbq', 'smoked'))
			return P('Zinfandel (old-vine)', 'Shiraz or Malbec', 'Smoked porter', 'Cherry cola, honestly',
				'Barbecue’s sweet-smoke wants jammy fruit that shakes hands with the sauce; dry austere reds argue with sugar and lose.');
		if (has('braise', 'stew', 'wine', 'bourguignon', 'ragù', 'ragu', 'birria', 'goulash'))
			return P('Syrah (northern Rhône) or Nebbiolo', 'The braising wine itself, better bottle',
				'Belgian dubbel', 'Beet & blackcurrant shrub',
				'Long-cooked beef trades bite for depth: savory, structured reds echo the pot; and pouring the braise’s own region is law.');
		if (has('burger', 'cheeseburger', 'patty melt', 'sloppy joe', 'loose meat'))
			return P('Cabernet Sauvignon or Malbec', 'Zinfandel or Tempranillo', 'IPA or amber ale',
				'Root beer, no apology',
				'A burger is seared beef plus fat plus bread: tannic reds do the steakhouse work, and a hop-bitter IPA scrubs the griddle richness between bites.');
		return P('Cabernet Sauvignon or Malbec', 'Tempranillo (Rioja Reserva)', 'Amber ale',
			'Sparkling water, make room',
			'Tannin binds to seared protein and fat: each bite softens the wine, each sip resets the palate: the steakhouse equation.');
	}

	if (
		has('pork', 'sausage', 'chorizo', 'ham', 'prosciutto', 'bacon', 'belly', 'andouille',
			'schnitzel', 'pepperoni', 'salami', 'capicola', 'mortadella', 'scrapple', 'pork roll',
			'bratwurst', 'kielbasa', 'linguica', 'spam', 'goetta', 'livermush', 'knockwurst')
	)
		return P(
			c === 'German' || c === 'Austrian'
				? 'Grüner Veltliner or dry Riesling'
				: has('apple', 'fennel', 'milk')
					? 'Chenin Blanc (Vouvray sec)'
					: 'Riesling or Grenache',
			'Cru Beaujolais', 'Farmhouse saison', 'Cloudy apple juice, chilled',
			'Pork loves fruit and gentle sweetness: orchard-note whites and low-tannin reds flatter it where heavy oak flattens.'
		);

	if (has('chicken', 'turkey', 'poussin'))
		return P(
			has('roast', 'butter', 'cream', 'tarragon') ? 'Chardonnay (village Burgundy)' : 'Pinot Noir or Gamay',
			has('tomato', 'olive', 'paprika') ? 'Chianti or Barbera' : 'Chenin Blanc',
			'Bière de garde', 'Verbena iced tea',
			'Chicken is wine’s most agreeable partner. Match the SAUCE, not the bird: cream to oak, tomato to Sangiovese’s acid, herbs to Loire whites.'
		);

	if (has('tomato', 'marinara', 'puttanesca', 'arrabbiata', 'pizza', 'caprese'))
		return P('Chianti Classico or Barbera d’Alba', 'Vermentino for the lighter plates',
			'Italian pilsner', 'San Pellegrino Sanbittèr',
			'Tomato’s acid demands equal acid: Italian reds evolved beside the sauce, and the regional pairing is the safest law in wine.');

	if (has('mushroom', 'truffle', 'porcini', 'shiitake', 'risotto'))
		return P('Nebbiolo (Langhe) or aged Pinot Noir', 'White Burgundy for cream-based versions',
			'Dubbel', 'Roasted barley tea',
			'Earth speaking to earth: forest-floor reds echo fungal depth; truffle and Nebbiolo literally share a hillside and a season.');

	if (
		has('cheese', 'gruyère', 'fondue', 'raclette', 'mac and', 'parmigiano', 'halloumi', 'paneer') &&
		(k === 'Main' || k === 'Starter')
	)
		return P('Alpine white (dry Riesling, Grüner)', 'Champagne: bubbles scrub richness',
			'Bière de garde', 'Sparkling apple',
			'Melted cheese coats; acid and carbonation scrub: high-cut whites and Champagne keep the fondue from winning.');

	if (k === 'Salad' || (tag('herb-fresh') && r.v))
		return P('Sauvignon Blanc (Sancerre)', 'Grüner Veltliner', 'Berliner weisse', 'Cucumber-lime water',
			'Green plates want green wines: vinaigrette’s acid meets its match, and the difficult vegetables surrender to Grüner.');

	if (k === 'Soup')
		return P(
			has('cream', 'bisque', 'chowder') ? 'Chardonnay (lightly oaked)' : 'Fino or Amontillado Sherry',
			'Grüner Veltliner', 'Saison', 'The soup is the drink, sparkling water beside',
			'Broths love Sherry’s savory echo (consommé’s old partner); cream soups climb to gentle oak. Weight to weight, always.'
		);

	if (r.v)
		return P('Grüner Veltliner', 'Vermentino or dry Chenin', 'Saison',
			'Sparkling water with citrus & herbs',
			'The vegetable whisperers: peppery, high-acid whites that flatter greens, roots, and grains without bullying them.');

	if (has('oyster sauce', 'fish sauce', 'soy sauce', 'miso', 'noodle'))
		return P('Grüner Veltliner or dry Riesling', 'Champagne, or a cold lager', 'Crisp pilsner',
			'Iced barley or jasmine tea',
			'Soy, fish sauce, and oyster sauce stack savory depth: answer it with high-acid, low-oak whites that cut salt without adding weight.');

	return P('Champagne: when lost, bubbles', 'Cru Beaujolais, lightly chilled', 'Pilsner',
		'Sparkling water with citrus',
		'The universal donors: acid, bubbles, and low tannin rescue nearly any plate: the sommelier’s honest safety net.');
}
