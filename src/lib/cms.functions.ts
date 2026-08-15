import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

// Public CMS reads use the publishable key and the public read policies.
// This keeps public content independent of a service-role secret.
function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const getJourneyCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data: cats, error } = await supabase
    .from("journey_categories")
    .select("*")
    .eq("published", true)
    .order("sort_order");
  if (error) throw new Error(error.message);

  const { data: its } = await supabase.from("itineraries").select("*").eq("published", true).order("sort_order");

  return (cats ?? []).map((c) => ({
    ...c,
    itineraries: (its ?? []).filter((i) => i.category_id === c.id),
  }));
});

export const getJourneyBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: cat } = await supabase
      .from("journey_categories")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (!cat) return null;
    const { data: its } = await supabase
      .from("itineraries")
      .select("*")
      .eq("category_id", cat.id)
      .eq("published", true)
      .order("sort_order");
    return { ...cat, itineraries: its ?? [] };
  });

export const getArticles = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("journal_articles")
    .select("*")
    .or(`published.eq.true,scheduled_at.lte.${nowIso}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getArticleBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const nowIso = new Date().toISOString();
    const { data: article } = await supabase
      .from("journal_articles")
      .select("*")
      .eq("slug", data.slug)
      .or(`published.eq.true,scheduled_at.lte.${nowIso}`)
      .maybeSingle();
    return article;
  });

export const getLodges = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.from("lodges").select("*").eq("published", true).order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getLodgeBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: lodge } = await supabase
      .from("lodges")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    return lodge;
  });

export const getDestinations = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.from("destinations").select("*").eq("published", true).order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getTestimonials = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.from("testimonials").select("*").eq("published", true).order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getFaqs = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("published", true)
    .order("category")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getItineraryBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: it } = await supabase
      .from("itineraries")
      .select("*, category:journey_categories(*)")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    return it;
  });

export const getDestinationBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: dest } = await supabase
      .from("destinations")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    return dest;
  });
