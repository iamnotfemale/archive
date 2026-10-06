import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 이 사이트의 정식 주소는 me.yeoziphab.com. 예전 주소(www / apex)로 오면 그대로 넘깁니다.
      { source: "/:path*", has: [{ type: "host", value: "www.yeoziphab.com" }], destination: "https://me.yeoziphab.com/:path*", permanent: true },
      { source: "/:path*", has: [{ type: "host", value: "yeoziphab.com" }], destination: "https://me.yeoziphab.com/:path*", permanent: true },
      // 디자인의 /work 는 사이트에서 /portfolio 로 부릅니다.
      { source: "/work", destination: "/", permanent: true },
      { source: "/work/:slug", destination: "/portfolio/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
