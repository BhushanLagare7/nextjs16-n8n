import { useQuery } from "@tanstack/react-query"

import { authClient } from "@/lib/auth-client"

/**
 * Hooks for accessing the current user's subscription state via Polar.
 */

/**
 * Fetches the current customer's subscription/billing state.
 */
export const useSubscription = () => {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data } = await authClient.customer.state()
      return data
    },
  })
}

/**
 * Derives whether the current user has an active subscription,
 * along with the first active subscription (if any).
 */
export const useHasActiveSubscription = () => {
  const { data: customerState, isLoading, ...rest } = useSubscription()

  const hasActiveSubscription =
    customerState?.activeSubscriptions &&
    customerState.activeSubscriptions.length > 0

  return {
    hasActiveSubscription,
    subscription: customerState?.activeSubscriptions?.[0],
    isLoading,
    ...rest,
  }
}
