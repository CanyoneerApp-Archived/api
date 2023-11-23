import FS from 'fs';
import * as TSJ from 'ts-json-schema-generator';

export async function buildSchema() {
  await FS.promises.writeFile(
    './output/schema.json',
    JSON.stringify(
      TSJ.createGenerator({
        path: './src/scrape/Route.ts',
        tsconfig: './tsconfig.json',
        topRef: false,
      }).createSchema('Route'),
      null,
      2,
    ),
  );
}
