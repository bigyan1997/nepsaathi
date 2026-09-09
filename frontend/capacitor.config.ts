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
      serverClientId: "821160570278-3888u1qfkqv316m7v1q3d2f0h0upe6fs.apps.googleusercontent.com",
    },
  },
};

export default config;
