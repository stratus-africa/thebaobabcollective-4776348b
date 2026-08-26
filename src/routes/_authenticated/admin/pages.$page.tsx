import { useEffect, useMemo, useState, type CSSProperties, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPageDraft, savePageContent, discardPageDraft } from "@/lib/page-content.functions";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { PageLivePreview } from "@/components/admin/PageLivePreview";
import {
  PAGE_DEFAULTS,
  mergePageContent,
  ADVENTURES_SECTIONS,
  adventuresSectionOrder,
  SEO_EDITABLE_PAGES,
  type PageKey,
} from "@/lib/page-content.defaults";

import { getDestinations } from "@/lib/cms.functions";
import { mergeDestinationsWithDefaults } from "@/lib/destinations.data";
import { KenyaDestinationsMap } from "@/components/site/KenyaDestinationsMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { MediaLibraryPicker } from "@/components/admin/MediaLibraryPicker";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  ExternalLink,
  Save,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Images,
  Globe,
  Rocket,
  Trash2,
  FileEdit,
  ChevronDown,
} from "lucide-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

// Pages whose fields group by index (image_1_*, image_2_* ...) and support reordering.
const REORDER_GROUPS: Partial<Record<PageKey, { count: number; suffixes: string[]; label: (i: number) => string }>> = {
  about_team: {
    count: 4,
    suffixes: ["url", "name", "role", "bio"],
    label: (i) => `Member ${i}`,
  },
  home_instagram: {
    count: 7,
    suffixes: ["url", "caption"],
    label: (i) => `Photo ${i}`,
  },
};

// Reorder all group values by applying an old->new index permutation.
// order[newPos-1] = oldPos (1-indexed).
function reorderGroup(draft: Record<string, any>, suffixes: string[], order: number[]): Record<string, any> {
  const next = { ...draft };
  for (const s of suffixes) {
    const snapshot: Record<number, any> = {};
    for (let i = 1; i <= order.length; i++) {
      snapshot[i] = draft[`image_${i}_${s}`];
    }
    for (let newPos = 1; newPos <= order.length; newPos++) {
      const oldPos = order[newPos - 1];
      next[`image_${newPos}_${s}`] = snapshot[oldPos];
    }
  }
  return next;
}

/* Two-column editor layouts. Left = copy/settings, right = image selectors. */
const SPLIT_CLASS: Record<string, string> = {
  "85/15": "xl:grid-cols-[minmax(0,85fr)_minmax(0,15fr)]",
  "60/40": "xl:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]",
  "40/60": "xl:grid-cols-[minmax(0,40fr)_minmax(0,60fr)]",
};

type PageLayout = {
  split?: keyof typeof SPLIT_CLASS;
  /** Repeating item group turned into collapsible tabs (e.g. card_1_*, pillar_2_*). */
  group?: { prefix: (i: number) => string; count: number };
  /** Render the collapsible group in the right-hand column. */
  groupsInSide?: boolean;
  /** Arrow-shaped step markers on the collapsible headers. */
  arrows?: boolean;
};

const PAGE_LAYOUTS: Partial<Record<PageKey, PageLayout>> = {
  home_find_journey: {
    split: "60/40",
    group: { prefix: (i) => `card_${i}_`, count: 6 },
    groupsInSide: true,
  },
  home_why_baobab: { group: { prefix: (i) => `pillar_${i}_`, count: 4 } },
  home_founders: { group: { prefix: (i) => `founder_${i}_`, count: 2 } },
  home_impact: { group: { prefix: (i) => `pillar_${i}_`, count: 3 } },
  home_how_it_works: { group: { prefix: (i) => `step_${i}_`, count: 4 }, arrows: true },
  home_instagram: { split: "40/60" },
  about: { split: "60/40" },
  about_team: { split: "60/40" },
  adventures_index: { split: "60/40", group: { prefix: (i) => `explore_${i}_`, count: 8 } },
};

type FieldGroup = { key: string; label: string; index: number; fields: FieldDef[] };

/** Build collapsible groups from the visible fields of a page. */
function buildGroups(layout: PageLayout | undefined, fields: FieldDef[]): FieldGroup[] {
  if (!layout?.group) return [];
  const out: FieldGroup[] = [];
  for (let i = 1; i <= layout.group.count; i++) {
    const prefix = layout.group.prefix(i);
    const groupFields = fields.filter((f) => f.name.startsWith(prefix));
    if (!groupFields.length) continue;
    const raw = groupFields[0].label;
    const label = raw.split("—")[0].trim() || `Item ${i}`;
    out.push({ key: prefix, label, index: i, fields: groupFields });
  }
  return out;
}

type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "image" | "boolean" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
};

