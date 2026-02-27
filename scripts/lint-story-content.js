import { STORY_ARC_ORDER, STORY_DECK, STORY_EVENTS } from "../content/story-events.js";

const errors = [];

function addError(message) {
  errors.push(message);
}

function checkEventShape(eventId, event) {
  if (event.id !== eventId) addError(`event id mismatch: key=${eventId} id=${event.id}`);
  if (!event.title) addError(`event missing title: ${eventId}`);
  if (!event.text) addError(`event missing text: ${eventId}`);
  if (!event.nodeType) addError(`event missing nodeType: ${eventId}`);
  if (!Array.isArray(event.tags)) addError(`event tags must be array: ${eventId}`);
  if (event.enemyPool && !Array.isArray(event.enemyPool)) addError(`event enemyPool must be array: ${eventId}`);
  if (event.branches && !Array.isArray(event.branches)) addError(`event branches must be array: ${eventId}`);
}

function collectForwardRefs(eventId, effects, refs) {
  if (!effects) return;
  (effects.enqueue || []).forEach((targetId) => refs.push({ from: eventId, targetId, type: "enqueue" }));
  (effects.enqueueBranch || []).forEach((targetId) => refs.push({ from: eventId, targetId, type: "enqueueBranch" }));
}

const ids = new Set(Object.keys(STORY_EVENTS));
const refs = [];

Object.entries(STORY_EVENTS).forEach(([eventId, event]) => {
  checkEventShape(eventId, event);
  collectForwardRefs(eventId, event.preEffects, refs);

  (event.branches || []).forEach((branch, idx) => {
    if (!branch.id) addError(`branch missing id: ${eventId}[${idx}]`);
    if (!branch.label) addError(`branch missing label: ${eventId}[${idx}]`);
    if (!branch.text) addError(`branch missing text: ${eventId}[${idx}]`);
    collectForwardRefs(`${eventId}/${branch.id || idx}`, branch.effects, refs);
  });
});

STORY_ARC_ORDER.forEach((eventId) => {
  if (!ids.has(eventId)) addError(`STORY_ARC_ORDER references missing event: ${eventId}`);
});
STORY_DECK.forEach((eventId) => {
  if (!ids.has(eventId)) addError(`STORY_DECK references missing event: ${eventId}`);
});
refs.forEach((ref) => {
  if (!ids.has(ref.targetId)) addError(`${ref.type} target missing: ${ref.from} -> ${ref.targetId}`);
});

const roots = [...new Set([...STORY_ARC_ORDER, ...STORY_DECK])].filter((id) => ids.has(id));
const visited = new Set();
const stack = [...roots];
while (stack.length) {
  const id = stack.pop();
  if (visited.has(id)) continue;
  visited.add(id);
  const event = STORY_EVENTS[id];
  if (!event) continue;

  const next = [];
  (event.preEffects?.enqueue || []).forEach((targetId) => next.push(targetId));
  (event.preEffects?.enqueueBranch || []).forEach((targetId) => next.push(targetId));
  (event.branches || []).forEach((branch) => {
    (branch.effects?.enqueue || []).forEach((targetId) => next.push(targetId));
    (branch.effects?.enqueueBranch || []).forEach((targetId) => next.push(targetId));
  });
  next.forEach((targetId) => {
    if (ids.has(targetId) && !visited.has(targetId)) stack.push(targetId);
  });
}

const orphanEvents = [...ids].filter((id) => !visited.has(id));
orphanEvents.forEach((id) => addError(`orphan event (unreachable from arc/deck/queue refs): ${id}`));

if (errors.length) {
  console.error(`story lint failed with ${errors.length} issue(s):`);
  errors.forEach((line) => console.error(`- ${line}`));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      eventCount: ids.size,
      arcCount: STORY_ARC_ORDER.length,
      deckCount: STORY_DECK.length,
      refCount: refs.length,
    },
    null,
    2
  )
);
