const Path = require('path');

module.exports = {
  // @ts-ignore
  paths: paths => ({
    ...paths,
    appIndexJs: Path.resolve('./src/frontend/index.tsx'),
    appBuild: Path.resolve('./output'),
  }),
};
