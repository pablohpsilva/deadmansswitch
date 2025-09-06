"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { clientEncryption, type EmailData } from "@/lib/client-encryption";

interface EmailDetailViewProps {
  emailId: string;
  onEdit: () => void;
  onBack: () => void;
}

export function EmailDetailView({
  emailId,
  onEdit,
  onBack,
}: EmailDetailViewProps) {
  const {
    data: email,
    isLoading,
    error,
  } = (trpc as any).emails.getEmail.useQuery({ id: emailId });

  const [decryptedData, setDecryptedData] = useState<EmailData | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);

  // Decrypt email content when email data is loaded
  useEffect(() => {
    const decryptEmailContent = async () => {
      if (!email?.encryptedContent) {
        // Legacy email or no encrypted content
        if (email?.subject || email?.content) {
          setDecryptedData({
            subject: email.subject || "No Subject",
            content: email.content || "No Content",
            recipients: email.recipients || [],
          });
        }
        return;
      }

      setIsDecrypting(true);
      setDecryptionError(null);

      try {
        // Parse the encrypted content from Nostr
        const encryptedPayload = JSON.parse(email.encryptedContent);

        if (encryptedPayload.type === "deadman_email_encrypted") {
          // Extract encryption metadata from tags
          const tags = email.encryptionMetadata?.tags || [];
          const encryptionMethodTag = tags.find(
            (tag: string[]) => tag[0] === "encryption_method"
          );
          const publicKeyTag = tags.find(
            (tag: string[]) => tag[0] === "encrypted_by_pubkey"
          );

          const encryptedEmailData = {
            encryptedSubject: encryptedPayload.encryptedSubject,
            encryptedContent: encryptedPayload.encryptedContent,
            encryptedRecipients: encryptedPayload.encryptedRecipients,
            encryptionMethod: (encryptionMethodTag?.[1] as any) || "fallback",
            publicKey: publicKeyTag?.[1] || "",
          };

          const decrypted = await clientEncryption.decryptEmailData(
            encryptedEmailData
          );
          if (decrypted) {
            setDecryptedData(decrypted);
          } else {
            throw new Error("Failed to decrypt email content");
          }
        } else {
          throw new Error("Unknown encrypted email format");
        }
      } catch (error) {
        console.error("Failed to decrypt email:", error);
        setDecryptionError(
          error instanceof Error ? error.message : "Failed to decrypt email"
        );
      } finally {
        setIsDecrypting(false);
      }
    };

    if (email) {
      decryptEmailContent();
    }
  }, [email]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScheduleDisplay = () => {
    if (!email) return "";

    if (email.scheduledFor) {
      return `Will be sent on ${formatDate(email.scheduledFor)}`;
    } else if (email.intervalDays) {
      return `Will be sent if you don't check in for ${email.intervalDays} days`;
    }
    return "No schedule configured";
  };

  const getStatusInfo = () => {
    if (!email) return { color: "gray", text: "Unknown", icon: "❓" };

    if (email.isSent) {
      return {
        color: "green",
        text: `Sent on ${formatDate(email.sentAt!)}`,
        icon: "✅",
      };
    } else if (!email.isActive) {
      return {
        color: "gray",
        text: "Inactive - will not be sent",
        icon: "⏸️",
      };
    } else {
      return {
        color: "blue",
        text: "Active - monitoring your check-ins",
        icon: "🕐",
      };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isDecrypting) {
    return (
      <div className="bg-gray-800 rounded-lg shadow">
        <div className="p-6 text-center">
          <div className="text-4xl mb-4">🔓</div>
          <p className="text-gray-300">Decrypting email content...</p>
          <div className="mt-4">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (decryptionError) {
    return (
      <div className="bg-gray-800 rounded-lg shadow">
        <div className="p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">🔒❌</div>
          <h3 className="text-lg font-medium text-gray-100 mb-2">
            Decryption Failed
          </h3>
          <p className="text-red-600 mb-4">{decryptionError}</p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ← Back to List
          </button>
        </div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="bg-gray-800 rounded-lg shadow">
        <div className="p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-100 mb-2">
            Email Not Found
          </h3>
          <p className="text-gray-300 mb-4">
            The email you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ← Back to List
          </button>
        </div>
      </div>
    );
  }

  const status = getStatusInfo();

  return (
    <div className="bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">
              {email.title}
            </h2>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-300">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}
              >
                {status.icon} {status.text}
              </span>
              <span>
                📧 {decryptedData?.recipients?.length || 0} recipient
                {(decryptedData?.recipients?.length || 0) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onBack}
              className="px-3 py-1.5 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700"
            >
              ← Back
            </button>
            {!email.isSent && (
              <button
                onClick={onEdit}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ✏️ Edit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Email Preview */}
            <div>
              <h3 className="text-lg font-medium text-gray-100 mb-4">
                📧 Email Preview
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Email Header */}
                <div className="bg-gray-700 px-4 py-3 border-b">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Subject:</span>
                    <span className="text-gray-300">
                      Dead Man's Switch Email
                    </span>
                  </div>
                </div>

                <div className="bg-gray-700 px-4 py-2 border-b">
                  <div className="text-sm">
                    <span className="font-medium">Subject: </span>
                    <span>{decryptedData?.subject || "No Subject"}</span>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-4 bg-gray-800">
                  <div className="prose prose-sm max-w-none">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">
                        📨 Message from{" "}
                        {decryptedData?.recipients?.[0]?.name || "A friend"}
                      </h4>
                      <p className="text-yellow-700 text-sm">
                        This message was automatically sent by Dead Man's Switch
                        because the sender has been inactive.
                      </p>
                    </div>

                    <div className="bg-gray-800 border rounded-lg p-4">
                      <h5 className="font-semibold mb-3">
                        {decryptedData?.subject || "No Subject"}
                      </h5>
                      <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                        {decryptedData?.content || "No content available"}
                      </div>
                    </div>

                    <div className="text-center mt-4 text-xs text-gray-500">
                      <p>This message was sent via Dead Man's Switch</p>
                      <p>
                        A secure, decentralized service for sending messages
                        when you can't.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Schedule Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-100 mb-3">
                📅 Schedule
              </h3>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-200">{getScheduleDisplay()}</p>

                {email.scheduledFor && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p>
                      Countdown:{" "}
                      {new Date(email.scheduledFor) > new Date()
                        ? `${Math.ceil(
                            (new Date(email.scheduledFor).getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          )} days left`
                        : "Overdue"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recipients */}
            <div>
              <h3 className="text-lg font-medium text-gray-100 mb-3">
                👥 Recipients
              </h3>
              <div className="space-y-2">
                {(decryptedData?.recipients || []).map(
                  (recipient: any, index: number) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-100">
                          {recipient.email}
                        </p>
                        {recipient.name && (
                          <p className="text-gray-300">{recipient.name}</p>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Metadata */}
            <div>
              <h3 className="text-lg font-medium text-gray-100 mb-3">
                ℹ️ Details
              </h3>
              <div className="bg-gray-700 rounded-lg p-4 space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-200">Created:</span>
                  <p className="text-gray-300">{formatDate(email.createdAt)}</p>
                </div>

                {email.updatedAt > email.createdAt && (
                  <div>
                    <span className="font-medium text-gray-200">
                      Last Updated:
                    </span>
                    <p className="text-gray-300">
                      {formatDate(email.updatedAt)}
                    </p>
                  </div>
                )}

                {email.sentAt && (
                  <div>
                    <span className="font-medium text-gray-200">Sent:</span>
                    <p className="text-gray-300">{formatDate(email.sentAt)}</p>
                  </div>
                )}

                <div>
                  <span className="font-medium text-gray-200">Status:</span>
                  <p className={`text-${status.color}-600`}>
                    {status.icon} {status.text}
                  </p>
                </div>

                {email.nostrEventId && (
                  <div>
                    <span className="font-medium text-gray-200">
                      Nostr Event:
                    </span>
                    <p className="text-gray-300 font-mono text-xs break-all">
                      {email.nostrEventId}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
