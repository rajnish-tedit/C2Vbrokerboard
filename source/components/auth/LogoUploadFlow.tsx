"use client";

import { Briefcase, CircleAlert, RotateCw, Trash2, Upload as UploadIcon, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg"];

function validate(file: File): string | null {
  if (!ACCEPT.includes(file.type)) return "Unsupported file type|Upload a PNG or JPG image.";
  if (file.size > MAX_BYTES) return "File too large|The maximum file size is 5 MB. Please choose a smaller image.";
  return null;
}

/* ------------------------------ Upload step ------------------------------ */

function UploadStep({
  onCancel,
  onNext,
}: {
  onCancel: () => void;
  onNext: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const err = validate(f);
    setError(err);
    setFile(err ? null : f);
  };
  const [errTitle, errBody] = (error ?? "").split("|");

  return (
    <Modal
      open
      onClose={onCancel}
      title="Upload from Device"
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="h-11 rounded-lg border border-brand-600 bg-white px-5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            Cancel
          </button>
          <button
            type="button"
            disabled={!file}
            onClick={() => file && onNext(file)}
            className="h-11 rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-200"
          >
            Upload
          </button>
        </div>
      }
    >
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Upload logo</p>
      <input
        ref={input}
        id="logo-file"
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <label
        htmlFor="logo-file"
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex min-h-[13rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          error ? "border-rose-300 bg-rose-50" : over ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100",
        )}
      >
        {error ? (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <CircleAlert className="h-5 w-5" aria-hidden="true" />
            </span>
            <span role="alert" className="text-base font-semibold text-rose-600">{errTitle}</span>
            <span className="max-w-xs text-sm text-rose-500">{errBody}</span>
            <span className="mt-1 text-[15px] font-medium text-navy-950">Choose another file or drag it here</span>
          </>
        ) : file ? (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <UploadIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="max-w-full truncate text-[15px] font-semibold text-navy-950">{file.name}</span>
            <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB · ready to crop</span>
            <span className="text-sm font-medium text-brand-700">Choose another file</span>
          </>
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
              <UploadIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-[15px] font-medium text-navy-950">Click to Upload or Drag &amp; Drop</span>
            <span className="text-sm text-slate-500">PNG, JPG - Max 5mb</span>
          </>
        )}
      </label>
    </Modal>
  );
}

/* ------------------------------- Crop step ------------------------------- */

const W = 480;
const H = 230;
const FW = 360;
const FH = 120;
const FX = (W - FW) / 2;
const FY = (H - FH) / 2;
const OUT_W = 600;
const OUT_H = 200;

