import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Tag } from 'lucide-react'
import Navbar from '../components/Navbar'
import { sanityClient, urlForImage } from '../lib/sanity'
import Footer from '../components/footer'

const CATEGORIES = ['All', 'Marketing', 'Analytics', 'Tips & Tricks', 'Product']

const CATEGORY_COLORS = {
  Marketing: 'bg-indigo-50 text-indigo-600',
  Analytics: 'bg-orange-50 text-orange-600',
  'Tips & Tricks': 'bg-violet-50 text-violet-600',
  Product: 'bg-green-50 text-green-600',
}

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    sanityClient.fetch(`*[_type == "post"] | order(date desc)`)
      .then((data) => {
        setPosts(data);
        const imagesToLoad = data.map(p => p.coverImage ? urlForImage(p.coverImage) : null).filter(Boolean);
        if (imagesToLoad.length === 0) {
          setIsLoading(false);
          return;
        }
        let loadedCount = 0;
        imagesToLoad.forEach(src => {
          const img = new Image();
          img.src = src;
          img.onload = img.onerror = () => {
            loadedCount++;
            if (loadedCount === imagesToLoad.length) {
              setIsLoading(false);
            }
          };
        });
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const featured = posts.find(p => p.featured)
  const filtered = posts.filter(p =>
    !p.featured &&
    (activeCategory === 'All' || p.category === activeCategory)
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3" />
          <div className="text-slate-500 text-sm font-medium">
            Loading blog posts...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      <main id="main">
      {/* Hero */}
      <section className="pt-24 sm:pt-28 md:pt-36 pb-10 sm:pb-14 px-5 sm:px-6 text-center border-b border-slate-100">
        <div className="max-w-2xl mx-auto">
          <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-semibold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-5 sm:mb-6">
            The Curtio Blog
          </span>
          <h1 className="text-[clamp(1.95rem,8vw,3.6rem)] font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-3 sm:mb-4">
            Insights on links, analytics & growth
          </h1>
          <p className="text-[0.95rem] sm:text-base md:text-lg text-slate-500 max-w-md sm:max-w-none mx-auto leading-relaxed text-justify sm:text-center">
            Practical guides and ideas for marketers, developers, and builders who care about their links.
          </p>
        </div>
      </section>

      <div className="max-w-[1152px] mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <>
          {/* Featured post */}
            {featured && (activeCategory === 'All') && (
              <Link
                to={`/blog/${featured.slug.current}`}
                className="group block mb-10 sm:mb-14 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="h-44 sm:h-52 relative flex items-end p-6 sm:p-8 overflow-hidden bg-slate-100">
                  {featured.coverImage ? (
                    <img
                      src={urlForImage(featured.coverImage)}
                      alt={featured.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${featured.coverColor}`} />
                  )}
                  {featured.coverImage && <div className="absolute inset-0 bg-slate-900/35" />}

                  <span className="absolute top-5 left-5 bg-white/20 backdrop-blur text-white text-xs font-semibold px-3 py-1 rounded-full z-10">
                    Featured
                  </span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-white/90 z-10 ${CATEGORY_COLORS[featured.category] || 'text-slate-600'}`}>
                    {featured.category}
                  </span>
                </div>
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors mb-3">
                    {featured.title}
                  </h2>
                  <p className="text-slate-500 text-[0.95rem] md:text-base leading-relaxed mb-5 max-w-2xl">
                    {featured.excerpt}
                  </p>
                  <div className="flex flex-col md:flex-row md:items-center  justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-sm">
                        {featured.author.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{featured.author.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Clock size={11} /> {featured.readTime} · {featured.date}
                        </div>
                      </div>
                    </div>
                    <span className="flex item-center justify-center  pt-4 md:pt-0 gap-1.5 text-sm font-semibold text-indigo-600 group-hover:gap-2.5 transition-all">
                      Read article <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Category filter */}
            <div className="flex items-center gap-2 flex-wrap mb-8 sm:mb-10">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-sm font-medium px-3.5 sm:px-4 py-1.5 rounded-full border transition-all ${activeCategory === cat
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Post grid */}
            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
              {filtered.map(post => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug.current}`}
                  className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="h-32 relative overflow-hidden bg-slate-100">
                    {post.coverImage ? (
                      <img
                        src={urlForImage(post.coverImage)}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${post.coverColor}`} />
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] || 'bg-slate-100 text-slate-600'}`}>
                        {post.category}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {post.readTime}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-indigo-600 transition-colors mb-2">
                      {post.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-xs">
                        {post.author.avatar}
                      </div>
                      <div className="text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{post.author.name}</span> · {post.date}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 sm:py-20 text-slate-400 text-sm">
                No posts in this category yet.
              </div>
            )}
          </>
      </div>
      </main>

      <Footer />
    </div>
  )
}
