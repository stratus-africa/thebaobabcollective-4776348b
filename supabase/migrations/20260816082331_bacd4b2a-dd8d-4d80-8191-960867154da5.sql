DROP POLICY IF EXISTS "Anyone can create a booking" ON public.bookings;

CREATE POLICY "Anyone can create a pending booking"
ON public.bookings
FOR INSERT
WITH CHECK (
  length(trim(guest_name)) > 0
  AND length(trim(guest_email)) > 0
  AND length(trim(itinerary_name)) > 0
  AND (user_id IS NULL OR user_id = auth.uid())
  AND coalesce(status, 'pending') = 'pending'
  AND coalesce(payment_status, 'unpaid') = 'unpaid'
  AND stripe_session_id IS NULL
  AND stripe_payment_intent IS NULL
);