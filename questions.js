/*
  Aapna Kahoot — question bank
  40 questions, 4 options each, one correct answer (0-indexed).
  A fresh random order is generated for every new game (see app.js),
  so you don't need to shuffle this file by hand.

  Want to add your own questions? Just push more objects in the same
  shape: { category, q, options: [4 strings], correct: 0-3 }
*/
const QUESTIONS = [
  // ---- Maths ----
  { category: "Maths", q: "What is 15% of 200?", options: ["20", "30", "25", "35"], correct: 1 },
  { category: "Maths", q: "What is the value of π (pi), rounded to two decimal places?", options: ["3.12", "3.14", "3.16", "3.18"], correct: 1 },
  { category: "Maths", q: "A triangle has angles 90° and 45°. What is the third angle?", options: ["35°", "40°", "45°", "55°"], correct: 2 },
  { category: "Maths", q: "What is the square root of 144?", options: ["10", "11", "12", "14"], correct: 2 },
  { category: "Maths", q: "What is 7 × 8?", options: ["54", "56", "58", "64"], correct: 1 },

  // ---- General Knowledge ----
  { category: "General Knowledge", q: "Who wrote India's national anthem, \"Jana Gana Mana\"?", options: ["Bankim Chandra Chatterjee", "Rabindranath Tagore", "Sarojini Naidu", "Muhammad Iqbal"], correct: 1 },
  { category: "General Knowledge", q: "What is the currency of Japan?", options: ["Yuan", "Won", "Yen", "Ringgit"], correct: 2 },
  { category: "General Knowledge", q: "Which is the largest ocean on Earth?", options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"], correct: 3 },
  { category: "General Knowledge", q: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correct: 2 },
  { category: "General Knowledge", q: "What is the national bird of India?", options: ["Sparrow", "Peacock", "Eagle", "Parrot"], correct: 1 },

  // ---- Politics / Civics ----
  { category: "Politics", q: "Who was the first Prime Minister of independent India?", options: ["Sardar Patel", "Jawaharlal Nehru", "Dr. Rajendra Prasad", "Lal Bahadur Shastri"], correct: 1 },
  { category: "Politics", q: "On which date did the Constitution of India come into effect?", options: ["15 August 1947", "26 January 1950", "2 October 1948", "26 November 1949"], correct: 1 },
  { category: "Politics", q: "Who is known as the \"Father of the Indian Constitution\"?", options: ["Mahatma Gandhi", "Dr. B. R. Ambedkar", "Jawaharlal Nehru", "Sardar Patel"], correct: 1 },
  { category: "Politics", q: "Who is the Head of State of India?", options: ["Prime Minister", "Chief Justice", "President", "Speaker of Lok Sabha"], correct: 2 },
  { category: "Politics", q: "The Indian Parliament consists of the President and which two houses?", options: ["Lok Sabha & Rajya Sabha", "Vidhan Sabha & Vidhan Parishad", "Senate & Congress", "Assembly & Council"], correct: 0 },

  // ---- Sports (Cricket) ----
  { category: "Cricket", q: "How many players are there in a cricket team on the field?", options: ["9", "10", "11", "12"], correct: 2 },
  { category: "Cricket", q: "Who has scored the most international centuries in cricket history?", options: ["Virat Kohli", "Sachin Tendulkar", "Ricky Ponting", "Kumar Sangakkara"], correct: 1 },
  { category: "Cricket", q: "India won the ICC Cricket World Cup in which two years?", options: ["1983 and 2011", "1987 and 2003", "1983 and 2007", "1992 and 2011"], correct: 0 },
  { category: "Cricket", q: "What is scoring zero runs in cricket called?", options: ["Duck", "Golden Run", "Blank", "Zero Score"], correct: 0 },
  { category: "Cricket", q: "How many balls are there in one over in cricket?", options: ["4", "5", "6", "8"], correct: 2 },

  // ---- Indian God / Goddess ----
  { category: "Indian God/Goddess", q: "Who is worshipped as the God of Wisdom and remover of obstacles?", options: ["Shiva", "Ganesha", "Vishnu", "Hanuman"], correct: 1 },
  { category: "Indian God/Goddess", q: "Who is the Goddess of Wealth and Prosperity?", options: ["Saraswati", "Durga", "Lakshmi", "Parvati"], correct: 2 },
  { category: "Indian God/Goddess", q: "In the Trimurti, who is worshipped as the destroyer?", options: ["Brahma", "Vishnu", "Shiva", "Indra"], correct: 2 },
  { category: "Indian God/Goddess", q: "Who is the monkey god known for his devotion to Lord Rama?", options: ["Ganesha", "Hanuman", "Garuda", "Nandi"], correct: 1 },
  { category: "Indian God/Goddess", q: "Who is the Goddess of Knowledge and Learning?", options: ["Lakshmi", "Durga", "Saraswati", "Kali"], correct: 2 },

  // ---- Basic Science ----
  { category: "Basic Science", q: "What is the chemical symbol for water?", options: ["H2O", "O2", "CO2", "HO2"], correct: 0 },
  { category: "Basic Science", q: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correct: 2 },
  { category: "Basic Science", q: "Which gas do plants absorb from the air for photosynthesis?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], correct: 1 },
  { category: "Basic Science", q: "What is the \"powerhouse of the cell\" called?", options: ["Nucleus", "Ribosome", "Mitochondria", "Cytoplasm"], correct: 2 },
  { category: "Basic Science", q: "Which force pulls objects toward the Earth?", options: ["Magnetism", "Friction", "Gravity", "Tension"], correct: 2 },

  // ---- Flags of the world ----
  { category: "Flags", q: "Which flag belongs to India?", options: ["🇮🇳", "🇮🇹", "🇮🇪", "🇮🇩"], correct: 0 },
  { category: "Flags", q: "Which flag belongs to Japan?", options: ["🇰🇷", "🇨🇳", "🇯🇵", "🇹🇭"], correct: 2 },
  { category: "Flags", q: "Which flag belongs to Brazil?", options: ["🇦🇷", "🇧🇷", "🇲🇽", "🇨🇴"], correct: 1 },
  { category: "Flags", q: "Which flag belongs to Australia?", options: ["🇳🇿", "🇬🇧", "🇦🇺", "🇺🇸"], correct: 2 },
  { category: "Flags", q: "Which flag belongs to Canada?", options: ["🇺🇸", "🇨🇦", "🇬🇧", "🇫🇷"], correct: 1 },

  // ---- Cities of India ----
  { category: "Cities of India", q: "Which city is known as the \"Silicon Valley of India\"?", options: ["Hyderabad", "Bengaluru", "Pune", "Chennai"], correct: 1 },
  { category: "Cities of India", q: "Which city is the capital of Rajasthan?", options: ["Udaipur", "Jodhpur", "Jaipur", "Ajmer"], correct: 2 },
  { category: "Cities of India", q: "Which Indian city is known as the \"City of Lakes\"?", options: ["Bhopal", "Udaipur", "Nainital", "Srinagar"], correct: 1 },
  { category: "Cities of India", q: "Which city is the financial capital of India?", options: ["Delhi", "Kolkata", "Mumbai", "Chennai"], correct: 2 },
  { category: "Cities of India", q: "Which city is home to the Taj Mahal?", options: ["Jaipur", "Agra", "Lucknow", "Varanasi"], correct: 1 },
];
