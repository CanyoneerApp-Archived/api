import {RouteV2} from '../types/RouteV2';
// @ts-ignore
import TJ from '@mapbox/togeojson';
import xmldom from '@xmldom/xmldom';
import {cloneDeep, keyBy} from 'lodash';
import {inspect} from 'util';
import {logger} from '../logger';
import cachedFetch from './cachedFetch';
import {validate} from './getValidator';

/**
 * The maximum number of KMLs to load per batched request.
 * A larger number results in fewer requests but each request is slower and more expensive.
 */
const kmlCountPerRequest = 10;

/**
 * Take an array of `RouteV2`s and a list of their RopeWiki regions, scrape their KMLs,
 * and return a new array of routes with the "geojson" property populated.
 */
export async function scrapeKMLs(
  routes: RouteV2[],
  {regions}: {regions: string[]},
): Promise<RouteV2[]> {
  const lookup = keyBy(cloneDeep(routes), 'name');

  const totalCount = routes.length;
  let doneCount = 0;

  for (const region of regions) {
    let offset = 0;

    while (true) {
      const url1 = new URL(`http://ropewiki.com/index.php/KMLList`);
      url1.searchParams.append('offset', `${offset}`);
      url1.searchParams.append('limit', `${kmlCountPerRequest}`);
      url1.searchParams.append('action', `raw`);
      url1.searchParams.append('templates', `expand`);
      url1.searchParams.append('ctype', `application/x-zope-edit`);
      url1.searchParams.append('numname', `on`);
      url1.searchParams.append('group', `link`);
      url1.searchParams.append(
        'query',
        decodeURIComponent(
          `%5B%5BCategory%3ACanyons%5D%5D%5B%5BLocated%20in%20region.Located%20in%20regions%3A%3AX%7C%7C${region}%5D%5D`,
        ),
      );
      url1.searchParams.append('sort', decodeURIComponent(`Has_rank_rating%2C%20Has_name`));
      url1.searchParams.append('order', decodeURIComponent(`descending%2C%20ascending`));
      url1.searchParams.append('gpx', `off`);
      url1.searchParams.append('mapnum', ``);
      url1.searchParams.append('mapname', `off`);
      url1.searchParams.append('mapdata', ``);
      url1.searchParams.append('maploc', ``);
      url1.searchParams.append('maplinks', ``);
      url1.searchParams.append('allmap', ``);
      url1.searchParams.append('qname', region);
      url1.searchParams.append('filename', region);
      url1.searchParams.append('ext', `.kml`);

      const url = new URL('https://ropewiki.com/luca/rwr');
      url.searchParams.append('gpx', 'off');

      const text = await cachedFetch(new URL(`${url.toString()}&kml=${url1.toString()}`));

      let document: Document;
      const internalErrors: string[] = [];
      try {
        document = new xmldom.DOMParser({
          locator: {},
          errorHandler: {
            warning: function (e) {
              internalErrors.push(e);
            },
            error: function (e) {
              internalErrors.push(e);
            },
            fatalError: function (e) {
              internalErrors.push(e);
            },
          },
        }).parseFromString(text);

        const els = Array.from(document.getElementsByTagName('Document'));

        if (els.length === 1) break;

        for (const el of els) {
          const name = el.previousSibling?.previousSibling?.textContent?.trim();

          if (!name) continue;
          if (name === 'Ropewiki Map Export') continue;

          const route = lookup[name];
          if (!route) {
            const nameTruncated =
              name.split('\n')[0].slice(0, 64) + (name.length > 64 ? '...' : '');
            logger.warn(`Couldn't find route named "${nameTruncated}"`);
            continue;
          }

          route.geojson = TJ.kml(el, {styles: true});
          validate('RouteV2', route);
        }
      } catch (error) {
        if (error instanceof DOMException) {
          logger.error(
            `Error parsing KML for "${region}" ${url}\n\n${error}\n\n${inspect(internalErrors)}`,
          );
          continue;
        }
      } finally {
        offset += kmlCountPerRequest;
        doneCount += kmlCountPerRequest;
        logger.progress(totalCount, doneCount, region);
      }
    }
  }

  return Object.values(lookup);
}