export const SCHEMAS: Record<PageKey, { title: string; description: string; preview: string; fields: FieldDef[] }> = {
  home: {
    title: "Home — Hero",
    description: "Hero copy, CTAs and background image on the homepage.",
    preview: "/",
    fields: [
      { name: "hero_image_url", label: "Hero Background Image", type: "image" },
      {
        name: "hero_title_line1",
        label: "Hero Title — Line 1",
        type: "text",
        placeholder: "JOURNEYS",
      },
      {
        name: "hero_title_line2",
        label: "Hero Title — Line 2",
        type: "text",
        placeholder: "THAT CONNECT",
      },
      { name: "hero_subtitle", label: "Hero Subtitle", type: "textarea" },
      { name: "hero_cta_primary", label: "Primary CTA Label", type: "text" },
      { name: "hero_cta_secondary", label: "Secondary CTA Label", type: "text" },
      { name: "hero_proof_text", label: "Social Proof Text", type: "text" },
      {
        name: "hero_image_as_background",
        label: "Use Hero Image as Full Background",
        type: "boolean",
      },
      { name: "hero_hide_search", label: "Hide Search Filter", type: "boolean" },
      {
        name: "hero_bg_size",
        label: "Background size ('cover' or 'contain')",
        type: "text",
        placeholder: "cover",
      },
    ],
  },
  about: {
    title: "About Block",
    description: "The About block shown on the homepage and About page.",
    preview: "/about",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title_line1", label: "Title — Line 1", type: "text" },
      { name: "title_line2", label: "Title — Line 2", type: "text" },
      { name: "title_line3", label: "Title — Line 3", type: "text" },
      { name: "body", label: "Body Paragraph", type: "textarea" },
      { name: "image_left_url", label: "Image — Left", type: "image" },
      { name: "image_right_url", label: "Image — Right", type: "image" },
    ],
  },
  about_mission: {
    title: "About — Mission",
    description: "Mission section on the About page.",
    preview: "/about",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
    ],
  },
  about_values: {
    title: "About — Values",
    description: "The four values shown on the About page.",
    preview: "/about",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "value_1_title", label: "Value 1 — Title", type: "text" },
      { name: "value_1_body", label: "Value 1 — Body", type: "textarea" },
      { name: "value_2_title", label: "Value 2 — Title", type: "text" },
      { name: "value_2_body", label: "Value 2 — Body", type: "textarea" },
      { name: "value_3_title", label: "Value 3 — Title", type: "text" },
      { name: "value_3_body", label: "Value 3 — Body", type: "textarea" },
      { name: "value_4_title", label: "Value 4 — Title", type: "text" },
      { name: "value_4_body", label: "Value 4 — Body", type: "textarea" },
    ],
  },
  about_team: {
    title: "About — Team",
    description: "Team intro and photos shown on the About page. Use the arrows to reorder members.",
    preview: "/about",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "image_1_url", label: "Member 1 — Photo", type: "image" },
      { name: "image_1_name", label: "Member 1 — Name", type: "text" },
      { name: "image_1_role", label: "Member 1 — Role", type: "text" },
      { name: "image_1_bio", label: "Member 1 — Brief Bio", type: "textarea" },
      { name: "image_2_url", label: "Member 2 — Photo", type: "image" },
      { name: "image_2_name", label: "Member 2 — Name", type: "text" },
      { name: "image_2_role", label: "Member 2 — Role", type: "text" },
      { name: "image_2_bio", label: "Member 2 — Brief Bio", type: "textarea" },
      { name: "image_3_url", label: "Member 3 — Photo", type: "image" },
      { name: "image_3_name", label: "Member 3 — Name", type: "text" },
      { name: "image_3_role", label: "Member 3 — Role", type: "text" },
      { name: "image_3_bio", label: "Member 3 — Brief Bio", type: "textarea" },
      { name: "image_4_url", label: "Member 4 — Photo", type: "image" },
      { name: "image_4_name", label: "Member 4 — Name", type: "text" },
      { name: "image_4_role", label: "Member 4 — Role", type: "text" },
      { name: "image_4_bio", label: "Member 4 — Brief Bio", type: "textarea" },
    ],
  },

  private_travel: {
    title: "Private Travel Page",
    description: "Headline, subtitle and confirmation copy for the bespoke travel form.",
    preview: "/private-travel",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Page Title", type: "text" },
      { name: "subtitle", label: "Page Subtitle", type: "textarea" },
      { name: "submit_label", label: "Submit Button Label", type: "text" },
      { name: "success_title", label: "Success Title", type: "text" },
      { name: "success_body", label: "Success Body", type: "textarea" },
    ],
  },
  home_trust: {
    title: "Home — Trust Strip",
    description: "The four trust/expertise items shown below the hero.",
    preview: "/",
    fields: [
      { name: "item_1_title", label: "Item 1 — Title", type: "text" },
      { name: "item_1_subtitle", label: "Item 1 — Subtitle", type: "text" },
      { name: "item_2_title", label: "Item 2 — Title", type: "text" },
      { name: "item_2_subtitle", label: "Item 2 — Subtitle", type: "text" },
      { name: "item_3_title", label: "Item 3 — Title", type: "text" },
      { name: "item_3_subtitle", label: "Item 3 — Subtitle", type: "text" },
      { name: "item_4_title", label: "Item 4 — Title", type: "text" },
      { name: "item_4_subtitle", label: "Item 4 — Subtitle", type: "text" },
    ],
  },
  home_find_journey: {
    title: "Home — Find Your Journey",
    description: "The journey-type card grid section on the homepage. Upload custom images for each card below.",
    preview: "/",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "card_1_image", label: "Safari & Wildlife — Image", type: "image" },
      { name: "card_2_image", label: "The Great Migration — Image", type: "image" },
      { name: "card_3_image", label: "Honeymoon & Romance — Image", type: "image" },
      { name: "card_4_image", label: "Family Adventure — Image", type: "image" },
      { name: "card_5_image", label: "Beach & Safari — Image", type: "image" },
      { name: "card_6_image", label: "Culture & Connection — Image", type: "image" },
    ],
  },
  home_adventures: {
    title: "Home — Adventures Strip",
    description: "The Adventures strip on the homepage.",
    preview: "/",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "cta_label", label: "CTA Label", type: "text" },
    ],
  },
  home_why_baobab: {
    title: "Home — Why Baobab Section",
    description: "The 'Why The Baobab Collective?' numbered-pillars section.",
    preview: "/",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Intro Body", type: "textarea" },
      { name: "pillar_1_num", label: "Pillar 1 — Number", type: "text" },
      { name: "pillar_1_title", label: "Pillar 1 — Title", type: "text" },
      { name: "pillar_1_body", label: "Pillar 1 — Body", type: "textarea" },
      { name: "pillar_2_num", label: "Pillar 2 — Number", type: "text" },
      { name: "pillar_2_title", label: "Pillar 2 — Title", type: "text" },
      { name: "pillar_2_body", label: "Pillar 2 — Body", type: "textarea" },
      { name: "pillar_3_num", label: "Pillar 3 — Number", type: "text" },
      { name: "pillar_3_title", label: "Pillar 3 — Title", type: "text" },
      { name: "pillar_3_body", label: "Pillar 3 — Body", type: "textarea" },
      { name: "pillar_4_num", label: "Pillar 4 — Number", type: "text" },
      { name: "pillar_4_title", label: "Pillar 4 — Title", type: "text" },
      { name: "pillar_4_body", label: "Pillar 4 — Body", type: "textarea" },
    ],
  },
  home_founders: {
    title: "Home — Founders Strip",
    description: "The 'Meet Your Journey Designers' section with founder cards.",
    preview: "/",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "cta_label", label: "CTA Label", type: "text" },
      { name: "founder_1_image", label: "Founder 1 — Photo", type: "image" },
      { name: "founder_1_name", label: "Founder 1 — Name", type: "text" },
      { name: "founder_1_role", label: "Founder 1 — Role", type: "text" },
      { name: "founder_1_tag", label: "Founder 1 — Tag Label", type: "text" },
      { name: "founder_1_quote", label: "Founder 1 — Quote", type: "textarea" },
      { name: "founder_2_image", label: "Founder 2 — Photo", type: "image" },
      { name: "founder_2_name", label: "Founder 2 — Name", type: "text" },
      { name: "founder_2_role", label: "Founder 2 — Role", type: "text" },
      { name: "founder_2_tag", label: "Founder 2 — Tag Label", type: "text" },
      { name: "founder_2_quote", label: "Founder 2 — Quote", type: "textarea" },
    ],
  },
  home_impact: {
    title: "Home — Journey Impact",
    description: "The 'Your Journey's Impact' responsible tourism section.",
    preview: "/",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Intro Body", type: "textarea" },
      { name: "pillar_1_subtitle", label: "Pillar 1 — Subtitle", type: "text" },
      { name: "pillar_1_title", label: "Pillar 1 — Title", type: "text" },
      { name: "pillar_1_body", label: "Pillar 1 — Body", type: "textarea" },
      { name: "pillar_2_subtitle", label: "Pillar 2 — Subtitle", type: "text" },
      { name: "pillar_2_title", label: "Pillar 2 — Title", type: "text" },
      { name: "pillar_2_body", label: "Pillar 2 — Body", type: "textarea" },
      { name: "pillar_3_subtitle", label: "Pillar 3 — Subtitle", type: "text" },
      { name: "pillar_3_title", label: "Pillar 3 — Title", type: "text" },
      { name: "pillar_3_body", label: "Pillar 3 — Body", type: "textarea" },
    ],
  },
  home_how_it_works: {
    title: "Home — How It Works",
    description: "The four-step 'Your Journey Starts Here' planning section.",
    preview: "/",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Intro Body", type: "textarea" },
      { name: "cta_label", label: "CTA Button Label", type: "text" },
      { name: "step_1_num", label: "Step 1 — Number", type: "text" },
      { name: "step_1_title", label: "Step 1 — Title", type: "text" },
      { name: "step_1_body", label: "Step 1 — Body", type: "textarea" },
      { name: "step_2_num", label: "Step 2 — Number", type: "text" },
      { name: "step_2_title", label: "Step 2 — Title", type: "text" },
      { name: "step_2_body", label: "Step 2 — Body", type: "textarea" },
      { name: "step_3_num", label: "Step 3 — Number", type: "text" },
      { name: "step_3_title", label: "Step 3 — Title", type: "text" },
      { name: "step_3_body", label: "Step 3 — Body", type: "textarea" },
      { name: "step_4_num", label: "Step 4 — Number", type: "text" },
      { name: "step_4_title", label: "Step 4 — Title", type: "text" },
      { name: "step_4_body", label: "Step 4 — Body", type: "textarea" },
    ],
  },
  home_final_cta: {
    title: "Home — Final CTA",
    description: "The closing 'Your Kenya is waiting' conversion section.",
    preview: "/",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title_line1", label: "Title — Line 1", type: "text" },
      { name: "title_line2", label: "Title — Line 2 (italic gold)", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "cta_label", label: "CTA Button Label", type: "text" },
    ],
  },
  home_destinations: {
    title: "Home — Destinations Strip",
    description: "The Destinations strip on the homepage. Toggle Hide to remove it from the homepage entirely.",
    preview: "/",
    fields: [
      { name: "hidden", label: "Hide this section on the homepage", type: "boolean" },
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "cta_label", label: "CTA Label", type: "text" },
    ],
  },
  home_lodges: {
    title: "Home — Lodges Strip",
    description: "The Lodges strip on the homepage.",
    preview: "/",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "cta_label", label: "CTA Label", type: "text" },
    ],
  },
  home_journal: {
    title: "Home — Journal Strip",
    description: "The 'Stories. Guidance. Inspiration.' block on the homepage.",
    preview: "/",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title_line1", label: "Title — Line 1", type: "text" },
      { name: "title_line2", label: "Title — Line 2", type: "text" },
      { name: "title_line3", label: "Title — Line 3", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "cta_label", label: "CTA Label", type: "text" },
    ],
  },
  home_instagram: {
    title: "Home — Instagram Strip",
    description: "Handle, heading, and a gallery of up to 7 photos chosen from the media library.",
    preview: "/",
    fields: [
      { name: "heading", label: "Heading", type: "text" },
      { name: "handle", label: "Instagram Handle", type: "text" },
      { name: "url", label: "Instagram URL", type: "text" },
      { name: "image_1_url", label: "Photo 1", type: "image" },
      { name: "image_1_caption", label: "Photo 1 — Caption", type: "text" },
      { name: "image_2_url", label: "Photo 2", type: "image" },
      { name: "image_2_caption", label: "Photo 2 — Caption", type: "text" },
      { name: "image_3_url", label: "Photo 3", type: "image" },
      { name: "image_3_caption", label: "Photo 3 — Caption", type: "text" },
      { name: "image_4_url", label: "Photo 4", type: "image" },
      { name: "image_4_caption", label: "Photo 4 — Caption", type: "text" },
      { name: "image_5_url", label: "Photo 5", type: "image" },
      { name: "image_5_caption", label: "Photo 5 — Caption", type: "text" },
      { name: "image_6_url", label: "Photo 6", type: "image" },
      { name: "image_6_caption", label: "Photo 6 — Caption", type: "text" },
      { name: "image_7_url", label: "Photo 7", type: "image" },
      { name: "image_7_caption", label: "Photo 7 — Caption", type: "text" },
    ],
  },

  top_bar: {
    title: "Top Announcement Bar",
    description: "The dark bar at the very top of every page.",
    preview: "/",
    fields: [
      { name: "enabled", label: "Show top bar", type: "boolean" },
      { name: "text", label: "Announcement Text", type: "text" },
    ],
  },
  contact: {
    title: "Contact Page",
    description: "All copy on the /contact page.",
    preview: "/contact",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title_line1", label: "Title — Line 1", type: "text" },
      { name: "title_line2", label: "Title — Line 2", type: "text" },
      { name: "body", label: "Intro Paragraph", type: "textarea" },
      { name: "form_title", label: "Form Card Title", type: "text" },
      { name: "form_intro", label: "Form Card Intro", type: "textarea" },
      { name: "form_cta", label: "Form CTA Button", type: "text" },
      { name: "instagram_url", label: "Instagram URL", type: "text" },
      { name: "instagram_handle", label: "Instagram Handle", type: "text" },
      { name: "facebook_url", label: "Facebook URL", type: "text" },
      { name: "facebook_handle", label: "Facebook Handle", type: "text" },
    ],
  },
  lodges_index: {
    title: "Partner Lodges — Landing",
    description: "Hero copy and section toggles on the /lodges listing page.",
    preview: "/lodges",
    fields: [
      { name: "show_hero", label: "Show hero band", type: "boolean" },
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "hero_image", label: "Hero Background Image (optional)", type: "image" },
      { name: "show_grid", label: "Show lodges grid", type: "boolean" },
      {
        name: "grid_size",
        label: "Lodges Grid Columns",
        type: "select",
        options: [
          { value: "3", label: "3 Columns Grid" },
          { value: "4", label: "4 Columns Grid" },
        ],
      },
    ],
  },
  destinations_index: {
    title: "Destinations — Landing",
    description: "All editable sections on the /destinations page. Toggle sections on/off and edit their copy.",
    preview: "/destinations",
    fields: [
      // ── 1. Hero ─────────────────────────────────────────────────────────
      { name: "show_hero", label: "Show hero section", type: "boolean" },
      { name: "eyebrow", label: "Hero — Eyebrow", type: "text" },
      { name: "title", label: "Hero — Title", type: "text" },
      { name: "subtitle", label: "Hero — Quote / Subhead", type: "textarea" },
      { name: "body", label: "Hero — Supporting Copy", type: "textarea" },
      { name: "hero_image", label: "Hero Background Image", type: "image" },
      { name: "cta_label", label: "Hero — Primary Button Label", type: "text" },

      // ── 2. Destination Finder ───────────────────────────────────────────
      {
        name: "show_finder",
        label: "Show Destination Finder (filter bar) section",
        type: "boolean",
      },
      { name: "finder_eyebrow", label: "Destination Finder — Eyebrow", type: "text" },
      { name: "finder_title", label: "Destination Finder — Title", type: "text" },
      { name: "finder_body", label: "Destination Finder — Body", type: "textarea" },

      // ── 3. Kenya Destinations Map ───────────────────────────────────────
      { name: "show_map", label: "Show Kenya Destinations Map section", type: "boolean" },

      // ── 4. Destinations Grid (Editorial Groupings) ──────────────────────
      { name: "show_grid", label: "Show destinations grid section", type: "boolean" },
      {
        name: "grid_size",
        label: "Destinations Grid Columns (The Icons, Beyond Classics, Indian Ocean)",
        type: "select",
        options: [
          { value: "3", label: "3 Columns Grid" },
          { value: "4", label: "4 Columns Grid" },
        ],
      },
      { name: "icons_eyebrow", label: "The Icons Group — Eyebrow", type: "text" },
      { name: "icons_title", label: "The Icons Group — Title", type: "text" },
      { name: "icons_body", label: "The Icons Group — Description", type: "textarea" },
      { name: "beyond_eyebrow", label: "Beyond the Classics — Eyebrow", type: "text" },
      { name: "beyond_title", label: "Beyond the Classics — Title", type: "text" },
      { name: "beyond_body", label: "Beyond the Classics — Description", type: "textarea" },
      { name: "ocean_eyebrow", label: "The Indian Ocean — Eyebrow", type: "text" },
      { name: "ocean_title", label: "The Indian Ocean — Title", type: "text" },
      { name: "ocean_body", label: "The Indian Ocean — Description", type: "textarea" },

      // ── 5. Featured Adventures ──────────────────────────────────────────
      { name: "show_journeys", label: "Show Featured Adventures section", type: "boolean" },
      { name: "journeys_eyebrow", label: "Featured Adventures — Eyebrow", type: "text" },
      { name: "journeys_title", label: "Featured Adventures — Title", type: "text" },
      { name: "journeys_body", label: "Featured Adventures — Description", type: "textarea" },

      // ── 6. Where You'll Stay ────────────────────────────────────────────
      { name: "show_stay", label: "Show 'Where You'll Stay' lodges section", type: "boolean" },
      { name: "stay_eyebrow", label: "Where You'll Stay — Eyebrow", type: "text" },
      { name: "stay_title", label: "Where You'll Stay — Title", type: "text" },
      { name: "stay_body", label: "Where You'll Stay — Description", type: "textarea" },

      // ── 7. Destination Combinations ─────────────────────────────────────
      {
        name: "show_combinations",
        label: "Show Destination Combinations section",
        type: "boolean",
      },
      { name: "combinations_eyebrow", label: "Combinations — Eyebrow", type: "text" },
      { name: "combinations_title", label: "Combinations — Title", type: "text" },
      { name: "combinations_body", label: "Combinations — Description", type: "textarea" },

      // ── 8. Matcher ──────────────────────────────────────────────────────
      {
        name: "show_matcher",
        label: "Show 'Where Should Kenya Take You?' matcher",
        type: "boolean",
      },
      { name: "matcher_eyebrow", label: "Destination Matcher — Eyebrow", type: "text" },
      { name: "matcher_title", label: "Destination Matcher — Title", type: "text" },
      { name: "matcher_body", label: "Destination Matcher — Description", type: "textarea" },

      // ── 9. Final CTA ────────────────────────────────────────────────────
      { name: "show_final_cta", label: "Show final CTA section", type: "boolean" },
      { name: "final_cta_eyebrow", label: "Final CTA — Eyebrow", type: "text" },
      { name: "final_cta_title", label: "Final CTA — Title", type: "text" },
      { name: "final_cta_body", label: "Final CTA — Body", type: "textarea" },
    ],
  },

  adventures_index: {
    title: "Adventures — Landing",
    description: "All editable sections on the /adventures listing page. Toggle sections on/off and edit their copy.",
    preview: "/adventures",
    fields: [
      { name: "show_hero", label: "Show hero section", type: "boolean" },
      { name: "eyebrow", label: "Hero — Eyebrow (fallback)", type: "text" },
      { name: "title", label: "Hero — Title (fallback)", type: "text" },
      { name: "subtitle", label: "Hero — Subhead (fallback)", type: "textarea" },
      { name: "hero_image", label: "Hero Background Image (optional override)", type: "image" },

      { name: "show_rhythm", label: "Show 'A Day in the Field' section", type: "boolean" },
      { name: "rhythm_eyebrow", label: "Day in the Field — Eyebrow", type: "text" },
      { name: "rhythm_title", label: "Day in the Field — Title", type: "text" },
      { name: "rhythm_body", label: "Day in the Field — Body", type: "textarea" },
      { name: "rhythm_1_time", label: "Day step 1 — Time", type: "text" },
      { name: "rhythm_1_phase", label: "Day step 1 — Phase label", type: "text" },
      { name: "rhythm_1_title", label: "Day step 1 — Title", type: "text" },
      { name: "rhythm_1_body", label: "Day step 1 — Body", type: "textarea" },
      { name: "rhythm_1_image", label: "Day step 1 — Image", type: "image" },
      { name: "rhythm_2_time", label: "Day step 2 — Time", type: "text" },
      { name: "rhythm_2_phase", label: "Day step 2 — Phase label", type: "text" },
      { name: "rhythm_2_title", label: "Day step 2 — Title", type: "text" },
      { name: "rhythm_2_body", label: "Day step 2 — Body", type: "textarea" },
      { name: "rhythm_2_image", label: "Day step 2 — Image", type: "image" },
      { name: "rhythm_3_time", label: "Day step 3 — Time", type: "text" },
      { name: "rhythm_3_phase", label: "Day step 3 — Phase label", type: "text" },
      { name: "rhythm_3_title", label: "Day step 3 — Title", type: "text" },
      { name: "rhythm_3_body", label: "Day step 3 — Body", type: "textarea" },
      { name: "rhythm_3_image", label: "Day step 3 — Image", type: "image" },
      { name: "rhythm_4_time", label: "Day step 4 — Time", type: "text" },
      { name: "rhythm_4_phase", label: "Day step 4 — Phase label", type: "text" },
      { name: "rhythm_4_title", label: "Day step 4 — Title", type: "text" },
      { name: "rhythm_4_body", label: "Day step 4 — Body", type: "textarea" },
      { name: "rhythm_4_image", label: "Day step 4 — Image", type: "image" },

      { name: "show_finder", label: "Show Adventure Finder (filter bar) section", type: "boolean" },
      { name: "finder_eyebrow", label: "Adventure Finder — Eyebrow", type: "text" },
      { name: "finder_title", label: "Adventure Finder — Title", type: "text" },
      { name: "finder_body", label: "Adventure Finder — Body", type: "textarea" },
      {
        name: "finder_experience_options",
        label: "Adventure Finder — Experience filter options (comma-separated)",
        type: "text",
      },
      {
        name: "finder_travel_style_options",
        label: "Adventure Finder — Travel style filter options (comma-separated)",
        type: "text",
      },

      { name: "show_signature", label: "Show Signature Selection section", type: "boolean" },
      { name: "signature_eyebrow", label: "Signature Section — Eyebrow", type: "text" },
      { name: "signature_title", label: "Signature Section — Title", type: "text" },
      { name: "signature_body", label: "Signature Section — Body", type: "textarea" },

      { name: "show_explore", label: "Show 'Explore by Experience' section", type: "boolean" },
      { name: "explore_eyebrow", label: "Explore by Experience — Eyebrow", type: "text" },
      { name: "explore_title", label: "Explore by Experience — Title", type: "text" },
      { name: "explore_body", label: "Explore by Experience — Body", type: "textarea" },
      { name: "explore_1_title", label: "Experience 1 — Title", type: "text" },
      { name: "explore_1_body", label: "Experience 1 — Description", type: "text" },
      { name: "explore_1_image", label: "Experience 1 — Image", type: "image" },
      { name: "explore_2_title", label: "Experience 2 — Title", type: "text" },
      { name: "explore_2_body", label: "Experience 2 — Description", type: "text" },
      { name: "explore_2_image", label: "Experience 2 — Image", type: "image" },
      { name: "explore_3_title", label: "Experience 3 — Title", type: "text" },
      { name: "explore_3_body", label: "Experience 3 — Description", type: "text" },
      { name: "explore_3_image", label: "Experience 3 — Image", type: "image" },
      { name: "explore_4_title", label: "Experience 4 — Title", type: "text" },
      { name: "explore_4_body", label: "Experience 4 — Description", type: "text" },
      { name: "explore_4_image", label: "Experience 4 — Image", type: "image" },
      { name: "explore_5_title", label: "Experience 5 — Title", type: "text" },
      { name: "explore_5_body", label: "Experience 5 — Description", type: "text" },
      { name: "explore_5_image", label: "Experience 5 — Image", type: "image" },
      { name: "explore_6_title", label: "Experience 6 — Title", type: "text" },
      { name: "explore_6_body", label: "Experience 6 — Description", type: "text" },
      { name: "explore_6_image", label: "Experience 6 — Image", type: "image" },
      { name: "explore_7_title", label: "Experience 7 — Title", type: "text" },
      { name: "explore_7_body", label: "Experience 7 — Description", type: "text" },
      { name: "explore_7_image", label: "Experience 7 — Image", type: "image" },
      { name: "explore_8_title", label: "Experience 8 — Title", type: "text" },
      { name: "explore_8_body", label: "Experience 8 — Description", type: "text" },
      { name: "explore_8_image", label: "Experience 8 — Image", type: "image" },

      { name: "show_spotlight", label: "Show Featured Journey spotlight section", type: "boolean" },

      { name: "show_catalogue", label: "Show full catalogue section", type: "boolean" },
      {
        name: "grid_size",
        label: "Adventures Catalogue Grid Columns",
        type: "select",
        options: [
          { value: "3", label: "3 Columns Grid" },
          { value: "4", label: "4 Columns Grid" },
        ],
      },
      { name: "catalogue_eyebrow", label: "Full Catalogue — Eyebrow", type: "text" },
      { name: "catalogue_title", label: "Full Catalogue — Title", type: "text" },

      { name: "show_combinations", label: "Show Journey Combinations section", type: "boolean" },
      { name: "combinations_eyebrow", label: "Journey Combinations — Eyebrow", type: "text" },
      { name: "combinations_title", label: "Journey Combinations — Title", type: "text" },
      { name: "combinations_body", label: "Journey Combinations — Body", type: "textarea" },

      {
        name: "show_enquiry_cta",
        label: "Show 'Not quite right?' bespoke banner",
        type: "boolean",
      },
      { name: "bespoke_eyebrow", label: "Bespoke Banner — Eyebrow", type: "text" },
      { name: "bespoke_title", label: "Bespoke Banner — Title", type: "text" },
      { name: "bespoke_body", label: "Bespoke Banner — Body", type: "textarea" },

      { name: "show_final_cta", label: "Show final CTA section", type: "boolean" },
    ],
  },
  testimonials_page: {
    title: "Testimonials Page",
    description: "Copy and metric cards on the /testimonials page.",
    preview: "/testimonials",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "show_metrics", label: "Show metric cards (12+ / 800+ / 40+)", type: "boolean" },
      { name: "metric_1_value", label: "Metric 1 — Value", type: "text" },
      { name: "metric_1_label", label: "Metric 1 — Label", type: "text" },
      { name: "metric_2_value", label: "Metric 2 — Value", type: "text" },
      { name: "metric_2_label", label: "Metric 2 — Label", type: "text" },
      { name: "metric_3_value", label: "Metric 3 — Value", type: "text" },
      { name: "metric_3_label", label: "Metric 3 — Label", type: "text" },
      { name: "cta_title", label: "CTA — Title", type: "text" },
      { name: "cta_button", label: "CTA — Button Label", type: "text" },
    ],
  },
  detail_journey: {
    title: "Adventure Detail Template",
    description: "Shared copy across all adventure detail (itinerary) pages.",
    preview: "/adventures",
    fields: [
      { name: "intro_eyebrow", label: "Intro Eyebrow", type: "text" },
      { name: "enquire_cta", label: "Enquire CTA Label", type: "text" },
      { name: "related_title", label: "Related Section Title", type: "text" },
    ],
  },

  detail_lodge: {
    title: "Lodge Detail Template",
    description: "Shared copy across all lodge detail pages.",
    preview: "/lodges",
    fields: [
      { name: "intro_eyebrow", label: "Intro Eyebrow", type: "text" },
      { name: "enquire_cta", label: "Enquire CTA Label", type: "text" },
      { name: "related_title", label: "Related Section Title", type: "text" },
    ],
  },
  footer: {
    title: "Footer",
    description:
      "Newsletter copy, contact heading, copyright line, and social media icons. Footer columns are managed under Menu & Navigation.",
    preview: "/",
    fields: [
      { name: "contact_heading", label: "Contact Column Heading", type: "text" },
      { name: "newsletter_title", label: "Newsletter Heading", type: "text" },
      { name: "newsletter_body", label: "Newsletter Body", type: "textarea" },
      { name: "newsletter_placeholder", label: "Email Input Placeholder", type: "text" },
      { name: "copyright", label: "Copyright Line ({year} auto-fills)", type: "text" },
      { name: "instagram_url", label: "Instagram URL (blank to hide icon)", type: "text" },
      { name: "facebook_url", label: "Facebook URL (blank to hide icon)", type: "text" },
      { name: "linkedin_url", label: "LinkedIn URL (blank to hide icon)", type: "text" },
      { name: "twitter_url", label: "X / Twitter URL (blank to hide icon)", type: "text" },
      { name: "youtube_url", label: "YouTube URL (blank to hide icon)", type: "text" },
    ],
  },
  not_found: {
    title: "404 Page",
    description: "The 'page not found' screen.",
    preview: "/__notfound__",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "cta_label", label: "CTA Label", type: "text" },
    ],
  },
  auth_page: {
    title: "Admin Sign-in Page",
    description: "Copy on the admin sign-in form.",
    preview: "/auth",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "email_label", label: "Email Label", type: "text" },
      { name: "password_label", label: "Password Label", type: "text" },
      { name: "submit_label", label: "Submit Button Label", type: "text" },
    ],
  },
  seo: {
    title: "Global SEO Defaults",
    description: "Site-wide title, description, and social share image defaults.",
    preview: "/",
    fields: [
      { name: "site_name", label: "Site Name", type: "text" },
      { name: "default_title", label: "Default Page Title", type: "text" },
      { name: "default_description", label: "Default Meta Description", type: "textarea" },
      { name: "default_og_image", label: "Default Social Share Image", type: "image" },
    ],
  },
};

