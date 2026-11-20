"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { PageFlip } from "page-flip";
import { CoverPage } from "@/components/CoverPage";
import { PAGE_RATIO } from "@/lib/cover";
import type { CoverDetails } from "@/lib/cover";
import { downloadFlipbook } from "@/lib/downloadPdf";
import { renderPdfPages } from "@/lib/renderPdf";

const PAGE_CSS_WIDTH = 520;

type BookMountProps = {
  values: CoverDetails;
  onReady: (book: PageFlip | null) => void;
};

const BookMount = memo(function BookMount({ values, onReady }: BookMountProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [progress, setProgress] = useState({ done: 0, total: 17 });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let flip: PageFlip | null = null;
    let coverRoot: Root | null = null;

    const release = (book: PageFlip) => {
      const parent = host.parentElement;
      const next = host.nextSibling;
      book.destroy();
      if (parent && !host.isConnected) {
        parent.insertBefore(host, next);
      }
    };

    void (async () => {
      try {
        const [{ PageFlip }, canvases] = await Promise.all([
          import("page-flip"),
          renderPdfPages((done, total) => {
            if (!cancelled) setProgress({ done, total });
          }),
        ]);
        if (cancelled) return;

        const cover = document.createElement("div");
        cover.className = "sheet cover-sheet";
        coverRoot = createRoot(cover);
        coverRoot.render(<CoverPage values={values} />);

        const pages = canvases.map((canvas, index) => {
          const sheet = document.createElement("div");
          sheet.className = "sheet pdf-sheet";
          canvas.className = "pdf-canvas";
          canvas.setAttribute("aria-label", `Guide page ${index + 1}`);
          sheet.appendChild(canvas);
          return sheet;
        });

        const book = new PageFlip(host, {
          width: PAGE_CSS_WIDTH,
          height: Math.round(PAGE_CSS_WIDTH / PAGE_RATIO),
          size: "stretch",
          minWidth: 280,
          maxWidth: 560,
          minHeight: 400,
          maxHeight: 820,
          drawShadow: true,
          flippingTime: 700,
          usePortrait: true,
          showCover: false,
          mobileScrollSupport: false,
          useMouseEvents: true,
          showPageCorners: true,
          disableFlipByClick: false,
          maxShadowOpacity: 0.35,
          autoSize: true,
          clickEventForward: true,
          startPage: 0,
        });
        book.loadFromHTML([cover, ...pages]);

        if (cancelled) {
          coverRoot.unmount();
          coverRoot = null;
          release(book);
          return;
        }

        flip = book;
        onReady(book);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Could not open the guide");
      }
    })();

    return () => {
      cancelled = true;
      onReady(null);
      coverRoot?.unmount();
      coverRoot = null;
      if (flip) release(flip);
    };
  }, [onReady, values]);

  const loadingText =
    progress.done === 0
      ? "Opening the guide…"
      : `Drawing page ${progress.done} of ${progress.total}`;

  return (
    <div className={status === "ready" ? "book-frame" : "book-frame is-loading"}>
      <div ref={hostRef} className="book-host" />
      {status === "ready" ? null : (
        <div className="book-status" role="status">
          {status === "error" ? (
            <p>{message}</p>
          ) : (
            <>
              <p>{loadingText}</p>
              <div className="progress" aria-hidden="true">
                <span style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

function isSpread(book: PageFlip): boolean {
  const index = book.getCurrentPageIndex();
  const total = book.getPageCount();
  return book.getOrientation() === "landscape" && index + 1 < total;
}

function pageLabel(book: PageFlip): string {
  const index = book.getCurrentPageIndex();
  const total = book.getPageCount();
  return isSpread(book) ? `${index + 1}–${index + 2} / ${total}` : `${index + 1} / ${total}`;
}

export function Flipbook() {
  const valuesRef = useRef<CoverDetails>({
    name: "",
    date: "",
    intention: "",
    note: "",
  });
  const bookRef = useRef<PageFlip | null>(null);
  const [ready, setReady] = useState(false);
  const [label, setLabel] = useState("1–2 / 18");
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const sync = useCallback((book: PageFlip) => {
    const index = book.getCurrentPageIndex();
    const total = book.getPageCount();
    const spread = isSpread(book);
    setLabel(pageLabel(book));
    setAtStart(index <= 0);
    setAtEnd(total === 0 || (spread ? index + 1 >= total - 1 : index >= total - 1));
  }, []);

  const onReady = useCallback(
    (book: PageFlip | null) => {
      bookRef.current = book;
      if (!book) {
        setReady(false);
        return;
      }

      const update = () => sync(book);
      book.on("flip", update);
      book.on("init", update);
      setReady(true);
      update();
    },
    [sync],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (event.key === "ArrowRight") bookRef.current?.flipNext("top");
      if (event.key === "ArrowLeft") bookRef.current?.flipPrev("top");
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const download = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadFlipbook(valuesRef.current);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="reader" aria-label="Flipbook">
      <BookMount values={valuesRef.current} onReady={onReady} />
      <div className="toolbar">
        <button type="button" onClick={() => bookRef.current?.flipPrev("top")} disabled={!ready || atStart}>
          Previous
        </button>
        <span className="page-label" aria-live="polite">
          {label}
        </span>
        <button type="button" onClick={() => bookRef.current?.flipNext("top")} disabled={!ready || atEnd}>
          Next
        </button>
        <button type="button" className="download" onClick={download} disabled={downloading}>
          {downloading ? "Preparing PDF…" : "Download PDF"}
        </button>
      </div>
      <p className="hint">
        Type on the cover. Turn pages with the buttons, the page corners, or the arrow keys.
      </p>
      {downloadError ? <p className="error">{downloadError}</p> : null}
    </section>
  );
}
