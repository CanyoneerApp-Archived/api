import {Feature, LineString} from '@turf/helpers';
import length from '@turf/length';
import assert from 'assert';
import {isNumber} from 'lodash';
import {getAscentDescentMeters} from './getAscentDescentMeters';
import {getElevationMeters} from './getElevationMeters';

export async function parseLineString(feature: Feature<LineString>) {
  const geometry: LineString = {
    type: 'LineString',
    coordinates: await Promise.all(
      feature.geometry.coordinates.map(async ([lon, lat]) => {
        assert(isNumber(lon) && isNumber(lat));
        return [lon, lat, await getElevationMeters([lon, lat])];
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
      lengthMeters: length(feature, {units: 'meters'}),
      ...getAscentDescentMeters(geometry),
      changeMeters: endElevationMeters - startElevationMeters,
    },
  };
}
