/* The Floor Deck, section "custards". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0249', term: 'Crème Anglaise', packet: true, planned: true },
	{ id: 'fd_0250', term: 'Custard', packet: true, planned: true },
	{ id: 'fd_0251', term: 'Ganache', packet: true, planned: true },
	{ id: 'fd_0252', term: 'Mousse', packet: true, planned: true },
	{ id: 'fd_0253', term: 'Parfait', packet: true, planned: true },
	{ id: 'fd_0254', term: 'Panna Cotta', packet: true, planned: true },
	{ id: 'fd_0255', term: 'Chocolate Truffle', packet: true, planned: true },
	{ id: 'fd_0256', term: 'Gelato', packet: true, planned: true },
	{ id: 'fd_0257', term: 'Granita', packet: true, planned: true },
	{ id: 'fd_0258', term: 'Sherbet', packet: true, planned: true },
	{ id: 'fd_0259', term: 'Sorbet', packet: true, planned: true },
	{ id: 'fd_0260', term: 'Ice Cream', planned: true },
	{ id: 'fd_0261', term: 'Semifreddo', planned: true },
	{ id: 'fd_0262', term: 'Crème Brûlée', planned: true },
	{ id: 'fd_0263', term: 'Pot de Crème', planned: true },
	{ id: 'fd_0264', term: 'Pastry Cream', planned: true },
	{ id: 'fd_0265', term: 'Chantilly', planned: true }
];

export default cards;
