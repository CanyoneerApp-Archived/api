import {Feature, FeatureCollection, LineString, Point} from '@turf/helpers';
import length from '@turf/length';
import assert from 'assert';
import * as FastPNG from 'fast-png';
import {isNumber} from 'lodash';
import {LRUCache} from 'lru-cache';
import {RouteV2} from '../../types/v2';
import {logger} from '../../utils/logger';
import cachedFetch from './cachedFetch';

const MAPBOX_TOKEN =
  'pk.eyJ1Ijoic3BpbmRyaWZ0IiwiYSI6ImNqaDg2bDBsdTBmZG0yd3MwZ2x4ampsdXUifQ.7E19C7BhF9Dfd1gdJiYTEg';

export async function parseKMLs(routes: RouteV2[]): Promise<RouteV2[]> {
  let doneCount = 0;
  for (const route of routes) {
    route.geojson = route.geojson && (await parseKMLsInner(route.geojson));
    logger.progress(routes.length, doneCount++, route.name);
  }
  return routes;
}

export async function parseKMLsInner(
  input: Feature | FeatureCollection,
): Promise<FeatureCollection> {
  const output = flattenFeatureCollection(input);

  return {
    type: 'FeatureCollection',
    features: await Promise.all(
      output.map(async feature => {
        if (feature.geometry.type === 'LineString') {
          return await parseLineString(feature as Feature<LineString>);
        } else if (feature.geometry.type === 'Point') {
          return await parsePoint(feature as Feature<Point>);
        } else {
          return feature;
        }
      }),
    ),
  };
}

async function parsePoint(feature: Feature<Point>) {
  return {
    ...feature,
    properties: {
      ...feature.properties,
      elevationMeters: Math.round(await getElevationMeters(feature.geometry.coordinates)),
    },
  };
}

async function parseLineString(feature: Feature<LineString>) {
  const geometry: LineString = {
    type: 'LineString',
    coordinates: await Promise.all(
      feature.geometry.coordinates.map(async ([lon, lat]) => {
        assert(isNumber(lon) && isNumber(lat));
        return [lon, lat, await getElevationMeters([lon, lat])];
      }),
    ),
  };

  const endElevationMeters = geometry.coordinates[geometry.coordinates.length - 1]?.[2];
  const startElevationMeters = geometry.coordinates[0]?.[2];

  assert(isNumber(endElevationMeters) && isNumber(startElevationMeters));

  return {
    ...feature,
    geometry,
    properties: {
      ...feature.properties,
      lengthMeters: length(feature, {units: 'meters'}),
      ...getAscentDescentMeters(geometry),
      changeMeters: endElevationMeters - startElevationMeters,
    },
  };
}

function getAscentDescentMeters(geometry: LineString) {
  let ascentMeters = 0;
  let descentMeters = 0;

  for (let i = 0; i < geometry.coordinates.length - 1; i++) {
    const [, , elevation1] = geometry.coordinates[i] as number[];
    const [, , elevation2] = geometry.coordinates[i + 1] as number[];

    assert(isNumber(elevation1) && isNumber(elevation2));

    ascentMeters += Math.max(0, elevation2 - elevation1);
    descentMeters += Math.max(0, elevation1 - elevation2);
  }

  return {
    ascentMeters,
    descentMeters,
  };
}

async function getElevationMeters([lon, lat]: number[]) {
  assert(isNumber(lon) && isNumber(lat));

  const z = 12;
  const x = lon2tile(lon, z);
  const y = lat2tile(lat, z);

  const png = await fetchElevationsCache.fetch(id2str({z: z, x: Math.floor(x), y: Math.floor(y)}));

  assert(png);

  const tileX = Math.floor((x - Math.floor(x)) * png.width);
  const tileY = Math.floor((y - Math.floor(y)) * png.height);

  const elevation = png.data[tileX * png.width + tileY];

  assert(isNumber(elevation));

  return elevation;
}

export const earthCircumference = 40075016.686;

interface TileId {
  x: number;
  y: number;
  z: number;
}

interface Raster {
  width: number;
  height: number;
  data: Float32Array;
}

function id2str(id: TileId) {
  return `${id.z}/${id.x}/${id.y}`;
}

function str2id(str: string): TileId {
  const [z, x, y] = str.split('/').map(Number);
  assert(isNumber(z) && isNumber(x) && isNumber(y));
  return {z, x, y};
}

const gigabyte = 1e9;

const fetchElevationsCache = new LRUCache<string, Raster>({
  maxSize: 4 * gigabyte,
  ignoreFetchAbort: true,

  sizeCalculation: ({data}) => {
    return data.byteLength;
  },

  fetchMethod: async (s: string) => {
    const {x, y, z} = str2id(s);

    const url = new URL(
      `https://api.mapbox.com/v4/mapbox.terrain-rgb/${z}/${Math.floor(x)}/${Math.floor(
        y,
      )}.png?access_token=${MAPBOX_TOKEN}`,
    );

    const input = FastPNG.decode(await cachedFetch(url));

    const data = new Float32Array(input.width * input.height);

    for (let i = 0; i < data.length; i++) {
      const r = input.data[i * input.channels + 0];
      const g = input.data[i * input.channels + 1];
      const b = input.data[i * input.channels + 2];

      assert(isNumber(r) && isNumber(g) && isNumber(b));

      const height = -10000 + (r * 256 * 256 + g * 256 + b) * 0.1;

      data[i] = height;
    }

    // // https://wiki.openstreetmap.org/wiki/Zoom_levels
    // const tileWidthMeters = earthCircumference * Math.cos(d2r(lat)) /
    //   Math.pow(2, z);

    return {width: input.width, height: input.height, data: data};
  },
});

// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_(JavaScript/ActionScript,_etc.)
export function lon2tile(lon: number, zoom: number) {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

export function lat2tile(lat: number, zoom: number) {
  return (
    ((1 -
      Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
      2) *
    Math.pow(2, zoom)
  );
}

function flattenFeatureCollection(input: Feature | FeatureCollection): Feature[] {
  if (input.type === 'FeatureCollection') {
    return input.features.flatMap(flattenFeatureCollection);
  } else {
    return [input];
  }
}
