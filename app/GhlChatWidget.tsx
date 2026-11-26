"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

// Public-site chat bubble. Kept off /admin: it's a heavy third-party script
// and it floated over the admin UI.
export default function GhlChatWidget() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return (
    <Script
      src="https://widgets.leadconnectorhq.com/loader.js"
      data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
      data-widget-id="6a5162fca126fb924dded5a7"
      data-source="WEB_USER"
      strategy="lazyOnload"
    />
  );
}
