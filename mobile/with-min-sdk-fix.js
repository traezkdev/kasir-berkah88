const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withMinSdkFix(config) {
    return withProjectBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = config.modResults.contents.replace(
                /minSdkVersion = .*/g,
                `minSdkVersion = 24`
            );
        }
        return config;
    });
};
