// Do not import anything from V2 because it may break clients that depend on the V1 schema exactly
// as it is!

import {FeatureCollection} from '@turf/helpers';

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

