import sha256 from "crypto-js"
import getSource from 'get-source'

const { Hex, SHA256 } = sha256

function sourceForPath(path) {
  let file = getSource(path)
  return file.text
}

class MerkleNode {
  constructor(hash, filename = '') {
    this.hash = hash;
    this.filename = filename;
    this.left = null;
    this.right = null;
  }
}

class MerkleTree {
  constructor() {
    this.root = null;
  }

  buildTree(files) {
    const leaves = Object.entries(files).map(([filename, hash]) =>
      new MerkleNode(hash, filename)
    );
    this.root = this.buildFromNodes(leaves);
    return this.root;
  }

  buildFromNodes(nodes) {
    if (nodes.length === 1) return nodes[0];

    const parents = [];
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = nodes[i + 1] || null;
      const combinedHash = right ?
        SHA256(left.hash + right.hash).toString(Hex) :
        left.hash;
      const parent = new MerkleNode(combinedHash);
      parent.left = left;
      parent.right = right;
      parents.push(parent);
    }
    return this.buildFromNodes(parents);
  }

  findDifferences(otherTree) {
    const differences = [];
    const compare = (node1, node2) => {
      if (!node1 || !node2 || node1.hash === node2.hash) return;
      if (node1.filename) differences.push(node1.filename);
      compare(node1.left, node2.left);
      compare(node1.right, node2.right);
    };
    compare(this.root, otherTree.root);
    return differences;
  }
}

export {
  MerkleTree
}
