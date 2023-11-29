import chalk from 'chalk';
import {identity, isString} from 'lodash';
import {inspect} from 'util';

/**
 * All messages that get printed to the console should flow through this object.
 * This allows us to disable specific types of log messages and ensure consistent formatting.
 */
class Logger {
  enable = true;
  enableFetch = false;

  /**
   * Call this method every time you make an HTTP request.
   */
  fetch(url: string, type: 'live' | 'cached' = 'live') {
    if (this.enableFetch) {
      this.inner('log', chalk.dim, [
        `Fetch ${type === 'live' ? chalk.bold(chalk.green('live')) : type} ${url}`,
      ]);
    }
  }

  /**
   * Call this method to report progress on a long-running task with a known number of steps.
   */
  progress(totalCount: number, doneCount: number, name: string) {
    const percentString = (doneCount / totalCount).toLocaleString(undefined, {
      style: 'percent',
      minimumFractionDigits: 1,
    });

    const fractionString = `${doneCount.toLocaleString()}/${totalCount.toLocaleString()}`;

    this.inner('log', identity, [`${percentString} (${fractionString}) ${name}`], {
      isProgress: true,
    });
  }

  /**
   * Call this method to report a general log message.
   * Prefer a more specific method like `progress` if applicable.
   */
  log(...args: unknown[]) {
    this.inner('log', identity, args);
  }

  warn(...args: unknown[]) {
    this.inner('warn', chalk.yellow, args);
  }

  error(...args: unknown[]) {
    this.inner('error', chalk.red, args);
  }

  /**
   * Call this method to report the start and end of a long-running task.
   */
  step<T extends unknown[], U>(fn: (...args: T) => Promise<U>, args: T): Promise<U> {
    const startTime = Date.now();
    this.inner('log', s => chalk.blue(chalk.bold(s)), [`Start ${fn.name}`]);
    const promise = fn(...args);
    promise.then(() => {
      const timeString = ((Date.now() - startTime) / 1000).toLocaleString(undefined, {
        unit: 'second',
        unitDisplay: 'short',
        style: 'unit',
      });

      this.inner('log', identity, [
        chalk.blue(chalk.bold(`End   ${fn.name}`)) + chalk.dim(` ${timeString}`),
      ]);
    });
    return promise;
  }

  /**
   * Call this method to report the entire program has completed successfully.
   */
  done() {
    this.inner('log', s => chalk.green(chalk.bold(s)), [`DONE`]);
  }

  private isPreviousProgress = false;

  private inner(
    stream: 'log' | 'error' | 'warn',
    transform: (input: string) => string,
    args: unknown[],
    {isProgress}: {isProgress: boolean} = {isProgress: false},
  ) {
    if (!this.enable) return false;

    // If this line is a progress report AND the previous line is a progress report, overwrite the
    // previous line. This keeps the console output clean and makes errors easier to spot.
    if (isProgress && this.isPreviousProgress && process.stdout.isTTY) {
      process.stdout.moveCursor(0, -1);
      process.stdout.clearLine(1);
    }

    console[stream](...args.map(arg => transform(isString(arg) ? arg : inspect(arg, {depth: 10}))));

    this.isPreviousProgress = isProgress;
  }
}

export const logger = new Logger();
