const permitsObject = {
  'No permit required': true,
  'Permit required': true,
  'Closed to entry': true,
  'Access is Restricted': true,
};

export type Permits = keyof typeof permitsObject;

export function parsePermits(input: string): Permits | undefined {
  if (input in permitsObject) {
    return input as Permits;
  } else if (input) {
    throw new Error(`Unexpected string in permits: ${input}`);
  } else {
    return undefined;
  }
}
