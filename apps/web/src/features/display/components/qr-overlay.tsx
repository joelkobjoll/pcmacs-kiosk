import { QRCodeSVG } from 'qrcode.react';

interface QrOverlayProps {
  url: string;
}

/**
 * Semi-transparent QR code badge shown in the bottom-right corner of a slide.
 * Lets passersby scan and visit the linked URL on their phone.
 */
export function QrOverlay({ url }: QrOverlayProps) {
  return (
    <div className="absolute bottom-6 right-6 flex flex-col items-center gap-2 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-xl">
      <QRCodeSVG value={url} size={96} bgColor="transparent" fgColor="#111827" />
      <span className="text-[10px] font-semibold text-neutral-700 tracking-wide uppercase">
        Scan to visit
      </span>
    </div>
  );
}
