export function parseIntSafe(input: string | undefined) {
  if (input === undefined) return undefined;
  const output = parseInt(input);
  return isNaN(output) ? undefined : output;
}
