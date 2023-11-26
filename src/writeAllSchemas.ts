import FS from 'fs';
import * as TSJ from 'ts-json-schema-generator';

const types = {
  RouteV1: './src/scrape/RouteV1.ts',
  RouteV2: './src/scrape/RouteV2.ts',
  IndexRouteV2: './src/scrape/RouteV2.ts',
  RouteV2GeoJSONFeature: './src/scrape/RouteV2.ts',
};

export async function writeAllSchemas() {
  await FS.promises.mkdir('./output/schemas', {recursive: true});

  Object.entries(types).map(([type, path]) =>
    FS.promises.writeFile(
      `./output/schemas/${type}.json`,
      JSON.stringify(
        TSJ.createGenerator({
          path,
          tsconfig: './tsconfig.json',
          topRef: false,
        }).createSchema(type),
        null,
        2,
      ),
    ),
  );
}
