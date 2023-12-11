const Path = require('path');

// This file configures some "create-react-app" overrides via the "react-app-rewired" package.
// See https://github.com/timarney/react-app-rewired#extended-configuration-options
module.exports = {
  paths: paths => ({
    ...paths,
    appIndexJs: Path.resolve('./src/web/index.tsx'),
  }),
  jest: config => ({
    ...config,
    testEnvironment: 'node',
  }),
};
