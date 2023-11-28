import {logger} from '../logger';
import {scrapeDescriptions} from './scrapeDescriptions';
import {scrapeIndices} from './scrapeIndices';
import {scrapeKMLs} from './scrapeKMLs';
import {writeRoute, writeRouteEnd} from './writeRoute';

export async function inner(regions: string[]) {
  const indices = await logger.step('scrapeIndices', scrapeIndices({regions}));
  const descriptions = await logger.step('scrapeDescriptions', scrapeDescriptions(indices));
  const kmls = await logger.step('scrapeKMLs', scrapeKMLs(descriptions, {regions}));
  return kmls;
}

export async function scrape(regions: string[]) {
  const routes = await inner(regions);
  for (const route of routes) {
    await writeRoute(route);
  }
  await writeRouteEnd();
}
