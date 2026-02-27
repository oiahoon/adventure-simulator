export function createLogger(limit = 120) {
  const entries = [];

  function push(level, message) {
    const line = {
      ts: new Date().toISOString(),
      level,
      message,
    };
    entries.push(line);
    if (entries.length > limit) {
      entries.shift();
    }
    return line;
  }

  return {
    info(message) {
      return push("info", message);
    },
    warn(message) {
      return push("warn", message);
    },
    error(message) {
      return push("error", message);
    },
    list() {
      return [...entries];
    },
    clear() {
      entries.length = 0;
    },
  };
}
