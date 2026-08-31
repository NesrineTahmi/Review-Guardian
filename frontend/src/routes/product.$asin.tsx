import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, BadgeCheck, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { AsinSearch } from "@/components/AsinSearch";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { StarRating } from "@/components/StarRating";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fetchProduct, fetchProductReviews, type ApiProduct, type ApiReview } from "@/lib/api";

export const Route = createFileRoute("/product/$asin")({
  loader: async ({ params }) => {
    const product = await fetchProduct(params.asin);
    // Don't bother fetching reviews for a product that doesn't exist.
    const reviews = product ? await fetchProductReviews(params.asin) : [];
    return { product, reviews, asin: params.asin };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.product?.name;
    const title = name ? `${name} - Review summary | Review Guardian` : "Product not found | Review Guardian";
    const description = name
      ? `AI summary, trusted rating and fake-review analysis for ${name}.`
      : "We could not find review data for this ASIN.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(name ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product, reviews, asin } = Route.useLoaderData();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {product ? <ProductDetail product={product} reviews={reviews} /> : <NotFound asin={asin} />}
      </main>
      <SiteFooter />
    </div>
  );
}

function NotFound({ asin }: { asin: string }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      <h1 className="text-3xl font-semibold">No review data for {asin}</h1>
      <p className="mt-3 text-muted-foreground">
        This ASIN isn't in the database yet, or hasn't been through the trust pipeline. Try a
        different ASIN below.
      </p>
      <div className="mt-8 text-left">
        <AsinSearch />
      </div>
    </div>
  );
}

/** Star histogram as % of reviews, computed client-side since the API doesn't expose one. */
function computeRatingBreakdown(reviews: ApiReview[]): Record<1 | 2 | 3 | 4 | 5, number> {
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const bucket = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    counts[bucket] += 1;
  }
  const total = reviews.length || 1;
  return {
    1: Math.round((counts[1] / total) * 100),
    2: Math.round((counts[2] / total) * 100),
    3: Math.round((counts[3] / total) * 100),
    4: Math.round((counts[4] / total) * 100),
    5: Math.round((counts[5] / total) * 100),
  };
}

function ProductDetail({ product, reviews }: { product: ApiProduct; reviews: ApiReview[] }) {
  const report = product.trust_report;
  const flagged = reviews.filter((r) => r.score !== null && !r.score.is_trusted);
  const ratingBreakdown = computeRatingBreakdown(reviews);

  return (
    <>
      <section className="bg-leaf">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary-deep">
            <ArrowLeft className="size-4" /> Analyze another product
          </Link>
          <p className="mt-6 font-mono text-xs text-muted-foreground">ASIN {product.asin}</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold md:text-4xl">{product.name || product.asin}</h1>

          <div className="mt-6 flex flex-wrap items-center gap-6">
            {report ? (
              <>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-3xl font-semibold">{report.raw_avg_rating.toFixed(1)}</span>
                    <StarRating value={report.raw_avg_rating} size={18} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Listed average · {report.total_reviews.toLocaleString()} reviews
                  </p>
                </div>
                <div className="rounded-xl bg-card px-4 py-3 shadow-soft">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <span className="font-display text-2xl font-semibold">{report.adjusted_rating.toFixed(1)}</span>
                    <StarRating value={report.adjusted_rating} size={16} />
                  </div>
                  <p className="text-sm text-muted-foreground">Review Guardian rating, suspicious reviews removed</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                This product hasn't been through the trust pipeline yet - no summary or adjusted
                rating available.
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          {report && (
            <article className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Sparkles className="size-5 text-primary" /> AI review summary
              </h2>
              <p className="mt-4 leading-relaxed text-foreground/90">
                {report.summary_text || report.verdict}
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl bg-primary-soft/60 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-primary-deep">
                    <ThumbsUp className="size-4" /> What buyers praise
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-foreground/90">
                    {report.pros.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-muted p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <ThumbsDown className="size-4" /> Recurring complaints
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm text-foreground/90">
                    {report.cons.map((c) => (
                      <li key={c} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          )}

          <section>
            <h2 className="text-xl font-semibold">
              Reviews <span className="text-muted-foreground">({reviews.length} analyzed)</span>
            </h2>
            {reviews.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No reviews found for this product.</p>
            ) : (
              <ul className="mt-5 space-y-4">
                {reviews.map((review) => (
                  <li key={review.review_id}>
                    <ReviewCard review={review} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Rating breakdown</h2>
            <ul className="mt-4 space-y-3">
              {([5, 4, 3, 2, 1] as const).map((stars) => (
                <li key={stars} className="flex items-center gap-3 text-sm">
                  <span className="w-10 shrink-0 text-muted-foreground">{stars} ★</span>
                  <Progress value={ratingBreakdown[stars]} className="h-2" />
                  <span className="w-9 shrink-0 text-right text-muted-foreground">
                    {ratingBreakdown[stars]}%
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="size-5 text-warning" /> Fake review check
            </h2>
            {report ? (
              <>
                <p className="mt-3 text-sm text-muted-foreground">
                  {report.fake_count} of {report.total_reviews} analyzed reviews show patterns
                  typical of incentivized or generated text.
                </p>
                <div className="mt-4 rounded-xl bg-muted p-4">
                  <p className="font-display text-3xl font-semibold">
                    {Math.round(100 - report.authenticity_rate)}%
                  </p>
                  <p className="text-sm text-muted-foreground">flagged as likely fake</p>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {flagged.length} of {reviews.length} reviews scored so far show suspicious patterns.
              </p>
            )}
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>· Repetitive superlatives with no product detail</li>
              <li>· Clusters of same-day five-star posts</li>
              <li>· Missing verified-purchase confirmation</li>
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}

function fakeVerdict(review: ApiReview) {
  if (!review.score) return { label: "Not yet scored", tone: "outline" as const };
  if (!review.score.is_trusted) return { label: "Likely fake", tone: "destructive" as const };
  return { label: "Looks genuine", tone: "genuine" as const };
}

function ReviewCard({ review }: { review: ApiReview }) {
  const verdict = fakeVerdict(review);

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-deep">
            {review.rating.toFixed(0)}★
          </span>
          <div>
            <p className="text-xs text-muted-foreground">
              {review.posted_at
                ? new Date(review.posted_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Date unknown"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {review.verified_purchase && (
            <Badge variant="secondary" className="gap-1">
              <BadgeCheck className="size-3.5" /> Verified purchase
            </Badge>
          )}
          <Badge
            variant={verdict.tone === "destructive" ? "destructive" : "outline"}
            className={verdict.tone === "genuine" ? "border-primary text-primary-deep" : undefined}
          >
            {verdict.label}
            {review.score ? ` · ${review.score.iso_anomaly_score.toFixed(3)}` : ""}
          </Badge>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <StarRating value={review.rating} />
        {review.review_title && <h3 className="text-sm font-semibold">{review.review_title}</h3>}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.content_clean}</p>
    </article>
  );
}
