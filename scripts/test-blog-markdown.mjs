import { readFile } from "node:fs/promises";

import { build } from "esbuild";

const result = await build({
  entryPoints: ["lib/blog-markdown.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  conditions: ["react-server", "node", "import"],
  alias: { "@": process.cwd() },
});

const source = result.outputFiles[0].text;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString(
  "base64"
)}`;
const { renderBlogMarkdown } = await import(moduleUrl);

const fixtures = [
  {
    name: "standard Markdown and GFM",
    input: "# Heading\n\n- [x] Task\n\n| A | B |\n| - | - |\n| 1 | 2 |",
    includes: ["<h1>Heading</h1>", "<table>", 'type="checkbox"'],
  },
  {
    name: "Notion enhanced blocks",
    input: `<callout icon="tip" color="blue_bg">
\tSafe **bold**
</callout>

<table header-row="true">
\t<tr><td>Name</td><td>Value</td></tr>
\t<tr><td>a\\|b</td><td>**bold**</td></tr>
</table>

<synced_block url="https://notion.so/x">
\tSynced **content**
</synced_block>
<table_of_contents/>

<mention-date start="2026-08-13" end="2026-08-14"/>`,
    includes: [
      "<blockquote>",
      "<table>",
      "a|b",
      "Synced <strong>content</strong>",
      "2026-08-13 – 2026-08-14",
    ],
    excludes: ["synced_block", "table_of_contents"],
  },
  {
    name: "Notion references and attributes",
    input: `Hello <mention-page url="https://notion.so/x">Page</mention-page>.

<file src="https://example.com/file.pdf">Document</file>

![Caption](https://example.com/image.png) {color="blue"}

# Heading {toggle="true" color="blue"}`,
    includes: [
      '<a href="https://notion.so/x">Page</a>',
      '<a href="https://example.com/file.pdf">Document</a>',
      '<img src="https://example.com/image.png" alt="Caption">',
      "<h1>Heading</h1>",
    ],
    excludes: ['{color="blue"}', '{toggle="true"'],
  },
  {
    name: "code examples stay literal",
    input: `\`\`\`md
<synced_block>
# Heading {color="blue"}
</synced_block>
\`\`\`

Use \`<table_of_contents/> {color="red"}\` literally.`,
    includes: [
      "&#x3C;synced_block>",
      '{color="blue"}',
      "&#x3C;table_of_contents/>",
      '{color="red"}',
    ],
  },
  {
    name: "hostile HTML and URLs",
    input: `<script>alert(1)</script>
<iframe srcdoc="<script>alert(1)</script>"></iframe>
<img src="data:text/html,bad" onerror="alert(1)" alt="bad">
[unsafe](javascript%3Aalert%281%29)`,
    excludes: ["<script", "<iframe", "onerror", "javascript:", "data:text"],
  },
  {
    name: "temporary Notion media",
    input:
      "![Temporary](https://prod-files-secure.s3.us-west-2.amazonaws.com/file?X-Amz-Signature=abc)",
    includes: ["unavailable: use a stable image URL"],
    excludes: ["X-Amz-Signature"],
  },
];

for (const fixture of fixtures) {
  const output = await renderBlogMarkdown(fixture.input);

  for (const value of fixture.includes ?? []) {
    if (!output.includes(value)) {
      throw new Error(`${fixture.name}: missing ${JSON.stringify(value)}`);
    }
  }

  for (const value of fixture.excludes ?? []) {
    if (output.includes(value)) {
      throw new Error(
        `${fixture.name}: found forbidden ${JSON.stringify(value)}`
      );
    }
  }

  console.log(`pass  ${fixture.name}`);
}

const deeplyNestedHtml = `<callout>\n${"<div>".repeat(101)}deep${"</div>".repeat(
  101
)}\n</callout>`;
try {
  await renderBlogMarkdown(deeplyNestedHtml);
  throw new Error("deeply nested Notion HTML should have been rejected");
} catch (error) {
  if (
    !(error instanceof Error) ||
    !error.message.includes("maximum nesting depth")
  ) {
    throw error;
  }
}
console.log("pass  deeply nested Notion HTML is rejected");

try {
  await renderBlogMarkdown("x".repeat(2_000_001));
  throw new Error("oversized Markdown should have been rejected");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("byte limit")) {
    throw error;
  }
}
console.log("pass  oversized Markdown is rejected");

const sourceText = await readFile("lib/blog-markdown.ts", "utf8");
if (!sourceText.includes(".use(rehypeSanitize)")) {
  throw new Error("Renderer must keep rehype-sanitize in its output pipeline");
}
