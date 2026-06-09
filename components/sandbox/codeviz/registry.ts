import type { Algorithm, Category } from "./types";
// Sorting
import { bubbleSort } from "./algos/bubbleSort";
import { insertionSort } from "./algos/insertionSort";
import { selectionSort } from "./algos/selectionSort";
import { mergeSort } from "./algos/mergeSort";
import { quickSort } from "./algos/quickSort";
import { heapSort } from "./algos/heapSort";
// Searching
import { linearSearch } from "./algos/linearSearch";
import { binarySearch } from "./algos/binarySearch";
// Array techniques
import { twoPointers } from "./algos/twoPointers";
import { slidingWindow } from "./algos/slidingWindow";
import { kadane } from "./algos/kadane";
// Graph
import { bfs } from "./algos/bfs";
import { dfs } from "./algos/dfs";
import { dijkstra } from "./algos/dijkstra";
import { gridBFS } from "./algos/gridBFS";
// Tree
import { inorderTraversal } from "./algos/inorderTraversal";
import { preorderTraversal } from "./algos/preorderTraversal";
import { postorderTraversal } from "./algos/postorderTraversal";
import { bstInsert } from "./algos/bstInsert";
import { bstSearch } from "./algos/bstSearch";
// Dynamic Programming
import { editDistance } from "./algos/editDistance";
import { lcs } from "./algos/lcs";
import { knapsack01 } from "./algos/knapsack01";
import { coinChange } from "./algos/coinChange";
import { fibTabulation } from "./algos/fibTabulation";
// Recursion
import { fibRecursion } from "./algos/fibRecursion";
import { factorial } from "./algos/factorial";
import { hanoi } from "./algos/hanoi";
// Math
import { gcdEuclid } from "./algos/gcdEuclid";
import { sieve } from "./algos/sieve";

export const CATEGORY_ORDER: Category[] = [
  "Sorting",
  "Searching",
  "Array",
  "Graph",
  "Tree",
  "Dynamic Programming",
  "Recursion",
  "Math",
];

export const ALGORITHMS: Algorithm[] = [
  bubbleSort,
  insertionSort,
  selectionSort,
  mergeSort,
  quickSort,
  heapSort,
  linearSearch,
  binarySearch,
  twoPointers,
  slidingWindow,
  kadane,
  bfs,
  dfs,
  dijkstra,
  gridBFS,
  inorderTraversal,
  preorderTraversal,
  postorderTraversal,
  bstInsert,
  bstSearch,
  editDistance,
  lcs,
  knapsack01,
  coinChange,
  fibTabulation,
  fibRecursion,
  factorial,
  hanoi,
  gcdEuclid,
  sieve,
];

export function groupedAlgorithms(): { category: Category; algos: Algorithm[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    algos: ALGORITHMS.filter((a) => a.category === category),
  })).filter((g) => g.algos.length > 0);
}
