import {RouteV2} from '../../types/v2';
// @ts-ignore there are no type definitions for this module
import TJ from '@mapbox/togeojson';
import xmldom from '@xmldom/xmldom';
import {cloneDeep, keyBy} from 'lodash';
import {inspect} from 'util';
import {validate} from '../../utils/getValidator';
import {logger} from '../../utils/logger';
import cachedFetch from './cachedFetch';

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

  // We don't know exactly how many routes there are in each region or how many of those have KMLs.
  // This formula creates a worst case upper bound for the number of requests we'll need to make.
  const totalCount = Math.floor(routes.length / kmlCountPerRequest) + regions.length;

  let doneCount = 0;

  for (const region of regions) {
    let offset = 0;

    while (true) {
      const innerURL = new URL(`http://ropewiki.com/index.php/KMLList`);
      innerURL.searchParams.append('offset', offset.toString());
      innerURL.searchParams.append('limit', kmlCountPerRequest.toString());
      innerURL.searchParams.append('action', `raw`);
      innerURL.searchParams.append('templates', `expand`);
      innerURL.searchParams.append('ctype', `application/x-zope-edit`);
      innerURL.searchParams.append('numname', `on`);
      innerURL.searchParams.append('group', `link`);
      innerURL.searchParams.append(
        'query',
        `[[Category:Canyons]][[Located in region.Located in regions::X||${region}]]`,
      );
      innerURL.searchParams.append('sort', 'Has_rank_rating, Has_name');
      innerURL.searchParams.append('order', 'descending, ascending');
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

      // The "inner" URL is a MediaWiki query for a set of routes.
      // This "outer" URL is a proxy that fetches KMLs for those routes.
      // The API demands the "inner" URL not be encoded so we cannot use the URL class here.
      const outerURL = new URL(`https://ropewiki.com/luca/rwr?gpx=off&kml=${innerURL.toString()}`);

      let text = await cachedFetch(outerURL, 'utf-8');

      // Sometimes the document is missing a KML end tag. This hack seems to always fix it.
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

        const elements = Array.from(document.getElementsByTagName('Document'));

        if (elements.length === 1) break;

        for (const element of elements) {
          const routeName = element.previousSibling?.previousSibling?.textContent?.trim();

          if (!routeName) continue;
          if (routeName === 'Ropewiki Map Export') continue;

          const route = lookup[routeName];
          if (!route) {
            // Sometimes there are entire route descriptions embedded into `<name>` tags.
            // Truncate the text so that console isn't dominated by these warnings.
            const nameTruncated =
              routeName.split('\n')[0]?.slice(0, 64) + (routeName.length > 64 ? '...' : '');
            logger.warn(`Couldn't find route named "${nameTruncated}"`);
            continue;
          }

          route.geojson = await TJ.kml(element, {styles: true});
          validate('RouteV2', route);
        }
      } catch (error) {
        if (error instanceof DOMException) {
          logger.error(
            `Error parsing KML for "${region}" ${outerURL}\n\n${error}\n\n${inspect(
              internalErrors,
            )}`,
          );
          continue;
        }
      } finally {
        offset += kmlCountPerRequest;
        doneCount += 1;
        logger.progress(totalCount, doneCount, region);
      }
    }
  }

  return Object.values(lookup);
}
