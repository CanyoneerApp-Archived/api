const Path = require('path');

// This file configures some "create-react-app" overrides via the "react-scripts" package.
module.exports = {
  paths: paths => ({
    ...paths,
    appIndexJs: Path.resolve('./src/web/index.tsx'),
  }),
};
