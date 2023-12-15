import {Feature, FeatureCollection, Geometry, GeometryCollection} from '@turf/helpers';
import {omit} from 'lodash';
import {metersPerFoot} from '../utils/metersPerFoot';
import type {PermitV1} from './v1';
import {DifficultyV1, MonthV1, RouteV1} from './v1';

/**
 * This "stripped down" type is used in `index.json` and `tiles/{z}/{x}/{y}.pbf`. It is meant
 * to capture all data we need to filter routes while remaining as compact as possible.
 */
export interface IndexRouteV2 {
  /** @asType integer */
  id: number;
  name: string;
  quality: number | undefined;
  months: MonthV2[] | undefined;
  technicalRating: TechnicalGradeV2 | undefined;
  waterRating: WaterGradeV2 | undefined;
  timeRating: TimeGradeV2 | undefined;
  riskRating: RiskGradeV2 | undefined;
  permit: PermitV2 | undefined;
  /** @asType integer */
  rappelCountMin: number | undefined;
  /** @asType integer */
  rappelCountMax: number | undefined;
  rappelLongestMeters: number | undefined;
  vehicle: VehicleV2 | undefined;
  /**
   * If there is a required vehicle shuttle, the approximate duration of the drive.
   * If there is no shuttle required or if the shuttle is unknown, `undefined`.
   */
  shuttleSeconds: number | undefined;
  latitude: number;
  longitude: number;

  /**
   * This is the ETag of the details JSON file. If the ETag changes, clients know they should fetch
   * an updated version of the details JSON file.
   */
  etag: string;
}

/**
 * This "detailed" type is used in `details/{id}.json`. It is the source of truth for all data
 * we have on a particular route.
 */
export interface RouteV2 extends Omit<IndexRouteV2, 'etag'> {
  url: string;
  description: string | undefined;
  geojson: FeatureCollection | undefined;
}

type GeoJSONRouteV2CoreProperties = {
  [Key in keyof Omit<
    IndexRouteV2,
    'months' | 'latitude' | 'longitude' | 'etag'
  > as `route.${Key}`]: IndexRouteV2[Key];
} & {
    // Vector tiles cannot encode arrays so we break the months out into individual properties.
    [Key in MonthV2 as `route.month.${Lowercase<Key>}`]?: true;
  } & {
    sortKey: number,
  };

/**
 * A GeoJSON feature representing a route
 */
export type GeoJSONRouteV2 = Feature<
  Geometry | GeometryCollection,
  GeoJSONRouteV2CoreProperties &
  {
    type: 'parent' | 'child',
    hasChildren: true | undefined
  } &
  {[key: string]: unknown}
>;

export type TechnicalGradeV2 = 1 | 2 | 3 | 4;
export type WaterGradeV2 = 'A' | 'B' | 'C' | 'C1' | 'C2' | 'C3' | 'C4';
export type TimeGradeV2 = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type RiskGradeV2 = 'PG' | 'PG-13' | 'R' | 'X' | 'XX' | 'XXX';
export type VehicleV2 =
  | '4WD'
  | '4WD - High Clearance'
  | '4WD - Very High Clearance'
  | 'High Clearance'
  | 'Passenger';
export type PermitV2 = 'No' | 'Restricted' | 'Yes' | 'Closed';
export type MonthV2 =
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

export function toIndexRouteV2(route: RouteV2, etag: string): IndexRouteV2 {
  return omit({...route, etag}, ['description', 'geojson', 'url']);
}

function toGeoJSONRouteV2CoreProperties(
  route: IndexRouteV2 | RouteV2,
): GeoJSONRouteV2CoreProperties {
  return {
    'route.id': route.id,
    'route.name': route.name,
    'route.quality': route.quality,
    // TODO use route popularity
    'sortKey': route.quality == undefined ? 0 : -1 * route.quality,
    'route.technicalRating': route.technicalRating,
    'route.waterRating': route.waterRating,
    'route.timeRating': route.timeRating,
    'route.riskRating': route.riskRating,
    'route.permit': route.permit,
    'route.rappelCountMin': route.rappelCountMin,
    'route.rappelCountMax': route.rappelCountMax,
    'route.rappelLongestMeters': route.rappelLongestMeters,
    'route.vehicle': route.vehicle,
    'route.shuttleSeconds': route.shuttleSeconds,

    ...Object.fromEntries(
      route.months?.map(month => [`route.month.${month.toLowerCase()}`, true]) ?? [],
    ),
  };
}

export function toGeoJSONRouteV2(route: RouteV2): GeoJSONRouteV2[] {

  const children: GeoJSONRouteV2[] = route.geojson?.features.map(
    (feature): GeoJSONRouteV2 => ({
      ...feature,
      properties: {
        type: 'child',
        hasChildren: undefined,
        ...feature.properties,
        ...toGeoJSONRouteV2CoreProperties(route),
      },
    }),
  ) ?? []

  const self: GeoJSONRouteV2 | undefined = route.longitude && route.latitude ? {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [route.longitude, route.latitude],
    },
    properties: {
      type: 'parent',
      hasChildren: children.length > 0 ? true : undefined,
      name: route.name,
      ...toGeoJSONRouteV2CoreProperties(route),
    },
  } : undefined

  return [self, ...children].filter(Boolean) as GeoJSONRouteV2[]
}

export const permitV1toV2: {[key: string]: PermitV2} = {
  'No permit required': 'No',
  'Permit required': 'Yes',
  'Closed to entry': 'Closed',
  'Access is Restricted': 'Restricted',
};

export const permitV2toV1: {[key: string]: PermitV1} = {
  No: 'No permit required',
  Yes: 'Permit required',
  Closed: 'Closed to entry',
  Restricted: 'Access is Restricted',
};
export function toRouteV1(route: RouteV2): RouteV1 {
  return {
    URL: route.url,
    Name: route.name,
    Quality: route.quality,
    Popularity: undefined,
    Latitude: route.latitude,
    Longitude: route.longitude,
    Months: route.months?.map(month => monthsV2toV1[month]) ?? [],
    Difficulty:
      route.technicalRating &&
      ((route.technicalRating + (route.waterRating ?? '?')).toLowerCase() as DifficultyV1),
    AdditionalRisk: route.riskRating,
    Vehicle: route.vehicle,
    Shuttle: route.shuttleSeconds ? `${Math.round(route.shuttleSeconds / 60)} minutes` : undefined,
    Permits: permitV2toV1[route.permit ?? ''],
    Sports: ['canyoneering'],
    Time: route.timeRating,
    RappelCountMin: route.rappelCountMin,
    RappelCountMax: route.rappelCountMax,
    RappelLengthMax:
      route.rappelLongestMeters ? route.rappelLongestMeters / metersPerFoot : undefined,
    KMLURL: undefined,
    HTMLDescription: route.description,
    GeoJSON: route.geojson,
  };
}
const monthsV2toV1: {[key in MonthV2]: MonthV1} = {
  Jan: 'January',
  Feb: 'Feburary',
  Mar: 'March',
  Apr: 'April',
  May: 'May',
  Jun: 'June',
  Jul: 'July',
  Aug: 'August',
  Sep: 'September',
  Oct: 'October',
  Nov: 'November',
  Dec: 'December',
};
