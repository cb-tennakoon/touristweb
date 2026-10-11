import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ================= NAVBAR ================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold tracking-tight text-gray-900">
              Tourist<span className="text-emerald-600">Web</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="/destinations" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                Destinations
              </Link>
              <Link href="/experiences" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                Experiences
              </Link>
              <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                Blog
              </Link>
              <Link href="/authors" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                Authors
              </Link>
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                About
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign in
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Explore the world with us
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
                Discover Amazing
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                  Destinations
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-600 max-w-lg leading-relaxed">
                Find hidden gems, unique experiences, and inspiring travel stories from around the world. Plan your next adventure with confidence.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/destinations"
                  className="inline-flex items-center px-6 py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition shadow-lg shadow-gray-900/20"
                >
                  Explore Destinations
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center px-6 py-3.5 bg-white text-gray-900 text-sm font-semibold rounded-full border border-gray-200 hover:bg-gray-50 transition"
                >
                  Read Travel Stories
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white"
                    />
                  ))}
                </div>
                <p>
                  <span className="font-semibold text-gray-900">2,400+</span> travelers joined this month
                </p>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070')] bg-cover bg-center" />
                
                <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
                  <p className="text-sm font-medium text-white/80">Featured Destination</p>
                  <h3 className="text-2xl font-bold mt-1">Swiss Alps</h3>
                  <p className="text-sm text-white/70 mt-1">Switzerland · Mountain Escape</p>
                </div>
              </div>

              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 max-w-[200px] hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                    4.9
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Top Rated</p>
                    <p className="text-xs text-gray-500">1,200+ reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURED DESTINATIONS ================= */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Popular Destinations</h2>
              <p className="mt-2 text-gray-600">Hand-picked places loved by travelers</p>
            </div>
            <Link
              href="/destinations"
              className="hidden sm:inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View all
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Bali, Indonesia',
                category: 'Beach & Culture',
                image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800',
              },
              {
                title: 'Santorini, Greece',
                category: 'Island Escape',
                image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=800',
              },
              {
                title: 'Kyoto, Japan',
                category: 'Culture & Temples',
                image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800',
              },
              {
                title: 'Cape Town, SA',
                category: 'Nature & City',
                image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?q=80&w=800',
              },
              {
                title: 'Amalfi Coast',
                category: 'Coastal Drive',
                image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?q=80&w=800',
              },
              {
                title: 'Patagonia',
                category: 'Adventure',
                image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a41d8?q=80&w=800',
              },
            ].map((item) => (
              <Link
                key={item.title}
                href="/destinations"
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <p className="text-xs font-medium text-white/80 mb-1">{item.category}</p>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= EXPERIENCES ================= */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Unforgettable Experiences</h2>
            <p className="mt-3 text-gray-600">
              From adventure to relaxation — find activities that match your travel style.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🏔️',
                title: 'Adventure Tours',
                desc: 'Hiking, trekking, and outdoor challenges in the most stunning landscapes.',
              },
              {
                icon: '🍜',
                title: 'Food & Culture',
                desc: 'Local cuisine experiences and cultural immersions with expert guides.',
              },
              {
                icon: '🧘',
                title: 'Wellness Retreats',
                desc: 'Yoga, spa, and mindfulness escapes to recharge your mind and body.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= LATEST BLOGS ================= */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Latest Travel Stories</h2>
              <p className="mt-2 text-gray-600">Inspiration from our community of writers</p>
            </div>
            <Link
              href="/blog"
              className="hidden sm:inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View all posts
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <article
                key={i}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="aspect-[16/10] bg-gray-200" />
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                      Travel
                    </span>
                    <span>·</span>
                    <span>5 min read</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    How to plan the perfect 7-day trip to Bali
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    Discover the best beaches, temples, and local food spots for an unforgettable journey.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-500 p-10 sm:p-14 text-center text-white">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2070')] bg-cover bg-center opacity-20" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready for your next adventure?
              </h2>
              <p className="text-lg text-white/90 max-w-xl mx-auto mb-8">
                Join thousands of travelers who discover new places and share their stories every day.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/destinations"
                  className="inline-flex items-center px-6 py-3.5 bg-white text-emerald-700 text-sm font-semibold rounded-full hover:bg-gray-100 transition"
                >
                  Explore Destinations
                </Link>
                <Link
                  href="/dashboard/new"
                  className="inline-flex items-center px-6 py-3.5 bg-emerald-800/50 text-white text-sm font-semibold rounded-full border border-white/30 hover:bg-emerald-800/70 transition"
                >
                  Share Your Story
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Tourist<span className="text-emerald-600">Web</span>
              </Link>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                Discover destinations, experiences, and travel stories from around the world.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Explore</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/destinations" className="hover:text-gray-900">Destinations</Link></li>
                <li><Link href="/experiences" className="hover:text-gray-900">Experiences</Link></li>
                <li><Link href="/blog" className="hover:text-gray-900">Blog</Link></li>
                <li><Link href="/authors" className="hover:text-gray-900">Authors</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/about" className="hover:text-gray-900">About</Link></li>
                <li><Link href="/contact" className="hover:text-gray-900">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-gray-900">Privacy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Get Started</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/login" className="hover:text-gray-900">Sign in</Link></li>
                <li><Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link></li>
                <li><Link href="/dashboard/new" className="hover:text-gray-900">Write a Post</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} TouristWeb. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="#" className="hover:text-gray-900">Twitter</Link>
              <Link href="#" className="hover:text-gray-900">Instagram</Link>
              <Link href="#" className="hover:text-gray-900">YouTube</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}