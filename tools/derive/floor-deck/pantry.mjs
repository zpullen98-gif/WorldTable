/* The Floor Deck, section "pantry". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0266', term: 'Balsamic', packet: true, planned: true },
	{ id: 'fd_0267', term: 'Banyuls', packet: true, planned: true },
	{ id: 'fd_0268', term: 'Saba', packet: true, planned: true },
	{ id: 'fd_0269', term: 'Kimchi', packet: true, planned: true },
	{ id: 'fd_0270', term: 'Compote', packet: true, planned: true },
	{ id: 'fd_0271', term: 'Marmalade', packet: true, planned: true },
	{ id: 'fd_0272', term: 'Sherry Vinegar', planned: true },
	{ id: 'fd_0273', term: 'Verjus', planned: true },
	{ id: 'fd_0274', term: 'Mostarda', planned: true },
	{ id: 'fd_0275', term: 'Chutney', planned: true },
	{ id: 'fd_0276', term: 'Jam', planned: true },
	{ id: 'fd_0277', term: 'Preserved Lemon', planned: true },
	{ id: 'fd_0278', term: 'Capers', planned: true },
	{ id: 'fd_0279', term: 'Cornichon', planned: true },
	{ id: 'fd_0280', term: 'Miso', planned: true },
	{ id: 'fd_0281', term: 'Fish Sauce', planned: true },
	{ id: 'fd_0282', term: 'Harissa', planned: true },
	{ id: 'fd_0283', term: 'Pimentón', planned: true },
	{ id: 'fd_0284', term: 'Finishing Salt', planned: true }
];

export default cards;
