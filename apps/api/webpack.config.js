const nodeExternals = require('webpack-node-externals');

module.exports = function(options, webpack) {
  // Override externals to allow bundling of internal monorepo packages beginning with @linhiq/
  options.externals = [
    nodeExternals({
      allowlist: [/^@linhiq\//]
    })
  ];
  return options;
};
