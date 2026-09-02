// minimal DOM/storage stubs so the game modules import in node
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k)
};
const nodeStub = () => ({
  style: {}, dataset: {}, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
  children: [], appendChild(n){ this.children.push(n); return n; }, append(){}, remove(){},
  addEventListener(){}, removeEventListener(){}, setAttribute(){}, getAttribute(){ return null; },
  querySelector(){ return null; }, querySelectorAll(){ return []; },
  get firstChild(){ return null; }, textContent: "", innerHTML: "", value: "",
  getBoundingClientRect(){ return { top:0, left:0, width:0, height:0, bottom:0, right:0 }; }
});
globalThis.document = {
  getElementById: () => null,
  createElement: nodeStub,
  createDocumentFragment: nodeStub,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener(){}, body: nodeStub(), documentElement: nodeStub()
};
globalThis.window = { addEventListener(){}, matchMedia: () => ({ matches:false, addEventListener(){} }) };
globalThis.requestAnimationFrame = () => 0;
