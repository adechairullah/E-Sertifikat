import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { CertificateTemplate, CertificateData } from '../types';
import QRCode from 'qrcode';

interface Props {
  template: CertificateTemplate;
  data: Partial<CertificateData>;
  scale?: number;
  className?: string;
  style?: React.CSSProperties; // Allow custom styles
}

export interface CertificateRendererHandle {
  toDataURL: () => string;
  getCanvas: () => HTMLCanvasElement | null;
}

const CertificateRenderer = forwardRef<CertificateRendererHandle, Props>(({ template, data, scale = 1, className, style }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL('image/png') || '',
    getCanvas: () => canvasRef.current
  }));

  // Helper to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ');
      let line = '';
      let lines = [];

      for(let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
          } else {
              line = testLine;
          }
      }
      lines.push(line);

      // Draw lines
      lines.forEach((l, index) => {
          ctx.fillText(l.trim(), x, y + (index * lineHeight));
      });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    // Do NOT set crossOrigin for Data URIs (Base64), as it can cause tainted canvas errors in some environments
    if (!template.backgroundImage.startsWith('data:')) {
        img.crossOrigin = "anonymous";
    }
    
    img.src = template.backgroundImage;

    img.onload = async () => {
      // Set canvas size to match image dimensions multiplied by scale (Resolution)
      canvas.width = template.width * scale;
      canvas.height = template.height * scale;

      // Draw background
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw Fields
      for (const field of template.fields) {
        let text = '';
        
        // Map keys to data
        if (field.key === 'recipientName') text = data.recipientName || 'Recipient Name';
        else if (field.key === 'recipientRole') text = data.recipientRole || 'Peserta';
        else if (field.key === 'eventName') text = data.eventName || 'Event Name';
        else if (field.key === 'issueDate') {
            const dateVal = data.issueDate ? new Date(data.issueDate) : new Date();
            const lang = data.language || 'EN';
            // Format date based on language
            text = dateVal.toLocaleDateString(lang === 'ID' ? 'id-ID' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        else if (field.key === 'certificateNumber') text = data.certificateNumber || 'NO-000000';
        else if (field.key === 'customText') text = data.customText || (data.language === 'ID' ? 'Atas kontribusi yang luar biasa' : 'For outstanding contribution');
        else if (field.key === 'qr_verification') {
            // Special handling for QR
            // Points to the public verification URL
            const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'https://certitrust.demo';
            const verifyUrl = `${origin}/#/verify/${data.certificateNumber || 'demo'}`;
            try {
                const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, errorCorrectionLevel: 'M' });
                const qrImg = new Image();
                qrImg.src = qrDataUrl;
                await new Promise((resolve) => { qrImg.onload = resolve; });
                
                // Refined QR Scaling:
                // Use a consistent multiplier (4x) relative to the fontSize slider (10-120).
                const baseSize = field.fontSize * 4;
                const size = baseSize * scale;
                
                const xPos = (field.x / 100) * canvas.width;
                const yPos = (field.y / 100) * canvas.height;
                
                // Centering QR logic based on alignment
                let drawX = xPos;
                if (field.align === 'center') drawX = xPos - size / 2;
                if (field.align === 'right') drawX = xPos - size;

                ctx.drawImage(qrImg, drawX, yPos, size, size);
            } catch (e) {
                console.error("QR Error", e);
            }
            continue; // Skip text drawing for QR
        } else {
             text = field.label; // Fallback for static labels if we had them
        }

        // Font Setup
        const scaledFontSize = field.fontSize * scale;
        ctx.font = `${field.fontWeight} ${scaledFontSize}px ${field.fontFamily}, sans-serif`;
        ctx.fillStyle = field.color;
        ctx.textAlign = field.align;
        ctx.textBaseline = 'top';

        const x = (field.x / 100) * canvas.width;
        const y = (field.y / 100) * canvas.height;

        // Specialized Rendering for Event Name (Multi-line)
        if (field.key === 'eventName') {
            // Assume max width is 80% of canvas if centered, or logic based on alignment
            let maxWidth = canvas.width * 0.8; 
            if (field.align !== 'center') maxWidth = canvas.width * 0.6;
            
            const lineHeight = scaledFontSize * 1.2;
            wrapText(ctx, text, x, y, maxWidth, lineHeight);
        } else {
            ctx.fillText(text, x, y);
        }
      }
    };
  }, [template, data, scale]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`shadow-lg border border-slate-200 rounded-sm ${className}`}
      style={{ 
        maxWidth: '100%', 
        height: 'auto', 
        ...style 
      }}
    />
  );
});

export default CertificateRenderer;