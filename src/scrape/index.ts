import {scrapeDescriptions} from './scrapeDescriptions';
import {scrapeIndexRoutes} from './scrapeIndexRoutes';
import {scrapeKMLs} from './scrapeKMLs';
import {writeRoute, writeRouteEnd} from './writeRoute';

export async function scrape(regions: string[]) {
  const routes = await scrapeIndexRoutes({regions});
  const routes1 = await scrapeDescriptions(routes);
  const routes2 = await scrapeKMLs(routes1, {regions});

  for (const route of routes2) {
    writeRoute(route);
  }

  writeRouteEnd();
}
