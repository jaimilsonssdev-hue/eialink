import { useEffect, useMemo, useRef, useState } from "react";
import { TemplateRenderer } from "../components/TemplateRenderer";
import type { TemplateDefinition } from "../types";
import { templateDemoContent } from "./demoContent";

const FRAME_WIDTH = 390;

/**
 * Renders the real public-page engine with demo content, scaled down to fit the
 * gallery card. Purely visual: no tracking, no navigation, not focusable.
 */
export function TemplateLivePreview({
  template,
  height = 320,
  frameWidth = FRAME_WIDTH,
  scrollable = false,
}: {
  template: TemplateDefinition;
  /** Visible height of the preview window, in px. */
  height?: number;
  frameWidth?: number;
  scrollable?: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(height);
  const { bio, links, products } = useMemo(() => templateDemoContent(template), [template]);

  // Mede a largura real disponível. Dentro de janelas animadas (dialog) a
  // largura pode ser 0 no primeiro frame: nesse caso tentamos novamente.
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      const width = element.getBoundingClientRect().width;
      if (width > 0) {
        setScale(Math.min(1, width / frameWidth));
      } else {
        frame = requestAnimationFrame(update);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [frameWidth]);

  // Acompanha a altura real do conteúdo para a rolagem ficar correta.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => setContentHeight(stage.scrollHeight || height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [height, template]);

  return (
    <div
      ref={wrapperRef}
      className={`template-live-preview${scrollable ? " is-scrollable" : ""}`}
      style={{ height }}
      aria-hidden="true"
      inert
    >
      <div
        style={{
          height: scrollable ? Math.max(height, contentHeight * scale) : height,
          position: "relative",
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          ref={stageRef}
          className="template-live-preview-stage"
          style={{
            width: frameWidth,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            margin: "0 auto",
            ...(scrollable ? {} : { minHeight: scale > 0 ? height / scale : height }),
          }}
        >
          <TemplateRenderer
            bio={bio}
            links={links}
            products={products}
            onTrack={() => {}}
            onShare={() => {}}
            motionLevel="off"
          />
        </div>
      </div>
    </div>
  );
}
