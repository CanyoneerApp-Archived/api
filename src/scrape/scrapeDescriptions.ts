import {isObject, chunk as lodashChunk} from 'lodash';
// @ts-ignore
import XML2JS from 'xml2js';
import {logger} from '../logger';
import {RouteV2} from '../types/v2';
import cachedFetch from './cachedFetch';
import {validate} from './getValidator';
import {parseDescription} from './parseDescription';

/**
 * Take an array of `RouteV2`s, scrape their KMLs, and return a new array of routes with the
 * "description" property populated.
 */
export async function scrapeDescriptions(routes: RouteV2[]): Promise<RouteV2[]> {
  const routeChunks = lodashChunk(routes, 50);

  const totalCount = routes.length;
  let doneCount = 0;

  return (
    await Promise.all(
      routeChunks.map(async routeChunk => {
        // See https://ropewiki.com/Export and https://www.mediawiki.org/wiki/API:Export for more
        // information about this API
        const url = new URL('http://ropewiki.com/api.php');
        url.searchParams.append('format', 'json');
        url.searchParams.append('action', 'query');
        url.searchParams.append('export', 'true');
        url.searchParams.append('pageids', routeChunk.map(index => index.id).join('|'));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const xml: any = await new Promise(async (resolve, reject) =>
          XML2JS.parseString(
            JSON.parse(await cachedFetch(url)).query.export['*'],
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          ),
        );

        return await Promise.all(
          routeChunk.map(async index => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const text = xml.mediawiki.page.find((page: any) => page.id[0] === index.id).revision[0]
              .text[0]._;

            const route: RouteV2 = {
              ...index,
              description: await parseDescription(text).catch(error => {
                if (isObject(error) && 'isPandocTimeoutError' in error) {
                  logger.warn(`Pandoc timed out for "${index.name}"`);
                  return undefined;
                } else {
                  throw error;
                }
              }),
            };

            logger.progress(totalCount, ++doneCount, index.name);

            validate('RouteV2', route);

            return route;
          }),
        );
      }),
    )
  ).flat();
}
