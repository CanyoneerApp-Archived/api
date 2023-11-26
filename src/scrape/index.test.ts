import {inner as scrapeInner} from '.';
import {writeAllSchemas} from '../writeAllSchemas';

describe('scrape', () => {
  beforeAll(async () => {
    await writeAllSchemas();
  });

  it(
    'Maine',
    async () => {
      return expect(await scrapeInner(['Maine'])).toMatchSnapshot();
    },
    60 * 1000,
  );

  it(
    'South Dakota',
    async () => {
      return expect(await scrapeInner(['South Dakota'])).toMatchSnapshot();
    },
    60 * 1000,
  );
});
