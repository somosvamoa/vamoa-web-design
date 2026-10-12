/* Dynamic values are supplied by the public-page controller, never embedded CSS. */
(() => {
  const bindings = {
  "v-bind-de7cde76be06": [
    [
      "opacity",
      "${0}"
    ],
    [
      "transform",
      "scale(${1})"
    ]
  ],
  "v-bind-7c891906c8f3": [
    [
      "width",
      "${0}"
    ],
    [
      "transition",
      "${1}"
    ]
  ],
  "v-bind-03c3c07f6c1f": [
    [
      "transform",
      "translate(-50%,-50%) scale(${0})"
    ]
  ],
  "v-bind-ff609776e263": [
    [
      "transform",
      "rotate(${0})"
    ]
  ],
  "v-bind-88a82b093b91": [
    [
      "transform",
      "translateX(${0})"
    ]
  ],
  "v-bind-52b60591e5a3": [
    [
      "background",
      "${0}"
    ]
  ],
  "v-bind-db45869720e0": [
    [
      "box-shadow",
      "0 0 0 ${0} rgba(212,223,96,.22)"
    ]
  ],
  "v-bind-4e1453e36990": [
    [
      "background",
      "${0}"
    ],
    [
      "color",
      "${1}"
    ],
    [
      "transform",
      "${2}"
    ],
    [
      "opacity",
      "${3}"
    ],
    [
      "transition",
      "${4}"
    ]
  ],
  "v-bind-6fff9bc2ea8a": [
    [
      "background",
      "${0}"
    ],
    [
      "color",
      "${1}"
    ]
  ],
  "v-bind-4ae663b4bcc3": [
    [
      "color",
      "${0}"
    ]
  ]
};
  function apply(node) {
    const rules = bindings[node.dataset.vBind];
    if (!rules) return;
    for (const [property, template] of rules) {
      const value = template.replace(/\$\{(\d+)\}/g, (_, index) => node.getAttribute('data-v-value-' + index) || '');
      if (value.includes('{{')) continue;
      const important = /\s*!important\s*$/.test(value);
      node.style.setProperty(property, value.replace(/\s*!important\s*$/, ''), important ? 'important' : '');
    }
  }
  function scan(root) {
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    if (root.nodeType === 1 && root.matches('[data-v-bind]')) apply(root);
    root.querySelectorAll('[data-v-bind]').forEach(apply);
  }
  scan(document);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') apply(record.target);
      else record.addedNodes.forEach(scan);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true,
    attributeFilter: ['data-v-bind', ...new Set(Object.values(bindings).flatMap(rules =>
      rules.flatMap(([, template]) => [...template.matchAll(/\$\{(\d+)\}/g)].map(match => 'data-v-value-' + match[1]))))] });
})();
