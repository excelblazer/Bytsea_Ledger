import { MappedTrainingTransaction, RawTransactionData, CategorizationResult, AccountingCategory, PredictionSourceType, Industry, RuleFileContent } from '../types';
import { normalizeCategoryFromString, NormalizedCategoryResult } from './accountingRulesService';

const SIMILARITY_THRESHOLD = 0.7; 

const calculateDescriptionSimilarity = (desc1: string, desc2: string): number => {
  const words1 = new Set(desc1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(desc2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

export const findMatchInTrainingData = (
  rawTx: RawTransactionData,
  trainingData: MappedTrainingTransaction[],
  rules: RuleFileContent,
  sourceType: PredictionSourceType.BOOK_HISTORY | PredictionSourceType.CLIENT_HISTORY
): CategorizationResult | null => {
  if (!rawTx.Description || trainingData.length === 0) {
    return null;
  }

  let bestMatch: MappedTrainingTransaction | null = null;
  let highestSimilarity = 0;

  for (const historicalTx of trainingData) {
    const similarity = calculateDescriptionSimilarity(rawTx.Description, historicalTx.description);
    let vendorMatchBoost = 0;
    if (rawTx.VendorCustomerName && historicalTx.vendorCustomerName) {
      if (rawTx.VendorCustomerName.toLowerCase() === historicalTx.vendorCustomerName.toLowerCase()) {
        vendorMatchBoost = 0.2; 
      }
    }
    const finalSimilarity = similarity + vendorMatchBoost;

    if (finalSimilarity > highestSimilarity) {
      highestSimilarity = finalSimilarity;
      bestMatch = historicalTx;
    }
  }

  if (bestMatch && highestSimilarity >= SIMILARITY_THRESHOLD) {
    const normalizedResult: NormalizedCategoryResult = normalizeCategoryFromString(bestMatch.category, rules);
    if (normalizedResult.broadCategory !== AccountingCategory.UNKNOWN) {
        return {
            specificCategory: normalizedResult.specificName,
            broadCategory: normalizedResult.broadCategory,
            confidence: Math.min(0.90 + (highestSimilarity - SIMILARITY_THRESHOLD), 0.98),
            transactionType: bestMatch.transactionType,
            vendorCustomerName: bestMatch.vendorCustomerName,
            predictionSource: sourceType,
        };
    }
  }
  return null;
};

export const findMatchViaIndustryRules = (
  rawTx: RawTransactionData,
  industry: Industry | undefined,
  rules: RuleFileContent
): CategorizationResult | null => {
  if (!rawTx.Description || !industry) return null;

  const sectionsToScan = [
      ...(rules.accountingRules.fixed_assets?.categories || []),
      ...(rules.accountingRules.insurance?.categories || [])
  ];
  
  const industrySpecificRule = sectionsToScan.find(rule => 
    rule.industry && rule.industry.toLowerCase() === industry.name.toLowerCase() &&
    rule.keywords && Array.isArray(rule.keywords) && 
    rule.keywords.some((kw: string) => rawTx.Description!.toLowerCase().includes(kw.toLowerCase()))
  );

  if (industrySpecificRule) {
      const categoryName = industrySpecificRule.category || industrySpecificRule.type; 
      const normalizedResult = normalizeCategoryFromString(categoryName, rules);
       if (normalizedResult.broadCategory !== AccountingCategory.UNKNOWN) {
            return {
                specificCategory: normalizedResult.specificName,
                broadCategory: normalizedResult.broadCategory,
                confidence: 0.80, 
                predictionSource: PredictionSourceType.INDUSTRY_RULE,
            };
       }
  }
  return null;
};


export const findMatchViaGlobalRules = (
  rawTx: RawTransactionData,
  rules: RuleFileContent
): CategorizationResult | null => {
  if (!rawTx.Description) return null;

  const generalCategories = [
      ...(rules.accountingRules.fixed_assets?.categories.filter((c:any) => c.industry === "General") || []),
      ...(rules.accountingRules.payroll?.core_keywords ? [{category: "Payroll Expense", keywords: rules.accountingRules.payroll.core_keywords, type: "Payroll"}] : []),
  ];
  
  for (const catRule of generalCategories) {
    if (catRule.keywords && Array.isArray(catRule.keywords)) {
        if (catRule.keywords.some((kw: string) => rawTx.Description!.toLowerCase().includes(kw.toLowerCase()))) {
            const categoryName = catRule.category || catRule.type;
            const normalizedResult = normalizeCategoryFromString(categoryName, rules);
             if (normalizedResult.broadCategory !== AccountingCategory.UNKNOWN) {
                return {
                    specificCategory: normalizedResult.specificName,
                    broadCategory: normalizedResult.broadCategory,
                    confidence: 0.75, 
                    predictionSource: PredictionSourceType.GLOBAL_RULE,
                };
            }
        }
    }
  }
  return null;
};
