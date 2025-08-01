import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const environment = searchParams.get("env") || "production";

    const manifestFile =
      environment === "development"
        ? "tonconnect-manifest-dev.json"
        : "tonconnect-manifest.json";

    const manifestPath = path.join(process.cwd(), "public", manifestFile);

    // Check if file exists
    if (!fs.existsSync(manifestPath)) {
      return NextResponse.json(
        {
          error: "Manifest file not found",
          file: manifestFile,
          path: manifestPath,
        },
        { status: 404 }
      );
    }

    // Read and parse manifest
    const manifestContent = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(manifestContent);

    return NextResponse.json({
      success: true,
      manifest,
      file: manifestFile,
      path: manifestPath,
      accessible: true,
    });
  } catch (error) {
    console.error("Error checking manifest:", error);
    return NextResponse.json(
      {
        error: "Failed to check manifest",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
