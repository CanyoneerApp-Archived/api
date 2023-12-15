import {isArray} from 'lodash';
import {RouteV2} from '../../types/v2';
import {allRegions} from '../../utils/allRegions';
import {logger} from '../../utils/logger';
import {parseKMLs as parseKMLsInner} from './parseKMLs';
import {scrapeDescriptions} from './scrapeDescriptions';
import {scrapeIndices} from './scrapeIndices';
import {scrapeKMLs} from './scrapeKMLs';

export async function scrapeRoutes(regions: string | string[]) {
  regions =
    isArray(regions) ? regions
      : regions === 'all' ? allRegions
        : [regions];

  const indices = await logger.step(scrapeIndices, [{regions}]);
  const descriptions = await logger.step(scrapeDescriptions, [indices]);
  const kmls = await logger.step(scrapeKMLs, [descriptions, {regions}]);
  const kml1s = await logger.step(parseKMLs, [kmls]);
  return kml1s
}

function parseKMLs(routes: RouteV2[]): Promise<RouteV2[]> {
  return Promise.all(
    routes.map(async route => ({
      ...route,
      geojson: route.geojson && (await parseKMLsInner(route.geojson)),
    })),
  );
}
