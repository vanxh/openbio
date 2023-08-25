import { useEffect, useState } from "react";

export default function useSSR() {
  const [isSSR, setIsSSR] = useState(true);

  useEffect(() => {
    setIsSSR(false);
  }, []);

  return {
    isSSR,
  };
}
