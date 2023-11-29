import FS from 'fs';
import {toRouteV1} from './types/RouteV1';
import {GeoJSONRouteV2, RouteV2, toGeoJSONRouteV2, toIndexRouteV2} from './types/RouteV2';

export async function writeRoutes(routes: RouteV2[]) {
  await FS.promises.mkdir('./output/details', {recursive: true});

  const legacyStream = FS.createWriteStream('./output/index.v1.json');
  const indexStream = FS.createWriteStream('./output/index.v2.json');
  const geojsonStream = FS.createWriteStream('./output/index.v2.geojson');

  let first = true;

  legacyStream.write('[\n');

  for (const route of routes) {
    if (first) {
      first = false;
    } else {
      legacyStream.write(',\n');
    }

    await FS.promises.writeFile(
      `./output/details/${route.id}.v2.json`,
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
