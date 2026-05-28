import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.voro.app",
  appName: "Voro",
  webDir: "dist",
  server: {
    // 개발 중 로컬 dev 서버를 바라볼 때만 아래 주석을 해제하세요.
    // url: "http://192.168.x.x:5173",
    // cleartext: true,
  },
};

export default config;
