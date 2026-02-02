
import * as acorn from "acorn"
import * as walk from "acorn-walk"
import getSource from 'get-source'
import { fileURLToPath } from 'url'
import { join, parse } from 'path'
import sha256 from "crypto-js"
import { MerkleTree } from "./merkle.js"
import { SheetCache } from "./sheetcache.js"
import * as build from "./build.js"
import fs from 'fs';

const { Hex, SHA256 } = sha256
const { generateBuild } = build

function sourceForPath(path) {
  let file = getSource(path)
  return file.text
}

function sha256PathContent(path) {
  const raw = sourceForPath(path)
  const hash = SHA256(raw).toString(Hex)
  console.log(`${path}: ${hash}`)
  return hash;
}


// Doesn't work with referenceing a local module
// Doesn't hash imported modules even though they can be different
// Doesn't pick up external input such as envvars or reading external files or dates
// Picks up semantically irrelevant changes, i.e. spaces as invalidating
// Cache obviously doesn't scale, but good enough for a demo
async function execute() {
  const cache = new SheetCache("10cPFfwcnJUoVlC7IsXEk2n6qnx1Ef9Q-Z1pYSL1ZKIQ", "1FAIpQLSfsvcUeE8VAjFvl1BMUcKeKElTqTtgYRiZbuoGkhLQypwJpRg")

  const rootDirname = fileURLToPath(new URL('..', import.meta.url));
  const seed = join(rootDirname, 'util/build.js');

  let src = new Set([seed])
  const visited = new Set()

  while (src.size > 0) {
    const imports = new Set()
    for (const sourceFile of src) {
      console.log(`Reading ${sourceFile}`)
      const dirname = parse(sourceFile).dir
      const rawSource = sourceForPath(sourceFile)
      walk.simple(acorn.parse(rawSource, { sourceType: "module", ecmaVersion: "2020" }), {
        ImportDeclaration(node) {
          const importPath = node.source.value
          if (visited.has(importPath)) {
            console.log(`Cycle detected. Ignoring visited import ${importPath}`)
          } else if (!importPath.startsWith('.')) {
            console.log(`Ignoring external module import ${importPath}`)
          } else {
            const modulePath = join(`${dirname}`, importPath);
            console.log(`${sourceFile} imports ${modulePath}`)
            imports.add(modulePath)
          }
        }
      })
    }
    src = imports.difference(visited)
    for (const sourceFile of imports) {
      visited.add(sourceFile)
    }
  }

  const stateMap = new Map([...visited].map(x => [x, sha256PathContent(x)]));
  const state = Object.fromEntries(stateMap);
  const tree = new MerkleTree();
  const root = tree.buildTree(state);
  const rootHash = root.hash.toString(Hex)

  console.log(`Source tree hash: ${rootHash}`)

  const entries = await cache.load()
  console.log(`${JSON.stringify(entries)}`)
  //Only the first one is found
  const cached = entries.find((entry) => entry.hash === rootHash)
  if (cached === undefined) {
    await generateBuild()
    const buildContent = fs.readFileSync('dist/dep.bin', 'utf8');
    cache.put(rootHash, state, buildContent)
  } else {
    const buildContent = cached.result
    fs.mkdirSync('dist/', { recursive: true });
    fs.writeFileSync('dist/dep.bin', buildContent, 'utf8');
  }
}

execute();
