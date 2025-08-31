/**
 * Nostr Browser Extension Integration (NIP-07)
 * Handles connection to browser-based Nostr clients
 */

import * as nostrTools from "nostr-tools";

// Types for browser extension API
export interface NostrBrowserExtension {
  getPublicKey(): Promise<string>;
  signEvent(event: any): Promise<any>;
  getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}

export interface BrowserConnectionInfo {
  connected: boolean;
  publicKey?: string;
  extensionName?: string;
  supportedNIPs?: number[];
}

declare global {
  interface Window {
    nostr?: NostrBrowserExtension;
  }
}

class NostrBrowserService {
  private connected: boolean = false;
  private publicKey: string | null = null;
  private extensionName: string | null = null;

  /**
   * Check if a Nostr browser extension is available
   */
  isExtensionAvailable(): boolean {
    return typeof window !== "undefined" && !!window.nostr;
  }

  /**
   * Get the name of the detected extension
   */
  getExtensionName(): string {
    if (typeof window === "undefined" || !window.nostr) {
      return "Unknown";
    }

    // Try to detect specific extensions based on available features
    // This is heuristic-based since there's no standard way to get extension name
    const nostr = window.nostr;

    if (nostr.nip04 && typeof nostr.getRelays === "function") {
      return "Alby";
    }

    if (typeof nostr.signEvent === "function") {
      return "nos2x";
    }

    return "Nostr Extension";
  }

  /**
   * Connect to the browser extension
   */
  async connect(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isExtensionAvailable()) {
        return {
          success: false,
          error:
            "No Nostr extension detected. Please install a compatible browser extension.",
        };
      }

      const nostr = window.nostr!;

      // Request public key (this will trigger permission prompt)
      this.publicKey = await nostr.getPublicKey();
      this.extensionName = this.getExtensionName();
      this.connected = true;

      // Store connection info in localStorage
      localStorage.setItem(
        "nostr_browser_connection",
        JSON.stringify({
          connected: true,
          publicKey: this.publicKey,
          extensionName: this.extensionName,
          connectedAt: new Date().toISOString(),
        })
      );

