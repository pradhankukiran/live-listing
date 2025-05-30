import Replicate from 'replicate';
import { NextRequest, NextResponse } from 'next/server';
// import mime from 'mime'; // Keep if needed for other purposes, otherwise remove

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

// TODO: Replace with the actual Imagen 4 model identifier from Replicate
const REPLICATE_IMAGEN_MODEL = "google/imagen-4"; // EXAMPLE - PLEASE REPLACE
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

if (!REPLICATE_API_TOKEN) {
  throw new Error('Missing REPLICATE_API_TOKEN environment variable.');
}

// Initialize Replicate client
const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, aspectRatio, safetyFilterLevel } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // The enhanced prompt (with style, mood, etc.) is now constructed on the client side
    console.log("Sending prompt to Replicate (Imagen 4):", prompt);

    const input: any = {
      prompt: prompt,
    };

    // Add safety_filter_level if provided and valid
    if (safetyFilterLevel && ["block_low_and_above", "block_medium_and_above", "block_only_high"].includes(safetyFilterLevel)) {
      input.safety_filter_level = safetyFilterLevel;
    } // Otherwise, model default ("block_only_high") will be used
    
    // Add aspect_ratio if provided
    if (aspectRatio) {
      // Parse the aspect ratio string (e.g., "16:9") into width and height
      const [width, height] = aspectRatio.split(':').map(Number);
      if (width && height) {
        input.aspect_ratio = `${width}:${height}`;
      }
    }

    // Run the model
    const outputFromRun: any = await replicate.run(REPLICATE_IMAGEN_MODEL, { input });

    // Check if the output is an async iterator (common for streaming models)
    if (outputFromRun && typeof outputFromRun[Symbol.asyncIterator] === 'function') {
      console.log("Received a stream from Replicate. Consuming...");
      const collectedChunks: Uint8Array[] = [];
      let isBinaryStream = false;
      let firstNonBinaryEvent: any = null;

      for await (const event of outputFromRun as AsyncIterable<any>) {
        if (event instanceof Uint8Array) {
          isBinaryStream = true;
          collectedChunks.push(event);
        } else {
          // If we see a non-binary event first, or after some binary data, capture it.
          // This could be a URL or structured data if the model doesn't stream pure binary.
          if (!isBinaryStream && !firstNonBinaryEvent) {
            firstNonBinaryEvent = event;
          }
          console.log("Stream event (non-binary or mixed):", event);
        }
      }

      if (isBinaryStream && collectedChunks.length > 0) {
        console.log(`Collected ${collectedChunks.length} binary chunks for image data.`);
        const totalLength = collectedChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const imageBuffer = Buffer.alloc(totalLength);
        let offset = 0;
        for (const chunk of collectedChunks) {
          imageBuffer.set(chunk, offset);
          offset += chunk.length;
        }
        const base64Data = imageBuffer.toString('base64');
        // TODO: Determine the correct MIME type. Defaulting to image/png.
        // For "google/imagen-4", this is likely 'image/png' or 'image/jpeg'.
        const mimeType = 'image/png';
        console.log(`Successfully converted streamed binary data to base64 (${mimeType}).`);
        return NextResponse.json({ imageData: base64Data, mimeType: mimeType });
      } else if (firstNonBinaryEvent) {
        // The stream yielded something other than pure binary data first.
        // Let's try to process this as if it were the direct output.
        console.log("Stream yielded non-binary data first, processing as direct output:", firstNonBinaryEvent);
        // This falls through to the direct output handling below.
        // We re-assign outputFromRun to simplify the next stage.
        return processDirectReplicateOutput(firstNonBinaryEvent);
      } else {
        console.error("Stream finished but no usable image data (binary or other) was collected.");
        throw new Error("Image generation failed: Stream did not yield usable data.");
      }
    } else {
      // Handle non-streaming direct output from Replicate
      console.log("Received non-stream (direct) output from Replicate:", outputFromRun);
      return processDirectReplicateOutput(outputFromRun);
    }

  } catch (error: any) {
    console.error('Error generating image with Replicate:', error);
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to generate image';
    return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
    );
  }
}

async function processDirectReplicateOutput(directOutput: any) {
  // This function handles cases where output is a URL, an array of URLs,
  // or potentially other structures that might resolve to a URL.

  let imageUrlToFetch: string | null = null;

  if (typeof directOutput === 'string' && directOutput.startsWith('http')) {
    imageUrlToFetch = directOutput;
    console.log("Processing direct image URL:", imageUrlToFetch);
  } else if (Array.isArray(directOutput) && directOutput.length > 0 && typeof directOutput[0] === 'string' && directOutput[0].startsWith('http')) {
    imageUrlToFetch = directOutput[0];
    console.log("Processing direct array of image URLs, taking the first:", imageUrlToFetch);
  }
  // Add more checks here if Replicate models return URLs in other structures, e.g., { url: "..." }

  if (imageUrlToFetch) {
    const imageResponse = await fetch(imageUrlToFetch);
    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error(`Failed to fetch image from URL: ${imageUrlToFetch}. Status: ${imageResponse.status}. Body: ${errorText}`);
      throw new Error(`Failed to fetch image from URL: ${imageUrlToFetch}. Status: ${imageResponse.status}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Data = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/png'; // Default if header missing
    console.log(`Successfully fetched and converted image URL to base64 (${mimeType}).`);
    return NextResponse.json({ imageData: base64Data, mimeType: mimeType });
  } else {
    console.error("Replicate direct output was not a recognized image URL or array of URLs. Output:", directOutput);
    throw new Error("Image generation failed: Model did not return a usable image URL directly.");
  }
} 