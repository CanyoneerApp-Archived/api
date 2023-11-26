import {Feature, FeatureCollection, LineString, Point} from '@turf/helpers';
import {Difficulty} from '../scrape/parseDifficulty';
import {Sport} from '../scrape/parseSports';
import {AdditionalRiskV2, MonthV2, RouteV2, TimeGradeV2} from './RouteV2';

export interface RouteV1 {
  URL: string;
  Name: string;
  Quality: number | undefined;
  Popularity: number | undefined;
  Latitude: number;
  Longitude: number;
  Months: MonthV2[];
  Difficulty: Difficulty | undefined;
  AdditionalRisk: AdditionalRiskV2 | undefined;
  Vehicle: string | undefined;
  Shuttle: string | undefined;
  Permits:
    | 'No permit required'
    | 'Permit required'
    | 'Closed to entry'
    | 'Access is Restricted'
    | undefined;
  Sports: Sport[];
  Time: TimeGradeV2 | undefined;
  RappelCountMin: number | undefined;
  RappelCountMax: number | undefined;
  RappelLengthMax: number | undefined;
  KMLURL: string | undefined;
  HTMLDescription: string;
  GeoJSON: Feature<LineString | Point> | FeatureCollection<LineString | Point> | undefined;
}

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
      route.technicalGrade && ((route.technicalGrade + (route.waterGrade ?? '?')) as Difficulty),
    AdditionalRisk: route.additionalRisk,
    Vehicle: route.vehicle,
    Shuttle: route.shuttle,
    Permits: {
      No: 'No permit required',
      Yes: 'Permit required',
      Closed: 'Closed to entry',
      Restricted: 'Access is Restricted',
      '': undefined,
    }[route.permits ?? ''] as RouteV1['Permits'],
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