      return { success: true };
    } catch (error) {
      console.error("Failed to connect to browser extension:", error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Disconnect from browser extension
   */
  disconnect(): void {
    this.connected = false;
    this.publicKey = null;
    this.extensionName = null;
    localStorage.removeItem("nostr_browser_connection");
  }

  /**
   * Get current connection info
   */
  getConnectionInfo(): BrowserConnectionInfo {
    return {
      connected: this.connected,
      publicKey: this.publicKey || undefined,
      extensionName: this.extensionName || undefined,
    };
  }

  /**
   * Sign a Nostr event using browser extension
   */
  async signEvent(
    event: any
  ): Promise<{ success: boolean; signedEvent?: any; error?: string }> {
    try {
      if (!this.connected || !window.nostr) {
        return {
          success: false,
          error: "Not connected to browser extension",
        };
      }

      const signedEvent = await window.nostr.signEvent(event);
      return {
        success: true,
        signedEvent,
      };
    } catch (error) {
      console.error("Failed to sign event:", error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Sign a message for authentication
   */
  async signMessage(
    message: string
  ): Promise<{
    success: boolean;
    signature?: string;
    signedEvent?: any;
    error?: string;
  }> {
    try {
      if (!this.connected || !this.publicKey) {
        return {
          success: false,
          error: "Not connected to browser extension",
        };
      }

      // Create a simple Nostr event for signing the message
      const event = {
        kind: 22242, // NIP-42 auth event kind
        created_at: Math.floor(Date.now() / 1000),
        tags: [["challenge", message]],
        content: `Authentication for Dead Man's Switch at ${new Date().toISOString()}`,
        pubkey: this.publicKey,
      };

      const signResult = await this.signEvent(event);
      if (!signResult.success || !signResult.signedEvent) {
        return {
          success: false,
          error: signResult.error || "Failed to sign authentication event",
        };
      }

      return {
        success: true,
        signature: signResult.signedEvent.sig,
        signedEvent: signResult.signedEvent,
      };
    } catch (error) {
      console.error("Failed to sign message:", error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Get public key
   */
  async getPublicKey(): Promise<string | null> {
    try {
      if (this.connected && this.publicKey) {
        return this.publicKey;
      }

      if (!window.nostr) {
        return null;
      }

      this.publicKey = await window.nostr.getPublicKey();
      return this.publicKey;
    } catch (error) {
      console.error("Failed to get public key:", error);
      return null;
    }
  }

  /**
   * Get relays from extension (if supported)
   */
  async getRelays(): Promise<Record<
    string,
    { read: boolean; write: boolean }
  > | null> {
    try {
      if (!this.connected || !window.nostr?.getRelays) {
        return null;
      }

      return await window.nostr.getRelays();
    } catch (error) {
      console.error("Failed to get relays:", error);
      return null;
    }
  }

  /**
   * Encrypt a message using NIP-04 (if supported)
   */
  async encrypt(
    recipientPubkey: string,
    plaintext: string
  ): Promise<string | null> {
    try {
      if (!this.connected || !window.nostr?.nip04?.encrypt) {
        return null;
      }

      return await window.nostr.nip04.encrypt(recipientPubkey, plaintext);
    } catch (error) {
      console.error("Failed to encrypt message:", error);
      return null;
    }
  }

  /**
   * Decrypt a message using NIP-04 (if supported)
   */
  async decrypt(
    senderPubkey: string,
    ciphertext: string
  ): Promise<string | null> {
    try {
      if (!this.connected || !window.nostr?.nip04?.decrypt) {
        return null;
      }

      return await window.nostr.nip04.decrypt(senderPubkey, ciphertext);
    } catch (error) {
      console.error("Failed to decrypt message:", error);
      return null;
    }
  }

  /**
   * Restore connection from localStorage
   */
  restoreConnection(): boolean {
    try {
      if (!this.isExtensionAvailable()) {
        return false;
      }

      const stored = localStorage.getItem("nostr_browser_connection");
      if (!stored) {
        return false;
      }

      const connectionInfo = JSON.parse(stored);
      this.connected = connectionInfo.connected;
      this.publicKey = connectionInfo.publicKey;
      this.extensionName = connectionInfo.extensionName;

      return this.connected;
    } catch (error) {
      console.error("Failed to restore browser connection:", error);
      localStorage.removeItem("nostr_browser_connection");
      return false;
    }
  }

  // Private helper methods
  private getErrorMessage(error: any): string {
    if (typeof error === "string") {
      return error;
    }

    if (error instanceof Error) {
      // Handle common extension errors
      if (error.message.includes("User rejected")) {
        return "User denied permission to connect";
      }
      if (error.message.includes("not found")) {
        return "Extension not found or not properly installed";
      }
      return error.message;
    }

    return "An unexpected error occurred";
  }

  /**
   * Check if the extension supports specific NIPs
   */
  getSupportedFeatures(): {
    canSign: boolean;
    canEncrypt: boolean;
    canGetRelays: boolean;
    extensionName: string;
  } {
    if (!window.nostr) {
      return {
        canSign: false,
        canEncrypt: false,
        canGetRelays: false,
        extensionName: "None",
      };
    }

    return {
      canSign: typeof window.nostr.signEvent === "function",
      canEncrypt: !!window.nostr.nip04?.encrypt,
      canGetRelays: typeof window.nostr.getRelays === "function",
      extensionName: this.getExtensionName(),
    };
  }
}

// Export singleton instance
export const nostrBrowserService = new NostrBrowserService();

// Utility functions
export const NostrBrowserUtils = {
  /**
   * Get list of popular Nostr browser extensions
   */
  getPopularExtensions(): Array<{
    name: string;
    url: string;
    description: string;
    chromeUrl?: string;
    firefoxUrl?: string;
  }> {
    return [
      {
        name: "Alby",
        url: "https://getalby.com",
        description: "Bitcoin Lightning wallet with Nostr support",
        chromeUrl:
          "https://chrome.google.com/webstore/detail/alby-bitcoin-lightning-wa/iokeahhehimjnekafflcihljlcjccdbe",
        firefoxUrl: "https://addons.mozilla.org/en-US/firefox/addon/alby/",
      },
      {
        name: "nos2x",
        url: "https://github.com/fiatjaf/nos2x",
        description: "Nostr signer extension for web browsers",
        chromeUrl:
          "https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp",
      },
      {
        name: "Flamingo",
        url: "https://www.flamingo.me",
        description: "Nostr client and signer for browsers",
        chromeUrl:
          "https://chrome.google.com/webstore/detail/flamingo/nkmhdhohbogfndohbmegnadfbmjkobaa",
      },
      {
        name: "Horse",
        url: "https://github.com/fiatjaf/horse",
        description: "Simple Nostr browser extension",
        chromeUrl:
          "https://chrome.google.com/webstore/detail/horse/jhgikcjnhfeabcajojbkacmcpjlhblpd",
      },
    ];
  },

  /**
   * Generate a challenge string for authentication
   */
  generateAuthChallenge(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const challenge = crypto.getRandomValues(new Uint8Array(16));
    const challengeHex = Array.from(challenge)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `dms-browser-auth-${timestamp}-${challengeHex}`;
  },

  /**
   * Detect browser type for extension recommendations
   */
  getBrowserInfo(): { name: string; canInstallExtensions: boolean } {
    if (typeof window === "undefined") {
      return { name: "Unknown", canInstallExtensions: false };
    }

    const userAgent = window.navigator.userAgent;

    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
      return { name: "Chrome", canInstallExtensions: true };
    }
    if (userAgent.includes("Firefox")) {
      return { name: "Firefox", canInstallExtensions: true };
    }
    if (userAgent.includes("Edg")) {
      return { name: "Edge", canInstallExtensions: true };
    }
    if (userAgent.includes("Safari")) {
      return { name: "Safari", canInstallExtensions: false };
    }

    return { name: "Unknown", canInstallExtensions: false };
  },
};
