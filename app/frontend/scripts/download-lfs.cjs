#!/usr/bin/env node
// Downloads Git LFS files via GitHub API before the Vite build runs.
// Required env vars (all injected by Railway): GITHUB_TOKEN, RAILWAY_GIT_REPO_OWNER, RAILWAY_GIT_REPO_NAME
'use strict';

const fs = require('fs');
const https = require('https');

const OWNER = process.env.RAILWAY_GIT_REPO_OWNER ?? 'khanfareena';
const REPO = process.env.RAILWAY_GIT_REPO_NAME ?? 'AiSL';
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.warn('Skipping LFS download: GITHUB_TOKEN not set.');
  process.exit(0);
}

const LFS_FILES = [
  'public/unity-build/Build/unity-build.data',
  'public/unity-build/Build/unity-build.framework.js',
  'public/unity-build/Build/unity-build.loader.js',
  'public/unity-build/Build/unity-build.wasm',
];

function parseLFSPointer(content) {
  const oidMatch = content.match(/^oid sha256:([a-f0-9]+)$/m);
  const sizeMatch = content.match(/^size (\d+)$/m);
  if (!oidMatch || !sizeMatch) return null;
  return { oid: oidMatch[1], size: parseInt(sizeMatch[1], 10) };
}

function post(url, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST', headers }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Bad JSON from LFS batch API: ${data.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          follow(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed with status ${res.statusCode} for ${dest}`));
          return;
        }
        const tmp = dest + '.tmp';
        const file = fs.createWriteStream(tmp);
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            fs.renameSync(tmp, dest);
            resolve();
          });
        });
        file.on('error', reject);
      }).on('error', reject);
    };
    follow(url);
  });
}

async function main() {
  for (const filePath of LFS_FILES) {
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${filePath} (not found)`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const pointer = parseLFSPointer(content);

    if (!pointer) {
      console.log(`${filePath} is already a real file, skipping.`);
      continue;
    }

    console.log(`Fetching LFS download URL for ${filePath} (${(pointer.size / 1024 / 1024).toFixed(1)} MB)...`);

    const body = JSON.stringify({
      operation: 'download',
      transfers: ['basic'],
      objects: [{ oid: pointer.oid, size: pointer.size }],
    });

    const batchRes = await post(
      `https://github.com/${OWNER}/${REPO}.git/info/lfs/objects/batch`,
      {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.git-lfs+json',
        'Content-Type': 'application/vnd.git-lfs+json',
        'Content-Length': Buffer.byteLength(body),
      },
      body,
    );

    const downloadUrl = batchRes?.objects?.[0]?.actions?.download?.href;
    if (!downloadUrl) {
      throw new Error(
        `No download URL returned for ${filePath}.\nAPI response: ${JSON.stringify(batchRes).slice(0, 400)}`,
      );
    }

    console.log(`Downloading ${filePath}...`);
    await download(downloadUrl, filePath);
    const actualSize = fs.statSync(filePath).size;
    console.log(`Done: ${filePath} (${(actualSize / 1024 / 1024).toFixed(1)} MB)`);
  }

  console.log('LFS download complete.');
}

main().catch((err) => {
  console.error('LFS download failed:', err.message);
  process.exit(1);
});
