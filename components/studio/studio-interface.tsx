"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Wand2, Loader2, Download, X, Dice5, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { SharedNavbar } from "@/components/shared/shared-navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { promptOptions, PromptOptionsKey } from "@/lib/prompt-options";

// Helper function to capitalize first letter for display
const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Helper function to create a label from a key
const keyToLabel = (key: string) => {
  return key.split("_").map(capitalizeFirstLetter).join(" ");
};

export function StudioInterface() {
  // State for image generation
  const [selectionStates, setSelectionStates] = useState<
    Record<PromptOptionsKey, string>
  >(() => {
    const initialStates: Record<string, string> = {};
    (Object.keys(promptOptions) as Array<PromptOptionsKey>).forEach((key) => {
      if (Array.isArray(promptOptions[key])) {
        initialStates[key] = (promptOptions[key] as string[])[0];
      }
    });
    return initialStates;
  });

  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageData, setGeneratedImageData] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [showOutputModal, setShowOutputModal] = useState(false);

  const handleSelectionChange = (key: PromptOptionsKey, value: string) => {
    setSelectionStates((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    // Reset facial hair if gender changes from Male
    if (
      selectionStates.gender !== "Male" &&
      selectionStates.facial_hair !== promptOptions.facial_hair[0]
    ) {
      setSelectionStates((prev) => ({
        ...prev,
        facial_hair: promptOptions.facial_hair[0],
      }));
    }
  }, [selectionStates.gender, selectionStates.facial_hair]);

  const handleRandomise = () => {
    const newSelections: Partial<Record<PromptOptionsKey, string>> = {};
    let randomisedGender = "";

    (Object.keys(promptOptions) as Array<PromptOptionsKey>).forEach((key) => {
      const optionsArray = promptOptions[key] as string[];
      if (Array.isArray(optionsArray) && optionsArray.length > 0) {
        if (key === "facial_hair") {
          // Skip facial_hair for now, handle it after gender is determined
          return;
        }
        const randomIndex = Math.floor(Math.random() * optionsArray.length);
        const randomValue = optionsArray[randomIndex];
        newSelections[key] = randomValue;
        if (key === "gender") {
          randomisedGender = randomValue;
        }
      }
    });

    // Handle facial_hair based on the randomised gender
    if (randomisedGender === "Male") {
      const facialHairOptions = promptOptions.facial_hair as string[];
      const randomIndex = Math.floor(Math.random() * facialHairOptions.length);
      newSelections["facial_hair"] = facialHairOptions[randomIndex];
    } else {
      // If gender is not Male, set facial_hair to the default "None"
      newSelections["facial_hair"] = promptOptions.facial_hair[0]; 
    }

    setSelectionStates(newSelections as Record<PromptOptionsKey, string>);
  };

  const handleReset = () => {
    setGeneratedImageData(null);
    setError(null);
    // Reset all selections to their default values
    const initialStates: Record<string, string> = {};
    (Object.keys(promptOptions) as Array<PromptOptionsKey>).forEach((key) => {
      if (Array.isArray(promptOptions[key])) {
        initialStates[key] = (promptOptions[key] as string[])[0];
      }
    });
    setSelectionStates(initialStates);
    setAspectRatio("1:1");
    setGeneratedPrompt("");
    setShowOutputModal(false);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
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

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImageData(null);
    setShowOutputModal(true);

    // Construct the prompt from selections
    let constructedPrompt = "";
    const {
      pose_level,
      camera_perspective,
      age,
      ethnicity,
      gender,
      skin_tone,
      hair_style,
      hair_color,
      facial_hair,
      pose,
      hand_position,
      expression,
      background,
    } = selectionStates;

    let facialHairClause = "";
    if (gender === "Male" && facial_hair && facial_hair !== "None") {
      facialHairClause = `, ${facial_hair.toLowerCase()} facial hair`;
    } else if (gender === "Male" && hair_style === "Bald" && facial_hair && facial_hair !== "None") {
      // Specific case for bald men with facial hair
      facialHairClause = `, with ${facial_hair.toLowerCase()} facial hair`;
    } else if (gender === "Male" && facial_hair && facial_hair !== "None") {
      facialHairClause = ` and ${facial_hair.toLowerCase()} facial hair`;
    }


    // Adjust hair description for baldness
    let hairDescription = "";
    if (hair_style === "Bald") {
      hairDescription = "a bald head";
    } else {
      hairDescription = `${hair_style.toLowerCase()} ${hair_color.toLowerCase()} hair`;
    }

    constructedPrompt = `A ${pose_level?.toLowerCase()}, ${camera_perspective?.toLowerCase()} photo of a ${age?.toLowerCase()} ${ethnicity?.toLowerCase()} ${gender?.toLowerCase()} model with ${skin_tone?.toLowerCase()} skin, ${hairDescription}${facialHairClause}. The model is wearing minimal, neutral base clothing, posed in a ${pose?.toLowerCase()} with hands ${hand_position
      ?.toLowerCase()
      .replace("at sides", "at their sides")}. ${expression?.toLowerCase()} facial expression, set against a ${background?.toLowerCase()} background with professional studio lighting. High-resolution e-commerce catalog-style image.`;
    
    // Clean up potential double commas or leading/trailing commas/spaces if some values are empty, though with current setup most should be pre-filled.
    constructedPrompt = constructedPrompt.replace(/,\s*,/g, ',').replace(/,\s*\./g, '.').trim();


    setGeneratedPrompt(constructedPrompt);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: constructedPrompt,
          aspectRatio,
        }),
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

  const isGenerateDisabled = () => {
    // Check if any of the required fields are empty or not set to a default
    // For simplicity, let's assume all fields from promptOptions (excluding facial_hair logic handled elsewhere)
    // must have a selection.
    // This can be refined based on actual "required" fields for a coherent prompt.
    const hasAllSelections = (
      Object.keys(promptOptions) as Array<PromptOptionsKey>
    ).every((key) => {
      if (key === "facial_hair" && selectionStates.gender !== "Male")
        return true; // Skip facial hair if not male
      return !!selectionStates[key];
    });
    return isLoading || !hasAllSelections;
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
                <h2 className="text-2xl font-bold mb-2">Create New Model</h2>
                <p className="text-muted-foreground mb-4">
                  Select character attributes to generate a model.
                </p>

                {/* --- Dynamic Selects for Character Attributes & Aspect Ratio --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  {(Object.keys(promptOptions) as Array<PromptOptionsKey>).map(
                    (key) => {
                      if (key === "facial_hair") {
                        const isDisabled =
                          isLoading || selectionStates.gender !== "Male";
                        return (
                          <div className="space-y-2" key={key}>
                            <label className="text-sm font-medium">
                              {keyToLabel(key)}
                            </label>
                            <Select
                              value={selectionStates[key]}
                              onValueChange={(value) =>
                                handleSelectionChange(key, value)
                              }
                              disabled={isDisabled}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={`Select ${keyToLabel(
                                    key
                                  ).toLowerCase()}`}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {promptOptions.facial_hair.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      }
                      const options = promptOptions[key] as string[];
                      return (
                        <div className="space-y-2" key={key}>
                          <label className="text-sm font-medium">
                            {keyToLabel(key)}
                          </label>
                          <Select
                            value={selectionStates[key]}
                            onValueChange={(value) =>
                              handleSelectionChange(key, value)
                            }
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={`Select ${keyToLabel(
                                  key
                                ).toLowerCase()}`}
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
                    }
                  )}
                  {/* --- Aspect Ratio Select (Moved Here) --- */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Aspect Ratio</label>
                    <Select
                      value={aspectRatio}
                      onValueChange={(value) => setAspectRatio(value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select aspect ratio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">Square (1:1)</SelectItem>
                        <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                        <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                        <SelectItem value="4:3">Standard (4:3)</SelectItem>
                        <SelectItem value="3:4">Photo (3:4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* --- Generate Button --- */}
                <div className="mt-6 flex justify-between items-center">
                  <div className="flex-1 flex justify-start">
                    <Button
                      onClick={handleRandomise}
                      disabled={isLoading}
                      variant="outline"
                      className="gap-2"
                    >
                      <Box className="h-4 w-4" />
                      Randomise
                    </Button>
                  </div>
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
                  <div className="flex justify-end flex-1">
                    {/* Reset button removed from here */}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* --- Output Area --- */}
            {showOutputModal && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="bg-card border border-border/40 rounded-lg shadow-2xl flex flex-col p-6 w-full max-w-5xl relative max-h-[95vh] animate-in fade-in-0 zoom-in-95"
                >
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-border/30">
                    <h2 className="text-2xl font-bold text-foreground">Generated Model</h2>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleDownload}
                        disabled={!generatedImageData || isLoading}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={handleReset}
                        disabled={isLoading}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        title="Reset"
                      >
                        <Box className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
                    {/* Image Section - Left Side */}
                    <div className="md:w-2/3 flex flex-col">
                      {/* Loading State */}
                      {isLoading && (
                        <div className="flex flex-col justify-center items-center p-10 rounded-md border border-dashed border-muted-foreground/20 h-full bg-card/50">
                          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                          <span className="text-muted-foreground">
                            Generating your image...
                          </span>
                        </div>
                      )}

                      {/* Error State */}
                      {error && !isLoading && (
                        <Alert variant="destructive" className="border border-destructive/20 shadow-sm">
                          <Terminal className="h-4 w-4" />
                          <AlertTitle>Generation Failed</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      {/* Success State - Display Image */}
                      {generatedImageData && !isLoading && !error && (
                        <div className="flex items-center justify-center h-full bg-accent/5 p-4 rounded-lg border border-accent/20 shadow-md overflow-hidden">
                          <img
                            src={generatedImageData}
                            alt={generatedPrompt || "Generated image"}
                            className="max-w-full max-h-full object-contain rounded-md shadow-sm"
                          />
                        </div>
                      )}

                      {/* Placeholder State */}
                      {!isLoading && !generatedImageData && !error && (
                        <div className="flex justify-center items-center p-10 rounded-md border border-dashed border-muted-foreground/30 h-full bg-muted/10">
                          <span className="text-muted-foreground">
                            Generated model will be shown here.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Side Column - Prompt & Actions */}
                    <div className="md:w-1/3 flex flex-col gap-4">
                      {/* Prompt Section */}
                      <div className="flex-1">
                        {generatedPrompt && !isLoading ? (
                          <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground h-full overflow-y-auto shadow-sm">
                            <h3 className="font-medium mb-2 text-center">PROMPT</h3>
                            <p>{generatedPrompt}</p>
                          </div>
                        ) : (
                          <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground h-full flex items-center justify-center">
                            <span>{isLoading ? "Generating prompt..." : "Prompt will appear here"}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      <div className="mt-auto">
                        <Button className="w-full p-4" size="lg">
                          Put Clothes/Articles
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
