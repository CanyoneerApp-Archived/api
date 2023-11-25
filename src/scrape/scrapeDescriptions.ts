import {chunk as lodashChunk} from 'lodash';
import {parseString} from 'xml2js';
import {IndexRoute, Route} from '../Route';
import cachedFetch from './cachedFetch';
import {validate} from './getValidator';

export async function scrapeDescriptions(routes: IndexRoute[]): Promise<Route[]> {
  const routeChunks = lodashChunk(routes, 50);

  return (
    await Promise.all(
      routeChunks.map(async routeChunk => {
        // TODO find docs for this API
        // TODO there's actually a ton of metadata in here, do we even need the first pass over the index data?
        const url = new URL('http://ropewiki.com/api.php');
        url.searchParams.append('format', 'json');
        url.searchParams.append('action', 'query');
        url.searchParams.append('export', 'true');
        url.searchParams.append('pageids', routeChunk.map(index => index.id).join('|'));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const xml: any = await new Promise(async (resolve, reject) =>
          parseString(JSON.parse(await cachedFetch(url)).query.export['*'], (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }),
        );

        return routeChunk.map(index => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const text = xml.mediawiki.page.find((page: any) => page.id[0] === index.id).revision[0]
            .text[0]._;

          const route: Route = {
            ...index,
            // TODO render this as HTML
            description: text.slice(text.indexOf('==Introduction==')),
            geojson: undefined,
          };

          validate('Route', route);

          return route;
        });
      }),
    )
  ).flat();
}
