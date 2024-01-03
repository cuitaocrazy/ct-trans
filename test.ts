type BingCredentials = {
  ig: string;
  iid: string;
  key: number;
  token: string;
};

async function extractBingCredentials(): Promise<BingCredentials> {
  const url = "https://www.bing.com/translator";
  const igReg = /IG:"(.*?)"/;
  const iidReg = /<div id="rich_tta" data-iid="(.*?)"/;
  const otherParamsReg = /params_AbusePreventionHelper = (.*?);/;

  const req = await fetch(url);
  const text = await req.text();

  const ig = igReg.exec(text)![1];
  const iid = iidReg.exec(text)![1];
  const otherParams = JSON.parse(otherParamsReg.exec(text)![1]);

  console.log(otherParams);
  return {
    ig,
    iid,
    key: otherParams[0],
    token: otherParams[1],
  };
}

async function getTrans(text: string, bingCredentials: BingCredentials) {
  const { ig, iid, key, token } = bingCredentials;
  const url = `https://cn.bing.com/tlookupv3?isVertical=1&&IG=${ig}&IID=${iid}`;

  const req = await fetch(url, {
    method: "POST",
    body: `&from=en&to=zh-Hans&text=${text}&token=${token}&key=${key}`,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return req.text();
}

const bingCredentials = await extractBingCredentials();

console.log(bingCredentials);

for (let i = 0; i < 1; i++) {
  const text = "helloworld";
  const res = await getTrans(text, bingCredentials);
  console.log(res);
}

export {};
