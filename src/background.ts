import type { TransResult } from "./types";
import { getTrans } from "./utils";

chrome.runtime.onInstalled.addListener(async () => {
  const rules: chrome.declarativeNetRequest.Rule[] = [
    {
      id: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          {
            header: "Referer",
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            value: "https://translate.google.com/",
          },
        ],
      },
      condition: {
        domains: [chrome.runtime.id],
        urlFilter: "|https://translate.google.com/",
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
        ],
      },
    },
  ];
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map((r) => r.id),
    addRules: rules,
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "translate") return;

  getTrans(message.text)
    .then((trans) => {
      sendResponse({ success: "ok", result: trans } satisfies TransResult);
    })
    .catch((err) => {
      sendResponse({ success: "error", result: err } satisfies TransResult);
    });

  // 返回true以保持消息通道开放
  return true;
});

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  // console.log("Rule matched:", info);
});
