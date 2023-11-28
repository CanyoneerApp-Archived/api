// @ts-ignore
import pandoc from 'node-pandoc';
import PromiseThrottle from 'promise-throttle';
import {sleep} from './sleep';

export const promiseThrottle = new PromiseThrottle({requestsPerSecond: 500});

/**
 * Turn MediaWiki markup into HTML
 */
export async function parseDescription(input: string): Promise<string> {
  return promiseThrottle.add(async () => {
    const sleepPromise = sleep(5000);

    return await Promise.race([
      // Throw a `PandocTimeoutError` unless `sleepPromise` is cancelled
      sleepPromise.then(() => {
        throw new PandocTimeoutError();
      }),

      new Promise<string>((resolve, reject) =>
        pandoc(
          input.slice(input.indexOf('==Introduction==')),
          '-f mediawiki -t html',
          (error: Error, html: string) => {
            sleepPromise.cancel();
            if (error) reject(error);
            else resolve(html);
          },
        ),
      ),
    ]);
  });
}

export class PandocTimeoutError extends Error {}
