import {Feature, FeatureCollection, LineString, Point} from '@turf/helpers';
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
  Permits: string | undefined;
  Sports: ['canyoneering'];
  Time: TimeGrade | undefined;
  RappelCountMin: number | undefined;
  RappelCountMax: number | undefined;
  RappelLengthMax: number | undefined;
  KMLURL: string | undefined;
  HTMLDescription: string;
  GeoJSON: Feature<LineString | Point> | FeatureCollection<LineString | Point> | undefined;
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
      route.technicalRating && ((route.technicalRating + (route.waterRating ?? '?'))),
    AdditionalRisk: route.riskRating,
    Vehicle: route.vehicle,
    Shuttle: `${route.shuttleMinutes}min`,
    Permits: route.permits,
    Sports: ['canyoneering'],
    Time: route.timeRating,
    RappelCountMin: route.rappelCountMin,
    RappelCountMax: route.rappelCountMax,
    RappelLengthMax: route.rappelLengthMaxFeet,
    KMLURL: undefined, // not supported by new type & not used in app
    HTMLDescription: route.description,
    GeoJSON: route.geojson,
  };
}
