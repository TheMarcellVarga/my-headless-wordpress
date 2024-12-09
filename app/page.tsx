"use client";
import { useEffect, useState, useCallback } from "react";
import { getPosts } from "@/utils/services/wordpress";
import { WordPressPost } from "@/types/wordpress";
import { useInView } from "react-intersection-observer";
import { useTheme } from "next-themes";
import debounce from "lodash/debounce";

const POSTS_PER_PAGE = 9;

export default function Home() {
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<WordPressPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [page, setPage] = useState(1);
  const { theme, setTheme } = useTheme();
  const { ref, inView } = useInView();

  // Infinite scroll handler
  useEffect(() => {
    if (inView) {
      setPage((prev) => prev + 1);
    }
  }, [inView]);

  // Fetch posts with caching
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        // Check cache first
        const cached = localStorage.getItem("wordpress_posts");
        const cacheTimestamp = localStorage.getItem(
          "wordpress_posts_timestamp"
        );

        if (
          cached &&
          cacheTimestamp &&
          Date.now() - Number(cacheTimestamp) < 5 * 60 * 1000
        ) {
          setPosts(JSON.parse(cached));
          setIsLoading(false);
          return;
        }

        const data = await getPosts();
        setPosts(data);

        // Update cache
        localStorage.setItem("wordpress_posts", JSON.stringify(data));
        localStorage.setItem(
          "wordpress_posts_timestamp",
          Date.now().toString()
        );
      } catch (err) {
        setError("Failed to fetch posts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter and sort posts
  useEffect(() => {
    let filtered = [...posts];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((post) => post.categories?.[selectedCategory]);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return a.title.localeCompare(b.title);
    });

    // Apply pagination
    setDisplayedPosts(filtered.slice(0, page * POSTS_PER_PAGE));
  }, [posts, searchTerm, selectedCategory, sortBy, page]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  // Loading skeleton component
  const Skeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-700" />
      <div className="p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-200 
      ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">My WordPress Posts</h1>
          <p className="text-lg opacity-75">
            Explore the latest articles and updates
          </p>
        </div>

        {/* Controls Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <input
              type="text"
              placeholder="Search posts..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 rounded-md border 
                dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-4">
              <select
                onChange={(e) => setSortBy(e.target.value as "date" | "title")}
                className="px-4 pr-8 py-2 rounded-md border dark:bg-gray-800 dark:border-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7em] bg-no-repeat bg-[right_0.7rem_center]"
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
              </select>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-10 h-10 flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                <span className="text-xl">
                  {theme === "dark" ? "☀️" : "🌙"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading
            ? Array(6)
                .fill(0)
                .map((_, i) => <Skeleton key={i} />)
            : displayedPosts.map((post) => (
                <article
                  key={post.ID}
                  className={`rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full
                  ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
                >
                  {post.featured_image && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="text-xl font-semibold mb-2 hover:text-blue-600 transition-colors duration-200">
                      {post.title}
                    </h2>
                    <div
                      className="opacity-75 mb-4 line-clamp-3 prose dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: post.excerpt }}
                    />
                    <div className="flex justify-between items-center mt-auto pt-4">
                      <span className="text-sm opacity-75">
                        {new Date(post.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <a
                        href={post.URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200"
                      >
                        Read more
                      </a>
                    </div>
                  </div>
                </article>
              ))}
        </div>

        {/* Infinite Scroll Trigger */}
        <div ref={ref} className="h-10 mt-8" />

        {/* Empty State */}
        {!isLoading && displayedPosts.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No posts found</h3>
            <p className="opacity-75">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Loading More Indicator */}
        {!isLoading && inView && displayedPosts.length < posts.length && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}
