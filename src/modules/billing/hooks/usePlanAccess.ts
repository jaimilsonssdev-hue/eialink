import { useQuery } from "@tanstack/react-query";
import { BillingService } from "../services/BillingService";

/** The only client-facing source for plan limits and feature availability. */
export function usePlanAccess() {
  return useQuery({
    queryKey: ["current-plan-access"],
    queryFn: BillingService.getCurrentAccess,
    staleTime: 30_000,
  });
}
