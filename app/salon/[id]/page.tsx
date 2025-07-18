"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetcher } from "@/lib/api";
import type { Salon, Review } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";

export default function SalonDetailsPage() {
  const { id } = useParams();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const salonRes = await fetcher<Salon>(`/api/salons/${id}`);
        setSalon(salonRes);
        const reviewsRes = await fetcher<{ reviews: Review[] }>(
          `/api/reviews/${id}`
        );
        setReviews(Array.isArray(reviewsRes.reviews) ? reviewsRes.reviews : []);
      } catch (err: any) {
        setError(err.message || "Failed to load salon details");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12">Loading salon details...</div>;
  }
  if (error) {
    return (
      <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">
        {error}
      </div>
    );
  }
  if (!salon) {
    return <div className="text-center py-12">Salon not found.</div>;
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto py-8 px-4 md:px-6 lg:px-8"
    >
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{salon.name}</CardTitle>
          <CardDescription>{salon.address}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center text-lg">
              <Star className="mr-1 h-5 w-5 fill-yellow-400 text-yellow-400" />
              {salon.averageRating !== null && salon.averageRating !== undefined
                ? `${salon.averageRating} (${salon.totalReviews || 0} reviews)`
                : salon.totalReviews
                ? `No rating (${salon.totalReviews} reviews)`
                : "No reviews yet"}
            </div>
            <div className="text-muted-foreground ml-4">
              {salon.businessHours}
            </div>
            <div className="text-muted-foreground ml-4">{salon.contact}</div>
          </div>
          {/* Images Gallery */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {salon.images && salon.images.length > 0 ? (
              salon.images.map((img, idx) => (
                <div
                  key={img + idx}
                  className="relative aspect-video rounded-lg overflow-hidden border shadow-sm"
                >
                  <Image
                    src={img}
                    alt={`Salon image ${idx + 1}`}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground">
                No images available.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Customer Reviews
          </CardTitle>
          <CardDescription>
            See what customers are saying about this salon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <motion.div
                  key={review._id || review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border p-4 shadow-sm"
                >
                  <div className="flex items-center mb-2">
                    <h3 className="font-semibold text-lg mr-2">
                      {review.username || review.reviewerName || "Anonymous"}
                    </h3>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            i < Math.round(review.rating)
                              ? "h-5 w-5 fill-yellow-400 text-yellow-400"
                              : "h-5 w-5 text-muted-foreground"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">
                    {new Date(review.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-foreground">{review.comment}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-center p-4 border rounded-md">
              No reviews yet.
            </div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
}
