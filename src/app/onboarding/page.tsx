"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { StepOne } from "./components/StepOne"
import { StepTwo } from "./components/StepTwo"
import { StepThree } from "./components/StepThree"
import type { ProductData } from "./components/StepTwo"

const STEPS = [
  { number: 1, label: "Connect Instagram" },
  { number: 2, label: "Add Product" },
  { number: 3, label: "Preferences" },
] as const

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [productData, setProductData] = useState<ProductData | null>(null)

  const handleBack = () => setStep(step - 1)
  const handleNext = () => setStep(step + 1)
  const handleCompleteSetup = () => {
    // Placeholder — wire to API later
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-[600px] rounded-xl bg-white px-6 py-8 shadow-sm ring-1 ring-gray-200/80">
        {/* Progress bar — step indicators */}
        <div className="mb-10" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3} aria-label={`Step ${step} of 3`}>
          <div className="flex items-center justify-between">
            {STEPS.map((s, index) => {
              const isActive = step === s.number
              const isCompleted = step > s.number
              const isUpcoming = step < s.number
              const isLast = index === STEPS.length - 1

              return (
                <div key={s.number} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
                        isActive && "bg-[#4F46E5] text-white",
                        isCompleted && "bg-green-500 text-white",
                        isUpcoming && "bg-gray-200 text-gray-500"
                      )}
                    >
                      {s.number}
                    </div>
                    <span
                      className={cn(
                        "mt-1.5 text-xs font-medium",
                        isActive && "text-[#4F46E5]",
                        isCompleted && "text-green-600",
                        isUpcoming && "text-gray-400"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        "mx-2 h-0.5 min-w-[24px] flex-1 rounded transition-colors",
                        step > s.number ? "bg-green-500" : "bg-gray-200"
                      )}
                      aria-hidden
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="min-h-[200px]">
          {step === 1 && (
            <StepOne onComplete={() => setStep(2)} />
          )}
          {step === 2 && (
            <StepTwo
              onComplete={(product) => {
                setProductData(product)
                setStep(3)
              }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepThree
              onComplete={() => router.push("/dashboard")}
              onBack={() => setStep(2)}
              productData={productData}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between gap-4 border-t border-gray-100 pt-6">
          <div className="w-24">
            {(step === 2 || step === 3) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                aria-label="Go to previous step"
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex flex-1 justify-end">
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                aria-label="Go to next step"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleCompleteSetup}
                aria-label="Complete onboarding"
              >
                Complete setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
