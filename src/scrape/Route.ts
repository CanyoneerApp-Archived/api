import {Feature, LineString, Point} from '@turf/helpers';
import {omit} from 'lodash';

/*
 * We will produce the following output products:
 *  1. `index.json` - a list of all routes with stripped down data
 *  2. `details/{id}.json` - detailed data for a single route with geometries
 *  3. `tiles/{z}/{x}/{y}.pbf` - vector tiles of all geometries with stripped down data
 *  4. `schema/{type}.json` - JSON schemas for each type in this file
 *  4. `legacy.json` - previous schema for backwards compatibility
 */

/**
 * This "stripped down" type will be used in `index.json` and `tiles/{z}/{x}/{y}.pbf`. It is meant
 * to capture all data we need to filter routes while remaining as compact as possible.
 */
export interface RouteIndex {
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
export interface Route extends RouteIndex {
  description: string;
  geojson: {type: 'FeatureCollection'; features: RouteGeoJSONFeature[]} | undefined;
  url: string;
  latitude: number;
  longitude: number;
}

/**
 * A GeoJSON feature representing a route
 */
export type RouteGeoJSONFeature = Feature<
  LineString | Point,
  {
    [key: string]: unknown;

    // This mapped type pulls in all properties from RouteIndex and prepends them with `route.`
    // e.g. 'route.id', 'route.name', 'route.stars'
    // Including these properties makes filtering directly on the main map possible.
  } & {[Key in keyof RouteIndex as `route.${Key}`]: RouteIndex[Key]}
>;

export type TechnicalGrade = 1 | 2 | 3 | 4;
export type WaterGrade = 'a' | 'b' | 'c';
export type TimeGrade = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type AdditionalRisk = 'PG-13' | 'PG' | 'XXX' | 'XX' | 'X' | 'R';
export type Vehicle = string;
export type Shuttle = string;
export type Permit = string;
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

export function toRouteIndex(route: Route): RouteIndex {
  return omit(route, ['description', 'geojson', 'url', 'latitude', 'longitude']);
}
