import {logger} from '../../utils/logger';
import {scrapeDescriptions} from './scrapeDescriptions';
import {scrapeIndices} from './scrapeIndices';
import {scrapeKMLs} from './scrapeKMLs';

export async function scrape(regions: string[]) {
  const indices = await logger.step(scrapeIndices, [{regions}]);
  const descriptions = await logger.step(scrapeDescriptions, [indices]);
  const kmls = await logger.step(scrapeKMLs, [descriptions, {regions}]);
  return kmls;
}
