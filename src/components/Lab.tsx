"use client";

import { useState } from "react";
import { lab } from "@/content/lab";
import Nav from "./Nav";
import Dither from "./Dither";
import Footer from "./Footer";
import { SearchOverlay } from "./Overlays";

const pad = (n: number) => String(n + 1).padStart(2, "0");

export default function Lab({ writable }: { writable: boolean }) {
  const [search, setSearch] = useState(false);
  return (
    <div id="top">
      <section className="w-hero">
        <Nav onSearch={() => setSearch(true)} writable={writable} />
        <Dither shape="flask" size={88} className="w-canvas flask" />
        <div className="w-title">
          <div className="kicker">03 — {lab.length} experiments, all live</div>
          <h1>
            Lab<span style={{ color: "var(--ac)" }}>.</span>
            <br />
            <span className="sub">
              Vibe-coded in a sitting,
              <br />
              one subdomain each.
            </span>
          </h1>
        </div>
      </section>
      <div className="wrap">
        <div className="g12 sec-head soft">
          <div className="c3">
            <span className="sec-no">03</span>
            <span className="sec-title">Lab</span>
          </div>
          <div className="c9 sec-note">Small tools, built fast and left running · click any to open</div>
        </div>
        <div className="lab-grid">
          {lab.map((x, i) => (
            <a key={x.host} href={`https://${x.host}`} target="_blank" rel="noreferrer" className="lab-card">
              <div className="lab-frame">
                <div className="lab-chrome">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                  <span className="host">{x.host}</span>
                  <span className="arrow">↗</span>
                </div>
                <div className="lab-tile">
                  <span className="name">
                    {x.name}
                    <span style={{ color: "var(--ac)" }}>.</span>
                  </span>
                  <span className="stack">{x.stack}</span>
                  <span className="sq" />
                </div>
              </div>
              <div className="lab-title">
                <span className="mute">{pad(i)}</span>
                <span className="t">{x.title}</span>
                <span className="mute">{x.date}</span>
              </div>
              <div className="lab-meta">
                <span />
                <div>
                  <p>{x.desc}</p>
                  <div className="host">
                    {x.host} <span className="mute">· built in {x.built}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
      <Footer />
      {search && <SearchOverlay onClose={() => setSearch(false)} />}
    </div>
  );
}
