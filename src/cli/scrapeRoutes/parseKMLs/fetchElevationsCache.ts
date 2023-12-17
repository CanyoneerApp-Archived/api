import assert from 'assert';
import * as FastPNG from 'fast-png';
import {isNumber} from 'lodash';
import {LRUCache} from 'lru-cache';
import cachedFetch from '../cachedFetch';
import {MAPBOX_TOKEN} from './MAPBOX_TOKEN';
import {str2id} from './id2str';

interface Raster {
  width: number;
  height: number;
  data: Float32Array;
}
const gigabyte = 1000000000;
export const fetchElevationsCache = new LRUCache<string, Raster>({
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
