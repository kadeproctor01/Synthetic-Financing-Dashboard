import { daysBetween } from "./date";
import type { BoxLeg, BoxRequest, CollateralMetrics, FinancingMetrics, ModelConfiguration, ValidationIssue } from "./types";
import { issue } from "./validation";

export function buildFinancingMetrics(params: {
  request: BoxRequest;
  config: ModelConfiguration;
  lowerStrike: number;
  upperStrike: number;
  expirationDate: string;
  executedBoxCreditPerIndexPoint: number;
}): { financing?: FinancingMetrics; issues: ValidationIssue[] } {
  const { request, config, lowerStrike, upperStrike, expirationDate, executedBoxCreditPerIndexPoint } = params;
  const issues: ValidationIssue[] = [];
  const boxWidth = upperStrike - lowerStrike;
  const daysToMaturity = daysBetween(request.tradeDate, expirationDate);
  const faceValuePerContractUsd = boxWidth * config.contractMultiplier;
  const perContractOpeningCostUsd =
    config.optionLegsPerBox * (config.commissionPerContractPerLegUsd + config.exchangeFeePerContractPerLegUsd);
  const perContractNetCreditUsd = executedBoxCreditPerIndexPoint * config.contractMultiplier - perContractOpeningCostUsd;

  if (boxWidth <= 0) {
    issues.push(issue("INVALID", "INVALID_STRIKE_PAIR", "Upper strike must be greater than lower strike."));
  }
  if (daysToMaturity <= 0) {
    issues.push(issue("INVALID", "STALE_QUOTE", "Expiration must be after trade date."));
  }
  if (executedBoxCreditPerIndexPoint <= 0) {
    issues.push(issue("INVALID", "INVALID_CREDIT", "Executed box credit must be greater than zero."));
  }
  if (executedBoxCreditPerIndexPoint >= boxWidth) {
    issues.push(issue("INVALID", "CREDIT_ABOVE_FACE_VALUE", "Executed box credit must be below face value per index point."));
  }
  if (perContractNetCreditUsd <= 0) {
    issues.push(issue("INVALID", "INSUFFICIENT_NET_PROCEEDS", "Per-contract net credit must be positive after costs."));
  }
  if (issues.some((entry) => entry.status === "INVALID")) {
    return { issues };
  }

  const contractCount = Math.ceil((request.requestedNetProceedsUsd + config.otherOpeningCostsUsd) / perContractNetCreditUsd);
  const maturityObligationUsd = faceValuePerContractUsd * contractCount;
  const grossBoxCreditUsd = executedBoxCreditPerIndexPoint * config.contractMultiplier * contractCount;
  const transactionCostUsd = perContractOpeningCostUsd * contractCount + config.otherOpeningCostsUsd;
  const netCreditReceivedUsd = grossBoxCreditUsd - transactionCostUsd;
  const excessProceedsUsd = netCreditReceivedUsd - request.requestedNetProceedsUsd;
  const marketFinancingCostUsd = maturityObligationUsd - grossBoxCreditUsd;
  const allInFinancingCostUsd = maturityObligationUsd - netCreditReceivedUsd;
  const periodFinancingRateDecimal = maturityObligationUsd / netCreditReceivedUsd - 1;
  const effectiveAnnualRateDecimal =
    Math.pow(maturityObligationUsd / netCreditReceivedUsd, config.annualizationBasisDays / daysToMaturity) - 1;
  const simpleAnnualRateDecimal = (allInFinancingCostUsd / netCreditReceivedUsd) * (config.annualizationBasisDays / daysToMaturity);

  return {
    financing: {
      boxWidth,
      faceValuePerContractUsd,
      contractCount,
      maturityObligationUsd,
      executedBoxCreditPerIndexPoint,
      grossBoxCreditUsd,
      transactionCostUsd,
      netCreditReceivedUsd,
      requestedNetProceedsUsd: request.requestedNetProceedsUsd,
      excessProceedsUsd,
      marketFinancingCostUsd,
      allInFinancingCostUsd,
      periodFinancingRateDecimal,
      effectiveAnnualRateDecimal,
      simpleAnnualRateDecimal,
      daysToMaturity
    },
    issues
  };
}

export function buildCollateralMetrics(
  request: BoxRequest,
  config: ModelConfiguration,
  maturityObligationUsd: number
): CollateralMetrics {
  const haircutAdjustedCollateralUsd = request.eligibleCollateralValueUsd * (1 - config.collateralStressDeclineDecimal);
  return {
    eligibleCollateralValueUsd: request.eligibleCollateralValueUsd,
    haircutAdjustedCollateralUsd,
    initialObligationLtvDecimal: maturityObligationUsd / request.eligibleCollateralValueUsd,
    stressedObligationLtvDecimal: maturityObligationUsd / haircutAdjustedCollateralUsd,
    maxInitialLtvDecimal: config.maxInitialLtvDecimal,
    maxStressedLtvDecimal: config.maxStressedLtvDecimal
  };
}

export function executableShortBoxCreditPerIndexPoint(legs: BoxLeg[]): number {
  return legs.reduce((sum, leg) => sum + (leg.action === "SELL" ? leg.executionPricePerIndexPoint : -leg.executionPricePerIndexPoint), 0);
}
