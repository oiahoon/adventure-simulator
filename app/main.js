import { createLogger } from "../core/logger.js";
import { createGameUI } from "../ui/game-ui.js";

const state = {
  mode: "boot",
  tick: 0,
};

const logger = createLogger();
const root = document.querySelector("#app");
const ui = createGameUI(root, logger);

function update(dtSec) {
  state.tick += dtSec;
}

function render() {
  ui.refresh();
}

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  const dt = ms / 1000 / steps;
  for (let i = 0; i < steps; i += 1) {
    update(dt);
  }
  render();
};

window.render_game_to_text = () => {
  return JSON.stringify({
    coordinateSystem: "UI only in M0; origin top-left, +x right, +y down",
    mode: state.mode,
    tick: Number(state.tick.toFixed(3)),
    logs: logger.list().slice(-5).map((entry) => entry.message),
  });
};

logger.info("M0 boot complete");
state.mode = "idle";
ui.setPhase("M0 skeleton ready");
render();
