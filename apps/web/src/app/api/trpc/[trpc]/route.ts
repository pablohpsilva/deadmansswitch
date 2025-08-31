/**
 * tRPC API Route Handler for Next.js App Router
 * Handles all tRPC requests and forwards them to the backend
 */

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { AppRouter } from "../../../../../../backend/src/routes/router";

// Backend URL - adjust this to match your backend server
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

async function handler(req: Request) {
  try {
    // Extract the tRPC path from the URL
    const url = new URL(req.url);
    const trpcPath = url.pathname.replace("/api/trpc", "");

    // Forward the request to the backend
    const backendUrl = `${BACKEND_URL}/trpc${trpcPath}${url.search}`;

    // Forward headers from the original request
    const headers = new Headers(req.headers);

    // Make request to backend
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    // Only add body for methods that support it
    if (req.method !== "GET" && req.method !== "HEAD") {
      const body = await req.text();
      if (body) {
        fetchOptions.body = body;
        fetchOptions.duplex = "half" as RequestDuplex;
      }
    }

    const backendResponse = await fetch(backendUrl, fetchOptions);

    // Create a new response with the backend's response
    const response = new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: backendResponse.headers,
    });

    // Add CORS headers if needed
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    return response;
  } catch (error) {
    console.error("tRPC proxy error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export { handler as GET, handler as POST, handler as OPTIONS };
