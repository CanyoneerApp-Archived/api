import {Feature, FeatureCollection, LineString, Point} from '@turf/helpers';

// Avoid using types from RouteV2 in the V1 schema to prevent breaking changes from being propagated
import {RouteV2, permit2to1} from './RouteV2';

export interface RouteV1 {
  URL: string;
  Name: string;
  Quality: number | undefined;
  Popularity: number | undefined;
  Latitude: number;
  Longitude: number;
  Months: MonthsV1[];
  Difficulty: DifficultyV1 | undefined;
  AdditionalRisk: 'PG' | 'PG-13' | 'R' | 'X' | 'XX' | 'XXX' | undefined;
  Vehicle: string | undefined;
  Shuttle: string | undefined;
  Permits: PermitV1 | undefined;
  Sports: SportV1[];
  Time: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | undefined;
  RappelCountMin: number | undefined;
  RappelCountMax: number | undefined;
  RappelLengthMax: number | undefined;
  KMLURL: string | undefined;
  HTMLDescription: string;
  GeoJSON: Feature<LineString | Point> | FeatureCollection<LineString | Point> | undefined;
}

export type PermitV1 =
  | 'No permit required'
  | 'Permit required'
  | 'Closed to entry'
  | 'Access is Restricted';

export type MonthsV1 =
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

export type SportV1 =
  | 'canyoneering'
  | 'caving'
  | 'trad climbing'
  | 'sport climbing'
  | 'bouldering'
  | 'mountaineering'
  | 'hiking'
  | 'backcountry skiing'
  | 'ice climbing';

export type DifficultyV1 =
  | 'class 1'
  | 'class 2'
  | 'class 3'
  | 'class 4'
  | '5.fun'
  | '5.5'
  | '5.6'
  | '5.7'
  | '5.8'
  | '5.9'
  | '5.10'
  | '5.11'
  | '5.12'
  | '5.13'
  | '5.14'
  | '1a'
  | '1b'
  | '1c'
  | '2a'
  | '2b'
  | '2c'
  | '3a'
  | '3b'
  | '3c'
  | '4a'
  | '4b'
  | '4c';

export function toRouteV1(route: RouteV2): RouteV1 {
  return {
    URL: route.url,
    Name: route.name,
    Quality: route.quality,
    Popularity: undefined, // not supported by new type & not used in app
    Latitude: route.latitude,
    Longitude: route.longitude,
    Months: route.months,
    Difficulty:
      route.technicalGrade &&
      ((route.technicalGrade + (route.waterGrade ?? '?')).toLowerCase() as DifficultyV1),
    AdditionalRisk: route.additionalRisk,
    Vehicle: route.vehicle,
    Shuttle: route.shuttle,
    Permits: permit2to1[route.permits ?? ''],
    Sports: ['canyoneering'],
    Time: route.timeGrade,
    RappelCountMin: route.rappelCountMin,
    RappelCountMax: route.rappelCountMax,
    RappelLengthMax: route.rappelLengthMax,
    KMLURL: undefined, // not supported by new type & not used in app
    HTMLDescription: route.description,
    GeoJSON: route.geojson,
  };
}
