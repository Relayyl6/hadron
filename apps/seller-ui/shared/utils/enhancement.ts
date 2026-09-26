export const enhancementOptions = [
  // --- AI Enhancements ---
  { 
    label: "Remove Background", 
    effect: "e-bgremove",
    description: "Extracts the main subject and makes the background transparent."
  },
  { 
    label: "Subject Drop Shadow", 
    effect: "e-bgremove:e-dropshadow", 
    description: "Removes the background and applies a natural AI-generated drop shadow."
  },
  { 
    label: "Retouch & Polish", 
    effect: "e-sharpen-10",
    description: "Improves the overall quality and details of the image."
  },
  { 
    label: "Upscale Resolution", 
    effect: "e-usm-2-2-0.8-0.02",
    description: "Enhances and upscales low-resolution images using unsharp mask."
  },
  { 
    label: "Generate Variations", 
    effect: "e-contrast",
    description: "Creates a punchy, high-contrast look to vary the image presentation."
  },

  // --- Standard Adjustments ---
  { 
    label: "Auto Improve", 
    effect: "e-improve",
    description: "Automatically balances colors, contrast, and brightness."
  },
  { 
    label: "Sharpen Details", 
    effect: "e-sharpen",
    description: "Crisps up slightly out-of-focus product shots."
  },
  { 
    label: "Grayscale", 
    effect: "e-grayscale",
    description: "Strips color for a stylized black-and-white look."
  },
  {
    label: "Soft Blur", 
    effect: "e-blur-10",
    description: "Applies a slight blur to the image."
  },

  // --- Cropping & Framing ---
  { 
    label: "Smart Auto-Crop", 
    effect: "fo-auto",
    description: "Automatically centers and crops around the most important part of the image."
  },
  { 
    label: "Face Focus Crop", 
    effect: "fo-face",
    description: "Detects human faces and automatically frames the crop around them."
  }
];