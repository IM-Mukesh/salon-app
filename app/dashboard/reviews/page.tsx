"use client"

import { useQuery } from "@tanstack/react-query"
import { fetcher } from "@/lib/api"
import type { Review } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

export default function SalonReviewsPage() {
  const { user, token } = useAuth()

  // Assuming the salon ID can be derived from the authenticated user
  const salonId = user?.id // This might need to be adjusted based on your backend's user-to-salon mapping

  const {
    data: reviews,
    isLoading,
    isError,
    error,
  } = useQuery<Review[], Error>({
    queryKey: ["salonReviewsDashboard", salonId],
    queryFn: () => fetcher<Review[]>(`/api/salons/${salonId}/reviews`, { token: token || "" }),
    enabled: !!salonId && !!token,
  })

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

  if (isLoading) {
    return (
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
        <Card className="rounded-lg shadow-lg p-6 space-y-6">
          <div className="h-8 w-1/2 bg-muted animate-pulse rounded-md mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
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
        </Card>
      </motion.div>
    )
  }

  if (isError) {
    return (
      <motion.div
        variants={itemVariants}
        className="text-center text-destructive-foreground bg-destructive p-4 rounded-md"
      >
        <p>Error loading reviews: {error?.message}</p>
      </motion.div>
    )
  }

  if (!reviews || reviews.length === 0) {
    return (
      <motion.div variants={itemVariants} className="text-center text-muted-foreground p-4 rounded-md">
        <p>No reviews received yet.</p>
      </motion.div>
    )
  }

  return (
    <motion.section initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
      <motion.div variants={itemVariants}>
        <Card className="rounded-lg shadow-lg p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl font-semibold">Customer Reviews</CardTitle>
            <CardDescription>View feedback from your valued customers.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
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
          </CardContent>
        </Card>
      </motion.div>
    </motion.section>
  )
}
