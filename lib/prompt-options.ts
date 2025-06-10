export const promptOptions = {
  gender: ["Male", "Female"],
  hair_color: [
    "Black",
    "Dark Brown",
    "Brown",
    "Blonde",
    "Red",
    "Gray",
    "Salt and Pepper",
  ],
  hair_style_male: [
    "Buzz Cut",
    "Short",
    "Medium",
    "Slicked Back",
    "Man Bun",
    "Bald",
  ],
  hair_style_female: [
    "Pixie Cut",
    "Short Bob",
    "Shoulder Length",
    "Long",
    "Ponytail",
    "Bun",
    "Bald",
  ],
  facial_hair: [
    "None",
    "Light Stubble",
    "Goatee",
    "Mustache",
    "Short Beard",
  ],
  body_type: ["Slim", "Athletic", "Average"],
  age: ["Young Adult", "Adult", "Middle-aged"],
  expression: ["Neutral", "Soft smile", "Serious"],
  background: [
    "Studio White",
    "Studio Grey",
    "Outdoor Park",
    "Urban Street",
    "Beach Sunset",
  ],
};

export type PromptOptionsKey = keyof typeof promptOptions;
