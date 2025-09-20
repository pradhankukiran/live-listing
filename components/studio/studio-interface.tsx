"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  Loader2,
  Download,
  X,
  Box,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SharedNavbar } from "@/components/shared/shared-navbar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { promptOptions } from "@/lib/prompt-options";

type SelectionState = {
  gender: string;
  hair_color: string;
  hair_style: string;
  facial_hair: string;
  body_type: string;
  age: string;
  expression: string;
  background: string;
};

type SizeOption = '1K' | '2K' | '4K' | 'custom';
const sizeOptions: SizeOption[] = ['1K', '2K', '4K', 'custom'];

type AspectRatioOption =
  | 'match_input_image'
  | '1:1'
  | '4:3'
  | '3:4'
  | '16:9'
  | '9:16'
  | '3:2'
  | '2:3'
  | '21:9';
const aspectRatioOptions: AspectRatioOption[] = [
  'match_input_image',
  '1:1',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
  '3:2',
  '2:3',
  '21:9',
];

type SequentialMode = 'disabled' | 'auto';
const sequentialGenerationOptions: SequentialMode[] = ['disabled', 'auto'];

type ModelSettings = {
  size: SizeOption;
  aspectRatio: AspectRatioOption;
  sequentialImageGeneration: SequentialMode;
  maxImages: number;
  width: string;
  height: string;
  imageInput: string;
};

const getDefaultModelSettings = (): ModelSettings => ({
  size: '2K',
  aspectRatio: 'match_input_image',
  sequentialImageGeneration: 'disabled',
  maxImages: 1,
  width: '2048',
  height: '2048',
  imageInput: '',
});

// Helper function to capitalize first letter for display
const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Helper function to create a label from a key
const keyToLabel = (key: string) => {
  return key.split("_").map(capitalizeFirstLetter).join(" ");
};

// Define the order of dropdowns
const dropdownOrder: (keyof SelectionState)[] = [
  "gender",
  "age",
  "body_type",
  "hair_color",
  "hair_style",
  "facial_hair",
  "expression",
  "background",
];

