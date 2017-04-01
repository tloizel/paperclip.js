export class View {
  constructor(template, node, bindings) {
    this.template = template;
    this.node = node;
    this.bindings = bindings;
  }
  dispose() {
    this.template.$viewPool.push(this);
    return this;
  }
  update(context) {
    for (const binding of this.bindings) {
      binding.update(context);
    }
    return this;
  }
  detach() {
    if (this.node.parentNode) {
      this.node.parentNode.removeChild(this.node);
    }
    return this;
  }
}

export class Template {
  constructor(virtualNode, options) {
    this.virtualNode = virtualNode;
    virtualNode.collectHydrators(this.hydrators = []);
    this.nativeNode = virtualNode.toNativeNode(options.document);
    this.$viewPool = [];
  }
  createView(context) {
    const eview = this.$viewPool.shift()
    if (eview) return eview;
    
    const node = this.nativeNode.cloneNode(true);
    const bindings = [];
    for (const hydrator of this.hydrators) {
      bindings.push(hydrator.createBinding(node));
    }
    const view = new View(this, node, bindings);
    if (arguments.length !== 0) {
      view.update(context);
    }
    return view;
  }
}

export class VirtualComponent {
  constructor(name, attributes, children, options) {
    this.name       = name;
    this.attributes = attributes;
    this.options    = options;
    this.childNodes = children;
  }
  collectHydrators(hydrators) {

  }
  toNativeNode(document) {
    return document.createTextNode('');
  }
}

export class VirtualElement {
  constructor(name, attributes, children, options) {
    this.name       = name;
    this.attributes = attributes;
    this.options    = options;
    this.childNodes = children;
    for (const child of children) {
      child.parentNode = this;
    }
  }
  collectHydrators(hydrators) {
    for (const key in this.attributes) {
      const value = this.attributes[key];
      if (typeof value === 'function') {
        hydrators.push(this.createAttributeHydrator(key, value));
      }
    }
    for (const child of this.childNodes) {
      child.collectHydrators(hydrators);
    }
  }
  createAttributeHydrator(key, value) {
    return new ElementAttributeHydrator(this, key, value);
  }
  toNativeNode(document) {
    const element = document.createElement(this.name);
    for (const key in this.attributes) {
      const value = this.attributes[key];
      if (/number|string/.test(typeof value)) {
        element.setAttribute(key, value);
      }
    }
    for (const child of this.childNodes) {
      element.appendChild(child.toNativeNode(document));
    }
    return element;
  }
}

function getNodePath(node) {
  const path = [];
  let currentNode = node;
  while(currentNode.parentNode) {
    path.unshift(currentNode.parentNode.childNodes.indexOf(currentNode));
    currentNode = currentNode.parentNode;
  }
  return path;
}

function findNode(root, path) {
  let currentNode = root;
  for (let i = 0, n = path.length; i < n; i++) {
    currentNode = currentNode.childNodes[path[i]];
  }
  return currentNode;
}

export class VirtualTextNode {
  constructor(nodeValue) {
    this.nodeValue = nodeValue;
  }
  collectHydrators(hydrators) {
    if (typeof this.nodeValue === 'function') {
      hydrators.push(new TextNodeHydrator(this, this.nodeValue));
    }
  }
  toNativeNode(document) {
    return document.createTextNode(this.nodeValue);
  }
}

export class Hydrator {
  constructor(virtualNode) {
    this.virtualNode = virtualNode;
    this.path        = getNodePath(virtualNode);
  }
}

class ComputeHydrator extends Hydrator {
  constructor(virtualNode, compute) {
    super(virtualNode);
    this.compute = compute;
  }
}

class ElementAttributeHydrator extends ComputeHydrator {
  constructor(virtualNode, attributeName, compute) {
    super(virtualNode, compute);
    this.attributeName = attributeName;
  }
  createBinding(root) {
    return new AttributeBinding(root, this);
  }
}

class TextNodeHydrator extends ComputeHydrator {
  createBinding(root) {
    return new TextNodeBinding(root, this);
  }
}

export class Binding {
  constructor(root, hydrator) {
    this.hydrator = hydrator;
    this.node        = findNode(root, hydrator.path);
    this.virtualNode = hydrator.virtualNode;
  }
}

class ComputeBinding extends Binding {
  constructor(root, hydrator) {
    super(root, hydrator);
    this._compute = hydrator.compute;
  }
  update(context) {
    const newValue = this._compute(context);
    if (this.currentValue !== newValue || !this._hasSetValue) {
      this._hasSetValue   = true;
      this._updateNode(this.currentValue = newValue);
    }
  }
}

class AttributeBinding extends ComputeBinding {
  _updateNode(newValue) {
    this.node.setAttribute(this.hydrator.attributeName, newValue);
  }
}

class TextNodeBinding extends ComputeBinding {
  _updateNode(newValue) {
    this.node.nodeValue = newValue;
  }
}

function createNativeElement(nodeName, attributes, children) {
  return new VirtualElement(nodeName, attributes, children);
}

export const createTemplate = (vdomOrFactory, options = {}) => {

  const createTextNode = (nodeValue) => {
    return new VirtualTextNode(nodeValue);
  }
  
  const createElement = (nodeName, attributes = {}, children = []) => {
    const clazz = options.components && options.components[nodeName] || VirtualElement;
    return new clazz(nodeName, attributes, children, options);
  }

  const vdom = typeof vdomOrFactory === 'function' ? vdomOrFactory(
    createElement,
    createTextNode
  ) : vdomOrFactory;

  return new Template(vdom, {
    document: options.document || global.document
  });
}