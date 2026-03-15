import { useState, useEffect } from "react";

export function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.05) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { 
        if (entry.isIntersecting) { 
          setInView(true); 
          observer.disconnect(); 
        } 
      },
      { threshold }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return inView;
}
