import {inner} from '.';

describe('scrape', () => {
  it('scrapes', async () => {
    return expect(await inner(['Maine'])).toMatchSnapshot();
  });
});
