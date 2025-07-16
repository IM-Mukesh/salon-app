import { toast } from "sonner";

// Set API_BASE_URL from environment variable, fallback to localhost:3001 for development
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001"; // Set NEXT_PUBLIC_API_BASE in your .env file

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function fetcher<T>(
  endpoint: string,
  options?: FetchOptions
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log("url is", url, options);

  // Use Record<string, string> for headers to allow dynamic assignment
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (options?.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "An unknown error occurred" }));
      const errorMessage =
        errorData.message || `HTTP error! status: ${response.status}`;
      toast.error(`API Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    console.error("Fetcher error:", error);
    if (error instanceof Error) {
      toast.error(`Network Error: ${error.message}`);
    } else {
      toast.error("An unexpected error occurred during fetch.");
    }
    throw error;
  }
}

// Utility for S3 PUT (no JSON content type)
export async function uploadFileToS3(
  url: string,
  file: File
): Promise<Response> {
  try {
    const response = await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type, // Important for S3
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      toast.error(`S3 Upload Error: ${errorText}`);
      throw new Error(
        `S3 upload failed: ${response.statusText} - ${errorText}`
      );
    }
    toast.success("Image uploaded successfully!");
    return response;
  } catch (error) {
    console.error("S3 upload error:", error);
    if (error instanceof Error) {
      toast.error(`Upload Failed: ${error.message}`);
    } else {
      toast.error("An unexpected error occurred during S3 upload.");
    }
    throw error;
  }
}
