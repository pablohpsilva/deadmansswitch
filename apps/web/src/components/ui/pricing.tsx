import { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./card";
import { Button } from "./card";

interface PricingCardProps {
  name: string;
  price: string | number;
  period?: string;
  description: string;
  features: string[];
  buttonText: string;
  onUpgrade: () => void;
  popular?: boolean;
  currentPlan?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  buttonText,
  onUpgrade,
  popular = false,
  currentPlan = false,
  disabled = false,
  loading = false,
}: PricingCardProps) {
  const formatPrice = (p: string | number) => {
    if (typeof p === "number") return `$${p}`;
    return p;
  };

  return (
    <div
      className={cn(
        "relative bg-white rounded-xl border-2 p-8 transition-all duration-300",
        popular ? "border-blue-500 shadow-lg" : "border-gray-200",
        "hover:shadow-lg"
      )}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      {currentPlan && (
        <div className="absolute top-4 right-4">
          <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
            CURRENT
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
        <div className="mb-3">
          <span className="text-4xl font-bold text-gray-900">
            {formatPrice(price)}
          </span>
          {period && <span className="text-gray-600 ml-2">{period}</span>}
        </div>
        <p className="text-gray-600">{description}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onUpgrade}
        variant={popular ? "primary" : "outline"}
        disabled={disabled}
        loading={loading}
        className="w-full"
      >
        {buttonText}
      </Button>
    </div>
  );
}

interface FeatureComparisonProps {
  plans: {
    name: string;
    features: Record<string, string | boolean>;
  }[];
  featureLabels: Record<string, string>;
}

export function FeatureComparison({
  plans,
  featureLabels,
}: FeatureComparisonProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-6 px-8 text-lg font-bold text-gray-900">
                Features
              </th>
              {plans.map((plan) => (
                <th key={plan.name} className="text-center py-6 px-8">
                  <span className="text-lg font-bold text-gray-900">
                    {plan.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Object.entries(featureLabels).map(([key, label]) => (
              <tr key={key} className="hover:bg-gray-50 transition-colors">
                <td className="py-5 px-8 text-base font-semibold text-gray-900">
                  {label}
                </td>
                {plans.map((plan) => (
                  <td key={plan.name} className="py-5 px-8 text-center">
                    <FeatureValue value={plan.features[key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="h-5 w-5 text-green-500 mx-auto" />
    ) : (
      <span className="text-gray-400">—</span>
    );
  }

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
      {value}
    </span>
  );
}

interface FAQProps {
  items: { question: string; answer: string }[];
}

export function FAQ({ items }: FAQProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map((item, index) => (
        <FAQItem key={index} question={item.question} answer={item.answer} />
      ))}
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <Card hover>
      <h3 className="font-semibold text-gray-900 mb-3">{question}</h3>
      <p className="text-gray-600 leading-relaxed">{answer}</p>
    </Card>
  );
}
