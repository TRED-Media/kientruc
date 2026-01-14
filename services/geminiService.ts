
import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, ProjectState, SkyReplacement } from "../types";
import { SYSTEM_INSTRUCTION_HEADER } from "../constants";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Lỗi Deploy: Không tìm thấy API KEY. Vui lòng cấu hình biến môi trường process.env.API_KEY hoặc chọn Key qua UI.");
  }
  return new GoogleGenAI({ apiKey });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

// AUTO DETECT ASPECT RATIO to avoid 1:1 cropping
const getBestAspectRatio = (width: number, height: number): string => {
    const ratio = width / height;
    if (ratio >= 1.6) return '16:9'; 
    if (ratio >= 1.2) return '4:3';
    if (ratio >= 0.9) return '1:1';
    if (ratio >= 0.6) return '3:4'; 
    return '9:16';
};

const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => resolve({ width: 1000, height: 1000 }); // Fallback
        img.src = URL.createObjectURL(file);
    });
};

const formatOptionsForPrompt = (options: ProcessingOptions): string => {
  const tasks: string[] = [];

  // 1. GEOMETRY
  if (options.AutoVerticals) tasks.push("- Làm thẳng tường và cột (Verticals).");
  if (options.AutoPerspectiveCorrection) tasks.push("- Cân đối phối cảnh.");

  // 2. CLEANING - SAFE WORDS
  if (options.CleanWalls !== 'OFF') {
      const strength = options.CleanWalls === 'STRONG' ? "Phục hồi kỹ thuật số (Digital Restoration)" : "Làm sạch";
      tasks.push(`- Tường: ${strength}. Loại bỏ mốc/bẩn. Giữ nguyên màu sơn gốc. Phân tích bề mặt và tái tạo độ mịn.`);
  }
  if (options.CleanPaving !== 'OFF') {
      tasks.push(`- Sàn/Nền: Làm sạch vết ố, làm mới ron gạch. Giữ nguyên vật liệu.`);
  }
  if (options.CleanTrash) tasks.push("- Xóa rác và vật thể lạ trên sàn.");
  if (options.RemovePowerLines) tasks.push("- Xóa dây điện.");

  // 3. LIGHTING
  if (options.AutoHDRBatch !== 'OFF') tasks.push("- Auto HDR: Cân bằng sáng tối.");
  if (options.LightsOnOffMode === 'ON') tasks.push("- Bật đèn nội thất.");
  
  // 4. SKY
  if (options.SkyReplacement !== 'OFF') {
      const sky = options.SkyReplacement === 'CUSTOM' ? options.SkyCustomPrompt : options.SkyReplacement;
      tasks.push(`- Thay bầu trời: ${sky}. Match ánh sáng.`);
  }

  return tasks.join('\n');
};

export const processImageWithGemini = async (
  file: File,
  projectState: ProjectState,
  maskData?: string,
  maskPrompt?: string
): Promise<string> => {
  const ai = getClient();
  const base64Data = await fileToBase64(file);
  const mimeType = file.type || 'image/jpeg';
  const modelId = 'gemini-3-pro-image-preview';
  
  // Auto Aspect Ratio
  let aspectRatio = projectState.options.AspectRatio !== 'ORIGINAL' ? projectState.options.AspectRatio : undefined;
  if (!aspectRatio) {
      const dims = await getImageDimensions(file);
      aspectRatio = getBestAspectRatio(dims.width, dims.height) as any;
  }

  const requestConfig: any = {
      imageConfig: {
          imageSize: projectState.options.Resolution,
          ...(aspectRatio && { aspectRatio: aspectRatio })
      },
      // Use permissive safety settings to prevent false positives on architecture
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
  };
  
  let promptParts: any[] = [];

  if (maskData) {
      // EDIT MODE
      const instruction = maskPrompt 
        ? `GENERATIVE FILL: Tại vùng mask đỏ, hãy vẽ: "${maskPrompt}".` 
        : `REMOVE OBJECT: Xóa vật thể trong vùng mask đỏ. Inpaint nền.`;
      
      promptParts = [
          { inlineData: { mimeType, data: base64Data } },
          { inlineData: { mimeType: 'image/png', data: maskData.split(',')[1] } },
          { text: SYSTEM_INSTRUCTION_HEADER + "\n" + instruction }
      ];
  } else {
      // GENERATE MODE
      const tasks = formatOptionsForPrompt(projectState.options);
      const fullPrompt = `${SYSTEM_INSTRUCTION_HEADER}\n\nNHIỆM VỤ:\n${tasks}\n\nGhi chú thêm: ${projectState.extraPrompt || 'Không'}`;
      
      promptParts = [
          { inlineData: { mimeType, data: base64Data } },
          { text: fullPrompt }
      ];
  }

  try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: [{ parts: promptParts }],
        config: requestConfig
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      throw new Error("AI không trả về ảnh. Có thể do lỗi Prompt hoặc Server quá tải.");
  } catch (error: any) {
      console.error("Gemini Error:", error);
      // Nice error message for users
      if (error.message.includes('API Key')) throw new Error("Chưa có API Key. Vui lòng kiểm tra cấu hình.");
      if (error.status === 503) throw new Error("Server Gemini đang bận (503). Vui lòng thử lại sau 30s.");
      throw error;
  }
};
