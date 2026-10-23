"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicPhotos } from "@/lib/api/photos";
import { Skeleton } from "@/components/ui/Skeleton";

const locations = [
  { name: "Olentangy Trail", query: "Olentangy Trail, Columbus, OH" },
  { name: "Highbanks Metro Park", query: "Highbanks Metro Park, Lewis Center, OH" },
  { name: "Char-Mar Ridge Park", query: "Char-Mar Ridge Park, Lewis Center, OH" },
  { name: "Hoover Nature Preserve", query: "Hoover Nature Preserve, Galena, OH" },
  { name: "Hogback Ridge Park", query: "Hogback Ridge Park, Sunbury, OH" },
  {
    name: "Alum Creek Below Dam Recreation Area",
    query: "Alum Creek Below Dam Recreation Area, Galena, OH",
  },
];

const gearItems = [
  { name: "Canon R5 Mark II", description: "Primary body for speed, reach, and low-light flexibility." },
  {
    name: "Canon RF 100-500mm F4.5-7.1 L IS USM",
    description: "The lens I rely on most for wildlife work.",
  },
  {
    name: "Canon RF 24-70mm F2.8 L IS USM",
    description: "Used when the landscape matters as much as the subject.",
  },
  {
    name: "Falcam TreeRoot F38 Pro Carbon Fiber Tripod",
    description: "Support for longer waits and steadier observation.",
  },
  {
    name: "K&F Concept Hardshell Camera Backpack",
    description: "Carry setup for moving between trails and preserves.",
  },
  { name: "Peak Design Cuff Camera Wrist Strap", description: "Simple, practical, and always attached." },
];

const mapsSearchUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

function useAboutHeroPhoto() {
  return useQuery({
    queryKey: ["about-hero-photo"],
    queryFn: async () => {
      const res = await fetchPublicPhotos({ excludeKeys: [], limit: 6 });
      return res.photos[1] ?? res.photos[0] ?? null;
    },
    staleTime: 5 * 60_000,
  });
}

export default function AboutPage() {
  const { data: hero } = useAboutHeroPhoto();
  const [heroLoaded, setHeroLoaded] = useState(false);

  return (
    <div>
      <section className="relative flex h-[70svh] items-end overflow-hidden bg-surface">
        {hero && !heroLoaded && <Skeleton className="absolute inset-0" />}
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero.url}
            alt=""
            onLoad={() => setHeroLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              heroLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        <h1 className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-14 font-serif text-5xl italic text-white sm:px-8 sm:text-6xl">
          About
        </h1>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-accent">
            Perspective
          </p>
          <h2 className="mt-3 max-w-xl font-serif text-3xl italic leading-tight sm:text-4xl">
            Wildlife photography became the thing that taught me how to slow
            down and notice more.
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">
            I&apos;m Cameron Mirka, a Central Ohio photographer who feels
            most at home outside. Birds are usually what get me out the
            door, but what keeps me coming back is how different the same
            place can feel from one morning to the next.
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
            What started as a quieter way to spend time outdoors slowly
            turned into a way of seeing. Photography gave me a reason to
            come back, wait longer, and pay closer attention. This archive
            is really just the result of that habit.
          </p>
        </div>

        <div className="grid gap-8 border-t border-border pt-8 lg:border-t-0 lg:border-l lg:pl-10 lg:pt-0">
          <div>
            <h3 className="font-serif text-lg italic">What I look for</h3>
            <p className="mt-2 text-sm text-muted">
              A change in posture, a pause before takeoff, fog moving
              through the trees, or one brief moment where the subject and
              the place line up just right.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-lg italic">How I work</h3>
            <p className="mt-2 text-sm text-muted">
              Usually on foot, usually early, and usually back in places I
              already know, trusting patience a little more than speed.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <h2 className="font-serif text-xl italic">Field Grounds</h2>
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {locations.map((loc) => (
            <li key={loc.name}>
              <a
                href={mapsSearchUrl(loc.query)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-4 text-sm transition-colors hover:text-accent"
              >
                <span>{loc.name}</span>
                <span className="text-xs uppercase tracking-wide text-muted">
                  View map ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <h2 className="font-serif text-xl italic">In the Field</h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          The kit stays simple on purpose — enough reach to keep a
          respectful distance, enough patience to let the moment come to
          me.
        </p>
        <dl className="mt-8 grid gap-6 sm:grid-cols-2">
          {gearItems.map((item) => (
            <div key={item.name} className="border-t border-border pt-4">
              <dt className="text-sm font-medium">{item.name}</dt>
              <dd className="mt-1 text-sm text-muted">{item.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="flex flex-col items-start gap-4 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-serif text-2xl italic">
            See where this is going.
          </h2>
          <div className="flex gap-6 text-sm">
            <a href="/archive" className="underline-offset-4 hover:underline">
              View the Archive
            </a>
            <a href="/login" className="underline-offset-4 hover:underline">
              Private gallery access
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
