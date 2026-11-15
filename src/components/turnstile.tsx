"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";

type OpsiRender = {
  sitekey: string;
  appearance?: "always" | "execute" | "interaction-only";
  size?: "normal" | "flexible" | "compact";
  theme?: "auto" | "light" | "dark";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  "error-callback"?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opsi: OpsiRender) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const KUNCI_SITUS = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

let janjiSkrip: Promise<void> | null = null;

function muatSkrip(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!janjiSkrip) {
    janjiSkrip = new Promise<void>((selesai, gagal) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = () => selesai();
      s.onerror = () => {
        janjiSkrip = null;
        s.remove();
        gagal(new Error("Skrip Turnstile gagal dimuat"));
      };
      document.head.appendChild(s);
    });
  }
  return janjiSkrip;
}

export type TurnstileHandle = { reset: () => void };

type Props = {
  onToken: (token: string | null) => void;
  tampilan?: "always" | "interaction-only";
  ref?: React.Ref<TurnstileHandle>;
};

export function Turnstile({ onToken, tampilan = "always", ref }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  const idWidget = useRef<string | null>(null);
  const saatToken = useRef(onToken);
  const [galat, setGalat] = useState(
    KUNCI_SITUS ? "" : "Kunci Turnstile belum diatur (NEXT_PUBLIC_TURNSTILE_SITE_KEY).",
  );

  useEffect(() => {
    saatToken.current = onToken;
  }, [onToken]);

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        saatToken.current(null);
        if (idWidget.current && window.turnstile) window.turnstile.reset(idWidget.current);
      },
    }),
    [],
  );

  useEffect(() => {
    if (!KUNCI_SITUS) return;
    let batal = false;

    muatSkrip()
      .then(() => {
        const el = wadah.current;
        if (batal || !el) return;
        if (!window.turnstile) {
          setGalat("Verifikasi keamanan gagal dimuat. Muat ulang halaman.");
          return;
        }
        idWidget.current = window.turnstile.render(el, {
          sitekey: KUNCI_SITUS,
          appearance: tampilan,
          size: "flexible",
          theme: "auto",
          callback: (t) => {
            setGalat("");
            saatToken.current(t);
          },
          "expired-callback": () => saatToken.current(null),
          "timeout-callback": () => saatToken.current(null),
          "error-callback": () => {
            saatToken.current(null);
            setGalat("Verifikasi keamanan gagal dimuat. Muat ulang halaman.");
          },
        });
      })
      .catch(() => {
        if (!batal) {
          setGalat("Verifikasi keamanan gagal dimuat. Periksa koneksi lalu muat ulang halaman.");
        }
      });

    return () => {
      batal = true;
      if (idWidget.current && window.turnstile) window.turnstile.remove(idWidget.current);
      idWidget.current = null;
      saatToken.current(null);
    };
  }, [tampilan]);

  return (
    <div>
      <div ref={wadah} />
      {galat && (
        <p role="alert" className="text-destructive text-xs">
          {galat}
        </p>
      )}
    </div>
  );
}