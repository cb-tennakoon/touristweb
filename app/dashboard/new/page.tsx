'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { Extension, type Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle, Color, FontFamily } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import Youtube from '@tiptap/extension-youtube'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'

/* ------------------------------------------------------------------ */
/*  Custom extensions                                                  */
/* ------------------------------------------------------------------ */

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el: HTMLElement) => el.style.fontSize || null,
            renderHTML: (attrs: Record<string, any>) =>
              attrs.fontSize ? { style: `font-size:${attrs.fontSize}` } : {},
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }: any) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }: any) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

// Image with size + alignment controls
const RichImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (el: HTMLElement) => el.style.width || el.getAttribute('width') || '100%',
        renderHTML: (attrs: Record<string, any>) => ({ style: `width:${attrs.width}` }),
      },
      align: {
        default: 'center',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-align') || 'center',
        renderHTML: (attrs: Record<string, any>) => ({
          'data-align': attrs.align,
          style:
            attrs.align === 'left'
              ? 'display:block;margin-right:auto'
              : attrs.align === 'right'
              ? 'display:block;margin-left:auto'
              : 'display:block;margin-left:auto;margin-right:auto',
        }),
      },
    }
  },
})

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DRAFT_KEY = 'new-post-draft-v2'

const FONTS = [
  { label: 'Default font', value: '' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Sans', value: 'Inter, Arial, sans-serif' },
  { label: 'Mono', value: 'ui-monospace, Menlo, monospace' },
  { label: 'Handwritten', value: '"Comic Sans MS", cursive' },
]

const SIZES = ['', '14px', '16px', '18px', '20px', '24px', '32px', '40px']

const CATEGORIES = ['Uncategorized', 'News', 'Tutorials', 'Lifestyle', 'Technology', 'Business', 'Travel']

const TEXT_COLORS = [
  '#111827', '#4b5563', '#9ca3af', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#0d9488',
  '#2563eb', '#7c3aed', '#db2777', '#be123c', '#78350f', '#065f46', '#1e3a8a', '#581c87',
]
const HIGHLIGHTS = ['#fef08a', '#fed7aa', '#fecaca', '#bbf7d0', '#a5f3fc', '#bfdbfe', '#ddd6fe', '#fbcfe8']

const field =
  'w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent'

type Mode = 'write' | 'html' | 'preview'
type SideTab = 'post' | 'seo' | 'outline'

type ModalState = null | {
  type: 'link' | 'image' | 'youtube' | 'alt'
  url: string
  text: string
  alt: string
  newTab: boolean
  nofollow: boolean
  needsText: boolean
}

type SlashItem = {
  title: string
  desc: string
  icon: string
  keywords: string
  run: (ed: Editor) => void
}

/* ------------------------------------------------------------------ */
/*  Small UI pieces                                                    */
/* ------------------------------------------------------------------ */

function Btn({
  onClick,
  active,
  disabled,
  title,
  children,
  small,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
  small?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`${small ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-sm'} rounded-md min-w-[32px] disabled:opacity-30 transition-colors ${
        active ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-800'
      }`}
    >
      {children}
    </button>
  )
}

const Sep = () => <div className="w-px h-5 bg-gray-200 mx-1 self-center" />

