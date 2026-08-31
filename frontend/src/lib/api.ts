// Real API client for the Django/DRF backend. Replaces the old hardcoded
// src/lib/reviews-data.ts fixtures — every call here hits the actual database.

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000/api";

export type ReviewScore = {
  iso_prediction: number; // -1 = anomaly, 1 = normal
  iso_anomaly_score: number; // lower = more suspicious
  is_trusted: boolean;
};

export type ApiReview = {
  review_id: string;
  rating: number;
  review_title: string;
  content_clean: string;
  verified_purchase: boolean;
  posted_at: string | null;
  score: ReviewScore | null; // null until the scoring pipeline has run for this review
};

export type ProductTrustReport = {
  total_reviews: number;
  fake_count: number;
  authenticity_rate: number;
  raw_avg_rating: number;
  adjusted_rating: number;
  summary_text: string;
  pros: string[];
  cons: string[];
  verdict: string;
  computed_at: string;
};

export type ApiProduct = {
  asin: string;
  name: string;
  trust_report: ProductTrustReport | null; // null until generate_summaries has run for this product
};

// DRF's default PageNumberPagination wraps every list endpoint in this envelope.
// Forgetting to unwrap `.results` is the #1 cause of "the list just doesn't show up".
type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new ApiError(res.status, `Request to ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch one page of products. Pass a full "next" URL to page forward. */
export async function fetchProductsPage(nextUrl?: string): Promise<Paginated<ApiProduct>> {
  if (nextUrl) {
    // `next`/`previous` from DRF are already absolute URLs — fetch them directly.
    const res = await fetch(nextUrl);
    if (!res.ok) throw new ApiError(res.status, `Failed to fetch ${nextUrl}`);
    return res.json();
  }
  return apiFetch<Paginated<ApiProduct>>("/products/");
}

/**
 * Fetch every product across all pages. Fine for a demo-scale catalog; for a
 * large one you'd want a dedicated search/filter endpoint instead of walking
 * every page client-side.
 */
export async function fetchAllProducts(): Promise<ApiProduct[]> {
  const all: ApiProduct[] = [];
  let next: string | undefined;
  do {
    const page = await fetchProductsPage(next);
    all.push(...page.results);
    next = page.next ?? undefined;
  } while (next);
  return all;
}

/** Fetch a single product by ASIN. Returns null on 404 instead of throwing. */
export async function fetchProduct(asin: string): Promise<ApiProduct | null> {
  try {
    return await apiFetch<ApiProduct>(`/products/${encodeURIComponent(asin)}/`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Fetch every review for a product (walks pagination automatically). */
export async function fetchProductReviews(asin: string): Promise<ApiReview[]> {
  const all: ApiReview[] = [];
  let path: string | undefined = `/products/${encodeURIComponent(asin)}/reviews/`;
  let nextUrl: string | undefined;
  while (path || nextUrl) {
    const page: Paginated<ApiReview> = nextUrl
      ? await (async () => {
          const res = await fetch(nextUrl!);
          if (!res.ok) throw new ApiError(res.status, `Failed to fetch ${nextUrl}`);
          return res.json();
        })()
      : await apiFetch<Paginated<ApiReview>>(path!);
    all.push(...page.results);
    nextUrl = page.next ?? undefined;
    path = undefined;
  }
  return all;
}

export function isValidAsin(value: string): boolean {
  return /^[A-Z0-9]{10}$/i.test(value.trim());
}