const VALID_KEYS = Object.keys(SCHEMAS) as PageKey[];

export const Route = createFileRoute("/_authenticated/admin/pages/$page")({
  beforeLoad: ({ params }) => {
    if (!VALID_KEYS.includes(params.page as PageKey)) throw notFound();
  },
  component: PageEditorRoute,
});

function PageEditorRoute() {
  const { page } = Route.useParams() as { page: PageKey };
  return <PageEditor pageKey={page} />;
}

export function PageEditor({ pageKey: page, fieldFilter }: { pageKey: PageKey; fieldFilter?: string[] }) {
  const fetchFn = useServerFn(getPageDraft);
  const saveFn = useServerFn(savePageContent);
  const discardFn = useServerFn(discardPageDraft);
  const qc = useQueryClient();
  const schema = SCHEMAS[page];
  // When a fieldFilter is provided, only render those fields.
  const visibleFields = fieldFilter ? schema.fields.filter((f) => fieldFilter.includes(f.name)) : schema.fields;
  const [showPreview, setShowPreview] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["page-draft", page],
    queryFn: () => fetchFn({ data: { key: page } }),
  });

  const hasDraft = !!data?.hasDraft;

  const [draft, setDraft] = useState<Record<string, any>>(() => mergePageContent(page, null));

  useEffect(() => {
    setDraft(mergePageContent(page, (data?.draft ?? data?.published ?? null) as Record<string, any> | null));
  }, [page, data]);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["page-draft", page] });
    qc.invalidateQueries({ queryKey: ["page-content", page] });
    qc.invalidateQueries({ queryKey: ["page-content-batch"] });
  }

  const mSaveDraft = useMutation({
    mutationFn: () => saveFn({ data: { key: page, value: draft, mode: "draft" } }),
    onSuccess: () => {
      invalidate();
      toast.success("Draft saved — not yet visible on the public site");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save draft"),
  });

  const mPublish = useMutation({
    mutationFn: () => saveFn({ data: { key: page, value: draft, mode: "publish" } }),
    onSuccess: () => {
      invalidate();
      toast.success("Published — changes are live");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not publish"),
  });

  const mDiscard = useMutation({
    mutationFn: () => discardFn({ data: { key: page } }),
    onSuccess: () => {
      invalidate();
      toast.success("Draft discarded");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not discard draft"),
  });

  const busy = mSaveDraft.isPending || mPublish.isPending || mDiscard.isPending;

  function reset() {
    if (
      !confirm(
        "Reset all fields on this page to defaults? This will overwrite the current saved version when you publish.",
      )
    )
      return;
    setDraft({ ...PAGE_DEFAULTS[page] });
  }

  const previewablePath = schema.preview.startsWith("/__") ? "/does-not-exist-preview" : schema.preview;
  const drafts = { [page]: draft };

  const layout = PAGE_LAYOUTS[page] ?? {};
  const groups = buildGroups(layout, visibleFields);
  const groupedNames = new Set(groups.flatMap((g) => g.fields.map((f) => f.name)));
  const ungrouped = visibleFields.filter((f) => !groupedNames.has(f.name));
  const mainFields = ungrouped.filter((f) => f.type !== "image");
  const sideFields = ungrouped.filter((f) => f.type === "image");
  const sideContent = sideFields.length > 0 || (layout.groupsInSide && groups.length > 0);


  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl">{schema.title}</h1>
          <p className="text-sm text-foreground/60 mt-1">{schema.description}</p>
          {hasDraft && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-sm bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-900">
              <FileEdit className="w-3 h-3" /> Unpublished draft
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showPreview ? "Hide preview" : "Show preview"}
          </Button>
          <Button asChild variant="outline">
            <Link to={schema.preview} target="_blank">
              <ExternalLink className="w-4 h-4 mr-1" /> Open
            </Link>
          </Button>
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-1" /> Reset
          </Button>
          {hasDraft && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("Discard the unpublished draft and go back to the live version?")) mDiscard.mutate();
              }}
              disabled={busy || isLoading}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Discard draft
            </Button>
          )}
          <Button variant="outline" onClick={() => mSaveDraft.mutate()} disabled={busy || isLoading}>
            {mSaveDraft.isPending ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Save draft
          </Button>
          <Button
            onClick={() => mPublish.mutate()}
            disabled={busy || isLoading}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {mPublish.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Rocket className="w-4 h-4 mr-1" />}
            Publish
          </Button>
        </div>
      </div>


      <div className={showPreview ? "grid grid-cols-1 xl:grid-cols-[minmax(0,480px)_1fr] gap-6" : ""}>
        <div>
          {isLoading ? (
            <div className="bg-background border border-border rounded-lg p-10 text-center text-foreground/60">
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…
            </div>
          ) : REORDER_GROUPS[page] ? (
            <div className={`grid grid-cols-1 gap-6 ${SPLIT_CLASS[layout.split ?? "85/15"]}`}>
              <div className="bg-background border border-border rounded-lg p-6 space-y-5">
                {visibleFields
                  .filter((f) => !/^image_\d+_/.test(f.name))
                  .map((f) => (
                    <FieldRow
                      key={f.name}
                      field={f}
                      value={draft[f.name] ?? (f.type === "boolean" ? false : "")}
                      onChange={(v) => setDraft((d) => ({ ...d, [f.name]: v }))}
                    />
                  ))}
                {page !== "home_instagram" && (
                  <ReorderableGroups
                    page={page}
                    group={REORDER_GROUPS[page]!}
                    schema={schema}
                    draft={draft}
                    setDraft={setDraft}
                    collapsible
                    innerSplit
                    onReorderCommit={(next) => {
                      // Persist immediately so the public page updates without a manual Save.
                      saveFn({ data: { key: page, value: next } })
                        .then(() => {
                          qc.invalidateQueries({ queryKey: ["page-content", page] });
    qc.invalidateQueries({ queryKey: ["page-content-batch"] });
                          toast.success("Order saved");
                        })
                        .catch((e: any) => toast.error(e?.message ?? "Could not save order"));
                    }}
                  />
                )}
              </div>
              {page === "home_instagram" && (
                <div className="bg-background border border-border rounded-lg p-6 space-y-5">
                  <InstagramGallerySelector
                    count={REORDER_GROUPS[page]!.count}
                    draft={draft}
                    onCommit={(next) => {
                      setDraft(() => next);
                      saveFn({ data: { key: page, value: next } })
                        .then(() => {
                          qc.invalidateQueries({ queryKey: ["page-content", page] });
    qc.invalidateQueries({ queryKey: ["page-content-batch"] });
                          toast.success("Gallery updated");
                        })
                        .catch((e: any) => toast.error(e?.message ?? "Could not save gallery"));
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className={`grid grid-cols-1 gap-6 ${sideContent ? SPLIT_CLASS[layout.split ?? "85/15"] : ""}`}>
              <div className="bg-background border border-border rounded-lg p-6 space-y-5">
                {mainFields.map((f) => (
                  <FieldRow
                    key={f.name}
                    field={f}
                    value={draft[f.name] ?? (f.type === "boolean" ? false : "")}
                    onChange={(v) => setDraft((d) => ({ ...d, [f.name]: v }))}
                  />
                ))}
                {!layout.groupsInSide && groups.length > 0 && (
                  <GroupAccordion groups={groups} draft={draft} setDraft={setDraft} arrows={!!layout.arrows} />
                )}
                {page === "destinations_index" && visibleFields.some((f) => f.name === "show_map") && (
                  <div className="pt-4 border-t border-border">
                    <div className="mb-3">
                      <h3 className="font-serif text-base font-bold text-foreground">Interactive Pin Placement Map</h3>
                      <p className="text-xs text-foreground/60">
                        Drag and drop pins directly on the map below to position each destination visually across Kenya.
                      </p>
                    </div>
                    <AdminDestinationsMapField
                      customPositions={draft.map_positions}
                      onUpdatePositions={(next) => setDraft((d) => ({ ...d, map_positions: next }))}
                    />
                  </div>
                )}
              </div>
              {sideContent && (
                <div className="bg-background border border-border rounded-lg p-6 space-y-5 h-full">
                  {sideFields.map((f) => (
                    <FieldRow
                      key={f.name}
                      field={f}
                      value={draft[f.name] ?? ""}
                      onChange={(v) => setDraft((d) => ({ ...d, [f.name]: v }))}
                    />
                  ))}
                  {layout.groupsInSide && groups.length > 0 && (
                    <GroupAccordion groups={groups} draft={draft} setDraft={setDraft} arrows={!!layout.arrows} />
                  )}
                </div>
              )}
            </div>
          )}


          {!isLoading && page === "adventures_index" && !fieldFilter && (
            <SectionOrderEditor
              order={adventuresSectionOrder(draft.section_order)}
              isEnabled={(toggle) => draft[toggle] !== false}
              onToggle={(toggle, on) => setDraft((d) => ({ ...d, [toggle]: on }))}
              onReorder={(next) => setDraft((d) => ({ ...d, section_order: next }))}
            />
          )}

          {!isLoading && !fieldFilter && SEO_EDITABLE_PAGES.includes(page) && (
            <SeoFieldsCard draft={draft} setDraft={setDraft} />
          )}
        </div>

        {showPreview && (
          <div className="min-h-[600px]">
            <PageLivePreview path={previewablePath} drafts={drafts} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Recommended upload dimensions per image field, so uploads don't break the layout. */
function recommendedFor(name: string): { width: number; height: number; note?: string } {
  if (/hero|background|banner|cover/i.test(name))
    return { width: 2400, height: 1350, note: "wide 16:9 landscape, centred subject" };
  if (/(^|_)(image_\d+_url|avatar|portrait|member)/i.test(name))
    return { width: 1000, height: 1250, note: "portrait 4:5" };
  if (/og_image/i.test(name)) return { width: 1200, height: 630, note: "social share preview" };
  return { width: 1600, height: 1067, note: "landscape 3:2 card image" };
}

function FieldRow({ field, value, onChange }: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  if (field.type === "image") {
    return (
      <ImageUploader
        label={field.label}
        value={value ?? ""}
        onChange={onChange}
        recommended={recommendedFor(field.name)}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between gap-4 py-2">
        <Label>{field.label}</Label>
        <Switch checked={!!value} onCheckedChange={onChange} />
      </div>
    );
  }
  if (field.type === "select" && field.options) {
    return (
      <div>
        <Label className="mb-1.5 block">{field.label}</Label>
        <Select
          value={String(value ?? field.options[0]?.value)}
          onValueChange={(val) => {
            const num = Number(val);
            onChange(!isNaN(num) ? num : val);
          }}
        >
          <SelectTrigger className="w-full bg-background border border-border">
            <SelectValue placeholder={field.placeholder || "Select option…"} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  return (
    <div>
      <Label className="mb-1.5 block">{field.label}</Label>
      {field.type === "textarea" ? (
        <RichTextEditor
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          placeholder={field.placeholder}
        />
      ) : (
        <Input value={value ?? ""} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function ReorderableGroups({
  page,
  group,
  schema,
  draft,
  setDraft,
  onReorderCommit,
  collapsible = false,
  innerSplit = false,
}: {
  page: PageKey;
  group: { count: number; suffixes: string[]; label: (i: number) => string };
  schema: { fields: FieldDef[] };
  draft: Record<string, any>;
  setDraft: (fn: (d: Record<string, any>) => Record<string, any>) => void;
  onReorderCommit: (next: Record<string, any>) => void;
  collapsible?: boolean;
  innerSplit?: boolean;
}) {

  const ids = Array.from({ length: group.count }, (_, k) => `slot-${k + 1}`);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // On touch devices, require a short hold before dragging so vertical page
    // scrolling still works when the user swipes over a slot.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const commit = (nextDraft: Record<string, any>) => {
    setDraft(() => nextDraft);
    onReorderCommit(nextDraft);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 1 || j > group.count) return;
    const order = Array.from({ length: group.count }, (_, k) => k + 1);
    [order[i - 1], order[j - 1]] = [order[j - 1], order[i - 1]];
    commit(reorderGroup(draft, group.suffixes, order));
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx < 0 || newIdx < 0) return;
    const baseOrder = Array.from({ length: group.count }, (_, k) => k + 1);
    const nextOrder = arrayMove(baseOrder, oldIdx, newIdx);
    commit(reorderGroup(draft, group.suffixes, nextOrder));
  };

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {ids.map((id, idx) => {
              const i = idx + 1;
              const fields = group.suffixes
                .map((s) => schema.fields.find((f) => f.name === `image_${i}_${s}`))
                .filter(Boolean) as FieldDef[];
              const textFields = fields.filter((f) => f.type !== "image");
              const imageFields = fields.filter((f) => f.type === "image");
              const heading = String(draft[`image_${i}_name`] || "").trim() || group.label(i);
              const render = (f: FieldDef) => (
                <FieldRow
                  key={f.name}
                  field={f}
                  value={draft[f.name] ?? ""}
                  onChange={(v) => setDraft((d) => ({ ...d, [f.name]: v }))}
                />
              );
              return (
                <SortableItem
                  key={id}
                  id={id}
                  label={heading}
                  canUp={i > 1}
                  canDown={i < group.count}
                  onUp={() => move(i, -1)}
                  onDown={() => move(i, 1)}
                  collapsible={collapsible}
                >
                  {innerSplit ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]">
                      <div className="space-y-4">{textFields.map(render)}</div>
                      <div className="space-y-4">{imageFields.map(render)}</div>
                    </div>
                  ) : (
                    fields.map(render)
                  )}
                </SortableItem>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

    </div>
  );
}

function SortableItem({
  id,
  label,
  canUp,
  canDown,
  onUp,
  onDown,
  children,
  collapsible = false,
}: {
  id: string;
  label: string;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  children: ReactNode;
  collapsible?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const [open, setOpen] = useState(!collapsible);
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };
  const panelId = `${id}-panel`;
  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-lg p-4 bg-cream/30 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing touch-none select-none text-foreground/60 hover:text-foreground bg-background border border-border rounded-lg h-10 w-10 md:h-9 md:w-9 flex items-center justify-center shrink-0"
            aria-label={`Drag ${label} to reorder`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5" />
          </button>
          {collapsible ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={panelId}
              className="flex min-w-0 items-center gap-2 text-left font-medium text-sm hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-md px-1 py-1"
            >
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              <span className="truncate">{label}</span>
            </button>
          ) : (
            <p className="font-medium text-sm truncate">{label}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onUp}
            disabled={!canUp}
            aria-label="Move up"
            className="h-10 w-10 md:h-9 md:w-9 rounded-lg"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={onDown}
            disabled={!canDown}
            aria-label="Move down"
            className="h-10 w-10 md:h-9 md:w-9 rounded-lg"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {(!collapsible || open) && (
        <div id={panelId} className="space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

/** Repeating item fields rendered as collapsible tabs (pillars, steps, cards, founders). */
function GroupAccordion({
  groups,
  draft,
  setDraft,
  arrows,
}: {
  groups: FieldGroup[];
  draft: Record<string, any>;
  setDraft: Dispatch<SetStateAction<Record<string, any>>>;
  arrows?: boolean;
}) {
  const [open, setOpen] = useState<string[]>([]);
  const toggle = (key: string) => setOpen((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key]));

  return (
    <div className="space-y-2 pt-2">
      {groups.map((g) => {
        const heading =
          String(draft[`${g.key}title`] || draft[`${g.key}name`] || "").trim() || g.label;
        const isOpen = open.includes(g.key);
        const textFields = g.fields.filter((f) => f.type !== "image");
        const imageFields = g.fields.filter((f) => f.type === "image");
        const render = (f: FieldDef) => (
          <FieldRow
            key={f.name}
            field={f}
            value={draft[f.name] ?? (f.type === "boolean" ? false : "")}
            onChange={(v) => setDraft((d) => ({ ...d, [f.name]: v }))}
          />
        );
        return (
          <div key={g.key} className="border border-border rounded-lg bg-cream/30 overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(g.key)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-cream/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {arrows ? (
                <span
                  className="shrink-0 grid place-items-center h-7 w-10 bg-gold/15 text-gold text-xs font-semibold"
                  style={{ clipPath: "polygon(0 0, 72% 0, 100% 50%, 72% 100%, 0 100%, 22% 50%)" }}
                >
                  {g.index}
                </span>
              ) : (
                <span className="shrink-0 grid place-items-center h-7 w-7 rounded-lg bg-gold/15 text-gold text-xs font-semibold">
                  {g.index}
                </span>
              )}
              <span className="flex-1 min-w-0 truncate text-sm font-medium">{heading}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="px-3 pb-4 pt-1">
                {imageFields.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]">
                    <div className="space-y-4">{textFields.map(render)}</div>
                    <div className="space-y-4">{imageFields.map(render)}</div>
                  </div>
                ) : (
                  <div className="space-y-4">{textFields.map(render)}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


function InstagramGallerySelector({
  count,
  draft,
  onCommit,
}: {
  count: number;
  draft: Record<string, any>;
  onCommit: (next: Record<string, any>) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentUrls: string[] = Array.from(
    { length: count },
    (_, i) => (draft[`image_${i + 1}_url`] as string) || "",
  ).filter(Boolean);

  function applySelection(urls: string[]) {
    const captionByUrl = new Map<string, string>();
    for (let i = 1; i <= count; i++) {
      const u = (draft[`image_${i}_url`] as string) || "";
      if (u) captionByUrl.set(u, (draft[`image_${i}_caption`] as string) || "");
    }
    const next: Record<string, any> = { ...draft };
    const picked = urls.slice(0, count);
    for (let i = 1; i <= count; i++) {
      const url = picked[i - 1] ?? "";
      next[`image_${i}_url`] = url;
      next[`image_${i}_caption`] = url ? (captionByUrl.get(url) ?? next[`image_${i}_caption`] ?? "") : "";
    }
    onCommit(next);
  }

  function clearAll() {
    if (!confirm("Remove all photos from the Instagram gallery?")) return;
    const next: Record<string, any> = { ...draft };
    for (let i = 1; i <= count; i++) {
      next[`image_${i}_url`] = "";
      next[`image_${i}_caption`] = "";
    }
    onCommit(next);
  }

  return (
    <div className="border border-border rounded-lg bg-cream/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-[11px] tracking-[0.2em] uppercase text-foreground/60">Instagram Gallery</p>
          <p className="text-sm text-foreground/80">
            Pick up to {count} photos from your media library. Selection order becomes gallery order — captions stay
            with each photo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentUrls.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          )}
          <Button type="button" onClick={() => setOpen(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Images className="w-4 h-4 mr-1" />
            {currentUrls.length ? "Change gallery" : "Choose photos"}
          </Button>
        </div>
      </div>

      {currentUrls.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
          {currentUrls.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="relative aspect-square overflow-hidden rounded border border-border bg-background"
            >
              <img src={url} alt={`Gallery photo ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
              <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-foreground/60 italic">No photos selected yet.</p>
      )}

      <MediaLibraryPicker
        open={open}
        onOpenChange={setOpen}
        onSelect={applySelection}
        multi
        title="Instagram gallery"
      />
    </div>
  );
}

function AdminDestinationsMapField({
  customPositions,
  onUpdatePositions,
}: {
  customPositions?: Record<string, { left: number; top: number }>;
  onUpdatePositions: (next: Record<string, { left: number; top: number }>) => void;
}) {
  const { data: rawDestinations } = useQuery({
    queryKey: ["destinations"],
    queryFn: () => getDestinations(),
  });

  const destinations = useMemo(() => {
    return mergeDestinationsWithDefaults(rawDestinations || []);
  }, [rawDestinations]);

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-lg">
      <KenyaDestinationsMap
        destinations={destinations}
        customPositions={customPositions}
        onSavePositions={async (next) => {
          onUpdatePositions(next);
        }}
        isAdmin={true}
        embeddedAdminView={true}
      />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Search & social preview fields (landing pages)
|--------------------------------------------------------------------------
*/

function SeoFieldsCard({
  draft,
  setDraft,
}: {
  draft: Record<string, any>;
  setDraft: Dispatch<SetStateAction<Record<string, any>>>;
}) {
  const title = String(draft.seo_title ?? "");
  const description = String(draft.seo_description ?? "");
  return (
    <div className="bg-background border border-border rounded-lg p-6 space-y-5 mt-6">
      <div className="flex items-start gap-2">
        <Globe className="w-4 h-4 text-gold mt-0.5" />
        <div>
          <h3 className="font-serif text-base font-bold text-foreground">Search &amp; Social Preview</h3>
          <p className="text-xs text-foreground/60">
            Overrides the default title, description and share image for this page. Leave blank to use the sitewide
            defaults.
          </p>
        </div>
      </div>

      <div>
        <Label className="mb-1.5 block">Title tag</Label>
        <Input
          value={title}
          maxLength={70}
          placeholder="Page title shown in Google results"
          onChange={(e) => setDraft((d) => ({ ...d, seo_title: e.target.value }))}
        />
        <p className={`mt-1 text-[11px] ${title.length > 60 ? "text-destructive" : "text-foreground/50"}`}>
          {title.length}/60 characters recommended
        </p>
      </div>

      <div>
        <Label className="mb-1.5 block">Meta description</Label>
        <Textarea
          value={description}
          maxLength={200}
          rows={3}
          placeholder="Short summary shown under the title in search results"
          onChange={(e) => setDraft((d) => ({ ...d, seo_description: e.target.value }))}
        />
        <p className={`mt-1 text-[11px] ${description.length > 160 ? "text-destructive" : "text-foreground/50"}`}>
          {description.length}/160 characters recommended
        </p>
      </div>

      <ImageUploader
        label="Open Graph / social share image"
        value={String(draft.seo_og_image ?? "")}
        onChange={(v) => setDraft((d) => ({ ...d, seo_og_image: v }))}
        recommended={{ width: 1200, height: 630, note: "shown when the page is shared on social apps" }}
      />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Section flow ordering (Adventures landing)
|--------------------------------------------------------------------------
*/

function SectionOrderEditor({
  order,
  isEnabled,
  onToggle,
  onReorder,
}: {
  order: string[];
  isEnabled: (toggle: string) => boolean;
  onToggle: (toggle: string, on: boolean) => void;
  onReorder: (next: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const meta = (key: string) => ADVENTURES_SECTIONS.find((s) => s.key === key)!;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(order, from, to));
  }

  function move(key: string, delta: number) {
    const from = order.indexOf(key);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= order.length) return;
    onReorder(arrayMove(order, from, to));
  }

  return (
    <div className="bg-background border border-border rounded-lg p-6 mt-6">
      <div className="mb-4">
        <h3 className="font-serif text-base font-bold text-foreground">Section Flow</h3>
        <p className="text-xs text-foreground/60">
          Drag sections to change the order they appear on the public Adventures page. Disabled sections stay in the
          list but are hidden from visitors.
        </p>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {order.map((key, index) => {
              const section = meta(key);
              const enabled = isEnabled(section.toggle);
              return (
                <SortableSectionRow
                  key={key}
                  id={key}
                  index={index}
                  total={order.length}
                  label={section.label}
                  enabled={enabled}
                  onToggle={(on) => onToggle(section.toggle, on)}
                  onMove={(delta) => move(key, delta)}
                />
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableSectionRow({
  id,
  index,
  total,
  label,
  enabled,
  onToggle,
  onMove,
}: {
  id: string;
  index: number;
  total: number;
  label: string;
  enabled: boolean;
  onToggle: (on: boolean) => void;
  onMove: (delta: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 border border-border rounded-lg bg-card px-3 py-2 ${enabled ? "" : "opacity-60"}`}
    >
      <button
        type="button"
        className="cursor-grab text-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        aria-label={`Reorder ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="w-6 text-xs tabular-nums text-foreground/40">{index + 1}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={`Move ${label} up`}
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={`Move ${label} down`}
        disabled={index === total - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown className="w-4 h-4" />
      </Button>
      <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Show ${label} section`} />
    </li>
  );
}
