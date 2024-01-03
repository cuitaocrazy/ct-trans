import { createRoot } from "react-dom/client";
import { newPromise } from "../utils";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TransResult } from "../types";
console.log("ct-trans loading...");

function getTransUI(transResult: TransResult) {
  if (transResult.success === "error") {
    return <div>error</div>;
  }

  if (transResult.result.isSentence) {
    return <pre className="text-wrap">{transResult.result.trans.join("")}</pre>;
  }

  return (
    <div>
      {transResult.result.trans.map((item, index) => {
        return <div key={index}>{item}</div>;
      })}
    </div>
  );
}

function TansPanel(props: {
  translatePromise: Promise<TransResult>;
  isSentence: boolean;
  rect: DOMRect;
}) {
  const [transResult, setTransResult] = useState<TransResult | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    props.translatePromise.then((transContent) => {
      setTransResult(transContent);
    });
  });

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.bottom = `${
        window.innerHeight - props.rect.top - window.scrollY
      }px`;

      if (props.rect.x + props.rect.width / 2 > window.innerWidth / 2) {
        ref.current.style.right = `${window.innerWidth - props.rect.right}px`;
      } else {
        ref.current.style.left = `${props.rect.left}px`;
      }
    }
  }, [ref.current]);

  const child = transResult ? getTransUI(transResult) : <div>loading...</div>;

  return (
    <div
      ref={ref}
      className="absolute bg-slate-100 px-2 py-4 rounded shadow z-30"
    >
      {child}
    </div>
  );
}

function createBubble(
  promise: Promise<TransResult>,
  selectedRect: DOMRect,
  isSentence: boolean
) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(
    <TansPanel
      translatePromise={promise}
      rect={selectedRect}
      isSentence={isSentence}
    />
  );

  return () => {
    root.unmount();
    document.body.removeChild(container);
  };
}

let clean: (() => void) | null = null;
let timeoutId: number | null = null;

window.addEventListener("mouseup", () => {
  if (clean) {
    clean();
    clean = null;
  }

  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  setTimeout(() => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const selectedText = selection.toString().trim();
    const selectedRange = selection.getRangeAt(0);
    const selectedRect = selectedRange.getBoundingClientRect();

    if (selectedText && selectedText.length > 0) {
      const p = newPromise<TransResult>();
      chrome.runtime.sendMessage(
        { type: "translate", text: selectedText },
        p.resolve
      );

      const isWord = /^[a-zA-Z]+$/.test(selectedText);

      timeoutId = setTimeout(() => {
        clean = createBubble(p.promise, selectedRect, !isWord);
      }, 200) as unknown as number;
    }
  }, 10);
});
