import {Feature, LineString} from '@turf/helpers';
import length from '@turf/length';
import assert from 'assert';
import {isNumber} from 'lodash';
import {getAscentDescentMeters} from './getAscentDescentMeters';
import {getCanyoniness} from './getCanyoniness';
import {getElevationMeters} from './getElevationMeters';

export async function parseLineString(feature: Feature<LineString>, cachePath: string) {
  const geometry: LineString = {
    type: 'LineString',
    coordinates: await Promise.all(
      feature.geometry.coordinates.map(async ([lon, lat]) => {
        assert(isNumber(lon) && isNumber(lat));
        return [
          lon,
          lat,
          await getElevationMeters([lon, lat], cachePath),
          await getCanyoniness([lon, lat], cachePath),
        ];
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
      ...getCanyoninessPercentiles(geometry, [0.1, 0.15, 0.2, 0.25, 0.5]),
      changeMeters: endElevationMeters - startElevationMeters,
    },
  };
}

function getCanyoninessPercentiles(geometry: LineString, percentiles: number[]) {
  const values = geometry.coordinates
    .map(([, , , canyoniness]) => canyoniness)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .sort((a, b) => a! - b!);

  console.log(values);

  return Object.fromEntries(
    percentiles.map(p => [`canyoninessP${p * 100}`, values[Math.floor(values.length * p)]]),
  );
}
