import {scrape} from './scrape';
import {updateStack} from './updateStack';
import {upload} from './upload';

async function main() {
  const outputs = await updateStack()
  await scrape()
  await upload(outputs.region, outputs.bucketName)
}

main()
