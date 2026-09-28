import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";
const MODEL = "openai/gpt-6-astra";

export type CatalogItem = { slug: string; name: string; summary: string };

export type RecommendInput = {
  interests: string[];
  experiences: string;
  budget: string;
  travelMonth: string;
  partyType: string;
};

export type RawRecommendation = {
  summary: string;
  destinations: { slug: string; reason: string }[];
  adventures: { slug: string; reason: string }[];
};

export class GatewayError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID_HEADER)) headers.set(RUN_ID_HEADER, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_ID_HEADER)?.trim() || undefined;
    return res;
  };
}

export async function generateRecommendations(
  input: RecommendInput,
  destinations: CatalogItem[],
  adventures: CatalogItem[],
): Promise<RawRecommendation> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new GatewayError("The trip recommender is not configured yet.", 500);

  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });

  const system = `You are a senior Kenya safari journey designer at The Baobab Collective.
Recommend ONLY from the catalog provided, using the exact slugs.
Return strictly JSON (no markdown) of shape:
{"summary": string, "destinations": [{"slug": string, "reason": string}], "adventures": [{"slug": string, "reason": string}]}
Pick 2-3 destinations and 1-3 adventures (fewer if the catalog is small). Each reason is 1-2 warm, specific sentences addressed to the traveller ("you"), referencing their interests, budget and timing. The summary is 2 sentences.`;

  const user = `Traveller profile:
- Priorities: ${input.interests.join(", ") || "not specified"}
- Preferred experiences: ${input.experiences || "not specified"}
- Budget per person: ${input.budget || "not specified"}
- When: ${input.travelMonth || "flexible"}
- Travelling as: ${input.partyType || "not specified"}

DESTINATIONS:
${destinations.map((d) => `- ${d.slug} | ${d.name} | ${d.summary}`).join("\n")}

ADVENTURES:
${adventures.map((a) => `- ${a.slug} | ${a.name} | ${a.summary}`).join("\n") || "(none)"}`;

  let text: string;
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system,
      prompt: user,
      maxRetries: 0,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    text = await result.text;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode ?? 500;
    if (status === 429) throw new GatewayError("We're getting a lot of requests right now — please try again in a minute.", 429);
    if (status === 402) throw new GatewayError("The trip recommender is temporarily unavailable. Please enquire directly.", 402);
    throw new GatewayError("We couldn't generate recommendations right now. Please try again.", status);
  }

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new GatewayError("We couldn't read the recommendations. Please try again.", 500);
  try {
    return JSON.parse(match[0]) as RawRecommendation;
  } catch {
    throw new GatewayError("We couldn't read the recommendations. Please try again.", 500);
  }
}
