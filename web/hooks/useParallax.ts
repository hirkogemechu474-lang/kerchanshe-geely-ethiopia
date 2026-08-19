import { useScroll, useTransform, MotionValue } from "framer-motion";
import { RefObject } from "react";

interface ParallaxOptions {
  speed?: number;
  direction?: "up" | "down";
}

export function useParallax(
  ref: RefObject<HTMLElement>,
  options: ParallaxOptions = {}
): MotionValue<string> {
  const { speed = 0.5, direction = "up" } = options;
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const range = direction === "up" ? [-100, 100] : [100, -100];
  const y = useTransform(scrollYProgress, [0, 1], range.map(v => v * speed));
  
  return useTransform(y, (value) => `${value}px`);
}

export function useParallaxScale(
  ref: RefObject<HTMLElement>,
  range: [number, number] = [0.8, 1.2]
): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return useTransform(scrollYProgress, [0, 0.5, 1], [range[0], 1, range[1]]);
}

export function useParallaxOpacity(
  ref: RefObject<HTMLElement>
): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
}
