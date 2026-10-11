import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 hover:opacity-80">
            TouristWeb
          </Link>
          <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            ← All Posts
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 text-sm text-gray-500 mb-10">
          <span className="font-medium text-gray-700">
            {post.profiles?.full_name || 'Anonymous'}
          </span>
          <span>•</span>
          <time>
            {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>

        {post.cover_image && (
          <div className="mb-10 rounded-2xl overflow-hidden">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-auto object-cover max-h-[500px]"
            />
          </div>
        )}

        {post.excerpt && (
          <p className="text-xl text-gray-600 leading-relaxed mb-8 border-l-4 border-gray-200 pl-5 italic">
            {post.excerpt}
          </p>
        )}

        {/* Rich content from Tiptap */}
        <div
          className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <footer className="border-t border-gray-100 mt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center">
          <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            ← Back to all posts
          </Link>
        </div>
      </footer>
    </div>
  )
}