import {logger} from '../logger';
import {scrapeDescriptions} from './scrapeDescriptions';
import {scrapeIndices} from './scrapeIndices';
import {scrapeKMLs} from './scrapeKMLs';
import {writeRoute, writeRouteEnd} from './writeRoute';

export async function inner(regions: string[]) {
  const indices = await logger.step(scrapeIndices, [{regions}]);
  const descriptions = await logger.step(scrapeDescriptions, [indices]);
  const kmls = await logger.step(scrapeKMLs, [descriptions, {regions}]);
  return kmls;
}

export async function scrape(regions: string[]) {
  const routes = await inner(regions);

  for (const route of routes) {
    writeRoute(route);
  }

  writeRouteEnd();
}
