
declare module 'papaparse' {
  export function parse<T>(
    input: string | File,
    config?: ParseConfig<T>
  ): ParseResult<T>;

  export interface ParseConfig<T> {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    trimHeaders?: boolean;
    dynamicTyping?: boolean | ((field: string | number) => boolean);
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    step?: (results: ParseResult<T>, parser: Parser) => void;
    complete?: (results: ParseResult<T>, file?: File) => void;
    error?: (error: ParseError, file?: File) => void;
    skipEmptyLines?: boolean | 'greedy';
    delimitersToGuess?: string[];
    transform?: (value: string, field: string | number) => any;
    transformHeader?: (header: string, index?: number) => string;
    beforeFirstChunk?: (chunk: string) => string | void;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
      cursor: number;
      fields?: string[];
    };
  }

  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
    index: number;
  }

  export interface Parser {
    parse: (input: string, baseIndex: number, ignoreLastRow: boolean) => any;
    pause: () => void;
    resume: () => void;
    abort: () => void;
    getCharIndex: () => number;
  }
}
