'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2 } from 'lucide-react';

export default function MermaidDiagram({ chart }: MermaidProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevChart, setPrevChart] = useState(chart);

  if (chart !== prevChart) {
    setPrevChart(chart);
    setIsLoaded(false);
    setError(null);
  }

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#e0f2fe',
        primaryTextColor: '#0369a1',
        primaryBorderColor: '#0ea5e9',
        lineColor: '#0ea5e9',
        secondaryColor: '#f0f9ff',
        tertiaryColor: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        mainBkg: '#f8fafc',
        nodeBorder: '#cbd5e1',
        clusterBkg: '#f1f5f9',
        titleColor: '#0f172a',
        edgeLabelBackground: '#ffffff',
      },
      securityLevel: 'loose',
      fontFamily: 'Inter',
    });
  }, []);

  useEffect(() => {
    if (ref.current) {
      const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;

      // Clear previous content
      ref.current.innerHTML = '';

      mermaid.render(id, chart)
        .then(({ svg }) => {
          if (ref.current) {
            ref.current.innerHTML = svg;
            setIsLoaded(true);

            // Post-process SVG for better appearance
            const svgElement = ref.current.querySelector('svg');
            if (svgElement) {
              svgElement.style.maxWidth = '100%';
              svgElement.style.maxHeight = '400px';
              svgElement.style.height = 'auto';
              svgElement.style.objectFit = 'contain';
              svgElement.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))';
            }
          }
        })
        .catch(err => {
          console.error('Mermaid render error:', err);
          setError('Failed to render diagram');
          setIsLoaded(true);
        });
    }
  }, [chart]);

  return (
    <div className="diagram-wrapper my-3 flex flex-col items-center w-full">
      {!isLoaded && !error && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium">Rendering diagram...</span>
        </div>
      )}
      {error && (
        <div className="text-red-500 text-sm font-medium py-4 text-center">
          {error}
        </div>
      )}
      <div
        ref={ref}
        className={`mermaid-container w-full flex justify-center transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

interface MermaidProps {
  chart: string;
}
