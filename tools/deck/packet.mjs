/**
 * The training packet's handwritten answers, by the name each card carries.
 *
 * Transcribed from eleven photographs of a restaurant's hand-filled training
 * packet, 19 September 2026. "[..]" marks where the photograph cut a line off
 * at the page edge. This is SOURCE MATERIAL for the writers, never card text:
 * it shows how a working server already explains the term, which is the best
 * guide to the register of a guest line, and where it is wrong it is the raw
 * material for a trap (see PACKET_ERRORS in tools/derive/floor-deck.mjs).
 *
 * A term the packet listed with no legible answer is simply absent here.
 *
 * @type {Record<string, string>}
 */
export const PACKET_SAID = {
	// Southern Terms: the section is gone (2026-09-19); these four moved to
	// other sections with their ids, the rest retired with the section.
	'Chicken-Fried': 'thin piece of [meat] that is battered and fried',
	Coleslaw: 'shredded raw cabbage dressed in mayonnaise',
	Hash: 'diced meat, potatoes and spices mixed together',
	Hominy: 'dried corn kernels treated with an alkali, lime',

	// Cooking Methods
	Boiled: 'cooking with boiling water based [liquid]',
	Braised: 'seared at high temp then cooked in cover[ed ..]',
	Brined: 'mix of water salt sugar to preserve, [..]',
	Caramelized: 'the browning of sugar',
	Confit: "cooking in it's own fat",
	Cured: 'preserve food by brining, smoking [..]',
	Fried: 'cooking food in oil or another fa[t]',
	Grilled: 'using direct and radiant hea[t]',
	Pickled: 'preserving through immersion in [..]',
	Poached: 'moist heat through submerging',
	Preserved: 'to prevent bacteria and slowing [..]',
	Puréed: 'ground to soft paste',
	Roasted: 'dry heat cooking where hot air env[elops ..]',
	Sautéed: 'cook quickly on high heat minim[al ..]',
	Seared: 'surface is cooked at high temp until [..]',
	Simmered: 'cooked in hot liquid, higher than poa[ching]',
	Smoked: 'add flavor by exposing food to sm[oke]',
	'Sous Vide': 'sealed in plastic then placed steaming wa[ter]',
	Wilted: 'cooked until it has lost its shape',

	// Meats
	Escargot: 'French for snail, taste similar to [..]',
	'Guinea Hen': 'similar to chicken, yields leaner [..] (listed as "Guinea")',
	'Pork Belly': 'uncured, unsmoked, unsliced bacon',
	Quail: 'bird, strong gamy flavors, with bone structu[re ..]',
	Squab: 'tender, moist, rich but milder taste than other g[ame ..]',
	Sweetbreads: 'smooth and tender organ meat from thy[mus]',

	// Cured Meat
	Andouille: 'pork shoulder, smoked sausage with garlic, pepp[er ..]',
	Chorizo: 'pork seasoned with pimentón (a smoked paprika)',
	Coppa: 'pork shoulder and neck, taste similar to prosciu[tto]',
	'Country Ham': 'a ham that is dry cured with salt before smokin[g]',
	Guanciale: 'cured pork cheeks',
	Lardo: 'type of salumi made by cured strips of fatback w[ith ..]',
	Lomo: 'Spanish for tenderloin, bought cured or uncure[d]',
	Pancetta: 'Italian bacon from pork belly that is cured and [..]',
	Pastrami: 'raw meat brined, dried, seasoned, then smoked',
	Pâté: 'mix of cooked ground meat and fat minced in[to ..]',
	Prosciutto: 'Italian dry cured ham thinly sliced and served [..]',
	Rillettes: 'similar to paté, meat is cubed then salted and [..]',
	Speck: 'an Italian cured, smoked meat from Alto Adi[ge]',
	Tasso: 'spicy cured cajun pork made from the s[houlder]',

	// Meat Cuts
	'Ribeye Cap': 'flavor and fat of a ribeye w[ith ..] (listed as "(Ribeye) Cap (aka Calotte)")',
	Cheek: 'lean and tender meat from the f[ace]',
	'Hanger Steak': 'flavorful cut of the diaphragm',
	'Ham Hock': 'pork knuckle from th[e ..]',
	Ribeye: 'rib meat that is both flavorful [and ..]',
	Shoulder: 'very tender meat',
	'Short Rib': 'cut of beef taken from the bris[ket ..]',
	Tenderloin: 'prized cut for its tenderness',

	// Fish
	'Arctic Char': 'cold water fish found in the arctic closely related to [..]',
	Crawfish: 'similar to lobster in taste but smaller',
	Skate: "similar to sting ray's, bottom dwelling fish",
	Flounder: 'eyes of the adults on the left side, flakey and s[weet]',
	Grouper: 'similar to bass, red has a milder and sweeter fla[vor]',
	Halibut: 'flatfish from family of right eye flounders, firm w[hite ..]',
	Mussels: 'much like a clam but more salty',
	Oysters: 'jelly like texture with a salty ocean taste',
	Roe: 'savory and sweet fish eggs',
	Salmon: 'medium firm texture with large flakes and medi[um ..]',
	Scallops: 'sweet and tender, white muscle is called the nut',
	Snapper: 'comes from reefs of Gulf and Atlantic, mild white meat',
	Sturgeon: "very large, long lived, fillet's taste similar to lobster",
	Tilefish: 'low in fat, sweet in flavor, shallow water fish',
	Trout: 'fresh water, stronger fish/game flavor than other [..]',
	Turbot: 'flatfish found in North Atlantic, mild and medium [..]',
	Wreckfish: 'gathers around abandoned shipwrecks, SC, similar [to] grouper',
	Caviar: 'roe from wild sturgeon',

	// Mushrooms
	'Abalone Mushroom': 'buttery, salty, and chewy',
	'Beech Mushroom': 'buttery, nutty, firm, and crunch[y]',
	'Black Trumpet': 'buttery, rich, woodsy, with a [..]',
	Chanterelle: 'meaty, nutty, with aroma of a[pricot]',
	'Hen of the Woods': 'large and firm texture, earthy aroma',
	'King Trumpet': 'firm and meaty texture, similar t[o ..]',
	Morel: 'meaty, nutty',
	'Oyster Mushroom': 'velvety texture, mild flavor',
	Shiitake: 'soft, spongy quality, woodsy',
	Truffle: 'earthy, oily, slight [..]',

	// Cheeses/Milk
	Brebis: "creamy sheep's milk chee[se]",
	Buttermilk: "cow's milk with sour taste fr[om ..]",
	Chèvre: 'goat cheese, low in fat and [..]',
	'Crème Fraîche': 'thick and soured cream',
	'Fromage Blanc': 'creamy cheese made with whol[e milk]',
	Parmesan: 'fruity and nutty in flavor',

	// Miscellaneous
	'Clarified Butter': 'melt butter and allowing comp[onents] to separate by density',
	Aioli: 'Mediterranean sauce, garlic, olive oil, emulsifiers s[uch as ..]',
	Banyuls: 'sweet, fortified wine from eastern France',
	Balsamic: 'reduction of pressed grapes then aged',
	Béarnaise: 'clarified butter emulsified in egg yolks and white [wine vinegar ..]',
	Beignets: 'dough fried and covered in powdered sugar',
	Brioche: 'bread with high egg and butter content that gives it a [..]',
	'Brown Butter': 'hazelnut butter, type of warm sauce, accompanies savoury [..]',
	Carpaccio: 'raw meat thinly sliced drizzled in olive oil and lemon juice',
	Compote: 'fruit cooked in water with sugar and spices',
	Consommé: 'soup made from richly flavored stock using egg whites to c[larify]',
	Coulis: 'French for strained liquid, sauce from puréed fru[it]',
	'Crème Anglaise': 'mix of sugar, egg yolk, and hot milk, vanilla, dessert [sauce]',
	Custard: 'cooked mix of milk or cream and egg yolk',
	Emulsion: 'mix of two or more liquids that normally cannot [..]',
	Focaccia: 'flat oven baked Italian bread similar to pizza',
	'Foie Gras': 'duck or goose liver, rich, buttery, delicate',
	Frittata: 'egg based Italian dish similar to an om[elette]',
	Ganache: 'made from pouring heated cream over chopped c[hocolate]',
	'Garde Manger': 'cold food expert',
	Gastrique: 'caramelized sugar deglazed with v[inegar]',
	Gelato: 'Italian ice cream, higher proportion of milk, lowe[r ..]; denser than ice cream',
	Granita: 'semi frozen dessert made from sugar, water, an[d ..]',
	Heirloom: "organically produced without GMO's",
	Hollandaise: 'emulsion of egg yolks, liquid butter, water and lemon ju[ice]',
	Jus: 'light sauce used in beef recipes',
	Kimchi: 'spicy pickled or fermented mix containing cabbage, onions, garlic, [..]',
	Larder: 'storage for cured meats',
	Macaroon: 'two almond meringue cakes filled with cream or jam',
	Marmalade: 'refers to fruit preservative from juice and peel of citrus',
	Meringue: 'dessert made from whipped egg whites and sugar',
	Mignonette: 'condiment usually with oysters made from minced shallots, crack[ed pepper ..]',
	Mousse: 'whipped egg whites or cream, flavored with chocolate, coffe[e ..]',
	Parfait: 'layering cream, ice cream, and flavored gelatins',
	'Panna Cotta': 'a pudding made of cream, sugar, and gelatin',
	Ragout: 'slow low heat cooking with or without meat, variety of [..]',
	Saba: 'cooked grape must, pressed fruit juice containing skins [..]',
	Sherbet: 'frozen fruit flavored mix with milk, egg white, or [..]',
	Sorbet: 'frozen dessert made from sweetened water with fla[voring]',
	Sourdough: 'dough containing lactobacillus culture combined with [..]',
	Tart: 'baked dish with a filling over a pastry base w[ith ..]',
	Tartare: 'finely chopped raw beef with onions, capers, and se[asonings]',
	Torte: 'cake filled with whipped cream, buttercreams, j[ams]',
	'Chocolate Truffle': 'pungent, intense, earthy, gourmet mushroom (the packet listed "Truffle" among the desserts and answered for the fungus)',
	Vinaigrette: 'sauce made of oil, vinegar, and seasonings',

	// Starches
	Agnolotti: 'flattened pasta filled with meat or veg',
	Buckwheat: 'gluten free alternative, strong taste of darkly roas[ted ..]',
	Bulgur: 'cereal food, dried cracked wheat, rich nutty',
	Farro: 'grain prepared by cooking in water until soft',
	'Farro Piccolo': 'smallest far[ro]',
	Gnocchi: 'Italian dumpling made from potatoes and flour',
	Grits: 'grounded corn meal then boiled',
	Polenta: 'porridge made from finely ground yellow or whit[e corn]',
	Quinoa: 'protein packed grain containing every amino aci[d]',
	Risotto: 'creamy Italian rice dish cooked in a broth',
	Carnaroli: 'made in risotto, known for high starch and fi[rm ..]',
	Acquerello: '"King of Rices", nutrition of whole grain, look of white',
	Semolina: 'coarse, purified wheat middlings of durum',
	Tagliatelle: 'pasta traditionally paired with Bolognese sauce, flat, medium thickness'
};
