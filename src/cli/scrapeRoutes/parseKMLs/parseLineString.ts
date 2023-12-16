import {Feature, LineString} from '@turf/helpers';
import length from '@turf/length';
import assert from 'assert';
import {isNumber} from 'lodash';
import {getAscentDescentMeters} from './getAscentDescentMeters';
import {getCurvature} from './getCurvature';
import {getElevationMeters} from './getElevationMeters';

export async function parseLineString(feature: Feature<LineString>) {
  const geometry: LineString = {
    type: 'LineString',
    coordinates: await Promise.all(
      feature.geometry.coordinates.map(async ([lon, lat]) => {
        assert(isNumber(lon) && isNumber(lat));
        return [lon, lat, await getElevationMeters([lon, lat]), await getCurvature([lon, lat])];
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
      ...getCurvatureStats(geometry),
      changeMeters: endElevationMeters - startElevationMeters,
    },
  };
}

function getCurvatureStats(geometry: LineString) {
  const curvatures = geometry.coordinates.map(([, , , curvature]) => curvature).sort();

  return {
    curvaturesP05: curvatures[Math.floor(curvatures.length * 0.05)],
    curvaturesP50: curvatures[Math.floor(curvatures.length * 0.5)],
    curvaturesP95: curvatures[Math.floor(curvatures.length * 0.95)],
  };
}
