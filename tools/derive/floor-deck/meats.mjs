/* The Floor Deck, section "meats". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0050', term: 'Escargot', packet: true, planned: true },
	{ id: 'fd_0051', term: 'Guinea Hen', packet: true, planned: true },
	{ id: 'fd_0052', term: 'Quail', packet: true, planned: true },
	{ id: 'fd_0053', term: 'Squab', packet: true, planned: true },
	{ id: 'fd_0054', term: 'Sweetbreads', packet: true, planned: true },
	{ id: 'fd_0055', term: 'Foie Gras', packet: true, planned: true },
	{ id: 'fd_0056', term: 'Duck Breast', planned: true },
	{ id: 'fd_0057', term: 'Poussin', planned: true },
	{ id: 'fd_0058', term: 'Rabbit', planned: true },
	{ id: 'fd_0059', term: 'Venison', planned: true },
	{ id: 'fd_0060', term: 'Pheasant', planned: true },
	{ id: 'fd_0061', term: 'Bone Marrow', planned: true },
	{ id: 'fd_0062', term: 'Chicken Liver', planned: true },
	{ id: 'fd_0063', term: 'Beef Tongue', planned: true }
];

export default cards;
