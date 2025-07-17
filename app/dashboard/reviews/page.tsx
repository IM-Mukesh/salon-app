"use client";

import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import type { Review, Salon } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

export default function SalonReviewsPage() {
  try {
    const { user, token } = useAuth();

    // First, fetch the salon data to get the correct salon ID
    const {
      data: salon,
      isLoading: salonLoading,
      isError: salonError,
      error: salonErrorData,
    } = useQuery<Salon, Error>({
      queryKey: ["salonProfile", user?.id],
      queryFn: () => fetcher<Salon>(`/api/salons/me`, { token: token || "" }),
      enabled: !!user?.id && !!token,
    });
    console.log("Salon data:", salon);

    // Then fetch reviews using the salon ID
    const {
      data: reviews,
      isLoading: reviewsLoading,
      isError: reviewsError,
      error: reviewsErrorData,
    } = useQuery<Review[], Error>({
      queryKey: ["salonReviewsDashboard", salon?._id],
      queryFn: async () => {
        try {
          console.log("Fetching reviews for salon ID:", salon?._id);
          const result = await fetcher<any>(`/api/reviews/${salon?._id}`, {
            token: token || "",
          });
          console.log("Reviews API response:", result);

          // Handle different response structures
          let reviewsArray: Review[] = [];
          if (Array.isArray(result)) {
            reviewsArray = result;
          } else if (result && typeof result === "object") {
            // Check if the response has a data or reviews property
            if (Array.isArray(result.data)) {
              reviewsArray = result.data;
            } else if (Array.isArray(result.reviews)) {
              reviewsArray = result.reviews;
            } else if (Array.isArray(result.items)) {
              reviewsArray = result.items;
            } else {
              console.warn("Unexpected API response structure:", result);
              reviewsArray = [];
            }
          }

          console.log("Extracted reviews array:", reviewsArray);
          return reviewsArray;
        } catch (error) {
          console.error("Error fetching reviews:", error);
          throw error;
        }
      },
      enabled: !!salon?._id && !!token,
      retry: 1, // Only retry once
      retryDelay: 1000,
    });
    console.log("Reviews data:", reviews);
    console.log("Reviews error:", reviewsError, reviewsErrorData);

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    };

    // Show loading state while either salon or reviews are loading
    if (salonLoading || reviewsLoading) {
      return (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          <Card className="rounded-lg shadow-lg p-6 space-y-6">
            <div className="h-8 w-1/2 bg-muted animate-pulse rounded-md mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                  <div className="h-5 w-1/3 bg-muted animate-pulse rounded-md"></div>
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className="h-5 w-5 text-muted-foreground animate-pulse"
                      />
                    ))}
                  </div>
                  <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded-md"></div>
                </Card>
              ))}
            </div>
          </Card>
        </motion.div>
      );
    }

    // Show error state for salon loading
    if (salonError) {
      return (
        <motion.div
          variants={itemVariants}
          className="text-center text-destructive-foreground bg-destructive p-4 rounded-md"
        >
          <p>Error loading salon profile: {salonErrorData?.message}</p>
          <p className="text-sm mt-2">
            Please check your connection and try again.
          </p>
        </motion.div>
      );
    }

    // Show error state for reviews loading
    if (reviewsError) {
      return (
        <motion.div
          variants={itemVariants}
          className="text-center text-destructive-foreground bg-destructive p-4 rounded-md"
        >
          <p>Error loading reviews: {reviewsErrorData?.message}</p>
          <p className="text-sm mt-2">Salon ID: {salon?._id}</p>
          <p className="text-sm">Please check your connection and try again.</p>
        </motion.div>
      );
    }

    if (!salon) {
      return (
        <motion.div
          variants={itemVariants}
          className="text-center text-muted-foreground p-4 rounded-md"
        >
          <p>
            No salon profile found. Please ensure you are logged in as a salon
            owner.
          </p>
        </motion.div>
      );
    }

    if (!reviews || reviews.length === 0) {
      return (
        <motion.div
          variants={itemVariants}
          className="text-center text-muted-foreground p-4 rounded-md"
        >
          <p>No reviews received yet.</p>
        </motion.div>
      );
    }

    // Ensure reviews is an array before mapping
    const reviewsArray = Array.isArray(reviews) ? reviews : [];
    console.log("Reviews array:", reviewsArray);

    if (reviewsArray.length === 0) {
      return (
        <motion.div
          variants={itemVariants}
          className="text-center text-muted-foreground p-4 rounded-md"
        >
          <p>No reviews received yet.</p>
        </motion.div>
      );
    }

    return (
      <motion.section
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        <motion.div variants={itemVariants}>
          <Card className="rounded-lg shadow-lg p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl font-semibold">
                Customer Reviews
              </CardTitle>
              <CardDescription>
                View feedback from your valued customers.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviewsArray.map((review) => {
                  console.log("Review object:", review);
                  return (
                    <motion.div
                      key={review._id || review.id}
                      variants={itemVariants}
                    >
                      <Card className="p-6 rounded-lg shadow-md">
                        <div className="flex items-center mb-2">
                          <h3 className="font-semibold text-lg mr-2">
                            {review.username ||
                              review.reviewerName ||
                              review.name ||
                              review.customerName ||
                              review.userName ||
                              review.reviewer ||
                              "Anonymous"}
                          </h3>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-5 w-5",
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                        <p className="text-foreground">{review.comment}</p>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>
    );
  } catch (error) {
    console.error("Unexpected error in SalonReviewsPage:", error);
    return (
      <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">
        <p>Something went wrong!</p>
        <p className="text-sm mt-2">
          Error: {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <p className="text-sm">Please refresh the page and try again.</p>
      </div>
    );
  }
}
