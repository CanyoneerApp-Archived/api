import {Feature, Point} from '@turf/helpers';
import {getElevationMeters} from './getElevationMeters';

export async function parsePoint(feature: Feature<Point>) {
  return {
    ...feature,
    properties: {
      ...feature.properties,
      elevationMeters: Math.round(await getElevationMeters(feature.geometry.coordinates)),
    },
  };
}
