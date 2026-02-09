/**
 * Find the position to inject content inside #header-only-page (before its closing tag).
 * Returns { before, after } so that before + slot + after = full HTML with slot inside #header-only-page.
 */
export function splitHeaderHtmlForSlot(html: string): { before: string; after: string } {
  const idPattern = /id\s*=\s*["']header-only-page["']/i;
  const idx = html.search(idPattern);
  if (idx === -1) {
    return { before: html, after: '' };
  }
  // Find the opening tag start (go back to nearest <div)
  const openStart = html.lastIndexOf('<div', idx);
  if (openStart === -1) return { before: html, after: '' };
  // Find the end of this opening tag (first > after openStart)
  const openEnd = html.indexOf('>', openStart) + 1;
  if (openEnd === 0) return { before: html, after: '' };

  let depth = 1;
  let i = openEnd;
  const len = html.length;
  while (i < len && depth > 0) {
    const nextOpen = html.indexOf('<div', i);
    const nextClose = html.indexOf('</div>', i);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = html.indexOf('>', nextOpen) + 1;
    } else {
      depth--;
      if (depth === 0) {
        return {
          before: html.slice(0, nextClose),
          after: html.slice(nextClose),
        };
      }
      i = nextClose + 6;
    }
  }
  return { before: html, after: '' };
}
