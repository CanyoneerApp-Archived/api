import {chunk as lodashChunk} from 'lodash';
import {parseString} from 'xml2js';
import {IndexRoute} from '../Route';

type IndexRouteWithDescription = IndexRoute & {description: string};

export async function scrapeDescriptions(
  routes: IndexRoute[],
): Promise<IndexRouteWithDescription[]> {
  const routeChunks = lodashChunk(routes, 50);

  return (
    await Promise.all(
      routeChunks.map(async routeChunk => {
        // TODO make this a URL
        // TODO find docs for this API
        // TODO there's actually a ton of metadata in here, do we even need the first pass over the index data?
        const url = `http://ropewiki.com/api.php?format=json&action=query&export=true&pageids=${routeChunk
          .map(index => index.id)
          .join('|')}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const xml: any = await new Promise(async (resolve, reject) =>
          parseString((await (await fetch(url)).json()).query.export['*'], (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }),
        );

        return routeChunk.map((index): IndexRouteWithDescription => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const text = xml.mediawiki.page.find((page: any) => page.id[0] === index.id).revision[0]
            .text[0]._;

          return {
            ...index,
            // TODO render this as HTML
            description: text.slice(text.indexOf('==Introduction==')),
          };
        });
      }),
    )
  ).flat();
}
