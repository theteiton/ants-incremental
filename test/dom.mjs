// A DOM shim built from the real index.html, so ui.js can be imported and its
// whole module-scope build path actually runs. This is the closest thing to
// "does the game load" that is available without a browser, and it catches the
// failures that matter most: a missing element id, a null dereference during
// build, a handler wired to something that is not there.
import fs from "fs";
import path from "path";

import { fileURLToPath } from "node:url";
// resolved from this file, so the harness runs from anywhere -- and via
// fileURLToPath rather than .pathname, which URL-encodes the space in the path
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
export const HTML_IDS = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));

// which ids the page gives a value/checked attribute, so inputs read sensibly
const store = new Map();

function makeNode(tag, id) {
  const node = {
    tagName: (tag || "div").toUpperCase(),
    id: id || "",
    hidden: false,
    disabled: false,
    textContent: "",
    value: "",
    checked: false,
    innerHTML: "",
    _html: "",
    style: new Proxy({}, { get: () => "", set: () => true }),
    dataset: {},
    children: [],
    parentElement: null,
    classList: {
      _set: new Set(),
      add(...c) { c.forEach(x => this._set.add(x)); },
      remove(...c) { c.forEach(x => this._set.delete(x)); },
      toggle(c, on) { if (on === undefined) { this._set.has(c) ? this._set.delete(c) : this._set.add(c); } else if (on) this._set.add(c); else this._set.delete(c); },
      contains(c) { return this._set.has(c); }
    },
    appendChild(n) { this.children.push(n); n.parentElement = this; return n; },
    append(...n) { n.forEach(x => this.children.push(x)); },
    insertBefore(n) { this.children.unshift(n); return n; },
    removeChild(n) { const i = this.children.indexOf(n); if (i >= 0) this.children.splice(i, 1); return n; },
    remove() { if (this.parentElement) this.parentElement.removeChild(this); },
    replaceChildren(...n) { this.children = n.slice(); },
    _on: {},
    addEventListener(type, fn) { (this._on[type] = this._on[type] || []).push(fn); },
    removeEventListener() {},
    fire(type, ev) {
      const e = ev || { preventDefault(){}, stopPropagation(){}, target: this, key: "" };
      for (const fn of (this._on[type] || [])) fn(e);
      // ui.js and panels.js bind the tab bar and several buttons with onclick=
      const direct = this["on" + type];
      if (typeof direct === "function") direct(e);
    },
    hasHandler(type) { return !!(this._on[type] && this._on[type].length) || typeof this["on" + type] === "function"; },
    setAttribute(k, v) { if (k === "id") this.id = v; },
    getAttribute() { return null; },
    removeAttribute() {},
    focus() {}, blur() {}, click() {}, scrollIntoView() {},
    getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 100, height: 20 }; },
    // never null: the build code does card.querySelector("b").textContent = ...
    querySelector() { return makeNode("span"); },
    querySelectorAll() { return []; },
    closest() { return null; },
    contains() { return false; },
    get firstChild() { return this.children[0] || null; },
    get lastChild() { return this.children[this.children.length - 1] || null; },
    get firstElementChild() { return this.children[0] || null; },
    get childNodes() { return this.children; },
    // sprites.js draws every caste onto a canvas at build time
    width: 32, height: 32,
    getContext: () => ({
      fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1, font: "",
      imageSmoothingEnabled: false, textAlign: "", textBaseline: "",
      fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, closePath() {},
      moveTo() {}, lineTo() {}, arc() {}, ellipse() {}, quadraticCurveTo() {},
      bezierCurveTo() {}, fill() {}, stroke() {}, save() {}, restore() {},
      translate() {}, rotate() {}, scale() {}, drawImage() {}, fillText() {},
      setTransform() {}, createLinearGradient: () => ({ addColorStop() {} })
    }),
    toDataURL: () => "data:,"
  };
  return node;
}

const byId = new Map();
for (const id of HTML_IDS) byId.set(id, makeNode("div", id));

export const missingLookups = new Set();

globalThis.document = {
  getElementById(id) {
    if (byId.has(id)) return byId.get(id);
    missingLookups.add(id);
    return null;
  },
  createElement: tag => makeNode(tag),
  createDocumentFragment: () => makeNode("fragment"),
  createTextNode: () => makeNode("text"),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  removeEventListener() {},
  body: makeNode("body"),
  documentElement: makeNode("html"),
  hidden: false,
  visibilityState: "visible"
};

const listeners = {};
globalThis.window = {
  addEventListener(k, fn) { (listeners[k] = listeners[k] || []).push(fn); },
  removeEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  location: { href: "", reload() {} },
  requestAnimationFrame: () => 0,
  setTimeout: () => 0,
  setInterval: () => 0,
  innerWidth: 1400, innerHeight: 900
};
globalThis.requestAnimationFrame = () => 0;
try {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { clipboard: { writeText: () => Promise.resolve() }, userAgent: "node" }
  });
} catch (e) { /* node 24 already defines one; the shape is close enough */ }
globalThis.getComputedStyle = () => ({ getPropertyValue: () => "" });
globalThis.alert = () => {};
globalThis.confirm = () => false;
globalThis.prompt = () => null;

const ls = new Map();
globalThis.localStorage = {
  getItem: k => (ls.has(k) ? ls.get(k) : null),
  setItem: (k, v) => ls.set(k, String(v)),
  removeItem: k => ls.delete(k),
  clear: () => ls.clear()
};

export function elementFor(id) { return byId.get(id) || null; }
export function allIds() { return [...byId.keys()]; }

// walk a built subtree so a test can click the cards a panel created
export function descendants(node, out) {
  out = out || [];
  for (const child of node.children || []) { out.push(child); descendants(child, out); }
  return out;
}
