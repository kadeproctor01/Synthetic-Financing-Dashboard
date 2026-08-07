"use client";

import { FormEvent, useMemo, useState } from "react";

type QuoteStatus = "VALID" | "WARNING" | "INVALID" | "STALE";

type BoxCandidate = {
  candidateId: string;
  underlying: string;
  expirationDate: string;
  lowerStrike: number;
  upperStrike: number;
  quoteStatus: QuoteStatus;
  validationIssues: {
    status: QuoteStatus;
    code: string;
    message: string;
    fieldId?: string;
  }[];
  legs: {
    action: "BUY" | "SELL";
    right: "CALL" | "PUT";
    strike: number;
    executionPricePerIndexPoint: number;
  }[];
  financing: {
    contractCount: number;
    maturityObligationUsd: number;
    executedBoxCreditPerIndexPoint: number;
    netCreditReceivedUsd: number;
    allInFinancingCostUsd: number;
    excessProceedsUsd: number;
    effectiveAnnualRateDecimal: number;
  };
  collateral: {
    stressedObligationLtvDecimal: number;
  };
};

type CalculationResult = {
  calculationEngineVersion: string;
  configurationVersion: string;
  marketDataProvider: string;
  candidates: BoxCandidate[];
  selectedCandidate: BoxCandidate | null;
};

const defaultTradeDate = "2026-08-07";

export default function Home() {
  const [requestedNetProceedsUsd, setRequestedNetProceedsUsd] = useState(500000);
  const [desiredTenorMonths, setDesiredTenorMonths] = useState(12);
  const [eligibleCollateralValueUsd, setEligibleCollateralValueUsd] = useState(2000000);
  const [tradeDate, setTradeDate] = useState(defaultTradeDate);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestedNetProceedsUsd,
        desiredTenorMonths,
        eligibleCollateralValueUsd,
        tradeDate
      })
    });

    const payload = (await response.json()) as CalculationResult;
    setResult(payload);
    setIsLoading(false);

    if (!response.ok) {
      setError("Calculation request failed validation.");
    }
  }

  const selected = result?.selectedCandidate;
  const sortedCandidates = useMemo(
    () =>
      [...(result?.candidates ?? [])]
        .sort((a, b) => a.financing.effectiveAnnualRateDecimal - b.financing.effectiveAnnualRateDecimal)
        .slice(0, 8),
    [result]
  );

  const selectedWarnings = selected
    ? Array.from(new Set(selected.validationIssues.map((issue) => issue.message)))
    : [];

  return (
    <main className="shell">
      <section className="workspace">
        <aside className="inputPanel">
          <div>
            <p className="eyebrow">Larson Financial</p>
            <h1>Box Spread Financing</h1>
            <p className="subtle">
              Internal deterministic calculator using workbook-derived methodology and mock market data.
            </p>
          </div>

          <form onSubmit={submit} className="form">
            <label>
              Requested net proceeds
              <input
                type="number"
                min="1"
                max="100000000"
                step="1"
                value={requestedNetProceedsUsd}
                onChange={(event) => setRequestedNetProceedsUsd(Number(event.target.value))}
              />
            </label>

            <label>
              Desired tenor
              <input
                type="number"
                min="1"
                max="120"
                step="1"
                value={desiredTenorMonths}
                onChange={(event) => setDesiredTenorMonths(Number(event.target.value))}
              />
            </label>

            <label>
              Eligible collateral value
              <input
                type="number"
                min="1"
                max="100000000"
                step="1"
                value={eligibleCollateralValueUsd}
                onChange={(event) => setEligibleCollateralValueUsd(Number(event.target.value))}
              />
            </label>

            <label>
              Trade date
              <input type="date" value={tradeDate} onChange={(event) => setTradeDate(event.target.value)} />
            </label>

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Calculating..." : "Calculate structures"}
            </button>
          </form>

          <div className="method">
            <h2>Method Status</h2>
            <p>
              Rates are represented as decimals internally and shown as percentages. Candidate ranking is provisional:
              lowest all-in effective annual rate, then lowest excess proceeds.
            </p>
          </div>
        </aside>

        <section className="results">
          {error ? <div className="banner danger">{error}</div> : null}

          {!result ? (
            <div className="empty">
              <h2>Ready for calculation</h2>
              <p>Enter advisor-approved inputs and run a deterministic candidate search.</p>
            </div>
          ) : (
            <>
              <div className="statusRow">
                <span>{result.marketDataProvider}</span>
                <span>{result.configurationVersion}</span>
                <span>{result.calculationEngineVersion}</span>
              </div>

              {selected ? (
                <>
                  <section className="selected">
                    <div>
                      <p className="eyebrow">Selected Candidate</p>
                      <h2>
                        {selected.underlying} {selected.lowerStrike} / {selected.upperStrike}
                      </h2>
                      <p className="subtle">
                        Expires {selected.expirationDate} with {selected.financing.contractCount} box contracts.
                      </p>
                    </div>

                    <div className="metrics">
                      <Metric label="Net proceeds" value={currency(selected.financing.netCreditReceivedUsd)} />
                      <Metric label="Maturity obligation" value={currency(selected.financing.maturityObligationUsd)} />
                      <Metric label="All-in cost" value={currency(selected.financing.allInFinancingCostUsd)} />
                      <Metric label="Effective annual rate" value={percent(selected.financing.effectiveAnnualRateDecimal)} />
                      <Metric label="Excess proceeds" value={currency(selected.financing.excessProceedsUsd)} />
                      <Metric label="Stressed LTV" value={percent(selected.collateral.stressedObligationLtvDecimal)} />
                    </div>
                  </section>

                  {selected.quoteStatus === "WARNING" && selectedWarnings.length > 0 ? (
                    <div className="warningNote">
                      <strong>Why this candidate is marked WARNING</strong>
                      <ul>
                        {selectedWarnings.map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="banner danger">
                  No valid structure was produced. Review validation issues before proceeding.
                </div>
              )}

              <section className="tableWrap">
                <div className="tableHeader">
                  <h2>Candidate Set</h2>
                  <span>{result.candidates.length} evaluated</span>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Expiration</th>
                      <th>Strikes</th>
                      <th>Contracts</th>
                      <th>Credit</th>
                      <th>Net proceeds</th>
                      <th>Effective rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCandidates.map((candidate) => (
                      <tr key={candidate.candidateId}>
                        <td>
                          <span className={`pill ${candidate.quoteStatus.toLowerCase()}`}>
                            {candidate.quoteStatus}
                          </span>
                        </td>
                        <td>{candidate.expirationDate}</td>
                        <td>
                          {candidate.lowerStrike} / {candidate.upperStrike}
                        </td>
                        <td>{candidate.financing.contractCount}</td>
                        <td>{candidate.financing.executedBoxCreditPerIndexPoint.toFixed(2)}</td>
                        <td>{currency(candidate.financing.netCreditReceivedUsd)}</td>
                        <td>{percent(candidate.financing.effectiveAnnualRateDecimal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="legGrid">
                <h2>Selected Four-Leg Package</h2>
                {selected?.legs.map((leg) => (
                  <div className="leg" key={`${leg.action}-${leg.right}-${leg.strike}`}>
                    <span>{leg.action}</span>
                    <strong>{leg.right}</strong>
                    <span>{leg.strike}</span>
                    <span>{leg.executionPricePerIndexPoint.toFixed(2)}</span>
                  </div>
                ))}
              </section>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function percent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
