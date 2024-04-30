"use strict";var e=require("@babel/helper-plugin-utils"),t=require("@babel/plugin-syntax-jsx"),n=require("@babel/core"),s=require("@babel/helper-module-imports"),r=require("validate-html-nesting");const i=(()=>{const e={"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"},t=/[&<>'"]/g,n=t=>e[t];return function(e){return e.replace(t,n)}})(),o=(()=>{const e={"'":"&#39;",'"':"&quot;"},t=/['"]/g,n=t=>e[t];return function(e){return e.replace(t,n)}})();const a=(e,t)=>e.get(`@babel/plugin-pota-jsx/${t}`),p=(e,t,n)=>e.set(`@babel/plugin-pota-jsx/${t}`,n);function l(e,t,s){return n.types.callExpression(a(e,`id/${t}`)(),s)}function u(e){const t=e.get("openingElement"),s=c(t.node.name,t.node);let r;return n.types.isIdentifier(s)?r=s.name:n.types.isStringLiteral(s)&&(r=s.value),n.types.react.isCompatTag(r)?n.types.stringLiteral(r):s}function c(e,t){return n.types.isJSXIdentifier(e)?"this"===e.name&&n.types.isReferenced(e,t)?n.types.thisExpression():n.types.isValidIdentifier(e.name,!1)?(e.type="Identifier",e):n.types.stringLiteral(e.name):n.types.isJSXMemberExpression(e)?n.types.memberExpression(c(e.object,e),c(e.property,e)):n.types.isJSXNamespacedName(e)?n.types.stringLiteral(`${e.namespace.name}:${e.name.name}`):e}function m(e){return n.types.isStringLiteral(e)||n.types.isNumericLiteral(e)||n.types.isStringLiteral(e.value?.expression)||n.types.isNumericLiteral(e.value?.expression)}function d(e){return n.types.isStringLiteral(e.value?.expression)||n.types.isNumericLiteral(e.value?.expression)?i(e.value?.expression.value):i(e.value)}function f(e,t,n){""!==n.trim()?/"|'|=|<|>|`|\s/.test(n)?e.content+=" "+t+"='"+o(n)+"'":e.content+=" "+t+"="+o(n):e.content+=" "+t}function g(e){return n.types.isStringLiteral(e.value.expression)||n.types.isNumericLiteral(e.value.expression)?String(e.value.expression.value):String(e.value.value)}function y(e,t){return n.types.jSXAttribute(n.types.jSXIdentifier(e),n.types.stringLiteral(t))}function h(e,t){const s=e.reduce(x,[]);if(t&&t.length>0&&s.push(function(e){let t;if(1===e.length)t=e[0];else{if(!(e.length>1))return;t=n.types.arrayExpression(e)}return n.types.objectProperty(n.types.identifier("children"),t)}(t)),s.length)return n.types.objectExpression(s)}function x(e,t){if(t="node"in t?t.node:t,n.types.isJSXSpreadAttribute(t)){const s=t.argument;return n.types.isObjectExpression(s)&&!s.properties.some((e=>n.types.isObjectProperty(e,{computed:!1,shorthand:!1})&&(n.types.isIdentifier(e.key,{name:"__proto__"})||n.types.isStringLiteral(e.key,{value:"__proto__"}))))?e.push(...s.properties):e.push(n.types.spreadElement(s)),e}const s=function(e){return n.types.isJSXExpressionContainer(e)?e.expression:e}(t.value||n.types.booleanLiteral(!0));var r;n.types.isStringLiteral(s)&&!n.types.isJSXExpressionContainer(t.value)&&(s.value=s.value.replace(/\n\s+/g," "),null==(r=s.extra)||delete r.raw);return n.types.isJSXNamespacedName(t.name)?t.name=n.types.stringLiteral(t.name.namespace.name+":"+t.name.name.name):n.types.isValidIdentifier(t.name.name,!1)?t.name.type="Identifier":t.name=n.types.stringLiteral(t.name.name),e.push(n.types.inherits(n.types.objectProperty(t.name,s),t)),e}const b=new Set(["area","base","basefont","bgsound","br","col","command","embed","frame","hr","image","img","input","keygen","link","menuitem","meta","param","source","track","wbr"]);function v(e){return b.has(e.toLowerCase())}function L(e,t,n){if(!r.isValidHTMLNesting(e,t))throw n._path.buildCodeFrameError(`Invalid HTML: <${e}> cannot be child of <${t}>`)}function S(e){const t=e.get("openingElement"),s=c(t.node.name,t.node);let r;return n.types.isIdentifier(s)?r=s.name:n.types.isStringLiteral(s)&&(r=s.value),!!n.types.react.isCompatTag(r)&&r}function j(e,t){let s=!1;const r=function(e){return S(e)}(e),i={tagName:r,content:`<${r} pota`,props:[]},o=[];for(const t of e.get("openingElement").get("attributes")){if(t.isJSXAttribute()&&n.types.isJSXIdentifier(t.node.name)){const e=t.node.name.name;if("xmlns"===e&&(s=!0),"xmlns"!==e&&(a=t.node,n.types.isStringLiteral(a.value)||n.types.isNumericLiteral(a.value)||n.types.isStringLiteral(a.value?.expression)||n.types.isNumericLiteral(a.value?.expression))){f(i,e,g(t.node));continue}}o.push(t)}var a;if(!s)switch(r){case"svg":o.push(y("xmlns","http://www.w3.org/2000/svg")),s=!0;break;case"math":o.push(y("xmlns","http://www.w3.org/1998/Math/MathML")),s=!0;break;case"foreignObject":o.push(y("xmlns","http://www.w3.org/1999/xhtml")),s=!0}v(r)?i.content+=" />":i.content+=">";let p=n.types.react.buildChildren(e.node);!function(e,t){for(const n of t)E(n)&&L(e,n.tagName,n)}(i.tagName,p),p=function(e,t){const n=[];for(let s=0;s<e.length;s++){const r=e[s];if(m(r))t.content+=d(r),n.push(r);else{if(!E(r))break;t.content+=_(r),r.arguments[1].elements.length&&t.props.push(...r.arguments[1].elements),n.push(r)}}return e.filter((e=>!n.includes(e)))}(p,i),p=$(p);const u=h(o,p);u?i.props.unshift(u):i.content=i.content.replace(/^<([^\s]+) pota/,"<$1"),v(r)||(i.content+=`</${r}>`);const c=l(t,"template",[n.types.stringLiteral(i.content),n.types.arrayExpression(i.props)]);return c.isXML=s,c.isTemplate=!0,c.tagName=r,c._path=e,c}function E(e){return e.isTemplate&&!e.isXML}function _(e){return e.arguments[0].value}function $(e){const t=[];let n=0,s=e[n],r=e[++n];for(;s&&r;){if(m(s)){if(m(r)){s.value+=d(r),t.push(r),r=e[++n];continue}if(E(r)){r.arguments[0].value=d(s)+_(r),t.push(s),s=r,r=e[++n];continue}}if(E(s)){if(m(r)){s.arguments[0].value+=d(r),t.push(r),r=e[++n];continue}if(E(r)){s.arguments[0].value+=_(r),r.arguments[1].elements.length&&s.arguments[1].elements.push(...r.arguments[1].elements),t.push(r),r=e[++n];continue}}s=r,r=e[++n]}return e.filter((e=>!t.includes(e)))}function w(e,t){a(t,"id/fragment")();return function(e){let t;if(1===e.length)t=e[0];else{if(!(e.length>1))return;t=n.types.arrayExpression(e)}return t}($(n.types.react.buildChildren(e.node)))}function C(e,t){const s=[];s.push(n.types.jsxAttribute(n.types.jsxIdentifier("__dev"),n.types.jsxExpressionContainer(function(e,t){const s=e.node.loc;if(!s)return e.scope.buildUndefinedNode();const r=t.filename.replace(/\\/g,"/"),i=s.start.line||0,o=s.start?.column+1||0,a=r+":"+i+":"+o,p=e.node.name.object?e.node.name.object.name+"."+e.node.name.property.name:e.node.name.name||"unknown";return n.template.expression.ast`{
		__pota: {
			type: ${n.types.stringLiteral(n.types.react.isCompatTag(p)&&!p.includes(".")?"Tag":"Component")},
			name: ${n.types.stringLiteral(p)},

			file: ${n.types.stringLiteral(a)}
		}
  	}`}(e,t)))),e.pushContainer("attributes",s)}function N(e,t){const s=e.node.callee?.name;if("render"===s){const n=J(e);X(e,t,e.node.arguments,n,4)}else if("root"===s){const n=J(e);X(e,t,e.node.arguments,n,2)}else if("effect"===s||"syncEffect"===s||"asyncEffect"===s){const n=J(e);X(e,t,e.node.arguments,n,2)}else if("memo"===s){const n=function(e,t){return J(e)}(e);X(e,t,e.node.arguments,n,2)}else if("signal"===s){const n=function(e,t){return J(e)}(e);X(e,t,e.node.arguments,n,2)}else if("Component"===s){const s=function(e,t){const s=e.scope.getProgramParent().path.hub.file.opts.filename.replace(/\\/g,"/"),r=e.node.loc.start.line||0,i=e.node.loc?.start?.column+1||0,o=s+":"+r+":"+i,a=e.node.arguments[0];let p;p=n.types.isMemberExpression(a)?a.object.name+"."+a.property.name:n.types.isStringLiteral(a)?a.value:a.name||"unknown";return n.template.expression.ast`{
		__dev:{
			__pota: {
				type: ${n.types.stringLiteral("Component")},
				name: ${n.types.stringLiteral(p)},

				file: ${n.types.stringLiteral(o)}
			}
		}
  	}`}(e);X(e,t,e.node.arguments,s,2)}}function X(e,t,s,r,i){for(i-=1;s.length<i;)s.push(n.types.buildUndefinedNode());if(s[i]){if(n.types.isObjectExpression(s[i])){for(const e of s[i].properties)if(n.types.isObjectProperty(e)&&"__dev"===e.key.name){for(const t of e.value.properties)n.types.isObjectProperty(t)&&"__pota"===t.key.name&&t.value.properties.unshift(...r.properties[0].value.properties[0].value.properties);return}s[i].properties.push(...r.properties)}}else s.push(r)}function J(e,t){const s=e.scope.getProgramParent().path.hub.file.opts.filename.replace(/\\/g,"/")+":"+(e.node.loc.start.line||0)+":"+(e.node.loc?.start?.column+1||0),r=e.node.callee.name;return n.template.expression.ast`{
		__dev:{
			__pota: {
				type: ${n.types.stringLiteral(r)},
				name: ${n.types.stringLiteral(r)},

				file: ${n.types.stringLiteral(s)}
			}
		}
  	}`}Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=function({name:r}){return e.declare(((e,i)=>({name:r,inherits:t.default,visitor:{JSXNamespacedName(e){},JSXSpreadChild(e){throw e.buildCodeFrameError("Spread children are not supported.")},Program:{enter(e,t){const r=(r,i)=>p(t,r,function(e,t,r){return()=>{const i="pota/jsx-runtime";let o=a(e,`imports/${r}`);return o?n.types.cloneNode(o):(o=s.addNamed(t,r,i,{importedInterop:"uncompiled",importPosition:"after"}),p(e,`imports/${r}`,o),o)}}(t,e,i));r("id/jsx","jsx"),r("id/fragment","Fragment"),r("id/template","template"),r("id/$component","$component"),r("id/$template","$template"),i?.development&&(e.traverse({CallExpression(e,t){N(e,t)}},t),e.traverse({JSXOpeningElement(e,t){C(e,t)}},t))},exit(e){e.traverse({CallExpression(e){E(e.node)&&0===e.node.arguments[1].elements.length&&function(e,t){const n=e.indexOf(t);-1!==n&&e.splice(n,1)}(e.node.arguments,e.node.arguments[1])}})}},JSXFragment:{exit(e,t){const s=w(e,t);e.replaceWith(n.types.inherits(s,e.node))}},JSXElement:{exit(e,t){const s=S(e)?j(e,t):function(e,t){const s=[u(e)],r=h(e.get("openingElement").get("attributes"),$(n.types.react.buildChildren(e.node)));r&&s.push(r);const i=e.scope.generateUidIdentifier("_jsxComponent");return e.scope.push({id:i,init:n.template.expression.ast`() => ${l(t,"jsx",s)}`}),i}(e,t);e.replaceWith(n.types.inherits(s,e.node))}},JSXAttribute(e){n.types.isJSXElement(e.node.value)&&(e.node.value=n.types.jsxExpressionContainer(e.node.value))}}})))}({name:"transform-pota-jsx"});
