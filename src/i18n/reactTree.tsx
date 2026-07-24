import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { translate } from '.';

const TEXT_PROPS = new Set(['children', 'label', 'text', 'title', 'body', 'summary', 'description', 'desc', 'empty', 'placeholder', 'alt', 'aria-label', 'aria-description']);

function localizeString(source: string): string {
  const direct = translate(source);
  if (direct !== source) return direct;
  const trimmed = source.trim();
  if (!trimmed || trimmed === source) return source;
  const translated = translate(trimmed);
  return translated === trimmed ? source : source.replace(trimmed, translated);
}

/** Recursively localizes a screen's already-created React element tree. This
 * is a presentation adapter: it never mutates domain models or component
 * inputs, and it preserves non-text props and event handlers verbatim. */
export function localizeReactTree(node: ReactNode): ReactNode {
  if (typeof node === 'string') return localizeString(node);
  if (Array.isArray(node)) return node.map(localizeReactTree);
  if (!isValidElement(node)) return node;

  const element = node as ReactElement<Record<string, unknown>>;
  const props = element.props;
  const next: Record<string, unknown> = {};
  let changed = false;
  for (const [key, value] of Object.entries(props)) {
    if (!TEXT_PROPS.has(key)) continue;
    const localized = typeof value === 'string' ? localizeString(value) : key === 'children' ? localizeReactTree(value as ReactNode) : value;
    if (localized !== value) { next[key] = localized; changed = true; }
  }
  return changed ? cloneElement(element, next) : element;
}
