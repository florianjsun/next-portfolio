import "server-only";

import type { Element, Root as HastRoot } from "hast";
import type { Html, Parent as MdastParent, RootContent } from "mdast";
import { type DefaultTreeAdapterTypes, parseFragment } from "parse5";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { SKIP, visit } from "unist-util-visit";

import {
  isStableContentUrl,
  isTemporaryNotionFileUrl,
} from "@/lib/content-urls";

const MAX_MARKDOWN_BYTES = 2_000_000;
const MAX_NOTION_HTML_DEPTH = 100;

const NOTION_BLOCK_TAGS = new Set([
  "callout",
  "columns",
  "details",
  "synced-block",
  "synced-block-reference",
  "table",
]);

const NOTION_REFERENCE_TAGS = new Set([
  "database",
  "mention-agent",
  "mention-data-source",
  "mention-database",
  "mention-page",
  "mention-user",
  "page",
]);

const NOTION_MEDIA_TAGS = new Set(["audio", "file", "pdf", "video"]);

const NOTION_ATTRIBUTE_PATTERN =
  /\s+\{(?:(?:color="(?:default|gray|brown|orange|yellow|green|blue|purple|pink|red)(?:_bg)?")|(?:toggle="(?:true|false)"))(?:\s+(?:(?:color="(?:default|gray|brown|orange|yellow|green|blue|purple|pink|red)(?:_bg)?")|(?:toggle="(?:true|false)")))*\}(?=\s*$)/gm;

const DROPPED_TAGS = new Set([
  "embed",
  "form",
  "iframe",
  "object",
  "script",
  "style",
  "svg",
]);

type ParseNode = DefaultTreeAdapterTypes.ChildNode;
type ParseElement = DefaultTreeAdapterTypes.Element;

function isElement(node: ParseNode): node is ParseElement {
  return "tagName" in node;
}

function getAttribute(element: ParseElement, name: string): string | undefined {
  return element.attrs.find((attribute) => attribute.name === name)?.value;
}

