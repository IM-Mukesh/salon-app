"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import type { Salon, EditProfileFormValues } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";

const profileSchema = z.object({
  name: z.string().min(3, "Salon name is required").max(100),
  contact: z.string().min(10, "Contact number is required").max(20),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500),
  businessHours: z.string().min(5, "Business hours are required").max(100),
  address: z.string().min(10, "Address is required").max(200),
  pinCode: z.string().min(4, "Pin code is required").max(10),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export default function SalonProfilePage() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  // Remove unused variable 'data' in the useQuery destructure
  const {
    data: salon,
    isLoading,
    isError,
    error,
  } = useQuery<Salon, Error>({
    queryKey: ["salonProfile", user?.id],
    queryFn: () => fetcher<Salon>(`/api/salons/me`, { token: token || "" }),
    enabled: !!user?.id && !!token, // Only fetch if user and token are available
  });

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      contact: "",
      description: "",
      businessHours: "",
      address: "",
      pinCode: "",
      lat: 0,
      lng: 0,
    },
  });

  // Populate form with fetched data
  useEffect(() => {
    if (salon) {
      form.reset({
        name: salon.name,
        contact: salon.contact,
        description: salon.description,
        businessHours: salon.businessHours,
        address: salon.address,
        pinCode: salon.pinCode,
        lat: salon.location?.lat,
        lng: salon.location?.lng,
      });
      // If lat/lng are missing, try to get from browser
      if (!salon.location?.lat || !salon.location?.lng) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              form.setValue("lat", position.coords.latitude);
              form.setValue("lng", position.coords.longitude);
            },
            (error) => {
              // Optionally show a toast or ignore
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        }
      }
    }
  }, [salon, form]);

  const updateProfileMutation = useMutation<
    Salon,
    Error,
    EditProfileFormValues
  >({
    mutationFn: (updatedProfile) =>
      fetcher<Salon>("/api/salons/update", {
        method: "PUT",
        body: JSON.stringify({
          ...updatedProfile,
          coordinates: [updatedProfile.lng, updatedProfile.lat],
        }),
        token: token || "",
      }),
    onSuccess: (data) => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["salonProfile", user?.id] }); // Invalidate to refetch latest data
      // Optionally update local user context if salon name changes
      // setUser({ ...user, name: data.name });
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const onSubmit = (values: EditProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  const handleDownloadQR = () => {
    if (salon?.qrCodeUrl) {
      // Create a canvas to generate the professional QR design
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast.error("Canvas not supported in this browser.");
        return;
      }

      // Set canvas size for high quality
      canvas.width = 1200;
      canvas.height = 1600;

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#667eea");
      gradient.addColorStop(0.5, "#764ba2");
      gradient.addColorStop(1, "#f093fb");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add decorative elements
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 3 + 1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Create main content area
      const contentWidth = canvas.width - 100;
      const contentHeight = canvas.height - 100;
      const contentX = 50;
      const contentY = 50;

      // White background for content
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;
      // Use a workaround for roundRect since it might not be supported in all browsers
      ctx.beginPath();
      ctx.moveTo(contentX + 30, contentY);
      ctx.lineTo(contentX + contentWidth - 30, contentY);
      ctx.quadraticCurveTo(
        contentX + contentWidth,
        contentY,
        contentX + contentWidth,
        contentY + 30
      );
      ctx.lineTo(contentX + contentWidth, contentY + contentHeight - 30);
      ctx.quadraticCurveTo(
        contentX + contentWidth,
        contentY + contentHeight,
        contentX + contentWidth - 30,
        contentY + contentHeight
      );
      ctx.lineTo(contentX + 30, contentY + contentHeight);
      ctx.quadraticCurveTo(
        contentX,
        contentY + contentHeight,
        contentX,
        contentY + contentHeight - 30
      );
      ctx.lineTo(contentX, contentY + 30);
      ctx.quadraticCurveTo(contentX, contentY, contentX + 30, contentY);
      ctx.closePath();
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Load QR code image
      const qrImage = new window.Image();
      qrImage.crossOrigin = "anonymous";
      qrImage.onload = () => {
        // Calculate QR code position and size
        const qrSize = 400;
        const qrX = contentX + (contentWidth - qrSize) / 2;
        const qrY = contentY + 200;

        // Add QR code background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);

        // Add QR code border
        ctx.strokeStyle = "#667eea";
        ctx.lineWidth = 3;
        ctx.strokeRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);

        // Draw QR code
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

        // Add salon name
        ctx.fillStyle = "#2d3748";
        ctx.font = "bold 48px 'Arial', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(salon.name, contentX + contentWidth / 2, contentY + 100);

        // Add thank you message
        ctx.fillStyle = "#4a5568";
        ctx.font = "24px 'Arial', sans-serif";
        ctx.fillText(
          "Thank you for visiting us!",
          contentX + contentWidth / 2,
          qrY + qrSize + 80
        );

        // Add feedback request
        ctx.fillStyle = "#718096";
        ctx.font = "20px 'Arial', sans-serif";
        ctx.fillText(
          "Please scan this QR code to leave your feedback",
          contentX + contentWidth / 2,
          qrY + qrSize + 120
        );

        // Add visit again message
        ctx.fillStyle = "#667eea";
        ctx.font = "bold 22px 'Arial', sans-serif";
        ctx.fillText(
          "We hope to see you again soon!",
          contentX + contentWidth / 2,
          qrY + qrSize + 160
        );

        // Add decorative elements around QR code
        ctx.strokeStyle = "#667eea";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        // Top left corner
        ctx.beginPath();
        ctx.moveTo(qrX - 40, qrY - 40);
        ctx.lineTo(qrX - 40, qrY - 60);
        ctx.moveTo(qrX - 40, qrY - 40);
        ctx.lineTo(qrX - 60, qrY - 40);
        ctx.stroke();

        // Top right corner
        ctx.beginPath();
        ctx.moveTo(qrX + qrSize + 40, qrY - 40);
        ctx.lineTo(qrX + qrSize + 40, qrY - 60);
        ctx.moveTo(qrX + qrSize + 40, qrY - 40);
        ctx.lineTo(qrX + qrSize + 60, qrY - 40);
        ctx.stroke();

        // Bottom left corner
        ctx.beginPath();
        ctx.moveTo(qrX - 40, qrY + qrSize + 40);
        ctx.lineTo(qrX - 40, qrY + qrSize + 60);
        ctx.moveTo(qrX - 40, qrY + qrSize + 40);
        ctx.lineTo(qrX - 60, qrY + qrSize + 40);
        ctx.stroke();

        // Bottom right corner
        ctx.beginPath();
        ctx.moveTo(qrX + qrSize + 40, qrY + qrSize + 40);
        ctx.lineTo(qrX + qrSize + 40, qrY + qrSize + 60);
        ctx.moveTo(qrX + qrSize + 40, qrY + qrSize + 40);
        ctx.lineTo(qrX + qrSize + 60, qrY + qrSize + 40);
        ctx.stroke();

        // Reset line dash
        ctx.setLineDash([]);

        // Add contact info if available
        if (salon.contact) {
          ctx.fillStyle = "#a0aec0";
          ctx.font = "18px 'Arial', sans-serif";
          ctx.fillText(
            `Contact: ${salon.contact}`,
            contentX + contentWidth / 2,
            qrY + qrSize + 200
          );
        }

        // Add business hours if available
        if (salon.businessHours) {
          ctx.fillStyle = "#a0aec0";
          ctx.font = "16px 'Arial', sans-serif";
          ctx.fillText(
            salon.businessHours,
            contentX + contentWidth / 2,
            qrY + qrSize + 230
          );
        }

        // Convert canvas to blob and download
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `${salon.name.replace(
                /[^a-zA-Z0-9]/g,
                "_"
              )}_Professional_QR.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              toast.success("Professional QR Code downloaded successfully!");
            } else {
              toast.error("Failed to generate QR code image.");
            }
          },
          "image/png",
          0.95
        );
      };

      qrImage.onerror = () => {
        toast.error("Failed to load QR code image.");
      };

      qrImage.src = salon.qrCodeUrl;
    } else {
      toast.error("QR Code URL not available.");
    }
  };

  const handlePrintQR = () => {
    if (salon?.qrCodeUrl) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${salon.name} - QR Code for Reviews</title>
              <style>
                @media print {
                  body { margin: 0; padding: 20px; }
                  .print-container { 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    min-height: 100vh; 
                    text-align: center;
                    font-family: Arial, sans-serif;
                  }
                  .salon-name {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    color: #333;
                  }
                  .qr-code {
                    border: 2px solid #333;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                    background: white;
                  }
                  .qr-code img {
                    max-width: 300px;
                    max-height: 300px;
                    display: block;
                    margin: 0 auto;
                  }
                  .message {
                    font-size: 18px;
                    color: #666;
                    margin-top: 20px;
                    max-width: 400px;
                    line-height: 1.4;
                  }
                  .instruction {
                    font-size: 14px;
                    color: #888;
                    margin-top: 10px;
                    font-style: italic;
                  }
                }
                @media screen {
                  body { 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    min-height: 100vh; 
                    margin: 0; 
                    background: #f5f5f5;
                    font-family: Arial, sans-serif;
                  }
                  .print-container {
                    background: white;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    text-align: center;
                    max-width: 500px;
                  }
                  .salon-name {
                    font-size: 28px;
                    font-weight: bold;
                    margin-bottom: 30px;
                    color: #333;
                  }
                  .qr-code {
                    border: 3px solid #333;
                    padding: 25px;
                    border-radius: 15px;
                    margin: 30px 0;
                    background: white;
                    display: inline-block;
                  }
                  .qr-code img {
                    max-width: 250px;
                    max-height: 250px;
                    display: block;
                  }
                  .message {
                    font-size: 20px;
                    color: #555;
                    margin-top: 30px;
                    line-height: 1.5;
                  }
                  .instruction {
                    font-size: 16px;
                    color: #777;
                    margin-top: 15px;
                    font-style: italic;
                  }
                }
              </style>
            </head>
            <body>
              <div class="print-container">
                <div class="salon-name">${salon.name}</div>
                <div class="qr-code">
                  <img src="${salon.qrCodeUrl}" alt="QR Code for Reviews" />
                </div>
                <div class="message">
                  Thanks for visit!
                </div>
                <div class="message">
                  Scan this QR code to leave a review for our salon!
                </div>
                <div class="instruction">
                  Customers can scan this code with their phone camera to access our review page.
                </div>
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    setTimeout(function() {
                      window.close();
                    }, 500);
                  }, 1000);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        toast.error("Could not open print window. Please allow pop-ups.");
      }
    } else {
      toast.error("QR Code URL not available.");
    }
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
        className="grid md:grid-cols-2 gap-8"
      >
        <Card className="rounded-lg shadow-lg p-6 space-y-6">
          <div className="h-8 w-1/2 bg-muted animate-pulse rounded-md mb-4"></div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-1/4 bg-muted animate-pulse rounded-md"></div>
              <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
            </div>
          ))}
          <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
        </Card>
        <Card className="rounded-lg shadow-lg p-6 space-y-6">
          <div className="h-8 w-1/2 bg-muted animate-pulse rounded-md mb-4"></div>
          <div className="relative h-64 w-full bg-muted animate-pulse rounded-md"></div>
          <div className="flex gap-2">
            <div className="h-10 w-1/2 bg-muted animate-pulse rounded-md"></div>
            <div className="h-10 w-1/2 bg-muted animate-pulse rounded-md"></div>
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
        <p>Error loading salon profile: {error?.message}</p>
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

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="grid md:grid-cols-2 gap-8"
    >
      <motion.div variants={itemVariants}>
        <Card className="rounded-lg shadow-lg p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl font-semibold">
              Edit Salon Profile
            </CardTitle>
            <CardDescription>Update your salon's information.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salon Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome Salon" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A brief description of your salon..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Hours</FormLabel>
                      <FormControl>
                        <Input placeholder="Mon-Sat: 9 AM - 7 PM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Main St, City, State"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pinCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pin Code</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="e.g., 34.0522"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number.parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="e.g., -118.2437"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number.parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="rounded-lg shadow-lg p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl font-semibold">
              QR Code for Reviews
            </CardTitle>
            <CardDescription>
              Download a professional QR code design with your salon branding
              and welcoming messages for customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0 flex flex-col items-center space-y-6">
            {salon.qrCodeUrl ? (
              <>
                <div className="relative w-64 h-64 border rounded-lg overflow-hidden p-2">
                  <Image
                    src={salon.qrCodeUrl || "/placeholder.svg"}
                    alt={`${salon.name} QR Code`}
                    layout="fill"
                    objectFit="contain"
                    className="rounded-md"
                  />
                </div>
                <div className="flex gap-4 w-full">
                  <Button onClick={handleDownloadQR} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download Professional QR
                  </Button>
                  <Button
                    onClick={handlePrintQR}
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-center p-4 border rounded-md w-full">
                QR Code not available. Please ensure your profile is complete.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.section>
  );
}
