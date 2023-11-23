import {CloudFormation} from '@aws-sdk/client-cloudformation';
import {S3} from '@aws-sdk/client-s3';
import {syncS3Dir} from '@scree/aws-utils';
import chalk from 'chalk';
import {program} from 'commander';
import {scrape} from './scrape';
import {syncStack} from './syncStack';
import {writeSchemas} from './writeRouteSchema';

program.option('--skipAWS', 'Skip updating the AWS stack and uploading files to S3', false);

async function main() {
  program.parse();
  const options = program.opts<{skipAWS: boolean}>();

  if (options.skipAWS) {
    await scrape();
    await writeSchemas();
  } else {
    const region = 'us-west-1';
    const s3 = new S3({region});
    const cloudFormation = new CloudFormation({region});
    const outputs = await syncStack(cloudFormation);

    await scrape();
    await writeSchemas();

    console.log('Uploading');
    await syncS3Dir(s3, {
      ...outputs,
      LocalPath: './output',
      FileUploadedHandler: ({S3Key}) => console.log(chalk.dim(`Upload ${S3Key}`)),
    });
    console.log(`Uploaded to ${outputs.URL}/routes.json`);
  }

  console.log(chalk.green(chalk.bold('Done')));
}

main();
