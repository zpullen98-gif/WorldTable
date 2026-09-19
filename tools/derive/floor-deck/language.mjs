/* The Floor Deck, section "language". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0285', term: 'Heirloom', packet: true, planned: true },
	{ id: 'fd_0286', term: 'Larder', packet: true, planned: true },
	{ id: 'fd_0287', term: 'Garde Manger', packet: true, planned: true },
	{ id: 'fd_0288', term: 'Amuse-Bouche', planned: true },
	{ id: 'fd_0289', term: 'Prix Fixe', planned: true },
	{ id: 'fd_0290', term: 'Tasting Menu', planned: true },
	{ id: 'fd_0291', term: 'À la Carte', planned: true },
	{ id: 'fd_0292', term: 'Market Price', planned: true },
	{ id: 'fd_0293', term: 'House-Made', planned: true },
	{ id: 'fd_0294', term: 'Dry-Aged', planned: true },
	{ id: 'fd_0295', term: 'Grass-Fed', planned: true },
	{ id: 'fd_0296', term: 'Pasture-Raised', planned: true },
	{ id: 'fd_0297', term: 'Heritage Breed', planned: true },
	{ id: 'fd_0298', term: 'Wild-Caught', planned: true },
	{ id: 'fd_0299', term: 'Day-Boat', planned: true },
	{ id: 'fd_0300', term: 'Organic', planned: true }
];

export default cards;
