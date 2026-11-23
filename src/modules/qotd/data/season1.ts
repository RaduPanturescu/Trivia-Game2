import type { QuizQuestion } from '@/shared/quiz'

/**
 * Question of the day, first half of the combined list. Same order and content as legacy/questions.js `qotdData`.
 * The stored `qotdRandomIndex` points into `[...season1, ...season2]`, so do not reorder or edit.
 */
export const season1: ({ category: string } & QuizQuestion)[] = [
    { category: "Otters", q: "What is a group of resting otters called?", options: ["A raft", "A flock", "A herd", "A school"], answer: 0 },
    { category: "Hungary", q: "What is the largest lake in Hungary?", options: ["Lake Tisza", "Lake Balaton", "Lake Velence", "Lake Fertő"], answer: 1 },
    { category: "Food related", q: "Which of these is a traditional Hungarian stew?", options: ["Paella", "Goulash", "Ratatouille", "Moussaka"], answer: 1 },
    { category: "Romania", q: "What is the second largest city in Romania by population?", options: ["Timișoara", "Iași", "Cluj-Napoca", "Constanța"], answer: 2 },
    { category: "Politics", q: "In what year was the United Nations established?", options: ["1918", "1939", "1945", "1955"], answer: 2 },
    { category: "Salsa", q: "Salsa music and dance originated primarily in which city?", options: ["Havana", "San Juan", "New York City", "Miami"], answer: 2 },
    { category: "Hungarian politics", q: "Who was the first democratically elected Prime Minister of Hungary after the fall of communism?", options: ["József Antall", "Gyula Horn", "Viktor Orbán", "Péter Medgyessy"], answer: 0 },
    { category: "Interesting history", q: "How long did the shortest war in history (Anglo-Zanzibar War) last?", options: ["38 minutes", "2 days", "3 hours", "1 week"], answer: 0 },
    { category: "Trains", q: "Which country has the oldest operational railway in the world?", options: ["France", "USA", "Germany", "United Kingdom"], answer: 3 },
    { category: "Otters", q: "Which species of otter is the heaviest?", options: ["North American River Otter", "Sea Otter", "Giant Otter", "Asian Small-clawed Otter"], answer: 1 },
    { category: "Food related", q: "What is the main ingredient in traditional Romanian Mămăligă?", options: ["Wheat flour", "Potato", "Cornmeal", "Rice"], answer: 2 },
    { category: "Salsa", q: "Which instrument is considered the core rhythmic foundation of Salsa music?", options: ["Congas", "Clave", "Bongos", "Trumpet"], answer: 1 },
    { category: "Geography", q: "Which is the smallest country in the world by area?", options: ["Monaco", "Liechtenstein", "Vatican City", "San Marino"], answer: 2 },
    { category: "European Union", q: "In what year did the European Union officially adopt the Euro as its currency?", options: ["1999", "2001", "2002", "2004"], answer: 2 },
    { category: "Trains", q: "What does ICE stand for in German high-speed rail?", options: ["International City Express", "InterCityExpress", "Intercontinental Electric", "Inter-European Connection"], answer: 1 },
    { category: "Hungarian culture", q: "What is Tokaji, for which the Hungarian region is famous?", options: ["A traditional dance", "A type of wine", "A folk costume", "A musical instrument"], answer: 1 },
    { category: "Nature", q: "How long can otters hold their breath underwater?", options: ["Up to 30 seconds", "Up to 2 minutes", "Up to 8 minutes", "Up to 15 minutes"], answer: 2 }
]
