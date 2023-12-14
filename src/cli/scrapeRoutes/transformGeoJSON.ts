import {Feature, FeatureCollection, LineString, Point} from '@turf/helpers';
import length from '@turf/length';
import assert from 'assert';
import * as FastPNG from 'fast-png';
import {isNumber} from 'lodash';
import cachedFetch from './cachedFetch';

function flatten(input: Feature | FeatureCollection): Feature[] {
  if (input.type === 'FeatureCollection') {
    return input.features.flatMap(flatten)
  } else {
    return [input]
  }
}

export async function parseGeoJSON(input: Feature | FeatureCollection): Promise<FeatureCollection> {
  const output = flatten(input);

  return {
    type: 'FeatureCollection',
    features: await Promise.all(
      output.map(async (feature) => {
        if (feature.geometry.type === 'LineString') {
          // @ts-expect-error
          return await parseGeoJSONLineString(feature);

        } else if (feature.geometry.type === 'Point') {
          // @ts-expect-error
          return await parseGeoJSONPoint(feature)
        } else {
          return feature
        }
      }),
    ),
  };

}

async function parseGeoJSONPoint(feature: Feature<Point>) {
  return {
    ...feature,
    properties: {
      ...feature.properties,
      // @ts-expect-error
      elevationMeters: Math.round(await getElevation(feature.geometry.coordinates)),
    }
  };
}

async function parseGeoJSONLineString(feature: Feature<LineString>) {
  const geometry: LineString = {
    type: 'LineString',
    coordinates: await Promise.all(
      // eslint-disable-next-line no-warning-comments
      // TODO simplify
      feature.geometry.coordinates.map(async ([lon, lat]) => {
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
      ascentMeters: getAscent(geometry, false),
      descentMeters: getAscent(geometry, true),
      // @ts-ignore
      changeMeters: geometry.coordinates[geometry.coordinates.length - 1][2] - geometry.coordinates[0][2],
    },
  };
}

function getAscent(geometry: LineString, isDescent: boolean) {
  let ascent = 0;

  for (let i = 0; i < geometry.coordinates.length - 1; i++) {
    // @ts-expect-error
    const [, , elevation1] = geometry.coordinates[i];
    // @ts-expect-error
    const [, , elevation2] = geometry.coordinates[i + 1];

    ascent += Math.max(0, elevation2 - elevation1 * (isDescent ? -1 : 1));
  }

  return ascent;
}

async function getElevation([lon, lat]: [number, number]) {
  const tileZ = 12;
  const tileX = lon2tile(lon, tileZ);
  const tileY = lat2tile(lat, tileZ);

  const url = new URL(
    `https://api.mapbox.com/v4/mapbox.terrain-rgb/${tileZ}/${Math.floor(tileX)}/${Math.floor(
      tileY,
      // eslint-disable-next-line no-warning-comments
      // TODO pull this out into a constant
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
