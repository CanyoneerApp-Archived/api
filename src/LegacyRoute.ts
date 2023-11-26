import {FeatureCollection} from '@turf/helpers';
import {AdditionalRisk, Month, Route, TimeGrade} from './Route';

export interface LegacyRoute {
  URL: string;
  Name: string;
  Quality: number;
  Popularity: number | undefined;
  Latitude: number;
  Longitude: number;
  Months: Month[];
  Difficulty: string | undefined;
  AdditionalRisk: AdditionalRisk | undefined;
  Vehicle: string | undefined;
  Shuttle: string | undefined;
  Permits:
    | 'No permit required'
    | 'Permit required'
    | 'Closed to entry'
    | 'Access is Restricted'
    | undefined;
  Sports: ['canyoneering'];
  Time: TimeGrade | undefined;
  RappelCountMin: number | undefined;
  RappelCountMax: number | undefined;
  RappelLengthMax: number | undefined;
  KMLURL: string | undefined;
  HTMLDescription: string;
  GeoJSON: FeatureCollection | undefined;
}

export function toLegacyRoute(route: Route): LegacyRoute {
  // TODO test the runtime value against the schema
  return {
    URL: route.url,
    Name: route.name,
    Quality: route.quality,
    Popularity: undefined, // not supported by new type & not used in app
    Latitude: route.latitude,
    Longitude: route.longitude,
    Months: route.months,
    Difficulty: route.technicalRating && route.technicalRating + (route.waterRating ?? '?'),
    AdditionalRisk: route.riskRating,
    Vehicle: route.vehicle,
    Shuttle: `${route.shuttleMinutes}min`,
    Permits: {
      No: 'No permit required',
      Yes: 'Permit required',
      Closed: 'Closed to entry',
      Restricted: 'Access is Restricted',
      '': undefined,
    }[route.permits ?? ''] as LegacyRoute['Permits'],
    Sports: ['canyoneering'],
    Time: route.timeRating,
    RappelCountMin: route.rappelCountMin,
    RappelCountMax: route.rappelCountMax,
    RappelLengthMax: route.rappelLongestFeet,
    KMLURL: undefined, // not supported by new type & not used in app
    HTMLDescription: route.description,
    GeoJSON: route.geojson,
  };
}
