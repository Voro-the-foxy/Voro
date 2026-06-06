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
  android: {
    // Allow the WebView (https://localhost) to call a cleartext HTTP backend
    // (http://<LAN IP>:8080); without this, mixed content is blocked.
    // (Cleartext itself is permitted separately in network_security_config.xml.)
    allowMixedContent: true,
  },
};

export default config;
