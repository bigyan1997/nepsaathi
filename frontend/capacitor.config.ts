import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nepsaathi.app",
  appName: "NepSaathi",
  webDir: "dist",
  server: {
    url: "https://www.nepsaathi.com",
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#ffffff",
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "496474413327-stsoi3lvg6te5t3mb89dh4494j1kdjhn.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
