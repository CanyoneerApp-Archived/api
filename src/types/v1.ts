import {FeatureCollection} from '@turf/helpers';

// Avoid using types from RouteV2 in the V1 schema to prevent breaking changes from being propagated
import {METERS_PER_FOOT} from '../constants';
import {RouteV2, permitV2toV1} from './v2';

export interface RouteV1 {
  URL: string;
  Name: string;
  Quality: number | undefined;
  Popularity: number | undefined;
  Latitude: number;
  Longitude: number;
  Months: MonthV1[];
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
  HTMLDescription: string | undefined;
  GeoJSON: FeatureCollection | undefined;
}

export type PermitV1 =
  | 'No permit required'
  | 'Permit required'
  | 'Closed to entry'
  | 'Access is Restricted';

export type MonthV1 =
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
    RappelLengthMax: route.rappelLongestMeters
      ? route.rappelLongestMeters / METERS_PER_FOOT
      : undefined,
    KMLURL: undefined, // not supported by new type & not used in app
    HTMLDescription: route.description,
    GeoJSON: route.geojson,
  };
}

const monthsV2toV1: {[key: string]: MonthV1} = {
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
