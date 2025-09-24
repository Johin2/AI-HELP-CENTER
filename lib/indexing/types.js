/**
 * @typedef {Object} CodeChunkInput
 * @property {string} id
 * @property {number} installationId
 * @property {number} repositoryId
 * @property {string} path
 * @property {string} text
 * @property {string} commitSha
 * @property {number} startLine
 * @property {number} endLine
 * @property {string} [language]
 * @property {string} [symbol]
 */

/**
 * @typedef {CodeChunkInput & {
 *   repositoryName: string;
 *   branch: string;
 *   embedding: number[];
 * }} CodeChunkRecord
 */

/**
 * @typedef {Object} RepositorySnapshotFile
 * @property {string} path
 * @property {string} content
 * @property {string} sha
 * @property {number} size
 */

export {};

