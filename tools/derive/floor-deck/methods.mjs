/* The Floor Deck, section "methods". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0025', term: 'Boiled', packet: true, planned: true },
	{ id: 'fd_0026', term: 'Braised', packet: true, planned: true },
	{ id: 'fd_0027', term: 'Brined', packet: true, planned: true },
	{ id: 'fd_0028', term: 'Caramelized', packet: true, planned: true },
	{ id: 'fd_0029', term: 'Confit', packet: true, planned: true },
	{ id: 'fd_0030', term: 'Cured', packet: true, planned: true },
	{ id: 'fd_0031', term: 'Fried', packet: true, planned: true },
	{ id: 'fd_0032', term: 'Grilled', packet: true, planned: true },
	{ id: 'fd_0033', term: 'Pickled', packet: true, planned: true },
	{ id: 'fd_0034', term: 'Poached', packet: true, planned: true },
	{ id: 'fd_0035', term: 'Preserved', packet: true, planned: true },
	{ id: 'fd_0036', term: 'Puréed', packet: true, planned: true },
	{ id: 'fd_0037', term: 'Roasted', packet: true, planned: true },
	{ id: 'fd_0038', term: 'Sautéed', packet: true, planned: true },
	{ id: 'fd_0039', term: 'Seared', packet: true, planned: true },
	{ id: 'fd_0040', term: 'Simmered', packet: true, planned: true },
	{ id: 'fd_0041', term: 'Smoked', packet: true, planned: true },
	{ id: 'fd_0042', term: 'Sous Vide', packet: true, planned: true },
	{ id: 'fd_0043', term: 'Wilted', packet: true, planned: true },
	{ id: 'fd_0044', term: 'Blanched', planned: true },
	{ id: 'fd_0045', term: 'Steamed', planned: true },
	{ id: 'fd_0046', term: 'Fermented', planned: true },
	{ id: 'fd_0047', term: 'Rendered', planned: true },
	{ id: 'fd_0048', term: 'Blackened', planned: true },
	{ id: 'fd_0049', term: 'Pan-Roasted', planned: true }
];

export default cards;