function escapeMarkdownText(value: string): string {
  return value.replace(/([\\`*_[\]{}<>|])/g, "\\$1");
}

function escapeMarkdownUrl(value: string): string {
  return value.replace(/[()\\]/g, "\\$&");
}

function normalizeBlock(value: string): string {
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const indentation = nonEmptyLines.reduce((smallest, line) => {
    const current = line.match(/^[\t ]*/)?.[0].length ?? 0;
    return Math.min(smallest, current);
  }, Number.POSITIVE_INFINITY);

  const normalizedIndent = Number.isFinite(indentation) ? indentation : 0;

  return lines
    .map((line) => line.slice(normalizedIndent).replace(/^\t/, ""))
    .join("\n")
    .trim();
}

function assertSafeHtmlDepth(depth: number): void {
  if (depth > MAX_NOTION_HTML_DEPTH) {
    throw new Error(
      `Notion HTML exceeds the maximum nesting depth of ${MAX_NOTION_HTML_DEPTH}`
    );
  }
}

function renderChildren(element: ParseElement, depth = 0): string {
  assertSafeHtmlDepth(depth);
  return element.childNodes
    .map((child) => renderNode(child, depth + 1))
    .join("");
}

function renderTable(element: ParseElement, depth: number): string {
  const rowElements: ParseElement[] = [];

  function collectRows(node: ParseNode, currentDepth: number) {
    assertSafeHtmlDepth(currentDepth);

    if (!isElement(node)) {
      return;
    }

    if (node.tagName === "tr") {
      rowElements.push(node);
      return;
    }

    node.childNodes.forEach((child) => collectRows(child, currentDepth + 1));
  }

  element.childNodes.forEach((child) => collectRows(child, depth + 1));

  const rows = rowElements
    .map((row) =>
      row.childNodes
        .filter(
          (child): child is ParseElement =>
            isElement(child) &&
            (child.tagName === "td" || child.tagName === "th")
        )
        .map((cell) =>
          normalizeBlock(renderChildren(cell, depth + 1))
            .replace(/\\\|/g, "|")
            .replace(/\n+/g, "<br>")
            .replace(/\|/g, "\\|")
        )
    )
    .filter((row) => row.length > 0);

  if (rows.length === 0) {
    return "";
  }

  const width = Math.max(...rows.map((row) => row.length));
  const pad = (row: string[]) => [
    ...row,
    ...Array.from({ length: width - row.length }, () => ""),
  ];
  const hasHeader = getAttribute(element, "header-row") === "true";
  const header = hasHeader
    ? pad(rows[0])
    : Array.from({ length: width }, () => "");
  const body = hasHeader ? rows.slice(1).map(pad) : rows.map(pad);
  const formatRow = (row: string[]) => `| ${row.join(" | ")} |`;

  return [
    formatRow(header),
    formatRow(Array.from({ length: width }, () => "---")),
    ...body.map(formatRow),
  ].join("\n");
}

function renderMedia(element: ParseElement, depth: number): string {
  const label =
    normalizeBlock(renderChildren(element, depth)) || "Open attachment";
  const source = getAttribute(element, "src");

  if (!source || !isStableContentUrl(source)) {
    return escapeMarkdownText(label);
  }

  return `[${label}](${escapeMarkdownUrl(source)})`;
}

function renderReference(element: ParseElement, depth: number): string {
  const label =
    normalizeBlock(renderChildren(element, depth)) || "Open in Notion";
  const url = getAttribute(element, "url");

  if (!url || !isStableContentUrl(url)) {
    return escapeMarkdownText(label);
  }

  return `[${label}](${escapeMarkdownUrl(url)})`;
}

function normalizeNotionTagNames(markdown: string): string {
  return markdown
    .replace(
      /<(\/?)(synced_block_reference)(?=[\s>])/g,
      "<$1synced-block-reference"
    )
    .replace(/<(\/?)(synced_block)(?=[\s>])/g, "<$1synced-block")
    .replace(/<(\/?)(table_of_contents)(?=[\s/>])/g, "<$1table-of-contents")
    .replace(/<(\/?)(empty-block)(?=[\s/>])/g, "<$1empty-block");
}

function stripNotionAttributes(markdown: string): string {
  return markdown.replace(NOTION_ATTRIBUTE_PATTERN, "");
}

function normalizeNotionMarkdown(markdown: string): string {
  let fencedCode: { marker: "`" | "~"; length: number } | null = null;
  let inlineCodeLength = 0;

  return markdown
    .split("\n")
    .map((line) => {
      const fenceRun = line.match(/^[\t ]*(`{3,}|~{3,})/)?.[1];

      if (fencedCode) {
        if (
          fenceRun?.[0] === fencedCode.marker &&
          fenceRun.length >= fencedCode.length &&
          line.slice(line.indexOf(fenceRun) + fenceRun.length).trim() === ""
        ) {
          fencedCode = null;
        }
        return line;
      }

      if (fenceRun) {
        const remainder = line.slice(line.indexOf(fenceRun) + fenceRun.length);
        if (fenceRun[0] === "~" || !remainder.includes("`")) {
          fencedCode = {
            marker: fenceRun[0] as "`" | "~",
            length: fenceRun.length,
          };
          return line;
        }
      }

      let result = "";
      let cursor = 0;

      for (const match of line.matchAll(/`+/g)) {
        const index = match.index;
        const segment = line.slice(cursor, index);
        result +=
          inlineCodeLength === 0
            ? stripNotionAttributes(normalizeNotionTagNames(segment))
            : segment;

        const ticks = match[0];
        result += ticks;
        if (inlineCodeLength === 0) {
          inlineCodeLength = ticks.length;
        } else if (ticks.length === inlineCodeLength) {
          inlineCodeLength = 0;
        }
        cursor = index + ticks.length;
      }

      const remainder = line.slice(cursor);
      result +=
        inlineCodeLength === 0
          ? stripNotionAttributes(normalizeNotionTagNames(remainder))
          : remainder;
      return result;
    })
    .join("\n");
}

function renderNode(node: ParseNode, depth = 0): string {
  assertSafeHtmlDepth(depth);

  if (node.nodeName === "#text" && "value" in node) {
    return node.value;
  }

  if (!isElement(node)) {
    return "";
  }

  if (DROPPED_TAGS.has(node.tagName)) {
    return "";
  }

  const content = renderChildren(node, depth);

  switch (node.tagName) {
    case "a": {
      const href = getAttribute(node, "href");
      return href && isStableContentUrl(href)
        ? `[${content}](${escapeMarkdownUrl(href)})`
        : content;
    }
    case "audio":
    case "file":
    case "pdf":
    case "video":
      return renderMedia(node, depth);
    case "b":
    case "strong":
      return `**${content}**`;
    case "br":
      return "\n";
    case "callout": {
      const icon = escapeMarkdownText(
        (getAttribute(node, "icon") ?? "").slice(0, 16)
      );
      const body = normalizeBlock(content);
      const quoted = [icon, body]
        .filter(Boolean)
        .join(" ")
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
      return `\n${quoted}\n`;
    }
    case "code":
      return `\`${content}\``;
    case "column":
      return `\n${normalizeBlock(content)}\n`;
    case "columns":
      return `\n${normalizeBlock(content)}\n`;
    case "database":
    case "page":
      return renderReference(node, depth);
    case "del":
    case "s":
    case "strike":
      return `~~${content}~~`;
    case "details": {
      const summary = node.childNodes.find(
        (child): child is ParseElement =>
          isElement(child) && child.tagName === "summary"
      );
      const summaryText = summary
        ? normalizeBlock(renderChildren(summary, depth))
        : "Details";
      const body = node.childNodes
        .filter((child) => child !== summary)
        .map((child) => renderNode(child, depth + 1))
        .join("");
      return `\n#### ${summaryText}\n\n${normalizeBlock(body)}\n`;
    }
    case "em":
    case "i":
      return `*${content}*`;
    case "empty-block":
      return "\n";
    case "h1":
      return `\n# ${normalizeBlock(content)}\n`;
    case "h2":
      return `\n## ${normalizeBlock(content)}\n`;
    case "h3":
      return `\n### ${normalizeBlock(content)}\n`;
    case "h4":
      return `\n#### ${normalizeBlock(content)}\n`;
    case "img": {
      const source = getAttribute(node, "src");
      const alt = escapeMarkdownText(getAttribute(node, "alt") ?? "");
      return source && isStableContentUrl(source)
        ? `![${alt}](${escapeMarkdownUrl(source)})`
        : alt;
    }
    case "mention-date": {
      const start = getAttribute(node, "start");
      const end = getAttribute(node, "end");
      return [start, end].filter(Boolean).join(" – ");
    }
    case "synced-block":
    case "synced-block-reference":
      return `\n${normalizeBlock(content)}\n`;
    case "table":
      return `\n${renderTable(node, depth)}\n`;
    case "table-of-contents":
      return "";
    case "unknown": {
      const blockType = escapeMarkdownText(
        getAttribute(node, "alt") ?? "unsupported block"
      );
      return `\n> Notion content unavailable: ${blockType}\n`;
    }
    default:
      return content;
  }
}

function convertNotionHtmlBlock(value: string): string | null {
  const fragment = parseFragment(value);
  const firstElement = fragment.childNodes.find(isElement);

  if (!firstElement || !NOTION_BLOCK_TAGS.has(firstElement.tagName)) {
    return null;
  }

  return normalizeBlock(
    fragment.childNodes.map((node) => renderNode(node)).join("")
  );
}

function convertSelfClosingNotionTag(value: string): string | null {
  if (
    !/^<(?:empty-block|mention-date|table-of-contents|unknown)\b/i.test(value)
  ) {
    return null;
  }

  const fragment = parseFragment(value);
  return normalizeBlock(
    fragment.childNodes.map((node) => renderNode(node)).join("")
  );
}

function remarkNotionMarkdown() {
  return (tree: MdastParent) => {
    visit(tree, "html", (node: Html, index, parent) => {
      if (index === undefined || !parent) {
        return;
      }

      const converted =
        convertNotionHtmlBlock(node.value) ??
        convertSelfClosingNotionTag(node.value);

      if (converted === null) {
        return;
      }

      const replacement = remark().use(remarkGfm).parse(converted)
        .children as RootContent[];
      (parent as MdastParent).children.splice(index, 1, ...replacement);

      return [SKIP, index + replacement.length];
    });
  };
}

function rehypeNotionInlineElements() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element) => {
      if (NOTION_MEDIA_TAGS.has(node.tagName)) {
        const source = node.properties.src;
        node.tagName =
          typeof source === "string" && isStableContentUrl(source)
            ? "a"
            : "span";
        node.properties =
          node.tagName === "a" && typeof source === "string"
            ? { href: source }
            : {};
        if (node.children.length === 0) {
          node.children = [{ type: "text", value: "Open attachment" }];
        }
        return;
      }

      if (!NOTION_REFERENCE_TAGS.has(node.tagName)) {
        return;
      }

      const url = node.properties.url;
      if (
        node.tagName !== "mention-user" &&
        typeof url === "string" &&
        isStableContentUrl(url)
      ) {
        node.tagName = "a";
        node.properties = { href: url };
        return;
      }

      node.tagName = "span";
      node.properties = {};
      if (node.children.length === 0) {
        node.children = [{ type: "text", value: "Open in Notion" }];
      }
    });
  };
}

function rehypeStableMedia() {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "img") {
        const source = node.properties.src;

        if (typeof source !== "string" || !isStableContentUrl(source)) {
          const alt =
            typeof node.properties.alt === "string"
              ? node.properties.alt
              : "Image";
          node.tagName = "span";
          node.properties = {};
          node.children = [
            {
              type: "text",
              value: `[${alt} unavailable: use a stable image URL]`,
            },
          ];
        }
      }

      if (node.tagName === "a") {
        const href = node.properties.href;
        if (typeof href === "string" && isTemporaryNotionFileUrl(href)) {
          delete node.properties.href;
        }
      }
    });
  };
}

export async function renderBlogMarkdown(markdown: string): Promise<string> {
  const markdownBytes = new TextEncoder().encode(markdown).byteLength;
  if (markdownBytes > MAX_MARKDOWN_BYTES) {
    throw new Error(
      `Blog content exceeds the ${MAX_MARKDOWN_BYTES.toLocaleString()} byte limit`
    );
  }

  const normalizedMarkdown = normalizeNotionMarkdown(markdown);

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkNotionMarkdown)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeNotionInlineElements)
    .use(rehypeStableMedia)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(normalizedMarkdown);

  return processed.toString();
}
