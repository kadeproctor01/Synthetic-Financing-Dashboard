import { calculationEngineVersion } from "./config";
import { addMonthsIso, daysBetween } from "./date";
import { buildCollateralMetrics, buildFinancingMetrics, executableShortBoxCreditPerIndexPoint } from "./calculations";
import { issue, validateOptionQuote } from "./validation";
import type {
  BoxCandidate,
  BoxLeg,
  BoxRequest,
  CalculationResult,
  MarketDataProvider,
  MarketDataSnapshot,
  ModelConfiguration,
  OptionQuote,
  OptionRight,
  QuoteValidationStatus,
  ValidationIssue
} from "./types";

export async function calculateBoxStructures(
  request: BoxRequest,
  config: ModelConfiguration,
  provider: MarketDataProvider
): Promise<CalculationResult> {
  const snapshot = await provider.getSnapshot(request, config);
  const candidates = generateCandidates(request, config, snapshot);
  const validCandidates = candidates.filter((candidate) => candidate.quoteStatus === "VALID" || candidate.quoteStatus === "WARNING");
  validCandidates.sort(compareCandidates);

  return {
    calculationEngineVersion,
    configurationVersion: config.configurationVersion,
    request,
    marketDataProvider: snapshot.provider,
    marketDataSnapshotTimestamp: snapshot.snapshotTimestamp,
    candidates,
    selectedCandidate: validCandidates[0] ?? null,
    validationIssues:
      candidates.length > 0
        ? []
        : [issue("INVALID", "MISSING_LEG", "No valid box-spread candidates could be generated from the market-data snapshot.")]
  };
}

export function generateCandidates(
  request: BoxRequest,
  config: ModelConfiguration,
  snapshot: MarketDataSnapshot
): BoxCandidate[] {
  const targetExpiration = addMonthsIso(request.tradeDate, request.desiredTenorMonths);
  const expirations = unique(snapshot.quotes.map((quote) => quote.contract.expirationDate))
    .filter((expirationDate) => {
      const distance = daysBetween(targetExpiration, expirationDate);
      return distance >= 0 && distance <= config.expirationSearchWindowDays;
    })
    .sort();

  const candidates: BoxCandidate[] = [];
  for (const expirationDate of expirations) {
    for (const width of config.approvedWidths) {
      const strikes = unique(
        snapshot.quotes
          .filter((quote) => quote.contract.expirationDate === expirationDate && quote.contract.seriesType === "STANDARD")
          .map((quote) => quote.contract.strike)
      ).sort((a, b) => a - b);

      for (const lowerStrike of strikes) {
        const upperStrike = lowerStrike + width;
        if (!strikes.includes(upperStrike)) {
          continue;
        }
        const legs = buildShortBoxLegs(snapshot, config, expirationDate, lowerStrike, upperStrike);
        const validationIssues = validateLegSet(legs, config, snapshot.snapshotTimestamp);
        if (legs.length !== 4) {
          validationIssues.push(issue("INVALID", "MISSING_LEG", "A complete four-leg box could not be built."));
        }

        const credit = legs.length === 4 ? executableShortBoxCreditPerIndexPoint(legs) : 0;
        const financingResult = buildFinancingMetrics({
          request,
          config,
          lowerStrike,
          upperStrike,
          expirationDate,
          executedBoxCreditPerIndexPoint: credit
        });
        validationIssues.push(...financingResult.issues);
        if (!financingResult.financing) {
          continue;
        }
        const collateral = buildCollateralMetrics(request, config, financingResult.financing.maturityObligationUsd);
        if (financingResult.financing.netCreditReceivedUsd < request.requestedNetProceedsUsd) {
          validationIssues.push(issue("INVALID", "INSUFFICIENT_NET_PROCEEDS", "Rounded whole-contract candidate does not meet requested net proceeds."));
        }
        if (collateral.initialObligationLtvDecimal > config.maxInitialLtvDecimal) {
          validationIssues.push(issue("WARNING", "INSUFFICIENT_NET_PROCEEDS", "Initial obligation LTV exceeds configured review threshold."));
        }
        if (collateral.stressedObligationLtvDecimal > config.maxStressedLtvDecimal) {
          validationIssues.push(issue("WARNING", "INSUFFICIENT_NET_PROCEEDS", "Stressed obligation LTV exceeds configured review threshold."));
        }

        candidates.push({
          candidateId: `${snapshot.underlying}-${expirationDate}-${lowerStrike}-${upperStrike}`,
          underlying: snapshot.underlying,
          expirationDate,
          lowerStrike,
          upperStrike,
          legs,
          quoteStatus: summarizeStatus(validationIssues),
          validationIssues,
          financing: financingResult.financing,
          collateral
        });
      }
    }
  }
  return candidates;
}

