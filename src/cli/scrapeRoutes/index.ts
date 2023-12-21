import {isArray} from 'lodash';
import {allRegions} from '../../utils/allRegions';
import {logger} from '../../utils/logger';
import {injectVersions} from './injectVersions';
import {parseKMLs} from './parseKMLs';
import {scrapeDescriptions} from './scrapeDescriptions';
import {scrapeIndices} from './scrapeIndices';
import {scrapeKMLs} from './scrapeKMLs';

export async function scrapeRoutes(regions: string | string[], cachePath: string) {
  regions =
    isArray(regions) ? regions
    : regions === 'all' ? allRegions
    : [regions];

  const indices = await logger.step(scrapeIndices, [regions, cachePath]);
  const descriptions = await logger.step(scrapeDescriptions, [indices, cachePath]);
  const rawGeojson = await logger.step(scrapeKMLs, [descriptions, regions, cachePath]);
  const geojson = await logger.step(parseKMLs, [rawGeojson, cachePath]);
  const versions = logger.step(injectVersions, [geojson]);
  return versions;
}
