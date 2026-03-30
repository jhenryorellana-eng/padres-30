const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to add PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY
 * This allows the app to maintain portrait orientation on large screens in Android 16+
 *
 * Note: This is a temporary opt-out that will not work in API 37+
 * Long-term solution: Make the app adaptive for tablets and large screens
 *
 * Reference: https://developer.android.com/about/versions/16/behavior-changes-16#large-screens-form-factors
 */
module.exports = function withAndroidLargeScreenCompat(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];

    // Initialize property array if it doesn't exist
    if (!application.property) {
      application.property = [];
    }

    // Check if property already exists to avoid duplicates
    const propertyExists = application.property.some(
      (prop) => prop.$?.['android:name'] === 'android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY'
    );

    if (!propertyExists) {
      // Add property for large screen compatibility opt-out
      application.property.push({
        $: {
          'android:name': 'android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY',
          'android:value': 'true'
        }
      });
    }

    return config;
  });
};
