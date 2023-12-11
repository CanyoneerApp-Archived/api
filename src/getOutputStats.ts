import FS from 'fs/promises';
import {max, mean, sum} from 'lodash';
import {glob} from 'miniglob';
import {gzip} from 'zlib';

export type Stats = Awaited<ReturnType<typeof getOutputStats>>;

export async function getOutputStats() {
  const detailBytes = await Promise.all(glob(`./output/v2/details/*.json`).map(getGzipSize));
  const tileBytes = await Promise.all(glob(`./output/v2/tiles/*/*/*.pbf`).map(getGzipSize));

  detailBytes.sort();

  const stats = {
    indexBytes: await getGzipSize('./output/v2/index.json'),
    geojsonBytes: await getGzipSize('./output/v2/index.geojson'),
    ...getArrayStats('detailBytes', detailBytes),
    ...getArrayStats('tileBytes', tileBytes),
  };

  FS.writeFile('./output/v2/stats.json', JSON.stringify(stats, null, 2));

  return stats;
}

export async function getMainOutputStats(): Promise<Record<string, number> | undefined> {
  const response = await fetch('http://canyoneer--main.s3.us-west-1.amazonaws.com/v2/stats.json');
  if (!response.ok) return undefined;
  return response.json();
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
