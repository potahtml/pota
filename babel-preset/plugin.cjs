'use strict';

var core = require('@babel/core');
var jsx = require('@babel/plugin-syntax-jsx');
var helperModuleImports = require('@babel/helper-module-imports');
var helperPluginUtils = require('@babel/helper-plugin-utils');

const get = (pass, name) => pass.get(`@babel/plugin-react-jsx/${name}`);
const set = (pass, name, v) => pass.set(`@babel/plugin-react-jsx/${name}`, v);
const escapeHTML = (() => {
  const chars = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  };
  const search = /[&<>'"]/g;
  const replace = c => chars[c];
  return function escape(s) {
    return s.replace(search, replace);
  };
})();
const escapeAttribute = (() => {
  const chars = {
    "'": '&#39;',
    '"': '&quot;'
  };
  const search = /['"]/g;
  const replace = c => chars[c];
  return function escape(s) {
    return s.replace(search, replace);
  };
})();
function isVoidElement(tagName) {
  switch (tagName.toLowerCase()) {
    case 'area':
    case 'base':
    case 'br':
    case 'col':
    case 'embed':
    case 'hr':
    case 'img':
    case 'input':
    case 'link':
    case 'meta':
    case 'param':
    case 'source':
    case 'track':
    case 'wbr':
      {
        return true;
      }
    default:
      {
        return false;
      }
  }
}
function call(pass, name, args) {
  return core.types.callExpression(get(pass, `id/${name}`)(), args);
}
function hasProto(node) {
  return node.properties.some(value => core.types.isObjectProperty(value, {
    computed: false,
    shorthand: false
  }) && (core.types.isIdentifier(value.key, {
    name: '__proto__'
  }) || core.types.isStringLiteral(value.key, {
    value: '__proto__'
  })));
}
function getTag(path) {
  const openingPath = path.get('openingElement');
  const tagExpr = convertJSXIdentifier(openingPath.node.name, openingPath.node);
  let tagName;
  if (core.types.isIdentifier(tagExpr)) {
    tagName = tagExpr.name;
  } else if (core.types.isStringLiteral(tagExpr)) {
    tagName = tagExpr.value;
  }
  if (core.types.react.isCompatTag(tagName)) {
    return core.types.stringLiteral(tagName);
  } else {
    return tagExpr;
  }
}
function isHTMLTag(path) {
  const openingPath = path.get('openingElement');
  const tagExpr = convertJSXIdentifier(openingPath.node.name, openingPath.node);
  let tagName;
  if (core.types.isIdentifier(tagExpr)) {
    tagName = tagExpr.name;
  } else if (core.types.isStringLiteral(tagExpr)) {
    tagName = tagExpr.value;
  }
  if (core.types.react.isCompatTag(tagName)) {
    return tagName;
  } else {
    return false;
  }
}
function getHTMLTagName(path) {
  return isHTMLTag(path);
}
function convertJSXIdentifier(node, parent) {
  if (core.types.isJSXIdentifier(node)) {
    if (node.name === 'this' && core.types.isReferenced(node, parent)) {
      return core.types.thisExpression();
    } else if (core.types.isValidIdentifier(node.name, false)) {
      node.type = 'Identifier';
      return node;
    } else {
      return core.types.stringLiteral(node.name);
    }
  } else if (core.types.isJSXMemberExpression(node)) {
    return core.types.memberExpression(convertJSXIdentifier(node.object, node), convertJSXIdentifier(node.property, node));
  } else if (core.types.isJSXNamespacedName(node)) {
    return core.types.stringLiteral(`${node.namespace.name}:${node.name.name}`);
  }
  return node;
}

/**
 * Removes a value from an array
 *
 * @param {any[]} array
 * @param {any} value To remove from the array
 * @returns {any[]}
 */
function removeFromArray(array, value) {
  const index = array.indexOf(value);
  if (index !== -1) array.splice(index, 1);
  return array;
}

// clean children from unused extra

function clearEmptyExtra(children) {
  const toDeleteChild = [];
  for (const child of children) {
    if (child.properties) {
      const toDelete = [];
      for (const obj of child.properties) {
        if (obj.key.name === 'children') {
          clearEmptyExtra(obj.value.elements);
        }
        if (obj.key.name === 'sibling') {
          clearEmptyExtra(obj.value.elements);
        }
        if (obj.key.name === 'children' && obj.value.elements.length === 0) {
          toDelete.push(obj);
        }
        if (obj.key.name === 'sibling' && obj.value.elements.length === 0) {
          toDelete.push(obj);
        }
      }
      for (const obj of toDelete) {
        removeFromArray(child.properties, obj);
      }
      if (child.properties.length === 0) {
        toDeleteChild.push(child);
      }
    }
  }
  for (const obj of toDeleteChild) {
    removeFromArray(children, obj);
  }
}
function clearEmptyExtraChilden(children) {
  for (const child of children) {
    if (child.isTemplate) {
      clearEmptyExtra([child.arguments[1]]);
      if (child.arguments[1].properties.length === 0) {
        removeFromArray(child.arguments, child.arguments[1]);
      }
    }
  }
}

function buildChildrenProperty(children) {
  let childrenNode;
  if (children.length === 1) {
    childrenNode = children[0];
  } else if (children.length > 1) {
    childrenNode = core.types.arrayExpression(children);
  } else {
    return undefined;
  }
  return core.types.objectProperty(core.types.identifier('children'), childrenNode);
}
function isChildrenLiteral(node) {
  return core.types.isStringLiteral(node) || core.types.isNumericLiteral(node) || core.types.isStringLiteral(node.value?.expression) || core.types.isNumericLiteral(node.value?.expression);
}
function getChildrenLiteral(node) {
  if (core.types.isStringLiteral(node.value?.expression) || core.types.isNumericLiteral(node.value?.expression)) {
    return escapeHTML(node.value?.expression.value);
  }
  return escapeHTML(node.value);
}

function createLiteralAttribute(name, value) {
  return core.types.jSXAttribute(core.types.jSXIdentifier(name), core.types.stringLiteral(value));
}
function buildProps(attribs, children) {
  const props = attribs.reduce(accumulateAttribute, []);
  if (children && children.length > 0) {
    props.push(buildChildrenProperty(children));
  }
  if (props.length) {
    return core.types.objectExpression(props);
  }
}
function accumulateAttribute(array, attribute) {
  // when we create an attribute manually, is not attached to a node yet
  attribute = 'node' in attribute ? attribute.node : attribute;
  if (core.types.isJSXSpreadAttribute(attribute)) {
    const arg = attribute.argument;
    if (core.types.isObjectExpression(arg) && !hasProto(arg)) {
      array.push(...arg.properties);
    } else {
      array.push(core.types.spreadElement(arg));
    }
    return array;
  }
  const value = convertAttributeValue(attribute.value || core.types.booleanLiteral(true));
  if (core.types.isStringLiteral(value) && !core.types.isJSXExpressionContainer(attribute.value)) {
    var _value$extra;
    value.value = value.value.replace(/\n\s+/g, ' ')
    // mind to write stuff that could be read?
    ;
    (_value$extra = value.extra) == null || delete _value$extra.raw;
  }
  if (core.types.isJSXNamespacedName(attribute.name)) {
    attribute.name = core.types.stringLiteral(attribute.name.namespace.name + ':' + attribute.name.name.name);
  } else if (core.types.isValidIdentifier(attribute.name.name, false)) {
    attribute.name.type = 'Identifier';
  } else {
    attribute.name = core.types.stringLiteral(attribute.name.name);
  }
  array.push(core.types.inherits(core.types.objectProperty(attribute.name, value), attribute));
  return array;
}
function convertAttributeValue(node) {
  if (core.types.isJSXExpressionContainer(node)) {
    return node.expression;
  } else {
    return node;
  }
}
function isAttributeLiteral(node) {
  return core.types.isStringLiteral(node.value) || core.types.isNumericLiteral(node.value) || core.types.isStringLiteral(node.value?.expression) || core.types.isNumericLiteral(node.value?.expression);
}
function getAttributeLiteral(node) {
  if (core.types.isStringLiteral(node.value.expression) || core.types.isNumericLiteral(node.value.expression)) {
    return escapeAttribute(String(node.value.expression.value));
  }
  return escapeAttribute(String(node.value.value));
}

function buildHTMLTemplate(path, file) {
  let isXML = false;

  // tag

  const tagName = getHTMLTagName(path);

  // open opening tag

  const tag = {
    content: `<${tagName}`,
    children: [],
    sibling: []
  };

  // attributes

  const attributes = [];
  for (const attr of path.get('openingElement').get('attributes')) {
    if (attr.isJSXAttribute() && core.types.isJSXIdentifier(attr.node.name)) {
      const name = attr.node.name.name;
      if (name === 'xmlns') {
        isXML = true;
      }

      /**
       * Skip inlining `xmlns` attribute so it builds the template
       * with the right namespace
       */
      if (name !== 'xmlns' && isAttributeLiteral(attr.node)) {
        const value = getAttributeLiteral(attr.node);
        mergeAttributeToTag(tag, name, value);
        continue;
      }
    }
    attributes.push(attr);
  }

  // add xmlns attribute when missing

  if (!isXML) {
    switch (tagName) {
      case 'svg':
        {
          attributes.push(createLiteralAttribute('xmlns', 'http://www.w3.org/2000/svg'));
          isXML = true;
          break;
        }
      case 'math':
        {
          attributes.push(createLiteralAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML'));
          isXML = true;
          break;
        }
      case 'foreignObject':
        {
          attributes.push(createLiteralAttribute('xmlns', 'http://www.w3.org/1999/xhtml'));
          isXML = true;
          break;
        }
    }
  }

  // close opening tag

  if (isVoidElement(tagName)) {
    /**
     * It needs a space after the last attribute for unquoted
     * attributes `<link href=http://somepath.css/>`, the browser will
     * load `href=http://somepath.css/` instead of
     * `http://somepath.css`
     */
    tag.content += ` />`;
  } else {
    tag.content += `>`;
  }

  // children

  let children = core.types.react.buildChildren(path.node);
  children = mergeChildrenToTag(children, tag);
  children = mergeText(children);
  children = mergeTemplates(children);
  children = mergeTextToTemplate(children);

  // close tag

  if (!isVoidElement(tagName)) {
    tag.content += `</${tagName}>`;
  }

  // call arguments

  const args = [];
  args.push(core.types.stringLiteral(tag.content));

  // props

  const props = buildProps(attributes, children);

  // clearn extra

  clearEmptyExtra(tag.children);
  clearEmptyExtraChilden(children);

  // build extra

  const extra = [core.types.objectProperty(core.types.identifier('children'), core.types.arrayExpression(tag.children)), core.types.objectProperty(core.types.identifier('sibling'), core.types.arrayExpression(tag.sibling))];
  if (props) {
    extra.push(core.types.objectProperty(core.types.identifier('props'), props));
  }
  args.push(core.types.objectExpression(extra));

  // call

  const template = call(file, 'template', args);
  template.isXML = isXML;
  template.isTemplate = true;
  return template;
}

// template

function isHTMLTemplate(node) {
  return node.isTemplate && !node.isXML;
}
function getHTMLTemplate(node) {
  return node.arguments[0].value;
}

// attributes

function mergeAttributeToTag(tag, name, value) {
  if (value.trim() === '') {
    tag.content += ' ' + name;
    return;
  }
  if (/"|'|=|<|>|`|\s/.test(value)) {
    tag.content += ' ' + name + '="' + value + '"';
    return;
  }
  tag.content += ' ' + name + '=' + value;
}

// children

function mergeChildrenToTag(children, tag) {
  /**
   * ```js
   * Component('a', { children: ['1', '2'] })
   *
   * into`<a>12`
   * ```
   */

  const toRemove = [];
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (isChildrenLiteral(node)) {
      tag.content += getChildrenLiteral(node);
      toRemove.push(node);
      continue;
    }
    if (isHTMLTemplate(node)) {
      tag.content += getHTMLTemplate(node);
      tag.children.push(node.arguments[1]);
      toRemove.push(node);
      continue;
    }
    break;
  }
  return children.filter(child => !toRemove.includes(child));
}
function mergeText(children) {
  /**
   * ```js
   * ;['1', '2']
   *
   * into
   * ;['12']
   * ```
   */
  const toRemove = [];
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (isChildrenLiteral(node)) {
      let nextSibling = children[++i];
      while (nextSibling && isChildrenLiteral(nextSibling)) {
        node.value += getChildrenLiteral(nextSibling);
        toRemove.push(nextSibling);
        nextSibling = children[++i];
      }
    }
  }
  return children.filter(child => !toRemove.includes(child));
}
function mergeTemplates(children) {
  /**
   * ```js
   * template('1'), '2', template('3')
   *
   * into
   *
   * template('123')
   * ```
   */
  const toRemove = [];
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (isHTMLTemplate(node)) {
      let nextSibling = children[++i];
      while (nextSibling) {
        if (isHTMLTemplate(nextSibling)) {
          node.arguments[0].value += getHTMLTemplate(nextSibling);

          // push to siblings
          node.arguments[1].properties[1].value.elements.push(nextSibling.arguments[1]);
          toRemove.push(nextSibling);
          nextSibling = children[++i];
        } else if (isChildrenLiteral(nextSibling)) {
          node.arguments[0].value += getChildrenLiteral(nextSibling);
          toRemove.push(nextSibling);
          nextSibling = children[++i];
        } else {
          break;
        }
      }
    }
  }
  return children.filter(child => !toRemove.includes(child));
}
function mergeTextToTemplate(children) {
  /**
   * ```js
   * ;['1', template('2')]
   *
   * into
   *
   * template('12')
   * ```
   */
  const toRemove = [];
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    let nextSibling = children[++i];
    if (isChildrenLiteral(node) && nextSibling && isHTMLTemplate(nextSibling)) {
      nextSibling.arguments[0].value = getChildrenLiteral(node) + getHTMLTemplate(nextSibling);
      toRemove.push(node);
    }
  }
  return children.filter(child => !toRemove.includes(child));
}

