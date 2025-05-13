import { ArrowRight, Code2Icon, PuzzleIcon, ZapIcon } from "lucide-react";
import type React from "react";

interface CardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, description, href, icon }) => {
  return (
    <a
      href={href}
      className="group relative flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-gray-300"
    >
      <div>
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
          {icon}
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
      <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700">
        <span className="text-sm font-medium">Learn more</span>
        <ArrowRight className="ml-2 h-4 w-4" />
      </div>
    </a>
  );
};

export default function HomepageCards() {
  const cards = [
    {
      title: "Getting Started",
      description:
        "Learn the basics of Kokoro and how to get started with our platform.",
      href: "/introduction",
      icon: <ZapIcon className="h-6 w-6" />,
    },
    {
      title: "Integrations",
      description:
        "Explore all available integrations and learn how to connect Kokoro with your favorite tools.",
      href: "/integrations",
      icon: <PuzzleIcon className="h-6 w-6" />,
    },
    {
      title: "API Reference",
      description:
        "Detailed API documentation for developers looking to integrate with Kokoro programmatically.",
      href: "/api",
      icon: <Code2Icon className="h-6 w-6" />,
    },
  ];

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.href} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}
