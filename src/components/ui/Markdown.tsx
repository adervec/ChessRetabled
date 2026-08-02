import { type ReactNode } from "react";

// Minimal markdown → React for the game guides. Handles headings, paragraphs,
// bold/italic/code/links inline, unordered + ordered lists, blockquotes, fenced
// code blocks, pipe tables, and horizontal rules — the subset our own guides
// use. Rendered as React nodes (no dangerouslySetInnerHTML).
// ponytail: hand-rolled instead of adding react-markdown; swap in a lib only if
// guides start needing full GFM (nested lists, footnotes, task boxes).

function inline(text: string, kb: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*|_[^_]+_)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${kb}-${i++}`;
    if (tok.startsWith("`")) nodes.push(<code key={key} className="md-code">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("**")) nodes.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("*") || tok.startsWith("_")) nodes.push(<em key={key}>{tok.slice(1, -1)}</em>);
    else {
      const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      if (mm) nodes.push(<a key={key} href={mm[2]}>{mm[1]}</a>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const splitRow = (line: string): string[] =>
  line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block
    if (/^```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++; // closing fence
      out.push(<pre key={key++} className="md-pre"><code>{buf.join("\n")}</code></pre>);
      continue;
    }
    // blank
    if (/^\s*$/.test(line)) { i++; continue; }
    // heading
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length;
      const cls = `md-h md-h${lvl}`;
      const kids = inline(h[2], `h${key}`);
      out.push(
        lvl <= 1 ? <h1 key={key++} className={cls}>{kids}</h1>
        : lvl === 2 ? <h2 key={key++} className={cls}>{kids}</h2>
        : lvl === 3 ? <h3 key={key++} className={cls}>{kids}</h3>
        : <h4 key={key++} className={cls}>{kids}</h4>
      );
      i++;
      continue;
    }
    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push(<hr key={key++} className="md-hr" />); i++; continue; }
    // blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(<blockquote key={key++} className="md-quote">{inline(buf.join(" "), `q${key}`)}</blockquote>);
      continue;
    }
    // pipe table (header row + |---| separator)
    if (line.includes("|") && i + 1 < lines.length && /-/.test(lines[i + 1]) && /^\s*\|?[\s:|-]+$/.test(lines[i + 1])) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && !/^\s*$/.test(lines[i])) rows.push(splitRow(lines[i++]));
      out.push(
        <div key={key++} className="md-tablewrap">
          <table className="md-table">
            <thead><tr>{header.map((c, ci) => <th key={ci}>{inline(c, `th${key}-${ci}`)}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci}>{inline(c, `td${key}-${ri}-${ci}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }
    // lists. Sub-bullets indented under a numbered item split an ordered list
    // into two runs; the second run keeps its real numbers via <ol start> so
    // "3." doesn't restart at 1. (ponytail: flat lists, not true nesting —
    // add nesting only if a guide needs multi-level structure.)
    const isUl = /^\s*[-*+]\s+/.test(line);
    const isOl = /^\s*\d+\.\s+/.test(line);
    if (isUl) {
      const re = /^\s*[-*+]\s+(.*)$/;
      const items: ReactNode[] = [];
      while (i < lines.length && re.test(lines[i])) {
        items.push(<li key={items.length}>{inline(re.exec(lines[i])![1], `li${key}-${items.length}`)}</li>);
        i++;
      }
      out.push(<ul key={key++} className="md-ul">{items}</ul>);
      continue;
    }
    if (isOl) {
      const re = /^\s*(\d+)\.\s+(.*)$/;
      const items: ReactNode[] = [];
      let start = 1;
      while (i < lines.length && re.test(lines[i])) {
        const mm = re.exec(lines[i])!;
        if (items.length === 0) start = parseInt(mm[1], 10) || 1;
        items.push(<li key={items.length}>{inline(mm[2], `li${key}-${items.length}`)}</li>);
        i++;
      }
      out.push(<ol key={key++} className="md-ol" start={start}>{items}</ol>);
      continue;
    }
    // paragraph: gather lines until a blank line or the next block starts
    const buf: string[] = [];
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,6}\s|```|>\s?)/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) buf.push(lines[i++]);
    out.push(<p key={key++} className="md-p">{inline(buf.join(" "), `p${key}`)}</p>);
  }

  return <div className="md">{out}</div>;
}
