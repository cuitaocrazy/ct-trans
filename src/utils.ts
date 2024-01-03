import type { TransContent } from "./types";

export async function readGoogleRpcStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const buffers: Uint8Array[] = [];

  while (true) {
    let result = await reader.read();
    if (result.done) break;
    buffers.push(result.value);
  }

  const totalLen = buffers.reduce((acc, cur) => acc + cur.length, 0);
  const buf = new Uint8Array(totalLen);
  let offset = 0;
  for (const b of buffers) {
    buf.set(b, offset);
    offset += b.length;
  }
  const decoder = new TextDecoder("utf-8");
  return JSON.parse(decoder.decode(buf.slice(4)));
}

export function generatorTransReqBody(text: string) {
  const params = [[text, "auto", "zh-CN", 1], []];
  const paramsStr = JSON.stringify(params);
  const payload = [[["MkEWBc", paramsStr, null, "generic"]]];
  return `f.req=${encodeURIComponent(JSON.stringify(payload))}`;
}

export function extractTrans(obj: any): TransContent {
  const transStr = obj[0][2] as string;
  const transObj = JSON.parse(transStr);
  const isSentence = transObj[0][5] === null;

  let trans;

  if (!isSentence) {
    trans = transObj[1][0][0][5][0][4].map((item: any) => item[0]);
  } else {
    trans = transObj[1][0][0][5].map((item: any) => item[0]);
  }
  return { isSentence, trans };
}

export async function getTrans(text: string) {
  const url = `https://translate.google.com/_/TranslateWebserverUi/data/batchexecute`;
  const req = await fetch(url, {
    method: "POST",
    credentials: "omit",
    body: generatorTransReqBody(text),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Referer: `https://translate.google.com/`,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
    },
  });

  return extractTrans(await readGoogleRpcStream(req.body!));
}

export function newPromise<T = unknown>() {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  // @ts-ignore
  return { promise, resolve, reject };
}
