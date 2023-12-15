import FS from 'fs/promises';
import {max, mean, sum} from 'lodash';
import {glob} from 'miniglob';
import {gzip} from 'zlib';

export type Stats = Awaited<ReturnType<typeof createPublicStats>>;

export async function createPublicStats() {
  const detailBytes = await Promise.all(glob(`./public/v2/details/*.json`).map(getGzipSize));
  const tileBytes = await Promise.all(glob(`./public/v2/tiles/*/*/*.pbf`).map(getGzipSize));

  detailBytes.sort();

  const stats = {
    indexBytes: await getGzipSize('./public/v2/index.json'),
    geojsonBytes: await getGzipSize('./public/v2/index.geojson'),
    ...getArrayStats('detailBytes', detailBytes),
    ...getArrayStats('tileBytes', tileBytes),
  };

  FS.writeFile('./public/v2/stats.json', JSON.stringify(stats, null, 2));

  return stats;
}

function getArrayStats(name: string, values: number[]) {
  return {
    [`${name}Sum`]: sum(values),
    [`${name}Mean`]: Math.round(mean(values)),
    [`${name}P50`]: getPercentile(values, 0.5),
    [`${name}P95`]: getPercentile(values, 0.95),
    [`${name}P99`]: getPercentile(values, 0.99),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    [`${name}Max`]: max(values)!,
  };
}

function getPercentile(sortedArray: number[], percentile: number) {
  const index = Math.floor(sortedArray.length * percentile);
  return sortedArray[index];
}

async function getGzipSize(path: string): Promise<number> {
  const fileData = await FS.readFile(path);
  return await new Promise((resolve, reject) =>
    gzip(fileData, (error, result) => (error ? reject(error) : resolve(result.byteLength))),
  );
}
