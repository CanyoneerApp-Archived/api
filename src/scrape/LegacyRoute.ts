import {Feature, FeatureCollection, LineString, Point} from '@turf/helpers';
import {AdditionalRisk, Month, Route, TimeGrade} from './Route';
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

export function toLegacyRoute(route: Route): LegacyRoute {
  return {
    URL: route.url,
    Name: route.name,
    Quality: route.quality,
    Popularity: undefined, // not supported by new type & not used in app
    Latitude: route.latitude,
    Longitude: route.longitude,
    Months: route.months,
    Difficulty:
      route.technicalGrade && ((route.technicalGrade + (route.waterGrade ?? '?')) as Difficulty),
    AdditionalRisk: route.additionalRisk,
    Vehicle: route.vehicle,
    Shuttle: route.shuttle,
    Permits: route.permits,
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
