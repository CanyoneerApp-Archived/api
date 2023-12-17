import {Feature, FeatureCollection, LineString, Point} from '@turf/helpers';
import {RouteV2} from '../../../types/v2';
import {logger} from '../../../utils/logger';
import {flattenFeatureCollection} from './flattenFeatureCollection';
import {parseLineString} from './parseLineString';
import {parsePoint} from './parsePoint';

export async function parseKMLs(routes: RouteV2[]): Promise<RouteV2[]> {
  let doneCount = 0;
  for (const route of routes) {
    route.geojson = route.geojson && (await parseKMLsInner(route.geojson));
    logger.progress(routes.length, doneCount++, route.name);
  }
  return routes;
}

export async function parseKMLsInner(
  input: Feature | FeatureCollection,
): Promise<FeatureCollection> {
  const output = flattenFeatureCollection(input);

  return {
    type: 'FeatureCollection',
    features: await Promise.all(
      output.map(async feature => {
        if (feature.geometry.type === 'LineString') {
          return await parseLineString(feature as Feature<LineString>);
        } else if (feature.geometry.type === 'Point') {
          return await parsePoint(feature as Feature<Point>);
        } else {
          return feature;
        }
      }),
    ),
  };
}
