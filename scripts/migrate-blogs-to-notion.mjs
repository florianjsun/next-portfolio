import fs from "node:fs/promises";
import path from "node:path";

import { Client, isFullPage } from "@notionhq/client";
import { config as loadEnv } from "dotenv";
import matter from "gray-matter";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const NOTION_API_VERSION = "2026-03-11";
const BLOGS_DIRECTORY = path.join(process.cwd(), "content", "blogs");
const shouldWrite = process.argv.includes("--write");
const REQUIRED_PROPERTIES = {
  Title: ["title"],
  Slug: ["rich_text"],
  Status: ["status", "select"],
  PublishedAt: ["date"],
  Description: ["rich_text"],
  Tags: ["multi_select"],
  CoverImage: ["rich_text"],
  ReadingTime: ["number"],
  Featured: ["checkbox"],
};

function requireEnvironmentVariable(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local before migrating.`);
  }
  return value;
}

function plainText(property) {
  if (property?.type !== "rich_text") {
    return "";
  }
  return property.rich_text
    .map((item) => item.plain_text)
    .join("")
    .trim();
}

async function getExistingSlugs(notion, dataSourceId) {
  const slugs = new Set();
  let startCursor;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter_properties: ["Slug"],
      page_size: 100,
      result_type: "page",
      start_cursor: startCursor,
    });

    for (const result of response.results) {
      if (isFullPage(result)) {
        const slug = plainText(result.properties.Slug);
        if (slug) {
          slugs.add(slug);
        }
      }
    }

    startCursor = response.has_more ? response.next_cursor : undefined;
  } while (startCursor);

  return slugs;
}

function requireString(frontmatter, name, filename) {
  const value = frontmatter[name];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${filename}: frontmatter ${name} must be a string`);
  }
  return value.trim();
}

function buildProperties(frontmatter, filename, slug, statusType) {
  const title = requireString(frontmatter, "title", filename);
  const date = requireString(frontmatter, "date", filename);
  const description = requireString(frontmatter, "description", filename);
  const tags = frontmatter.tags;

  if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === "string")) {
    throw new Error(`${filename}: frontmatter tags must be a string array`);
  }

  const properties = {
    Title: {
      type: "title",
      title: [{ type: "text", text: { content: title } }],
    },
    Slug: {
      type: "rich_text",
      rich_text: [{ type: "text", text: { content: slug } }],
    },
    PublishedAt: { type: "date", date: { start: date } },
    Description: {
      type: "rich_text",
      rich_text: [{ type: "text", text: { content: description } }],
    },
    Tags: {
      type: "multi_select",
      multi_select: tags.map((tag) => ({ name: tag })),
    },
    CoverImage: {
      type: "rich_text",
      rich_text:
        typeof frontmatter.coverImage === "string"
          ? [
              {
                type: "text",
                text: { content: frontmatter.coverImage },
              },
            ]
          : [],
    },
    ReadingTime: {
      type: "number",
      number:
        typeof frontmatter.readingTime === "number"
          ? frontmatter.readingTime
          : null,
    },
    Featured: {
      type: "checkbox",
      checkbox: frontmatter.featured === true,
    },
  };

  properties.Status =
    statusType === "status"
      ? { type: "status", status: { name: "Draft" } }
      : { type: "select", select: { name: "Draft" } };

  return properties;
}

async function migrate() {
  const token = requireEnvironmentVariable("NOTION_TOKEN");
  const dataSourceId = requireEnvironmentVariable("NOTION_DATA_SOURCE_ID");
  const notion = new Client({
    auth: token,
    notionVersion: NOTION_API_VERSION,
  });
  const dataSource = await notion.dataSources.retrieve({
    data_source_id: dataSourceId,
  });

  for (const [name, allowedTypes] of Object.entries(REQUIRED_PROPERTIES)) {
    const property = dataSource.properties[name];
    if (!property || !allowedTypes.includes(property.type)) {
      throw new Error(
        `Notion property ${name} must be one of: ${allowedTypes.join(", ")}`
      );
    }
  }

  const statusType = dataSource.properties.Status?.type;

  if (statusType !== "status" && statusType !== "select") {
    throw new Error("Notion property Status must be a status or select");
  }

  const statusOptions = dataSource.properties.Status[statusType].options;
  for (const requiredStatus of ["Draft", "Published"]) {
    if (!statusOptions.some((option) => option.name === requiredStatus)) {
      throw new Error(
        `Notion property Status must include a ${requiredStatus} option`
      );
    }
  }

  const filenames = (await fs.readdir(BLOGS_DIRECTORY))
    .filter((filename) => filename.endsWith(".md"))
    .sort();
  const existingSlugs = await getExistingSlugs(notion, dataSourceId);

  console.log(
    shouldWrite
      ? "Migration mode: creating missing pages as Draft"
      : "Dry run: pass --write to create the listed pages"
  );

  for (const filename of filenames) {
    const slug = filename.replace(/\.md$/, "");

    if (existingSlugs.has(slug)) {
      console.log(`skip   ${slug} (already exists)`);
      continue;
    }

    const raw = await fs.readFile(path.join(BLOGS_DIRECTORY, filename), "utf8");
    const { data, content } = matter(raw);
    const properties = buildProperties(data, filename, slug, statusType);

    if (!shouldWrite) {
      console.log(`create ${slug}`);
      continue;
    }

    await notion.pages.create({
      parent: { type: "data_source_id", data_source_id: dataSourceId },
      properties,
      markdown: content.trim(),
    });
    existingSlugs.add(slug);
    console.log(`created ${slug} as Draft`);
  }
}

migrate().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