function buildShortBoxLegs(
  snapshot: MarketDataSnapshot,
  config: ModelConfiguration,
  expirationDate: string,
  lowerStrike: number,
  upperStrike: number
): BoxLeg[] {
  const lowerCall = findQuote(snapshot, config, expirationDate, lowerStrike, "CALL");
  const upperCall = findQuote(snapshot, config, expirationDate, upperStrike, "CALL");
  const lowerPut = findQuote(snapshot, config, expirationDate, lowerStrike, "PUT");
  const upperPut = findQuote(snapshot, config, expirationDate, upperStrike, "PUT");
  const legs: BoxLeg[] = [];
  if (lowerCall?.bid !== null && lowerCall?.bid !== undefined) {
    legs.push({ action: "SELL", right: "CALL", strike: lowerStrike, executionPricePerIndexPoint: lowerCall.bid, quote: lowerCall });
  }
  if (upperCall?.ask !== null && upperCall?.ask !== undefined) {
    legs.push({ action: "BUY", right: "CALL", strike: upperStrike, executionPricePerIndexPoint: upperCall.ask, quote: upperCall });
  }
  if (lowerPut?.ask !== null && lowerPut?.ask !== undefined) {
    legs.push({ action: "BUY", right: "PUT", strike: lowerStrike, executionPricePerIndexPoint: lowerPut.ask, quote: lowerPut });
  }
  if (upperPut?.bid !== null && upperPut?.bid !== undefined) {
    legs.push({ action: "SELL", right: "PUT", strike: upperStrike, executionPricePerIndexPoint: upperPut.bid, quote: upperPut });
  }
  return legs;
}

function findQuote(
  snapshot: MarketDataSnapshot,
  config: ModelConfiguration,
  expirationDate: string,
  strike: number,
  right: OptionRight
): OptionQuote | undefined {
  return snapshot.quotes.find(
    (quote) =>
      quote.contract.underlying === config.approvedUnderlying &&
      quote.contract.expirationDate === expirationDate &&
      quote.contract.strike === strike &&
      quote.contract.right === right &&
      quote.contract.seriesType === "STANDARD"
  );
}

function validateLegSet(legs: BoxLeg[], config: ModelConfiguration, asOfIso: string): ValidationIssue[] {
  return legs.flatMap((leg) => validateOptionQuote(leg.quote, config, asOfIso));
}

function summarizeStatus(issues: ValidationIssue[]): QuoteValidationStatus {
  if (issues.some((entry) => entry.status === "INVALID")) {
    return "INVALID";
  }
  if (issues.some((entry) => entry.status === "STALE")) {
    return "STALE";
  }
  if (issues.some((entry) => entry.status === "WARNING")) {
    return "WARNING";
  }
  return "VALID";
}

function compareCandidates(a: BoxCandidate, b: BoxCandidate): number {
  return (
    a.financing.effectiveAnnualRateDecimal - b.financing.effectiveAnnualRateDecimal ||
    a.financing.excessProceedsUsd - b.financing.excessProceedsUsd ||
    a.financing.maturityObligationUsd - b.financing.maturityObligationUsd ||
    a.expirationDate.localeCompare(b.expirationDate)
  );
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}
