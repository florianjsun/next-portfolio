import "server-only";

import {
  APIErrorCode,
  Client,
  isFullPage,
  isNotionClientError,
  type PageObjectResponse,
  type QueryDataSourceParameters,
} from "@notionhq/client";
import { unstable_cache } from "next/cache";
import { z } from "zod";

import { renderBlogMarkdown } from "@/lib/blog-markdown";
import { isStableContentUrl } from "@/lib/content-urls";

export const BLOG_CACHE_TAG = "notion-blogs";

const NOTION_API_VERSION = "2026-03-11";
const DEFAULT_REVALIDATE_SECONDS = 900;
const PROPERTY_NAMES = [
  "Title",
  "Slug",
  "Status",
  "PublishedAt",
  "Description",
  "Tags",
  "CoverImage",
  "ReadingTime",
  "Featured",
] as const;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface BlogFrontmatter {
  title: string;
  date: string;
  description: string;
  tags: string[];
  coverImage?: string;
  readingTime?: number;
  featured?: boolean;
}

export interface BlogMeta extends BlogFrontmatter {
  slug: string;
  updatedAt: string;
}

export interface BlogPost extends BlogMeta {
  contentHtml: string;
}

interface NotionBlogRecord extends BlogMeta {
  notionPageId: string;
}

interface NotionConfig {
  token: string;
  dataSourceId: string;
}

type NotionProperty = PageObjectResponse["properties"][string];
type StatusPropertyType = "select" | "status";

const notionBlogRecordSchema = z.object({
  notionPageId: z.string().min(1),
  slug: z.string().min(1).max(96).regex(SLUG_PATTERN),
  title: z.string().min(1).max(200),
  date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "PublishedAt must be a valid date",
  }),
  updatedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "last_edited_time must be a valid date",
  }),
  description: z.string().min(1).max(600),
  tags: z.array(z.string().min(1).max(50)).max(20),
  coverImage: z
    .string()
    .max(2048)
    .refine(isStableContentUrl, {
      message: "CoverImage must be a stable site-relative path or HTTPS URL",
    })
    .optional(),
  readingTime: z.number().int().positive().max(999).optional(),
  featured: z.boolean().optional(),
});

let notionClient: Client | undefined;
let didWarnAboutMissingConfig = false;

function getRevalidateSeconds(): number {
  const value = Number(process.env.NOTION_BLOG_REVALIDATE_SECONDS);
  return Number.isInteger(value) && value > 0
    ? value
    : DEFAULT_REVALIDATE_SECONDS;
}

function getNotionConfig(): NotionConfig | null {
  const token = process.env.NOTION_TOKEN?.trim();
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID?.trim();

  if (!token && !dataSourceId) {
    if (!didWarnAboutMissingConfig) {
      console.warn(
        "Notion blog is disabled: set NOTION_TOKEN and NOTION_DATA_SOURCE_ID"
      );
      didWarnAboutMissingConfig = true;
    }
    return null;
  }

  if (!token || !dataSourceId) {
    throw new Error(
      "Notion blog configuration is incomplete: NOTION_TOKEN and " +
        "NOTION_DATA_SOURCE_ID must be set together"
    );
  }

  return { token, dataSourceId };
}

function getNotionClient(config: NotionConfig): Client {
  notionClient ??= new Client({
    auth: config.token,
    notionVersion: NOTION_API_VERSION,
    timeoutMs: 15_000,
    retry: { maxRetries: 3 },
  });

  return notionClient;
}

function getProperty(
  page: PageObjectResponse,
  name: (typeof PROPERTY_NAMES)[number]
): NotionProperty {
  const property = page.properties[name];

  if (!property) {
    throw new Error(`Notion page ${page.id} is missing the ${name} property`);
  }

  return property;
}

function richTextToPlainText(value: Array<{ plain_text: string }>): string {
  return value
    .map((item) => item.plain_text)
    .join("")
    .trim();
}

function hasMoreRichTextItems(property: NotionProperty): boolean {
  return "has_more" in property && property.has_more === true;
}

function getTextProperty(
  page: PageObjectResponse,
  name: "CoverImage" | "Description" | "Slug" | "Title"
): string {
  const property = getProperty(page, name);

  if (property.type === "title") {
    if (hasMoreRichTextItems(property)) {
      throw new Error(
        `Notion property ${name} on page ${page.id} exceeds 25 rich-text items`
      );
    }
    return richTextToPlainText(property.title);
  }

  if (property.type === "rich_text") {
    if (hasMoreRichTextItems(property)) {
      throw new Error(
        `Notion property ${name} on page ${page.id} exceeds 25 rich-text items`
      );
    }
    return richTextToPlainText(property.rich_text);
  }

  if (property.type === "url") {
    return property.url?.trim() ?? "";
  }

  throw new Error(
    `Notion property ${name} on page ${page.id} must contain text`
  );
}

