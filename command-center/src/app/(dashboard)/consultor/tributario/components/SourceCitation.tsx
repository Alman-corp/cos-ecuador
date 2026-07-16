"use client";

import { useState } from "react";
import { ScrollText, BookOpen, Scale, Gavel, ExternalLink } from "lucide-react";

interface Citation {
  content: string;
  score: number;
  law_type?: string;
  article?: string;
  has_isd?: boolean;
}

interface SourceCitationProps {
  citations: Citation[];
}

const lawIcons: Record<string, React.ReactNode> = {
  LRTI: <BookOpen className="h-4 w-4" />,
  RLRTI: <ScrollText className="h-4 w-4" />,
  "CÓDIGO TRIBUTARIO": <Scale className="h-4 w-4" />,
  RESOLUCIÓN: <Gavel className="h-4 w-4" />,
};

export function SourceCitation({ citations }: SourceCitationProps) {
  const [expanded, setExpanded] = useState(false);

  if (!citations || citations.length === 0) return null;

  const topCites = citations.slice(0, expanded ? citations.length : 2);

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <div className="flex items-center gap-1 mb-2">
        <Scale className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs font-medium text-gray-500">
          Fuentes consultadas
        </span>
      </div>

      <div className="space-y-1.5">
        {topCites.map((cite, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 rounded-md border border-gray-100 bg-gray-50/50 p-2 text-xs text-gray-600"
          >
            <span className="mt-0.5 shrink-0 text-gray-400">
              {lawIcons[cite.law_type?.toUpperCase() ?? ""] ?? (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 leading-relaxed">
                {cite.content}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {cite.law_type && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                    {cite.law_type}
                  </span>
                )}
                {cite.article && (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                    Art. {cite.article}
                  </span>
                )}
                {cite.has_isd && (
                  <span className="inline-flex items-center rounded-full bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                    ISD
                  </span>
                )}
                <span className="text-[10px] text-gray-400">
                  {(cite.score * 100).toFixed(0)}% relevante
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {citations.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 text-xs text-blue-600 hover:text-blue-800"
        >
          {expanded
            ? "Mostrar menos"
            : `Ver ${citations.length - 2} fuentes más`}
        </button>
      )}
    </div>
  );
}
