// @ts-ignore
import pandoc from 'node-pandoc';
import PromiseThrottle from 'promise-throttle';

export const promiseThrottle = new PromiseThrottle({requestsPerSecond: 500});

type ParseDescriptionOutput = {html: string; timeout: false} | {timeout: true};

/**
 * Turn MediaWiki markup into HTML
 */
export async function parseDescription(input: string): Promise<ParseDescriptionOutput> {
  return promiseThrottle.add(async () => {
    return await Promise.race([
      (async (): Promise<ParseDescriptionOutput> => {
        await sleep(5000);
        return {timeout: true};
      })(),
      new Promise<ParseDescriptionOutput>((resolve, reject) =>
        pandoc(
          input.slice(input.indexOf('==Introduction==')),
          '-f mediawiki -t html',
          (error: Error, html: string) => {
            if (error) reject(error);
            else resolve({timeout: false, html});
          },
        ),
      ),
    ]);
  });
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
