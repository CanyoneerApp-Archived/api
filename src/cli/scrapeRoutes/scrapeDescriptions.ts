import {isObject, chunk as lodashChunk} from 'lodash';
import XML2JS from 'xml2js';
import {RouteV2} from '../../types/v2';
import {validate} from '../../utils/getValidator';
import {logger} from '../../utils/logger';
import cachedFetch from './cachedFetch';
import {parseDescription} from './parseDescription';
import {md5} from './cachedFetch';
import Path from 'path';

/**
 * Take an array of `RouteV2`s, scrape their KMLs, and return a new array of routes with the
 * "description" property populated.
 */
export async function scrapeDescriptions(routes: RouteV2[], cachePath: string): Promise<RouteV2[]> {
  const routeChunks = lodashChunk(routes, 50);

  const totalCount = routes.length;
  let doneCount = 0;

  return (
    await Promise.all(
      routeChunks.map(async routeChunk => {
        // See https://ropewiki.com/Export and https://www.mediawiki.org/wiki/API:Export for more
        // information about this API
        // Example: http://ropewiki.com/api.php?format=json&action=query&export=true&pageids=68720
        const url = new URL('http://ropewiki.com/api.php');
        url.searchParams.append('format', 'json');
        url.searchParams.append('action', 'query');
        url.searchParams.append('export', 'true');
        url.searchParams.append('pageids', routeChunk.map(index => index.id).join('|'));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const xml: any = await new Promise(async (resolve, reject) => {
          let jsonResponse = await cachedFetch(url, 'utf-8', cachePath);
          if (typeof jsonResponse !== 'string') {
            logger.error(`Cached response is not string, its ${typeof jsonResponse}: \n${jsonResponse}`);
            resolve(undefined)
            return
          }
          if (jsonResponse.length < 1) {
            logger.error(`Fetch response was empty for: ${url}`);
            const path = Path.join(cachePath, `${md5(url.toString())}.txt`);
            logger.log(`Please repair file at ${path} manually and re-run`)
            resolve(undefined)
            return            
          }

          const parsed = JSON.parse(jsonResponse).query.export['*'];
          XML2JS.parseString(
            parsed,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          )
        }

        );

        return await Promise.all(
          routeChunk.map(async index => {
            if (!xml) {
              return xml
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const page = xml.mediawiki.page.find((page: any) => page.id[0] === String(index.id))
            const text = page.revision[0].text[0]._;

            const route: RouteV2 = {
              ...index,
              description: await parseDescription(text).catch(error => {
                if (isObject(error) && 'isPandocTimeoutError' in error) {
                  const result = text.slice(text.indexOf("Region"))
                  const region = result.split("|")[0].split("=")[1]
                  logger.warn(`Pandoc timed out for "${index.name}", re-run region "${region}" to debug.`);
                  logger.log(`If running the region alone succeeds, consider adjusting requestsPerSecond or timeoutMilliseconds in parseDescription`)
                  logger.log(`If running the region alone fails, it must be a pandoc issue`)
                  return undefined;
                } else {
                  throw error;
                }
              })
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
