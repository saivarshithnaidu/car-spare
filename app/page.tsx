'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Zap, Shield, Truck, Star, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Ad, SparePart } from '@/lib/types';
import Image from 'next/image';

export default function HomePage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<SparePart[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    fetchAds();
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    if (ads.length > 0) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % ads.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [ads.length]);

  async function fetchAds() {
    const { data } = await supabase
      .from('ads')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setAds(data);
  }

  async function fetchFeaturedProducts() {
    const { data } = await supabase
      .from('spare_parts')
      .select('*')
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(6);

    if (data) setFeaturedProducts(data);
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-slide-up">
              Quality Car Spare Parts
              <span className="block mt-2 text-yellow-300">At Your Fingertips</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Genuine parts, unbeatable prices, fast delivery. Your car deserves the best.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto">
                  Shop Now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/10 backdrop-blur border-white/50 text-white hover:bg-white/20">
                  Browse Catalog
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ads Carousel */}
      {ads.length > 0 && (
        <section className="py-8 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative h-64 rounded-2xl overflow-hidden shadow-2xl">
              {ads.map((ad, index) => (
                <div
                  key={ad.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${index === currentAdIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                  <a
                    href={ad.redirect_url || '#'}
                    target={ad.redirect_url ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="block w-full h-full relative"
                  >
                    {ad.image_url ? (
                      <div className="absolute inset-0">
                        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                        {/* Dark gradient overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900"></div>
                    )}

                    <div className="relative w-full h-full flex flex-col items-center justify-end pb-12 px-4">
                      <div className="text-center text-white max-w-2xl transform transition-transform duration-700 hover:scale-105">
                        <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 drop-shadow-lg">{ad.title}</h3>
                        {ad.redirect_url && (
                          <span className="inline-flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/50 rounded-full text-sm font-semibold transition-colors">
                            Click to learn more
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                </div>
              ))}

              {/* Indicator Dots */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {ads.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentAdIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${index === currentAdIndex ? 'bg-white w-8' : 'bg-white/50'
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Why Choose Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card hover className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Fast Delivery</h3>
              <p className="text-gray-600 dark:text-gray-400">Get your parts delivered within 24-48 hours</p>
            </Card>

            <Card hover className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Genuine Parts</h3>
              <p className="text-gray-600 dark:text-gray-400">100% authentic spare parts with warranty</p>
            </Card>

            <Card hover className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Free Shipping</h3>
              <p className="text-gray-600 dark:text-gray-400">Free shipping on orders above ₹2,000</p>
            </Card>

            <Card hover className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Best Prices</h3>
              <p className="text-gray-600 dark:text-gray-400">Competitive pricing with quality assurance</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
            <Link href="/products">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} hover>
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative overflow-hidden rounded-t-xl">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                      <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {product.car_model}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ₹{product.price.toFixed(2)}
                      </span>
                      <Link href={`/product/${product.id}`}>
                        <Button size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No products available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
