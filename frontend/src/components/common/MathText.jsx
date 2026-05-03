import { useMemo } from 'react';
import katex from 'katex';

/**
 * Renders text that may contain LaTeX math expressions.
 *
 * Supported patterns:
 *   $$...$$  → display (block) math
 *   $...$    → inline math
 *   \[...\]  → display math (LaTeX style)
 *   \(...\)  → inline math (LaTeX style)
 *
 * Plain text between formulas is rendered as-is.
 */

const MATH_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;

function parseParts(text) {
  if (!text) return [];
  const parts = [];
  let lastIndex = 0;
  let match;
  const re = new RegExp(MATH_PATTERN.source, 'g');

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    let formula = raw;
    let displayMode = false;

    if (raw.startsWith('$$')) {
      formula = raw.slice(2, -2).trim();
      displayMode = true;
    } else if (raw.startsWith('$')) {
      formula = raw.slice(1, -1).trim();
    } else if (raw.startsWith('\\[')) {
      formula = raw.slice(2, -2).trim();
      displayMode = true;
    } else if (raw.startsWith('\\(')) {
      formula = raw.slice(2, -2).trim();
    }

    parts.push({ type: 'math', content: formula, displayMode });
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}

function renderKaTeX(formula, displayMode) {
  try {
    return katex.renderToString(formula, {
      throwOnError: false,
      displayMode,
      output: 'htmlAndMathml',
      trust: false,
      strict: false,
    });
  } catch {
    return `<span class="katex-error">[Lỗi công thức: ${formula}]</span>`;
  }
}

export default function MathText({ text, className = '', block = false }) {
  const parts = useMemo(() => parseParts(text), [text]);

  if (!text) return null;

  // If no math detected, render plain text
  const hasMath = parts.some((p) => p.type === 'math');
  if (!hasMath) {
    return block
      ? <div className={className}>{text}</div>
      : <span className={className}>{text}</span>;
  }

  const Wrapper = block ? 'div' : 'span';

  return (
    <Wrapper className={className}>
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.content}</span>;
        }
        const html = renderKaTeX(part.content, part.displayMode);
        return (
          <span
            key={i}
            className={part.displayMode ? 'block katex-display-wrapper overflow-x-auto py-1' : 'inline'}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </Wrapper>
  );
}
