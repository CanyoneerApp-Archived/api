import {Feature, FeatureCollection, Geometry, GeometryCollection} from '@turf/helpers';
import {omit} from 'lodash';
import {validate} from './scrape/getValidator';

/**
 * This "stripped down" type will be used in `index.json` and `tiles/{z}/{x}/{y}.pbf`. It is meant
 * to capture all data we need to filter routes while remaining as compact as possible.
 */
export interface IndexRoute {
  id: string;
  name: string;
  quality: number;
  months: Month[];
  technicalRating: TechnicalGrade | undefined;
  waterRating: WaterGrade | undefined;
  timeRating: TimeGrade | undefined;
  riskRating: AdditionalRisk | undefined;
  permits: Permit | undefined;
  rappelCountMin: number | undefined;
  rappelCountMax: number | undefined;
  /**
   * Feet
   */
  rappelLongestFeet: number | undefined;
  vehicle: Vehicle | undefined;
  /**
   * Minutes
   */
  shuttleMinutes: number | undefined;

  url: string;
  latitude: number;
  longitude: number;
}

/**
 * This "detailed" type will be used in `details/{id}.json`. It is the source of truth for all data
 * we have on a particular route.
 */
export interface Route extends IndexRoute {
  description: string;
  geojson: FeatureCollection | undefined;
}

/**
 * A GeoJSON feature representing a route
 */
export type GeoJSONRoute = Feature<
  Geometry | GeometryCollection,
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;

    // This mapped type pulls in all properties from IndexRoute and prepends them with `route.`
    // e.g. 'route.id', 'route.name', 'route.stars'
    // Including these properties makes filtering directly on the main map possible.
  } & {[Key in keyof IndexRoute as `route.${Key}`]: IndexRoute[Key]}
>;

export type TechnicalGrade = 1 | 2 | 3 | 4;
export type WaterGrade = 'a' | 'b' | 'c' | 'c1' | 'c2' | 'c3' | 'c4';
export type TimeGrade = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type AdditionalRisk = 'PG-13' | 'PG' | 'XXX' | 'XX' | 'X' | 'R';
export type Vehicle = string;
export type Permit = 'Closed' | 'No' | 'Restricted' | 'Yes';
export type Month =
  | 'Jan'
  | 'Feb'
  | 'Mar'
  | 'Apr'
  | 'May'
  | 'Jun'
  | 'Jul'
  | 'Aug'
  | 'Sep'
  | 'Oct'
  | 'Nov'
  | 'Dec';

export function toIndexRoute(route: Route): IndexRoute {
  return omit(route, ['description', 'geojson']);
}

export function toGeoJSONFeatures(route: Route): GeoJSONRoute[] {
  const features =
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
      : []);

  features.forEach(feature => {
    validate('GeoJSONRoute', feature);
  });

  return features as GeoJSONRoute[];
}
