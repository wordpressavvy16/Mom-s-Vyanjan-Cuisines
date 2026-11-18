import React from 'react';
import { Link } from 'react-router-dom';

const mockPosts = [
  {
    id: 1,
    title: "The Health Benefits of a Home-Cooked Tiffin",
    excerpt: "Discover why a daily tiffin is not just convenient but also a fantastic choice for your health and well-being. We dive into balanced nutrition, portion control, and the magic of fresh ingredients.",
    date: "August 15, 2024",
    author: "Admin",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=60"
  },
  {
    id: 2,
    title: "5 Spices That Define Authentic Indian Cooking",
    excerpt: "From the warmth of turmeric to the aroma of cumin, explore the essential spices that give our dishes their signature flavors. Learn a little about their history and health benefits.",
    date: "July 28, 2024",
    author: "Admin",
    imageUrl: "https://images.unsplash.com/photo-1598515599465-533421370bac?auto=format&fit=crop&w=500&q=60"
  },
  {
    id: 3,
    title: "Behind the Scenes: A Day in MoM's Vyanjan Kitchen",
    excerpt: "Ever wondered how your delicious tiffin gets made? Take a peek into our kitchen, from the morning sourcing of fresh vegetables to the final loving pack that reaches your door.",
    date: "July 10, 2024",
    author: "Admin",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=60"
  }
];

const BlogPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-light-text dark:text-dark-text">
      <header className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold font-display text-secondary dark:text-accent">From Our Kitchen to Yours</h1>
        <p className="text-lg text-light-muted dark:text-dark-muted mt-2">Stories, tips, and updates from the MoM's Vyanjan family.</p>
      </header>

      <div className="space-y-12">
        {mockPosts.map(post => (
          <article key={post.id} className="group grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-1 overflow-hidden rounded-lg">
              <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover transform transition-transform duration-500 group-hover:scale-110" />
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-light-muted dark:text-dark-muted">{post.date} &bull; by {post.author}</p>
              <h2 className="text-2xl font-semibold font-display mt-1 mb-2">
                <Link to="#" className="hover:text-primary transition-colors">{post.title}</Link>
              </h2>
              <p className="leading-relaxed">{post.excerpt}</p>
              <Link to="#" className="text-primary hover:underline font-semibold mt-3 inline-block">Read More &rarr;</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default BlogPage;
