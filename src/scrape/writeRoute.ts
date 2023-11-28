import FS from 'fs';
import {once} from 'lodash';
import {toRouteV1} from '../types/RouteV1';
import {GeoJSONRouteV2, RouteV2, toGeoJSONRouteV2, toIndexRouteV2} from '../types/RouteV2';

const inner = once(() => ({
  legacyStream: FS.createWriteStream('./output/legacy.json'),
  indexStream: FS.createWriteStream('./output/index.json'),
  geojsonStream: FS.createWriteStream('./output/index.geojson'),
}));

let first = true;

export function writeRouteEnd() {
  const {legacyStream, indexStream, geojsonStream} = inner();
  legacyStream.write(']');

  legacyStream.close();
  indexStream.close();
  geojsonStream.close();
}

export async function writeRoute(route: RouteV2) {
  const {legacyStream: legacy, indexStream: index, geojsonStream: geojson} = inner();

  if (first) {
    first = false;
    legacy.write('[\n');
  } else {
    legacy.write(',\n');
  }

  const features: GeoJSONRouteV2[] = toGeoJSONRouteV2(route);

  await FS.promises.mkdir('./output/details', {recursive: true});
  await FS.promises.writeFile(`./output/details/${route.id}.json`, JSON.stringify(route, null, 2));
  index.write(`${JSON.stringify(toIndexRouteV2(route))}\n`);
  features.forEach(feature => {
    geojson.write(`${JSON.stringify(feature)}\n`);
  });
  legacy.write(JSON.stringify(toRouteV1(route)));
}
