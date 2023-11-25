import {chunk as lodashChunk} from 'lodash';
// @ts-ignore
import pandoc from 'node-pandoc';
import XML2JS from 'xml2js';
import {IndexRoute, Route} from '../Route';
import cachedFetch from './cachedFetch';
import {validate} from './getValidator';

export async function scrapeDescriptions(routes: IndexRoute[]): Promise<Route[]> {
  const routeChunks = lodashChunk(routes, 50);

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

        return await Promise.all(routeChunk.map(async index => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const text = xml.mediawiki.page.find((page: any) => page.id[0] === index.id).revision[0]
            .text[0]._;

          const route: Route = {
            ...index,
            description: await (new Promise((resolve, reject) => pandoc(text.slice(text.indexOf('==Introduction==')), '-f mediawiki -t html', (error: Error, result: string) => {
              if (error) reject(error)
              else resolve(result)
            }))),
            geojson: undefined,
          };

          validate('Route', route);

          return route;
        }));
      }),
    )
  ).flat();
}
