module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // FIX: Transform import.meta for Expo SDK 53+
          unstable_transformImportMeta: true,
        },
      ],
    ],
    // FIX: `"expo-router/babel"` used to be listed here. In Expo SDK 50+ that
    // module is an empty stub whose only job is to print
    //   "expo-router/babel is deprecated in favor of babel-preset-expo"
    // once per bundle. The real router transform now lives inside
    // babel-preset-expo (build/expo-router-plugin.js), so keeping the stub only
    // added warning noise to every Metro build and made it harder to spot real
    // problems in the logs.
    plugins: [],
  };
};
