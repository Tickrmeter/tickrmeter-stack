const path = require("path");
const postcssRtl = require("postcss-rtl");

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        "@src": path.resolve(__dirname, "src"),
        "@assets": path.resolve(__dirname, "src/@core/assets"),
        "@components": path.resolve(__dirname, "src/@core/components"),
        "@layouts": path.resolve(__dirname, "src/@core/layouts"),
        "@store": path.resolve(__dirname, "src/redux"),
        "@styles": path.resolve(__dirname, "src/@core/scss"),
        "@configs": path.resolve(__dirname, "src/configs"),
        "@utils": path.resolve(__dirname, "src/utility/Utils"),
        "@ui-hooks": path.resolve(__dirname, "src/utility/hooks"),
        "@hooks": path.resolve(__dirname, "src/hooks"),
        "@images": path.resolve(__dirname, "src/assets/images"),
        "@views": path.resolve(__dirname, "src/views"),
        "@device-config": path.resolve(__dirname, "src/views/ConfigDeviceNew"),
      };
      return webpackConfig;
    },
  },
  style: {
    postcss: {
      plugins: [postcssRtl()],
    },
    sass: {
      loaderOptions: {
        // pass options to sass-loader
        //additionalData: `@import "src/@core/scss/variables.scss";`, // Adjust the path based on your structure
        sassOptions: {
          includePaths: [path.resolve(__dirname, "src/assets"), path.resolve(__dirname, "node_modules")],
        },
      },
    },
  },
};
