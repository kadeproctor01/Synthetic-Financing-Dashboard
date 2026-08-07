import { NextResponse } from "next/server";
import { defaultModelConfiguration } from "@/src/domain/config";
import { calculateBoxStructures } from "@/src/domain/engine";
import { MockMarketDataProvider } from "@/src/domain/mockMarketData";
import { validateRequest } from "@/src/domain/validation";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const validation = validateRequest(payload);

  if (!validation.value) {
    return NextResponse.json(
      {
        calculationEngineVersion: "box-engine-0.1.0",
        configurationVersion: defaultModelConfiguration.configurationVersion,
        request: payload,
        marketDataProvider: "none",
        marketDataSnapshotTimestamp: null,
        candidates: [],
        selectedCandidate: null,
        validationIssues: validation.issues
      },
      { status: 400 }
    );
  }

  const result = await calculateBoxStructures(
    validation.value,
    defaultModelConfiguration,
    new MockMarketDataProvider()
  );

  return NextResponse.json(result);
}
