import {CloudFormation} from '@aws-sdk/client-cloudformation';
import {S3} from '@aws-sdk/client-s3';
import {program} from 'commander';
import {isArray} from 'lodash';
import {clearOutputDir} from './clearOutputDir';
import {logger} from './logger';
import {scrape} from './scrape';
import {syncStack} from './syncStack';
import {SyncStackOutput} from './syncStack/getStackTemplate';
import {uploadOutputDir} from './uploadOutputDir';
import {writeSchemas} from './writeSchemas';

program.option('--skipAWS', 'Skip updating the AWS stack and uploading files to S3', false);
program.option('--verbose', 'Show  verbose log messages', false);
program.option('--region', '', ['California']);

async function main() {
  program.parse();
  const options = program.opts();

  logger.enableVerbose = options.verbose;

  const region = 'us-west-1';
  const s3 = new S3({region});
  const cloudFormation = new CloudFormation({region});

  let stack: SyncStackOutput | undefined;
  if (!options.skipAWS) {
    stack = await syncStack(cloudFormation);
  }

  await clearOutputDir();
  await writeSchemas();
  await scrape(isArray(options.region) ? options.region : [options.region]);

  if (!options.skipAWS && stack) {
    await uploadOutputDir(s3, stack);
  }

  logger.log('Done');
}

main();
