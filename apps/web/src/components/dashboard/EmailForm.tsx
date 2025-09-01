"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { clientEncryption } from "@/lib/client-encryption";
import { useGlobalData } from "@/hooks/useGlobalData";

interface EmailFormData {
  title: string;
  subject: string;
  content: string;
  recipients: Array<{ email: string; name?: string }>;
  scheduledFor?: Date;
  intervalDays?: number;
  isActive: boolean;
}

interface TierLimits {
  maxEmails: number;
  maxRecipients: number;
  maxSubjectLength: number;
  maxContentLength: number;
}

interface EmailFormProps {
  mode: "create" | "edit";
  emailId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  tierLimits?: TierLimits;
}

export function EmailForm({
  mode,
  emailId,
  onSuccess,
  onCancel,
  tierLimits,
}: EmailFormProps) {
  const [formData, setFormData] = useState<EmailFormData>({
    title: "",
    subject: "",
    content: "",
    recipients: [{ email: "", name: "" }],
    scheduledFor: undefined,
    intervalDays: undefined,
    isActive: true,
  });

  const [scheduleType, setScheduleType] = useState<"date" | "interval">("date");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [encryptionStatus, setEncryptionStatus] = useState<string>("");

  // Get user data for encryption
  const { user } = useGlobalData();

  // Fetch email data for editing
  const { data: existingEmail, isLoading } = (
    trpc as any
  ).emails.getEmail.useQuery(
    { id: emailId! },
    { enabled: mode === "edit" && !!emailId }
  );

  // Mutations
  const createEmailMutation = (trpc as any).emails.createEmail.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Failed to create email:", error);
      alert(`Failed to create email: ${error.message}`);
    },
  });

  const updateEmailMutation = (trpc as any).emails.updateEmail.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Failed to update email:", error);
      alert(`Failed to update email: ${error.message}`);
    },
  });

  // Load existing email data
  useEffect(() => {
    if (mode === "edit" && existingEmail) {
      setFormData({
        title: existingEmail.title,
        subject: existingEmail.subject || "",
        content: existingEmail.content || "",
        recipients:
          existingEmail.recipients.length > 0
            ? existingEmail.recipients.map((r: any) => ({
                email: r.email,
                name: r.name || "",
              }))
            : [{ email: "", name: "" }],
        scheduledFor: existingEmail.scheduledFor || undefined,
        intervalDays: existingEmail.intervalDays || undefined,
        isActive: existingEmail.isActive,
      });

      setScheduleType(existingEmail.scheduledFor ? "date" : "interval");
    }
  }, [mode, existingEmail]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (
      tierLimits &&
      formData.subject.length > tierLimits.maxSubjectLength
    ) {
      newErrors.subject = `Subject must be ${tierLimits.maxSubjectLength} characters or less`;
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (
      tierLimits &&
      formData.content.length > tierLimits.maxContentLength
    ) {
      newErrors.content = `Content must be ${tierLimits.maxContentLength} characters or less`;
    }

    const validRecipients = formData.recipients.filter((r) => r.email.trim());
    if (validRecipients.length === 0) {
      newErrors.recipients = "At least one recipient is required";
    } else if (
      tierLimits &&
      validRecipients.length > tierLimits.maxRecipients
    ) {
      newErrors.recipients = `Maximum ${tierLimits.maxRecipients} recipients allowed`;
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 0; i < formData.recipients.length; i++) {
      const recipient = formData.recipients[i];
      if (recipient.email.trim() && !emailRegex.test(recipient.email)) {
        newErrors[`recipient_${i}`] = "Invalid email address";
      }
    }

    if (scheduleType === "date" && !formData.scheduledFor) {
      newErrors.schedule = "Scheduled date is required";
    } else if (
      scheduleType === "interval" &&
      (!formData.intervalDays || formData.intervalDays < 1)
    ) {
      newErrors.schedule = "Interval days must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.nostrPublicKey) {
      setErrors({ submit: "User authentication required for encryption" });
      return;
    }

    setIsSubmitting(true);
    setIsEncrypting(true);
    setEncryptionStatus("Encrypting email content...");

    try {
      const validRecipients = formData.recipients.filter((r) => r.email.trim());

      // Encrypt email data on client-side before sending
      const emailData = {
        subject: formData.subject,
        content: formData.content,
        recipients: validRecipients,
      };

      setEncryptionStatus("Encrypting with client-side keys...");
      const encryptedData = await clientEncryption.encryptEmailData(
        emailData,
        user.nostrPublicKey
      );

      setEncryptionStatus("Sending encrypted data to server...");
      setIsEncrypting(false);

      const submitData = {
        title: formData.title,
        // Send encrypted data instead of plaintext
        encryptedSubject: encryptedData.encryptedSubject,
        encryptedContent: encryptedData.encryptedContent,
        encryptedRecipients: encryptedData.encryptedRecipients,
        encryptionMethod: encryptedData.encryptionMethod,
        publicKey: encryptedData.publicKey,
        recipientCount: validRecipients.length,
        // Non-sensitive scheduling data can remain unencrypted
        scheduledFor:
          scheduleType === "date" ? formData.scheduledFor : undefined,
        intervalDays:
          scheduleType === "interval" ? formData.intervalDays : undefined,
      };

      if (mode === "create") {
        await createEmailMutation.mutateAsync(submitData);
      } else if (emailId) {
        await updateEmailMutation.mutateAsync({
          id: emailId,
          ...submitData,
          isActive: formData.isActive,
        });
      }

      setEncryptionStatus("Email encrypted and saved successfully!");
    } catch (error) {
      setIsEncrypting(false);
      setEncryptionStatus("");
      console.error("Encryption or submission failed:", error);
      setErrors({
        submit: `Failed to encrypt or save email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setEncryptionStatus(""), 3000);
    }
  };

  const addRecipient = () => {
    if (!tierLimits || formData.recipients.length < tierLimits.maxRecipients) {
      setFormData({
        ...formData,
        recipients: [...formData.recipients, { email: "", name: "" }],
      });
    }
  };

  const removeRecipient = (index: number) => {
    if (formData.recipients.length > 1) {
      setFormData({
        ...formData,
        recipients: formData.recipients.filter((_, i) => i !== index),
      });
    }
  };

  const updateRecipient = (
    index: number,
    field: "email" | "name",
    value: string
  ) => {
    const newRecipients = [...formData.recipients];
    newRecipients[index] = { ...newRecipients[index], [field]: value };
    setFormData({ ...formData, recipients: newRecipients });
  };

  if (mode === "edit" && isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === "create" ? "Create New Email" : "Edit Email"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back to List
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="My important message"
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject *
              {tierLimits && (
                <span className="text-gray-500 text-xs ml-2">
                  ({formData.subject.length}/{tierLimits.maxSubjectLength})
                </span>
              )}
            </label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Important message from a friend"
            />
            {errors.subject && (
              <p className="text-red-600 text-sm mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Message Content *
              {tierLimits && (
                <span className="text-gray-500 text-xs ml-2">
                  ({formData.content.length}/{tierLimits.maxContentLength})
                </span>
              )}
            </label>
            <textarea
              id="content"
              rows={8}
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="This message will be sent if I don't check in..."
            />
            {errors.content && (
              <p className="text-red-600 text-sm mt-1">{errors.content}</p>
            )}
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipients *
              {tierLimits && (
                <span className="text-gray-500 text-xs ml-2">
                  (Max {tierLimits.maxRecipients})
                </span>
              )}
            </label>
            <div className="space-y-3">
              {formData.recipients.map((recipient, index) => (
                <div key={index} className="flex space-x-3">
                  <input
                    type="email"
                    value={recipient.email}
                    onChange={(e) =>
                      updateRecipient(index, "email", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="recipient@example.com"
                  />
                  <input
                    type="text"
                    value={recipient.name}
                    onChange={(e) =>
                      updateRecipient(index, "name", e.target.value)
                    }
                    className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Name (optional)"
                  />
                  {formData.recipients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRecipient(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  )}
                  {errors[`recipient_${index}`] && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors[`recipient_${index}`]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {(!tierLimits ||
              formData.recipients.length < tierLimits.maxRecipients) && (
              <button
                type="button"
                onClick={addRecipient}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                + Add Recipient
              </button>
            )}

            {errors.recipients && (
              <p className="text-red-600 text-sm mt-1">{errors.recipients}</p>
            )}
          </div>

          {/* Schedule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Trigger Schedule *
            </label>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="schedule-date"
                  type="radio"
                  value="date"
                  checked={scheduleType === "date"}
                  onChange={(e) => setScheduleType(e.target.value as "date")}
                  className="mr-2"
                />
                <label
                  htmlFor="schedule-date"
                  className="text-sm font-medium text-gray-700"
                >
                  Send on specific date
                </label>
              </div>

              {scheduleType === "date" && (
                <input
                  type="datetime-local"
                  value={
                    formData.scheduledFor
                      ? new Date(
                          formData.scheduledFor.getTime() -
                            formData.scheduledFor.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scheduledFor: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    })
                  }
                  className="ml-6 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}

              <div className="flex items-center">
                <input
                  id="schedule-interval"
                  type="radio"
                  value="interval"
                  checked={scheduleType === "interval"}
                  onChange={(e) =>
                    setScheduleType(e.target.value as "interval")
                  }
                  className="mr-2"
                />
                <label
                  htmlFor="schedule-interval"
                  className="text-sm font-medium text-gray-700"
                >
                  Send if I don't check in within
                </label>
              </div>

              {scheduleType === "interval" && (
                <div className="ml-6 flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={formData.intervalDays || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        intervalDays: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-700">days</span>
                </div>
              )}
            </div>

            {errors.schedule && (
              <p className="text-red-600 text-sm mt-1">{errors.schedule}</p>
            )}
          </div>

          {/* Active Status (only for edit mode) */}
          {mode === "edit" && (
            <div className="flex items-center">
              <input
                id="is-active"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="mr-2"
              />
              <label
                htmlFor="is-active"
                className="text-sm font-medium text-gray-700"
              >
                Email is active
              </label>
            </div>
          )}

          {/* Encryption Status */}
          {(encryptionStatus || errors.submit) && (
            <div className="mt-4">
              {encryptionStatus && (
                <div className="flex items-center space-x-2 text-blue-600 text-sm">
                  {isEncrypting && (
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  )}
                  <span>{encryptionStatus}</span>
                </div>
              )}
              {errors.submit && (
                <div className="text-red-600 text-sm mt-2">{errors.submit}</div>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? isEncrypting
                  ? "Encrypting..."
                  : "Saving..."
                : mode === "create"
                ? "Create Encrypted Email"
                : "Update Encrypted Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
