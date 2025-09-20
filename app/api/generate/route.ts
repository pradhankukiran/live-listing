import Replicate from 'replicate';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const REPLICATE_MODEL = 'bytedance/seedream-4';
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

if (!REPLICATE_API_TOKEN) {
  throw new Error('Missing REPLICATE_API_TOKEN environment variable.');
}

const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

const SEEDREAM_SIZES = new Set(['1K', '2K', '4K', 'custom']);
const SEEDREAM_ASPECT_RATIOS = new Set([
  'match_input_image',
  '1:1',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
  '3:2',
  '2:3',
  '21:9',
]);
const SEQUENTIAL_GENERATION_MODES = new Set(['disabled', 'auto']);
const DEFAULT_IMAGE_MIME = 'image/jpeg';

type GenerateRequestPayload = {
  prompt: string;
  size?: string;
  aspectRatio?: string;
  sequentialImageGeneration?: string;
  maxImages?: number;
  width?: number;
  height?: number;
  imageInput?: string[] | string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequestPayload;
    const input = buildSeedreamInput(body);

    console.log('Sending prompt to Replicate (Seedream 4):', input.prompt);

    const outputFromRun: any = await replicate.run(REPLICATE_MODEL, { input });

    if (outputFromRun && typeof outputFromRun[Symbol.asyncIterator] === 'function') {
      console.log('Received a stream from Replicate. Consuming...');
      const collectedChunks: Uint8Array[] = [];
      let isBinaryStream = false;
      let firstNonBinaryEvent: any = null;

      for await (const event of outputFromRun as AsyncIterable<any>) {
        if (event instanceof Uint8Array || Buffer.isBuffer(event)) {
          isBinaryStream = true;
          collectedChunks.push(event instanceof Uint8Array ? event : Buffer.from(event));
        } else {
          if (!isBinaryStream && !firstNonBinaryEvent) {
            firstNonBinaryEvent = event;
          }
          console.log('Stream event (non-binary or mixed):', event);
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
        console.log('Successfully converted streamed binary data to base64.');
        return NextResponse.json({ imageData: base64Data, mimeType: DEFAULT_IMAGE_MIME });
      }

      if (firstNonBinaryEvent) {
        console.log('Stream yielded non-binary data first, processing as direct output:', firstNonBinaryEvent);
        return respondWithOutput(firstNonBinaryEvent);
      }

      console.error('Stream finished but no usable image data (binary or other) was collected.');
      throw new Error('Image generation failed: Stream did not yield usable data.');
    }

    console.log('Received non-stream (direct) output from Replicate:', outputFromRun);
    return respondWithOutput(outputFromRun);
  } catch (error: any) {
    console.error('Error generating image with Replicate:', error);
    const errorMessage = error.response?.data?.detail || error.message || 'Failed to generate image';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function buildSeedreamInput(body: GenerateRequestPayload) {
  const prompt = (body.prompt ?? '').trim();
  if (!prompt) {
    throw new Error('Prompt is required');
  }

  const input: Record<string, any> = { prompt };

  const size = normaliseSize(body.size);
  input.size = size;

  if (size === 'custom') {
    const width = clampToInt(body.width, 1024, 4096);
    const height = clampToInt(body.height, 1024, 4096);

    if (width === undefined || height === undefined) {
      throw new Error('Custom size requires width and height between 1024 and 4096.');
    }

    input.width = width;
    input.height = height;
  } else {
    const aspectRatio = normaliseAspectRatio(body.aspectRatio);
    if (aspectRatio) {
      input.aspect_ratio = aspectRatio;
    }
  }

  const sequentialMode = normaliseSequentialMode(body.sequentialImageGeneration);
  input.sequential_image_generation = sequentialMode;

  if (sequentialMode === 'auto') {
    input.max_images = clampToInt(body.maxImages, 1, 15) ?? 1;
  } else {
    input.max_images = 1;
  }

  const imageInput = normaliseImageInput(body.imageInput);
  if (imageInput) {
    input.image_input = imageInput;
  }

  return input;
}

function normaliseSize(value: unknown): '1K' | '2K' | '4K' | 'custom' {
  const requested = typeof value === 'string' ? value.trim() : '';
  if (SEEDREAM_SIZES.has(requested)) {
    return requested as '1K' | '2K' | '4K' | 'custom';
  }
  return '2K';
}

function normaliseAspectRatio(value: unknown) {
  const requested = typeof value === 'string' ? value.trim() : '';
  if (SEEDREAM_ASPECT_RATIOS.has(requested)) {
    return requested;
  }
  return 'match_input_image';
}

function normaliseSequentialMode(value: unknown): 'disabled' | 'auto' {
  const requested = typeof value === 'string' ? value.trim() : '';
  if (SEQUENTIAL_GENERATION_MODES.has(requested)) {
    return requested as 'disabled' | 'auto';
  }
  return 'disabled';
}

function normaliseImageInput(value: unknown) {
  if (Array.isArray(value)) {
    const urls = value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
    return urls.length > 0 ? urls : undefined;
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return undefined;
}

function clampToInt(value: unknown, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  const rounded = Math.floor(parsed);
  if (rounded < min || rounded > max) {
    return undefined;
  }
  return rounded;
}

async function respondWithOutput(rawOutput: any) {
  const payload = await extractImagePayload(rawOutput);
  return NextResponse.json(payload);
}


function isReadableStream(value: unknown): value is ReadableStream<Uint8Array> {
  return typeof value === 'object' && value !== null && typeof (value as any).getReader === 'function';
}

async function readReadableStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(Buffer.from(value));
    }
  }

  return Buffer.concat(chunks);
}

