import chalk from 'chalk';
import {isString} from 'lodash';
import {inspect} from 'util';

type Step =
  | 'scrapeKMLs'
  | 'scrapeDescriptions'
  | 'writeTippecanoe'
  | 'writeAllSchemas'
  | 'scrapeIndices'
  | 'syncStack'
  | 'uploadOutputDir'
  | 'rmOutputDir';

let isLastLineProgress = false;
const enableFetch = false;

export function fetch(url: string, type: 'live' | 'cached') {
  if (enableFetch) {
    inner(
      'log',
      chalk.dim,
      `Fetch ${type === 'live' ? chalk.bold(chalk.green('live')) : type} ${url}`,
    );
  }
}

export function progress(totalCount: number, doneCount: number, name: string) {
  if (isLastLineProgress) {
    process.stdout.moveCursor(0, -1);
    process.stdout.clearLine(1);
  }
  const percentString = (doneCount / totalCount).toLocaleString(undefined, {
    style: 'percent',
    minimumFractionDigits: 1,
  });

  const fractionString = `${doneCount.toLocaleString()}/${totalCount.toLocaleString()}`;

  inner('log', chalk.dim, `${percentString} (${fractionString}) ${name}`);
  isLastLineProgress = true;
}

export function verbose(...args: unknown[]) {
  inner('log', chalk.dim, ...args);
}

export function warn(...args: unknown[]) {
  inner('warn', chalk.yellow, ...args);
}

export function error(...args: unknown[]) {
  inner('error', chalk.red, ...args);
}

export function step<T>(step: Step, promise: Promise<T>): Promise<T> {
  const startTime = Date.now();
  inner('log', s => chalk.blue(chalk.bold(s)), `Start ${step}`);
  promise.then(() => {
    const timeString = ((Date.now() - startTime) / 1000).toLocaleString(undefined, {
      unit: 'second',
      unitDisplay: 'short',
      style: 'unit',
    });

    inner('log', s => chalk.blue(chalk.bold(s)), `End   ${step} ${timeString}`);
  });
  return promise;
}

export function done() {
  inner('log', s => chalk.green(chalk.bold(s)), `DONE`);
  isLastLineProgress = false;
}

function inner(
  stream: 'log' | 'error' | 'warn',
  transform: (input: string) => string,
  ...args: unknown[]
) {
  console[stream](...args.map(arg => transform(isString(arg) ? arg : inspect(arg, {depth: 10}))));
  isLastLineProgress = false;
}
