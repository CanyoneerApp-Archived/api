import FS from 'fs';
import * as TSJ from 'ts-json-schema-generator';

export const schemas = {
  RouteV1: './src/types/RouteV1.ts',
  RouteV2: './src/types/RouteV2.ts',
  IndexRouteV2: './src/types/RouteV2.ts',
  GeoJSONRouteV2: './src/types/RouteV2.ts',
};

export async function writeAllSchemas() {
  await FS.promises.mkdir('./output/schemas', {recursive: true});

  Object.entries(schemas).map(([type, path]) =>
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
