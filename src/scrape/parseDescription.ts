// @ts-ignore there are no type definitions for this module
import pandoc from 'node-pandoc';
import PromiseThrottle from 'promise-throttle';
import {sleep} from './sleep';

/**
 * Limit the number of Pandoc processes created to 500 per second to prevent the system from running
 * out of file descriptors.
 */
export const promiseThrottle = new PromiseThrottle({requestsPerSecond: 500});

/**
 * If Pandoc takes longer than this to run, throw a `PandocTimeoutError`. Unexpected input can cause
 * Pandoc to hang indefinitely.
 */
const timeoutMilliseconds = 5000;

/**
 * Turn MediaWiki markup into HTML
 */
export async function parseDescription(input: string): Promise<string> {
  return promiseThrottle.add(async () => {
    const timeout = sleep(timeoutMilliseconds);

    return await Promise.race([
      timeout.then(() => {
        throw new PandocTimeoutError();
      }),

      new Promise<string>((resolve, reject) =>
        pandoc(
          input.slice(input.indexOf('==Introduction==')),
          '-f mediawiki -t html',
          (error: Error, html: string) => {
            timeout.cancel();
            if (error) reject(error);
            else resolve(html);
          },
        ),
      ),
    ]);
  });
}

export class PandocTimeoutError extends Error {
  isPandocTimeoutError = true;
}
