import {Feature, FeatureCollection, LineString, Point} from '@turf/helpers';
import {AdditionalRisk, Month, TimeGrade} from './Route';
import {Difficulty} from './parseDifficulty';
import {Sport} from './parseSports';

export interface LegacyRoute {
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
  Permits: string | undefined;
  Sports: Sport[];
  Time: TimeGrade | undefined;
  RappelCountMin: number | undefined;
  RappelCountMax: number | undefined;
  RappelLengthMax: number | undefined;
  KMLURL: string | undefined;
  HTMLDescription: string;
  GeoJSON: Feature<LineString | Point> | FeatureCollection<LineString | Point>;
}
