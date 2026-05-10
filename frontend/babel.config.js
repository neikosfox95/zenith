module.exports = function(api) {
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
    plugins: [
      // Required for expo-router file-based routing
      'expo-router/babel',
    ],
  };
};
