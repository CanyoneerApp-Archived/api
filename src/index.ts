import {program} from 'commander';
import {scrape} from './scrape';
import {updateStack} from './updateStack';
import {upload} from './upload';

program
  .option('--skipFetch', 'Do not make requests to RopeWiki, use only cached data')
  .option('--skipAWS', 'Do not update the AWS stack or upload to S3')
  .option('--verbose', 'Output extra messages to the console');

async function main() {
  program.parse();
  const options = program.opts<{skipAWS: boolean; skipFetch: boolean; verbose: boolean}>();

  if (options.skipAWS) {
    await scrape(options);
  } else {
    const stack = await updateStack();
    await scrape(options);
    await upload({region: stack.region, bucket: stack.bucket});
    console.log(`Uploaded to ${stack.url}`);
  }
}

main();
