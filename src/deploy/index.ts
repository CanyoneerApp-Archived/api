import {updateStack} from './updateStack';

if (!process.env.GIT_BRANCH) {
  throw new Error('GIT_BRANCH env is not set');
}

updateStack({
  app: 'canyoneer',
  branch: process.env.GIT_BRANCH,
  region: 'us-east-1',
});
