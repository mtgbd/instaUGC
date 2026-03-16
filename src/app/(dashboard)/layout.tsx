import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/shared/Sidebar"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  return (
    <div className="flex min-h-screen flex-row">
      <Sidebar />
      <main className="min-h-screen flex-1 bg-gray-50">
        <header className="flex flex-row items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
          <Link
            href="/dashboard/generate"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New content
          </Link>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
