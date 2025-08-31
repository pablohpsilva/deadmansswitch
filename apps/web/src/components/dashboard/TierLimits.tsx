"use client";

import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui/card";

interface TierLimits {
  maxEmails: number;
  maxRecipients: number;
  maxSubjectLength: number;
  maxContentLength: number;
}

interface TierLimitsProps {
  tierLimits: TierLimits;
  currentEmails: number;
  userTier: string;
}

export function TierLimits({
  tierLimits,
  currentEmails,
  userTier,
}: TierLimitsProps) {
  const router = useRouter();
  const getUsageColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const emailUsagePercentage = (currentEmails / tierLimits.maxEmails) * 100;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
        </span>
      </div>

      <div className="space-y-4">
        {/* Email Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Emails</span>
            <span
              className={`text-sm font-medium ${getUsageColor(
                currentEmails,
                tierLimits.maxEmails
              )}`}
            >
              {currentEmails} / {tierLimits.maxEmails}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                currentEmails,
                tierLimits.maxEmails
              )}`}
              style={{ width: `${Math.min(emailUsagePercentage, 100)}%` }}
            />
          </div>
          {emailUsagePercentage >= 90 && (
            <p className="text-xs text-red-600 mt-1">
              Almost at limit! Consider upgrading.
            </p>
          )}
        </div>

        {/* Limits Summary */}
        <div className="pt-3 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Plan Limits
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Max Recipients per Email:</span>
              <span className="font-medium">{tierLimits.maxRecipients}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Subject Length:</span>
              <span className="font-medium">
                {formatNumber(tierLimits.maxSubjectLength)} chars
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Content Length:</span>
              <span className="font-medium">
                {formatNumber(tierLimits.maxContentLength)} chars
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade CTA for free users */}
        {userTier === "free" && (
          <div className="pt-4 border-t">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Upgrade for More Features
              </h4>
              <ul className="text-xs text-gray-600 space-y-1 mb-3">
                <li>• 100 emails instead of 2</li>
                <li>• 10 recipients per email</li>
                <li>• Longer subjects & content</li>
                <li>• Priority support</li>
              </ul>
              <Button
                onClick={() => router.push("/dashboard/pricing")}
                variant="primary"
                size="sm"
                className="w-full"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        {/* Usage Tips */}
        {emailUsagePercentage > 50 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Usage Tips
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Delete old or test emails to free up space</li>
              <li>
                • Use check-in schedules instead of fixed dates when possible
              </li>
              <li>• Group similar recipients into single emails</li>
              {userTier === "free" && (
                <li>• Consider upgrading for more storage</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
