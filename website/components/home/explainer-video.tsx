"use client";

import { useEffect, useRef, useState } from "react";

// The opening picture of the home page: the explainer video. It plays only
// when the reader starts it. Until then, the poster
// shows the full sale with its proofs, and the browser controls stay hidden so
// that they do not cover its caption.

const SRC = "/aip-explainer.mp4";

export function ExplainerVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  // The button goes away on play, so the focus moves to the video. The video
  // takes the focus only once it has its controls.
  useEffect(() => {
    if (started) video.current?.focus();
  }, [started]);

  function play() {
    setStarted(true);
    void video.current?.play();
  }

  return (
    <figure className="relative overflow-hidden rounded-md border border-line-control bg-canvas">
      <video
        ref={video}
        className="h-auto w-full"
        controls={started}
        preload="metadata"
        playsInline
        width={1920}
        height={1080}
        poster="/aip-explainer-poster.jpg"
        aria-label="Explainer, 1 minute 44 seconds: an AI agent helps Alice insure her cat with AIP"
      >
        <source src={SRC} type="video/mp4" />
        <a href={SRC}>Download the explainer video</a>
      </video>
      {!started && (
        <button
          type="button"
          className="group absolute inset-0 grid cursor-pointer place-items-center focus-visible:-outline-offset-4"
          onClick={play}
          aria-label="Play the explainer, 1 minute 44 seconds"
        >
          {/* The poster is white in both schemes, so the button stays dark on it. */}
          <span className="grid size-16 place-items-center rounded-full bg-ink text-canvas group-hover:bg-ink-muted dark:bg-canvas dark:text-ink dark:group-hover:bg-surface">
            <svg className="size-7 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
        </button>
      )}
    </figure>
  );
}
