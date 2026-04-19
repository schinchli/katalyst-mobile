import { AppConfig } from '@/config/appConfig';

export type ArticleProvider = 'AWS' | 'GCP' | 'Azure' | 'Oracle' | 'Databricks' | 'Snowflake' | 'General';
export type ArticleCategory = 'Cloud' | 'Data' | 'AI' | 'Security' | 'DevOps' | 'General';

export interface ArticleSummary {
  _id: string;
  title: string;
  slug: string;
  tag: string | null;
  excerpt: string | null;
  author: string | null;
  publishedAt: string | null;
  readTime: string | null;
  accessTier: 'free' | 'premium';
  featured: boolean;
  provider: ArticleProvider;
  category: ArticleCategory;
  organisation: string;
  relatedQuizId: string | null;
}

export interface FetchArticlesParams {
  provider?: ArticleProvider | 'Data & AI';
  sort?: 'date' | 'organisation';
  limit?: number;
}

const FALLBACK_URL = 'https://learnkloud.today';

function articlesUrl(params: FetchArticlesParams): string {
  const base = (AppConfig.web.baseUrl || FALLBACK_URL).replace(/\/$/, '');
  const qs = new URLSearchParams();

  if (params.provider && params.provider !== 'Data & AI') {
    qs.set('provider', params.provider);
  } else if (params.provider === 'Data & AI') {
    qs.set('category', 'Data,AI');
  }

  if (params.sort) qs.set('sort', params.sort);
  if (params.limit) qs.set('limit', String(params.limit));

  const query = qs.toString();
  return `${base}/api/articles${query ? `?${query}` : ''}`;
}

let _cache: { key: string; ts: number; data: ArticleSummary[] } | null = null;
const CACHE_TTL_MS = 60_000;

export async function fetchArticles(
  params: FetchArticlesParams = {},
): Promise<ArticleSummary[]> {
  const url = articlesUrl(params);
  const now = Date.now();

  if (_cache && _cache.key === url && now - _cache.ts < CACHE_TTL_MS) {
    return _cache.data;
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return _cache?.data ?? [];
    const json = (await res.json()) as { ok: boolean; articles: ArticleSummary[] };
    const data = json.articles ?? [];
    _cache = { key: url, ts: now, data };
    return data;
  } catch {
    return _cache?.data ?? [];
  }
}

export function articleWebUrl(slug: string): string {
  const base = (AppConfig.web.baseUrl || FALLBACK_URL).replace(/\/$/, '');
  return `${base}/resources/${slug}`;
}
