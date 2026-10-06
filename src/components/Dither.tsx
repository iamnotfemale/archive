"use client";

import { useEffect, useRef } from "react";

export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Each shape maps (u,v) in [-1,1]² to a surface normal, or null outside the silhouette. */
export const SHAPES: Record<string, (u: number, v: number) => [number, number, number] | null> = {
  circle: (u, v) => (u * u + v * v <= 0.92 ? [u, v, Math.sqrt(1 - u * u - v * v)] : null),
  square: (u, v) => (Math.abs(u) <= 0.86 && Math.abs(v) <= 0.86 ? [u, v, 0.55 + (u - v) * 0.22] : null),
  // isometric cube: hexagon silhouette; top rhombus + left and right faces, each with a flat normal
  cube: (u, v) => {
    const x = u / 0.9;
    const y = v / 0.9;
    const ax = Math.abs(x) / 0.866;
    if (ax > 1) return null;
    const top = -1 + ax * 0.5;
    const bot = 1 - ax * 0.5;
    if (y < top || y > bot) return null;
    if (y < -ax * 0.5) return [0, -0.75, 0.66]; // top face
    return x < 0 ? [-0.7, 0.3, 0.65] : [0.7, 0.3, 0.65]; // left / right face
  },
};

/** Shared, lazily-smoothed mouse position in [0,1] — lights every dithered shape on the page. */
const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, bound: false };
function bindMouse() {
  if (mouse.bound || typeof window === "undefined") return;
  mouse.bound = true;
  window.addEventListener("mousemove", (e) => {
    mouse.tx = e.clientX / innerWidth;
    mouse.ty = e.clientY / innerHeight;
  });
}

/** Bayer-dithered 3D-lit shape (circle / square), or a dithered image (src), 72–112px grid upscaled with pixelated rendering. */
export default function Dither({ shape = "circle", src, size = 72, className }: { shape?: "circle" | "square" | "cube"; src?: string; size?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    bindMouse();
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d")!;
    const N = cv.width;
    let img: Uint8ClampedArray | null = null;
    if (src) {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement("canvas");
        c.width = c.height = N;
        const cg = c.getContext("2d")!;
        cg.drawImage(im, 0, 0, N, N);
        img = cg.getImageData(0, 0, N, N).data;
      };
      im.src = src;
    }
    let raf = 0;
    const out = g.createImageData(N, N);
    const d = out.data;
    const f = SHAPES[shape];
    const loop = () => {
      raf = requestAnimationFrame(loop);
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      const r = cv.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const t = performance.now() / 4000;
      if (src) {
        if (!img) return;
        const ts = performance.now() / 1500;
        for (let j = 0; j < N; j++)
          for (let i = 0; i < N; i++) {
            const o = (j * N + i) * 4;
            if (img[o + 3] / 255 < 0.35) {
              d[o + 3] = 0;
              continue;
            }
            const lum = (img[o] * 0.3 + img[o + 1] * 0.59 + img[o + 2] * 0.11) / 255;
            const u = i / N - 0.5;
            const v = j / N - 0.5;
            const light = 1 + (u * (mouse.x - 0.5) + v * (mouse.y - 0.5)) * 0.8;
            const shimmer = Math.sin(i * 0.3 + ts) * Math.cos(j * 0.25 - ts) * 0.06;
            const on = (lum * 0.75 + 0.1) * light + shimmer > (BAYER[(j % 4) * 4 + (i % 4)] + 0.5) / 16;
            d[o] = d[o + 1] = d[o + 2] = on ? 242 : 11;
            d[o + 3] = 255;
          }
      } else {
        const lx = (mouse.x - 0.5) * 1.6;
        const ly = (mouse.y - 0.5) * 1.6;
        const lz = 0.8;
        const ln = Math.hypot(lx, ly, lz);
        for (let j = 0; j < N; j++)
          for (let i = 0; i < N; i++) {
            const u = ((i + 0.5) / N) * 2 - 1;
            const v = ((j + 0.5) / N) * 2 - 1;
            const o = (j * N + i) * 4;
            const nrm = f(u, v);
            if (!nrm) {
              d[o + 3] = 0;
              continue;
            }
            const nl = Math.hypot(nrm[0], nrm[1], nrm[2]);
            const s = Math.max(0, (nrm[0] * lx + nrm[1] * ly + nrm[2] * lz) / (ln * nl));
            const noise = Math.sin(u * 9 + t) * Math.cos(v * 9 - t) * 0.12;
            const on = Math.pow(s, 1.4) * 0.9 + noise + 0.08 > (BAYER[(j % 4) * 4 + (i % 4)] + 0.5) / 16;
            d[o] = d[o + 1] = d[o + 2] = on ? 242 : 11;
            d[o + 3] = 255;
          }
      }
      g.putImageData(out, 0, 0);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [shape, src]);
  return <canvas ref={ref} width={size} height={size} className={className} />;
}
