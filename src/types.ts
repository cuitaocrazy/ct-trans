export type TransContent = {
  isSentence: boolean;
  trans: string[];
};

export type TransResult =
  | {
      success: "ok";
      result: TransContent;
    }
  | {
      success: "error";
      result: any;
    };
