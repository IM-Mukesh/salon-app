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

  console.log("salon qr", salon);

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
          location: { lat: updatedProfile.lat, lng: updatedProfile.lng },
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
      const link = document.createElement("a");
      link.href = salon.qrCodeUrl;
      link.download = `${salon.name}_QR_Code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR Code download started!");
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
              <title>${salon.name} QR Code</title>
              <style>
                body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                img { max-width: 80%; max-height: 80vh; }
              </style>
            </head>
            <body>
              <img src="${salon.qrCodeUrl}" onload="window.print();window.close()" />
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
              Customers can scan this QR code to leave a review.
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
                    Download
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