function getStatusProperty(page: PageObjectResponse): string {
  const property = getProperty(page, "Status");

  if (property.type === "status") {
    return property.status?.name ?? "";
  }

  if (property.type === "select") {
    return property.select?.name ?? "";
  }

  throw new Error(
    `Notion property Status on page ${page.id} must be a status or select`
  );
}

function getDateProperty(page: PageObjectResponse): string {
  const property = getProperty(page, "PublishedAt");

  if (property.type !== "date" || !property.date?.start) {
    throw new Error(
      `Notion property PublishedAt on page ${page.id} must be a date`
    );
  }

  return property.date.start;
}

function getTagsProperty(page: PageObjectResponse): string[] {
  const property = getProperty(page, "Tags");

  if (property.type !== "multi_select") {
    throw new Error(
      `Notion property Tags on page ${page.id} must be a multi-select`
    );
  }

  return property.multi_select.map((tag) => tag.name);
}

function getNumberProperty(page: PageObjectResponse): number | undefined {
  const property = getProperty(page, "ReadingTime");

  if (property.type !== "number") {
    throw new Error(
      `Notion property ReadingTime on page ${page.id} must be a number`
    );
  }

  return property.number ?? undefined;
}

function getCheckboxProperty(page: PageObjectResponse): boolean {
  const property = getProperty(page, "Featured");

  if (property.type !== "checkbox") {
    throw new Error(
      `Notion property Featured on page ${page.id} must be a checkbox`
    );
  }

  return property.checkbox;
}

function mapNotionPage(page: PageObjectResponse): NotionBlogRecord {
  if (getStatusProperty(page) !== "Published") {
    throw new Error(
      `Notion query returned non-published page ${page.id}; check Status`
    );
  }

  const coverImage = getTextProperty(page, "CoverImage") || undefined;
  const candidate = {
    notionPageId: page.id,
    slug: getTextProperty(page, "Slug"),
    title: getTextProperty(page, "Title"),
    date: getDateProperty(page),
    updatedAt: page.last_edited_time,
    description: getTextProperty(page, "Description"),
    tags: getTagsProperty(page),
    coverImage,
    readingTime: getNumberProperty(page),
    featured: getCheckboxProperty(page),
  };

  const parsed = notionBlogRecordSchema.safeParse(candidate);

  if (!parsed.success) {
    throw new Error(
      `Invalid Notion blog page ${page.id}: ${z.prettifyError(parsed.error)}`
    );
  }

  return parsed.data;
}

async function getStatusPropertyType(
  client: Client,
  dataSourceId: string
): Promise<StatusPropertyType> {
  const dataSource = await client.dataSources.retrieve({
    data_source_id: dataSourceId,
  });
  const properties = dataSource.properties;

  const expectedProperties: Record<string, string[]> = {
    Title: ["title"],
    Slug: ["rich_text"],
    Status: ["select", "status"],
    PublishedAt: ["date"],
    Description: ["rich_text"],
    Tags: ["multi_select"],
    CoverImage: ["rich_text", "url"],
    ReadingTime: ["number"],
    Featured: ["checkbox"],
  };

  for (const [name, allowedTypes] of Object.entries(expectedProperties)) {
    const property = properties[name];
    if (!property || !allowedTypes.includes(property.type)) {
      throw new Error(
        `Notion data source property ${name} must be one of: ${allowedTypes.join(
          ", "
        )}`
      );
    }
  }

  const statusProperty = properties.Status;
  if (statusProperty.type !== "status" && statusProperty.type !== "select") {
    throw new Error("Notion data source property Status is invalid");
  }

  const statusOptions =
    statusProperty.type === "status"
      ? statusProperty.status.options
      : statusProperty.select.options;
  if (!statusOptions.some((option) => option.name === "Published")) {
    throw new Error(
      'Notion data source property Status must include a "Published" option'
    );
  }

  return statusProperty.type;
}

