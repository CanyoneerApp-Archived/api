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
  input: RouteV2[],
  {regions}: {regions: string[]},
): Promise<RouteV2[]> {
  const output = keyBy(cloneDeep(input), 'name');

  const totalCount = input.length;
  let doneCount = 0;

  for (const region of regions) {
    let offset = 0;

    while (true) {
      const innerURL = new URL(`http://ropewiki.com/index.php/KMLList`);
      innerURL.searchParams.append('offset', `${offset}`);
      innerURL.searchParams.append('limit', `${kmlCountPerRequest}`);
      innerURL.searchParams.append('action', `raw`);
      innerURL.searchParams.append('templates', `expand`);
      innerURL.searchParams.append('ctype', `application/x-zope-edit`);
      innerURL.searchParams.append('numname', `on`);
      innerURL.searchParams.append('group', `link`);
      innerURL.searchParams.append(
        'query',
        decodeURIComponent(
          `%5B%5BCategory%3ACanyons%5D%5D%5B%5BLocated%20in%20region.Located%20in%20regions%3A%3AX%7C%7C${region}%5D%5D`,
        ),
      );
      innerURL.searchParams.append('sort', decodeURIComponent(`Has_rank_rating%2C%20Has_name`));
      innerURL.searchParams.append('order', decodeURIComponent(`descending%2C%20ascending`));
      innerURL.searchParams.append('gpx', `off`);
      innerURL.searchParams.append('mapnum', ``);
      innerURL.searchParams.append('mapname', `off`);
      innerURL.searchParams.append('mapdata', ``);
      innerURL.searchParams.append('maploc', ``);
      innerURL.searchParams.append('maplinks', ``);
      innerURL.searchParams.append('allmap', ``);
      innerURL.searchParams.append('qname', region);
      innerURL.searchParams.append('filename', region);
      innerURL.searchParams.append('ext', `.kml`);

      const url = new URL('https://ropewiki.com/luca/rwr');
      url.searchParams.append('gpx', 'off');

      const outerURL = new URL(`${url.toString()}&kml=${innerURL.toString()}`);

      let text = await cachedFetch(outerURL);
      if (!text.trim().endsWith('</kml>')) {
        text += '</kml>';
      }

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

          const route = output[name];
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
        // eslint-disable-next-line no-warning-comments
        // TODO check error prototype
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

  return Object.values(output);
}
