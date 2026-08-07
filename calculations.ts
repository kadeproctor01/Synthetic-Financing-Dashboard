# Calculation Methodology

This scaffold implements deterministic, workbook-derived calculations for an internal Larson Financial box-spread financing platform. The current temporary authoritative workbook is `Box Spread Strategy Model - Rough Draft v2.xlsx`.

## Current Structure

The initial product is modeled as a short European-style cash-settled index box:

- Sell lower-strike call.
- Buy upper-strike call.
- Buy lower-strike put.
- Sell upper-strike put.

All four legs must use the same approved underlying, expiration, multiplier, settlement type, exercise style, and two valid strikes.

## Current Configuration Defaults

- Approved underlying: `SPX`
- Contract multiplier: `100`
- Option legs per box: `4`
- Annualization basis: `365` calendar days
- Exercise style: `EUROPEAN`
- Settlement type: `CASH`
- Opening commission: `$0.65` per contract per leg
- Collateral stress decline: `40%`

These values are in `src/domain/config.ts` and should move to approved configuration storage before production use.

## Core Formulas

- `boxWidth = upperStrike - lowerStrike`
- `faceValuePerContractUsd = boxWidth * contractMultiplier`
- `maturityObligationUsd = faceValuePerContractUsd * contractCount`
- `executedBoxCreditPerIndexPoint = lowerCallBid - upperCallAsk + upperPutBid - lowerPutAsk`
- `grossBoxCreditUsd = executedBoxCreditPerIndexPoint * contractMultiplier * contractCount`
- `transactionCostUsd = contractCount * optionLegsPerBox * (commissionPerContractPerLegUsd + exchangeFeePerContractPerLegUsd) + otherOpeningCostsUsd`
- `netCreditReceivedUsd = grossBoxCreditUsd - transactionCostUsd`
- `marketFinancingCostUsd = maturityObligationUsd - grossBoxCreditUsd`
- `allInFinancingCostUsd = maturityObligationUsd - netCreditReceivedUsd`
- `periodFinancingRateDecimal = maturityObligationUsd / netCreditReceivedUsd - 1`
- `effectiveAnnualRateDecimal = (maturityObligationUsd / netCreditReceivedUsd)^(365 / daysToMaturity) - 1`
- `simpleAnnualRateDecimal = (allInFinancingCostUsd / netCreditReceivedUsd) * (365 / daysToMaturity)`
- `excessProceedsUsd = netCreditReceivedUsd - requestedNetProceedsUsd`

Rates are represented internally as decimals, not whole percentages.

## Candidate Ranking

The current ranking is provisional and deterministic:

1. Lowest all-in effective annual rate.
2. Lowest excess proceeds.
3. Lowest maturity obligation.
4. Earliest expiration date.

Larson should formally approve ranking methodology before production activation.

## Market Data Boundary

The app currently uses `MockMarketDataProvider` to keep the scaffold runnable without licensed market data. Production calculation must use an approved market-data provider through the `MarketDataProvider` interface and must not use scraped brokerage pages or workbook-cached data as executable quotes.

## Current Limitations

- Complex-order package quotes are not implemented.
- Current candidate pricing is indicative from leg bid/ask sides.
- Custodian margin, suitability, account eligibility, tax treatment, and disclosure logic are placeholders for approved policies.
- Authentication and audit persistence are not implemented yet.
