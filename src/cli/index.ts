import {CloudFormation} from '@aws-sdk/client-cloudformation';
import {S3} from '@aws-sdk/client-s3';
import {program} from 'commander';
import {logger} from '../utils/logger';
import {clearPublicDir} from './clearPublicDir';
import {createBuild} from './createBuild';
import {createPublicRoutes} from './createPublicRoutes';
import {createPublicSchemas} from './createPublicSchemas';
import {getOutputStats} from './createPublicStats';
import {createPublicTiles} from './createPublicTiles';
import {scrape as scrapeRoutes} from './scrapeRoutes';
import {syncStack} from './syncStack';
import {SyncStackOutput} from './syncStack/getStackTemplate';
import {uploadOutputDir} from './uploadBuild';

program.option(
  '--local',
  'run entirely locally, do not update the AWS stack or uploading files to S3',
  false,
);

program.option(
  '--verbose',
  'If true, print every HTTP request to the console. This is useful for debugging but makes the console output very noisy.',
  false,
);

program.option(
  '--region <NAME>',
  '"all" or the name a RopeWiki region to scrape (https://ropewiki.com/Regions). In development you may prefer to scrape a small number of canyons in a region such as "California."',
  'all',
);

export async function main(argv: string[]) {
  program.parse(argv);
  const options = program.opts();

  logger.enableFetch = options.verbose;

  const awsRegion = 'us-west-1';
  const s3 = new S3({region: awsRegion});
  const cloudFormation = new CloudFormation({region: awsRegion});

  let stack: SyncStackOutput | undefined;
  if (!options.local) {
    stack = await logger.step(syncStack, [cloudFormation]);
  }

  await logger.step(clearPublicDir, []);
  await logger.step(createPublicSchemas, []);
  const routes = await logger.step(scrapeRoutes, [options.region]);
  await logger.step(createPublicRoutes, [routes]);
  await logger.step(createPublicTiles, []);
  const stats = await logger.step(getOutputStats, []);
  logger.stats(stats);
  await logger.step(createBuild, []);

  if (!options.local && stack) {
    await logger.step(uploadOutputDir, [s3, stack]);
  }

  logger.stats(stats);
  logger.done();
}

if (require.main === module) {
  main(process.argv);
}
