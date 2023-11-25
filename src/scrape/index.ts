import FS from 'fs';
import {scrapeDescriptions} from './scrapeDescriptions';
import {scrapeIndexRoutes} from './scrapeIndexRoutes';
import {writeRoute, writeRouteEnd} from './writeRoute';

export async function scrape(regions: string[]) {
  await FS.promises.mkdir('./cache', {recursive: true});
  await FS.promises.mkdir('./output/details', {recursive: true});

  const routes = await scrapeIndexRoutes({regions});
  const routes1 = await scrapeDescriptions(routes);

  for (const route of routes1) {
    writeRoute({...route, geojson: undefined});
  }

  writeRouteEnd();
}
