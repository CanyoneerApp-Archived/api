import {inner} from '.';

describe('scrape', () => {
  it('Maine', async () => {
    return expect(await inner(['Maine'])).toMatchSnapshot();
  });

  it('South Dakota', async () => {
    return expect(await inner(['South Dakota'])).toMatchSnapshot();
  });
});
