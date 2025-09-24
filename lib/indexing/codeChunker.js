import { createHash } from 'node:crypto';

const LANGUAGE_EXTENSIONS = new Map([
  ['js', 'javascript'],
  ['cjs', 'javascript'],
  ['mjs', 'javascript'],
  ['jsx', 'javascript'],
  ['ts', 'typescript'],
  ['tsx', 'typescript'],
  ['py', 'python'],
  ['rb', 'ruby'],
  ['go', 'go'],
  ['rs', 'rust'],
  ['java', 'java'],
  ['kt', 'kotlin'],
  ['swift', 'swift'],
  ['php', 'php'],
  ['cs', 'csharp'],
  ['cpp', 'cpp'],
  ['cxx', 'cpp'],
  ['cc', 'cpp'],
  ['h', 'cpp'],
  ['hpp', 'cpp'],
  ['scala', 'scala'],
  ['sql', 'sql'],
  ['sh', 'bash'],
  ['bash', 'bash'],
  ['json', 'json'],
  ['yaml', 'yaml'],
  ['yml', 'yaml'],
  ['md', 'markdown'],
]);

const SYMBOL_PATTERNS = [
  /^(?:export\s+)?(?:async\s+)?function\s+([\w$]+)/,
  /^(?:export\s+)?const\s+([\w$]+)\s*=\s*(?:async\s*)?\(/,
  /^(?:export\s+)?class\s+([\w$]+)/,
  /^def\s+([\w$]+)/,
  /^class\s+([\w$]+)/,
  /^func\s+([\w$]+)/,
  /^struct\s+([\w$]+)/,
  /^module\s+([\w$]+)/,
];

/**
 * @param {string} path
 * @returns {string | undefined}
 */
export const detectLanguageFromPath = (path) => {
  const extension = path.includes('.') ? path.split('.').pop().toLowerCase() : '';
  return LANGUAGE_EXTENSIONS.get(extension);
};

/**
 * @param {string} line
 * @returns {string | undefined}
 */
const detectSymbolFromLine = (line) => {
  for (const pattern of SYMBOL_PATTERNS) {
    const match = line.trim().match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
};

/**
 * @param {string} text
 * @returns {boolean}
 */
const isWhitespaceOnly = (text) => text.trim().length === 0;

/**
 * @param {string} text
 * @returns {boolean}
 */
const isProbablyBinary = (text) => /\u0000/.test(text);

/**
 * @param {string} installationId
 * @param {string | number} repositoryId
 * @param {string} path
 * @param {number} startLine
 * @param {number} endLine
 * @param {string} commitSha
 * @returns {string}
 */
export const buildChunkId = (installationId, repositoryId, path, startLine, endLine, commitSha) =>
  createHash('sha1')
    .update(`${installationId}:${repositoryId}:${path}:${startLine}:${endLine}:${commitSha}`)
    .digest('hex');

/**
 * @param {{
 *   path: string;
 *   content: string;
 *   installationId: number | string;
 *   repositoryId: number | string;
 *   commitSha: string;
 *   maxChunkLines?: number;
 *   overlapLines?: number;
 * }} options
 * @returns {import('./types.js').CodeChunkInput[]}
 */
export const chunkSourceFile = ({
  path,
  content,
  installationId,
  repositoryId,
  commitSha,
  maxChunkLines = 120,
  overlapLines = 20,
}) => {
  if (isWhitespaceOnly(content) || isProbablyBinary(content)) {
    return [];
  }

  const language = detectLanguageFromPath(path);
  const lines = content.split(/\r?\n/);
  const chunks = [];
  let start = 0;

  const flushChunk = (endExclusive) => {
    const chunkLines = lines.slice(start, endExclusive);
    if (chunkLines.length === 0 || chunkLines.every(isWhitespaceOnly)) {
      start = endExclusive;
      return;
    }

    const startLine = start + 1;
    const endLine = endExclusive;
    const text = chunkLines.join('\n').trimEnd();

    const symbolLine = chunkLines.find((line) => detectSymbolFromLine(line));
    const symbol = symbolLine ? detectSymbolFromLine(symbolLine) : undefined;

    const id = buildChunkId(installationId, repositoryId, path, startLine, endLine, commitSha);

    chunks.push({
      id,
      path,
      text,
      language,
      symbol,
      startLine,
      endLine,
      installationId: Number(installationId),
      repositoryId: Number(repositoryId),
      commitSha,
    });

    start = Math.max(endExclusive - overlapLines, endExclusive);
  };

  for (let index = 0; index <= lines.length; index += 1) {
    const line = lines[index] ?? '';
    const reachedEnd = index === lines.length;
    const boundary = reachedEnd || isWhitespaceOnly(line);
    const exceedsLength = index - start >= maxChunkLines;

    if (boundary || exceedsLength) {
      flushChunk(reachedEnd ? index : index + 1);
    }
  }

  return chunks;
};

/**
 * @param {{ path: string; content: string }} file
 * @returns {boolean}
 */
export const shouldSkipFile = (file) => {
  if (!file || typeof file.content !== 'string') {
    return true;
  }

  if (file.path.startsWith('.git/')) {
    return true;
  }

  if (/(?:^|\/)(?:dist|build|out|node_modules|vendor)\//.test(file.path)) {
    return true;
  }

  if (isProbablyBinary(file.content)) {
    return true;
  }

  return false;
};

