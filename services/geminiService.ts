
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AccountingCategory, CategorizationResult, PredictionSourceType, RuleFileContent } from '../types';
import { normalizeCategoryFromString, getRuleFiles, NormalizedCategoryResult } from './accountingRulesService';

const MOCK_CATEGORIES_SPECIFIC = ["Service Fee Income", "Office Supplies", "Bank Account", "Loan Payable", "Common Stock"];

let ai: GoogleGenAI | null = null;

// ruleFileContent is no longer cached at module level here.
// It will be fetched fresh by ensureRuleFileContentLoaded or directly.

const ensureRuleFileContentLoaded = (): RuleFileContent => {
    // Always get the latest rules from the service, which handles custom vs. default.
    return getRuleFiles(); 
};

export const initializeAiClient = (apiKey: string): boolean => {
    if (!apiKey) {
        ai = null;
        console.warn("API key is empty. Gemini AI client reset. Using mock data.");
        return false; 
    }
    try {
        ai = new GoogleGenAI({ apiKey });
        console.log("GoogleGenAI client initialized successfully.");
        return true;
    } catch (error) {
        console.error("Error initializing GoogleGenAI:", error);
        ai = null;
        return false;
    }
};


export const categorizeTransactionWithGemini = async (
    description: string,
    clientIndustry?: string,
): Promise<CategorizationResult> => {
    const rules = ensureRuleFileContentLoaded(); // Fetch current rules

    if (!ai) {
        console.warn("Gemini API key not set or client not initialized. Using mock data for categorization.");
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        const randomSpecificCategory = MOCK_CATEGORIES_SPECIFIC[Math.floor(Math.random() * MOCK_CATEGORIES_SPECIFIC.length)];
        const normalizedMock = normalizeCategoryFromString(randomSpecificCategory, rules);

        const randomConfidence = Math.random() * 0.5 + 0.5;
        const mockResult: CategorizationResult = {
            specificCategory: normalizedMock.specificName,
            broadCategory: normalizedMock.broadCategory,
            confidence: parseFloat(randomConfidence.toFixed(2)),
            transactionType: ["Payment", "Sale", "Service Fee", "Transfer"][Math.floor(Math.random() * 4)],
            vendorCustomerName: ["Mock Vendor A", "Customer B", "Utility Co."][Math.floor(Math.random()*3)],
            predictionSource: PredictionSourceType.AI_MODEL,
        };
        if (mockResult.confidence < 0.9 && mockResult.confidence > 0.3) {
            const suggestedSpecific = MOCK_CATEGORIES_SPECIFIC.filter(c => c !== randomSpecificCategory)[Math.floor(Math.random() * (MOCK_CATEGORIES_SPECIFIC.length -1))];
            const normalizedSuggestedMock = normalizeCategoryFromString(suggestedSpecific, rules);
            mockResult.suggestedSpecificCategory = normalizedSuggestedMock.specificName;
            mockResult.suggestedBroadCategory = normalizedSuggestedMock.broadCategory;
        }
        return mockResult;
    }

    const availableCategoriesString = Object.values(AccountingCategory).filter(c => c !== AccountingCategory.UNKNOWN).join(', ');
    const exampleCoAs = ["Service Fee Income", "Office Supplies", "Dental Supplies", "Rent Expense", "Software Subscription", "Bank Loan Payment", "Equipment Purchase", "Owner's Drawing", "Common Stock Investment"];
    const exampleCoAsString = exampleCoAs.join(', ');

    const systemInstruction = `You are an expert accounting assistant. Your task is to classify bank transaction descriptions into specific Chart of Account (CoA) names.
    The main accounting categories are: ${availableCategoriesString}.
    Aim to provide a specific CoA name that would fit into one of these broad categories. Examples of specific CoA names include: ${exampleCoAsString}.
    ${clientIndustry ? `Consider that the transaction is for a business in the '${clientIndustry}' industry.` : ''}
    Analyze the transaction description carefully.
    Provide the output ONLY as a JSON object with the following keys:
    - "category": (string) The most appropriate specific Chart of Account name.
    - "confidence": (number) A score from 0.0 to 1.0 representing your confidence.
    - "transactionType": (string, optional) The type of transaction (e.g., "Payment", "Sale", "Subscription", "Refund", "Transfer").
    - "vendorCustomerName": (string, optional) The vendor or customer name if identifiable from the description.
    - "suggestedCategory": (string, optional) If your confidence for the primary "category" is below 0.9, provide an alternative specific Chart of Account name that could also be plausible. Otherwise, omit this field or set to null.
    Example for high confidence: {"category": "Software Subscription", "confidence": 0.95, "transactionType": "Subscription", "vendorCustomerName": "Netflix"}
    Example for low confidence: {"category": "Consulting Revenue", "confidence": 0.65, "transactionType": "Sale", "vendorCustomerName": "Client Payment", "suggestedCategory": "Retainer Income"}`;

    const prompt = `Transaction Description: "${description}"`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.2,
                topP: 0.9,
                topK: 32,
            }
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
          jsonStr = match[2].trim();
        }

        const parsedResult = JSON.parse(jsonStr);

        if (parsedResult.category && typeof parsedResult.category === 'string' && typeof parsedResult.confidence === 'number') {
            const normalizedPrimary: NormalizedCategoryResult = normalizeCategoryFromString(parsedResult.category, rules);

            const result: CategorizationResult = {
                specificCategory: normalizedPrimary.specificName,
                broadCategory: normalizedPrimary.broadCategory,
                confidence: Math.max(0, Math.min(1, parsedResult.confidence)),
                transactionType: parsedResult.transactionType || undefined,
                vendorCustomerName: parsedResult.vendorCustomerName || undefined,
                predictionSource: PredictionSourceType.AI_MODEL,
            };

            if (parsedResult.suggestedCategory && typeof parsedResult.suggestedCategory === 'string') {
                 const normalizedSuggested: NormalizedCategoryResult = normalizeCategoryFromString(parsedResult.suggestedCategory, rules);
                 result.suggestedSpecificCategory = normalizedSuggested.specificName;
                 result.suggestedBroadCategory = normalizedSuggested.broadCategory;
            }

            if (result.confidence >= 0.9) {
                delete result.suggestedSpecificCategory;
                delete result.suggestedBroadCategory;
            }
            
            if (result.broadCategory === AccountingCategory.UNKNOWN && result.specificCategory) {
                 const reNormalized = normalizeCategoryFromString(result.specificCategory, rules);
                 result.broadCategory = reNormalized.broadCategory;
            }

            return result;
        } else {
            console.error("Gemini response format error, invalid category, or invalid confidence:", parsedResult);
             const fallbackNormalized = normalizeCategoryFromString("Unknown", rules);
            return {
                specificCategory: fallbackNormalized.specificName,
                broadCategory: fallbackNormalized.broadCategory,
                confidence: 0.1,
                predictionSource: PredictionSourceType.AI_MODEL
            };
        }
    } catch (error) {
        console.error("Error calling Gemini API for categorization:", error);
        const fallbackNormalized = normalizeCategoryFromString("Unknown", rules);
        return {
            specificCategory: fallbackNormalized.specificName,
            broadCategory: fallbackNormalized.broadCategory,
            confidence: 0.0,
            predictionSource: PredictionSourceType.AI_MODEL
        };
    }
};

export const isAiClientReady = (): boolean => {
    return ai !== null;
};
