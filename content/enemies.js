export const ENEMY_LIBRARY = {
  scavenger: {
    id: "scavenger",
    name: "Scrap Scavenger",
    maxHp: 42,
    intents: [
      { type: "attack", value: 6, label: "Stab 6" },
      { type: "debuff", status: "vulnerable", value: 2, label: "Pinpoint 2 Vulnerable" },
      { type: "block", value: 7, label: "Brace 7" },
    ],
  },
  enforcer: {
    id: "enforcer",
    name: "District Enforcer",
    maxHp: 56,
    intents: [
      { type: "attack", value: 7, label: "Bash 7" },
      { type: "attack", value: 10, label: "Crush 10" },
      { type: "block", value: 12, label: "Shield Up 12" },
    ],
  },
  sniper: {
    id: "sniper",
    name: "Rooftop Sniper",
    maxHp: 38,
    intents: [
      { type: "debuff", status: "weak", value: 2, label: "Suppress 2 Weak" },
      { type: "attack", value: 12, label: "Aimed Shot 12" },
      { type: "attack", value: 5, label: "Quick Shot 5" },
    ],
  },
};

export const ENEMY_ORDER = ["scavenger", "enforcer", "sniper"];
