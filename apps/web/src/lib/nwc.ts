/**
 * Nostr Wallet Connect (NWC) Service
 * Handles wallet connections, authentication, and Lightning Network payments
 */

import { webln } from "@getalby/sdk";
import * as nostrTools from "nostr-tools";

// Types for NWC functionality
export interface NWCWallet {
  connectionUri: string;
  alias?: string;
  balance?: number;
  connected: boolean;
  lastConnected?: Date;
}

export interface PaymentRequest {
  invoice: string;
  amount?: number;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentHash?: string;
  preimage?: string;
  error?: string;
}

export interface WalletInfo {
  alias?: string;
  balance?: number;
  methods?: string[];
}

class NWCService {
  private nwc: any = null;
  private connectionUri: string | null = null;
  private isConnected: boolean = false;

  /**
   * Connect to a NWC-compatible wallet using connection URI
   */
  async connectWallet(
    connectionUri: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate connection URI format
      if (!this.isValidNWCUri(connectionUri)) {
        throw new Error("Invalid NWC connection URI format");
      }

      // Create NWC instance
      this.nwc = new webln.NWC({
        nostrWalletConnectUrl: connectionUri,
        authToken: this.extractAuthToken(connectionUri),
      } as any);

      // Enable the connection
      await this.nwc.enable();

      this.connectionUri = connectionUri;
      this.isConnected = true;

      // Store connection in localStorage for persistence
      localStorage.setItem(
        "nwc_connection",
        JSON.stringify({
          uri: connectionUri,
          connectedAt: new Date().toISOString(),
        })
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to connect NWC wallet:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  /**
   * Disconnect the current wallet
   */
  async disconnectWallet(): Promise<void> {
    if (this.nwc) {
      try {
        // Close the connection if supported
        if (this.nwc.close) {
          await this.nwc.close();
        }
      } catch (error) {
        console.warn("Error closing NWC connection:", error);
      }
    }

    this.nwc = null;
    this.connectionUri = null;
    this.isConnected = false;

    // Remove from localStorage
    localStorage.removeItem("nwc_connection");
  }

  /**
   * Restore connection from localStorage
   */
  async restoreConnection(): Promise<boolean> {
    try {
      const stored = localStorage.getItem("nwc_connection");
      if (!stored) return false;

      const { uri } = JSON.parse(stored);
      const result = await this.connectWallet(uri);
      return result.success;
    } catch (error) {
      console.error("Failed to restore NWC connection:", error);
      localStorage.removeItem("nwc_connection");
      return false;
    }
  }

  /**
   * Get wallet information (balance, methods, etc.)
   */
  async getWalletInfo(): Promise<WalletInfo | null> {
    if (!this.isConnected || !this.nwc) {
      throw new Error("Wallet not connected");
    }

    try {
      const info: WalletInfo = {};

      // Try to get balance if supported
      if (this.nwc.getBalance) {
        const balance = await this.nwc.getBalance();
        info.balance = balance.balance;
      }

      // Try to get wallet info if supported
      if (this.nwc.getInfo) {
        const walletInfo = await this.nwc.getInfo();
        info.alias = walletInfo.alias;
        info.methods = walletInfo.methods;
      }

      return info;
    } catch (error) {
      console.error("Failed to get wallet info:", error);
      return null;
    }
  }

  /**
   * Send a Lightning payment
   */
  async sendPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.isConnected || !this.nwc) {
      return {
        success: false,
        error: "Wallet not connected",
      };
    }

    try {
      const response = await this.nwc.sendPayment(request.invoice);

      return {
        success: true,
        paymentHash: response.payment_hash,
        preimage: response.preimage,
      };
    } catch (error) {
      console.error("Payment failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment failed",
      };
    }
  }

  /**
   * Create an invoice (if wallet supports receiving)
   */
  async createInvoice(
    amount: number,
    description?: string
  ): Promise<{ success: boolean; invoice?: string; error?: string }> {
    if (!this.isConnected || !this.nwc) {
      return {
        success: false,
        error: "Wallet not connected",
      };
    }

    try {
      if (!this.nwc.makeInvoice) {
        return {
          success: false,
          error: "Wallet does not support creating invoices",
        };
      }

      const response = await this.nwc.makeInvoice({
        amount: amount * 1000, // Convert to millisats
        description: description || "Dead Man's Switch payment",
      });

      return {
        success: true,
        invoice: response.payment_request,
      };
    } catch (error) {
      console.error("Failed to create invoice:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create invoice",
      };
    }
  }

