// @ts-ignore there are no type definitions for this module
import pandoc from 'node-pandoc';
import PromiseThrottle from 'promise-throttle';
import {sleep} from '../../utils/sleep';
import {logger} from '../../utils/logger';

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
        logger.error(`Pandoc timeout`)
        throw new PandocTimeoutError();
      }),

      new Promise<string>((resolve, reject) => {
        const htmlBody = input.slice(input.indexOf('==Introduction=='));
        pandoc(
          htmlBody,
          '-f mediawiki -t markdown',
          (error: Error, html: (string | boolean)) => {
            timeout.cancel();
            if (error) {
              reject(error);              
            } else if (typeof html === 'string') {
              resolve(html as string);
            } else  {
              const fallback = "Server error parsing description"
              logger.error(`Unknown pandoc error -- non-string response. Patching with "${fallback}" and ignoring...`)
              resolve(fallback);
            }
          },
        )
      },
      ),
    ]);
  });
}

export class PandocTimeoutError extends Error {
  isPandocTimeoutError = true;
}