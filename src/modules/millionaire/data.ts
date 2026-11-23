import type { QuizQuestion } from '@/shared/quiz'

/** Prize ladder from Q1 to Q15, as in the legacy prize list. Indexes 4, 9 and 14 are the guaranteed safe havens. */
export const PRIZE_LEVELS: readonly string[] = [
  "$100",
  "$200",
  "$300",
  "$500",
  "$1,000",
  "$2,000",
  "$4,000",
  "$8,000",
  "$16,000",
  "$32,000",
  "$64,000",
  "$125,000",
  "$250,000",
  "$500,000",
  "$1,000,000",
]

/** The 15 Millionaire questions in legacy order. `answer` indexes into `options`. */
export const MILLIONAIRE_QUESTIONS: readonly QuizQuestion[] = [
  {
    q: "What is a group of resting otter called?",
    options: ["A raft", "A boat", "A bask", "Heaven"],
    answer: 0,
  },
  {
    q: "In what edition did Radu compete in the prestigious TV show Top Model Belgium, reaching the semi-finals?",
    options: ["2017", "2018", "2019", "1973"],
    answer: 1,
  },
  {
    q: "What is the literal English translation of the Danish phrase LEG GODT, from which the company name LEGO was famously derived?",
    options: ["Build fast", "Think deeply", "Play well", "Create always"],
    answer: 2,
  },
  {
    q: "Which of these musical terms indicates that a piece of music should be performed at a slow, leisurely pace?",
    options: ["Mas Lentos", "Presto", "Allegro", "Adagio"],
    answer: 3,
  },
  {
    q: "In the hit Netflix television adaptation of Bridgerton, who voices the mysterious, scandalous gossip columnist Lady Whistledown?",
    options: ["Julie Andrews", "Nicola Coughlan", "Phoebe Dynevor", "Maya The Otter"],
    answer: 0,
  },
  {
    q: "The breathtaking green colors most commonly observed in the Northern Lights are caused by solar particles colliding with which specific element in Earth's atmosphere?",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Helium"],
    answer: 0,
  },
  {
    q: "In Julia Quinn s original Bridgerton novel series, which of the eight Bridgerton siblings is the absolute first to have their romantic story told in the debut book, The Duke and I?",
    options: ["Anthony", "Benedict", "Daphne", "Colin"],
    answer: 2,
  },
  {
    q: "Boasting a massive footprint of over 360,000 square meters, Romania's iconic Palace of the Parliament in Bucharest holds which global distinction?",
    options: ["The largest mud-brick structure ever built", "The widest administrative building in the world", "The oldest active parliament house in history", "The heaviest administrative building in the world"],
    answer: 3,
  },
  {
    q: "Under the European Union's landmark General Data Protection Regulation (GDPR), what is the maximum administrative fine that can be levied against a company for a severe tier-one data privacy violation?",
    options: ["Up to €20 million or 4% of global turnover", "Up to €15 million or 3% of global turnover", "Up to €10 million or 2% of global turnover", "Up to €5 million or 1% of global turnover"],
    answer: 0,
  },
  {
    q: "Connecting Buda and Pest across the Danube River, the historic Széchenyi Chain Bridge features majestic stone guardian statues of which animal at its entrances?",
    options: ["Eagles", "Lions", "Bears", "Wolves"],
    answer: 1,
  },
  {
    q: "In the classic series Sex and the City, fashion-obsessed columnist Carrie Bradshaw is most famously known for her expensive obsession with shoes from which luxury designer?",
    options: ["Christian Dior", "Jimmy Choo", "Manolo Blahnik", "Yves Saint Laurent"],
    answer: 2,
  },
  {
    q: "Under the current diagnostic criteria outlined in the Diagnostic and Statistical Manual of Mental Disorders (DSM-5), which of the following is categorized as a core symptom under the (Restricted, repetitive patterns of behavior, interests, or activities) domain?",
    options: ["Persistent deficits in conversational turn-taking", "Structural language impairments or delayed speech development", "Difficulties adjusting behavior to suit various social contexts", "Hyper- or hypo-reactivity to sensory input (such as textures or sounds)"],
    answer: 3,
  },
  {
    q: "In options trading, an IRON CONDOR is a popular market-neutral strategy designed to profit from which of the following market conditions?",
    options: ["A massive, sudden price breakout in either direction", "Low volatility, where the underlying asset price stays within a tight range", "A steady, long-term bullish uptrend", "An immediate, catastrophic market crash"],
    answer: 1,
  },
  {
    q: "Large-scale Genome-Wide Association Studies (GWAS) and Linkage Disequilibrium (LD) score regressions have demonstrated that ADHD has a massive, highly polygenic architecture. When evaluating cross-trait genetic correlations ($r_g$), which of the following phenotypes exhibits the strongest negative genetic correlation with ADHD liability?",
    options: ["Parental lifespan", "Years of schooling", "Subjective well-being", "HDL cholesterol levels"],
    answer: 1,
  },
  {
    q: "During the height of a major sovereign debt or financial crisis, if a Eurozone member state requires emergency liquidity or a formal stability support programme, the Eurogroup coordinates the response. However, the critical, highly sensitive task of executing daily marketplace operations, managing financial disbursements, and conducting the actual bond market transactions on behalf of the European Stability Mechanism (ESM) is legally delegated to which external institution?",
    options: ["The European Investment Bank (EIB)", "The Bank for International Settlements (BIS)", "The German Finance Agency (Finanzagentur)", "The Directorate-General for Economic and Financial Affairs (DG ECFIN)"],
    answer: 2,
  },
]
