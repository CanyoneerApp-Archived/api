import {Feature, LineString} from '@turf/helpers';
import length from '@turf/length';
import assert from 'assert';
import {isNumber} from 'lodash';
import {colors} from '../../../colors';
import {getAscentDescentMeters} from './getAscentDescentMeters';
import {getElevationMeters} from './getElevationMeters';
import {normalizeColor} from './normalizeColor';

export async function parseLineString(feature: Feature<LineString>, cachePath: string) {
  const geometry: LineString = {
    type: 'LineString',
    coordinates: await Promise.all(
      feature.geometry.coordinates.map(async ([lon, lat]) => {
        assert(isNumber(lon) && isNumber(lat));
        return [lon, lat, await getElevationMeters([lon, lat], cachePath)];
      }),
    ),
  };

  const endElevationMeters = geometry.coordinates[geometry.coordinates.length - 1]?.[2];
  const startElevationMeters = geometry.coordinates[0]?.[2];

  assert(isNumber(endElevationMeters) && isNumber(startElevationMeters));

  return {
    ...feature,
    geometry,
    properties: {
      ...feature.properties,
      stroke: feature.properties?.stroke ? normalizeColor(feature.properties?.stroke) : colors.red,
      lengthMeters: length(feature, {units: 'meters'}),
      ...getAscentDescentMeters(geometry),
      changeMeters: endElevationMeters - startElevationMeters,
    },
  };
}
