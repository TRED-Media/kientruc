
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

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Map ENUM to Descriptive Prompts for AI (Vietnamese)
const SKY_DESCRIPTIONS: Record<string, string> = {
    'CLEAR_BLUE': "Trời xanh trong vắt, ít mây, nắng rực rỡ",
    'SOFT_OVERCAST': "Trời nhiều mây (Overcast), ánh sáng mềm, không bóng đổ gắt",
    'GOLDEN_HOUR': "Hoàng hôn giờ vàng, ánh sáng cam ấm áp",
    'DRAMATIC_CLOUDY': "Mây cuộn kịch tính, tương phản cao, nghệ thuật",
    'NIGHT_LUXURY': "Bầu trời đêm xanh thẫm (Blue Hour), có sao, sang trọng"
};

const formatOptionsForPrompt = (options: ProcessingOptions): string => {
  const tasks: string[] = [];

  // --- GROUP 1: GEOMETRY & LENS (Xử lý đầu tiên để khung hình chuẩn) ---
  const geoTasks = [];
  if (options.AutoVerticals) geoTasks.push("Auto Verticals: Làm thẳng tuyệt đối các đường thẳng đứng (cột, tường) song song với cạnh ảnh.");
  if (options.AutoPerspectiveCorrection) geoTasks.push("Perspective Fix: Cân chỉnh phối cảnh sao cho công trình trông cân đối, vững chãi.");
  if (options.AutoLensCorrection) geoTasks.push("Lens Correction: Khử méo hình do ống kính góc rộng.");
  if (geoTasks.length > 0) {
      tasks.push(`[1. HÌNH HỌC & ỐNG KÍNH]\n- ${geoTasks.join('\n- ')}`);
  }

  // --- GROUP 2: CLEANING & RESTORATION (Trọng tâm yêu cầu người dùng) ---
  const cleanTasks = [];

  // A. CLEAN WALLS (TƯỜNG)
  if (options.CleanWalls !== 'OFF') {
      let levelPrompt = "";
      if (options.CleanWalls === 'LOW') {
          levelPrompt = "MỨC ĐỘ NHẸ (50%): Chỉ làm sạch bụi bẩn nhẹ. Giữ nguyên độ nhám và texture tự nhiên của tường.";
      } else if (options.CleanWalls === 'MEDIUM') {
          levelPrompt = "MỨC ĐỘ VỪA (100%): Làm đều màu sơn, xử lý các vết loang lổ cục bộ. Bề mặt tường trông sạch sẽ, mới hơn.";
      } else { // STRONG - ULTRA DEEP RECONSTRUCTION
          levelPrompt = `MỨC ĐỘ CỰC MẠNH (200% - DIGITAL RECONSTRUCTION):
          1. CHẨN ĐOÁN: Quét toàn bộ bề mặt tường để tìm các vùng "Bệnh lý": Loang lổ (Mottling), Ẩm thấp (Damp patches), Rêu mốc bám sâu, Vết nứt chân chim và Mảng sơn bị phấn hóa.
          2. KỸ THUẬT XỬ LÝ (QUAN TRỌNG): Áp dụng kỹ thuật "SƠN LẠI KỸ THUẬT SỐ" (Digital Repainting).
             - Hãy tưởng tượng bạn đang lăn một lớp sơn mới hoàn toàn lên tường cũ.
             - Xóa bỏ hoàn toàn Gradient màu xấu xí do thời tiết gây ra.
             - Làm phẳng lỳ (Smooth out) các vết lồi lõm li ti không đáng có trên bề mặt trát vữa.
          3. TÁI TẠO BỀ MẶT:
             - Tường phải có độ phản xạ ánh sáng (Albedo) đồng nhất từ trên xuống dưới.
             - Loại bỏ mọi nhiễu hạt (Noise) do bụi bẩn tích tụ lâu năm.
          4. KẾT QUẢ: Tường phải trông như VỪA MỚI HOÀN THIỆN XÂY DỰNG NGAY HÔM QUA. Mịn màng, Phẳng phiu, Đồng màu.`;
      }
      cleanTasks.push(`XỬ LÝ TƯỜNG (${options.CleanWalls}):\n   + Yêu cầu chi tiết: ${levelPrompt}\n   + LƯU Ý QUAN TRỌNG: TUYỆT ĐỐI GIỮ NGUYÊN MÃ MÀU GỐC (Hex Color). Chỉ làm mới bề mặt vật liệu, KHÔNG được đổi màu sơn khác.`);
  }

  // B. CLEAN PAVING/FLOORS (SÀN/NỀN)
  if (options.CleanPaving !== 'OFF') {
      let levelPrompt = "";
      if (options.CleanPaving === 'LOW') {
          levelPrompt = "MỨC ĐỘ NHẸ (50%): Quét sạch rác. Giữ nguyên độ bóng tự nhiên.";
      } else if (options.CleanPaving === 'MEDIUM') {
          levelPrompt = "MỨC ĐỘ VỪA (100%): Xóa vết ố, vệt nước. Làm sàn nhà đều màu hơn.";
      } else { // STRONG - ULTRA DEEP RECONSTRUCTION
          levelPrompt = `MỨC ĐỘ CỰC MẠNH (200% - DIGITAL RE-PAVING):
          1. CHẨN ĐOÁN: Xác định gạch vỡ, vết nứt bê tông, khe ron đen kịt do rêu mốc, vệt nước đọng ố vàng.
          2. KỸ THUẬT XỬ LÝ: "Mài bóng" và "Lát lại" kỹ thuật số.
             - Nếu là gạch: Vẽ lại đường ron (Grout lines) mới tinh, trắng sạch và sắc nét.
             - Nếu là bê tông/đá: Làm mịn bề mặt, xóa bỏ mọi vết rỗ và loang lổ.
          3. KẾT QUẢ: Sàn nhà phải trông như SÀN MỚI LÁT. Bề mặt sạch bong, không tì vết, phản xạ ánh sáng đều đặn.`;
      }
      cleanTasks.push(`XỬ LÝ SÀN/NỀN (${options.CleanPaving}):\n   + Yêu cầu chi tiết: ${levelPrompt}\n   + LƯU Ý QUAN TRỌNG: Phải giữ đúng vật liệu gốc (Gỗ, Gạch, Đá...). Không biến sàn gỗ thành sàn nhựa.`);
  }

  // C. CLEAN GLASS (KÍNH)
  if (options.CleanGlass !== 'OFF') {
     cleanTasks.push("XỬ LÝ KÍNH: Làm trong suốt cửa kính, xóa các vết bẩn mờ trên kính, tăng độ phản xạ tự nhiên.");
  }
  
  // D. GENERAL TRASH
  if (options.CleanTrash) cleanTasks.push("XÓA RÁC: Loại bỏ rác thải, túi nilon, mảnh vụn xây dựng trên mặt đất.");
  if (options.RemovePowerLines) cleanTasks.push("XÓA DÂY ĐIỆN: Xóa sạch dây điện, dây cáp viễn thông cắt ngang bầu trời và tòa nhà.");
  if (options.RemoveSensorSpots) cleanTasks.push("SENSOR SPOTS: Xóa các đốm bụi cảm biến trên bầu trời.");

  if (cleanTasks.length > 0) {
      tasks.push(`[2. VỆ SINH, PHỤC HỒI & TÁI TẠO BỀ MẶT]\n- ${cleanTasks.join('\n- ')}`);
  }

  // --- GROUP 3: LIGHTING & TONE (Ánh sáng) ---
  const lightTasks = [];
  
  // WB
  if (options.AutoWhiteBalance === 'WARM') lightTasks.push("White Balance: Chỉnh tông màu ẤM (Warm) tạo cảm giác mời gọi.");
  else if (options.AutoWhiteBalance === 'COOL') lightTasks.push("White Balance: Chỉnh tông màu LẠNH (Cool) hiện đại, sạch sẽ.");
  else lightTasks.push("White Balance: Cân bằng trắng TRUNG TÍNH. Loại bỏ ám màu (Color Cast). Màu trắng phải trắng chuẩn.");

  // HDR
  if (options.AutoHDRBatch !== 'OFF') {
      const strength = options.AutoHDRBatch === 'LOW' ? "nhẹ" : (options.AutoHDRBatch === 'MEDIUM' ? "trung bình" : "mạnh");
      lightTasks.push(`Auto HDR (${options.AutoHDRBatch}): Cân bằng độ sáng. Nâng sáng vùng tối (shadows) và cứu lại chi tiết vùng cháy sáng (highlights). Cường độ: ${strength}.`);
  }

  // Lights On/Off
  if (options.LightsOnOffMode === 'ON') lightTasks.push("Đèn nhân tạo: BẬT SÁNG đèn nội thất và đèn ngoại thất (nếu có).");
  else if (options.LightsOnOffMode === 'OFF') lightTasks.push("Đèn nhân tạo: TẮT đèn.");

  if (lightTasks.length > 0) {
      tasks.push(`[3. ÁNH SÁNG & MÀU SẮC]\n- ${lightTasks.join('\n- ')}`);
  }

  // --- GROUP 4: ENVIRONMENT & SKY (Bầu trời) ---
  const envTasks = [];
  
  // Sky logic
  if (options.SkyReplacement !== SkyReplacement.OFF) {
      let skyPrompt = "";
      if (options.SkyReplacement === SkyReplacement.CUSTOM) {
          skyPrompt = `Thay thế bầu trời bằng: "${options.SkyCustomPrompt}"`;
      } else {
          skyPrompt = `Thay thế bầu trời bằng: ${SKY_DESCRIPTIONS[options.SkyReplacement]}`;
      }
      
      envTasks.push(`${skyPrompt}.`);
      envTasks.push(`QUAN TRỌNG: Sử dụng kỹ thuật Masking chính xác. Không để bầu trời lem vào tòa nhà hoặc cây cối. Giữ nguyên đường chân trời.`);
      if (options.MatchLightDirectionToOriginal) {
          envTasks.push("Re-lighting: Điều chỉnh ánh sáng tiền cảnh phù hợp với hướng sáng của bầu trời mới.");
      }
  }

  if (options.CPLFilterEffect) envTasks.push("CPL Filter: Khử phản xạ chói trên mặt kính và mặt nước. Giúp nhìn xuyên qua kính rõ hơn.");

  if (envTasks.length > 0) {
      tasks.push(`[4. MÔI TRƯỜNG & BẦU TRỜI]\n- ${envTasks.join('\n- ')}`);
  }

  // --- GROUP 5: STAGING (Diễn họa) ---
  const stageTasks = [];
  if (options.AddPeople !== 'OFF') {
      const density = options.AddPeople === 'LOW' ? "vài người" : (options.AddPeople === 'MEDIUM' ? "số lượng vừa phải" : "đông đúc");
      stageTasks.push(`Thêm người (${density}): Phong cách ${options.PeopleStyle}. Người phải tương tác tự nhiên với không gian.`);
  }
  if (options.Vehicles !== 'OFF') {
      stageTasks.push(`Thêm xe cộ: Thêm xe hơi phù hợp với đẳng cấp công trình (Sang trọng/Hiện đại).`);
  }

  if (stageTasks.length > 0) {
      tasks.push(`[5. DIỄN HỌA (STAGING)]\n- ${stageTasks.join('\n- ')}`);
  }

  return tasks.join('\n\n');
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
  
  const imageSize = projectState.options.Resolution; 
  const aspectRatio = projectState.options.AspectRatio !== 'ORIGINAL' ? projectState.options.AspectRatio : undefined;

  // Added Safety Settings to BLOCK_NONE to ensure architectural textures are not flagged
  const requestConfig: any = {
      imageConfig: {
          imageSize: imageSize,
          ...(aspectRatio && { aspectRatio: aspectRatio })
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
  };
  
  let promptParts: any[] = [];

  if (maskData) {
      // --- MANUAL MASKING LOGIC ---
      let manualInstruction = "";
      if (maskPrompt) {
          // Generative Fill
          manualInstruction = `
          NHIỆM VỤ: GENERATIVE FILL (ĐIỀN VÀO CHỖ TRỐNG)
          1. Tìm vùng ảnh được che bởi MASK MÀU ĐỎ.
          2. Tại vùng đó, hãy tạo ra: "${maskPrompt}".
          3. Yêu cầu: Vật thể mới phải khớp hoàn toàn về ánh sáng, phối cảnh và phong cách với ảnh gốc.
          `;
      } else {
          // Remove Object
          manualInstruction = `
          NHIỆM VỤ: OBJECT REMOVAL (XÓA VẬT THỂ)
          1. Tìm vùng ảnh được che bởi MASK MÀU ĐỎ.
          2. Xóa bỏ hoàn toàn vật thể trong vùng đó.
          3. Tái tạo lại nền (Inpaint) một cách chân thực (nối liền tường, sàn, hoặc cảnh quan phía sau).
          `;
      }

      promptParts = [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { inlineData: { mimeType: 'image/png', data: maskData.split(',')[1] } },
          { text: SYSTEM_INSTRUCTION_HEADER + "\n\n" + manualInstruction }
      ];
  } else {
      // --- BATCH PROCESSING LOGIC ---
      const formattedTasks = formatOptionsForPrompt(projectState.options);
      
      const fullPrompt = `
${SYSTEM_INSTRUCTION_HEADER}

--- THÔNG TIN DỰ ÁN ---
${projectState.projectContext ? `Bối cảnh: ${projectState.projectContext}` : ''}

--- DANH SÁCH NHIỆM VỤ CẦN THỰC HIỆN (TASKS) ---
${formattedTasks}

--- YÊU CẦU BỔ SUNG CỦA NGƯỜI DÙNG ---
${projectState.extraPrompt || 'Không có.'}
      `;

      promptParts = [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: fullPrompt }
      ];
  }

  // --- RETRY LOGIC FOR 503 OVERLOAD ---
  const MAX_RETRIES = 5;
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: [{ parts: promptParts }],
        config: requestConfig
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }

      throw new Error("Không nhận được dữ liệu ảnh từ Gemini.");
      
    } catch (error: any) {
      lastError = error;
      
      // Check for 503 Unavailable or "overloaded" message
      const isOverloaded = 
        error.status === 503 || 
        error.code === 503 || 
        error.status === 429 || 
        error.code === 429 ||
        (error.message && (error.message.includes('overloaded') || error.message.includes('Too Many Requests')));

      if (isOverloaded && attempt < MAX_RETRIES) {
         // Exponential Backoff: 2s, 4s, 8s, 16s... + Jitter
         const delay = Math.pow(2, attempt + 1) * 1000 + Math.random() * 500;
         console.warn(`Gemini API Overloaded (503). Retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
         await wait(delay);
         continue;
      }
      
      // Non-retryable error or max retries exceeded
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  throw lastError || new Error("Unknown error occurred during processing.");
};
