"use client";

import { useEffect, useRef, useState } from "react";

type AdSlotName =
  | "native-banner"
  | "banner-468x60"
  | "banner-300x250"
  | "banner-160x300"
  | "banner-160x600"
  | "banner-320x50"
  | "banner-728x90";

const AD_SIZES: Record<AdSlotName, { width: number; height: number; label: string }> = {
  "native-banner": { width: 728, height: 180, label: "Native Banner" },
  "banner-468x60": { width: 468, height: 60, label: "Banner 468x60" },
  "banner-300x250": { width: 300, height: 250, label: "Banner 300x250" },
  "banner-160x300": { width: 160, height: 300, label: "Banner 160x300" },
  "banner-160x600": { width: 160, height: 600, label: "Banner 160x600" },
  "banner-320x50": { width: 320, height: 50, label: "Banner 320x50" },
  "banner-728x90": { width: 728, height: 90, label: "Banner 728x90" },
};

export function AdSlot({
  name,
  className = "",
  eager = false,
}: {
  name: AdSlotName;
  className?: string;
  eager?: boolean;
}) {
  const ad = AD_SIZES[name];
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type !== "adsterra-slot-filled" || event.data?.slot !== name) return;
      setFilled(true);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [name]);

  return (
    <div
      className={`mx-0 flex max-w-full justify-center overflow-hidden sm:mx-auto ${className}`}
      aria-label={ad.label}
      data-ad-filled={filled ? "true" : "false"}
      style={{ width: "100%", maxWidth: ad.width, minHeight: ad.height }}
    >
      <iframe
        ref={iframeRef}
        title={ad.label}
        src={`/ads/${name}.html`}
        width={ad.width}
        height={ad.height}
        loading={eager ? "eager" : "lazy"}
        scrolling="no"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer-when-downgrade"
        style={{ maxWidth: "calc(100vw - 2rem)" }}
        className="max-w-full border-0 bg-transparent"
      />
    </div>
  );
}

export function StickyTopAd() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="sticky top-16 z-40 my-6 py-2">
      <div className="relative mx-auto flex max-w-4xl justify-center pr-9">
        <AdSlot name="banner-320x50" eager />
          <button
            type="button"
            aria-label="Close advertisement"
            onClick={() => setDismissed(true)}
            className="absolute right-0 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/95 text-xs text-muted-foreground shadow-sm hover:text-foreground"
          >
            x
          </button>
      </div>
    </div>
  );
}

export function NativeContentAd() {
  return <AdSlot name="native-banner" className="my-10" />;
}

export function SidebarAds() {
  return (
    <div className="hidden xl:block">
      <AdSlot name="banner-160x600" />
    </div>
  );
}
