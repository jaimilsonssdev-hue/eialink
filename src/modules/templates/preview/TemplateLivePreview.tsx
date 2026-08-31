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
}: {
  template: TemplateDefinition;
  /** Visible height of the preview window, in px. */
  height?: number;
  frameWidth?: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const { bio, links, products } = useMemo(() => templateDemoContent(template), [template]);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;
    const update = () => {
      const width = element.clientWidth;
      if (width > 0) setScale(width / frameWidth);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [frameWidth]);

  return (
    <div
      ref={wrapperRef}
      className="template-live-preview"
      style={{ height }}
      aria-hidden="true"
      inert={"" as unknown as boolean}
    >
      <div
        className="template-live-preview-stage"
        style={{
          width: frameWidth,
          transform: `scale(${scale})`,
          height: scale > 0 ? height / scale : height,
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
  );
}
