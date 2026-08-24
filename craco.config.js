module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix for ESLintWebpackPlugin not found error with react-scripts 5
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ESLintWebpackPlugin'
      );

      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      });
      return webpackConfig;
    },
  },
};