'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import NextLink from 'next/link'

const CATEGORIES = ['Uncategorized', 'News', 'Tutorials', 'Lifestyle', 'Technology', 'Business', 'Travel']

export default function EditPostPage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [coverAlt, setCoverAlt] = useState('')
  const [category, setCategory] = useState('Uncategorized')
  const [tagList, setTagList] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [initialContent, setInitialContent] = useState('')

  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const supabase = createClient()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto my-6',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your amazing blog post...',
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none min-h-[400px] focus:outline-none px-4 py-3',
      },
    },
  })

  // Load existing post
  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (error || !data) {
        setMessage('Post not found')
        setLoading(false)
        return
      }

      setTitle(data.title || '')
      setSlug(data.slug || '')
      setExcerpt(data.excerpt || '')
      setCoverImage(data.cover_image || '')
      setCoverAlt(data.cover_alt || '')
      setCategory(data.category || 'Uncategorized')
      setTagList(data.tags || [])
      setMetaTitle(data.meta_title || '')
      setMetaDescription(data.meta_description || '')
      setStatus(data.status || 'draft')
      setInitialContent(data.content || '')
      setLoading(false)
    }

    fetchPost()
  }, [postId])

  // Set content when editor is ready
  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent)
    }
  }, [editor, initialContent])

  const uploadImage = useCallback(
    async (file: File) => {
      try {
        setUploading(true)
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `blog-images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('blog-images').getPublicUrl(filePath)

        return publicUrl
      } catch (error: any) {
        alert('Error uploading image: ' + error.message)
        return null
      } finally {
        setUploading(false)
      }
    },
    [supabase]
  )

  const addImage = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      if (input.files?.length) {
        const url = await uploadImage(input.files[0])
        if (url && editor) {
          editor.chain().focus().setImage({ src: url }).run()
        }
      }
    }
    input.click()
  }, [editor, uploadImage])

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadImage(file)
    if (url) setCoverImage(url)
  }

  const handleCoverDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const url = await uploadImage(file)
      if (url) setCoverImage(url)
    }
  }

  const addTag = (value: string) => {
    const tag = value.trim().replace(/,$/, '')
    if (tag && !tagList.includes(tag)) {
      setTagList([...tagList, tag])
    }
    setTagInput('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editor) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('posts')
      .update({
        title,
        slug,
        excerpt,
        content: editor.getHTML(),
        cover_image: coverImage || null,
        cover_alt: coverAlt || null,
        category,
        tags: tagList,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage('Post updated successfully!')
    setTimeout(() => {
      router.push('/dashboard/posts')
      router.refresh()
    }, 800)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading post...</p>
      </div>
    )
  }

  if (!editor) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <NextLink
            href="/dashboard/posts"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back
          </NextLink>
          <h1 className="text-lg font-semibold text-gray-900">Edit Post</h1>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById('edit-form')
                ?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
            }
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Update Post'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            className="w-full text-4xl font-bold border-none focus:outline-none placeholder:text-gray-300 bg-transparent"
            required
          />

          {/* Slug */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Slug:</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="flex-1 border-b border-gray-200 focus:outline-none focus:border-black bg-transparent"
              required
            />
          </div>

          {/* Cover Image */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCoverDrop}
            className="relative border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-gray-400 transition"
          >
            {coverImage ? (
              <div className="relative">
                <img
                  src={coverImage}
                  alt={coverAlt || 'Cover'}
                  className="w-full h-64 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="absolute top-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-3">Drag & drop cover image here</p>
                <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  {uploading ? 'Uploading...' : 'Choose Cover Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {coverImage && (
            <input
              type="text"
              value={coverAlt}
              onChange={(e) => setCoverAlt(e.target.value)}
              placeholder="Cover image alt text (for SEO & accessibility)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          )}

          {/* Toolbar */}
          <div className="flex flex-wrap gap-1 p-2 bg-white border border-gray-200 rounded-xl sticky top-16 z-10">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                editor.isActive('bold') ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              Bold
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                editor.isActive('italic') ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              Italic
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                editor.isActive('underline') ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              Underline
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                editor.isActive('heading', { level: 1 }) ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                editor.isActive('heading', { level: 2 }) ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                editor.isActive('heading', { level: 3 }) ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              H3
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                editor.isActive('bulletList') ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                editor.isActive('orderedList') ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              Numbered
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                editor.isActive('blockquote') ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              Quote
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
            <button
              type="button"
              onClick={addImage}
              disabled={uploading}
              className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100"
            >
              {uploading ? 'Uploading...' : '🖼️ Image'}
            </button>
          </div>

          {/* Editor */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[500px]">
            <EditorContent editor={editor} />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
            <div className="flex flex-wrap items-center gap-2 border border-gray-300 rounded-xl px-3 py-2 bg-white">
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 bg-gray-100 text-gray-800 text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTagList(tagList.filter((t) => t !== tag))}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => {
                  if (e.target.value.endsWith(',')) addTag(e.target.value)
                  else setTagInput(e.target.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(tagInput)
                  }
                }}
                onBlur={() => tagInput && addTag(tagInput)}
                placeholder={tagList.length ? '' : 'Add tags, press Enter'}
                className="flex-1 min-w-[120px] text-sm focus:outline-none py-1"
              />
            </div>
          </div>

          {/* SEO */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Meta Title (SEO)
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title || 'Meta title'}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-400 mt-1">{metaTitle.length}/60</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Meta Description (SEO)
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                placeholder="Meta description for search engines"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{metaDescription.length}/160</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {message && (
            <div
              className={`text-sm text-center py-2.5 px-4 rounded-lg ${
                message.includes('successfully')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </main>
    </div>
  )
}