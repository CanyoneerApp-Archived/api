import chalk from 'chalk';
import {identity, isString} from 'lodash';
import {inspect} from 'util';

class Logger {
  isLastLineProgress = false;
  enableFetch = false;
  enableAll = true;

  fetch(url: string, type: 'live' | 'cached') {
    if (this.enableFetch) {
      this.inner(
        'log',
        chalk.dim,
        `Fetch ${type === 'live' ? chalk.bold(chalk.green('live')) : type} ${url}`,
      );
    }
  }

  progress(totalCount: number, doneCount: number, name: string) {
    if (this.isLastLineProgress) {
      process.stdout.moveCursor(0, -1);
      process.stdout.clearLine(1);
    }
    const percentString = (doneCount / totalCount).toLocaleString(undefined, {
      style: 'percent',
      minimumFractionDigits: 1,
    });

    const fractionString = `${doneCount.toLocaleString()}/${totalCount.toLocaleString()}`;

    this.inner('log', identity, `${percentString} (${fractionString}) ${name}`);
    this.isLastLineProgress = true;
  }

  verbose(...args: unknown[]) {
    this.inner('log', identity, ...args);
  }

  warn(...args: unknown[]) {
    this.inner('warn', chalk.yellow, ...args);
  }

  error(...args: unknown[]) {
    this.inner('error', chalk.red, ...args);
  }

  step<T>(step: string, promise: Promise<T>): Promise<T> {
    const startTime = Date.now();
    this.inner('log', s => chalk.blue(chalk.bold(s)), `Start ${step}`);
    promise.then(() => {
      const timeString = ((Date.now() - startTime) / 1000).toLocaleString(undefined, {
        unit: 'second',
        unitDisplay: 'short',
        style: 'unit',
      });

      this.inner('log', s => chalk.blue(chalk.bold(s)), `End   ${step} ${timeString}`);
    });
    return promise;
  }

  done() {
    this.inner('log', s => chalk.green(chalk.bold(s)), `DONE`);
    this.isLastLineProgress = false;
  }

  private inner(
    stream: 'log' | 'error' | 'warn',
    transform: (input: string) => string,
    ...args: unknown[]
  ) {
    if (!this.enableAll) return;
    console[stream](...args.map(arg => transform(isString(arg) ? arg : inspect(arg, {depth: 10}))));
    this.isLastLineProgress = false;
  }
}

export const logger = new Logger();
