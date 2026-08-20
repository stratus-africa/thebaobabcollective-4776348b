import { useMemo } from "react";
import { useParams } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

import { ImageUploader } from "@/components/admin/ImageUploader";

/*
|--------------------------------------------------------------------------
| Reusable Editor Layout
|--------------------------------------------------------------------------
*/

function EditorColumns({
  children,
  ratio = "60-40",
}: {
  children: React.ReactNode;
  ratio?: "85-15" | "60-40" | "40-60";
}) {
  const columns = {
    "85-15": "lg:grid-cols-[85fr_15fr]",
    "60-40": "lg:grid-cols-[60fr_40fr]",
    "40-60": "lg:grid-cols-[40fr_60fr]",
  };

  return (
    <div
      className={`grid grid-cols-1 gap-6 ${columns[ratio]}`}
    >
      {children}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Page Editor
|--------------------------------------------------------------------------
*/

export default function PageEditor() {
  const { page } = useParams({
    from: "/_authenticated/admin/pages/$page",
  });

  const pageType = useMemo(() => page, [page]);

  /*
  |--------------------------------------------------------------------------
  | Home Page
  |--------------------------------------------------------------------------
  */

  if (pageType === "home") {
    return (
      <div className="space-y-8">

        {/* HERO */}
        <Card className="rounded-lg p-6">
          <EditorColumns ratio="60-40">
            <div className="space-y-4">
              {/* Existing Hero text and configuration fields */}
            </div>

            <div>
              <ImageUploader
                label="Hero Background Image"
                value={undefined}
                onChange={() => {}}
              />
            </div>
          </EditorColumns>
        </Card>

        {/* FIND YOUR JOURNEY */}
        <Card className="rounded-lg p-6">
          <EditorColumns ratio="60-40">
            <div className="space-y-4">
              {/* Existing section configuration */}
            </div>

            <div>
              <Accordion type="single" collapsible className="w-full">
                {[
                  "Safari & Wildlife",
                  "The Great Migration",
                  "Honeymoon & Romance",
                  "Family & Adventure",
                  "Beach & Safari",
                  "Culture & Connection",
                ].map((journey, index) => (
                  <AccordionItem
                    key={journey}
                    value={`journey-${index}`}
                    className="rounded-lg border px-4"
                  >
                    <AccordionTrigger>
                      {journey}
                    </AccordionTrigger>

                    <AccordionContent>
                      {/* Existing journey editing fields */}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </EditorColumns>
        </Card>

        {/* WHY BAOBAB */}
        <Card className="rounded-lg p-6">
          <Tabs defaultValue="pillar-0">
            <TabsList className="h-auto flex-wrap">
              {/* Existing pillar tabs */}
            </TabsList>

            {/* Existing Pillar editing content */}
          </Tabs>
        </Card>

        {/* FOUNDERS */}
        <Card className="rounded-lg p-6">
          <Tabs defaultValue="founder-0">
            <TabsList className="h-auto flex-wrap">
              {/* Founder tabs */}
            </TabsList>

            {/* Founder content */}
          </Tabs>
        </Card>

        {/* JOURNEY IMPACT */}
        <Card className="rounded-lg p-6">
          <Accordion type="single" collapsible>
            {/* Journey Impact Pillars as collapsible tabs */}
          </Accordion>
        </Card>

        {/* HOW IT WORKS */}
        <Card className="rounded-lg p-6">
          <Tabs defaultValue="step-0">
            <TabsList className="flex h-auto flex-wrap items-center gap-2">
              {/* Steps */}
              <TabsTrigger value="step-0">
                Step 1
              </TabsTrigger>

              <ArrowRight className="h-4 w-4 text-muted-foreground" />

              <TabsTrigger value="step-1">
                Step 2
              </TabsTrigger>

              <ArrowRight className="h-4 w-4 text-muted-