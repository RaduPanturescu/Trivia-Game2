import type { QuizQuestion } from '@/shared/quiz'

/**
 * Question of the day, second half of the combined list. Same order and content as legacy/qotd-season2.js,
 * including its `flatMap` builder (answer = (categoryIndex * 2 + questionIndex) % 4). The stored `qotdRandomIndex`
 * points into `[...season1, ...season2]`, so do not reorder or edit.
 */
/** One legacy category: its name and its `[question, correct, ...wrong]` entries. */
type SeasonTwoCategory = [string, [string, string, ...string[]][]]

const seasonTwoCategories: SeasonTwoCategory[] = [
    ["Otters", [
        ["How can a sea otter keep a sleeping pup from drifting away?", "It anchors it with kelp", "It carries it in a cheek pouch", "It builds a floating nest", "It ties it to a rock"],
        ["Why do sea otters groom their fur so persistently?", "To trap insulating air in it", "To spread oil from a tail gland", "To remove salt crystals", "To waterproof it like a seal's"],
        ["How do sea otters keep warm without a thick blubber layer?", "Dense fur and a high metabolism", "Basking between every dive", "Seasonal fat beneath the skin", "Warm seawater trapped under skin"],
        ["Where does a sea otter carry food while diving?", "In loose skin folds beneath its forelimbs", "In a hollow tail", "In a throat pouch", "In a cheek pouch"],
        ["What can an otter's whiskers detect when it hunts in murky water?", "Small water movements around prey", "The prey's electrical field", "Changes in water salinity", "Magnetic north"],
        ["How can sea otters indirectly help kelp forests?", "By eating sea urchins that graze on kelp", "By pollinating kelp flowers", "By planting kelp spores", "By eating kelp fronds"],
        ["Which otter is known to use a favorite stone to open shellfish?", "Sea otter", "Eurasian otter", "Giant otter", "Smooth-coated otter"],
        ["How do many otters reduce heat loss underwater?", "They close their nostrils and ears", "They grow seasonal blubber", "They stop their heartbeat", "They tuck all four paws under the tail"],
        ["What is notable about giant otter family groups?", "Older offspring often help care for pups", "Only the oldest male raises pups", "Pups are raised by unrelated species", "Families disperse as soon as pups swim"],
        ["Which otter forages on exposed Pacific shores for crabs and mollusks?", "Marine otter", "Giant otter", "Asian small-clawed otter", "North American river otter"]
    ]],
    ["Hungary", [
        ["Which Hungarian protected landscape preserves traditional pastoral life on the Great Plain?", "Hortobágy", "Őrség", "Mátra", "Mecsek"],
        ["What is unusual about Lake Hévíz in western Hungary?", "It is a naturally warm lake for year-round bathing", "It is a salt lake in a crater", "It freezes permanently each winter", "It is Hungary's only tidal lake"],
        ["Which city is home to the historic Zsolnay porcelain works?", "Pécs", "Eger", "Sopron", "Vác"],
        ["What is the Nine-Arch Bridge at Hortobágy?", "A 19th-century stone road bridge", "A medieval aqueduct", "A railway viaduct", "A suspension bridge"],
        ["Which Hungarian landscape has striking basalt columns at Szent György Hill?", "The Balaton Uplands", "The Great Plain", "The Mátra", "The Mecsek"],
        ["Which Hungarian landscape is known for scattered villages and traditional farmsteads near the Austrian border?", "Őrség", "Hortobágy", "Mátra", "Mecsek"],
        ["Which national park protects much of Hungary's Hortobágy steppe?", "Hortobágy National Park", "Aggtelek National Park", "Őrség National Park", "Danube-Ipoly National Park"],
        ["What rock underlies the cave-bath scenery around Miskolctapolca?", "Limestone", "Granite", "Basalt", "Chalk"],
        ["Which Balaton peninsula is known for its historic abbey and echo tradition?", "Tihany", "Szigliget", "Fonyód", "Keszthely"],
        ["What craft made the Hungarian town of Herend internationally renowned?", "Hand-painted porcelain", "Glass-blown chandeliers", "Silver filigree", "Bobbin lace"]
    ]],
    ["Food related", [
        ["Why does mayonnaise thicken when oil is whisked into egg yolk?", "Lecithin stabilizes oil droplets in water", "Vinegar turns oil into starch", "Salt crystallizes fat into gel", "Air forms a permanent foam"],
        ["What causes Sichuan pepper's characteristic mouth-tingle?", "Hydroxy-alpha-sanshool affects touch-sensitive nerves", "Capsaicin activates heat receptors", "Menthol cools the tongue", "Carbon dioxide escapes the husk"],
        ["Which mold develops the blue veins in Roquefort?", "Penicillium roqueforti", "Penicillium camemberti", "Aspergillus oryzae", "Saccharomyces cerevisiae"],
        ["Which reaction helps slowly browned onions develop deep flavor?", "Maillard and sugar-browning reactions", "Gelatinization of onion starch", "Fermentation into vinegar", "Crystallization of sulfur"],
        ["What is the Japanese name for crisp bits of tempura batter?", "Tenkasu", "Katsuobushi", "Tsukemono", "Nori"],
        ["Why are vegetables briefly blanched before freezing?", "To slow enzymes that degrade color and texture", "To remove all water", "To sterilize them permanently", "To convert all starch to sugar"],
        ["Parmigiano Reggiano is traditionally produced in which part of Italy?", "Emilia-Romagna and neighboring areas", "Sicily alone", "Lazio and Campania", "Tuscany alone"],
        ["What does cooking 'en papillote' involve?", "Baking food in a folded parchment parcel", "Cooking directly over charcoal", "Chilling it in aspic", "Baking under a salt crust"],
        ["Which aromatic compound is strongly associated with licorice?", "Anethole", "Vanillin", "Limonene", "Eugenol"],
        ["What is the key vegetable in Korean kkakdugi kimchi?", "Diced Korean radish", "Napa cabbage", "Green tomato", "Fermented soybean"]
    ]],
    ["Romania", [
        ["What is especially famous about Voroneț Monastery's exterior frescoes?", "Their vivid blue pigment", "Gold-leaf mosaics", "A glass ceiling", "Scenes carved from marble"],
        ["In which northern Romanian region are the wooden churches of Maramureș?", "Maramureș", "Oltenia", "Dobruja", "Banat"],
        ["What makes Săpânța's Merry Cemetery distinctive?", "Colorful carved crosses with humorous epitaphs", "Black marble tombs", "Underground catacombs", "A silent annual procession"],
        ["Which city hosts Romania's large Astra Museum of folk architecture?", "Sibiu", "Iași", "Galați", "Craiova"],
        ["What motif is especially associated with Horezu pottery?", "Spirals and a distinctive rooster", "Blue-and-white willow patterns", "Black-glazed tiles", "Unpainted relief figures"],
        ["Which river carved the Iron Gates gorge on Romania's border?", "Danube", "Olt", "Prut", "Siret"],
        ["What drives the Berca mud volcanoes in Romania?", "Gas forcing mud upward from underground", "Lava rising through limestone", "Hot springs depositing sulfur", "Glacial melt eroding clay"],
        ["Which Romanian city contains the star-shaped Alba Carolina citadel?", "Alba Iulia", "Sighișoara", "Suceava", "Brașov"],
        ["Which Romanian winter dance features performers dressed as bears?", "Ursul", "Călușari", "Hora", "Brâul"],
        ["Which Romanian reserve is known for its European bison conservation?", "Vânători-Neamț Nature Park", "Văcărești Natural Park", "Bucegi Natural Park", "Comana Natural Park"]
    ]],
    ["Politics", [
        ["What does a legislative sunset clause do?", "Makes a law expire unless renewed", "Requires votes at sunset", "Bans amendments after elections", "Caps bills introduced yearly"],
        ["What does a conscience vote generally permit legislators to do?", "Vote by personal judgment rather than party instruction", "Vote anonymously", "Veto court decisions", "Cast ballots for constituents"],
        ["What is a quorum in a legislature?", "The minimum members needed to conduct business", "The largest opposition bloc", "A campaign-finance committee", "A unanimous vote"],
        ["What does gerrymandering mean?", "Drawing electoral boundaries to favor a group or party", "Counting ranked ballots", "Banning candidate campaigning", "Setting parliamentary term limits"],
        ["What is a caretaker government usually expected to do?", "Handle routine administration pending a successor", "Rewrite the constitution without a vote", "Rule permanently without elections", "Replace courts during a crisis"],
        ["What do sunshine laws generally make more accessible?", "Government meetings and records", "Anonymous campaign donations", "Private party meetings", "Closed court deliberations"],
        ["What does habeas corpus require in a detention case?", "A court reviews whether detention is lawful", "A new election is held", "All evidence is published immediately", "A jury hears every administrative case"],
        ["What is a constructive vote of no confidence designed to require?", "Agreement on a successor before removing a government", "A referendum on every bill", "A minister's removal without replacement", "An indefinite suspension of parliament"],
        ["A 'lame duck' officeholder is typically one who is what?", "Near the end of a term with diminished influence", "A first-time candidate", "Absent from every vote", "A temporary committee chair"],
        ["What is regulatory capture?", "An industry exerting undue influence over its regulator", "A regulator nationalizing a company", "A court overturning a rule", "A government transferring rules to local councils"]
    ]],
    ["Salsa", [
        ["What is the repeated piano pattern often heard in salsa?", "Montuno", "Bolero", "Danzón coda", "Guajeo break"],
        ["In salsa, what does 'tumbao' commonly describe?", "A recurring bass pattern", "A brass mute", "A dance costume", "A sung introduction"],
        ["Which high-pitched double-headed drum is often paired with salsa congas?", "Bongos", "Cuatro", "Maracas", "Güiro"],
        ["What does a bandleader's cue before a salsa section often signal?", "An arranged transition or ensemble hit", "The singer should leave", "The audience should stop clapping", "The clave must reverse"],
        ["Which instrument makes a rasping rhythm by scraping ridges?", "Güiro", "Timbales", "Conga", "Cencerro"],
        ["What is a salsa singer's 'soneo'?", "Improvised lead lines over a repeated chorus", "A fixed brass chord", "A quiet instrumental ending", "A partner-dance turn"],
        ["Which percussion instruments are central to Puerto Rican plena?", "Panderetas, handheld frame drums", "Bamboo flutes", "String harps", "Bowed fiddles"],
        ["What does a salsa 'golpe' usually refer to?", "A sharply accented ensemble hit", "A dance costume", "A slow vocal introduction", "A cymbal roll"],
        ["Which instrument has two shallow metal drums and mounted bells?", "Timbales", "Bongos", "Conga", "Claves"],
        ["What does the salsa label 'salsa dura' generally describe?", "A punchy, brass-forward dance-band style", "A slow solo vocal ballad", "A Cuban flute concerto", "A percussion-free studio arrangement"]
    ]],
    ["Hungarian politics", [
        ["What did Hungary's 1947 'salami tactics' refer to?", "Gradually eliminating political opponents and rival parties", "Redistributing farmland", "Creating a new currency", "Organizing anti-Habsburg resistance"],
        ["Which politician was called the 'wise man of the nation' for the 1867 settlement?", "Ferenc Deák", "Lajos Kossuth", "Miklós Horthy", "Imre Nagy"],
        ["What was the 1919 Hungarian White Terror?", "Counter-revolutionary violence and reprisals", "A farm collectivization drive", "A peaceful constitutional convention", "A diplomatic boycott of Austria"],
        ["What was a key feature of Hungary's 1968 New Economic Mechanism?", "More decentralization and market incentives", "Restoration of monarchy", "Withdrawal from the Warsaw Pact", "Nationalization of all small farms"],
        ["Which party began in 1988 as an anti-communist Hungarian youth movement?", "Fidesz", "MSZP", "SZDSZ", "KDNP"],
        ["What did the 1921 Bethlen-Peyer Pact regulate?", "The legal activity of social democrats and trade unions", "The border with Romania", "Royal succession", "Bank nationalization"],
        ["What did Hungary's 1868 Nationalities Act notably address?", "Language and cultural rights within a unitary state", "Universal property ownership", "Abolition of the upper house", "The secret ballot"],
        ["What happened in Hungary on 16 November 1918?", "The independent Hungarian People's Republic was proclaimed", "The 1867 Compromise was signed", "The Treaty of Trianon took effect", "The Warsaw Pact was founded"],
        ["Which 1944 event brought the Arrow Cross to power in Hungary?", "A German-backed coup after the occupation", "A postwar election", "The signing of the 1867 Compromise", "The 1956 uprising"],
        ["What was the 1990 'Duna Gate' scandal about?", "Late communist surveillance and destruction of secret-police records", "A dispute over Danube shipping tolls", "A contested presidential election", "A failed border treaty with Austria"]
    ]],
    ["Interesting history", [
        ["What is unusual about the Norse site at L'Anse aux Meadows?", "It is the only confirmed Viking site in North America", "It was built underground", "It was a Roman port", "It was occupied continuously for centuries"],
        ["Which shipwreck find contains geared mechanisms for modeling astronomical cycles?", "Antikythera mechanism", "Baghdad Battery", "Nebra sky disk", "Phaistos disk"],
        ["What was an Inca quipu?", "A knotted-cord record-keeping system", "A bronze weapon", "A drinking vessel", "A stone road marker"],
        ["Which Swedish warship sank on its 1628 maiden voyage?", "Vasa", "Mary Rose", "Endeavour", "Golden Hind"],
        ["Tambora's 1815 eruption contributed to which climate event?", "The Year Without a Summer", "The Little Ice Age's beginning", "The Dust Bowl", "The Medieval Warm Period"],
        ["Which West African ruler's pilgrimage to Cairo became famed for its wealth?", "Mansa Musa", "Sundiata Keita", "Askia Muhammad", "Shaka Zulu"],
        ["What was the Hanseatic League?", "An alliance of trading towns", "A monastic order", "An Alpine village federation", "A royal court of judges"],
        ["Which people used Linear B, later deciphered as an early form of Greek?", "Mycenaeans", "Phoenicians", "Etruscans", "Minoans"],
        ["Why is the Voynich manuscript notable?", "Its writing remains undeciphered", "It was Europe's first printed book", "It holds the only Iliad copy", "It records the first circumnavigation"],
        ["What did the medieval Peace of God movement seek to restrain?", "Violence against noncombatants and church property", "Trade between cities", "Written contracts", "Pilgrimages"]
    ]],
    ["Trains", [
        ["What were railway water troughs used for on some steam routes?", "Refilling a locomotive tender without stopping", "Cooling wheel rims", "Cleaning coal dust", "Lubricating junctions"],
        ["Why did early locomotives sometimes have cowcatchers?", "To deflect obstacles or livestock from the track", "To collect mail bags", "To cool the boiler", "To improve snow traction"],
        ["What was a historic British slip coach?", "A coach detached from a moving train to continue to a station", "A carriage for icy weather", "A wagon with a sliding roof", "A gauge-changing coach"],
        ["What advantage did Fairlie locomotives offer on some narrow-gauge routes?", "Articulated powered units could handle sharp curves", "They ran without rails", "They used early electric power", "They changed gauge while moving"],
        ["What was a British parliamentary train?", "A legally required low-fare passenger service", "A train only for MPs", "A royal inspection special", "A government-mail freight train"],
        ["What did Brunel's atmospheric railway use to propel trains?", "A piston in a trackside tube with air pressure", "A cable wound around a drum", "Magnets between the rails", "Compressed steam in each carriage"],
        ["What does railway cant mean?", "Raising the outer rail on a curve", "The gap between tracks", "A locomotive's wheel diameter", "A hinged canal bridge"],
        ["What unusual railway opened in Devon in the 1840s using atmospheric propulsion?", "South Devon Railway", "Stockton and Darlington Railway", "Great Western Railway", "Liverpool and Manchester Railway"],
        ["What did a railway pilotman do on certain single-track lines?", "Authorized or accompanied trains through a controlled section", "Operated dining cars", "Checked tickets", "Repaired boilers en route"],
        ["What was a British railway mail crane used for?", "Letting a moving train collect or exchange mail bags", "Lifting locomotives onto ferries", "Measuring rail wear", "Holding a signal at danger"]
    ]],
    ["Geography", [
        ["What is a nunatak?", "A rock peak protruding through ice or a glacier", "A meltwater lake", "A snow dune", "A volcanic-ash valley"],
        ["Which country contains the Afar Triangle, where three tectonic plates meet?", "Ethiopia", "Chile", "Iceland", "Nepal"],
        ["What is a tombolo?", "A bar of sediment connecting an island to land", "A volcanic crater", "An underground river", "A glacial ridge"],
        ["Where is Point Nemo, farthest from any land?", "South Pacific Ocean", "Arctic Ocean", "Indian Ocean", "Atlantic Ocean"],
        ["How does a drumlin typically form?", "As an elongated hill beneath moving ice", "As a coastal sea stack", "As a coral lagoon", "As a river delta fan"],
        ["What is the world's largest inland body of water by area?", "Caspian Sea", "Aral Sea", "Dead Sea", "Lake Baikal"],
        ["What is a mountain rain shadow?", "Dry conditions on a mountain's leeward side", "Rain over warm ocean currents", "A monsoon shift", "Coastal fog caused by tides"],
        ["Which strait separates Java and Sumatra?", "Sunda Strait", "Makassar Strait", "Lombok Strait", "Malacca Strait"],
        ["How does a ria coast form?", "When river valleys are drowned by rising sea level", "When coral reefs rise", "When lava enters the sea", "When dunes block a river"],
        ["Mount Nyiragongo's famous lava lake is in which country?", "Democratic Republic of the Congo", "Rwanda", "Uganda", "Tanzania"]
    ]],
    ["European Union", [
        ["What can the EU 'right to be forgotten' let a person request from a search engine?", "Delisting certain outdated or irrelevant personal-result links", "Deleting every public record", "Erasing criminal convictions automatically", "Banning news about public figures"],
        ["Which EU programme uses satellites to monitor Earth and the environment?", "Copernicus", "Erasmus+", "Creative Europe", "LIFE"],
        ["What does the Natura 2000 network protect?", "Important habitats and species", "Historic city centers", "Fishing zones", "Rail corridors"],
        ["What does qualified-majority voting in the EU Council combine?", "Thresholds for member states and population share", "A majority of courts and regions", "Unanimity of ministers", "A majority of commissioners"],
        ["Who is the EU Blue Card scheme intended to attract?", "Highly qualified workers from outside the EU", "Students between EU universities", "Retired EU citizens", "Fishing crews"],
        ["What does the EU law principle of primacy mean?", "EU law can prevail over conflicting national law in EU-competence areas", "Every country must use the euro", "National law always overrides EU law", "Courts cannot review EU acts"],
        ["What can a European Citizens' Initiative invite the Commission to do?", "Consider proposing legislation", "Repeal national laws automatically", "Elect its president directly", "Appoint citizens to the Council"],
        ["What question does subsidiarity ask about an EU action?", "Whether action is more effective at EU level than lower levels", "Whether all countries share a tax rate", "Whether courts should decide policy", "Whether laws need translation"],
        ["Which EU satellite navigation system is independent of GPS?", "Galileo", "Copernicus", "EGNOS", "Ariane"],
        ["What does the EU LIFE programme primarily support?", "Environmental and climate projects", "Student exchanges", "Border management", "Farm price guarantees"]
    ]],
    ["Hungarian culture", [
        ["Which Hungarian writer created the character Kornél Esti?", "Dezső Kosztolányi", "Sándor Márai", "Imre Kertész", "Mór Jókai"],
        ["Which Hungarian-born photographer took the famous 'Falling Soldier' image?", "Robert Capa", "László Moholy-Nagy", "André Kertész", "Brassaï"],
        ["What seasonal purpose does the Mohács Busójárás traditionally serve?", "Driving away winter with masked processions", "Welcoming the grape harvest", "Marking spring with horse races", "Commemorating Budapest's founding"],
        ["Which Hungarian-born director made the 1949 musical On the Town?", "Gene Kelly and Stanley Donen", "Michael Curtiz", "George Cukor", "Alexander Korda"],
        ["What is matyó embroidery known for?", "Dense, colorful floral motifs", "Black geometric cross-stitch", "Woven metallic bands", "White bobbin lace"],
        ["Which Hungarian composer wrote the opera Bluebeard's Castle?", "Béla Bartók", "Zoltán Kodály", "Franz Liszt", "Ernő Dohnányi"],
        ["What is halasi csipke?", "Handmade needle lace", "Carved wooden toys", "Painted pottery", "A woven wool cloak"],
        ["Who wrote the Hungarian novel Satantango?", "László Krasznahorkai", "Péter Esterházy", "Antal Szerb", "Magda Szabó"],
        ["Which Hungarian novelist wrote the internationally acclaimed novel The Door?", "Magda Szabó", "Dezső Kosztolányi", "Mór Jókai", "Antal Szerb"],
        ["Who designed Budapest's ornate Museum of Applied Arts?", "Ödön Lechner", "Miklós Ybl", "Imre Steindl", "Marcel Breuer"]
    ]],
    ["Nature", [
        ["What is kleptoparasitism?", "Taking food caught or collected by another animal", "Mimicking a mate's call", "Sharing food with unrelated young", "Hunting only at night"],
        ["Which plant group has seeds but no flowers, including conifers?", "Gymnosperms", "Bryophytes", "Angiosperms", "Ferns"],
        ["What does 'murmuration' describe?", "A coordinated flocking display by starlings", "A frog's breeding call", "Butterfly emergence", "Bees changing hives"],
        ["Which tree's winged fruits spin like helicopters as they fall?", "Maple", "Oak", "Ash", "Birch"],
        ["What is brumation in reptiles?", "A winter period of reduced activity", "A color change for courtship", "Shedding scales", "Migration to salt water"],
        ["What do mycorrhizal fungi exchange with plant roots?", "Minerals for plant sugars", "Water for animal protein", "Nitrogen for sunlight", "Oxygen for cellulose"],
        ["What is a keystone species?", "A species with an unusually large ecosystem effect relative to its abundance", "An organism indicating pollution", "The first species to colonize bare ground", "A species found only on islands"],
        ["Why do some Arctic foxes change coat color seasonally?", "A seasonal molt produces different-colored fur", "Fish pigments dye each hair", "UV light changes fur weekly", "They shed all fur in winter"],
        ["What usually causes fairy rings in grass?", "Fungal growth spreading outward through soil", "Circular deer grazing", "Spring mineral deposits", "Ants building nests"],
        ["What do broadcast-spawning marine animals release into the water?", "Eggs and sperm", "Young in a pouch", "Buds that clone the parent", "Eggs laid on dry land"]
    ]]
]

export const season2: ({ category: string } & QuizQuestion)[] = seasonTwoCategories.flatMap(([category, entries], categoryIndex) => entries.map(([q, correct, ...distractors], questionIndex) => {
    const answer = (categoryIndex * 2 + questionIndex) % 4;
    const options = [...distractors];
    options.splice(answer, 0, correct);
    return { category, q, options, answer };
}));
