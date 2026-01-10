import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, ProjectState, SkyReplacement, LightsOnOffMode, DayToNightMode, AutoWhiteBalance } from "../types";
import { SYSTEM_INSTRUCTION_HEADER } from "../constants";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Map ENUM to Descriptive Prompts for AI
const SKY_DESCRIPTIONS: Record<string, string> = {
    'CLEAR_BLUE': "a CLEAR BLUE SKY with bright, crisp sunlight and minimal white clouds",
    'SOFT_OVERCAST': "a SOFT OVERCAST SKY with diffused white lighting, no harsh shadows",
    'GOLDEN_HOUR': "a GOLDEN HOUR SKY with warm sunset colors (orange, pink) and low-angle lighting",
    'DRAMATIC_CLOUDY': "a DRAMATIC CLOUDY SKY with deep blue contrast and cinematic cloud formations",
    'NIGHT_LUXURY': "a DEEP BLUE HOUR NIGHT SKY with visible stars and luxury evening atmosphere"
};

const formatOptionsForPrompt = (options: ProcessingOptions): string => {
  const instructions: string[] = [];

  // --- 0. SPECIAL MODE: WINDOWLESS INTERIOR ---
  if (options.OptimizeInterior) {
      instructions.push(`
      - TASK: WINDOWLESS INTERIOR OPTIMIZATION (PRIORITY: CRITICAL)
      - LIGHTING STRATEGY: SIMULATE STUDIO STROBE LIGHTING.
      - ACTION: Flood the room with soft, diffuse light. Eliminate ALL dark corners and heavy shadows.
      - SURFACES: Ensure wall colors are perfectly consistent (remove gradient falloff).
      - GOAL: A bright, airy, high-key commercial real estate photo.
      `);
  }

  // --- 1. LIGHTING, HDR & TONE (MOVED UP FOR BETTER IMPACT) ---
  
  // A. WHITE BALANCE (TONE)
  if (options.AutoWhiteBalance === AutoWhiteBalance.WARM) {
      instructions.push(`
      - TASK: COLOR GRADING (WARM)
      - ACTION: Shift White Balance to WARMER tones (approx 4000K-4500K).
      - VIBE: Cozy, inviting, residential warmth. Add golden hues to highlights.
      `);
  } else if (options.AutoWhiteBalance === AutoWhiteBalance.COOL) {
      instructions.push(`
      - TASK: COLOR GRADING (COOL)
      - ACTION: Shift White Balance to COOLER tones (approx 6000K+).
      - VIBE: Modern, crisp, sterile, clean. Enhance blues and pure whites.
      `);
  } else {
      // Default: Architectural Neutral
      instructions.push(`
      - TASK: COLOR CORRECTION (NEUTRAL)
      - ACTION: REMOVE ALL COLOR CASTS.
      - REQUIREMENT: White walls must be PURE WHITE (RGB 255,255,255). Gray concrete must be NEUTRAL GRAY.
      - FIX: Remove yellow/orange tints from artificial lights and blue tints from shadows.
      `);
  }

  // B. HDR / EXPOSURE (THE "REAL EFFECT" LOGIC)
  if (options.AutoHDRBatch !== 'OFF') {
      let hdrPrompt = "";
      switch (options.AutoHDRBatch) {
          case 'LOW':
              hdrPrompt = `
              - MODE: NATURAL BALANCED EXPOSURE
              - ACTION: Gently lift deep shadows to reveal details.
              - HIGHLIGHTS: Recover blown-out windows slightly.
              - CONTRAST: Maintain natural contrast ratio.
              `;
              break;
          case 'MEDIUM':
              hdrPrompt = `
              - MODE: COMMERCIAL REAL ESTATE HDR
              - ACTION: APPLY EXPOSURE FUSION. Blend multiple exposures.
              - SHADOWS: Brighten all dark areas significantly. No "crushed blacks" allowed.
              - WINDOWS: Compress highlights so exterior views are clearly visible through windows.
              `;
              break;
          case 'STRONG':
              hdrPrompt = `
              - MODE: "FLAMBIENT" STYLE (FLASH + AMBIENT)
              - ACTION: SIMULATE FLASH FILL LIGHTING.
              - SHADOWS: AGGRESSIVELY BRIGHTEN SHADOWS. The room should look evenly lit from corner to corner.
              - CLARITY: Maximize local contrast and texture details.
              - GOAL: A super-bright, high-impact marketing image with zero dark spots.
              `;
              break;
      }
      instructions.push(`
      - TASK: DYNAMIC RANGE & EXPOSURE
      ${hdrPrompt}
      `);
  }

  // --- 2. CLEANING & RESTORATION ---
  
  // Floor/Paving
  if (options.CleanPaving !== 'LOW') {
      const adjective = options.CleanPaving === 'STRONG' ? "AGGRESSIVELY" : "CAREFULLY";
      instructions.push(`
      - TASK: PAVEMENT RESTORATION
      - ACTION: ${adjective} clean the driveway, sidewalk, and floor surfaces.
      - TARGET: Remove ALL black water stains, oil spots, moss, mud, and blotchy discoloration.
      - GOAL: Make the pavement/floor look completely DRY, CLEAN, and UNIFORM in color tone.
      - SAFETY: Preserve the texture of the material (concrete/stone/tile). Do not blur.
      `);
  }

  // Trash & Wires
  if (options.CleanTrash) {
    instructions.push("- TASK: REMOVE TRASH. Delete all litter, plastic bags, construction debris, and loose leaves on the ground.");
  }
  if (options.RemovePowerLines) {
    instructions.push("- TASK: REMOVE WIRES. Delete all overhead power lines, telephone cables, and distracting wires crossing the sky or building.");
  }
  if (options.RemoveSensorSpots) {
    instructions.push("- TASK: SENSOR CLEANING. Remove digital sensor dust spots and lens specks.");
  }
  
  // Walls
  if (options.CleanWalls !== 'LOW') {
      instructions.push("- TASK: CLEAN WALLS. Remove dirt streaks, mold, and water stains from the building facade. Make the paint/material look fresh.");
  }

  // Soft Surfaces
  if (options.SmoothSoftSurfaces !== 'OFF') {
      instructions.push("- TASK: IRONING. Smooth out wrinkles on bedsheets, curtains, and sofas.");
  }

  // --- 3. GEOMETRY ---
  if (options.AutoPerspectiveCorrection || options.AutoVerticals) {
      instructions.push(`
      - TASK: GEOMETRY CORRECTION
      - ACTION: Straighten all vertical lines.
      - REQUIREMENT: Vertical lines (pillars, corners) must be 90 DEGREES vertical.
      - REQUIREMENT: Fix perspective distortion (Keystoning). The building must stand up straight.
      `);
  }

  // --- 4. SKY & ATMOSPHERE ---
  
  const currentSky = options.SkyReplacement;
  
  if (currentSky === SkyReplacement.NIGHT_LUXURY) {
      instructions.push(`
      - TASK: NIGHT LUXURY TRANSFORMATION
      - ACTION: Change the time of day to EVENING/NIGHT.
      - SKY: ${SKY_DESCRIPTIONS['NIGHT_LUXURY']}.
      - LIGHTING: Turn ON all interior lights (Warm 3000K) and exterior garden lights.
      - MOOD: High-end, expensive, cozy.
      - CONSTRAINT: Keep the original city skyline/background visible, do not replace it with generic mountains.
      `);
  } else if (currentSky !== SkyReplacement.OFF) {
      const skyDesc = SKY_DESCRIPTIONS[currentSky] || "a nice sky";
      instructions.push(`
      - TASK: SKY REPLACEMENT
      - SCOPE: REPLACE ONLY THE SKY PIXELS.
      - CRITICAL CONSTRAINT: PRESERVE ALL DISTANT BACKGROUND DETAILS (distant houses, buildings, mountains, trees, city skyline).
      - INSTRUCTION: Mask the sky precisely. Do NOT replace the background landscape or distant buildings.
      - ACTION: Replace the sky with ${skyDesc}.
      - RELIGHTING: Adjust the lighting on the building/landscape to match the new ${currentSky} lighting conditions.
      - INTEGRATION: Ensure tree leaves and edges against the sky are masked perfectly (Fine detail).
      `);
      
      if (options.SkyStrength < 100) {
           instructions.push(`- BLENDING: Blend the new sky ${options.SkyStrength}% with the original.`);
      }
  }

  // Lighting adjustments (if not Night Luxury)
  if (currentSky !== SkyReplacement.NIGHT_LUXURY) {
      // 1. Lights Logic
      if (options.LightsOnOffMode === LightsOnOffMode.ON) {
          instructions.push("- LIGHTS: Turn ON interior lights (Window glow) to make the house look inhabited.");
      } else if (options.LightsOnOffMode === LightsOnOffMode.OFF) {
          instructions.push("- LIGHTS: Turn OFF interior lights.");
      }
      
      // 2. Time of Day Logic
      if (options.DayToNightMode !== DayToNightMode.OFF) {
          switch (options.DayToNightMode) {
              case DayToNightMode.MORNING:
                  instructions.push("- TIME: Change time to MORNING. Soft, bright, cool-toned daylight. Long soft shadows.");
                  break;
              case DayToNightMode.NOON:
                  instructions.push("- TIME: Change time to NOON. Harsh, direct overhead sunlight. High contrast, short shadows.");
                  break;
              case DayToNightMode.AFTERNOON:
                  instructions.push("- TIME: Change time to AFTERNOON. Warm, sunny, clear visibility. Angled sunlight.");
                  break;
              case DayToNightMode.GOLDEN_HOUR:
                  instructions.push("- TIME: Change time to GOLDEN HOUR. Sunset lighting, deep orange/gold glow, long dramatic shadows.");
                  break;
              case DayToNightMode.BLUE_HOUR:
                  instructions.push("- TIME: Change time to BLUE HOUR. Twilight, deep blue sky, mixture of residual natural light and artificial lights.");
                  break;
              case DayToNightMode.NIGHT:
                  instructions.push("- TIME: Change time to NIGHT. Dark sky, rely mostly on artificial/street lighting.");
                  break;
          }
      }
  }

  // --- 5. STAGING (People/Cars) ---
  if (options.AddPeople !== 'OFF') {
      const count = options.AddPeople === 'HIGH' ? "many" : "a few";
      instructions.push(`- STAGING: Add ${count} photorealistic people (${options.PeopleStyle} style) interacting naturally with the space.`);
  }
  if (options.Vehicles !== 'OFF') {
      instructions.push("- STAGING: Add realistic luxury cars parked in appropriate spots.");
  }

  // --- 6. FINAL POLISH ---
  if (options.CPLFilterEffect) {
      instructions.push(`
      - TASK: CPL FILTER (POLARIZER EFFECT)
      - ACTION: AGGRESSIVELY REMOVE REFLECTIONS from glass windows and water.
      - GLASS: Make windows TRANSPARENT. Reveal the interior furniture and lighting clearly (See-through).
      - FIX: Eliminate white glare, sky reflections, and environmental noise on the glass facade.
      - WATER: Reduce surface shimmer to show depth.
      `);
  }

  return instructions.join('\n');
};

