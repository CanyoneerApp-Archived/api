import FS from 'fs/promises';
import {max, mean, sum} from 'lodash';
import Path from 'path';
import {promisify} from 'util';
import zlib from 'zlib';

export type OutputStats = Awaited<ReturnType<typeof getOutputStats>>;

export async function getOutputStats() {
  const dir = './public/v2/details';

  const detailBytes = await Promise.all(
    (await FS.readdir(dir)).map(async file => getGzipSize(Path.join(dir, file))),
  );

  detailBytes.sort();

  return {
    indexBytes: await getGzipSize('./public/v2/index.json'),
    geojsonBytes: await getGzipSize('./public/v2/index.geojson'),
    detailBytesSum: sum(detailBytes),
    detailBytesMean: Math.round(mean(detailBytes)),
    detailBytesP50: getPercentile(detailBytes, 0.5),
    detailBytesP95: getPercentile(detailBytes, 0.95),
    detailBytesP99: getPercentile(detailBytes, 0.99),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    detailBytesMax: max(detailBytes)!,
  };
}

function getPercentile(sortedArray: number[], percentile: number) {
  const index = Math.floor(sortedArray.length * percentile);
  return sortedArray[index];
}

const gzip = promisify(zlib.gzip);

async function getGzipSize(path: string): Promise<number> {
  const fileData = await FS.readFile(path);
  const gzippedData = await gzip(fileData);
  return gzippedData.byteLength;
}