async function loadPublishedBlogRecords(
  dataSourceId: string
): Promise<NotionBlogRecord[]> {
  const config = getNotionConfig();
  if (!config || config.dataSourceId !== dataSourceId) {
    throw new Error("Notion blog data source configuration changed");
  }

  const client = getNotionClient(config);
  const statusPropertyType = await getStatusPropertyType(
    client,
    config.dataSourceId
  );
  const filter: NonNullable<QueryDataSourceParameters["filter"]> =
    statusPropertyType === "status"
      ? {
          property: "Status",
          status: { equals: "Published" },
        }
      : {
          property: "Status",
          select: { equals: "Published" },
        };

  const records: NotionBlogRecord[] = [];
  let startCursor: string | null | undefined;

  do {
    const response = await client.dataSources.query({
      data_source_id: config.dataSourceId,
      filter,
      sorts: [{ property: "PublishedAt", direction: "descending" }],
      filter_properties: [...PROPERTY_NAMES],
      page_size: 100,
      result_type: "page",
      start_cursor: startCursor,
    });

    for (const result of response.results) {
      if (!isFullPage(result)) {
        throw new Error(
          `Notion returned an incomplete blog page response for ${result.id}`
        );
      }
      records.push(mapNotionPage(result));
    }

    if (response.request_status?.type === "incomplete") {
      throw new Error("Notion blog query reached its result limit");
    }

    startCursor = response.has_more ? response.next_cursor : undefined;
  } while (startCursor);

  const slugs = new Set<string>();
  for (const record of records) {
    if (slugs.has(record.slug)) {
      throw new Error(`Duplicate published Notion blog slug: ${record.slug}`);
    }
    slugs.add(record.slug);
  }

  return records.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

const getCachedPublishedBlogRecords = unstable_cache(
  loadPublishedBlogRecords,
  ["notion-published-blog-records-v1"],
  {
    revalidate: getRevalidateSeconds(),
    tags: [BLOG_CACHE_TAG],
  }
);

async function getPublishedBlogRecords(): Promise<NotionBlogRecord[]> {
  const config = getNotionConfig();
  if (!config) {
    return [];
  }

  return getCachedPublishedBlogRecords(config.dataSourceId);
}

async function loadBlogPost(
  slug: string,
  notionPageId: string,
  _updatedAt: string,
  dataSourceId: string
): Promise<{ contentHtml: string; readingTime: number } | null> {
  const config = getNotionConfig();
  if (!config || config.dataSourceId !== dataSourceId) {
    throw new Error("Notion blog data source configuration changed");
  }

  try {
    const response = await getNotionClient(config).pages.retrieveMarkdown({
      page_id: notionPageId,
      include_transcript: false,
    });

    if (response.truncated) {
      throw new Error(
        `Notion truncated blog page ${notionPageId}; reduce its size`
      );
    }

    if (response.unknown_block_ids.length > 0) {
      console.warn(
        `Notion blog ${slug} contains unsupported blocks:`,
        response.unknown_block_ids
      );
    }

    const contentHtml = await renderBlogMarkdown(response.markdown);

    return {
      contentHtml,
      readingTime: estimateReadingTime(response.markdown),
    };
  } catch (error) {
    if (
      isNotionClientError(error) &&
      error.code === APIErrorCode.ObjectNotFound
    ) {
      return null;
    }
    throw error;
  }
}

const getCachedBlogPost = unstable_cache(
  loadBlogPost,
  ["notion-blog-post-v1"],
  {
    revalidate: getRevalidateSeconds(),
    tags: [BLOG_CACHE_TAG],
  }
);

function toBlogMeta(record: NotionBlogRecord): BlogMeta {
  return {
    slug: record.slug,
    title: record.title,
    date: record.date,
    updatedAt: record.updatedAt,
    description: record.description,
    tags: record.tags,
    coverImage: record.coverImage,
    readingTime: record.readingTime,
    featured: record.featured,
  };
}

export async function getAllBlogSlugs(): Promise<string[]> {
  const records = await getPublishedBlogRecords();
  return records.map((record) => record.slug);
}

export async function getAllBlogsMeta(): Promise<BlogMeta[]> {
  const records = await getPublishedBlogRecords();
  return records.map(toBlogMeta);
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  if (!SLUG_PATTERN.test(slug) || slug.length > 96) {
    return null;
  }

  const records = await getPublishedBlogRecords();
  const record = records.find((item) => item.slug === slug);

  if (!record) {
    return null;
  }

  const cachedContent = await getCachedBlogPost(
    record.slug,
    record.notionPageId,
    record.updatedAt,
    getNotionConfig()?.dataSourceId ?? ""
  );

  if (!cachedContent) {
    return null;
  }

  return {
    ...toBlogMeta(record),
    ...cachedContent,
    readingTime: record.readingTime ?? cachedContent.readingTime,
  };
}

export async function getFeaturedBlogs(): Promise<BlogMeta[]> {
  const all = await getAllBlogsMeta();
  const featured = all.filter((blog) => blog.featured);
  return featured.length > 0 ? featured.slice(0, 3) : all.slice(0, 3);
}

export function estimateReadingTime(content: string): number {
  const withoutMarkup = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#>*_`~|\[\](){}-]/g, " ");
  const latinWords = withoutMarkup.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g);
  const cjkCharacters = withoutMarkup.match(/[\u3400-\u9fff\uf900-\ufaff]/g);
  const minutes =
    (latinWords?.length ?? 0) / 200 + (cjkCharacters?.length ?? 0) / 400;

  return Math.max(1, Math.ceil(minutes));
}
