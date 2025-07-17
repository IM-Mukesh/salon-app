"use client";

import type React from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher, uploadFileToS3 } from "@/lib/api";
import type { Salon, UploadUrlResponse } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Image compression utility function
const compressImage = (
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new window.Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width && height && width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (!width || !height) {
        reject(new Error("Invalid image dimensions"));
        return;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress the image
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a new file with compressed data
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"));
    };

    // Load the image from file
    img.src = URL.createObjectURL(file);
  });
};

export default function SalonImagesPage() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const {
    data: salon,
    isLoading,
    isError,
    error,
  } = useQuery<Salon, Error>({
    queryKey: ["salonProfile", user?.id],
    queryFn: () => fetcher<Salon>(`/api/salons/me`, { token: token || "" }),
    enabled: !!user?.id && !!token,
  });

  const [uploadingImages, setUploadingImages] = useState<
    Record<string, boolean>
  >({});

  const updateSalonImagesMutation = useMutation<Salon, Error, string[]>({
    mutationFn: (imageUrls) =>
      fetcher<Salon>("/api/salons/update", {
        method: "PUT",
        body: JSON.stringify({ images: imageUrls }),
        token: token || "",
      }),
    onSuccess: () => {
      toast.success("Salon images updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["salonProfile", user?.id] });
    },
    onError: (error) => {
      toast.error(`Failed to update images: ${error.message}`);
    },
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const currentImagesCount = salon?.images?.length || 0;
    const maxAllowed = 10 - currentImagesCount;
    if (maxAllowed <= 0) {
      toast.error("You have reached the maximum limit of 10 images.");
      return;
    }
    if (files.length > maxAllowed) {
      toast.error(
        `You can upload a maximum of 10 images. You have ${currentImagesCount} and can add only ${maxAllowed} more. Uploading only the first ${maxAllowed} images.`
      );
      files = files.slice(0, maxAllowed);
    }

    for (const file of files) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadingImages((prev) => ({ ...prev, [fileId]: true }));

      try {
        // Compress the image before uploading
        const compressedFile = await compressImage(file);

        const { uploadUrl, publicUrl } = await fetcher<UploadUrlResponse>(
          "/api/salons/upload-url",
          {
            method: "GET",
            token: token || "",
          }
        );

        await uploadFileToS3(uploadUrl, compressedFile);

        // Add the new publicUrl to the existing images and update the salon profile
        const updatedImages = [...(salon?.images || []), publicUrl];
        await updateSalonImagesMutation.mutateAsync(updatedImages);
      } catch (error) {
        console.error("Image upload process failed:", error);
        toast.error(
          `Failed to upload ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setUploadingImages((prev) => {
          const newState = { ...prev };
          delete newState[fileId];
          return newState;
        });
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the input
    }
  };

  const handleRemoveImage = async (imageUrlToRemove: string) => {
    if (!salon) return;

    const updatedImages = salon.images.filter(
      (url) => url !== imageUrlToRemove
    );
    await updateSalonImagesMutation.mutateAsync(updatedImages);
  };

  const handleOpenImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
  };

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

  if (isLoading) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="grid gap-8"
      >
        <Card className="rounded-lg shadow-lg p-6 space-y-6">
          <div className="h-8 w-1/2 bg-muted animate-pulse rounded-md mb-4"></div>
          <div className="h-12 w-full bg-muted animate-pulse rounded-md"></div>
        </Card>
        <Card className="rounded-lg shadow-lg p-6 space-y-6">
          <div className="h-8 w-1/2 bg-muted animate-pulse rounded-md mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="relative h-32 w-full bg-muted animate-pulse rounded-md"
              ></div>
            ))}
          </div>
        </Card>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div
        variants={itemVariants}
        className="text-center text-destructive-foreground bg-destructive p-4 rounded-md"
      >
        <p>Error loading salon images: {error?.message}</p>
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

  const isUploading = Object.values(uploadingImages).some(Boolean);
  const canUploadMore = (salon.images?.length || 0) < 10;

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
              Upload Salon Images
            </CardTitle>
            <CardDescription>
              Add up to 10 high-quality images of your salon.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Input
              ref={fileInputRef}
              id="image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={
                !canUploadMore ||
                isUploading ||
                updateSalonImagesMutation.isPending
              }
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 text-lg"
              disabled={
                !canUploadMore ||
                isUploading ||
                updateSalonImagesMutation.isPending
              }
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  {canUploadMore
                    ? "Select Images to Upload"
                    : "Maximum 10 Images Reached"}
                </>
              )}
            </Button>
            {!canUploadMore && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                You have reached the maximum limit of 10 images.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="rounded-lg shadow-lg p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl font-semibold">
              Your Salon Images
            </CardTitle>
            <CardDescription>
              Manage your existing salon images.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {salon.images && salon.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {salon.images.map((imageUrl) => (
                    <motion.div
                      key={imageUrl}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="relative group aspect-video overflow-hidden rounded-lg border shadow-sm cursor-pointer"
                      onClick={() => handleOpenImageModal(imageUrl)}
                    >
                      <Image
                        src={imageUrl || "/placeholder.svg"}
                        alt="Salon Image"
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Zoom overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(imageUrl);
                        }}
                        disabled={updateSalonImagesMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove image</span>
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-muted-foreground text-center p-4 border rounded-md">
                No images uploaded yet. Use the button above to add some!
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Full-size Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={handleCloseImageModal}>
        <DialogContent className="max-w-95vw max-h-[95vh] bg-transparent border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Salon Image Full Size"
                width={1920}
                height={1080}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                priority
              />
            )}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-none"
              onClick={handleCloseImageModal}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close image</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}
