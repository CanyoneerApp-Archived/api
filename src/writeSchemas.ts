import FS from 'fs';
import * as TSJ from 'ts-json-schema-generator';

const types = {
  LegacyRoute: './src/LegacyRoute.ts',
  Route: './src/Route.ts',
  IndexRoute: './src/Route.ts',
  RouteGeoJSONFeature: './src/Route.ts',
};

export async function writeSchemas() {
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
