import chalk from 'chalk';
import {identity, isString, unzip} from 'lodash';
import {inspect} from 'util';
import {baselineStats as defaultBaselineStats} from './baselineStats';
import {WriteOutputStats} from './writeOutput';

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
      this.inner('log', [
        chalk.dim(`Fetch ${type === 'live' ? chalk.bold(chalk.green('live')) : type} ${url}`),
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

    this.inner('log', [`${percentString} (${fractionString}) ${name}`], {
      isProgress: true,
    });
  }

  /**
   * Call this method to report a general log message.
   * Prefer a more specific method like `progress` if applicable.
   */
  log(...args: unknown[]) {
    this.inner('log', args);
  }

  warn(...args: unknown[]) {
    this.inner('warn', args, {style: chalk.yellow});
  }

  error(...args: unknown[]) {
    this.inner('error', args, {style: chalk.red});
  }

  /**
   * Call this method to report the start and end of a long-running task.
   */
  step<T extends unknown[], U>(fn: (...args: T) => Promise<U>, args: T): Promise<U> {
    const startTime = Date.now();
    this.inner('log', [chalk.blue(chalk.bold(`Start ${fn.name}`))]);
    const promise = fn(...args);
    promise.then(() => {
      const timeString = ((Date.now() - startTime) / 1000).toLocaleString(undefined, {
        unit: 'second',
        unitDisplay: 'short',
        style: 'unit',
      });

      this.inner('log', [chalk.blue(chalk.bold(`End   ${fn.name}`)) + chalk.dim(` ${timeString}`)]);
    });
    return promise;
  }

  outputStats(
    actualStats: WriteOutputStats,
    baselineStats: WriteOutputStats = defaultBaselineStats,
  ) {
    const isRegionMismatch = actualStats.regions !== baselineStats.regions;

    const names = Object.keys({...actualStats, ...baselineStats}) as (keyof WriteOutputStats)[];
    const table: string[][] = [['name', 'baseline', 'actual', '% change']];
    for (const name of names) {
      if (name === 'regions') continue;
      const baselineValue = baselineStats[name];
      const actualValue = actualStats[name];

      table.push([
        name,
        formatKBString(baselineValue),
        formatKBString(actualValue),
        formatPercentChange(actualValue, baselineValue, isRegionMismatch),
      ]);
    }

    this.inner('log', [chalk.bold(chalk.magenta('Output Stats'))]);
    this.table(table, {style: chalk.magenta});

    function formatPercentChange(
      actualValue: number,
      baselineValue: number,
      isRegionMismatch: boolean,
    ) {
      if (isRegionMismatch) {
        return chalk.red('region mismatch');
      } else if (!baselineValue || !actualValue) {
        return 'null';
      } else {
        return ((actualValue - baselineValue) / baselineValue).toLocaleString(undefined, {
          style: 'percent',
          maximumSignificantDigits: 2,
        });
      }
    }

    function formatKBString(bytes: number | undefined) {
      return bytes
        ? (bytes / 1000).toLocaleString(undefined, {
            unit: 'kilobyte',
            unitDisplay: 'short',
            style: 'unit',
            maximumSignificantDigits: 2,
          })
        : 'undefined';
    }
  }

  private table(tableData: string[][], {style = identity}: {style: (input: string) => string}) {
    const columnWidths = unzip(tableData).map(column => Math.max(...column.map(s => s.length)));
    this.inner('log', [tableData[0].map((s, i) => s.padEnd(columnWidths[i])).join(' | ')], {style});
    this.inner('log', [columnWidths.map(width => '-'.repeat(width)).join('-|-')], {style});
    for (const row of tableData.slice(1)) {
      this.inner('log', [row.map((s, i) => s.padEnd(columnWidths[i])).join(' | ')], {style});
    }
  }

  /**
   * Call this method to report the entire program has completed successfully.
   */
  done() {
    this.inner('log', [chalk.green(chalk.bold(`DONE`))]);
  }

  private isPreviousProgress = false;

  private inner(
    stream: 'log' | 'error' | 'warn',
    args: unknown[],
    {
      isProgress = false,
      style = identity,
    }: {isProgress?: boolean; style?: (input: string) => string} = {},
  ) {
    if (!this.enable) return;

    // If this line is a progress report AND the previous line is a progress report, overwrite the
    // previous line. This keeps the console output clean and makes errors easier to spot.
    if (isProgress && this.isPreviousProgress && process.stdout.isTTY) {
      process.stdout.moveCursor(0, -1);
      process.stdout.clearLine(1);
    }

    console[stream](...args.map(arg => style(isString(arg) ? arg : inspect(arg, {depth: 10}))));

    this.isPreviousProgress = isProgress;
  }
}

export const logger = new Logger();
