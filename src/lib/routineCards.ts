export type RoutineCardMode = "am" | "pm";

export function parseRoutineCardMode(
  value: string | string[] | undefined | null
): RoutineCardMode {
  const firstValue = Array.isArray(value) ? value[0] : value;
  return firstValue === "pm" ? "pm" : "am";
}

export function getRoutineCardLabel(mode: RoutineCardMode) {
  return mode === "am" ? "朝" : "夜";
}

export function getRoutineCardEmoji(mode: RoutineCardMode) {
  return mode === "am" ? "☀️" : "🌙";
}

export function getRoutineCardHeading(mode: RoutineCardMode) {
  return mode === "am" ? "朝のスキンケア" : "夜のスキンケア";
}
