module.exports = {
  // @ts-ignore
  paths: paths => {
    return {
      ...paths,
      appIndexJs: './src/frontend/index.tsx',
      appBuild: './output',
    };
  },
};
