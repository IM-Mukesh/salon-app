"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import type { Salon } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  MapPin,
  Star,
  ExternalLink,
  MessageSquarePlus,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";

declare global {
  interface Window {
    google: any;
  }
}

export default function HomePage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!document.getElementById("google-signin-script")) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.id = "google-signin-script";
      document.body.appendChild(script);
    }
    const interval = setInterval(() => {
      if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.id
      ) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: (response: any) => {
            login(response.credential);
          },
        });
        window.google.accounts.id.renderButton(
          document.getElementById("g_id_signin"),
          { theme: "outline", size: "large" }
        );
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [login]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setLocationError(
            "Unable to retrieve your location. Please enable location services."
          );
          toast.error("Geolocation failed: " + error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      toast.error("Geolocation not supported.");
    }
  }, []);

  const {
    data: salons,
    isLoading,
    isError,
    error,
  } = useQuery<Salon[], Error>({
    queryKey: ["nearbySalons", location],
    queryFn: async () => {
      if (!location) {
        throw new Error("Location not available");
      }
      const res = await fetcher<{ salons: Salon[] }>("/api/salons/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location),
      });
      return res.salons;
    },
    enabled: !!location, // Only fetch if location is available
  });

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

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto py-8 px-4 md:px-6 lg:px-8"
    >
      <motion.div variants={itemVariants} className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Find Your Perfect Salon
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover top-rated salons near you, view their services, and leave
          reviews.
        </p>
      </motion.div>

      {!isAuthenticated && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            margin: "2rem 0",
          }}
        >
          <div id="g_id_signin" style={{ width: "auto" }}></div>
        </div>
      )}
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl font-semibold mb-6">Nearby Salons</h2>
        {locationError && (
          <p className="text-destructive-foreground bg-destructive p-3 rounded-md mb-4">
            {locationError}
          </p>
        )}
        {!location && !locationError && (
          <div className="flex items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Detecting your location...
          </div>
        )}
      </motion.div>
      {isLoading && location && (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="overflow-hidden rounded-lg shadow-lg">
                <div className="relative h-48 w-full bg-muted animate-pulse"></div>
                <CardHeader>
                  <div className="h-6 w-3/4 bg-muted animate-pulse rounded-md mb-2"></div>
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded-md"></div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded-md"></div>
                </CardContent>
                <div className="p-4 flex justify-between gap-2">
                  <div className="h-10 w-1/2 bg-muted animate-pulse rounded-md"></div>
                  <div className="h-10 w-1/2 bg-muted animate-pulse rounded-md"></div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
      {isError && location && (
        <motion.div
          variants={itemVariants}
          className="text-center text-destructive-foreground bg-destructive p-4 rounded-md"
        >
          <p>Error loading salons: {error?.message}</p>
        </motion.div>
      )}
      {salons && salons.length > 0 && (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {salons.map((salon) => (
            <Link
              key={salon._id || salon.id}
              href={`/salon/${salon._id || salon.id}`}
              className="block group"
            >
              <motion.div variants={itemVariants} className="h-full">
                <Card className="overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 group-hover:ring-2 group-hover:ring-primary">
                  <div className="relative h-48 w-full">
                    <Image
                      src={
                        salon.images && salon.images.length > 0
                          ? salon.images[0]
                          : "/placeholder.svg?height=400&width=600"
                      }
                      alt={salon.name}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-lg"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">
                      {salon.name}
                    </CardTitle>
                    <CardDescription className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="mr-1 h-4 w-4" />
                      {salon.distance !== undefined
                        ? `${(salon.distance / 1000).toFixed(2)} km away`
                        : "Distance unknown"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-foreground line-clamp-2">
                      {salon.description}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>
                        {salon.averageRating !== null &&
                        salon.averageRating !== undefined
                          ? `${salon.averageRating} (${
                              salon.totalReviews || 0
                            } reviews)`
                          : salon.totalReviews
                          ? `No rating (${salon.totalReviews} reviews)`
                          : "No reviews yet"}
                      </span>
                    </div>
                  </CardContent>
                  <div className="p-4 flex flex-col sm:flex-row justify-between gap-2">
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 bg-transparent"
                    >
                      {/* Ensure only a single <a> element as child */}
                      <a
                        href={
                          salon.location
                            ? `https://www.google.com/maps/search/?api=1&query=${salon.location.lat},${salon.location.lng}`
                            : "#"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in Maps
                        </span>
                      </a>
                    </Button>
                    {/* <Button asChild className="flex-1">
                      <Link href={`/salon/${salon.id}`}>
                        <span
                          style={{ display: "inline-flex", alignItems: "center" }}
                        >
                          <MessageSquarePlus className="mr-2 h-4 w-4" />
                          Give Review
                        </span>
                      </Link>
                    </Button> */}
                  </div>
                </Card>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}
      {salons && salons.length === 0 && location && (
        <motion.div
          variants={itemVariants}
          className="text-center text-muted-foreground p-4 rounded-md"
        >
          <p>No salons found near your location.</p>
        </motion.div>
      )}
    </motion.section>
  );
}
