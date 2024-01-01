import { createRoot } from "react-dom/client";
import { newPromise } from "../utils";
import { useEffect, useState } from "react";
console.log("ct-trans loading...");

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function App(props: { p: Promise<string> }) {
  const [text, setText] = useState("");

  useEffect(() => {
    props.p.then((res) => {
      setText(res);
    });
  });

  return <div className="fixed top-0">{text}</div>;
}

function createBubble(promise: Promise<string>) {
  const container = document.createElement("div");

  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<App p={promise} />);

  return () => {
    root.unmount();
    document.body.removeChild(container);
  };
}

let clean: (() => void) | null = null;

window.addEventListener("mouseup", (evt) => {
  setTimeout(() => {
    const selectedText = window.getSelection()?.toString().trim();

    console.log("mouseup", selectedText);

    if (selectedText && selectedText.length > 0) {
      const p = newPromise<string>();
      chrome.runtime.sendMessage(
        { type: "translate", text: selectedText },
        (res) => {
          if (res.success === "ok") {
            console.log(res.result.trans.join(""));
            p.resolve(res.result.trans.join(""));
          }
        }
      );
      if (clean) clean();
      clean = createBubble(p.promise);
    } else if (clean) {
      clean();
      clean = null;
    }
  }, 10);
});
