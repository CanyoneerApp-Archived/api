import {Feature, LineString, Point} from '@turf/helpers';
import {omit} from 'lodash';
import type {PermitV1} from './RouteV1';

/**
 * This "stripped down" type is used in `index.json` and `tiles/{z}/{x}/{y}.pbf`. It is meant
 * to capture all data we need to filter routes while remaining as compact as possible.
 */
export interface IndexRouteV2 {
  id: string;
  name: string;
  quality: number | undefined;
  months: MonthV2[];
  technicalGrade: TechnicalGradeV2 | undefined;
  waterGrade: WaterGradeV2 | undefined;
  timeGrade: TimeGradeV2 | undefined;
  additionalRisk: AdditionalRiskV2 | undefined;
  permits: PermitV2 | undefined;
  rappelCountMin: number | undefined;
  rappelCountMax: number | undefined;
  rappelLengthMax: number | undefined;
  vehicle: VehicleV2 | undefined;
  shuttle: ShuttleV2 | undefined;
}

/**
 * This "detailed" type is used in `details/{id}.json`. It is the source of truth for all data
 * we have on a particular route.
 */
export interface RouteV2 extends IndexRouteV2 {
  description: string;
  geojson: {type: 'FeatureCollection'; features: GeoJSONRouteV2[]} | undefined;
  url: string;
  latitude: number;
  longitude: number;
}

/**
 * A GeoJSON feature representing a route
 */
export type GeoJSONRouteV2 = Feature<
  LineString | Point,
  {
    [key: string]: unknown;

    // This mapped type pulls in all properties from IndexRouteV2 and prepends them with `route.`
    // e.g. 'route.id', 'route.name', 'route.stars'
    // Including these properties makes filtering directly on the main map possible.
  } & {[Key in keyof IndexRouteV2 as `route.${Key}`]: IndexRouteV2[Key]}
>;

export type TechnicalGradeV2 = 1 | 2 | 3 | 4;
export type WaterGradeV2 = 'A' | 'B' | 'C' | 'C1' | 'C2' | 'C3' | 'C4';
export type TimeGradeV2 = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type AdditionalRiskV2 = 'PG' | 'PG-13' | 'R' | 'X' | 'XX' | 'XXX';
export type VehicleV2 = string;
export type ShuttleV2 = string;
export type PermitV2 = 'No' | 'Restricted' | 'Yes' | 'Closed';
export type MonthV2 =
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

export function toIndexRouteV2(route: RouteV2): IndexRouteV2 {
  return omit(route, ['description', 'geojson', 'latitude', 'longitude', 'url']);
}

export function toGeoJSONRouteV2(route: RouteV2): GeoJSONRouteV2[] {
  return (
    route.geojson?.features.map(feature => ({
      ...feature,
      properties: {
        ...Object.fromEntries(
          Object.entries(toIndexRouteV2(route)).map(([key, value]) => [`route.${key}`, value]),
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
            } as unknown as GeoJSONRouteV2['properties'],
          },
        ]
      : [])
  );
}

export const permit1to2: {[key: string]: PermitV2} = {
  'No permit required': 'No',
  'Permit required': 'Yes',
  'Closed to entry': 'Closed',
  'Access is Restricted': 'Restricted',
};

export const permit2to1: {[key: string]: PermitV1} = {
  No: 'No permit required',
  Yes: 'Permit required',
  Closed: 'Closed to entry',
  Restricted: 'Access is Restricted',
};
