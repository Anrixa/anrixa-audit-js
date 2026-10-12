export function stableClone(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stableClone);

  const output = {};
  for (const key of Object.keys(value).sort()) {
    output[key] = stableClone(value[key]);
  }
  return output;
}

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export function normalizeCheckResult(result) {
  if (typeof result === "boolean") return { passed: result };
  if (!result || typeof result !== "object" || typeof result.passed !== "boolean") {
    throw new TypeError("A check must return a boolean or an object with a boolean 'passed' property.");
  }
  return result;
}
