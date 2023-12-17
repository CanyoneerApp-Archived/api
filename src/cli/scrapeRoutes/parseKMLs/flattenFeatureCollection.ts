import {Feature, FeatureCollection} from '@turf/helpers';

export function flattenFeatureCollection(input: Feature | FeatureCollection): Feature[] {
  if (input.type === 'FeatureCollection') {
    return input.features.flatMap(flattenFeatureCollection);
  } else {
    return [input];
  }
}
