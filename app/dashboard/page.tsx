import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Get posts stats
  const { data: posts } = await supabase
    .from('posts')
    .select('id, status')
    .eq('author_id', user.id)

  const totalPosts = posts?.length || 0
  const publishedPosts = posts?.filter((p) => p.status === 'published').length || 0
  const draftPosts = posts?.filter((p) => p.status === 'draft').length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                TouristWeb
              </Link>
              <nav className="hidden sm:flex gap-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/posts"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  My Posts
                </Link>
                <Link
                  href="/dashboard/new"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  New Post
                </Link>
                <Link
                  href="/blog"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Public Blog
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {profile?.full_name || user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-gray-500 mt-2">
            Manage your blog posts and content from here.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Posts</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalPosts}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Published</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{publishedPosts}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Drafts</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{draftPosts}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/new"
              className="inline-flex items-center px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition"
            >
              + Create New Post
            </Link>
            <Link
              href="/dashboard/posts"
              className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition"
            >
              View All Posts
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition"
            >
              View Public Blog
            </Link>
          </div>
        </div>

        {/* Recent Posts Preview */}
        {posts && posts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
              <Link
                href="/dashboard/posts"
                className="text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                View all →
              </Link>
            </div>
            <p className="text-gray-500 text-sm">
              You have {totalPosts} post{totalPosts !== 1 ? 's' : ''} in total.
              Go to <strong>My Posts</strong> to manage them.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}