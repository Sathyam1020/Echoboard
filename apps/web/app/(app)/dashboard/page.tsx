import { redirect } from "next/navigation"

// /dashboard now redirects to the default landing page (Feedback). The
// previous overview screen was removed when the dual-panel sidebar
// dropped the "Home" icon — there's no longer a way to navigate here
// directly from the rail.
export default function DashboardPage() {
  redirect("/dashboard/feedback")
}
