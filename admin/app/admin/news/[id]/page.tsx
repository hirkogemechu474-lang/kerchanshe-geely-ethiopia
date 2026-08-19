"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Calendar, User, Eye, Tag, Edit, Trash2, ArrowLeft, Globe, Save, ImageIcon } from "lucide-react";
import Link from "next/link";
import { Card, Button, Badge, type Tone } from "@/components/admin/ui";

interface NewsArticle {
  id: string;
  title: string;
  category: string;
  author: string;
  content: string;
  imageUrl: string | null;
  excerpt: string | null;
  status: string;
  publishDate: string | null;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const [editData, setEditData] = useState({
    title: '',
    category: 'company',
    content: '',
    author: '',
    image: '',
    excerpt: '',
    status: 'draft',
    publishDate: '',
  });

  useEffect(() => {
    fetchArticle();
  }, [id]);

  async function fetchArticle() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/news/${id}`);
      
      if (response.status === 404) {
        setError("News article not found");
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch news article");
      }
      
      const data = await response.json();
      setArticle(data);
      
      const publishDate = data.publishDate 
        ? new Date(data.publishDate).toISOString().slice(0, 16)
        : '';

      setEditData({
        title: data.title || '',
        category: data.category || 'company',
        content: data.content || '',
        author: data.author || '',
        image: data.imageUrl || '',
        excerpt: data.excerpt || '',
        status: data.status || 'draft',
        publishDate: publishDate,
      });

      if (data.imageUrl) {
        setImagePreview(data.imageUrl);
      }
    } catch (err) {
      console.error("Error fetching news article:", err);
      setError("Failed to load news article");
    } finally {
      setLoading(false);
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'news');

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setEditData(prev => ({ ...prev, image: data.url }));
      setImagePreview(data.url);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    }
  };
  const handleSave = async () => {
    if (!editData.title || !editData.category || !editData.content || !editData.author) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          imageUrl: editData.image,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update news article');
      }

      await fetchArticle();
      setEditing(false);
      setError('');
      alert('Article updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update news article');
    } finally {
      setSaving(false);
    }
  };

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this news article? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/news/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete article");
      }

      alert("News article deleted successfully");
      router.push("/admin/news");
    } catch (err) {
      console.error("Error deleting article:", err);
      alert("Failed to delete news article");
    } finally {
      setDeleting(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };
  function getStatusColor(status: string) {
    switch (status) {
      case "published": return "bg-green-100 text-green-700";
      case "draft": return "bg-gray-100 text-gray-700";
      case "scheduled": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case "Launch": return "bg-purple-100 text-purple-700";
      case "News": return "bg-blue-100 text-blue-700";
      case "Events": return "bg-green-100 text-green-700";
      case "Updates": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-geely-blue border-t-transparent mb-4"></div>
            <p className="text-steel">Loading news article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg border border-line p-12 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-navy mb-2">
            {error || "News Article Not Found"}
          </h2>
          <p className="text-steel mb-6">
            {error === "News article not found" 
              ? "The news article you're looking for doesn't exist or has been deleted."
              : "There was an error loading the news article."}
          </p>
          <Link
            href="/admin/news"
            className="inline-flex items-center gap-2 bg-geely-blue text-white font-semibold px-6 py-3 rounded hover:bg-opacity-90 transition-all"
          >
            <ArrowLeft size={18} />
            Back to News
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/news"
            className="inline-flex items-center gap-2 text-steel hover:text-navy font-semibold mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to News
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-navy mb-2">
                {editing ? 'Edit News Article' : 'News Article Details'}
              </h1>
              <p className="text-steel">
                {editing ? 'Update article information' : 'View and manage news article'}
              </p>
            </div>
            <div className="flex gap-3">
              {editing ? (
                <>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setError('');
                      fetchArticle();
                    }}
                    className="flex items-center gap-2 bg-gray-500 text-white font-semibold px-6 py-3 rounded hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-3 rounded hover:bg-green-700 transition-all disabled:opacity-50"
                  >
                    <Save size={18} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 bg-geely-blue text-white font-semibold px-6 py-3 rounded hover:bg-blue-700 transition-all"
                  >
                    <Edit size={18} />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 bg-red-500 text-white font-semibold px-6 py-3 rounded hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {editing ? (
              /* Edit Form */
              <div className="bg-white rounded-lg border border-line p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={editData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category and Author */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={editData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="company">Company News</option>
                      <option value="product">Product Updates</option>
                      <option value="technology">Technology</option>
                      <option value="events">Events</option>
                      <option value="awards">Awards & Recognition</option>
                      <option value="community">Community</option>
                      <option value="press">Press Release</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Author *
                    </label>
                    <input
                      type="text"
                      name="author"
                      value={editData.author}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Excerpt
                  </label>
                  <textarea
                    name="excerpt"
                    value={editData.excerpt}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief summary (optional)"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Article Content *
                  </label>
                  <textarea
                    name="content"
                    value={editData.content}
                    onChange={handleChange}
                    required
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="w-4 h-4 inline mr-2" />
                    Featured Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  {(editData.image || imagePreview) && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-600 mb-2">Current image:</p>
                      <img
                        src={imagePreview || editData.image}
                        alt="Preview"
                        className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
                {/* Status and Publish Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publication Status *
                    </label>
                    <select
                      name="status"
                      value={editData.status}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Publish Date
                    </label>
                    <input
                      type="datetime-local"
                      name="publishDate"
                      value={editData.publishDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="bg-white rounded-lg border border-line overflow-hidden">
                <div className="p-6">
                  {/* Featured Image */}
                  {article.imageUrl && (
                    <div className="mb-6">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-64 object-cover rounded-lg border border-line"
                      />
                    </div>
                  )}

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-navy mb-4">{article.title}</h2>
                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-line">
                    <div className="flex items-center gap-2 text-sm text-steel">
                      <User size={16} />
                      <span className="font-semibold text-navy">{article.author}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-steel">
                      <Calendar size={16} />
                      <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-steel">
                      <Eye size={16} />
                      <span>{article.views.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Tag size={16} className="text-steel" />
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </span>
                    </div>
                  </div>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-navy mb-3">Excerpt</h3>
                      <p className="text-steel italic">{article.excerpt}</p>
                    </div>
                  )}

                  {/* Content */}
                  <div>
                    <h3 className="text-lg font-bold text-navy mb-3">Article Content</h3>
                    <div 
                      className="prose max-w-none text-steel leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg border border-line p-6">
              <h3 className="text-lg font-bold text-navy mb-4">Publication Status</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-steel block mb-2">Current Status</span>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(article.status)}`}>
                    {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                  </span>
                </div>

                {article.publishDate && (
                  <div>
                    <span className="text-sm text-steel block mb-2">Publish Date</span>
                    <div className="flex items-center gap-2 text-navy">
                      <Calendar size={16} />
                      <span className="font-semibold">
                        {new Date(article.publishDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {article.status === "published" && (
                  <div>
                    <span className="text-sm text-steel block mb-3">Public URL</span>
                    <Link
                      href={`/news/${article.id}`}
                      target="_blank"
                      className="flex items-center gap-2 text-geely-blue hover:text-navy font-semibold text-sm transition-colors"
                    >
                      <Globe size={16} />
                      View on Website
                    </Link>
                  </div>
                )}
              </div>
            </div>
            {/* Metadata Card */}
            <div className="bg-white rounded-lg border border-line p-6">
              <h3 className="text-lg font-bold text-navy mb-4">Metadata</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-line pb-2">
                  <span className="text-steel">Category</span>
                  <span className="font-semibold text-navy">{article.category}</span>
                </div>
                <div className="flex justify-between border-b border-line pb-2">
                  <span className="text-steel">Author</span>
                  <span className="font-semibold text-navy">{article.author}</span>
                </div>
                <div className="flex justify-between border-b border-line pb-2">
                  <span className="text-steel">Views</span>
                  <span className="font-semibold text-navy">{article.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-line pb-2">
                  <span className="text-steel">Created</span>
                  <span className="font-semibold text-navy">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel">Last Updated</span>
                  <span className="font-semibold text-navy">
                    {new Date(article.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
