
import { GoogleGenAI } from "@google/genai";

const getGeminiAnalysis = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API_KEY environment variable not set. Please set it to use Gemini analysis.";
  }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            systemInstruction: "You are a helpful financial assistant specializing in Dallas real estate. Analyze the provided data and give clear, concise, and actionable insights for a homebuyer or investor. Use markdown for formatting, such as bolding key terms and using bullet points for lists.",
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `An error occurred while fetching analysis: ${error.message}`;
    }
    return "An unknown error occurred while fetching analysis.";
  }
};

export const getDownPaymentAnalysis = (data: any) => {
    const prompt = `
    Analyze the following home purchase scenario in Dallas:

    - **Home Price:** ${data.homePrice}
    - **Down Payment:** ${data.downPaymentAmount} (${data.downPaymentPercent}%)
    - **Loan Amount:** ${data.loanAmount}
    - **Loan Type:** ${data.loanType}
    - **Estimated Closing Costs:** ${data.closingCosts}
    - **Total Cash to Close:** ${data.cashToClose}
    ${data.totalMonthlyPayment ? `
    - **Estimated Total Monthly Payment:** ${data.totalMonthlyPayment}
      - Principal & Interest: ${data.pAndI}
      - Taxes: ${data.monthlyTaxes}
      - Insurance: ${data.homeownersInsurance}
      - HOA: ${data.hoa}
    ` : ''}

    Provide a brief analysis covering:
    1.  The feasibility of the cash to close amount.
    2.  Comments on the estimated monthly payment relative to the loan amount.
    3.  Any specific considerations for the chosen loan type in the Dallas market.
    `;
    return getGeminiAnalysis(prompt);
}

export const getRoiAnalysis = (data: any) => {
    const prompt = `
    Analyze the following real estate investment scenario in Dallas:

    - **Purchase Price:** ${data.purchasePrice}
    - **Total Cash Invested:** ${data.totalCashInvested}
    - **Loan Amount:** ${data.loanAmount}
    - **Gross Monthly Income:** ${data.grossMonthlyIncome}
    - **Total Monthly Operating Expenses (ex-mortgage):** ${data.operatingExpenses}
    - **Monthly Net Operating Income (NOI):** ${data.noiMonthly}
    - **Monthly Cash Flow:** ${data.cashFlowMonthly}
    - **Annual Cash Flow:** ${data.cashFlowAnnual}
    - **Cash on Cash Return:** ${data.cashOnCashReturn}%
    - **Cap Rate:** ${data.capRate}%
    
    Provide a brief analysis covering:
    1.  The strength of the key return metrics (Cash on Cash Return and Cap Rate) for the Dallas market.
    2.  An evaluation of the property's cash flow.
    3.  Potential risks or areas for improvement based on the provided numbers (e.g., if OpEx seems high, etc.).
    `;
    return getGeminiAnalysis(prompt);
}
