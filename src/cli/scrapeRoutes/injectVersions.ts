import {getS3Etag} from '@scree/aws-utils';
import {RouteV2} from '../../types/v2';

export function injectVersions(routes: RouteV2[]) {
  for (const route of routes) {
    route['version'] = getS3Etag(Buffer.from(JSON.stringify(route)));
  }
  return routes;
}
