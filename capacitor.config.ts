import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.corjl.fabricon',
  appName: 'Fabricon',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 3000,
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#1e1e1e',
      overlaysWebView: true,
    },
    Camera: {
      presentationStyle: 'popover',
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    captureInput: true,
  },
}

export default config
