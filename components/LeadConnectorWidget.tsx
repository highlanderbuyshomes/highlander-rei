"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const IDLE_DELAY_MS = 3500;

export default function LeadConnectorWidget() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;

    const load = () => setShouldLoad(true);
    const timeout = window.setTimeout(load, IDLE_DELAY_MS);
    const options: AddEventListenerOptions = { once: true, passive: true };

    window.addEventListener("scroll", load, options);
    window.addEventListener("pointerdown", load, options);
    window.addEventListener("keydown", load, { once: true });

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("scroll", load);
      window.removeEventListener("pointerdown", load);
      window.removeEventListener("keydown", load);
    };
  }, [shouldLoad]);

  if (!shouldLoad) return null;

  return (
    <Script
      src="https://beta.leadconnectorhq.com/loader.js"
      data-resources-url="https://beta.leadconnectorhq.com/chat-widget/loader.js"
      data-widget-id="6a1d8016b2d4c061bc2c2164"
      strategy="lazyOnload"
    />
  );
}
