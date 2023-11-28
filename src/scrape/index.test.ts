import {inner as scrapeInner} from '.';
import {logger} from '../logger';
import {toRouteV1} from '../types/RouteV1';
import {writeAllSchemas} from '../writeAllSchemas';

describe('scrape', () => {
  beforeAll(async () => {
    // @ts-ignore
    logger.enableAll = false;
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
    'Maine v1',
    async () => {
      const routes = await scrapeInner(['Maine']);
      return expect(routes.map(toRouteV1)).toMatchSnapshot();
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
