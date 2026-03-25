/**
 * Browser-side DOM audit: finds elements where painted content appears to
 * extend outside the element’s own box or outside an ancestor’s padding box.
 *
 * Pass this function to `Frame.evaluate()` / `Page.evaluate()` only — it runs
 * in the page, not in Node. Keep it self-contained (no imports) so Playwright
 * can serialize it into the browser context.
 */

export type DomOverflowIssue = {
  kind: "selfOverflow" | "descendantOutside";
  /** CSS-ish path for debugging */
  path: string;
  tagName: string;
  /** Element whose box is exceeded (self) or the container (descendantOutside) */
  containerPath: string;
  /** For descendantOutside: the overflowing descendant */
  descendantPath?: string;
  detail: string;
};

/**
 * Walks the DOM under `root` (defaults to `document.body`) and returns overflow issues.
 * Call from Playwright: `await frame.evaluate(auditDomForTextOverflow as () => DomOverflowIssue[])`.
 *
 * Helpers must live *inside* this function: Playwright only serializes this one
 * function into the page, so module-level helpers would be undefined there.
 */
export function auditDomForTextOverflow(
  root?: Document | Element,
): DomOverflowIssue[] {
  function cssPath(el: Element): string {
    if (el.id) {
      try {
        return `#${CSS.escape(el.id)}`;
      } catch {
        return `#${el.id}`;
      }
    }

    const parts: string[] = [];
    let node: Element | null = el;

    while (node && node.nodeType === Node.ELEMENT_NODE) {
      let sel = node.tagName.toLowerCase();

      if (node.parentElement) {
        const tag = node.tagName;
        const sameTagSiblings = [...node.parentElement.children].filter(
          (c) => c.tagName === tag,
        );
        if (sameTagSiblings.length > 1) {
          const idx = sameTagSiblings.indexOf(node) + 1;
          sel += `:nth-of-type(${idx})`;
        }
      }

      parts.unshift(sel);
      if (node.tagName === "HTML") break;
      node = node.parentElement;
    }

    return parts.join(" > ");
  }

  function isSkippedTag(tag: string): boolean {
    const t = tag.toUpperCase();
    return (
      t === "SCRIPT" ||
      t === "STYLE" ||
      t === "NOSCRIPT" ||
      t === "TEMPLATE" ||
      t === "HEAD" ||
      t === "META" ||
      t === "LINK" ||
      t === "BR" ||
      t === "HR"
    );
  }

  const scope: Element | null =
    root === undefined
      ? document.body
      : root instanceof Document
        ? root.body
        : root;

  if (!scope) return [];

  const eps = 1;
  const issues: DomOverflowIssue[] = [];
  const seen = new Set<string>();

  const nodes: Element[] = [scope, ...Array.from(scope.querySelectorAll("*"))];

  for (const el of nodes) {
    if (isSkippedTag(el.tagName)) continue;

    const cs = window.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0 && el.children.length === 0) {
      continue;
    }

    const path = cssPath(el);

    // 1) Self: content larger than the client box (scroll overflow).
    if (
      el.scrollWidth > el.clientWidth + eps ||
      el.scrollHeight > el.clientHeight + eps
    ) {
      const key = `self:${path}`;
      if (!seen.has(key)) {
        seen.add(key);
        issues.push({
          kind: "selfOverflow",
          path,
          tagName: el.tagName.toLowerCase(),
          containerPath: path,
          detail: `scroll ${el.scrollWidth}×${el.scrollHeight} > client ${el.clientWidth}×${el.clientHeight}`,
        });
      }
    }

    // 2) Descendants: painted box outside this element’s padding edge.
    const pr = el.getBoundingClientRect();
    const padT = parseFloat(cs.paddingTop) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const padB = parseFloat(cs.paddingBottom) || 0;
    const padL = parseFloat(cs.paddingLeft) || 0;

    const innerLeft = pr.left + padL;
    const innerRight = pr.right - padR;
    const innerTop = pr.top + padT;
    const innerBottom = pr.bottom - padB;

    for (const child of el.children) {
      if (isSkippedTag(child.tagName)) continue;

      const ccs = window.getComputedStyle(child);
      if (ccs.display === "none") continue;

      // Fixed/sticky are positioned vs viewport; comparing to normal flow parent is noisy.
      if (ccs.position === "fixed") continue;

      const cr = child.getBoundingClientRect();
      if (cr.width <= 0 && cr.height <= 0) continue;

      const childPath = cssPath(child);

      const outside =
        cr.left < innerLeft - eps ||
        cr.right > innerRight + eps ||
        cr.top < innerTop - eps ||
        cr.bottom > innerBottom + eps;

      if (outside) {
        const key = `desc:${path}|${childPath}`;
        if (!seen.has(key)) {
          seen.add(key);
          issues.push({
            kind: "descendantOutside",
            path: childPath,
            tagName: child.tagName.toLowerCase(),
            containerPath: path,
            descendantPath: childPath,
            detail: `child rect (${Math.round(cr.left)},${Math.round(cr.top)})–(${Math.round(cr.right)},${Math.round(cr.bottom)}) vs padding box of ${el.tagName.toLowerCase()}`,
          });
        }
      }
    }
  }

  return issues;
}
