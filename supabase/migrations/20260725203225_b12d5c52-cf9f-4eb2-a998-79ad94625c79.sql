
-- 1. site_settings: scope public SELECT to allow-listed keys
DROP POLICY IF EXISTS "Public view site settings" ON public.site_settings;
CREATE POLICY "Public view site settings" ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (key IN (
    'hero','branding','currency','contact','menu_config',
    'page_home','page_home_adventures','page_home_instagram',
    'page_about','page_about_mission','page_about_values','page_about_team',
    'page_contact','page_footer','page_adventures_index','page_detail_journey','page_seo'
  ));

-- 2. Replace WITH CHECK (true) with minimal validation
DROP POLICY IF EXISTS "Anyone can submit an enquiry" ON public.enquiries;
CREATE POLICY "Anyone can submit an enquiry" ON public.enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(btrim(name)) > 0 AND length(btrim(email)) > 0 AND length(btrim(message)) > 0);

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(btrim(email)) > 0 AND email ~ '@');

DROP POLICY IF EXISTS "Anyone can create a booking" ON public.bookings;
CREATE POLICY "Anyone can create a booking" ON public.bookings
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(guest_name)) > 0
    AND length(btrim(guest_email)) > 0
    AND length(btrim(itinerary_name)) > 0
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can submit private travel request" ON public.private_travel_requests;
CREATE POLICY "Anyone can submit private travel request" ON public.private_travel_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(btrim(full_name)) > 0 AND length(btrim(email)) > 0);

DROP POLICY IF EXISTS "Anyone can request the planning guide" ON public.planning_guide_requests;
CREATE POLICY "Anyone can request the planning guide" ON public.planning_guide_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (length(btrim(name)) > 0 AND length(btrim(email)) > 0);

-- 3. Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO service_role;

-- 4. Pin search_path on functions missing it
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
