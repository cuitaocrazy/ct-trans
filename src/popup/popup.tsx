import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

function getCurrentTab() {
  return new Promise<chrome.tabs.Tab>((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

const test = `Focused on web standards and modern web app UX, you’re simply going to build better websites
Remix is a full stack web framework that lets you focus on the user interface and work back through web standards to deliver a fast, slick, and resilient user experience. People are gonna love using your stuff.`;

function App() {
  const [tab, setTab] = useState<chrome.tabs.Tab | undefined>(undefined);
  const [trans, setTrans] = useState<any>({ trans: [] });
  useEffect(() => {
    getCurrentTab().then(setTab);
  }, []);
  return (
    <div className="bg-red-400">
      <div>{tab?.title ?? -1}</div>
      <button
        onClick={() => {
          chrome.runtime.sendMessage(
            {
              type: "translate",
              text: test,
            },
            (trans) => {
              console.log(trans);
              setTrans(trans.result);
            }
          );
        }}
      >
        send message
      </button>
      <div>{trans.trans.join("")}</div>
    </div>
  );
}

const container = document.getElementById("root");

const root = createRoot(container!);
root.render(<App />);
