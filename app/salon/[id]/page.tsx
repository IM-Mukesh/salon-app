"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetcher } from "@/lib/api"
import type { Salon, ReviewFormValues, Review } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Star, MapPin, Clock, Phone } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { cn } from "@/lib/utils"

const reviewSchema = z.object({
  rating: z.number().min(1, "Rating is required").max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .max(500, "Comment cannot exceed 500 characters"),
})

interface PublicSalonPageProps {
  params: {
    id: string
  }
}

export default function PublicSalonPage({ params }: PublicSalonPageProps) {
  const salonId = params.id
  const queryClient = useQueryClient()

  const {
    data: salon,
    isLoading: isSalonLoading,
    isError: isSalonError,
    error: salonError,
  } = useQuery<Salon, Error>({
    queryKey: ["salon", salonId],
    queryFn: () => fetcher<Salon>(`/api/salons/${salonId}`),
  })

  const {
    data: reviews,
    isLoading: isReviewsLoading,
    isError: isReviewsError,
    error: reviewsError,
  } = useQuery<Review[], Error>({
    queryKey: ["salonReviews", salonId],
    queryFn: () => fetcher<Review[]>(`/api/salons/${salonId}/reviews`),
  })

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  })

  const [hoverRating, setHoverRating] = useState(0)

  const reviewMutation = useMutation<Review, Error, ReviewFormValues>({
    mutationFn: (newReview) =>
      fetcher<Review>("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ ...newReview, salonId }),
      }),
    onSuccess: () => {
      toast.success("Review submitted successfully!")
      form.reset()
      queryClient.invalidateQueries({ queryKey: ["salonReviews", salonId] }) // Invalidate reviews to refetch
    },
    onError: (error) => {
      toast.error(`Failed to submit review: ${error.message}`)
    },
  })

  const onSubmit = (values: ReviewFormValues) => {
    reviewMutation.mutate(values)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  if (isSalonLoading) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto py-8 px-4 md:px-6 lg:px-8"
      >
        <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-8">
          <Card className="overflow-hidden rounded-lg shadow-lg">
            <div className="relative h-64 w-full bg-muted animate-pulse"></div>
            <CardHeader>
              <div className="h-8 w-3/4 bg-muted animate-pulse rounded-md mb-2"></div>
              <div className="h-5 w-1/2 bg-muted animate-pulse rounded-md"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
              <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
              <div className="h-4 w-2/3 bg-muted animate-pulse rounded-md"></div>
            </CardContent>
          </Card>
          <Card className="rounded-lg shadow-lg p-6 space-y-4">
            <div className="h-8 w-1/3 bg-muted animate-pulse rounded-md"></div>
            <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
            <div className="h-24 w-full bg-muted animate-pulse rounded-md"></div>
            <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
          </Card>
        </motion.div>
      </motion.div>
    )
  }

  if (isSalonError) {
    return (
      <motion.div
        variants={itemVariants}
        className="text-center text-destructive-foreground bg-destructive p-4 rounded-md"
      >
        <p>Error loading salon details: {salonError?.message}</p>
      </motion.div>
    )
  }

  if (!salon) {
    return (
      <motion.div variants={itemVariants} className="text-center text-muted-foreground p-4 rounded-md">
        <p>Salon not found.</p>
      </motion.div>
    )
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto py-8 px-4 md:px-6 lg:px-8"
    >
      <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-8 mb-12">
        <Card className="overflow-hidden rounded-lg shadow-lg">
          <div className="relative h-64 w-full">
            <Image
              src={salon.images[0] || "/placeholder.svg?height=400&width=600"}
              alt={salon.name}
              layout="fill"
              objectFit="cover"
              className="rounded-t-lg"
            />
          </div>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{salon.name}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">{salon.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-sm text-foreground">
              <MapPin className="mr-2 h-5 w-5 text-primary" />
              <span>
                {salon.address}, {salon.pinCode}
              </span>
            </div>
            <div className="flex items-center text-sm text-foreground">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              <span>{salon.businessHours}</span>
            </div>
            <div className="flex items-center text-sm text-foreground">
              <Phone className="mr-2 h-5 w-5 text-primary" />
              <span>{salon.contact}</span>
            </div>
            {/* Assuming email might be part of contact or a separate field */}
            {/* <div className="flex items-center text-sm text-foreground">
              <Mail className="mr-2 h-5 w-5 text-primary" />
              <span>{salon.email}</span>
            </div> */}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-lg p-6 space-y-6">
          <CardTitle className="text-2xl font-semibold">Leave a Review for {salon.name}</CardTitle>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-8 w-8 cursor-pointer transition-colors duration-200",
                              (hoverRating || field.value) >= star
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground",
                            )}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => field.onChange(star)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Share your experience..." className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={reviewMutation.isPending}>
                {reviewMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Review
              </Button>
            </form>
          </Form>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-12">
        <h2 className="text-3xl font-semibold mb-6">Customer Reviews</h2>
        {isReviewsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-3">
                <div className="h-5 w-1/3 bg-muted animate-pulse rounded-md"></div>
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-5 w-5 text-muted-foreground animate-pulse" />
                  ))}
                </div>
                <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded-md"></div>
              </Card>
            ))}
          </div>
        )}
        {isReviewsError && (
          <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">
            <p>Error loading reviews: {reviewsError?.message}</p>
          </div>
        )}
        {reviews && reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <motion.div key={review.id} variants={itemVariants}>
                <Card className="p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-2">
                    <h3 className="font-semibold text-lg mr-2">{review.reviewerName || "Anonymous"}</h3>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-5 w-5",
                            i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-foreground">{review.comment}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          !isReviewsLoading &&
          !isReviewsError && (
            <motion.div variants={itemVariants} className="text-center text-muted-foreground p-4 rounded-md">
              <p>No reviews yet. Be the first to leave one!</p>
            </motion.div>
          )
        )}
      </motion.div>
    </motion.section>
  )
}