async function extractImagePayload(rawOutput: any) {
  if (rawOutput === null || rawOutput === undefined) {
    throw new Error('Image generation failed: Model returned no output.');
  }

  const items = Array.isArray(rawOutput) ? rawOutput : [rawOutput];
  const firstItem = items.find((item) => item !== undefined && item !== null);

  if (!firstItem) {
    throw new Error('Image generation failed: Model returned no output.');
  }

  if (typeof firstItem === 'string') {
    if (firstItem.startsWith('data:')) {
      const commaIndex = firstItem.indexOf(',');
      if (commaIndex !== -1) {
        const header = firstItem.slice(5, commaIndex);
        const mimeMatch = header.split(';')[0] || DEFAULT_IMAGE_MIME;
        const base64Data = firstItem.slice(commaIndex + 1);
        return { imageData: base64Data, mimeType: mimeMatch || DEFAULT_IMAGE_MIME };
      }
    }

    if (firstItem.startsWith('http')) {
      return downloadImageAsBase64(firstItem, DEFAULT_IMAGE_MIME);
    }
  }

  if (Buffer.isBuffer(firstItem)) {
    return { imageData: firstItem.toString('base64'), mimeType: DEFAULT_IMAGE_MIME };
  }

  if (firstItem instanceof Uint8Array) {
    return { imageData: Buffer.from(firstItem).toString('base64'), mimeType: DEFAULT_IMAGE_MIME };
  }

  if (firstItem instanceof ArrayBuffer) {
    return { imageData: Buffer.from(firstItem).toString('base64'), mimeType: DEFAULT_IMAGE_MIME };
  }

  if (typeof firstItem === 'object') {
    const item = firstItem as any;

    if (isReadableStream(item)) {
      const buffer = await readReadableStream(item);
      return { imageData: buffer.toString('base64'), mimeType: DEFAULT_IMAGE_MIME };
    }

    if (typeof item.url === 'function') {
      const url = await item.url();
      if (typeof url === 'string' && url.startsWith('http')) {
        return downloadImageAsBase64(url, DEFAULT_IMAGE_MIME);
      }
    }

    if (typeof item.url === 'string' && item.url.startsWith('http')) {
      return downloadImageAsBase64(item.url, DEFAULT_IMAGE_MIME);
    }

    if (typeof item.base64 === 'string') {
      const mimeType = typeof item.mime_type === 'string' ? item.mime_type : DEFAULT_IMAGE_MIME;
      return { imageData: item.base64, mimeType };
    }

    if (Array.isArray(item.data)) {
      try {
        const buffer = Buffer.from(item.data);
        return { imageData: buffer.toString('base64'), mimeType: DEFAULT_IMAGE_MIME };
      } catch (error) {
        console.warn('Failed to convert array data to buffer:', error);
      }
    }
  }

  throw new Error('Image generation failed: Model did not return a usable image.');
}

async function downloadImageAsBase64(url: string, fallbackMime: string) {
  const imageResponse = await fetch(url);
  if (!imageResponse.ok) {
    const errorText = await imageResponse.text();
    console.error(`Failed to fetch image from URL: ${url}. Status: ${imageResponse.status}. Body: ${errorText}`);
    throw new Error(`Failed to fetch image from URL: ${url}. Status: ${imageResponse.status}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  const mimeType = imageResponse.headers.get('content-type') || fallbackMime;
  console.log('Successfully fetched and converted image URL to base64.');
  return {
    imageData: Buffer.from(imageBuffer).toString('base64'),
    mimeType,
  };
}