function buildJSXElement(path, file) {
  // attributes

  const args = [getTag(path)];
  const attributes = [];
  for (const attr of path.get('openingElement').get('attributes')) {
    attributes.push(attr);
  }

  // children

  let children = core.types.react.buildChildren(path.node);
  children = mergeText(children);
  children = mergeTemplates(children);
  children = mergeTextToTemplate(children);
  clearEmptyExtraChilden(children);

  // props

  const props = buildProps(attributes, children);
  if (props) {
    args.push(props);
  }

  // call

  return call(file, 'jsx', args);
}

function buildJSXFragment(path, file) {
  const args = [get(file, 'id/fragment')()];
  let children = core.types.react.buildChildren(path.node);
  children = mergeText(children);
  children = mergeTemplates(children);
  children = mergeTextToTemplate(children);
  clearEmptyExtraChilden(children);
  args.push(core.types.objectExpression(children.length > 0 ? [buildChildrenProperty(children)] : []));
  return call(file, 'jsx', args);
}

function createPlugin({
  name
}) {
  return helperPluginUtils.declare(_ => {
    return {
      name,
      inherits: jsx.default,
      visitor: {
        JSXNamespacedName(path) {},
        JSXSpreadChild(path) {
          throw path.buildCodeFrameError('Spread children are not supported.');
        },
        Program: {
          enter(path, state) {
            const define = (name, id) => set(state, name, createImportLazily(state, path, id));
            define('id/jsx', 'jsx');
            define('id/fragment', 'Fragment');
            define('id/template', 'template');
          }
        },
        JSXFragment: {
          exit(path, file) {
            const callExpr = buildJSXFragment(path, file);
            path.replaceWith(core.types.inherits(callExpr, path.node));
          }
        },
        JSXElement: {
          exit(path, file) {
            const callExpr = isHTMLTag(path) ? buildHTMLTemplate(path, file) : buildJSXElement(path, file);
            path.replaceWith(core.types.inherits(callExpr, path.node));
          }
        },
        JSXAttribute(path) {
          if (core.types.isJSXElement(path.node.value)) {
            path.node.value = core.types.jsxExpressionContainer(path.node.value);
          }
        }
      }
    };
  });
}
function getSource(importName) {
  return `pota/jsx-runtime`;
}
function createImportLazily(pass, path, importName) {
  return () => {
    const actualSource = getSource(importName);
    let reference = get(pass, `imports/${importName}`);
    if (reference) return core.types.cloneNode(reference);
    reference = helperModuleImports.addNamed(path, importName, actualSource, {
      importedInterop: 'uncompiled',
      importPosition: 'after'
    });
    set(pass, `imports/${importName}`, reference);
    return reference;
  };
}

/** This file is compiled with rollup to ./plugin.cjs */

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = createPlugin({
  name: 'transform-pota-jsx'
});
