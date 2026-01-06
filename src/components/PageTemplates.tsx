import Image from 'next/image';
import React from 'react';

export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

interface CoverPageProps {
  metadata: {
    university?: string;
    program?: string;
    title?: string;
    subtitle?: string;
    course?: string;
    name?: string;
    roll?: string;
    reg?: string;
    batch?: string;
    date?: string;
  } | undefined;
}

export const CoverPage = ({ metadata }: CoverPageProps): React.JSX.Element | null => {
  if (!metadata) return null;

  return (
    <div className="pdf-page relative bg-white overflow-hidden flex flex-col items-center text-center p-0 mx-auto shrink-0"
      style={{ width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px`, color: 'white', fontFamily: 'var(--font-inter), sans-serif' }}>
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/cover-bg.png')` }}
      />

      <div className="relative z-10 w-full h-full flex flex-col items-center">
        <div className="mt-[2cm] p-4 flex justify-center">
          <Image src="/university-logo.png" alt="University Logo" width={120} height={120} className="w-[120px] h-auto" />
        </div>

        {metadata.university && (
          <div className="text-[28px] font-bold tracking-[2px] mt-[10px] uppercase">{metadata.university}</div>
        )}
        {metadata.program && (
          <div className="text-[16px] font-normal mt-[8px] opacity-90">{metadata.program}</div>
        )}

        {(metadata.title || metadata.subtitle) && (
          <div className="mt-[2cm] mb-[2cm] w-full flex flex-col items-center">
            {metadata.title && (
              <div className="text-[32px] font-extrabold leading-[1.2] mb-[8px] w-full px-8 break-words text-center">
                {metadata.title}
              </div>
            )}
            {metadata.subtitle && (
              <div className="text-[18px] font-semibold opacity-95 w-full px-8 break-words text-center">
                {metadata.subtitle}
              </div>
            )}
          </div>
        )}

        {metadata.course && (
          <div className="mt-[1cm] text-[15px] w-[85%] border-b border-white/20 pb-[10px] break-words">
            {metadata.course}
          </div>
        )}

        {(metadata.name || metadata.roll || metadata.reg || metadata.batch || metadata.date) && (
          <div className="mt-[1cm] w-[70%] p-[20px] bg-white/10 border border-white/10 rounded-xl backdrop-blur-sm">
            <div className="space-y-[8px]">
              {[
                { label: 'Name', value: metadata.name },
                { label: 'Roll No', value: metadata.roll },
                { label: 'Reg. No', value: metadata.reg },
                { label: 'Batch', value: metadata.batch },
                { label: 'Submission Date', value: metadata.date },
              ].filter(detail => detail.value).map((detail, idx) => (
                <div key={idx} className="flex text-left text-[14px]">
                  <div className="w-[42%] font-semibold text-white/90 flex justify-between">
                    {detail.label}
                    <span className="mr-2">:</span>
                  </div>
                  <div className="w-[58%] font-medium text-white pl-2 break-words text-left">{detail.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const PageWrapper = ({ children, pageNumber, totalPages }: { children: React.ReactNode, pageNumber: number, totalPages: number }): React.JSX.Element => {
  return (
    <div className="pdf-page relative bg-white mx-auto flex flex-col shrink-0 shadow-sm"
      style={{
        width: `${A4_WIDTH_PX}px`,
        minHeight: `${A4_HEIGHT_PX}px`,
        height: 'fit-content',
        color: '#111827',
        fontFamily: 'var(--font-inter), sans-serif',
        padding: '15mm',
      }}>
      <div className="flex-grow">
        {children}
      </div>

      <div className="mt-auto pt-4 flex justify-end text-[8pt] text-slate-400 font-sans">
        Page {pageNumber} of {totalPages}
      </div>
    </div>
  );
};
