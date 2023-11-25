import FS from 'fs';
import {toLegacyRoute} from '../LegacyRoute';
import {Route, RouteGeoJSONFeature, toIndexRoute} from '../Route';

const legacy = FS.createWriteStream('./output/legacy.json');
const index = FS.createWriteStream('./output/index.json');
const geojson = FS.createWriteStream('./output/index.geojson');
let first = true;

export function writeRouteEnd() {
  legacy.write(']');
}

export function writeRoute(route: Route) {
  if (first) {
    first = false;
    legacy.write('[\n');
  } else {
    legacy.write(',\n');
  }

  const features: RouteGeoJSONFeature[] = toGeoJSONFeatures(route);

  FS.writeFileSync(`./output/details/${route.id}.json`, JSON.stringify(route));
  index.write(`${JSON.stringify(toIndexRoute(route))}\n`);
  features.forEach(feature => {
    geojson.write(`${JSON.stringify(feature)}\n`);
  });
  legacy.write(JSON.stringify(toLegacyRoute(route)));
}

function toGeoJSONFeatures(route: Route): RouteGeoJSONFeature[] {
  return (
    route.geojson?.features.map(feature => ({
      ...feature,
      properties: {
        ...Object.fromEntries(
          Object.entries(toIndexRoute(route)).map(([key, value]) => [`route.${key}`, value]),
        ),
        ...feature.properties,
      },
    })) ??
    (route.longitude && route.latitude
      ? [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [route.longitude, route.latitude],
            },
            properties: {
              name: route.name,
              ...Object.fromEntries(
                Object.entries(route).map(([key, value]) => [`route.${key}`, value]),
              ),
            } as unknown as RouteGeoJSONFeature['properties'],
          },
        ]
      : [])
  );
}
