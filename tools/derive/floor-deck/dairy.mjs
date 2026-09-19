/* The Floor Deck, section "dairy". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0154', term: 'Brebis', packet: true, planned: true },
	{ id: 'fd_0155', term: 'Buttermilk', packet: true, planned: true },
	{ id: 'fd_0156', term: 'Chèvre', packet: true, planned: true },
	{ id: 'fd_0157', term: 'Crème Fraîche', packet: true, planned: true },
	{ id: 'fd_0158', term: 'Fromage Blanc', packet: true, planned: true },
	{ id: 'fd_0159', term: 'Parmesan', packet: true, planned: true },
	{ id: 'fd_0160', term: 'Clarified Butter', packet: true, planned: true },
	{ id: 'fd_0161', term: 'Brown Butter', packet: true, planned: true },
	{ id: 'fd_0162', term: 'Ghee', planned: true },
	{ id: 'fd_0163', term: 'Compound Butter', planned: true },
	{ id: 'fd_0164', term: 'Mascarpone', planned: true },
	{ id: 'fd_0165', term: 'Ricotta', planned: true },
	{ id: 'fd_0166', term: 'Burrata', planned: true },
	{ id: 'fd_0167', term: 'Fresh Mozzarella', planned: true },
	{ id: 'fd_0168', term: 'Feta', planned: true },
	{ id: 'fd_0169', term: 'Blue Cheese', planned: true },
	{ id: 'fd_0170', term: 'Bloomy Rind', planned: true },
	{ id: 'fd_0171', term: 'Washed Rind', planned: true }
];

export default cards;
