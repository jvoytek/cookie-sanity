import { useBreakpoints, breakpointsTailwind } from '@vueuse/core';

export const useDevice = () => {
  // 1. Get Tailwind breakpoint definitions (sm: 640px, md: 768px, etc.)
  const breakpoints = useBreakpoints(breakpointsTailwind);

  // 2. Define "mobile" as anything smaller than the Tailwind 'md' breakpoint
  // useBreakpoints handles SSR automatically by safely defaulting to false on the server
  const isMobile = breakpoints.smaller('md');

  return {
    isMobile,
  };
};
