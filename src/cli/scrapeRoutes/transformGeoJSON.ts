import {Feature, FeatureCollection, LineString, Point} from '@turf/helpers';
import length from '@turf/length';
import {simplify} from '@turf/turf';
import assert from 'assert';
import * as FastPNG from 'fast-png';
import {isNumber} from 'lodash';
import {inspect} from 'util';
import cachedFetch from './cachedFetch';

function flatten(input: Feature | FeatureCollection): Feature<LineString | Point>[] {
  if (input.type === 'FeatureCollection') {
    return input.features.flatMap(flatten)
  } else if (input.geometry.type === 'LineString' || input.geometry.type === 'Point') {
    // @ts-expect-error
    return [input]
  } else {
    throw new Error(`Unexpected feature type ${inspect(input)}`)
  }
}

export async function transformGeoJSON(input: Feature | FeatureCollection): Promise<FeatureCollection> {
  const output = flatten(input);

  const foo: FeatureCollection = {
    type: 'FeatureCollection',
    features: await Promise.all(
      output.map(async (feature): Promise<Feature<LineString | Point>> => {
        console.log(feature)

        if (feature.geometry.type === 'LineString') {
          // @ts-expect-error
          return await transformGeoJSONLine(feature);

        } else if (feature.geometry.type === 'Point') {
          return {
            ...feature,
            properties: {
              ...feature.properties,
              // @ts-expect-error
              elevationMeters: await getElevation(feature.geometry.coordinates),
            }
          }
        } else {
          return feature;
        }
      }),
    ),
  };

  return foo
}

async function transformGeoJSONLine(feature: Feature<LineString>) {
  const geometry: LineString = {
    type: 'LineString',
    coordinates: await Promise.all(
      simplify(feature.geometry, {tolerance: 1}).coordinates.map(async ([lon, lat]) => {
        assert(isNumber(lon) && isNumber(lat));
        return [lon, lat, await getElevation([lon, lat])];
      }),
    ),
  };

  return {
    ...feature,
    geometry,
    properties: {
      ...feature.properties,
      lengthMeters: length(feature, {units: 'meters'}),
    },
  };
}

async function getElevation([lon, lat]: [number, number]) {
  const tileZ = 12;
  const tileX = lon2tile(lon, tileZ);
  const tileY = lat2tile(lat, tileZ);

  const url = new URL(
    `https://api.mapbox.com/v4/mapbox.terrain-rgb/${tileZ}/${Math.floor(tileX)}/${Math.floor(
      tileY,
    )}.png?access_token=pk.eyJ1Ijoic3BpbmRyaWZ0IiwiYSI6ImNqaDg2bDBsdTBmZG0yd3MwZ2x4ampsdXUifQ.7E19C7BhF9Dfd1gdJiYTEg`,
  );

  const png = FastPNG.decode(await cachedFetch(url));

  const xp = tileX - Math.floor(tileX);
  const yp = tileY - Math.floor(tileY);
  const x = Math.floor(xp * png.width);
  const y = Math.floor(yp * png.height);

  const R = png.data[x * png.width * png.channels + y * png.channels + 0];
  const G = png.data[x * png.width * png.channels + y * png.channels + 1];
  const B = png.data[x * png.width * png.channels + y * png.channels + 2];

  assert(isNumber(R) && isNumber(G) && isNumber(B));

  const height = -10000 + (R * 256 * 256 + G * 256 + B) * 0.1;

  return height;
}

// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_(JavaScript/ActionScript,_etc.)
export function lon2tile(lon: number, zoom: number) {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}
export function lat2tile(lat: number, zoom: number) {
  return ((1 -
    Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
    2) *
    Math.pow(2, zoom)
}
