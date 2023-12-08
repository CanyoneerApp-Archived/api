import FS from 'fs/promises';
import {max, mean, sum} from 'lodash';
import Path from 'path';

export type OutputStats = Awaited<ReturnType<typeof getOutputStats>>;

export async function getOutputStats() {
  const dir = './output/v2/details';

  const detailBytes = await Promise.all(
    (await FS.readdir(dir)).map(async file => {
      return (await FS.lstat(Path.join(dir, file))).size;
    }),
  );

  detailBytes.sort();

  return {
    indexBytes: (await FS.readFile('./output/v2/index.json')).byteLength,
    geojsonBytes: (await FS.readFile('./output/v2/index.geojson')).byteLength,
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
