import FS from 'fs';
import {toRouteV1} from './types/v1';
import {GeoJSONRouteV2, RouteV2, toGeoJSONRouteV2, toIndexRouteV2} from './types/v2';

export async function writeRoutes(routes: RouteV2[]) {
  await FS.promises.mkdir('./output/v2/details', {recursive: true});
  await FS.promises.mkdir('./output/v1', {recursive: true});

  const legacyStream = FS.createWriteStream('./output/v1/index.json');
  const indexStream = FS.createWriteStream('./output/v2/index.json');
  const geojsonStream = FS.createWriteStream('./output/v2/index.geojson');

  let first = true;

  legacyStream.write('[\n');

  for (const route of routes) {
    if (first) {
      first = false;
    } else {
      legacyStream.write(',\n');
    }

    await FS.promises.writeFile(
      `./output/v2/details/${route.id}.json`,
      JSON.stringify(route, null, 2),
    );

    indexStream.write(`${JSON.stringify(toIndexRouteV2(route))}\n`);

    const features: GeoJSONRouteV2[] = toGeoJSONRouteV2(route);
    features.forEach(feature => {
      geojsonStream.write(`${JSON.stringify(feature)}\n`);
    });

    legacyStream.write(JSON.stringify(toRouteV1(route)));
  }

  legacyStream.write(']');

  await Promise.all([
    new Promise(resolve => legacyStream.end(resolve)),
    new Promise(resolve => indexStream.end(resolve)),
    new Promise(resolve => geojsonStream.end(resolve)),
  ]);
}
