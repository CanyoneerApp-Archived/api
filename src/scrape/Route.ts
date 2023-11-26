import {Feature, LineString, Point} from '@turf/helpers';
import {omit} from 'lodash';

/**
 * This "stripped down" type will be used in `index.json` and `tiles/{z}/{x}/{y}.pbf`. It is meant
 * to capture all data we need to filter routes while remaining as compact as possible.
 */
export interface IndexRoute {
  id: string;
  name: string;
  quality: number;
  months: Month[];
  technicalGrade: TechnicalGrade | undefined;
  waterGrade: WaterGrade | undefined;
  timeGrade: TimeGrade | undefined;
  additionalRisk: AdditionalRisk | undefined;
  permits: Permit | undefined;
  rappelCountMin: number | undefined;
  rappelCountMax: number | undefined;
  rappelLengthMax: number | undefined;
  vehicle: Vehicle | undefined;
  shuttle: Shuttle | undefined;
}

/**
 * This "detailed" type will be used in `details/{id}.json`. It is the source of truth for all data
 * we have on a particular route.
 */
export interface Route extends IndexRoute {
  description: string;
  geojson: {type: 'FeatureCollection'; features: GeoJSONRoute[]} | undefined;
  url: string;
  latitude: number;
  longitude: number;
}

/**
 * A GeoJSON feature representing a route
 */
export type GeoJSONRoute = Feature<
  LineString | Point,
  {
    [key: string]: unknown;

    // This mapped type pulls in all properties from IndexRoute and prepends them with `route.`
    // e.g. 'route.id', 'route.name', 'route.stars'
    // Including these properties makes filtering directly on the main map possible.
  } & {[Key in keyof IndexRoute as `route.${Key}`]: IndexRoute[Key]}
>;

export type TechnicalGrade = 1 | 2 | 3 | 4;
export type WaterGrade = 'a' | 'b' | 'c';
export type TimeGrade = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type AdditionalRisk = 'PG-13' | 'PG' | 'XXX' | 'XX' | 'X' | 'R';
export type Vehicle = string;
export type Shuttle = string;
export type Permit = 'Closed' | 'No' | 'Restricted' | 'Yes';
export type Month =
  | 'January'
  | 'Feburary'
  | 'March'
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December';

export function toIndexRoute(route: Route): IndexRoute {
  return omit(route, ['description', 'geojson', 'url', 'latitude', 'longitude']);
}

export function toGeoJSONRoute(route: Route): GeoJSONRoute[] {
  return (
    route.geojson?.features.map(feature => ({
      ...feature,
      properties: {
        ...Object.fromEntries(
          Object.entries(toIndexRoute(route)).map(([key, value]) => [`route.${key}`, value]),
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
                Object.entries(route).map(([key, value]) => [`route.${key}`, value]),
              ),
            } as unknown as GeoJSONRoute['properties'],
          },
        ]
      : [])
  );
}
