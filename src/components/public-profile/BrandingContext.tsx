import { createContext, useContext } from "react";

const BrandingContext = createContext(true);

export function BrandingProvider({ show, children }: { show: boolean; children: React.ReactNode }) {
  return <BrandingContext.Provider value={show}>{children}</BrandingContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useShowEialinkBranding() {
  return useContext(BrandingContext);
}
