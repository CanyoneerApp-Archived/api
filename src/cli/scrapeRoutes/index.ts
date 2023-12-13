import {isArray} from 'lodash';
import {allRegions} from '../../utils/allRegions';
import {logger} from '../../utils/logger';
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
  return kmls;
}
