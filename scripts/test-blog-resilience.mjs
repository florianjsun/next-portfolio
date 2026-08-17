import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { build } from "esbuild";

const NOTION_STUB = `
export const APIErrorCode = { ObjectNotFound: "object_not_found" };

export function isNotionClientError() {
  return false;
}

export function isFullPage(page) {
  return Boolean(page && page.object === "page" && page.properties);
}

export class Client {
  constructor() {}

  dataSources = {
    retrieve: async (...args) => {
      const impl = globalThis.__notionTest?.retrieve;
      if (typeof impl === "function") {
        return impl(...args);
      }
      throw new Error("Notion retrieve failed");
    },
    query: async (...args) => {
      const impl = globalThis.__notionTest?.query;
      if (typeof impl === "function") {
        return impl(...args);
      }
      throw new Error("Notion query failed");
    },
  };

  pages = {
    retrieveMarkdown: async (...args) => {
      const impl = globalThis.__notionTest?.retrieveMarkdown;
      if (typeof impl === "function") {
        return impl(...args);
      }
      throw new Error("Notion retrieveMarkdown failed");
    },
  };
}
`;

const result = await build({
  entryPoints: ["lib/blogs.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  conditions: ["react-server", "node", "import"],
  alias: { "@": process.cwd() },
  plugins: [
    {
      name: "blog-resilience-stubs",
      setup(pluginBuild) {
        pluginBuild.onResolve(
          { filter: /^(server-only|next\/cache|react|@notionhq\/client)$/ },
          (args) => ({ path: args.path, namespace: "stub" })
        );
        pluginBuild.onLoad({ filter: /.*/, namespace: "stub" }, (args) => {
          const stubs = {
            "server-only": "export {}",
            "next/cache": "export const unstable_cache = (fn) => fn;",
            react: "export const cache = (fn) => fn;",
            "@notionhq/client": NOTION_STUB,
          };
          return { contents: stubs[args.path], loader: "js" };
        });
      },
    },
  ],
});

const bundleDir = await mkdtemp(join(tmpdir(), "blog-resilience-"));
const bundleFile = join(bundleDir, "blogs.mjs");
await writeFile(bundleFile, result.outputFiles[0].text);

const {
  getAllBlogSlugs,
  getAllBlogsMeta,
  getBlogPost,
  getFeaturedBlogs,
  getNotionConfig,
  tryMapPublishedBlogRecord,
  uniquePublishedBlogRecords,
} = await import(pathToFileURL(bundleFile).href);

const ENV_KEYS = ["NOTION_TOKEN", "NOTION_DATA_SOURCE_ID"];

function withEnv(vars, fn) {
  const previous = Object.fromEntries(
    ENV_KEYS.map((key) => [key, process.env[key]])
  );

  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  Object.assign(process.env, vars);

  try {
    return fn();
  } finally {
    for (const key of ENV_KEYS) {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    }
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makePage({ id = "page-1", properties = {} } = {}) {
  return {
    object: "page",
    id,
    last_edited_time: "2026-01-16T00:00:00.000Z",
    properties: {
      Title: { type: "title", title: [{ plain_text: "Hello World" }] },
      Slug: { type: "rich_text", rich_text: [{ plain_text: "hello-world" }] },
      Status: { type: "status", status: { name: "Published" } },
      PublishedAt: { type: "date", date: { start: "2026-01-15" } },
      Description: {
        type: "rich_text",
        rich_text: [{ plain_text: "A valid description." }],
      },
      Tags: { type: "multi_select", multi_select: [{ name: "nextjs" }] },
      CoverImage: { type: "url", url: "https://example.com/cover.png" },
      ReadingTime: { type: "number", number: 4 },
      Featured: { type: "checkbox", checkbox: true },
      ...properties,
    },
  };
}

const VALID_SCHEMA = {
  Title: { type: "title" },
  Slug: { type: "rich_text" },
  Status: {
    type: "status",
    status: { options: [{ name: "Published" }] },
  },
  PublishedAt: { type: "date" },
  Description: { type: "rich_text" },
  Tags: { type: "multi_select" },
  CoverImage: { type: "url" },
  ReadingTime: { type: "number" },
  Featured: { type: "checkbox" },
};

function useNotionTest(impl) {
  globalThis.__notionTest = impl;
}

function clearNotionTest() {
  delete globalThis.__notionTest;
}

const originalWarn = console.warn;
const originalError = console.error;
console.warn = () => {};
console.error = () => {};

await withEnv({ NOTION_TOKEN: "secret_test" }, async () => {
  const config = getNotionConfig();
  assert(config === null, "token-only config should return null");
  const [slugs, meta, featured, post] = await Promise.all([
    getAllBlogSlugs(),
    getAllBlogsMeta(),
    getFeaturedBlogs(),
    getBlogPost("hello-world"),
  ]);
  assert(Array.isArray(slugs) && slugs.length === 0, "slugs stay empty");
  assert(Array.isArray(meta) && meta.length === 0, "meta stays empty");
  assert(
    Array.isArray(featured) && featured.length === 0,
    "featured stays empty"
  );
  assert(post === null, "missing post stays null");
});
console.log("pass  incomplete config does not throw");

await withEnv({ NOTION_DATA_SOURCE_ID: "ds_test" }, async () => {
  const config = getNotionConfig();
  assert(config === null, "data-source-only config should return null");
});
console.log("pass  incomplete data source config does not throw");

const validPage = makePage();
const mapped = tryMapPublishedBlogRecord(validPage);
assert(mapped?.slug === "hello-world", "valid page should map");

const unpublished = tryMapPublishedBlogRecord(
  makePage({
    id: "draft-1",
    properties: {
      Status: { type: "status", status: { name: "Draft" } },
    },
  })
);
assert(unpublished === null, "unpublished page should be skipped");

const missingTitle = tryMapPublishedBlogRecord(
  makePage({
    id: "dirty-1",
    properties: { Title: undefined },
  })
);
assert(missingTitle === null, "page missing Title should be skipped");

const invalidSlug = tryMapPublishedBlogRecord(
  makePage({
    id: "dirty-2",
    properties: {
      Slug: { type: "rich_text", rich_text: [{ plain_text: "Hello World" }] },
    },
  })
);
assert(invalidSlug === null, "invalid slug should be skipped");
console.log("pass  dirty records are skipped");

const unique = uniquePublishedBlogRecords([
  { slug: "hello-world", title: "First" },
  { slug: "hello-world", title: "Duplicate" },
  { slug: "second-post", title: "Second" },
]);
assert(unique.length === 2, "duplicates should be removed");
assert(unique[0].title === "First", "first slug occurrence is kept");
assert(unique[1].slug === "second-post", "distinct slugs are kept");
console.log("pass  duplicate slugs do not throw");

await withEnv(
  { NOTION_TOKEN: "secret_test", NOTION_DATA_SOURCE_ID: "ds_test" },
  async () => {
    clearNotionTest();
    const [slugs, meta, featured, post] = await Promise.all([
      getAllBlogSlugs(),
      getAllBlogsMeta(),
      getFeaturedBlogs(),
      getBlogPost("hello-world"),
    ]);
    assert(slugs.length === 0, "failed slugs return []");
    assert(meta.length === 0, "failed meta returns []");
    assert(featured.length === 0, "failed featured returns []");
    assert(post === null, "failed post returns null");
  }
);
console.log("pass  list functions return empty on Notion failure");

await withEnv(
  { NOTION_TOKEN: "secret_test", NOTION_DATA_SOURCE_ID: "ds_test" },
  async () => {
    useNotionTest({
      retrieve: async () => ({ properties: VALID_SCHEMA }),
      query: async () => ({
        results: [
          makePage({ id: "keep-1" }),
          makePage({
            id: "draft-1",
            properties: {
              Status: { type: "status", status: { name: "Draft" } },
            },
          }),
          makePage({
            id: "dup-1",
            properties: {
              Title: {
                type: "title",
                title: [{ plain_text: "Duplicate Title" }],
              },
            },
          }),
          { object: "page", id: "incomplete-1" },
          makePage({
            id: "dirty-1",
            properties: { Title: undefined },
          }),
        ],
        has_more: false,
        next_cursor: null,
        request_status: { type: "incomplete" },
      }),
    });

    const meta = await getAllBlogsMeta();
    assert(meta.length === 1, "only the first valid unique record is kept");
    assert(meta[0].slug === "hello-world", "kept record has the first slug");
  }
);
console.log("pass  query skips dirty, duplicate, and incomplete pages");

clearNotionTest();
console.warn = originalWarn;
console.error = originalError;
await rm(bundleDir, { recursive: true, force: true });
console.log("ok    blog resilience");
