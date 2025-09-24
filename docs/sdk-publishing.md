# Publishing the JavaScript SDK

The repository includes everything necessary to publish the JavaScript client that lives under `lib/sdk` as an npm package. This guide walks through the release process end-to-end and highlights optional checks you can run before pushing to a registry.

## Prerequisites

- Node.js 18 or newer
- npm 9+ (bundled with the repository's lockfile)
- An npm account with permission to publish under the desired package name

## 1. Install dependencies

Make sure you have the tooling required for the build step:

```bash
npm install
```

This installs `tsup` and other dev dependencies used by the bundler. If you previously installed dependencies with `--omit=dev`, rerun the command without that flag so the build tools are available.

## 2. Authenticate with npm

Log in to the registry you plan to publish to (public npm or a private registry). The credentials are cached locally by npm.

```bash
npm login
# or
npm login --registry https://registry.npmjs.org
```

## 3. Bump the version

Update the version number in the root `package.json`. The release helper mirrors this version into `lib/sdk/package.json`, so you only need to touch a single file.

```bash
npm version patch
# or manually edit package.json if you prefer
```

Commit the version bump if you follow git-based release tagging.

## 4. Build the distributable

Generate the publishable artefacts (ESM and CommonJS bundles) plus the package metadata and docs.

```bash
npm run build:sdk
```

The bundles are emitted to `lib/sdk/dist/`:

```
lib/sdk/
  dist/
    index.cjs
    index.mjs
    index.cjs.map
    index.mjs.map
  package.json
  README.md
  LICENSE        # copied if present at the repository root
```

## 5. Validate locally (optional but recommended)

Inspect the folder contents or create a tarball with `npm pack` to confirm consumers will receive the expected files.

```bash
npm pack lib/sdk
ls *.tgz
```

You can even `npm install ./ai-help-center-sdk-<version>.tgz` in another project to smoke test the import surface.

## 6. Publish

Publish the prepared folder to npm.

```bash
npm publish lib/sdk
```

If you rename the package to a scoped name (for example `@acme/ai-help-center-sdk`), append `--access public` the first time you publish it:

```bash
npm publish lib/sdk --access public
```

For private registries replace the registry URL with your internal endpoint via `--registry`.

## 7. Tag the release (optional)

Create a git tag so future maintainers can trace which commit produced the published build.

```bash
git tag -a sdk-v1.2.3 -m "Release SDK v1.2.3"
git push origin sdk-v1.2.3
```

## 8. Install from npm

Once the publish succeeds, the library is globally available:

```bash
npm install ai-help-center-sdk
# or
pnpm add ai-help-center-sdk
# or
yarn add ai-help-center-sdk
```

Any project can now instantiate the `AiHelpCenterClient` from the package and interact with your deployed API.

---

Need to publish to multiple registries or automate the flow? Wire the commands above into your CI/CD pipeline or reuse the provided `npm run release:sdk` script, which builds and publishes in one step.
