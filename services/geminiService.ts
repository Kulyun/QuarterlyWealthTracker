
import { GoogleGenAI } from "@google/genai";
import { WealthRecord, GlobalMetrics } from "../types";

export const getFinancialAdvice = async (record: WealthRecord, metrics: GlobalMetrics): Promise<string> => {
  // 适配 Vite 环境变量 (import.meta.env) 和 Node 环境变量 (process.env)
  // 在 Vercel 中设置环境变量时，请使用 VITE_API_KEY
  const apiKey = (import.meta as any).env?.VITE_API_KEY || (typeof process !== 'undefined' ? process.env?.API_KEY : null);

  if (!apiKey) {
    return "💡 您尚未配置 API Key。如果您以后需要 AI 理财建议，请在 Vercel 的 Environment Variables 中设置 VITE_API_KEY。目前应用功能不受影响，您可以正常记账和查看图表。";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Analyze this user's asset allocation for the current quarter and provide 3-4 professional financial insights.
    
    Data summary:
    - Total Assets: ${metrics.totalAssets}
    - Disposable Assets: ${metrics.disposableAssets}
    - Market Index Exposure (Pension + Index Funds): ${metrics.totalMarketIndex}
    
    Category breakdown (summarized):
    ${Object.entries(record.data).map(([key, entries]) => {
      const sum = (entries as any[]).reduce((a, b) => a + b.value, 0);
      return `- ${key}: ${sum}`;
    }).join('\n')}

    Consider:
    1. Diversification (Bitcoin, Stocks, Bonds, Cash)
    2. Liquidity (Cash vs Real Estate)
    3. Long-term strategy (Index funds vs Individual stocks)
    
    Respond in a professional, encouraging tone. Keep it concise in Chinese.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a professional wealth advisor. Analyze the provided portfolio and give concise advice in Chinese."
      }
    });
    return response.text || "目前无法生成建议。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 分析暂时不可用，请检查 API 配置。";
  }
};
