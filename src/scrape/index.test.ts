import {inner} from '.';
import {writeAllSchemas} from '../writeSchemas';

describe('scrape', () => {
  it(
    'Maine',
    async () => {
      await writeAllSchemas();
      return expect(await inner(['Maine'])).toMatchSnapshot();
    },
    60 * 1000,
  );

  it(
    'South Dakota',
    async () => {
      await writeAllSchemas();
      return expect(await inner(['South Dakota'])).toMatchSnapshot();
    },
    60 * 1000,
  );
});
