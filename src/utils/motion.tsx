import * as React from "react";
import { Box, type BoxProps } from "@mui/material";
import { useTheme } from "@mui/material/styles";

type MotionRevealProps = BoxProps & {
  delay?: number;
  distance?: number;
  threshold?: number;
};

type FullscreenSectionProps = BoxProps & {
  activeScale?: number;
  inactiveScale?: number;
  dimInactive?: boolean;
};

export const MotionReveal = ({
  children,
  delay = 0,
  distance = 28,
  threshold = 0.18,
  sx,
  ...boxProps
}: MotionRevealProps) => {
  const theme = useTheme();
  const prefersReducedMotion = React.useMemo(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return true;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  const [isVisible, setIsVisible] = React.useState(prefersReducedMotion);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (prefersReducedMotion || !ref.current) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [prefersReducedMotion, threshold]);

  return (
    <Box
      ref={ref}
      sx={[
        {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translate3d(0, 0, 0)" : `translate3d(0, ${distance}px, 0)`,
          transition: prefersReducedMotion
            ? "none"
            : theme.transitions.create(["opacity", "transform"], {
                duration: 760,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                delay,
              }),
          willChange: prefersReducedMotion ? "auto" : "opacity, transform",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...boxProps}
    >
      {children}
    </Box>
  );
};

export const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return true;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);

    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
};

export const usePointerParallax = (intensity = 18) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [state, setState] = React.useState({
    rotateX: 0,
    rotateY: 0,
    glowX: 50,
    glowY: 50,
  });

  const handleMove = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (prefersReducedMotion) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * intensity;
      const rotateX = (0.5 - y) * intensity;

      setState({
        rotateX,
        rotateY,
        glowX: x * 100,
        glowY: y * 100,
      });
    },
    [intensity, prefersReducedMotion],
  );

  const handleLeave = React.useCallback(() => {
    setState({
      rotateX: 0,
      rotateY: 0,
      glowX: 50,
      glowY: 50,
    });
  }, []);

  return {
    prefersReducedMotion,
    interactiveProps: prefersReducedMotion
      ? {}
      : {
          onMouseMove: handleMove,
          onMouseLeave: handleLeave,
        },
    style: prefersReducedMotion
      ? undefined
      : ({
          "--motion-rotate-x": `${state.rotateX}deg`,
          "--motion-rotate-y": `${state.rotateY}deg`,
          "--motion-glow-x": `${state.glowX}%`,
          "--motion-glow-y": `${state.glowY}%`,
        } as React.CSSProperties),
  };
};

export const MotionParallax = ({
  children,
  offset = 56,
  sx,
  ...boxProps
}: BoxProps & { offset?: number }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (prefersReducedMotion) return undefined;

    const updateProgress = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const value = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const clamped = Math.max(0, Math.min(1, value));
      setProgress(clamped);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [prefersReducedMotion]);

  const translateY = prefersReducedMotion ? 0 : (progress - 0.5) * offset;

  return (
    <Box
      ref={ref}
      sx={[
        {
          transform: `translate3d(0, ${translateY}px, 0)`,
          transition: prefersReducedMotion ? "none" : "transform 120ms linear",
          willChange: prefersReducedMotion ? "auto" : "transform",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...boxProps}
    >
      {children}
    </Box>
  );
};

export const FullscreenSection = ({
  children,
  activeScale = 1,
  inactiveScale = 0.985,
  dimInactive = false,
  sx,
  ...boxProps
}: FullscreenSectionProps) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = React.useState(prefersReducedMotion);

  React.useEffect(() => {
    if (prefersReducedMotion || !ref.current) {
      setIsActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsActive(entry.intersectionRatio >= 0.56);
        });
      },
      {
        threshold: [0.2, 0.4, 0.56, 0.72],
      },
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <Box
      ref={ref}
      sx={[
        {
          minHeight: "100svh",
          width: "100%",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
          display: "flex",
          alignItems: "stretch",
          position: "relative",
          opacity: isActive || !dimInactive ? 1 : 0.9,
          transform: `scale(${isActive ? activeScale : inactiveScale})`,
          "& > *": {
            width: "100%",
            flex: "1 0 auto",
          },
          transition: prefersReducedMotion
            ? "none"
            : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease",
          willChange: prefersReducedMotion ? "auto" : "transform, opacity",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...boxProps}
    >
      {children}
    </Box>
  );
};

export const motionHoverLift = {
  transition:
    "transform 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease, border-color 260ms ease, background-color 260ms ease, box-shadow 360ms cubic-bezier(0.22, 1, 0.36, 1)",
  willChange: "transform",
};
