import {scrapeDescriptions} from './scrapeDescriptions';
import {scrapeIndices} from './scrapeIndices';
import {scrapeKMLs} from './scrapeKMLs';

export async function scrape(regions: string[]) {
  return await scrapeKMLs(await scrapeDescriptions(await scrapeIndices({regions})), {regions});
}
