import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.voro.app",
  appName: "Voro",
  webDir: "dist",
  server: {
    // Uncomment only when pointing at a local dev server during development.
    // url: "http://192.168.x.x:5173",
    // cleartext: true,
  },
  android: {},
};

export default config;