function CropStep({
  src,
  onBack,
  onCancel,
  onDone,
}: {
  src: string;
  onBack: () => void;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const i = new window.Image();
    i.onload = () => setImg(i);
    i.src = src;
  }, [src]);

  const baseScale = useCallback(
    (i: HTMLImageElement) => {
      const swap = rot % 180 !== 0;
      const iw = swap ? i.height : i.width;
      const ih = swap ? i.width : i.height;
      return Math.min(FW / iw, FH / ih);
    },
    [rot],
  );

  const paint = useCallback(
    (ctx: CanvasRenderingContext2D, i: HTMLImageElement, cx: number, cy: number, k: number, ox: number, oy: number) => {
      ctx.save();
      ctx.translate(cx + ox * k, cy + oy * k);
      ctx.rotate((rot * Math.PI) / 180);
      const s = baseScale(i) * zoom * k;
      ctx.scale(s, s);
      ctx.drawImage(i, -i.width / 2, -i.height / 2);
      ctx.restore();
    },
    [rot, zoom, baseScale],
  );

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#b9bdc6";
    ctx.fillRect(0, 0, W, H);
    if (!img) return;
    paint(ctx, img, W / 2, H / 2, 1, off.x, off.y);
    ctx.fillStyle = "rgba(15,20,25,0.38)";
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.rect(FX, FY, FW, FH);
    ctx.fill("evenodd");
    ctx.strokeStyle = "#3E5C9E";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(FX, FY, FW, FH);
    ctx.fillStyle = "#3E5C9E";
    for (const [x, y] of [[FX, FY], [FX + FW, FY], [FX, FY + FH], [FX + FW, FY + FH]]) ctx.fillRect(x - 3, y - 3, 6, 6);
  }, [img, off, paint]);

  const crop = () => {
    if (!img) return;
    const out = document.createElement("canvas");
    out.width = OUT_W;
    out.height = OUT_H;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    paint(ctx, img, OUT_W / 2, OUT_H / 2, OUT_W / FW, off.x, off.y);
    onDone(out.toDataURL("image/png"));
  };

  const reset = () => {
    setZoom(1);
    setRot(0);
    setOff({ x: 0, y: 0 });
  };

  const tools = [
    { label: "Zoom In", icon: <ZoomIn className="h-4 w-4" />, run: () => setZoom((z) => Math.min(6, +(z * 1.2).toFixed(3))) },
    { label: "Zoom Out", icon: <ZoomOut className="h-4 w-4" />, run: () => setZoom((z) => Math.max(0.3, +(z / 1.2).toFixed(3))) },
    { label: "Rotate", icon: <RotateCw className="h-4 w-4" />, run: () => setRot((r) => (r + 90) % 360) },
    { label: "Reset", icon: <RefreshCw className="h-4 w-4" />, run: reset },
  ];

  return (
    <Modal
      open
      onClose={onCancel}
      size="lg"
      title="Crop Your Logo"
      footer={
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="text-sm font-semibold text-brand-700 hover:underline">Back</button>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="h-11 rounded-lg border border-brand-600 bg-white px-5 text-sm font-semibold text-brand-700 hover:bg-brand-50">Cancel</button>
            <button type="button" onClick={crop} disabled={!img} className="h-11 rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">Crop &amp; Continue</button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_9rem]">
        <canvas
          ref={canvas}
          width={W}
          height={H}
          aria-label="Logo crop area. Drag to reposition."
          className="h-auto w-full cursor-grab touch-none rounded-lg active:cursor-grabbing"
          onPointerDown={(e) => {
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            const c = canvas.current;
            if (!d || !c) return;
            const k = W / c.getBoundingClientRect().width;
            setOff({ x: d.ox + (e.clientX - d.x) * k, y: d.oy + (e.clientY - d.y) * k });
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        />
        <ul className="flex flex-row flex-wrap gap-3 md:flex-col md:justify-center">
          {tools.map((t) => (
            <li key={t.label}>
              <button type="button" onClick={t.run} className="flex items-center gap-3 text-sm font-medium text-navy-950 hover:text-brand-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600">{t.icon}</span>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs text-slate-500">Drag the image to position it inside the frame.</p>
    </Modal>
  );
}

/* --------------------------- Logo card + flow --------------------------- */

export function LogoField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (logo: string | null) => void;
}) {
  const [stage, setStage] = useState<"closed" | "upload" | "crop">("closed");
  const [src, setSrc] = useState<string | null>(null);

  const toCrop = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(String(reader.result));
      setStage("crop");
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <span className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-brand-600">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Company logo preview" className="h-full w-full object-contain p-1" />
          ) : (
            <Briefcase className="h-6 w-6" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-navy-950">Company logo</p>
          {value ? (
            <span className="mt-1 inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700">Logo Uploaded</span>
          ) : (
            <p className="mt-0.5 text-xs text-slate-500">PNG or JPG, up to 5 MB. A square image works best.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setStage("upload")} className="h-10 rounded-lg border border-brand-600 bg-white px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            {value ? "Change Logo" : "Choose logo"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} aria-label="Remove logo" className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {stage === "upload" && <UploadStep onCancel={() => setStage("closed")} onNext={toCrop} />}
      {stage === "crop" && src && (
        <CropStep
          src={src}
          onBack={() => setStage("upload")}
          onCancel={() => setStage("closed")}
          onDone={(url) => {
            onChange(url);
            setStage("closed");
          }}
        />
      )}
    </>
  );
}
