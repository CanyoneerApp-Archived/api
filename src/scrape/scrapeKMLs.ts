import {Route} from '../Route';
// @ts-ignore
import TJ from '@mapbox/togeojson';
import xmldom from '@xmldom/xmldom';
import {cloneDeep, keyBy} from 'lodash';
import {logger} from '../logger';
import cachedFetch from './cachedFetch';
import {validate} from './getValidator';

const limit = 100;

export async function scrapeKMLs(
  routes: Route[],
  {regions}: {regions: string[]},
): Promise<Route[]> {
  const lookup = keyBy(cloneDeep(routes), 'name');

  for (const region of regions) {
    let offset = 0;

    while (true) {
      // TODO build as URL object
      // TODO pull older KMLs too
      const url = `https://ropewiki.com/luca/rwr?gpx=off&kml=http://ropewiki.com/index.php/KMLList?offset=${offset}&limit=${limit}&action=raw&templates=expand&ctype=application/x-zope-edit&numname=on&group=link&query=%5B%5BCategory%3ACanyons%5D%5D%5B%5BLocated%20in%20region.Located%20in%20regions%3A%3AX%7C%7C${encodeURIComponent(
        region,
      )}%5D%5D&sort=Has_rank_rating%2C%20Has_name&order=descending%2C%20ascending&gpx=off&mapnum=&mapname=off&mapdata=&maploc=&maplinks=&allmap=&qname=${encodeURIComponent(
        region,
      )}&filename=${encodeURIComponent(region)}&ext=.kml`;

      const text = await cachedFetch(new URL(url));

      const document = new xmldom.DOMParser().parseFromString(text);
      const els = Array.from(document.getElementsByTagName('Document'));

      if (els.length === 1) break;

      for (const el of els) {
        const name = el.previousSibling?.previousSibling?.textContent?.trim();

        if (!name) continue;
        if (name === 'Ropewiki Map Export') continue;

        const route = lookup[name];

        if (!route) {
          // console.warn(chalk.yellow(chalk.bold(`No route found for ${name}`)))
          continue;
        }

        logger.verbose(`Got KML for ${name}`);
        route.geojson = TJ.kml(el, {styles: true});

        validate('Route', route);
      }

      offset += els.length;
    }
  }

  return Object.values(lookup);
}
