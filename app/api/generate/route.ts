import Replicate from 'replicate';
import { NextRequest, NextResponse } from 'next/server';
// import mime from 'mime'; // Keep if needed for other purposes, otherwise remove

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

// Updated model to Black-Forest-Labs Flux Kontext Pro
const REPLICATE_MODEL = "black-forest-labs/flux-kontext-pro";
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
    const { prompt, aspectRatio, safetyTolerance, seed, inputImage, outputFormat } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log("Sending prompt to Replicate (Flux Kontext Pro):", prompt);

    const input: any = {
      prompt: prompt,
      seed: 0,  // Default seed to 0 for reproducible generation
      safety_tolerance: 6,  // Default safety tolerance to 6 (most permissive)
    };

    // Add optional parameters if provided
    if (seed !== undefined) {
      input.seed = seed;
    }
    
    if (inputImage) {
      input.input_image = inputImage;
    }
    
    // Handle aspect ratio - map from string like "16:9" to model's enum values
    if (aspectRatio) {
      // Check if aspectRatio is already in the format expected by the model
      const validAspectRatios = [
        "match_input_image", "1:1", "16:9", "9:16", "4:3", "3:4", 
        "3:2", "2:3", "4:5", "5:4", "21:9", "9:21", "2:1", "1:2"
      ];
      
      if (validAspectRatios.includes(aspectRatio)) {
        input.aspect_ratio = aspectRatio;
      } else {
        // Default to 1:1 if not in valid format
        input.aspect_ratio = "1:1";
      }
    } else if (inputImage) {
      // Default to match input image if input image is provided
      input.aspect_ratio = "match_input_image";
    } else {
      // Default to square if nothing specified
      input.aspect_ratio = "1:1";
    }
    
    // Override default safety tolerance if explicitly provided
    if (safetyTolerance !== undefined) {
      const tolerance = Number(safetyTolerance);
      if (!isNaN(tolerance) && tolerance >= 0 && tolerance <= 6) {
        input.safety_tolerance = tolerance;
      }
    }
    
    // Add output format if provided
    if (outputFormat && (outputFormat === "jpg" || outputFormat === "png")) {
      input.output_format = outputFormat;
    }

    // Run the model
    const outputFromRun: any = await replicate.run(REPLICATE_MODEL, { input });

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
        // Default to image/png or use the specified output format
        const mimeType = input.output_format === "jpg" ? "image/jpeg" : "image/png";
        console.log(`Successfully converted streamed binary data to base64 (${mimeType}).`);
        return NextResponse.json({ imageData: base64Data, mimeType: mimeType });
      } else if (firstNonBinaryEvent) {
        // The stream yielded something other than pure binary data first.
        // Let's try to process this as if it were the direct output.
        console.log("Stream yielded non-binary data first, processing as direct output:", firstNonBinaryEvent);
        // This falls through to the direct output handling below.
        // We re-assign outputFromRun to simplify the next stage.
        return processDirectReplicateOutput(firstNonBinaryEvent, input.output_format);
      } else {
        console.error("Stream finished but no usable image data (binary or other) was collected.");
        throw new Error("Image generation failed: Stream did not yield usable data.");
      }
    } else {
      // Handle non-streaming direct output from Replicate
      console.log("Received non-stream (direct) output from Replicate:", outputFromRun);
      return processDirectReplicateOutput(outputFromRun, input.output_format);
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

async function processDirectReplicateOutput(directOutput: any, outputFormat?: string) {
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
    // Use content-type from response or determine based on output format
    const mimeType = imageResponse.headers.get('content-type') || 
                     (outputFormat === "jpg" ? "image/jpeg" : "image/png");
    console.log(`Successfully fetched and converted image URL to base64 (${mimeType}).`);
    return NextResponse.json({ imageData: base64Data, mimeType: mimeType });
  } else {
    console.error("Replicate direct output was not a recognized image URL or array of URLs. Output:", directOutput);
    throw new Error("Image generation failed: Model did not return a usable image URL directly.");
  }
} 