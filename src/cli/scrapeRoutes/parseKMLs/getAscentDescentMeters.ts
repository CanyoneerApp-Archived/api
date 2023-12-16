import {LineString} from '@turf/helpers';
import assert from 'assert';
import {isNumber} from 'lodash';

export function getAscentDescentMeters(geometry: LineString) {
  let ascentMeters = 0;
  let descentMeters = 0;

  for (let i = 0; i < geometry.coordinates.length - 1; i++) {
    const [, , elevation1] = geometry.coordinates[i] as number[];
    const [, , elevation2] = geometry.coordinates[i + 1] as number[];

    assert(isNumber(elevation1) && isNumber(elevation2));

    ascentMeters += Math.max(0, elevation2 - elevation1);
    descentMeters += Math.max(0, elevation1 - elevation2);
  }

  return {
    ascentMeters,
    descentMeters,
  };
}
