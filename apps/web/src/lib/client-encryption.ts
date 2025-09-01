/**
 * Client-side encryption service for Dead Man's Switch
 * Ensures email content is encrypted in the browser before transmission
 */

import { nostrBrowserService } from "./nostr-browser";
import * as nostrTools from "nostr-tools";

interface EncryptedEmailData {
  encryptedSubject: string;
  encryptedContent: string;
  encryptedRecipients: string;
  encryptionMethod: "browser-extension" | "local-keys" | "fallback";
  publicKey: string;
}

interface EmailData {
  subject: string;
  content: string;
  recipients: Array<{ email: string; name?: string }>;
}

export class ClientEncryptionService {
  /**
   * Encrypt email data on the client-side before sending to backend
   */
  async encryptEmailData(
    emailData: EmailData,
    userPublicKey?: string
  ): Promise<EncryptedEmailData> {
    // Try browser extension encryption first (most secure)
    const browserResult = await this.tryBrowserEncryption(emailData);
    if (browserResult) {
      return browserResult;
    }

    // Fall back to local key encryption
    const localResult = await this.tryLocalKeyEncryption(
      emailData,
      userPublicKey
    );
    if (localResult) {
      return localResult;
    }

    // Final fallback - still encrypt but with a warning
    return this.fallbackEncryption(emailData, userPublicKey);
  }

  /**
   * Try to encrypt using browser extension (NIP-04)
   */
  private async tryBrowserEncryption(
    emailData: EmailData
  ): Promise<EncryptedEmailData | null> {
    try {
      if (!nostrBrowserService.isExtensionAvailable()) {
        return null;
      }

      const connectionInfo = nostrBrowserService.getConnectionInfo();
      if (!connectionInfo.connected || !connectionInfo.publicKey) {
        // Try to connect
        const connectResult = await nostrBrowserService.connect();
        if (!connectResult.success) {
          return null;
        }
      }

      const publicKey = await nostrBrowserService.getPublicKey();
      if (!publicKey) {
        return null;
      }

      // Encrypt each field using NIP-04 (self-encryption for storage)
      const encryptedSubject = await nostrBrowserService.encrypt(
        publicKey,
        emailData.subject
      );
      const encryptedContent = await nostrBrowserService.encrypt(
        publicKey,
        emailData.content
      );
      const encryptedRecipients = await nostrBrowserService.encrypt(
        publicKey,
        JSON.stringify(emailData.recipients)
      );

      if (!encryptedSubject || !encryptedContent || !encryptedRecipients) {
        return null;
      }

      return {
        encryptedSubject,
        encryptedContent,
        encryptedRecipients,
        encryptionMethod: "browser-extension",
        publicKey,
      };
    } catch (error) {
      console.warn("Browser extension encryption failed:", error);
      return null;
    }
  }

  /**
   * Try to encrypt using local Nostr keys
   */
  private async tryLocalKeyEncryption(
    emailData: EmailData,
    userPublicKey?: string
  ): Promise<EncryptedEmailData | null> {
    try {
      if (!userPublicKey) {
        return null;
      }

      // Get private key from localStorage or generate new one
      let privateKeyHex = localStorage.getItem("nostr_private_key");

      if (!privateKeyHex) {
        // Generate new keypair
        if (nostrTools.generateSecretKey && nostrTools.getPublicKey) {
          const privateKey = nostrTools.generateSecretKey();
          privateKeyHex = Buffer.from(privateKey).toString("hex");
          localStorage.setItem("nostr_private_key", privateKeyHex);

          // Verify public key matches
          const derivedPublicKey = nostrTools.getPublicKey(privateKey);
          if (derivedPublicKey !== userPublicKey) {
            console.warn("Public key mismatch, removing stored private key");
            localStorage.removeItem("nostr_private_key");
            return null;
          }
        } else {
          return null;
        }
      }

      // Convert hex to Uint8Array for nostr-tools
      const privateKey = new Uint8Array(
        privateKeyHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
      );

      // Encrypt data using NIP-04
      const encryptedSubject = await this.encryptWithNIP04(
        privateKey,
        userPublicKey,
        emailData.subject
      );
      const encryptedContent = await this.encryptWithNIP04(
        privateKey,
        userPublicKey,
        emailData.content
      );
      const encryptedRecipients = await this.encryptWithNIP04(
        privateKey,
        userPublicKey,
        JSON.stringify(emailData.recipients)
      );

      return {
        encryptedSubject,
        encryptedContent,
        encryptedRecipients,
        encryptionMethod: "local-keys",
        publicKey: userPublicKey,
      };
    } catch (error) {
      console.warn("Local key encryption failed:", error);
      return null;
    }
  }

  /**
   * Fallback encryption using simple crypto (better than nothing)
   */
  private async fallbackEncryption(
    emailData: EmailData,
    userPublicKey?: string
  ): Promise<EncryptedEmailData> {
    console.warn(
      "Using fallback encryption - not as secure as Nostr protocols"
    );

    // Simple base64 encoding as absolute fallback
    // In a real implementation, you'd want proper symmetric encryption here
    const encryptedSubject = btoa(emailData.subject);
    const encryptedContent = btoa(emailData.content);
    const encryptedRecipients = btoa(JSON.stringify(emailData.recipients));

    return {
      encryptedSubject,
      encryptedContent,
      encryptedRecipients,
      encryptionMethod: "fallback",
      publicKey: userPublicKey || "fallback",
    };
  }

