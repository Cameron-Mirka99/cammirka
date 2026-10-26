import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getClaims, isAdmin } from "../shared/auth.js";
import { jsonResponse } from "../shared/response.js";

const lambda = new LambdaClient({ region: process.env.AWS_REGION });
const RETENTION_SWEEP_FUNCTION_NAME = process.env.RETENTION_SWEEP_FUNCTION_NAME;

// Fires retentionSweep asynchronously (InvocationType "Event") instead of
// calling it through this API route synchronously: retentionSweep has a
// 600s timeout for walking every folder's S3 listing, far past API
// Gateway's fixed 29s integration limit, so a synchronous call would time
// out client-side on any real-sized run even though the sweep itself kept
// going. Admin checks CloudWatch logs (function: retentionSweep) for results.
export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!RETENTION_SWEEP_FUNCTION_NAME) {
      return jsonResponse(event, 500, { message: "RETENTION_SWEEP_FUNCTION_NAME is not configured." }, "POST,OPTIONS");
    }

    const claims = getClaims(event);
    if (!isAdmin(claims)) {
      return jsonResponse(event, 403, { message: "Admin access required." }, "POST,OPTIONS");
    }

    await lambda.send(
      new InvokeCommand({
        FunctionName: RETENTION_SWEEP_FUNCTION_NAME,
        InvocationType: "Event",
      }),
    );

    return jsonResponse(event, 202, {
      message: "Retention sweep triggered. Check CloudWatch logs (function: retentionSweep) for results.",
    }, "POST,OPTIONS");
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(event, 500, { message: `Failed to trigger retention sweep: ${message}` }, "POST,OPTIONS");
  }
};
