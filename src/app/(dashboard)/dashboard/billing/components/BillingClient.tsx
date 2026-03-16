"use client"

import { useMemo, useState } from "react"
import { Check, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { PLANS } from "@/lib/stripe"

interface BillingClientProps {
  profile: any
  subscription: any
}

const PLAN_ORDER = ["free", "starter", "growth", "scale", "agency"] as const

export function BillingClient({
  profile,
  subscription
}: BillingClientProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const currentPlanKey =
    (profile?.plan as string | undefined)?.toLowerCase() || "free"

  const currentPlan =
    currentPlanKey in PLANS ? PLANS[currentPlanKey as keyof typeof PLANS] : null

  const currentPeriodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null

  const formattedRenewal = currentPeriodEnd
    ? `Renews ${currentPeriodEnd.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      })}`
    : null

  const currentPlanTotalCredits = useMemo(() => {
    if (!currentPlan) return 0
    if (currentPlanKey === "agency") return currentPlan.credits
    return currentPlan.credits
  }, [currentPlan, currentPlanKey])

  const creditsRemaining = profile?.credits_remaining ?? 0
  const usedCredits =
    currentPlanTotalCredits && currentPlanTotalCredits !== 999999
      ? Math.max(0, currentPlanTotalCredits - creditsRemaining)
      : 0
  const creditsPercent =
    currentPlanTotalCredits && currentPlanTotalCredits !== 999999
      ? Math.min(
          100,
          (usedCredits / currentPlanTotalCredits) * 100
        )
      : 0

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Unable to open billing portal")
        return
      }
      window.location.href = data.url
    } catch {
      toast.error("Failed to open billing portal")
    } finally {
      setPortalLoading(false)
    }
  }

  const handleUpgrade = async (priceId: string, planKey: string) => {
    setLoadingPlan(planKey)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_id: priceId })
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Unable to start checkout")
        setLoadingPlan(null)
        return
      }
      window.location.href = data.url
    } catch {
      toast.error("Failed to start checkout")
      setLoadingPlan(null)
    }
  }

  const planEntries = Object.entries(PLANS) as [
    keyof typeof PLANS,
    (typeof PLANS)[keyof typeof PLANS]
  ][]

  const sortedPlans = planEntries.sort(
    ([a], [b]) =>
      PLAN_ORDER.indexOf(a) - PLAN_ORDER.indexOf(b)
  )

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Current plan</p>
        <p className="mt-1 text-2xl font-bold capitalize text-gray-900">
          {currentPlan?.name ?? "Free"}
        </p>
        {subscription?.status === "active" && formattedRenewal && (
          <p className="mt-1 text-sm text-gray-500">{formattedRenewal}</p>
        )}

        {currentPlanTotalCredits && currentPlanTotalCredits !== 999999 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Credits used this month</span>
              <span className="text-gray-500">
                {usedCredits} / {currentPlanTotalCredits}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-indigo-500"
                style={{ width: `${creditsPercent}%` }}
              />
            </div>
          </div>
        )}

        {subscription?.status === "active" && (
          <button
            type="button"
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {portalLoading ? "Opening portal..." : "Manage subscription"}
          </button>
        )}
      </section>

      {/* Plans grid */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sortedPlans.map(([key, plan]) => {
          const isCurrent =
            currentPlanKey !== "free" &&
            plan.name.toLowerCase() === currentPlan?.name.toLowerCase()
          const isGrowth = plan.name === "Growth"

          const canUpgrade =
            PLAN_ORDER.indexOf(key) > PLAN_ORDER.indexOf(
              currentPlanKey as any
            )

          return (
            <div
              key={key}
              className={`flex flex-col rounded-xl border bg-white p-5 ${
                isCurrent ? "border-2 border-indigo-500" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900">
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-base font-normal text-gray-500">
                      /mo
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isCurrent && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      Current plan
                    </span>
                  )}
                  {isGrowth && !isCurrent && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Most popular
                    </span>
                  )}
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-400"
                  >
                    Current plan
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canUpgrade || loadingPlan === key}
                    onClick={() => handleUpgrade(plan.price_id, key)}
                    className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingPlan === key ? "Redirecting..." : "Upgrade"}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}

