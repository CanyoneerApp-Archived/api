import FS from 'fs';
import {max, mean, sum} from 'lodash';
import {gzip} from 'zlib';
import {toRouteV1} from './types/v1';
import {GeoJSONRouteV2, RouteV2, toGeoJSONRouteV2, toIndexRouteV2} from './types/v2';

export type WriteOutputStats = Awaited<ReturnType<typeof writeOutput>>;

export async function writeOutput(routes: RouteV2[]) {
  await FS.promises.mkdir('./output/v2/details', {recursive: true});
  await FS.promises.mkdir('./output/v1', {recursive: true});

  const indexV1Schema = FS.createWriteStream('./output/v1/index.json');
  const indexV2Stream = FS.createWriteStream('./output/v2/index.json');
  const geojsonV2Stream = FS.createWriteStream('./output/v2/index.geojson');

  let first = true;

  indexV1Schema.write('[\n');

  const detailBytes: Promise<number>[] = [];

  for (const route of routes) {
    if (first) {
      first = false;
    } else {
      indexV1Schema.write(',\n');
    }

    const detailBody = JSON.stringify(route, null, 2);
    await FS.promises.writeFile(`./output/v2/details/${route.id}.json`, detailBody);
    detailBytes.push(getGzipSize(Buffer.from(detailBody)));

    indexV2Stream.write(`${JSON.stringify(toIndexRouteV2(route))}\n`);

    const features: GeoJSONRouteV2[] = toGeoJSONRouteV2(route);
    features.forEach(feature => {
      geojsonV2Stream.write(`${JSON.stringify(feature)}\n`);
    });

    indexV1Schema.write(JSON.stringify(toRouteV1(route)));
  }

  indexV1Schema.write(']');

  const [detailBytesResolved] = await Promise.all([
    Promise.all(detailBytes),
    new Promise(resolve => indexV1Schema.end(resolve)),
    new Promise(resolve => indexV2Stream.end(resolve)),
    new Promise(resolve => geojsonV2Stream.end(resolve)),
  ]);

  detailBytesResolved.sort();

  const stats = {
    indexBytes: await getGzipSize(await FS.promises.readFile('./output/v2/index.json')),
    geojsonBytes: await getGzipSize(await FS.promises.readFile('./output/v2/index.geojson')),
    detailBytesSum: sum(detailBytesResolved),
    detailBytesMean: mean(detailBytesResolved),
    detailBytesP50: getPercentile(detailBytesResolved, 0.5),
    detailBytesP95: getPercentile(detailBytesResolved, 0.95),
    detailBytesP99: getPercentile(detailBytesResolved, 0.99),
    detailBytesMax: max(detailBytesResolved),
  };

  FS.promises.writeFile('./output/v2/stats.json', JSON.stringify(stats, null, '  '));

  return stats;
}

async function getGzipSize(buffer: Buffer) {
  return new Promise<number>(async (resolve, reject) =>
    gzip(buffer, (error, result) => (error ? reject(error) : resolve(result.byteLength))),
  );
}

function getPercentile(sortedArray: number[], percentile: number) {
  const index = Math.floor(sortedArray.length * percentile);
  return sortedArray[index];
}
