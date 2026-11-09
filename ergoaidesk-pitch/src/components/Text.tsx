import React, { useEffect, useRef } from "react";
import { useDelayRender } from "remotion";
import { COLORS, MIN_FONT } from "../config";
import { BODY, HEADING } from "../lib/fonts";

type Props = {
  size?: number;
  font?: "body" | "heading";
  weight?: number;
  color?: string;
  /** Hard limit. The render throws if the text wraps to more lines than this. */
  maxLines?: number;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * The only way text enters the video. Enforces: font size >= MIN_FONT (44 px) and
 * a maximum line count (default 2), measured on the real laid-out element.
 */
export const T: React.FC<Props> = ({
  size = MIN_FONT,
  font = "body",
  weight,
  color = COLORS.white,
  maxLines = 2,
  align = "left",
  lineHeight,
  style,
  children,
}) => {
  if (size < MIN_FONT) throw new Error(`Text size ${size}px is below the ${MIN_FONT}px minimum`);
  const lh = lineHeight ?? (font === "heading" ? 1.1 : 1.22);
  const ref = useRef<HTMLDivElement>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const realised = (el: HTMLElement) => {
    for (let n: HTMLElement | null = el; n; n = n.parentElement) {
      if (n.offsetWidth === 0 || n.offsetHeight === 0) return false;
    }
    return true;
  };
  // Measure the real laid-out text once fonts are ready and the container has its size.
  // Holds the frame (delayRender) until measured; fails the render (cancelRender) on overflow.
  useEffect(() => {
    const handle = delayRender(`text-guard: ${String(children).slice(0, 40)}`);
    let tries = 0;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        continueRender(handle);
      }
    };
    const check = () => {
      const el = ref.current;
      if (!el) return finish();
      if (!realised(el) && tries++ < 120) {
        requestAnimationFrame(check);
        return;
      }
      if (realised(el)) {
        const lines = Math.round(el.offsetHeight / (size * lh));
        if (lines > maxLines) {
          cancelRender(
            new Error(
              `Text wraps to ${lines} lines (max ${maxLines}): "${el.textContent?.slice(0, 80)}" ` +
                `(w ${el.offsetWidth}px, line ${(size * lh).toFixed(1)}px)`,
            ),
          );
        }
      }
      finish();
    };
    document.fonts.ready.then(() => requestAnimationFrame(check));
    return finish;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, size, maxLines, lh]);
  return (
    <div
      ref={ref}
      style={{
        fontFamily: font === "heading" ? HEADING : BODY,
        fontWeight: weight ?? (font === "heading" ? 700 : 400),
        fontSize: size,
        lineHeight: lh,
        color,
        textAlign: align,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
