import {Route, RouteGeoJSONFeature, toIndexRoute} from '../Route';
import {validate} from './getValidator';

export function toGeoJSONFeatures(route: Route): RouteGeoJSONFeature[] {
  const features = (
    route.geojson?.features.map(feature => ({
      ...feature,
      properties: {
        ...Object.fromEntries(
          Object.entries(toIndexRoute(route)).map(([key, value]) => [`route.${key}`, value])
        ),
        ...feature.properties,
      },
    })) ??
    (route.longitude && route.latitude
      ? [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [route.longitude, route.latitude],
          },
          properties: {
            name: route.name,
            ...Object.fromEntries(
              Object.entries(route).map(([key, value]) => [`route.${key}`, value])
            ),
          } as unknown as RouteGeoJSONFeature['properties'],
        },
      ]
      : [])
  );

  features.forEach(feature => {
    validate('RouteGeoJSONFeature', feature)
  })

  return features as RouteGeoJSONFeature[]
}
