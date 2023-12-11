import FS from 'fs';
import Path from 'path';
import * as TSJ from 'ts-json-schema-generator';

export const schemas = {
  RouteV1: 'v1',
  RouteV2: 'v2',
  IndexRouteV2: 'v2',
  GeoJSONRouteV2: 'v2',
};

export async function writeAllSchemas() {
  return Promise.all(
    Object.entries(schemas).map(async ([type, version]) => {
      const outputPath = Path.resolve(`./public/${version}/schemas/${type}.json`);
      await FS.promises.mkdir(Path.dirname(outputPath), {recursive: true});
      await FS.promises.writeFile(
        outputPath,
        JSON.stringify(
          TSJ.createGenerator({
            path: `./src/types/${version}.ts`,
            tsconfig: './tsconfig.json',
            topRef: false,
          }).createSchema(type),
          null,
          2,
        ),
      );
    }),
  );
}
