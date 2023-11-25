import FS from 'fs';
import {once} from 'lodash';
import {toLegacyRoute} from '../LegacyRoute';
import {Route, RouteGeoJSONFeature, toIndexRoute} from '../Route';
import {toGeoJSONFeatures} from './toGeoJSONFeatures';

const inner = once(() => ({
  legacy: FS.createWriteStream('./output/legacy.json'),
  index: FS.createWriteStream('./output/index.json'),
  geojson: FS.createWriteStream('./output/index.geojson'),
}));

let first = true;

export function writeRouteEnd() {
  const {legacy} = inner();
  legacy.write(']');
}

export function writeRoute(route: Route) {
  const {legacy, index, geojson} = inner();

  if (first) {
    first = false;
    legacy.write('[\n');
  } else {
    legacy.write(',\n');
  }

  const features: RouteGeoJSONFeature[] = toGeoJSONFeatures(route);

  FS.writeFileSync(`./output/details/${route.id}.json`, JSON.stringify(route, null, 2));
  index.write(`${JSON.stringify(toIndexRoute(route))}\n`);
  features.forEach(feature => {
    geojson.write(`${JSON.stringify(feature)}\n`);
  });
  legacy.write(JSON.stringify(toLegacyRoute(route)));
}
