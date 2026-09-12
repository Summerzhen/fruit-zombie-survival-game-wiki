/** Use the same AST transformation for rendered headings and the page TOC. */
export default function rehypeHeadings(options = {}) {
  return function transform(tree) {
    const used = new Set();
    function plainText(node) {
      if (node.type === 'text') return node.value || '';
      if (node.tagName === 'img') return node.properties?.alt || '';
      return (node.children || []).map(plainText).join('');
    }
    // Read only a static exported metadata title; never execute article code.
    let title;
    for (const node of tree.children || []) {
      for (const statement of node.data?.estree?.body || []) {
        if (statement.type !== 'ExportNamedDeclaration') continue;
        for (const declaration of statement.declaration?.declarations || []) {
          if (declaration.id?.name !== 'metadata' || declaration.init?.type !== 'ObjectExpression') continue;
          const field = declaration.init.properties.find(property =>
            !property.computed && (property.key?.name || property.key?.value) === 'title');
          if (field?.value?.type === 'Literal' && typeof field.value.value === 'string') title = field.value.value;
        }
      }
    }
    const normalize = value => value.normalize('NFC').replace(/\s+/g, ' ').trim();
    const firstBodyIndex = (tree.children || []).findIndex(node =>
      node.type !== 'mdxjsEsm' && !(node.type === 'text' && !node.value.trim()));
    const firstBody = tree.children?.[firstBodyIndex];
    if (title && firstBody?.type === 'element' && firstBody.tagName === 'h1' &&
        normalize(plainText(firstBody)) === normalize(title)) {
      tree.children.splice(firstBodyIndex, 1);
    }
    function visit(node) {
      if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) {
        // The route owns the article H1. Markdown headings start at H2.
        if (node.tagName === 'h1') node.tagName = 'h2';
        const text = plainText(node).trim();
        const base = String(node.properties?.id || text.toLowerCase()
          .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
          .replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'section');
        let id = base;
        for (let suffix = 1; used.has(id); suffix += 1) id = `${base}-${suffix}`;
        used.add(id);
        node.properties = {...node.properties, id};
        if (options.onHeading && ['h2', 'h3'].includes(node.tagName)) {
          options.onHeading({id, text, level: Number(node.tagName.slice(1))});
        }
      }
      for (const child of node.children || []) visit(child);
    }
    visit(tree);
  };
}
