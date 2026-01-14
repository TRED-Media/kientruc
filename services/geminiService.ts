import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, ProjectState, SkyReplacement } from "../types";
import { SYSTEM_INSTRUCTION_HEADER } from "../constants";

const getClient = () => {
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  const apiKey = process.env.API_KEY;
  
  // Log trạng thái (Chỉ log 4 ký tự cuối để bảo mật trên Console Production)
  if (apiKey) {
      const maskedKey = apiKey.length > 8 
        ? `******${apiKey.slice(-4)}` 
        : '******';
      console.log("[GeminiService] API Key Status: Present", maskedKey);
  } else {
      console.error("[GeminiService] API Key Status: MISSING. Environment variables not injected correctly.");
  }

  // Assume variable is pre-configured, valid, and accessible.
  // We throw if missing to fail fast, but we rely on injection.
  if (!apiKey) {
    throw new Error("Missing API_KEY in environment.");
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

// Auto Aspect Ratio Detection
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
        img.onerror = () => resolve({ width: 1000, height: 1000 });
        img.src = URL.createObjectURL(file);
    });
};

const formatOptionsForPrompt = (options: ProcessingOptions): string => {
  const tasks: string[] = [];

  // 1. GEOMETRY
  if (options.AutoVerticals) tasks.push("- GEOMETRY: Làm thẳng tường và cột (Verticals correction).");
  if (options.AutoPerspectiveCorrection) tasks.push("- PERSPECTIVE: Cân đối phối cảnh 3D.");

  // 2. CLEANING (Sử dụng từ ngữ an toàn)
  if (options.CleanWalls !== 'OFF') {
      const strength = options.CleanWalls === 'STRONG' ? "Phục hồi kỹ thuật số (Digital Restoration)" : "Làm sạch bề mặt";
      tasks.push(`- WALLS: ${strength}. Phân tích và xử lý bề mặt tường cũ, mốc. Giữ nguyên màu sơn gốc.`);
  }
  if (options.CleanPaving !== 'OFF') {
      tasks.push(`- FLOORS: Làm sạch sàn, xử lý vết ố. Giữ nguyên vật liệu.`);
  }
  if (options.CleanTrash) tasks.push("- CLEANING: Xóa rác và vật thể thừa.");
  if (options.RemovePowerLines) tasks.push("- REMOVAL: Xóa dây điện.");

  // 3. LIGHTING
  if (options.AutoHDRBatch !== 'OFF') tasks.push("- LIGHTING: Auto HDR, cân bằng sáng tối, giữ chi tiết.");
  if (options.LightsOnOffMode === 'ON') tasks.push("- INTERIOR LIGHTS: Bật đèn nội thất để tăng sự ấm cúng.");
  
  // 4. SKY
  if (options.SkyReplacement !== 'OFF') {
      const sky = options.SkyReplacement === 'CUSTOM' ? options.SkyCustomPrompt : options.SkyReplacement;
      tasks.push(`- SKY REPLACEMENT: Thay bầu trời thành '${sky}'. Match ánh sáng tiền cảnh.`);
  }

  // 5. STAGING
  if (options.AddPeople !== 'OFF') {
     tasks.push(`- STAGING: Thêm người (${options.AddPeople}, phong cách ${options.PeopleStyle}) tương tác tự nhiên.`);
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
  
  // Tính toán tỷ lệ ảnh
  let aspectRatio = projectState.options.AspectRatio !== 'ORIGINAL' ? projectState.options.AspectRatio : undefined;
  if (!aspectRatio) {
      const dims = await getImageDimensions(file);
      aspectRatio = getBestAspectRatio(dims.width, dims.height) as any;
  }

  const requestConfig: any = {
      imageConfig: {
          imageSize: projectState.options.Resolution,
          // Chỉ thêm aspectRatio nếu có giá trị hợp lệ
          ...(aspectRatio && { aspectRatio: aspectRatio })
      },
      // LƯU Ý: Đã loại bỏ safetySettings vì một số model Image Preview không hỗ trợ hoặc gây lỗi 400 Bad Request
  };
  
  let promptParts: any[] = [];

  if (maskData) {
      // CHẾ ĐỘ CHỈNH SỬA (Mask)
      const instruction = maskPrompt 
        ? `GENERATIVE FILL: Tại vùng mask đỏ, hãy vẽ: "${maskPrompt}".` 
        : `REMOVE OBJECT: Xóa vật thể trong vùng mask đỏ. Inpaint nền liền mạch.`;
      
      promptParts = [
          { inlineData: { mimeType, data: base64Data } },
          { inlineData: { mimeType: 'image/png', data: maskData.split(',')[1] } },
          { text: `${SYSTEM_INSTRUCTION_HEADER}\n\n${instruction}` }
      ];
  } else {
      // CHẾ ĐỘ TẠO MỚI (Full Image)
      const tasks = formatOptionsForPrompt(projectState.options);
      const fullPrompt = `${SYSTEM_INSTRUCTION_HEADER}\n\n[NHIỆM VỤ CỤ THỂ]:\n${tasks}\n\n[GHI CHÚ THÊM]: ${projectState.extraPrompt || 'Không có'}`;
      
      promptParts = [
          { inlineData: { mimeType, data: base64Data } },
          { text: fullPrompt }
      ];
  }

  try {
      console.log(`Calling Gemini Model: ${modelId} with AspectRatio: ${aspectRatio}`);
      
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
      
      // Nếu không có ảnh, kiểm tra xem có text từ chối không
      const textPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
      if (textPart) {
          throw new Error(`AI Refusal: ${textPart.text}`);
      }

      throw new Error("AI không trả về dữ liệu ảnh. (Empty Response)");
      
  } catch (error: any) {
      console.error("Gemini API Error Detail:", error);
      
      if (error.message?.includes('API Key') || error.message?.includes('Deployment')) {
         throw new Error("Lỗi API Key: Vui lòng kiểm tra biến môi trường API_KEY.");
      }
      if (error.status === 503) throw new Error("Server Gemini đang quá tải (503). Vui lòng thử lại sau giây lát.");
      if (error.status === 400) throw new Error("Lỗi Request (400): Có thể do Prompt hoặc Cấu hình không hợp lệ.");
      
      throw error;
  }
};