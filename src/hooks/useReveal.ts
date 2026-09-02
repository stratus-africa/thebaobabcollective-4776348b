import { useEffect, useRef } from "react";

/**
 * useReveal — attaches an IntersectionObserver to the returned ref.
 * When the element enters the viewport it gets `data-revealed="true"`,
 * which the `.reveal` and `.reveal-fade` CSS classes key off to
 * transition from hidden → visible.
 *
 * The observer disconnects after first reveal so it doesn't fire again
 * on scroll-back (one-shot), keeping behaviour predictable and cheap.
 *
 * @param threshold  Fraction of element visible before triggering (default 0.12)
 * @param rootMargin Optional IntersectionObserver rootMargin (default "0px 0px -48px 0px")
 */
export function useReveal<T extends HTMLElement = HTMLElement>(
  threshold = 0.12,
  rootMargin = "0px 0px -48px 0px",
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If the user prefers reduced motion the CSS already makes `.reveal`
    // fully visible; we still set the attribute so no element is ever
    // permanently hidden if JS runs after CSS.
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      el.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.revealed = "true";
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}

/**
 * useRevealChildren — observes each direct child of the returned ref
 * individually, adding staggered reveal-delay classes automatically.
 * Useful for grids where children should animate in sequence.
 *
 * Children must already have the `reveal` class applied in JSX.
 */
export function useRevealChildren<T extends HTMLElement = HTMLElement>(
  threshold = 0.08,
  rootMargin = "0px 0px -32px 0px",
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const children = Array.from(container.children) as HTMLElement[];

    if (prefersReduced) {
      children.forEach((child) => {
        child.dataset.revealed = "true";
      });
      return;
    }

    const observers: IntersectionObserver[] = [];

    children.forEach((child) => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            child.dataset.revealed = "true";
            obs.disconnect();
          }
        },
        { threshold, rootMargin },
      );
      obs.observe(child);
      observers.push(obs);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [threshold, rootMargin]);

  return ref;
}