export const processImageWithGemini = async (
  file: File,
  projectState: ProjectState,
  maskData?: string // Optional: Dữ liệu mặt nạ vẽ tay
): Promise<string> => {
  const ai = getClient();
  const base64Data = await fileToBase64(file);
  const mimeType = file.type || 'image/jpeg';
  
  // Ensure we are using the Pro Image model
  const modelId = 'gemini-3-pro-image-preview';
  
  // Construct image configuration with mandated Resolution (2K or 4K)
  const imageSize = projectState.options.Resolution; // '2K' | '4K'
  const aspectRatio = projectState.options.AspectRatio !== 'ORIGINAL' ? projectState.options.AspectRatio : undefined;

  // Build the configuration object
  const requestConfig: any = {
      imageConfig: {
          imageSize: imageSize,
          // If aspect ratio is provided (not original), set it. Otherwise leave undefined to attempt original or 1:1 fallback in model defaults if needed, 
          // though for image editing tasks, preserving original aspect is usually handled by not specifying or using mask, 
          // but here we send it if explicitly requested in UI.
          ...(aspectRatio && { aspectRatio: aspectRatio })
      }
  };
  
  let promptParts: any[] = [];

  // Tình huống 1: Manual Masking (Vẽ tay)
  if (maskData) {
      const manualPrompt = `
      ${SYSTEM_INSTRUCTION_HEADER}

      MODE: MANUAL INPAINTING / OBJECT REMOVAL
      
      INPUTS:
      1. Original Image.
      2. Mask Image (Red strokes).
      
      INSTRUCTIONS:
      - Remove ONLY the objects covered by the RED MASK.
      - Inpaint the background texture seamlessly.
      - Do NOT change other parts of the image.
      `;

      promptParts = [
          { text: manualPrompt },
          { inlineData: { mimeType: mimeType, data: base64Data } }, 
          { inlineData: { mimeType: 'image/png', data: maskData.split(',')[1] } }
      ];
  } 
  // Tình huống 2: Batch Processing (Xử lý hàng loạt)
  else {
      const optionsPrompt = formatOptionsForPrompt(projectState.options);
      
      const prompt = `
${SYSTEM_INSTRUCTION_HEADER}

--- INPUT IMAGE ---
(See attached image)

--- PROJECT CONTEXT ---
${projectState.projectContext || 'Architectural Photography'}

--- EDITING INSTRUCTIONS (EXECUTE STRICTLY) ---
${optionsPrompt}

--- USER NOTES ---
${projectState.extraPrompt || ''}

--- GLOBAL CONSTRAINT ---
MAINTAIN ABSOLUTE PHOTOREALISM. The output must look like a real photograph taken with a high-end camera. Do not introduce painterly effects or CGI artifacts.

--- OUTPUT REQUIREMENT ---
Generate a high-resolution (${imageSize}) photorealistic image.
      `;

      promptParts = [
          { text: prompt },
          { inlineData: { mimeType: mimeType, data: base64Data } }
      ];
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts: promptParts }],
      config: requestConfig
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          // The data returned here respects the 'imageSize' config (2K/4K)
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data returned from Gemini.");
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};