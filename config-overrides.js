// eslint-disable-next-line @typescript-eslint/no-var-requires

module.exports = {
  paths: paths => {
    return {
      ...paths,
      appIndexJs: './src/buildViewer/app.tsx',
      appBuild: './output/viewer',
    };
  },
};
