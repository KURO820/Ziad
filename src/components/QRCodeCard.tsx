import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export function QRCodeCard({ token, size = 200 }: { token: string; size?: number }) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(token, {
      width: size,
      margin: 1,
      color: { dark: '#102a43', light: '#ffffff' },
    }).then(setSrc).catch(() => {});
  }, [token, size]);

  return (
    <div className="flex flex-col items-center">
      {src ? (
        <div className="p-3 bg-white rounded-2xl border border-navy-100 shadow-sm">
          <img src={src} alt="QR Code" width={size} height={size} className="rounded-lg" />
        </div>
      ) : (
        <div style={{ width: size, height: size }} className="rounded-2xl shimmer-bg" />
      )}
      <p className="text-xs text-navy-400 mt-3 font-mono break-all max-w-[200px] text-center">{token}</p>
    </div>
  );
}
