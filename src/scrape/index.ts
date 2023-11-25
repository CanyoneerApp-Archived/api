import {scrapeDescriptions} from './scrapeDescriptions';
import {scrapeIndexRoutes} from './scrapeIndexRoutes';
import {scrapeKMLs} from './scrapeKMLs';
import {writeRoute, writeRouteEnd} from './writeRoute';

export async function inner(regions: string[]) {
  return await scrapeKMLs(await scrapeDescriptions(await scrapeIndexRoutes({regions})), {regions});
}

export async function scrape(regions: string[]) {
  const routes = await inner(regions);

  for (const route of routes) {
    writeRoute(route);
  }

  writeRouteEnd();
}