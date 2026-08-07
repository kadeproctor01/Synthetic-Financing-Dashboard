export type FieldClassification =
  | "INPUT"
  | "CONFIG"
  | "MARKET_DATA"
  | "CALCULATED_OUTPUT"
  | "AUDIT_METADATA";

export type OptionRight = "CALL" | "PUT";
export type OptionExerciseStyle = "EUROPEAN" | "AMERICAN";
export type OptionSettlementType = "CASH" | "PHYSICAL";
export type QuoteValidationStatus = "VALID" | "WARNING" | "INVALID" | "STALE";
export type QuoteReasonCode =
  | "MISSING_BID"
  | "MISSING_ASK"
  | "ZERO_BID"
  | "ZERO_ASK"
  | "CROSSED_MARKET"
  | "NEGATIVE_SPREAD"
  | "WIDE_SPREAD"
  | "STALE_QUOTE"
  | "MISSING_LEG"
  | "WRONG_MULTIPLIER"
  | "WRONG_EXERCISE_STYLE"
  | "WRONG_SETTLEMENT_TYPE"
  | "INVALID_STRIKE_PAIR"
  | "INVALID_CREDIT"
  | "CREDIT_ABOVE_FACE_VALUE"
  | "INSUFFICIENT_NET_PROCEEDS";

export interface ValidationIssue {
  status: QuoteValidationStatus;
  code: QuoteReasonCode;
  message: string;
  fieldId?: string;
}

export interface BoxRequest {
  requestedNetProceedsUsd: number;
  desiredTenorMonths: number;
  eligibleCollateralValueUsd: number;
  tradeDate: string;
}

export interface ModelConfiguration {
  configurationVersion: string;
  approvedUnderlying: string;
  contractMultiplier: number;
  optionLegsPerBox: number;
  annualizationBasisDays: number;
  approvedWidths: number[];
  expirationSearchWindowDays: number;
  commissionPerContractPerLegUsd: number;
  exchangeFeePerContractPerLegUsd: number;
  otherOpeningCostsUsd: number;
  collateralStressDeclineDecimal: number;
  maxInitialLtvDecimal: number;
  maxStressedLtvDecimal: number;
  maxQuoteAgeMinutes: number;
  maxLegBidAskSpreadDecimal: number;
  exerciseStyle: OptionExerciseStyle;
  settlementType: OptionSettlementType;
}

export interface OptionContract {
  underlying: string;
  expirationDate: string;
  strike: number;
  right: OptionRight;
  multiplier: number;
  exerciseStyle: OptionExerciseStyle;
  settlementType: OptionSettlementType;
  seriesType: "STANDARD" | "WEEKLY" | "OTHER";
  symbol: string;
}

export interface OptionQuote {
  contract: OptionContract;
  bid: number | null;
  ask: number | null;
  bidSize?: number;
  askSize?: number;
  openInterest?: number;
  quoteTimestamp: string;
}

export interface MarketDataSnapshot {
  provider: string;
  snapshotTimestamp: string;
  underlying: string;
  quotes: OptionQuote[];
}

export interface BoxLeg {
  action: "BUY" | "SELL";
  right: OptionRight;
  strike: number;
  executionPricePerIndexPoint: number;
  quote: OptionQuote;
}

export interface FinancingMetrics {
  boxWidth: number;
  faceValuePerContractUsd: number;
  contractCount: number;
  maturityObligationUsd: number;
  executedBoxCreditPerIndexPoint: number;
  grossBoxCreditUsd: number;
  transactionCostUsd: number;
  netCreditReceivedUsd: number;
  requestedNetProceedsUsd: number;
  excessProceedsUsd: number;
  marketFinancingCostUsd: number;
  allInFinancingCostUsd: number;
  periodFinancingRateDecimal: number;
  effectiveAnnualRateDecimal: number;
  simpleAnnualRateDecimal: number;
  daysToMaturity: number;
}

export interface CollateralMetrics {
  eligibleCollateralValueUsd: number;
  haircutAdjustedCollateralUsd: number;
  initialObligationLtvDecimal: number;
  stressedObligationLtvDecimal: number;
  maxInitialLtvDecimal: number;
  maxStressedLtvDecimal: number;
}

export interface BoxCandidate {
  candidateId: string;
  underlying: string;
  expirationDate: string;
  lowerStrike: number;
  upperStrike: number;
  legs: BoxLeg[];
  quoteStatus: QuoteValidationStatus;
  validationIssues: ValidationIssue[];
  financing: FinancingMetrics;
  collateral: CollateralMetrics;
}

export interface CalculationResult {
  calculationEngineVersion: string;
  configurationVersion: string;
  request: BoxRequest;
  marketDataProvider: string;
  marketDataSnapshotTimestamp: string;
  candidates: BoxCandidate[];
  selectedCandidate: BoxCandidate | null;
  validationIssues: ValidationIssue[];
}

export interface MarketDataProvider {
  getSnapshot(request: BoxRequest, config: ModelConfiguration): Promise<MarketDataSnapshot>;
}
