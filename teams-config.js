// Team configuration - Easy to edit without touching the main code
const teamsConfig = {
  teamMappings: {
    trebge: "Maid'n Atletic",
    dabbenvanger: "Toasty Town",
    prettyparacetamol: "You Will Never Find Brian Here",
    blow_your_mind: "NAC Breda 1912",
    bokkie2: "Rode Ster Nijmegen",
    vinz_clortho: "Keymasters",
    soestvb: "Het Flevoslot",
    robinkor: "Walburg"
  },
  teamOrder: [
    "Maid'n Atletic",
    "Keymasters",
    "Walburg",
    "Toasty Town",
    "You Will Never Find Brian Here",
    "Het Flevoslot",
    "NAC Breda 1912",
    "Rode Ster Nijmegen"
  ],
  settings: {
    matchesPerTeam: 6,
    includeBonusRound: true,
    bonusSearchRange: 10,
    scorePatterns: [
      "(\\d+)\\s*-\\s*(\\d+)",  // Format: "2 - 1" or "2-1"
      "(\\d+)\\s*:\\s*(\\d+)"   // Format: "2 : 1" or "2:1"
    ]
  }
};