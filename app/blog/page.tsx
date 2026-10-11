import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BlogPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      slug,
      excerpt,
      cover_image,
      published_at,
      created_at,
      profiles (
        full_name
      )
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            TouristWeb
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-10">Blog</h1>

        {!posts || posts.length === 0 ? (
          <p className="text-gray-500">No published posts yet.</p>
        ) : (
          <div className="grid gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                {post.cover_image && (
                  <Link href={`/blog/${post.slug}`}>
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-56 object-cover"
                    />
                  </Link>
                )}
                <div className="p-6">
                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="text-2xl font-semibold text-gray-900 hover:underline">
                      {post.title}
                    </h2>
                  </Link>
                  <p className="text-gray-500 mt-2 line-clamp-2">
                    {post.excerpt || 'No excerpt available.'}
                  </p>
                  <div className="flex items-center gap-3 mt-4 text-sm text-gray-400">
                    <span>{post.profiles?.full_name || 'Anonymous'}</span>
                    <span>•</span>
                    <time>
                      {new Date(post.published_at || post.created_at).toLocaleDateString()}
                    </time>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}