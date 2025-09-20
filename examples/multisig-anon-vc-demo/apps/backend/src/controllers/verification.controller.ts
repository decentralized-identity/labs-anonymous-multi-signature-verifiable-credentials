import {
  Controller,
  Post,
  Get,
  Body,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { initializeAgent } from "@/lib/veramo/agent";
import { VerificationService } from "@/lib/services/verification-service";

@Controller("api/verification")
export class VerificationController {
  /**
   * Verify a Verifiable Credential with multi-party approval
   * POST /api/verification/verify
   */
  @Post("verify")
  async verifyCredential(@Body() body: { credential: string }) {
    try {
      const { credential } = body;

      if (!credential) {
        throw new HttpException(
          "Missing required field: credential",
          HttpStatus.BAD_REQUEST
        );
      }

      const agent = await initializeAgent();
      const verificationService = await VerificationService.getInstance(agent);

      const result = await verificationService.verifyCredential(credential);

      return {
        success: result.valid,
        verification: result,
      };
    } catch (error) {
      console.error("Error verifying credential:", error);

      if (error instanceof HttpException) throw error;

      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : "Verification failed",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Inspect a Verifiable Credential without full verification
   * POST /api/verification/inspect
   */
  @Post("inspect")
  async inspectCredential(@Body() body: { credential: string }) {
    try {
      const { credential } = body;

      if (!credential) {
        throw new HttpException(
          "Missing required field: credential",
          HttpStatus.BAD_REQUEST
        );
      }

      const agent = await initializeAgent();
      const verificationService = await VerificationService.getInstance(agent);

      const result = await verificationService.inspectCredential(credential);

      if (result.error) {
        throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
      }

      return {
        success: true,
        credential: result,
      };
    } catch (error) {
      console.error("Error inspecting credential:", error);

      if (error instanceof HttpException) throw error;

      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : "Inspection failed",
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
