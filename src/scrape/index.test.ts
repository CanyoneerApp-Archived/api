import {inner} from '.';

describe('scrape', () => {
  it(
    'Maine',
    async () => {
      return expect(await inner(['Maine'])).toMatchSnapshot();
    },
    60 * 1000,
  );

  it(
    'South Dakota',
    async () => {
      return expect(await inner(['South Dakota'])).toMatchSnapshot();
    },
    60 * 1000,
  );
});
