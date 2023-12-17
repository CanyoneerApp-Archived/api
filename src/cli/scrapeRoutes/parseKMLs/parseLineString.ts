import {Feature, LineString} from '@turf/helpers';
import length from '@turf/length';
import assert from 'assert';
import {isNumber} from 'lodash';
import {getAscentDescentMeters} from './getAscentDescentMeters';
import {getCanyoniness} from './getCanyoniness';
import {getElevationMeters} from './getElevationMeters';

export async function parseLineString(feature: Feature<LineString>) {
  const geometry: LineString = {
    type: 'LineString',
    coordinates: await Promise.all(
      feature.geometry.coordinates.map(async ([lon, lat]) => {
        assert(isNumber(lon) && isNumber(lat));
        return [lon, lat, await getElevationMeters([lon, lat]), await getCanyoniness([lon, lat])];
      }),
    ),
  };

  const endElevationMeters = geometry.coordinates[geometry.coordinates.length - 1]?.[2];
  const startElevationMeters = geometry.coordinates[0]?.[2];

  const canyoninessAll = geometry.coordinates.map(([, , , curvature]) => curvature).sort();

  assert(isNumber(endElevationMeters) && isNumber(startElevationMeters));

  return {
    ...feature,
    geometry,
    properties: {
      ...feature.properties,
      lengthMeters: length(feature, {units: 'meters'}),
      ...getAscentDescentMeters(geometry),
      canyoninessP20: canyoninessAll[Math.floor(canyoninessAll.length * 0.2)],
      canyoninessP15: canyoninessAll[Math.floor(canyoninessAll.length * 0.15)],
      canyoninessP10: canyoninessAll[Math.floor(canyoninessAll.length * 0.1)],
      changeMeters: endElevationMeters - startElevationMeters,
    },
  };
}