export function StudioInterface() {
  const [isMounted, setIsMounted] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("clothing");

  const [modelSettings, setModelSettings] = useState<ModelSettings>(getDefaultModelSettings());

  const updateModelSettings = (updates: Partial<ModelSettings>) => {
    setModelSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleSizeChange = (value: SizeOption) => {
    setModelSettings((prev) => {
      const next = { ...prev, size: value };
      if (value !== 'custom') {
        const defaults = getDefaultModelSettings();
        next.width = defaults.width;
        next.height = defaults.height;
      }
      return next;
    });
  };

  const parseDimension = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return Number.NaN;
    }
    return Math.floor(parsed);
  };

  const parseImageInputList = (value: string) =>
    value
      .split(/[\r\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);


  const getInitialState = (): SelectionState => {
    return {
      gender: promptOptions.gender[0],
      hair_color: promptOptions.hair_color[0],
      hair_style: promptOptions.hair_style_male[0],
      facial_hair: promptOptions.facial_hair[0],
      body_type: promptOptions.body_type[0],
      age: promptOptions.age[0],
      expression: promptOptions.expression[0],
      background: promptOptions.background[0],
    };
  };

  const [selectionStates, setSelectionStates] = useState<SelectionState>(
    getInitialState()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageData, setGeneratedImageData] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [showOutputModal, setShowOutputModal] = useState(false);

  useEffect(() => {
    try {
      const savedSelections = localStorage.getItem("studioSelections");
      if (savedSelections) {
        setSelectionStates(JSON.parse(savedSelections));
      }
    } catch (e) {
      console.error("Failed to load saved settings:", e);
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("studioSelections", JSON.stringify(selectionStates));
    }
  }, [selectionStates, isMounted]);

  const handleSelectionChange = (key: keyof SelectionState, value: string) => {
    setSelectionStates((prev) => {
      const newState = { ...prev, [key]: value };
      if (key === "gender") {
        newState.hair_style =
          value === "Male"
            ? promptOptions.hair_style_male[0]
            : promptOptions.hair_style_female[0];
        if (value !== "Male") {
          newState.facial_hair = promptOptions.facial_hair[0]; // Reset facial hair if not male
        }
      }
      return newState;
    });
  };

  const handleRandomise = () => {
    const newSelections: Partial<SelectionState> = {};

    // Randomise gender first
    const randomGender =
      promptOptions.gender[
        Math.floor(Math.random() * promptOptions.gender.length)
      ];
    newSelections.gender = randomGender;

    // Randomise other properties
    newSelections.hair_color =
      promptOptions.hair_color[
        Math.floor(Math.random() * promptOptions.hair_color.length)
      ];
    newSelections.body_type =
      promptOptions.body_type[
        Math.floor(Math.random() * promptOptions.body_type.length)
      ];
    newSelections.age =
      promptOptions.age[Math.floor(Math.random() * promptOptions.age.length)];
    newSelections.expression =
      promptOptions.expression[
        Math.floor(Math.random() * promptOptions.expression.length)
      ];
    newSelections.background =
      promptOptions.background[
        Math.floor(Math.random() * promptOptions.background.length)
      ];

    // Handle conditional options
    if (newSelections.gender === "Male") {
      newSelections.hair_style =
        promptOptions.hair_style_male[
          Math.floor(Math.random() * promptOptions.hair_style_male.length)
        ];
      newSelections.facial_hair =
        promptOptions.facial_hair[
          Math.floor(Math.random() * promptOptions.facial_hair.length)
        ];
    } else {
      newSelections.hair_style =
        promptOptions.hair_style_female[
          Math.floor(Math.random() * promptOptions.hair_style_female.length)
        ];
      newSelections.facial_hair = promptOptions.facial_hair[0]; // "None"
    }

    setSelectionStates(newSelections as SelectionState);
  };

  const handleReset = () => {
    setSelectionStates(getInitialState());
    setModelSettings(getDefaultModelSettings());
    setShowOutputModal(false);
    setGeneratedImageData(null);
    setError(null);
    setGeneratedPrompt("");
    localStorage.removeItem("studioSelections");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handleCloseModal = () => {
    setShowOutputModal(false);
    setGeneratedImageData(null);
    setError(null);
    setGeneratedPrompt("");
  };

  const handleDownload = () => {
    if (!generatedImageData) return;
    const link = document.createElement("a");
    link.href = generatedImageData;
    const mimeType = generatedImageData.split(":")[1].split(";")[0];
    const extension = mimeType.split("/")[1] || "png";
    link.download = `generated-image.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenImageInNewTab = async () => {
    if (!generatedImageData) return;

    try {
      // Fetch the blob from the data URL
      const response = await fetch(generatedImageData);
      const blob = await response.blob();
      
      // Create an object URL from the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Open the object URL in a new tab
      const newWindow = window.open(blobUrl, "_blank");

      if (newWindow) {
        // Optional: Revoke the object URL when the new tab is closed to free up memory
        newWindow.addEventListener('beforeunload', () => {
          URL.revokeObjectURL(blobUrl);
        });
      } else {
        // If popup was blocked, fall back to revoking immediately after a delay
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      console.error("Error opening image in new tab:", error);
      // Fallback for browsers that might have issues with fetch on data URLs
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(
          `<html><head><title>Generated Image</title></head><body style="margin:0; display:flex; justify-content:center; align-items:center; background-color:#222;"><img src="${generatedImageData}" style="max-width:100%; max-height:100vh;"></body></html>`
        );
        newWindow.document.close();
      }
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImageData(null);
    setShowOutputModal(true);

    const {
      age,
      gender,
      body_type,
      hair_style,
      hair_color,
      facial_hair,
      expression,
      background,
    } = selectionStates;

    let facialHairClause = "";
    if (gender === "Male" && facial_hair && facial_hair !== "None") {
      facialHairClause = `, with ${facial_hair.toLowerCase()} facial hair`;
    }

    let hairDescription =
      hair_style === "Bald"
        ? "a bald head"
        : `${hair_style.toLowerCase()} ${hair_color.toLowerCase()} hair`;

    let backgroundClause = "";
    switch (background) {
      case "Studio White":
        backgroundClause =
          "shot against a seamless, solid white background with bright, even studio lighting.";
        break;
      case "Studio Grey":
        backgroundClause =
          "shot against a seamless, solid light gray background with bright, even studio lighting.";
        break;
      case "Outdoor Park":
        backgroundClause =
          "shot against a tranquil park scene with lush greenery and soft, natural sunlight, creating a fresh and calm mood.";
        break;
      case "Urban Street":
        backgroundClause =
          "shot against a dynamic urban street scene with blurred city lights and modern architecture, creating an energetic and sophisticated mood.";
        break;
      case "Beach Sunset":
        backgroundClause =
          "shot against a serene beach at sunset with dramatic golden hour lighting and waves in the background, creating a romantic and peaceful mood.";
        break;
      default:
        backgroundClause =
          "shot against a seamless, solid light gray background with bright, even studio lighting.";
    }

    let constructedPrompt = "";
    if (selectedCategory === "headwear") {
      constructedPrompt = `A high-resolution, front-facing photorealistic portrait of a ${age.toLowerCase()} German ${gender.toLowerCase()} model with a ${body_type.toLowerCase()} build and fair skin. The model has ${hairDescription}${facialHairClause}, with their head upright and directly facing the camera in a neutral pose. The model is wearing a plain, form-fitting white t-shirt. The background is ${backgroundClause}. The facial expression is ${expression.toLowerCase()}. The model's hair is styled to be compatible with headwear. No headwear or accessories are present. This is a professional e-commerce catalog photo intended for virtual headwear try-on. Sharp focus, evenly lit, neutral background.`;
    } else {
      constructedPrompt = `A full-body, photorealistic photograph of a ${age.toLowerCase()} German ${gender.toLowerCase()} model with a ${body_type.toLowerCase()} build and fair skin. The model has ${hairDescription}${facialHairClause} and is wearing a plain, form-fitting white t-shirt and neutral grey shorts with simple white sneakers. The model is standing in a standard front-facing neutral pose, with arms relaxed at their sides, ${backgroundClause} The facial expression is ${expression.toLowerCase()}. The entire body, from head to toe, is visible in the frame. High-resolution, sharp focus, professional e-commerce catalogue image.`;
    }

    const trimmedPrompt = constructedPrompt.trim();
    setGeneratedPrompt(trimmedPrompt);

    const widthValue = parseDimension(modelSettings.width);
    const heightValue = parseDimension(modelSettings.height);
    const imageInputs = parseImageInputList(modelSettings.imageInput);
    const maxImages = Math.min(Math.max(Math.floor(modelSettings.maxImages || 1), 1), 15);

    const requestPayload: Record<string, unknown> = {
      prompt: trimmedPrompt,
      size: modelSettings.size,
      aspectRatio: modelSettings.aspectRatio,
      sequentialImageGeneration: modelSettings.sequentialImageGeneration,
      maxImages,
    };

    if (modelSettings.size === 'custom' && Number.isFinite(widthValue) && Number.isFinite(heightValue)) {
      requestPayload.width = widthValue;
      requestPayload.height = heightValue;
    }

    const limitedImageInputs = imageInputs.slice(0, 10);
    if (limitedImageInputs.length > 0) {
      requestPayload.imageInput = limitedImageInputs;
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate image");
      }

      if (result.imageData) {
        const mimeType = result.mimeType || "image/png";
        setGeneratedImageData(`data:${mimeType};base64,${result.imageData}`);
      } else {
        throw new Error("Image data not found in response");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "An unknown error occurred during generation.");
    } finally {
      setIsLoading(false);
    }
  };

  const isModelSettingsInvalid = () => {
    if (modelSettings.size === 'custom') {
      const widthValue = parseDimension(modelSettings.width);
      const heightValue = parseDimension(modelSettings.height);
      if (!Number.isFinite(widthValue) || widthValue < 1024 || widthValue > 4096) {
        return true;
      }
      if (!Number.isFinite(heightValue) || heightValue < 1024 || heightValue > 4096) {
        return true;
      }
    }

    if (modelSettings.sequentialImageGeneration === 'auto') {
      if (!Number.isFinite(modelSettings.maxImages) || modelSettings.maxImages < 1 || modelSettings.maxImages > 15) {
        return true;
      }
    }

    if (parseImageInputList(modelSettings.imageInput).length > 10) {
      return true;
    }

    return false;
  };

  const isGenerateDisabled = () => {
    if (!isMounted) return true;
    if (isLoading) return true;
    if (Object.values(selectionStates).some((val) => !val)) return true;
    return isModelSettingsInvalid();
  };

  const getHairStyleOptions = () => {
    return selectionStates.gender === "Male"
      ? promptOptions.hair_style_male
      : promptOptions.hair_style_female;
  };

  const renderSelect = (key: keyof SelectionState) => {
    let options: string[] = [];
    if (key === "hair_style") {
      options = getHairStyleOptions();
    } else {
      // This is a safe cast because we've handled the non-mappable keys
      options =
        promptOptions[key as keyof typeof promptOptions] || [];
    }

    const isDisabled =
      isLoading || (key === "facial_hair" && selectionStates.gender !== "Male");

    return (
      <div className="space-y-2" key={key}>
        <label className="text-sm font-medium">{keyToLabel(key)}</label>
        <Select
          value={selectionStates[key]}
          onValueChange={(value) => handleSelectionChange(key, value)}
          disabled={isDisabled}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={`Select ${keyToLabel(key).toLowerCase()}`}
            />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SharedNavbar variant="studio" />
      <div className="flex flex-1 bg-background pt-14">
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col items-center justify-start bg-muted/30 flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-6xl bg-card rounded-lg shadow-lg overflow-hidden flex flex-col p-6 space-y-6 mt-6 mb-6 min-h-[600px]"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold">Create New Model</h2>
                  <Button
                    onClick={handleReset}
                    disabled={isMounted && isLoading}
                    variant="outline"
                    size="icon"
                    title="Reset to defaults"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground mb-4">
                  Select character attributes to generate a model.
                </p>

                <div className="flex items-center justify-center space-x-6 mb-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="clothing"
                      checked={selectedCategory === "clothing"}
                      onCheckedChange={() => setSelectedCategory("clothing")}
                    />
                    <label
                      htmlFor="clothing"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Clothing
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="headwear"
                      checked={selectedCategory === "headwear"}
                      onCheckedChange={() => setSelectedCategory("headwear")}
                    />
                    <label
                      htmlFor="headwear"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Headwear
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="jewelry"
                      checked={selectedCategory === "jewelry"}
                      onCheckedChange={() => setSelectedCategory("jewelry")}
                    />
                    <label
                      htmlFor="jewelry"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Jewelry
                    </label>
                  </div>
                </div>

                <div className="mt-10 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Seedream 4 Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Adjust generation options for the Seedream 4 model.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Size</label>
                      <Select
                        value={modelSettings.size}
                        onValueChange={(value) => handleSizeChange(value as SizeOption)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Aspect Ratio</label>
                      <Select
                        value={modelSettings.aspectRatio}
                        onValueChange={(value) =>
                          updateModelSettings({ aspectRatio: value as AspectRatioOption })
                        }
                        disabled={isLoading || modelSettings.size === 'custom'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select aspect ratio" />
                        </SelectTrigger>
                        <SelectContent>
                          {aspectRatioOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sequential Generation</label>
                      <Select
                        value={modelSettings.sequentialImageGeneration}
                        onValueChange={(value) =>
                          setModelSettings((prev) => ({
                            ...prev,
                            sequentialImageGeneration: value as SequentialMode,
                            maxImages: value === 'auto'
                              ? Math.min(Math.max(prev.maxImages, 1), 15)
                              : 1,
                          }))
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {sequentialGenerationOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option === 'disabled' ? 'Disabled' : 'Auto'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Images</label>
                      <Input
                        type="number"
                        min={1}
                        max={15}
                        value={modelSettings.maxImages}
                        onChange={(event) => {
                          const parsed = Number(event.target.value);
                          if (Number.isFinite(parsed)) {
                            updateModelSettings({
                              maxImages: Math.min(Math.max(Math.floor(parsed), 1), 15),
                            });
                          }
                        }}
                        disabled={isLoading || modelSettings.sequentialImageGeneration !== 'auto'}
                      />
                      <p className="text-xs text-muted-foreground">
                        Only used when sequential generation is set to auto.
                      </p>
                    </div>
                  </div>

                  {modelSettings.size === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Width (px)</label>
                        <Input
                          type="number"
                          min={1024}
                          max={4096}
                          value={modelSettings.width}
                          onChange={(event) => updateModelSettings({ width: event.target.value })}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Height (px)</label>
                        <Input
                          type="number"
                          min={1024}
                          max={4096}
                          value={modelSettings.height}
                          onChange={(event) => updateModelSettings({ height: event.target.value })}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reference Image URLs</label>
                    <Textarea
                      value={modelSettings.imageInput}
                      onChange={(event) => updateModelSettings({ imageInput: event.target.value })}
                      placeholder="Optional: one URL per line or separated by commas"
                      disabled={isLoading}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Up to 10 image URLs for image-to-image guidance.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {dropdownOrder.map(renderSelect)}
                </div>

                <div className="mt-20 flex justify-between items-center">
                  <div className="flex-1" />
                  <div className="flex justify-center flex-1">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerateDisabled()}
                      className="gap-2 w-full sm:w-auto"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      {isLoading ? "Generating..." : "Generate Image"}
                    </Button>
                  </div>
                  <div className="flex-1 flex justify-end">
                    <Button
                      onClick={handleRandomise}
                      disabled={isMounted && isLoading}
                      variant="outline"
                      className="gap-2"
                    >
                      <Box className="h-4 w-4" />
                      Randomise
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {showOutputModal && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="bg-card border border-border/40 rounded-xl shadow-lg flex flex-col w-full max-w-6xl relative m-4"
                >
                  <div className="flex justify-between items-center p-5 border-b border-border/20">
                    <h2 className="text-xl font-semibold text-foreground">
                      Generated Model
                    </h2>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleDownload}
                        disabled={!generatedImageData || isLoading}
                        variant="secondary"
                        className="flex items-center justify-center gap-2 px-4"
                        title="Download Image"
                      >
                        <Download strokeWidth={2} />
                        <span>Download</span>
                      </Button>
                      <Button
                        onClick={handleCloseModal}
                        variant="outline"
                        className="flex items-center justify-center gap-2 px-4"
                        title="Close"
                      >
                        <X strokeWidth={2} />
                        <span>Close</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row p-5 gap-5">
                    <div className="md:w-1/2 flex flex-col">
                      <div className="aspect-square md:aspect-auto md:h-[500px] rounded-lg overflow-hidden bg-muted/10 flex items-center justify-center">
                        {isLoading && (
                          <div className="flex flex-col justify-center items-center h-full w-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                            <span className="text-muted-foreground text-sm">
                              Generating your image...
                            </span>
                          </div>
                        )}
                        {error && !isLoading && (
                          <div className="p-4 w-full max-w-md">
                            <Alert
                              variant="destructive"
                              className="border-destructive/20"
                            >
                              <Terminal className="h-4 w-4" />
                              <AlertTitle>Generation Failed</AlertTitle>
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          </div>
                        )}
                        {generatedImageData && !isLoading && !error && (
                          <img
                            src={generatedImageData}
                            alt={generatedPrompt || "Generated image"}
                            className="h-full w-full object-contain cursor-pointer"
                            onClick={handleOpenImageInNewTab}
                            title="Click to open image in new tab"
                          />
                        )}
                        {!isLoading && !generatedImageData && !error && (
                          <div className="text-center p-6">
                            <span className="text-muted-foreground text-sm">
                              Generated model will appear here
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:w-1/2 flex flex-col gap-4">
                      <div className="flex-grow">
                        <h3 className="text-sm font-medium mb-2 text-muted-foreground">
                          Generated Prompt
                        </h3>
                        <div className="bg-muted/30 rounded-md p-4 text-sm text-muted-foreground min-h-[300px] border border-border/10 overflow-y-auto">
                          {generatedPrompt ? (
                            <p className="text-justify whitespace-pre-wrap">
                              {generatedPrompt}
                            </p>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <span>Prompt will appear here</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto flex justify-center gap-4">
                        <Button
                          onClick={handleGenerate}
                          disabled={isLoading || !generatedPrompt}
                          variant="outline"
                          size="lg"
                          className="gap-2"
                          title="Generate a new image with the same prompt"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Retry
                        </Button>
                        <Button
                          className="gap-2"
                          size="lg"
                          variant="default"
                          disabled={isLoading || !generatedImageData}
                          title="Customize clothing for the generated model"
                        >
                          <Box className="h-4 w-4" />
                          Customize Clothing
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