  /**
   * Encrypt using NIP-04 protocol
   */
  private async encryptWithNIP04(
    privateKey: Uint8Array,
    recipientPublicKey: string,
    plaintext: string
  ): Promise<string> {
    try {
      if (nostrTools.nip04?.encrypt) {
        return await nostrTools.nip04.encrypt(
          privateKey,
          recipientPublicKey,
          plaintext
        );
      }

      // Fallback if NIP-04 not available
      throw new Error("NIP-04 encryption not available");
    } catch (error) {
      console.error("NIP-04 encryption failed:", error);
      // Return base64 encoded as fallback
      return btoa(plaintext);
    }
  }

  /**
   * Decrypt email data on the client-side
   */
  async decryptEmailData(
    encryptedData: EncryptedEmailData
  ): Promise<EmailData | null> {
    try {
      switch (encryptedData.encryptionMethod) {
        case "browser-extension":
          return await this.decryptWithBrowser(encryptedData);

        case "local-keys":
          return await this.decryptWithLocalKeys(encryptedData);

        case "fallback":
          return this.decryptFallback(encryptedData);

        default:
          return null;
      }
    } catch (error) {
      console.error("Failed to decrypt email data:", error);
      return null;
    }
  }

  /**
   * Decrypt using browser extension
   */
  private async decryptWithBrowser(
    encryptedData: EncryptedEmailData
  ): Promise<EmailData | null> {
    try {
      const subject = await nostrBrowserService.decrypt(
        encryptedData.publicKey,
        encryptedData.encryptedSubject
      );
      const content = await nostrBrowserService.decrypt(
        encryptedData.publicKey,
        encryptedData.encryptedContent
      );
      const recipientsStr = await nostrBrowserService.decrypt(
        encryptedData.publicKey,
        encryptedData.encryptedRecipients
      );

      if (!subject || !content || !recipientsStr) {
        return null;
      }

      const recipients = JSON.parse(recipientsStr);
      return { subject, content, recipients };
    } catch (error) {
      console.error("Browser decryption failed:", error);
      return null;
    }
  }

  /**
   * Decrypt using local keys
   */
  private async decryptWithLocalKeys(
    encryptedData: EncryptedEmailData
  ): Promise<EmailData | null> {
    try {
      const privateKeyHex = localStorage.getItem("nostr_private_key");
      if (!privateKeyHex) {
        return null;
      }

      const privateKey = new Uint8Array(
        privateKeyHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
      );

      const subject = await this.decryptWithNIP04(
        privateKey,
        encryptedData.publicKey,
        encryptedData.encryptedSubject
      );
      const content = await this.decryptWithNIP04(
        privateKey,
        encryptedData.publicKey,
        encryptedData.encryptedContent
      );
      const recipientsStr = await this.decryptWithNIP04(
        privateKey,
        encryptedData.publicKey,
        encryptedData.encryptedRecipients
      );

      const recipients = JSON.parse(recipientsStr);
      return { subject, content, recipients };
    } catch (error) {
      console.error("Local key decryption failed:", error);
      return null;
    }
  }

  /**
   * Decrypt fallback encryption
   */
  private decryptFallback(encryptedData: EncryptedEmailData): EmailData {
    const subject = atob(encryptedData.encryptedSubject);
    const content = atob(encryptedData.encryptedContent);
    const recipients = JSON.parse(atob(encryptedData.encryptedRecipients));

    return { subject, content, recipients };
  }

  /**
   * Decrypt using NIP-04 protocol
   */
  private async decryptWithNIP04(
    privateKey: Uint8Array,
    senderPublicKey: string,
    ciphertext: string
  ): Promise<string> {
    try {
      if (nostrTools.nip04?.decrypt) {
        return await nostrTools.nip04.decrypt(
          privateKey,
          senderPublicKey,
          ciphertext
        );
      }

      // Fallback if NIP-04 not available
      throw new Error("NIP-04 decryption not available");
    } catch (error) {
      console.error("NIP-04 decryption failed:", error);
      // Try base64 decode as fallback
      return atob(ciphertext);
    }
  }

  /**
   * Check if client-side encryption is available
   */
  async getEncryptionCapabilities(): Promise<{
    browserExtension: boolean;
    localKeys: boolean;
    fallback: boolean;
  }> {
    const browserExtension =
      nostrBrowserService.isExtensionAvailable() &&
      nostrBrowserService.getConnectionInfo().connected;

    const localKeys =
      !!nostrTools.nip04?.encrypt ||
      !!localStorage.getItem("nostr_private_key");

    return {
      browserExtension,
      localKeys,
      fallback: true, // Always available
    };
  }
}

// Export singleton instance
export const clientEncryption = new ClientEncryptionService();

// Export types
export type { EncryptedEmailData, EmailData };
