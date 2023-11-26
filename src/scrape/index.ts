import FS from 'fs';
import {toRouteV1} from '../types/RouteV1';
import {
  GeoJSONRouteV2,
  toGeoJSONRouteV2 as toGeoJSONRouteV2s,
  toIndexRouteV2,
} from '../types/RouteV2';
import cachedFetch from './cachedFetch';
import {scrapeRouteV2} from './scrapeRoute';

export async function scrape() {
  await FS.promises.mkdir('./cache', {recursive: true});
  await FS.promises.mkdir('./output/details', {recursive: true});

  const legacyStream = FS.createWriteStream('./output/legacy.json');
  const indexStream = FS.createWriteStream('./output/index.json');
  const geojsonStream = FS.createWriteStream('./output/index.geojson');

  let first = true;
  legacyStream.write('[\n');

  await Promise.all(
    (await getRouteV2URLs()).map(async url => {
      const route = await scrapeRouteV2(url);
      if (!route) {
        return;
      } else if (first) {
        first = false;
      } else {
        legacyStream.write(',\n');
      }

      const geojson: GeoJSONRouteV2[] = toGeoJSONRouteV2s(route);

      FS.writeFileSync(`./output/details/${route.id}.json`, JSON.stringify(route, null, '  '));
      indexStream.write(`${JSON.stringify(toIndexRouteV2(route))}\n`);
      geojson.forEach(feature => {
        geojsonStream.write(`${JSON.stringify(feature)}\n`);
      });
      legacyStream.write(JSON.stringify(toRouteV1(route)));
    }),
  );
  legacyStream.write(']');
}

export async function getRouteV2URLs(): Promise<Array<string>> {
  const url =
    'http://ropewiki.com/api.php?action=ask&format=json&query=%5B%5BCategory%3ACanyons%5D%5D%5B%5BHas+coordinates%3A%3A%2B%5D%5D%5B%5BCategory%3ACanyons%5D%5D%0A++%0A++%5B%5BHas+star+rating%3A%3A%210%5D%5D%5B%5BHas+star+rating%3A%3A%211%5D%5D%5B%5BHas+latitude%3A%3A%3E30.412022222222%5D%5D%5B%5BHas+longitude%3A%3A%3E-128.08301666667%5D%5D%5B%5BHas+latitude%3A%3A%3C44.8852%5D%5D%5B%5BHas+longitude%3A%3A%3C-108.54692%5D%5D%7Corder%3Ddescending%2C+ascending%7Csort%3DHas_rank_rating%2C+Has_name|%3FHas_coordinates|%3FHas_star_rating|%3FHas_summary|%3FHas_banner_image_file|%3FHas_location_class|%3FHas_KML_file|limit=2000|offset=0';
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const response = JSON.parse((await cachedFetch(url))!);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.values(response.query.results).map((result: any) => result.fullurl);
}
