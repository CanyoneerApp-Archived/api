import chalk from 'chalk';
import {identity, isString} from 'lodash';
import {inspect} from 'util';

export const logger = {
  enableVerbose: false,

  verbose(...args: unknown[]) {
    if (this.enableVerbose) {
      console.log(...this.format(args, chalk.dim));
    }
  },

  warn(...args: unknown[]) {
    console.warn(...this.format(args, chalk.yellow));
  },

  error(...args: unknown[]) {
    console.error(...this.format(args, chalk.red));
  },

  log(...args: unknown[]) {
    console.log(...this.format(args));
  },

  format(args: unknown[], transform: (input: string) => string = identity) {
    return args.map(arg => transform(isString(arg) ? arg : inspect(arg, {depth: 10})));
  },
};
