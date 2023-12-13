import {getS3Etag} from '@scree/aws-utils';
import FS from 'fs';
import {RouteV2, toGeoJSONRouteV2, toIndexRouteV2, toRouteV1} from '../types/v2';

export async function createPublicRoutes(routes: RouteV2[]) {
  await FS.promises.mkdir('./public/v2/details', {recursive: true});
  await FS.promises.mkdir('./public/v1', {recursive: true});

  const v1Index = new JSONWriteStream('./public/v1/index.json');
  const v2Index = new JSONWriteStream('./public/v2/index.json');
  const v2GeoJSON = new JSONWriteStream('./public/v2/index.geojson');

  for (const route of routes) {
    const detailsJSON = Buffer.from(JSON.stringify(route, null, 2));

    v1Index.write(toRouteV1(route));
    v2Index.write(toIndexRouteV2(route, getS3Etag(detailsJSON)));
    toGeoJSONRouteV2(route).forEach(feature => v2GeoJSON.write(feature));
    await FS.promises.writeFile(`./public/v2/details/${route.id}.json`, detailsJSON);
  }

  await Promise.all([v1Index.end(), v2Index.end(), v2GeoJSON.end()]);
}

/**
 * This class writes JSON objects to a file, line by line
 */
class JSONWriteStream {
  private first = true;
  private stream: FS.WriteStream;

  constructor(path: string) {
    this.stream = FS.createWriteStream(path, 'utf-8');
    this.stream.write('[\n');
  }

  write(value: unknown) {
    return new Promise<void>((resolve, reject) => {
      this.stream.write(`${this.first ? '' : `,\n`}${JSON.stringify(value)}`, error =>
        error ? reject(error) : resolve(),
      ),
        (this.first = false);
    });
  }

  end() {
    return new Promise<void>(resolve => this.stream.end('\n]', resolve));
  }
}
