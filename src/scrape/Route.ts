import {Feature, FeatureCollection, LineString, Point} from '@turf/helpers';
import {AdditionalRisk} from './parseAdditionalRisk';
import {Difficulty} from './parseDifficulty';
import {Month} from './parseMonths';
import {Sport} from './parseSports';
import {Time} from './parseTime';

export interface RouteIndex {
  id: string;
  name: string;
  stars: number;
  months: Month[];
  technicalGrade: TechnicalGrade | undefined;
  waterGrade: WaterGrade | undefined;
  timeGrade: TimeGrade | undefined;
  additionalRisk: AdditionalRisk | undefined;
  permits: Permit | undefined;
  rappelCountMin: number | undefined;
  rappelCountMax: number | undefined;
  rappelLengthMax: number | undefined;
  detailsUrl: string;
  vehicle: Vehicle | undefined;
  shuttle: Shuttle | undefined;
}

export interface RouteDetails extends RouteIndex {
  description: string;
  geojson: {type: 'FeatureCollection', features: RouteFeature[]};
  url: string;
}

export interface RouteFeatureProperties {
  name: string;
  description: string;
}

export type RouteFeaturePropertiesLineString = {
  type: 'approach' | 'exit' | 'shuttle' | 'descent'
} & {[Key in keyof RouteIndex as `route.${Key}`]: RouteIndex[Key]}

export type RouteFeatureLineString = Feature<LineString, RouteFeaturePropertiesLineString>

export type RouteFeaturePropertiesProperties = {
  type: 'waypoint'
} & {[Key in keyof RouteIndex as `route.${Key}`]: RouteIndex[Key]}

export type RouteFeaturePoint = Feature<Point, RouteFeaturePropertiesProperties>

export type RouteFeature = RouteFeature[]

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
  Time: Time | undefined;
  RappelCountMin: number | undefined;
  RappelCountMax: number | undefined;
  RappelLengthMax: number | undefined;
  KMLURL: string | undefined;
  HTMLDescription: string;
  GeoJSON: Feature<LineString | Point> | FeatureCollection<LineString | Point>;
}
