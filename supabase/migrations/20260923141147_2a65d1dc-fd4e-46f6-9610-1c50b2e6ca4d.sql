DROP POLICY IF EXISTS "Public view published adventures" ON public.adventures;
CREATE POLICY "Public view published adventures"
ON public.adventures FOR SELECT TO anon
USING (published);
CREATE POLICY "Authenticated view adventures"
ON public.adventures FOR SELECT TO authenticated
USING (published OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Public view published destinations" ON public.destinations;
CREATE POLICY "Public view published destinations"
ON public.destinations FOR SELECT TO anon
USING (published);
CREATE POLICY "Authenticated view destinations"
ON public.destinations FOR SELECT TO authenticated
USING (published OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Public view published faqs" ON public.faqs;
CREATE POLICY "Public view published faqs"
ON public.faqs FOR SELECT TO anon
USING (published);
CREATE POLICY "Authenticated view faqs"
ON public.faqs FOR SELECT TO authenticated
USING (published OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Public view published itineraries" ON public.itineraries;
CREATE POLICY "Public view published itineraries"
ON public.itineraries FOR SELECT TO anon
USING (published);
CREATE POLICY "Authenticated view itineraries"
ON public.itineraries FOR SELECT TO authenticated
USING (published OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Public view published articles" ON public.journal_articles;
CREATE POLICY "Public view published articles"
ON public.journal_articles FOR SELECT TO anon
USING (published);
CREATE POLICY "Authenticated view articles"
ON public.journal_articles FOR SELECT TO authenticated
USING (published OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Public view published categories" ON public.journey_categories;
CREATE POLICY "Public view published categories"
ON public.journey_categories FOR SELECT TO anon
USING (published);
CREATE POLICY "Authenticated view categories"
ON public.journey_categories FOR SELECT TO authenticated
USING (published OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Public view published lodges" ON public.lodges;
CREATE POLICY "Public view published lodges"
ON public.lodges FOR SELECT TO anon
USING (published);
CREATE POLICY "Authenticated view lodges"
ON public.lodges FOR SELECT TO authenticated
USING (published OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Public view published testimonials" ON public.testimonials;
CREATE POLICY "Public view published testimonials"
ON public.testimonials FOR SELECT TO anon
USING (published);
CREATE POLICY "Authenticated view testimonials"
ON public.testimonials FOR SELECT TO authenticated
USING (published OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));