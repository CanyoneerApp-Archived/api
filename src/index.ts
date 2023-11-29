import {CloudFormation} from '@aws-sdk/client-cloudformation';
import {S3} from '@aws-sdk/client-s3';
import {program} from 'commander';
import {isArray} from 'lodash';
import {logger} from './logger';
import {rmOutputDir} from './rmOutputDir';
import {scrape} from './scrape';
import {allRegions} from './scrape/allRegions';
import {syncStack} from './syncStack';
import {SyncStackOutput} from './syncStack/getStackTemplate';
import {uploadOutputDir} from './uploadOutputDir';
import {writeAllSchemas} from './writeAllSchemas';
import {writeRoutes} from './writeRoutes';
import {writeTippecanoe} from './writeTippecanoe';

program.option(
  '--skipAWS',
  'run entirely locally, do not update the AWS stack or uploading files to S3',
  false,
);

program.option(
  '--verbose',
  'If true, print every HTTP request to the console. This is useful for debugging but makes the console output very noisy.',
  false,
);

program.option(
  '--region',
  '"all" or the name a RopeWiki region to scrape (https://ropewiki.com/Regions). In development you may prefer to scrape a small number of canyons in a region such as "California."',
  'all',
);

async function main() {
  program.parse();
  const options = program.opts();

  logger.enableFetch = options.verbose;

  const regions = isArray(options.region)
    ? options.region
    : options.region === 'all'
      ? allRegions
      : [options.region];

  const awsRegion = 'us-west-1';
  const s3 = new S3({region: awsRegion});
  const cloudFormation = new CloudFormation({region: awsRegion});

  let stack: SyncStackOutput | undefined;
  if (!options.skipAWS) {
    stack = await logger.step(syncStack, [cloudFormation]);
  }

  await logger.step(rmOutputDir, []);
  await logger.step(writeAllSchemas, []);
  const routes = await logger.step(scrape, [regions]);
  await logger.step(writeRoutes, [routes]);
  await logger.step(writeTippecanoe, []);

  if (!options.skipAWS && stack) {
    await logger.step(uploadOutputDir, [s3, stack]);
  }

  logger.done();
}

main();
