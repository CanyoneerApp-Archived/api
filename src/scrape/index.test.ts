import {inner} from '.';
import {writeSchemas} from '../writeSchemas';

describe('scrape', () => {
  it(
    'Maine',
    async () => {
      await writeSchemas();
      return expect(await inner(['Maine'])).toMatchSnapshot();
    },
    60 * 1000,
  );

  it(
    'South Dakota',
    async () => {
      await writeSchemas();
      return expect(await inner(['South Dakota'])).toMatchSnapshot();
    },
    60 * 1000,
  );
});
