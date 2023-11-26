import FS from 'fs';
import * as TSJ from 'ts-json-schema-generator';

export async function writeRouteV2Schema() {
  await FS.promises.writeFile(
    './output/schema.json',
    JSON.stringify(
      TSJ.createGenerator({
        path: './src/scrape/RouteV2.ts',
        tsconfig: './tsconfig.json',
        topRef: false,
      }).createSchema('RouteV2'),
      null,
      2,
    ),
  );
}
