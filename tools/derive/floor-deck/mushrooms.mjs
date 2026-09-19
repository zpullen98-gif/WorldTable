/* The Floor Deck, section "mushrooms". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0138', term: 'Abalone Mushroom', packet: true, planned: true },
	{ id: 'fd_0139', term: 'Beech Mushroom', packet: true, planned: true },
	{ id: 'fd_0140', term: 'Black Trumpet', packet: true, planned: true },
	{ id: 'fd_0141', term: 'Chanterelle', packet: true, planned: true },
	{ id: 'fd_0142', term: 'Hen of the Woods', packet: true, planned: true },
	{ id: 'fd_0143', term: 'King Trumpet', packet: true, planned: true },
	{ id: 'fd_0144', term: 'Morel', packet: true, planned: true },
	{ id: 'fd_0145', term: 'Oyster Mushroom', packet: true, planned: true },
	{ id: 'fd_0146', term: 'Shiitake', packet: true, planned: true },
	{ id: 'fd_0147', term: 'Truffle', packet: true, planned: true },
	{ id: 'fd_0148', term: 'Truffle Oil', planned: true },
	{ id: 'fd_0149', term: 'Porcini', planned: true },
	{ id: 'fd_0150', term: 'Cremini', planned: true },
	{ id: 'fd_0151', term: 'Enoki', planned: true },
	{ id: 'fd_0152', term: "Lion's Mane", planned: true },
	{ id: 'fd_0153', term: 'Chicken of the Woods', planned: true }
];

export default cards;
