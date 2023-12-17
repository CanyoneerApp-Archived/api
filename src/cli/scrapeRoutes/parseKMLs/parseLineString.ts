import {Feature, LineString} from '@turf/helpers';
import length from '@turf/length';
import assert from 'assert';
import {isNumber, mean} from 'lodash';
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

  const curvatures = geometry.coordinates.map(([, , , curvature]) => curvature).sort();

  assert(isNumber(endElevationMeters) && isNumber(startElevationMeters));


  return {
    ...feature,
    geometry,
    properties: {
      ...feature.properties,
      lengthMeters: length(feature, {units: 'meters'}),
      ...getAscentDescentMeters(geometry),
      curvatureP01: curvatures[Math.floor(curvatures.length * 0.01)],
      curvatureP05: curvatures[Math.floor(curvatures.length * 0.05)],
      curvatureP10: curvatures[Math.floor(curvatures.length * 0.10)],
      curvatureP50: curvatures[Math.floor(curvatures.length * 0.5)],
      curvatureP90: curvatures[Math.floor(curvatures.length * 0.90)],
      curvatureP95: curvatures[Math.floor(curvatures.length * 0.95)],
      curvatureP99: curvatures[Math.floor(curvatures.length * 0.99)],
      curvatureMean: mean(curvatures),
      changeMeters: endElevationMeters - startElevationMeters,
    },
  };
}