function ColorMenu({
  label,
  title,
  colors,
  current,
  onPick,
  onClear,
}: {
  label: React.ReactNode
  title: string
  colors: string[]
  current?: string
  onPick: (c: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        title={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className="px-2 py-1.5 rounded-md text-sm hover:bg-gray-100 text-gray-800 flex items-center gap-1"
      >
        <span
          className="font-semibold leading-none pb-0.5"
          style={{ borderBottom: `3px solid ${current || '#d1d5db'}` }}
        >
          {label}
        </span>
        <span className="text-[9px] text-gray-500">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-52">
            <div className="grid grid-cols-8 gap-1.5">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(c)
                    setOpen(false)
                  }}
                  className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform"
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                Custom
                <input
                  type="color"
                  value={current || '#000000'}
                  onChange={(e) => onPick(e.target.value)}
                  className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer"
                />
              </label>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onClear()
                  setOpen(false)
                }}
                className="text-xs text-gray-600 hover:text-gray-900 underline"
              >
                Reset
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Toolbar({
  editor,
  openModal,
  onImageUpload,
  uploading,
}: {
  editor: Editor
  openModal: (t: 'link' | 'image' | 'youtube' | 'alt') => void
  onImageUpload: () => void
  uploading: boolean
}) {
  const chain = () => editor.chain().focus() as any

  const blockValue = [1, 2, 3, 4].find((l) => editor.isActive('heading', { level: l }))
  const setBlock = (v: string) => {
    if (v === 'p') chain().setParagraph().run()
    else chain().setHeading({ level: Number(v) }).run()
  }

  const inTable = editor.isActive('table')
  const selectCls =
    'text-sm text-gray-900 border border-gray-200 rounded-md px-2 py-1.5 bg-white hover:bg-gray-50 focus:outline-none'

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm sticky top-[68px] z-20">
      <div className="flex flex-wrap items-center gap-0.5 p-1.5">
        <Btn title="Undo (Ctrl+Z)" onClick={() => chain().undo().run()} disabled={!editor.can().undo()}>↶</Btn>
        <Btn title="Redo (Ctrl+Shift+Z)" onClick={() => chain().redo().run()} disabled={!editor.can().redo()}>↷</Btn>
        <Sep />
        <select value={blockValue ? String(blockValue) : 'p'} onChange={(e) => setBlock(e.target.value)} className={selectCls} title="Block type">
          <option value="p">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
        </select>
        <select
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onChange={(e) => (e.target.value ? chain().setFontFamily(e.target.value).run() : chain().unsetFontFamily().run())}
          className={selectCls}
          title="Font family"
        >
          {FONTS.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          value={editor.getAttributes('textStyle').fontSize || ''}
          onChange={(e) => (e.target.value ? chain().setFontSize(e.target.value).run() : chain().unsetFontSize().run())}
          className={selectCls}
          title="Font size"
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>{s ? s.replace('px', '') : 'Size'}</option>
          ))}
        </select>
        <Sep />
        <Btn title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()}><b>B</b></Btn>
        <Btn title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()}><i>I</i></Btn>
        <Btn title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => chain().toggleUnderline().run()}><u>U</u></Btn>
        <Btn title="Strikethrough" active={editor.isActive('strike')} onClick={() => chain().toggleStrike().run()}><s>S</s></Btn>
        <Btn title="Inline code" active={editor.isActive('code')} onClick={() => chain().toggleCode().run()}>{'</>'}</Btn>
        <Btn title="Subscript" active={editor.isActive('subscript')} onClick={() => chain().toggleSubscript().run()}>x₂</Btn>
        <Btn title="Superscript" active={editor.isActive('superscript')} onClick={() => chain().toggleSuperscript().run()}>x²</Btn>
        <Sep />
        <ColorMenu
          label="A"
          title="Text color"
          colors={TEXT_COLORS}
          current={editor.getAttributes('textStyle').color}
          onPick={(c) => chain().setColor(c).run()}
          onClear={() => chain().unsetColor().run()}
        />
        <ColorMenu
          label="🖍"
          title="Highlight"
          colors={HIGHLIGHTS}
          current={editor.getAttributes('highlight').color}
          onPick={(c) => chain().setHighlight({ color: c }).run()}
          onClear={() => chain().unsetHighlight().run()}
        />
        <Btn title="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}>⌫</Btn>
      </div>

      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-t border-gray-100">
        <Btn title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => chain().setTextAlign('left').run()}>⇤</Btn>
        <Btn title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => chain().setTextAlign('center').run()}>≡</Btn>
        <Btn title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => chain().setTextAlign('right').run()}>⇥</Btn>
        <Btn title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => chain().setTextAlign('justify').run()}>☰</Btn>
        <Sep />
        <Btn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()}>• List</Btn>
        <Btn title="Numbered list" active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()}>1. List</Btn>
        <Btn title="Task list" active={editor.isActive('taskList')} onClick={() => chain().toggleTaskList().run()}>☑ Tasks</Btn>
        <Btn
          title="Indent (Tab)"
          onClick={() => {
            chain().sinkListItem('listItem').run() || chain().sinkListItem('taskItem').run()
          }}
        >→</Btn>
        <Btn
          title="Outdent (Shift+Tab)"
          onClick={() => {
            chain().liftListItem('listItem').run() || chain().liftListItem('taskItem').run()
          }}
        >←</Btn>
        <Sep />
        <Btn title="Quote" active={editor.isActive('blockquote')} onClick={() => chain().toggleBlockquote().run()}>❝ Quote</Btn>
        <Btn title="Code block" active={editor.isActive('codeBlock')} onClick={() => chain().toggleCodeBlock().run()}>{'{ }'}</Btn>
        <Btn title="Divider" onClick={() => chain().setHorizontalRule().run()}>―</Btn>
        <Sep />
        <Btn title="Link (Ctrl+K)" active={editor.isActive('link')} onClick={() => openModal('link')}>🔗 Link</Btn>
        <Btn title="Upload image" onClick={onImageUpload} disabled={uploading}>{uploading ? '…' : '🖼 Upload'}</Btn>
        <Btn title="Image from URL" onClick={() => openModal('image')}>🌐 URL</Btn>
        <Btn title="Embed YouTube" onClick={() => openModal('youtube')}>▶ Video</Btn>
        <Btn title="Insert table" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦ Table</Btn>
      </div>

      {inTable && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <span className="text-xs text-gray-500 px-1.5">Table</span>
          <Btn small title="Column before" onClick={() => chain().addColumnBefore().run()}>+ Col ←</Btn>
          <Btn small title="Column after" onClick={() => chain().addColumnAfter().run()}>+ Col →</Btn>
          <Btn small title="Delete column" onClick={() => chain().deleteColumn().run()}>− Col</Btn>
          <Btn small title="Row before" onClick={() => chain().addRowBefore().run()}>+ Row ↑</Btn>
          <Btn small title="Row after" onClick={() => chain().addRowAfter().run()}>+ Row ↓</Btn>
          <Btn small title="Delete row" onClick={() => chain().deleteRow().run()}>− Row</Btn>
          <Btn small title="Toggle header row" onClick={() => chain().toggleHeaderRow().run()}>Header</Btn>
          <Btn small title="Merge or split cells" onClick={() => chain().mergeOrSplit().run()}>Merge/Split</Btn>
          <Btn small title="Delete table" onClick={() => chain().deleteTable().run()}>🗑 Table</Btn>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function NewPostPage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [coverAlt, setCoverAlt] = useState('')
  const [category, setCategory] = useState('Uncategorized')
  const [tagList, setTagList] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [allowComments, setAllowComments] = useState(true)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [mode, setMode] = useState<Mode>('write')
  const [htmlSource, setHtmlSource] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const [savedAt, setSavedAt] = useState('')
  const [tab, setTab] = useState<SideTab>('post')
  const [modal, setModal] = useState<ModalState>(null)
  const [pendingDraft, setPendingDraft] = useState<any>(null)
  const [bubble, setBubble] = useState<{ show: boolean; kind: 'text' | 'image'; top: number; left: number }>({
    show: false, kind: 'text', top: 0, left: 0,
  })
  const [slash, setSlash] = useState({ open: false, query: '', top: 0, left: 0, index: 0 })

  const router = useRouter()
  const supabase = createClient()

  const editorRef = useRef<Editor | null>(null)
  const slashRef = useRef(slash)
  slashRef.current = slash
  const leaveOk = useRef(false)

  // refs so editor handlers always call the latest functions
  const apiRef = useRef<{
    filterSlash: (q: string) => SlashItem[]
    runSlash: (item: SlashItem) => void
    openModal: (t: 'link' | 'image' | 'youtube' | 'alt') => void
    insertImageFile: (f: File) => void
    updateOverlays: (ed: Editor) => void
    save: (s: 'draft' | 'published') => void
  } | null>(null)

  /* ---------------- uploads ---------------- */

  const uploadImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setToast({ type: 'error', text: 'Please choose an image file' })
        return null
      }
      if (file.size > 8 * 1024 * 1024) {
        setToast({ type: 'error', text: 'Image must be smaller than 8 MB' })
        return null
      }
      try {
        setUploading(true)
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `blog-images/${fileName}`

        const { error: uploadError } = await supabase.storage.from('blog-images').upload(filePath, file)
        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('blog-images').getPublicUrl(filePath)
        return publicUrl
      } catch (error: any) {
        setToast({ type: 'error', text: 'Upload failed: ' + error.message })
        return null
      } finally {
        setUploading(false)
      }
    },
    [supabase]
  )

  const insertImageFile = useCallback(
    async (file: File) => {
      const url = await uploadImage(file)
      if (!url) return
      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
      editorRef.current?.chain().focus().setImage({ src: url, alt }).run()
      setToast({ type: 'success', text: 'Image added. Select it to edit size, alignment and alt text.' })
    },
    [uploadImage]
  )

  const addImage = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) insertImageFile(file)
    }
    input.click()
  }, [insertImageFile])

  /* ---------------- overlays (bubble + slash) ---------------- */

  const updateOverlays = useCallback((ed: Editor) => {
    if (!ed || ed.isDestroyed) return
    const { state, view } = ed
    const { selection } = state
    const node = (selection as any).node

    // Floating toolbar
    if (!selection.empty && !ed.isActive('codeBlock')) {
      try {
        if (node?.type?.name === 'image') {
          const dom = view.nodeDOM(selection.from) as HTMLElement | null
          if (dom) {
            const r = dom.getBoundingClientRect()
            const top = r.top < 130 ? r.bottom + 10 : r.top - 52
            setBubble({ show: true, kind: 'image', top, left: r.left + r.width / 2 })
          }
        } else if (!node) {
          const a = view.coordsAtPos(selection.from)
          const b = view.coordsAtPos(selection.to)
          const top = Math.min(a.top, b.top)
          setBubble({
            show: true,
            kind: 'text',
            top: top < 130 ? Math.max(a.bottom, b.bottom) + 10 : top - 52,
            left: (Math.min(a.left, b.left) + Math.max(a.right, b.right)) / 2,
          })
        } else {
          setBubble((b) => (b.show ? { ...b, show: false } : b))
        }
      } catch {
        setBubble((b) => (b.show ? { ...b, show: false } : b))
      }
    } else {
      setBubble((b) => (b.show ? { ...b, show: false } : b))
    }

    // Slash command menu
    if (selection.empty && !ed.isActive('codeBlock')) {
      const $from = selection.$from
      const textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - 30), $from.parentOffset, undefined, '\ufffc')
      const m = /(?:^|\s)\/([a-z0-9]*)$/i.exec(textBefore)
      if (m && $from.parent.type.name === 'paragraph') {
        const c = view.coordsAtPos(selection.from)
        const flip = c.bottom + 300 > window.innerHeight
        setSlash((prev) => ({
          open: true,
          query: m[1],
          top: flip ? c.top - 296 : c.bottom + 6,
          left: Math.min(c.left, window.innerWidth - 300),
          index: prev.query === m[1] ? prev.index : 0,
        }))
        return
      }
    }
    setSlash((s) => (s.open ? { ...s, open: false } : s))
  }, [])

  /* ---------------- editor ---------------- */

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false, autolink: true },
      }),
      RichImage.configure({ HTMLAttributes: { class: 'post-img' } }),
      Placeholder.configure({ placeholder: "Type '/' for commands, or just start writing…" }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Youtube.configure({ controls: true, nocookie: true }),
      CharacterCount,
      Typography,
    ],
    content: '',
    onUpdate: ({ editor }) => apiRef.current?.updateOverlays(editor),
    onSelectionUpdate: ({ editor }) => apiRef.current?.updateOverlays(editor),
    onBlur: () => {
      setBubble((b) => (b.show ? { ...b, show: false } : b))
      setSlash((s) => (s.open ? { ...s, open: false } : s))
    },
    editorProps: {
      attributes: { class: 'pm-content focus:outline-none px-8 sm:px-12 py-10' },
      handleDrop: (_view, event) => {
        const file = (event as DragEvent).dataTransfer?.files?.[0]
        if (file && file.type.startsWith('image/')) {
          event.preventDefault()
          apiRef.current?.insertImageFile(file)
          return true
        }
        return false
      },
      handlePaste: (_view, event) => {
        const file = event.clipboardData?.files?.[0]
        if (file && file.type.startsWith('image/')) {
          event.preventDefault()
          apiRef.current?.insertImageFile(file)
          return true
        }
        return false
      },
      handleKeyDown: (_view, event) => {
        const api = apiRef.current
        if (!api) return false

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault()
          api.openModal('link')
          return true
        }

        const s = slashRef.current
        if (!s.open) return false
        const items = api.filterSlash(s.query)
        if (!items.length) return false

        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setSlash((p) => ({ ...p, index: (p.index + 1) % items.length }))
          return true
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setSlash((p) => ({ ...p, index: (p.index - 1 + items.length) % items.length }))
          return true
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault()
          api.runSlash(items[Math.min(s.index, items.length - 1)])
          return true
        }
        if (event.key === 'Escape') {
          setSlash((p) => ({ ...p, open: false }))
          return true
        }
        return false
      },
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  /* ---------------- slash items ---------------- */

  const slashItems: SlashItem[] = [
    { title: 'Text', desc: 'Plain paragraph', icon: '¶', keywords: 'paragraph text plain', run: (e) => e.chain().focus().setParagraph().run() },
    { title: 'Heading 1', desc: 'Big section title', icon: 'H1', keywords: 'h1 title heading', run: (e) => e.chain().focus().setHeading({ level: 1 }).run() },
    { title: 'Heading 2', desc: 'Medium section title', icon: 'H2', keywords: 'h2 heading subtitle', run: (e) => e.chain().focus().setHeading({ level: 2 }).run() },
    { title: 'Heading 3', desc: 'Small section title', icon: 'H3', keywords: 'h3 heading', run: (e) => e.chain().focus().setHeading({ level: 3 }).run() },
    { title: 'Bullet list', desc: 'Simple bulleted list', icon: '•', keywords: 'ul unordered list', run: (e) => e.chain().focus().toggleBulletList().run() },
    { title: 'Numbered list', desc: 'Ordered list', icon: '1.', keywords: 'ol ordered list', run: (e) => e.chain().focus().toggleOrderedList().run() },
    { title: 'Task list', desc: 'Checklist with checkboxes', icon: '☑', keywords: 'todo checklist task', run: (e) => e.chain().focus().toggleTaskList().run() },
    { title: 'Quote', desc: 'Highlight a quotation', icon: '❝', keywords: 'blockquote quote', run: (e) => e.chain().focus().toggleBlockquote().run() },
    { title: 'Code block', desc: 'Monospaced code', icon: '{ }', keywords: 'code snippet pre', run: (e) => e.chain().focus().toggleCodeBlock().run() },
    { title: 'Divider', desc: 'Horizontal line', icon: '―', keywords: 'hr line separator divider', run: (e) => e.chain().focus().setHorizontalRule().run() },
    { title: 'Table', desc: '3 × 3 table', icon: '▦', keywords: 'table grid', run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { title: 'Image', desc: 'Upload from your device', icon: '🖼', keywords: 'image photo picture upload', run: () => addImage() },
    { title: 'Image from URL', desc: 'Paste an image link', icon: '🌐', keywords: 'image url link', run: () => openModal('image') },
    { title: 'YouTube', desc: 'Embed a video', icon: '▶', keywords: 'video youtube embed', run: () => openModal('youtube') },
  ]

  const filterSlash = (q: string) => {
    const s = q.toLowerCase()
    return slashItems.filter((i) => (i.title + ' ' + i.keywords).toLowerCase().includes(s))
  }

  const runSlash = (item: SlashItem) => {
    const ed = editorRef.current
    if (!ed) return
    const { from } = ed.state.selection
    const q = slashRef.current.query
    ed.chain().focus().deleteRange({ from: from - q.length - 1, to: from }).run()
    item.run(ed)
    setSlash((s) => ({ ...s, open: false }))
  }

  /* ---------------- modals ---------------- */

  const openModal = (type: 'link' | 'image' | 'youtube' | 'alt') => {
    const ed = editorRef.current
    if (!ed) return
    const base = { type, url: '', text: '', alt: '', newTab: true, nofollow: false, needsText: false }
    if (type === 'link') {
      const attrs = ed.getAttributes('link')
      const hasSel = !ed.state.selection.empty
      setModal({
        ...base,
        url: attrs.href || 'https://',
        newTab: attrs.href ? attrs.target === '_blank' : true,
        nofollow: (attrs.rel || '').includes('nofollow'),
        needsText: !hasSel && !ed.isActive('link'),
      })
    } else if (type === 'alt') {
      setModal({ ...base, alt: ed.getAttributes('image').alt || '' })
    } else {
      setModal(base)
    }
  }

  const normalizeUrl = (u: string) => (/^(https?:|mailto:|tel:|\/|#)/i.test(u) ? u : 'https://' + u)

  const submitModal = (e: React.FormEvent) => {
    e.preventDefault()
    const ed = editorRef.current
    const m = modal
    if (!ed || !m) return

    if (m.type === 'link') {
      const url = m.url.trim()
      if (!url || url === 'https://') {
        ed.chain().focus().extendMarkRange('link').unsetLink().run()
      } else {
        const attrs = {
          href: normalizeUrl(url),
          target: m.newTab ? '_blank' : null,
          rel: m.nofollow ? 'noopener noreferrer nofollow' : 'noopener noreferrer',
        }
        if (m.needsText) {
          ed.chain().focus().insertContent({ type: 'text', text: m.text || url, marks: [{ type: 'link', attrs }] }).run()
        } else {
          ed.chain().focus().extendMarkRange('link').setLink(attrs).run()
        }
      }
    } else if (m.type === 'image') {
      if (m.url.trim()) ed.chain().focus().setImage({ src: m.url.trim(), alt: m.alt }).run()
    } else if (m.type === 'youtube') {
      if (m.url.trim()) ed.chain().focus().setYoutubeVideo({ src: m.url.trim(), width: 640, height: 360 }).run()
    } else if (m.type === 'alt') {
      ed.chain().focus().updateAttributes('image', { alt: m.alt }).run()
    }
    setModal(null)
  }

  /* ---------------- draft autosave ---------------- */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const d = JSON.parse(raw)
      if (d && (d.title || (d.content && d.content !== '<p></p>'))) setPendingDraft(d)
    } catch {}
  }, [])

  const restoreDraft = () => {
    const d = pendingDraft
    if (!d || !editor) return
    setTitle(d.title || '')
    setSlug(d.slug || '')
    setSlugEdited(!!d.slug)
    setExcerpt(d.excerpt || '')
    setCoverImage(d.coverImage || '')
    setCoverAlt(d.coverAlt || '')
    setCategory(d.category || 'Uncategorized')
    setTagList(d.tagList || [])
    setMetaTitle(d.metaTitle || '')
    setMetaDescription(d.metaDescription || '')
    if (d.content) editor.commands.setContent(d.content)
    setPendingDraft(null)
  }

  const discardDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setPendingDraft(null)
  }

  useEffect(() => {
    if (!editor || pendingDraft) return
    const t = setInterval(() => {
      try {
        if (!title && editor.isEmpty) return
        const content = mode === 'html' ? htmlSource : editor.getHTML()
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ title, slug, excerpt, coverImage, coverAlt, category, tagList, metaTitle, metaDescription, content })
        )
        setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      } catch {}
    }, 5000)
    return () => clearInterval(t)
  }, [editor, pendingDraft, title, slug, excerpt, coverImage, coverAlt, category, tagList, metaTitle, metaDescription, mode, htmlSource])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (leaveOk.current) return
      if (title || (editorRef.current && !editorRef.current.isEmpty)) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [title])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(t)
  }, [toast])

  // keep floating UI aligned while scrolling / resizing
  useEffect(() => {
    const fn = () => {
      if (editorRef.current) apiRef.current?.updateOverlays(editorRef.current)
    }
    window.addEventListener('scroll', fn, true)
    window.addEventListener('resize', fn)
    return () => {
      window.removeEventListener('scroll', fn, true)
      window.removeEventListener('resize', fn)
    }
  }, [])

  // Ctrl/Cmd + S
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        apiRef.current?.save('draft')
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  /* ---------------- form helpers ---------------- */

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slugEdited) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
      setSlugStatus('idle')
    }
  }

  const checkSlug = async () => {
    if (!slug) return
    setSlugStatus('checking')
    const { data } = await supabase.from('posts').select('id').eq('slug', slug).limit(1)
    setSlugStatus(data && data.length ? 'taken' : 'ok')
  }

  const addTag = (raw: string) => {
    const t = raw.trim().replace(/,$/, '').trim()
    if (t && !tagList.includes(t) && tagList.length < 12) setTagList([...tagList, t])
    setTagInput('')
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadImage(file)
    if (url) setCoverImage(url)
  }

  const handleCoverDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const url = await uploadImage(file)
      if (url) setCoverImage(url)
    }
  }

  const switchMode = (next: Mode) => {
    if (!editor || next === mode) return
    if (mode === 'html') editor.commands.setContent(htmlSource)
    if (next === 'html') setHtmlSource(editor.getHTML())
    setMode(next)
  }

  const generateExcerpt = () => {
    if (!editor) return
    const text = editor.getText().replace(/\s+/g, ' ').trim()
    if (!text) return
    let cut = text.slice(0, 160)
    if (text.length > 160) cut = cut.slice(0, cut.lastIndexOf(' ')) + '…'
    setExcerpt(cut)
  }

  const save = async (status: 'draft' | 'published') => {
    if (!editor) return
    if (!title.trim()) {
      setToast({ type: 'error', text: 'Please add a title first' })
      return
    }
    if (!slug.trim()) {
      setToast({ type: 'error', text: 'Please add a permalink' })
      return
    }
    if (slugStatus === 'taken') {
      setToast({ type: 'error', text: 'That permalink is already used. Please change it.' })
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setToast({ type: 'error', text: 'You must be logged in' })
      setLoading(false)
      return
    }

    const content = mode === 'html' ? htmlSource : editor.getHTML()
    const publishedAt =
      status === 'published' ? (publishDate ? new Date(publishDate).toISOString() : new Date().toISOString()) : null

    const { error } = await supabase.from('posts').insert({
      title,
      slug,
      excerpt,
      content,
      cover_image: coverImage || null,
      cover_alt: coverAlt || null,
      category,
      tags: tagList,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      allow_comments: allowComments,
      status,
      author_id: user.id,
      published_at: publishedAt,
    })

    if (error) {
      setToast({ type: 'error', text: error.message })
      setLoading(false)
      return
    }

    leaveOk.current = true
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setToast({ type: 'success', text: status === 'published' ? 'Post published!' : 'Draft saved!' })
    setTimeout(() => {
      router.push('/dashboard/posts')
      router.refresh()
    }, 900)
  }

  // expose latest closures to editor handlers
  apiRef.current = { filterSlash, runSlash, openModal, insertImageFile, updateOverlays, save }

  if (!editor) return null

  /* ---------------- derived data ---------------- */

  const storage = (editor.storage as any).characterCount
  const words: number = storage.words()
  const chars: number = storage.characters()
  const readMins = Math.max(1, Math.round(words / 200))

  const headings: { level: number; text: string; pos: number }[] = []
  let images = 0
  let imagesNoAlt = 0
  let links = 0
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') headings.push({ level: node.attrs.level, text: node.textContent, pos })
    if (node.type.name === 'image') {
      images++
      if (!node.attrs.alt) imagesNoAlt++
    }
    if (node.isText && node.marks.some((m) => m.type.name === 'link')) links++
    return true
  })

  const descLen = (metaDescription || excerpt).length
  const checks = [
    { ok: title.length >= 20 && title.length <= 70, label: 'Title is 20–70 characters', hint: `${title.length} now` },
    { ok: descLen >= 70 && descLen <= 160, label: 'Description is 70–160 characters', hint: `${descLen} now` },
    { ok: !!coverImage, label: 'Has a featured image', hint: '' },
    { ok: words >= 300, label: 'At least 300 words', hint: `${words} now` },
    { ok: headings.some((h) => h.level === 2), label: 'Uses at least one H2 heading', hint: '' },
    { ok: images === 0 || imagesNoAlt === 0, label: 'All images have alt text', hint: imagesNoAlt ? `${imagesNoAlt} missing` : '' },
    { ok: links > 0, label: 'Contains at least one link', hint: '' },
    { ok: !!slug && slug.length <= 60, label: 'Short, clean permalink', hint: `${slug.length} chars` },
  ]
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100)
  const scoreColor = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'

  const scheduled = !!publishDate && new Date(publishDate) > new Date()
  const slashFiltered = filterSlash(slash.query)
  const slashIndex = Math.min(slash.index, Math.max(0, slashFiltered.length - 1))

  const chain = () => editor.chain().focus() as any

  /* ---------------- render ---------------- */

  return (
    <div
      className={`studio min-h-screen bg-[#f4f5f7] ${fullscreen ? 'fixed inset-0 z-50 overflow-auto' : ''}`}
      style={{ colorScheme: 'light' }}
    >
      <style>{`
        .studio{color:#111827}
        .studio input,.studio textarea,.studio select{color:#111827;background-color:#fff;color-scheme:light}
        .studio input::placeholder,.studio textarea::placeholder{color:#9ca3af;opacity:1}
        .studio .bare{background:transparent !important}
        .studio input[type=checkbox]{accent-color:#111827}

        .pm-content{color:#1f2937;font-size:1.0625rem;line-height:1.8}
        .pm-content > *:first-child{margin-top:0}
        .pm-content h1{font-size:2.25rem;line-height:1.2;font-weight:800;margin:2rem 0 1rem;color:#111827}
        .pm-content h2{font-size:1.75rem;line-height:1.25;font-weight:700;margin:1.8rem 0 .9rem;color:#111827}
        .pm-content h3{font-size:1.4rem;line-height:1.3;font-weight:700;margin:1.5rem 0 .75rem;color:#111827}
        .pm-content h4{font-size:1.15rem;font-weight:700;margin:1.3rem 0 .6rem;color:#111827}
        .pm-content p{margin:0 0 1.1rem}
        .pm-content ul{list-style:disc;padding-left:1.6rem;margin:0 0 1.1rem}
        .pm-content ol{list-style:decimal;padding-left:1.6rem;margin:0 0 1.1rem}
        .pm-content li p{margin:.2rem 0}
        .pm-content blockquote{border-left:4px solid #111827;padding:.25rem 0 .25rem 1.1rem;margin:1.5rem 0;color:#4b5563;font-style:italic}
        .pm-content code{background:#f3f4f6;color:#be123c;padding:.15rem .4rem;border-radius:6px;font-size:.9em}
        .pm-content pre{background:#111827;color:#f9fafb;padding:1rem 1.2rem;border-radius:12px;overflow-x:auto;margin:1.5rem 0}
        .pm-content pre code{background:none;color:inherit;padding:0}
        .pm-content hr{border:0;border-top:1px solid #e5e7eb;margin:2rem 0}
        .pm-content a{color:#2563eb;text-decoration:underline;text-underline-offset:2px}
        .pm-content mark{border-radius:3px;padding:0 2px}
        .pm-content img{max-width:100%;height:auto;border-radius:12px;margin-top:1.5rem;margin-bottom:1.5rem}
        .pm-content img.ProseMirror-selectednode{outline:3px solid #2563eb;outline-offset:2px}
        .pm-content iframe,.pm-content div[data-youtube-video] iframe{width:100%;aspect-ratio:16/9;height:auto;border-radius:12px;margin:1.5rem 0}
        .pm-content div[data-youtube-video]{width:100%}
        .pm-content table{border-collapse:collapse;table-layout:fixed;width:100%;margin:1.5rem 0;overflow:hidden}
        .pm-content td,.pm-content th{border:1px solid #d1d5db;padding:8px 10px;vertical-align:top;position:relative;min-width:1em}
        .pm-content th{background:#f3f4f6;font-weight:600;text-align:left}
        .pm-content .selectedCell:after{content:'';position:absolute;inset:0;background:rgba(37,99,235,.14);pointer-events:none}
        .pm-content .column-resize-handle{position:absolute;right:-2px;top:0;bottom:-2px;width:4px;background:#2563eb;pointer-events:none}
        .pm-content ul[data-type="taskList"]{list-style:none;padding:0}
        .pm-content ul[data-type="taskList"] li{display:flex;gap:.55rem;align-items:flex-start}
        .pm-content ul[data-type="taskList"] li>label{margin-top:.45rem}
        .pm-content ul[data-type="taskList"] li>div{flex:1}
        .ProseMirror{outline:none;min-height:560px;caret-color:#111827}
        .ProseMirror p.is-editor-empty:first-child::before{content:attr(data-placeholder);float:left;color:#9ca3af;pointer-events:none;height:0}
      `}</style>

      {/* ---------------- Header ---------------- */}
      <header className="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <NextLink href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
              ← Back
            </NextLink>
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">Draft</span>
              <span className="text-xs text-gray-500 truncate">
                {savedAt ? `Autosaved ${savedAt}` : 'Not saved yet'} · {words} words
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFullscreen((f) => !f)}
              className="px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Fullscreen"
            >
              {fullscreen ? '⤡' : '⤢'}
            </button>
            <button
              type="button"
              onClick={() => save('draft')}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              title="Ctrl+S"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => save('published')}
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50"
            >
              {loading ? 'Saving…' : scheduled ? 'Schedule' : 'Publish'}
            </button>
          </div>
        </div>
      </header>

      {/* Restore banner */}
      {pendingDraft && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl px-4 py-3 text-sm">
            <span>
              We found an unsaved draft{pendingDraft.title ? `: “${pendingDraft.title}”` : ''}. Restore it?
            </span>
            <div className="flex gap-2">
              <button onClick={restoreDraft} className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-medium">Restore</button>
              <button onClick={discardDraft} className="px-3 py-1.5 border border-blue-300 rounded-lg text-xs font-medium">Discard</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* ---------------- Writing column ---------------- */}
        <div className="min-w-0 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl px-8 sm:px-12 pt-8 pb-5 space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title"
              className="bare w-full text-4xl sm:text-5xl font-extrabold tracking-tight border-none focus:outline-none text-gray-900 placeholder:text-gray-300"
            />
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span className="whitespace-nowrap">Permalink: /blog/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))
                  setSlugEdited(true)
                  setSlugStatus('idle')
                }}
                onBlur={checkSlug}
                className="bare flex-1 min-w-0 border-b border-dashed border-gray-300 focus:outline-none focus:border-gray-900 text-gray-800"
              />
              <span className="text-xs whitespace-nowrap">
                {slugStatus === 'checking' && 'Checking…'}
                {slugStatus === 'ok' && <span className="text-green-600">✓ Available</span>}
                {slugStatus === 'taken' && <span className="text-red-600">Already used</span>}
              </span>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 text-sm">
              {(['write', 'html', 'preview'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`px-4 py-1.5 rounded-lg capitalize transition-colors ${
                    mode === m ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {m === 'write' ? 'Visual' : m === 'html' ? 'HTML' : 'Preview'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              Type <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">/</kbd> for blocks · Ctrl+K link · Ctrl+S save
            </p>
          </div>

          {mode === 'write' && (
            <Toolbar editor={editor} openModal={openModal} onImageUpload={addImage} uploading={uploading} />
          )}

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className={mode === 'write' ? '' : 'hidden'}>
              <EditorContent editor={editor} />
            </div>

            {mode === 'html' && (
              <textarea
                value={htmlSource}
                onChange={(e) => setHtmlSource(e.target.value)}
                spellCheck={false}
                className="w-full min-h-[600px] p-6 font-mono text-sm text-gray-900 bg-white focus:outline-none resize-y"
              />
            )}

            {mode === 'preview' && (
              <article className="max-w-3xl mx-auto px-6 py-12">
                {category && (
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-blue-700 mb-3">
                    {category}
                  </span>
                )}
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
                  {title || 'Untitled post'}
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                  {readMins} min read · {words} words
                </p>
                {coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverImage} alt={coverAlt} className="w-full max-h-[420px] object-cover rounded-2xl mb-8" />
                )}
                <div className="pm-content" dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
                {tagList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-10">
                    {tagList.map((t) => (
                      <span key={t} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">#{t}</span>
                    ))}
                  </div>
                )}
              </article>
            )}

            <div className="flex items-center justify-between px-6 py-2.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
              <span>{words} words · {chars} characters · ~{readMins} min read</span>
              <span>{images} image{images === 1 ? '' : 's'} · {links} link{links === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>

        {/* ---------------- Sidebar ---------------- */}
        <aside className="space-y-4 xl:sticky xl:top-[76px] self-start xl:max-h-[calc(100vh-92px)] xl:overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-1 flex text-sm">
            {([['post', 'Post'], ['seo', 'SEO'], ['outline', 'Outline']] as [SideTab, string][]).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`flex-1 py-1.5 rounded-xl transition-colors ${
                  tab === k ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {l}
                {k === 'seo' && <span className="ml-1.5 text-[10px] opacity-70">{score}%</span>}
              </button>
            ))}
          </div>

          {tab === 'post' && (
            <>
              <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Featured image</h3>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleCoverDrop}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-2 text-center hover:border-gray-400 transition"
                >
                  {coverImage ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverImage} alt={coverAlt || 'Cover'} className="w-full h-40 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="absolute top-2 right-2 bg-black/75 text-white text-xs px-2.5 py-1 rounded-full"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="py-6">
                      <p className="text-gray-500 text-xs mb-3">Drag & drop an image here</p>
                      <label className="inline-flex items-center px-3 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        {uploading ? 'Uploading…' : 'Choose image'}
                        <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>
                {coverImage && (
                  <input
                    type="text"
                    value={coverAlt}
                    onChange={(e) => setCoverAlt(e.target.value)}
                    placeholder="Describe the image (alt text)"
                    className={field}
                  />
                )}
              </section>

              <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Publishing</h3>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Publish date (leave empty for now)</label>
                  <input type="datetime-local" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className={field} />
                  {scheduled && <p className="text-xs text-amber-700 mt-1">Will be scheduled for a future date.</p>}
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} />
                  Allow comments
                </label>
              </section>

              <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Category & tags</h3>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <div className="flex flex-wrap items-center gap-1.5 border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus-within:ring-2 focus-within:ring-gray-900">
                  {tagList.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {t}
                      <button type="button" onClick={() => setTagList(tagList.filter((x) => x !== t))} className="text-gray-500 hover:text-gray-900">×</button>
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
                      if (e.key === 'Backspace' && !tagInput && tagList.length) setTagList(tagList.slice(0, -1))
                    }}
                    onBlur={() => tagInput && addTag(tagInput)}
                    placeholder={tagList.length ? '' : 'Add tags, press Enter'}
                    className="bare flex-1 min-w-[90px] text-sm focus:outline-none py-0.5"
                  />
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Excerpt</h3>
                  <button type="button" onClick={generateExcerpt} className="text-xs text-blue-700 hover:underline">
                    Auto-generate
                  </button>
                </div>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={4}
                  placeholder="Short summary shown on the blog listing…"
                  className={`${field} resize-none`}
                />
                <p className="text-xs text-gray-400 text-right">{excerpt.length} characters</p>
              </section>
            </>
          )}

          {tab === 'seo' && (
            <>
              <section className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Post health</h3>
                  <span className="text-sm font-semibold text-gray-900">{score}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
                  <div className={`h-full ${scoreColor} transition-all`} style={{ width: `${score}%` }} />
                </div>
                <ul className="space-y-1.5">
                  {checks.map((c) => (
                    <li key={c.label} className="flex items-start gap-2 text-sm">
                      <span className={c.ok ? 'text-green-600' : 'text-gray-300'}>{c.ok ? '✓' : '○'}</span>
                      <span className={c.ok ? 'text-gray-700' : 'text-gray-900'}>
                        {c.label}
                        {!c.ok && c.hint && <span className="text-gray-400"> ({c.hint})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Search appearance</h3>
                <div>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={title || 'Meta title'}
                    className={field}
                  />
                  <p className={`text-xs mt-1 ${metaTitle.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>{metaTitle.length}/60</p>
                </div>
                <div>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={3}
                    placeholder="Meta description"
                    className={`${field} resize-none`}
                  />
                  <p className={`text-xs mt-1 ${metaDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>{metaDescription.length}/160</p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                  <p className="text-[#1a0dab] text-base leading-snug truncate">{metaTitle || title || 'Post title'}</p>
                  <p className="text-green-700 text-xs truncate">yoursite.com › blog › {slug || 'post-slug'}</p>
                  <p className="text-gray-600 text-sm line-clamp-2 mt-0.5">{metaDescription || excerpt || 'Your description will appear here…'}</p>
                </div>
              </section>
            </>
          )}

          {tab === 'outline' && (
            <section className="bg-white border border-gray-200 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Document outline</h3>
              {headings.length === 0 ? (
                <p className="text-sm text-gray-500">Add headings to see the structure of your post here.</p>
              ) : (
                <ul className="space-y-1">
                  {headings.map((h, i) => (
                    <li key={i} style={{ paddingLeft: (h.level - 1) * 14 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('write')
                          chain().setTextSelection(h.pos + 1).scrollIntoView().run()
                        }}
                        className="text-left text-sm text-gray-800 hover:text-blue-700 hover:underline w-full truncate"
                      >
                        <span className="text-[10px] text-gray-400 mr-1.5">H{h.level}</span>
                        {h.text || 'Untitled heading'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </aside>
      </main>

      {/* ---------------- Floating selection toolbar ---------------- */}
      {mode === 'write' && bubble.show && (
        <div
          className="fixed z-40 bg-gray-900 text-white rounded-xl shadow-2xl px-1.5 py-1 flex items-center gap-0.5"
          style={{
            top: bubble.top,
            left: Math.min(Math.max(bubble.left, 190), (typeof window !== 'undefined' ? window.innerWidth : 1200) - 190),
            transform: 'translateX(-50%)',
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {bubble.kind === 'text' ? (
            <>
              {[
                { t: 'Bold', l: <b>B</b>, a: editor.isActive('bold'), f: () => chain().toggleBold().run() },
                { t: 'Italic', l: <i>I</i>, a: editor.isActive('italic'), f: () => chain().toggleItalic().run() },
                { t: 'Underline', l: <u>U</u>, a: editor.isActive('underline'), f: () => chain().toggleUnderline().run() },
                { t: 'Strike', l: <s>S</s>, a: editor.isActive('strike'), f: () => chain().toggleStrike().run() },
                { t: 'Link', l: '🔗', a: editor.isActive('link'), f: () => openModal('link') },
                { t: 'Highlight', l: '🖍', a: editor.isActive('highlight'), f: () => chain().toggleHighlight({ color: '#fef08a' }).run() },
                { t: 'Heading 2', l: 'H2', a: editor.isActive('heading', { level: 2 }), f: () => chain().toggleHeading({ level: 2 }).run() },
                { t: 'Heading 3', l: 'H3', a: editor.isActive('heading', { level: 3 }), f: () => chain().toggleHeading({ level: 3 }).run() },
                { t: 'Quote', l: '❝', a: editor.isActive('blockquote'), f: () => chain().toggleBlockquote().run() },
                { t: 'Code', l: '</>', a: editor.isActive('code'), f: () => chain().toggleCode().run() },
              ].map((b) => (
                <button
                  key={b.t}
                  type="button"
                  title={b.t}
                  onClick={b.f}
                  className={`px-2 py-1 text-sm rounded-md min-w-[28px] ${b.a ? 'bg-white text-gray-900' : 'hover:bg-white/15'}`}
                >
                  {b.l}
                </button>
              ))}
            </>
          ) : (
            <>
              {['25%', '50%', '75%', '100%'].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => chain().updateAttributes('image', { width: w }).run()}
                  className={`px-2 py-1 text-xs rounded-md ${editor.getAttributes('image').width === w ? 'bg-white text-gray-900' : 'hover:bg-white/15'}`}
                >
                  {w}
                </button>
              ))}
              <span className="w-px h-4 bg-white/25 mx-1" />
              {[['left', '⇤'], ['center', '≡'], ['right', '⇥']].map(([a, l]) => (
                <button
                  key={a}
                  type="button"
                  title={`Align ${a}`}
                  onClick={() => chain().updateAttributes('image', { align: a }).run()}
                  className={`px-2 py-1 text-sm rounded-md ${editor.getAttributes('image').align === a ? 'bg-white text-gray-900' : 'hover:bg-white/15'}`}
                >
                  {l}
                </button>
              ))}
              <span className="w-px h-4 bg-white/25 mx-1" />
              <button type="button" onClick={() => openModal('alt')} className="px-2 py-1 text-xs rounded-md hover:bg-white/15">
                Alt text
              </button>
              <button type="button" onClick={() => chain().deleteSelection().run()} className="px-2 py-1 text-xs rounded-md hover:bg-red-500/80">
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* ---------------- Slash menu ---------------- */}
      {mode === 'write' && slash.open && slashFiltered.length > 0 && (
        <div
          className="fixed z-40 w-72 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl p-1.5"
          style={{ top: slash.top, left: slash.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <p className="px-2 pt-1 pb-1.5 text-[11px] uppercase tracking-wider text-gray-400">Blocks</p>
          {slashFiltered.map((item, i) => (
            <button
              key={item.title}
              type="button"
              ref={(el) => {
                if (el && i === slashIndex) el.scrollIntoView({ block: 'nearest' })
              }}
              onClick={() => runSlash(item)}
              onMouseEnter={() => setSlash((s) => ({ ...s, index: i }))}
              className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left ${i === slashIndex ? 'bg-gray-100' : ''}`}
            >
              <span className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-800">
                {item.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-900">{item.title}</span>
                <span className="block text-xs text-gray-500 truncate">{item.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ---------------- Modal ---------------- */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={() => setModal(null)}>
          <form
            onSubmit={submitModal}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              {modal.type === 'link' && 'Insert link'}
              {modal.type === 'image' && 'Insert image from URL'}
              {modal.type === 'youtube' && 'Embed YouTube video'}
              {modal.type === 'alt' && 'Image alt text'}
            </h3>

            {modal.type !== 'alt' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {modal.type === 'youtube' ? 'Video URL' : 'URL'}
                </label>
                <input
                  autoFocus
                  type="text"
                  value={modal.url}
                  onChange={(e) => setModal({ ...modal, url: e.target.value })}
                  placeholder={modal.type === 'youtube' ? 'https://youtube.com/watch?v=…' : 'https://'}
                  className={field}
                />
              </div>
            )}

            {modal.type === 'link' && modal.needsText && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Link text</label>
                <input
                  type="text"
                  value={modal.text}
                  onChange={(e) => setModal({ ...modal, text: e.target.value })}
                  placeholder="Text to display"
                  className={field}
                />
              </div>
            )}

            {modal.type === 'link' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input type="checkbox" checked={modal.newTab} onChange={(e) => setModal({ ...modal, newTab: e.target.checked })} />
                  Open in a new tab
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input type="checkbox" checked={modal.nofollow} onChange={(e) => setModal({ ...modal, nofollow: e.target.checked })} />
                  Add rel=“nofollow”
                </label>
              </div>
            )}

            {(modal.type === 'image' || modal.type === 'alt') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Alt text (helps accessibility & SEO)</label>
                <input
                  autoFocus={modal.type === 'alt'}
                  type="text"
                  value={modal.alt}
                  onChange={(e) => setModal({ ...modal, alt: e.target.value })}
                  placeholder="Describe the image"
                  className={field}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {modal.type === 'link' && editor.isActive('link') ? (
                <button
                  type="button"
                  onClick={() => {
                    chain().extendMarkRange('link').unsetLink().run()
                    setModal(null)
                  }}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove link
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-black">
                  {modal.type === 'alt' ? 'Save' : 'Insert'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ---------------- Toast ---------------- */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}