  /**
   * Sign a Nostr event for authentication
   */
  async signNostrEvent(
    event: any
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    if (!this.isConnected || !this.nwc) {
      return {
        success: false,
        error: "Wallet not connected",
      };
    }

    try {
      // Try to sign using NWC if supported
      if (this.nwc.signEvent) {
        const signedEvent = await this.nwc.signEvent(event);
        return {
          success: true,
          signature: signedEvent.sig,
        };
      }

      // Try to get public key and sign message
      if (this.nwc.getPublicKey && this.nwc.signMessage) {
        const publicKey = await this.nwc.getPublicKey();
        const message = JSON.stringify(event);
        const signature = await this.nwc.signMessage(message);

        return {
          success: true,
          signature,
        };
      }

      return {
        success: false,
        error: "Wallet does not support Nostr event signing",
      };
    } catch (error) {
      console.error("Failed to sign Nostr event:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Signing failed",
      };
    }
  }

  /**
   * Get the public key from the connected wallet
   */
  async getPublicKey(): Promise<string | null> {
    if (!this.isConnected || !this.nwc) {
      return null;
    }

    try {
      if (this.nwc.getPublicKey) {
        return await this.nwc.getPublicKey();
      }

      // Try to extract from connection URI if available
      if (this.connectionUri) {
        return this.extractPublicKeyFromUri(this.connectionUri);
      }

      return null;
    } catch (error) {
      console.error("Failed to get public key:", error);
      return null;
    }
  }

  /**
   * Check if wallet is currently connected
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get connection URI (without sensitive parts)
   */
  getConnectionInfo(): { connected: boolean; uri?: string } {
    return {
      connected: this.isConnected,
      uri: this.connectionUri
        ? this.maskSensitiveUri(this.connectionUri)
        : undefined,
    };
  }

  // Private helper methods
  private isValidNWCUri(uri: string): boolean {
    try {
      const url = new URL(uri);
      return url.protocol === "nostr+walletconnect:";
    } catch {
      return false;
    }
  }

  private extractAuthToken(uri: string): string | undefined {
    try {
      const url = new URL(uri);
      return url.searchParams.get("secret") || undefined;
    } catch {
      return undefined;
    }
  }

  private extractPublicKeyFromUri(uri: string): string | null {
    try {
      const url = new URL(uri);
      const pubkey = url.searchParams.get("pubkey");
      return pubkey || null;
    } catch {
      return null;
    }
  }

  private maskSensitiveUri(uri: string): string {
    try {
      const url = new URL(uri);
      // Remove secret parameter for display
      url.searchParams.delete("secret");
      return url.toString();
    } catch {
      return uri;
    }
  }
}

// Export singleton instance
export const nwcService = new NWCService();

// Export utility functions
export const NWCUtils = {
  /**
   * Validate a Lightning invoice
   */
  isValidInvoice(invoice: string): boolean {
    return /^(lnbc|lntb|lnbcrt)[0-9]+[munp]?[0-9]*[a-z0-9]+$/i.test(invoice);
  },

  /**
   * Parse invoice amount (in sats)
   */
  parseInvoiceAmount(invoice: string): number | null {
    try {
      // This is a simplified parser - you might want to use a proper BOLT11 decoder
      const match = invoice.match(/lnbc(\d+)([munp])?/i);
      if (!match) return null;

      const amount = parseInt(match[1]);
      const unit = match[2];

      switch (unit) {
        case "m":
          return amount / 1000; // milli-bitcoin to sats
        case "u":
          return amount * 100; // micro-bitcoin to sats
        case "n":
          return amount / 10; // nano-bitcoin to sats
        case "p":
          return amount / 10000; // pico-bitcoin to sats
        default:
          return amount; // assume sats
      }
    } catch {
      return null;
    }
  },

  /**
   * Generate a challenge message for Nostr authentication
   */
  generateAuthChallenge(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const challengeHex = Array.from(challenge)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `dms-auth-${timestamp}-${challengeHex}`;
  },
};
