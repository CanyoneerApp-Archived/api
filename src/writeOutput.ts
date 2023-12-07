import FS from 'fs';
import {toRouteV1} from './types/v1';
import {GeoJSONRouteV2, RouteV2, toGeoJSONRouteV2, toIndexRouteV2} from './types/v2';

export async function writeOutput(routes: RouteV2[]) {
  await FS.promises.mkdir('./output/v2/details', {recursive: true});
  await FS.promises.mkdir('./output/v1', {recursive: true});

  const indexV1Schema = FS.createWriteStream('./output/v1/index.json');
  const indexV2Stream = FS.createWriteStream('./output/v2/index.json');
  const geojsonV2Stream = FS.createWriteStream('./output/v2/index.geojson');

  let first = true;

  indexV1Schema.write('[\n');

  for (const route of routes) {
    if (first) {
      first = false;
    } else {
      indexV1Schema.write(',\n');
    }

    const detailBody = JSON.stringify(route, null, 2);
    await FS.promises.writeFile(`./output/v2/details/${route.id}.json`, detailBody);

    indexV2Stream.write(`${JSON.stringify(toIndexRouteV2(route))}\n`);

    const features: GeoJSONRouteV2[] = toGeoJSONRouteV2(route);
    features.forEach(feature => {
      geojsonV2Stream.write(`${JSON.stringify(feature)}\n`);
    });

    indexV1Schema.write(JSON.stringify(toRouteV1(route)));
  }

  indexV1Schema.write(']');

  await Promise.all([
    new Promise(resolve => indexV1Schema.end(resolve)),
    new Promise(resolve => indexV2Stream.end(resolve)),
    new Promise(resolve => geojsonV2Stream.end(resolve)),
  ]);
}
