import { useEffect } from "react";
import { useCurrentFrame, useDelayRender } from "remotion";
import { KEEP_OUT } from "../config";

/**
 * Measurement only (inputProps.probe = true; see scripts/probe-layout.mjs). After layout it logs, per frame,
 * every visible scene element whose bounding box intersects a PiP keep-out zone. Not part of the video.
 */
export const LayoutProbe: React.FC = () => {
  const frame = useCurrentFrame();
  const { delayRender, continueRender } = useDelayRender();
  useEffect(() => {
    const handle = delayRender("layout-probe");
    document.fonts.ready.then(() =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const hits: Array<Record<string, unknown>> = [];
          const all = Array.from(document.body.querySelectorAll<Element>("*"));
          const effOpacity = (el: Element) => {
            let o = 1;
            for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
              const cs = getComputedStyle(n);
              if (cs.display === "none" || cs.visibility === "hidden") return 0;
              o *= parseFloat(cs.opacity);
            }
            return o;
          };
          const hasPaint = (el: Element, cs: CSSStyleDeclaration) => {
            const t = el.tagName.toLowerCase();
            if (["img", "video", "canvas"].includes(t)) return true;
            if (el instanceof SVGElement) return ["path", "circle", "rect", "line", "text", "polygon", "ellipse", "polyline", "image"].includes(t);
            for (const c of Array.from(el.childNodes)) if (c.nodeType === 3 && (c.textContent ?? "").trim()) return true;
            const bg = cs.backgroundColor;
            const m = bg.match(/rgba?\(([^)]+)\)/);
            const alpha = m ? (m[1].split(",").length === 4 ? parseFloat(m[1].split(",")[3]) : 1) : 0;
            if (alpha > 0.05) return true;
            if (cs.backgroundImage !== "none") return true;
            if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none") return true;
            return false;
          };
          for (const el of all) {
            if (el.closest("[data-pip]") || ["SCRIPT", "STYLE", "LINK", "META", "TITLE", "HEAD"].includes(el.tagName)) continue;
            const cs = getComputedStyle(el);
            if (!hasPaint(el, cs)) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 1 || r.height < 1) continue;
            if (r.width >= 1900 && r.height >= 1060) continue; // full-bleed background
            const inRight = r.right > KEEP_OUT.right.xMin && r.bottom > KEEP_OUT.right.yMin && r.left < 1920 && r.top < 1080;
            const inLeft = r.left < KEEP_OUT.left.xMax && r.bottom > KEEP_OUT.left.yMin && r.right > 0 && r.top < 1080;
            if (!inRight && !inLeft) continue;
            const o = effOpacity(el);
            if (o < 0.05) continue;
            const txt = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 48);
            const path: string[] = [];
            for (let n: Element | null = el; n && path.length < 4; n = n.parentElement) path.push(n.tagName.toLowerCase() + (n.getAttribute("data-probe") ? `#${n.getAttribute("data-probe")}` : ""));
            hits.push({ tag: el.tagName.toLowerCase(), txt, path: path.join("<"), l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), op: +o.toFixed(2), zone: `${inRight ? "R" : ""}${inLeft ? "L" : ""}` });
          }
          // eslint-disable-next-line no-console
          console.log("PROBE " + JSON.stringify({ frame, hits }));
          continueRender(handle);
        }),
      ),
    );
    return () => continueRender(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame]);
  return null;
};
