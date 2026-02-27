export const ENEMY_LIBRARY = {
  scavenger: {
    id: "scavenger",
    name: "Scrap Scavenger",
    maxHp: 42,
    intents: [
      { type: "attack", value: 6, label: "Stab 6" },
      { type: "block", value: 7, label: "Brace 7" },
      { type: "attack", value: 8, label: "Lunge 8" },
    ],
  },
  enforcer: {
    id: "enforcer",
    name: "District Enforcer",
    maxHp: 56,
    intents: [
      { type: "attack", value: 7, label: "Bash 7" },
      { type: "attack", value: 10, label: "Crush 10" },
      { type: "block", value: 10, label: "Shield Up 10" },
    ],
  },
  sniper: {
    id: "sniper",
    name: "Rooftop Sniper",
    maxHp: 38,
    intents: [
      { type: "attack", value: 5, label: "Shot 5" },
      { type: "attack", value: 12, label: "Aimed Shot 12" },
      { type: "block", value: 4, label: "Take Cover 4" },
    ],
  },
};

export const ENEMY_ORDER = ["scavenger", "enforcer", "sniper"];
