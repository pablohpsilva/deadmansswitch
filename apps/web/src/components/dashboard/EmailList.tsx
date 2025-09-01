"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface Email {
  id: string;
  title: string;
  recipientCount: number;
  scheduledFor: Date | null;
  intervalDays: number | null;
  isActive: boolean;
  isSent: boolean;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EmailListProps {
  emails: Email[];
  isLoading: boolean;
  onCreateEmail: () => void;
  onEditEmail: (emailId: string) => void;
  onViewEmail: (emailId: string) => void;
  onRefresh: () => void;
}

export function EmailList({
  emails,
  isLoading,
  onCreateEmail,
  onEditEmail,
  onViewEmail,
  onRefresh,
}: EmailListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteEmailMutation = (trpc as any).emails.deleteEmail.useMutation({
    onSuccess: () => {
      onRefresh();
      setDeletingId(null);
    },
    onError: (error: any) => {
      console.error("Failed to delete email:", error);
      alert("Failed to delete email. Please try again.");
      setDeletingId(null);
    },
  });

  const handleDelete = async (emailId: string, title: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${title}"? This action cannot be undone.`
      )
    ) {
      setDeletingId(emailId);
      deleteEmailMutation.mutate({ id: emailId });
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScheduleDisplay = (email: Email) => {
    if (email.scheduledFor) {
      return `Scheduled for ${formatDate(email.scheduledFor)}`;
    } else if (email.intervalDays) {
      return `Check-in every ${email.intervalDays} days`;
    }
    return "No schedule set";
  };

  const getStatusBadge = (email: Email) => {
    if (email.isSent) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Sent
        </span>
      );
    } else if (!email.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          ⏸️ Inactive
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          🕐 Active
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              My Dead Man's Emails
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {emails.length} email{emails.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              🔄 Refresh
            </button>
            <button
              onClick={onCreateEmail}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ➕ Create Email
            </button>
          </div>
        </div>

        {emails.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No emails yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first Dead Man's Switch email to get started.
            </p>
            <button
              onClick={onCreateEmail}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Email
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {emails.map((email) => (
              <div
                key={email.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {email.title}
                      </h3>
                      {getStatusBadge(email)}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📧 Recipients: {email.recipientCount}</p>
                      <p>📅 {getScheduleDisplay(email)}</p>
                      <p>🕐 Created: {formatDate(email.createdAt)}</p>
                      {email.updatedAt > email.createdAt && (
                        <p>✏️ Updated: {formatDate(email.updatedAt)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onViewEmail(email.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                    >
                      👁️ View
                    </button>

                    {!email.isSent && (
                      <>
                        <button
                          onClick={() => onEditEmail(email.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                        >
                          ✏️ Edit
                        </button>

                        <button
                          onClick={() => handleDelete(email.id, email.title)}
                          disabled={deletingId === email.id}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === email.id ? "⏳" : "🗑️"} Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
