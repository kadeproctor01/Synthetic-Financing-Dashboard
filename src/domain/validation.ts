import { minutesBetween } from "./date";
import type { ModelConfiguration, OptionQuote, ValidationIssue } from "./types";

export function validateRequest(input: unknown): { value?: import("./types").BoxRequest; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const record = isRecord(input) ? input : {};
  const value = {
    requestedNetProceedsUsd: Number(record.requestedNetProceedsUsd),
    desiredTenorMonths: Number(record.desiredTenorMonths),
    eligibleCollateralValueUsd: Number(record.eligibleCollateralValueUsd),
    tradeDate: String(record.tradeDate ?? new Date().toISOString().slice(0, 10))
  };

  if (!Number.isFinite(value.requestedNetProceedsUsd) || value.requestedNetProceedsUsd <= 0) {
    issues.push(issue("INVALID", "INSUFFICIENT_NET_PROCEEDS", "Requested net proceeds must be greater than zero.", "requestedNetProceedsUsd"));
  }
  if (!Number.isInteger(value.desiredTenorMonths) || value.desiredTenorMonths < 1 || value.desiredTenorMonths > 120) {
    issues.push(issue("INVALID", "INVALID_STRIKE_PAIR", "Desired tenor must be a whole number from 1 to 120 months.", "desiredTenorMonths"));
  }
  if (!Number.isFinite(value.eligibleCollateralValueUsd) || value.eligibleCollateralValueUsd <= 0) {
    issues.push(issue("INVALID", "INSUFFICIENT_NET_PROCEEDS", "Eligible collateral value must be greater than zero.", "eligibleCollateralValueUsd"));
  }
  if (Number.isNaN(new Date(`${value.tradeDate}T00:00:00.000Z`).getTime())) {
    issues.push(issue("INVALID", "STALE_QUOTE", "Trade date must be an ISO date in YYYY-MM-DD format.", "tradeDate"));
  }

  return { value: issues.some((entry) => entry.status === "INVALID") ? undefined : value, issues };
}

export function validateOptionQuote(quote: OptionQuote, config: ModelConfiguration, asOfIso: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (quote.contract.multiplier !== config.contractMultiplier) {
    issues.push(issue("INVALID", "WRONG_MULTIPLIER", "Option multiplier does not match approved configuration."));
  }
  if (quote.contract.exerciseStyle !== config.exerciseStyle) {
    issues.push(issue("INVALID", "WRONG_EXERCISE_STYLE", "Option exercise style does not match approved configuration."));
  }
  if (quote.contract.settlementType !== config.settlementType) {
    issues.push(issue("INVALID", "WRONG_SETTLEMENT_TYPE", "Option settlement type does not match approved configuration."));
  }
  if (quote.bid === null) {
    issues.push(issue("INVALID", "MISSING_BID", "Option quote is missing bid."));
  } else if (quote.bid <= 0) {
    issues.push(issue("INVALID", "ZERO_BID", "Option bid must be greater than zero."));
  }
  if (quote.ask === null) {
    issues.push(issue("INVALID", "MISSING_ASK", "Option quote is missing ask."));
  } else if (quote.ask <= 0) {
    issues.push(issue("INVALID", "ZERO_ASK", "Option ask must be greater than zero."));
  }
  if (quote.bid !== null && quote.ask !== null) {
    if (quote.bid > quote.ask) {
      issues.push(issue("INVALID", "CROSSED_MARKET", "Option bid exceeds ask."));
    } else if (quote.ask - quote.bid < 0) {
      issues.push(issue("INVALID", "NEGATIVE_SPREAD", "Option bid/ask spread is negative."));
    } else if (quote.ask > 0 && (quote.ask - quote.bid) / quote.ask > config.maxLegBidAskSpreadDecimal) {
      issues.push(issue("WARNING", "WIDE_SPREAD", "Option bid/ask spread exceeds configured warning threshold."));
    }
  }
  if (minutesBetween(quote.quoteTimestamp, asOfIso) > config.maxQuoteAgeMinutes) {
    issues.push(issue("STALE", "STALE_QUOTE", "Option quote timestamp exceeds configured maximum age."));
  }
  return issues;
}

export function issue(status: ValidationIssue["status"], code: ValidationIssue["code"], message: string, fieldId?: string): ValidationIssue {
  return { status, code, message, fieldId };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null;
}
