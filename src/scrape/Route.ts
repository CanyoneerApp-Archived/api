import {Feature, LineString} from '@turf/helpers';
import {AdditionalRisk} from './parseAdditionalRisk';
import {Difficulty} from './parseDifficulty';
import {Month} from './parseMonths';
import {Permits} from './parsePermits';
import {Sport} from './parseSports';
import {Time} from './parseTime';

export interface Route {
  URL: string;
  Name: string;
  Quality: number;
  Popularity: number | undefined;
  Latitude: number;
  Longitude: number;
  Months: Month[];
  Difficulty: Difficulty | undefined;
  AdditionalRisk: AdditionalRisk | undefined;
  Vehicle: string | undefined;
  Shuttle: string | undefined;
  Permits: Permits | undefined;
  Sports: Sport[];
  Time: Time | undefined;
  RappelCountMin: number | undefined;
  RappelCountMax: number | undefined;
  RappelLengthMax: number | undefined;
  KMLURL: string | undefined;
  HTMLDescription: string;
  GeoJSON: Feature<LineString, {}> | undefined;
}
