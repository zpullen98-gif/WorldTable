/* The Floor Deck, section "starches". Written by tools/deck/merge.mjs and
   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every
   field and loses comments). The contract is
   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */
/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */
const cards = [
	{ id: 'fd_0172', term: 'Agnolotti', packet: true, planned: true },
	{ id: 'fd_0173', term: 'Buckwheat', packet: true, planned: true },
	{ id: 'fd_0174', term: 'Bulgur', packet: true, planned: true },
	{ id: 'fd_0175', term: 'Farro', packet: true, planned: true },
	{ id: 'fd_0176', term: 'Farro Piccolo', packet: true, planned: true },
	{ id: 'fd_0177', term: 'Gnocchi', packet: true, planned: true },
	{ id: 'fd_0178', term: 'Grits', packet: true, planned: true },
	{ id: 'fd_0179', term: 'Polenta', packet: true, planned: true },
	{ id: 'fd_0180', term: 'Quinoa', packet: true, planned: true },
	{ id: 'fd_0181', term: 'Risotto', packet: true, planned: true },
	{ id: 'fd_0182', term: 'Carnaroli', packet: true, planned: true },
	{ id: 'fd_0183', term: 'Acquerello', packet: true, planned: true },
	{ id: 'fd_0184', term: 'Semolina', packet: true, planned: true },
	{ id: 'fd_0185', term: 'Tagliatelle', packet: true, planned: true },
	{ id: 'fd_0186', term: 'Arborio', planned: true },
	{ id: 'fd_0187', term: 'Couscous', planned: true },
	{ id: 'fd_0188', term: 'Freekeh', planned: true },
	{ id: 'fd_0189', term: 'Wild Rice', planned: true },
	{ id: 'fd_0190', term: 'Pappardelle', planned: true },
	{ id: 'fd_0191', term: 'Ravioli', planned: true },
	{ id: 'fd_0192', term: 'Tortellini', planned: true },
	{ id: 'fd_0193', term: 'Cavatelli', planned: true },
	{ id: 'fd_0194', term: 'Orecchiette', planned: true }
];

export default cards;
