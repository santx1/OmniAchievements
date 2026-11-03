import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.omniachievements.app',
  appName: 'OmniAchievements',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'OmniAchievements'
  }
};

export default config;
