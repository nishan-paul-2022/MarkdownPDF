'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Initialize worker
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
    url: string;
    width: number;
    onLoadSuccess: (data: { numPages: number }) => void;
}

export default function PdfViewer({ url, width, onLoadSuccess }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);

    const onDocumentLoadSuccess = (data: { numPages: number }) => {
        setNumPages(data.numPages);
        onLoadSuccess(data);
    };

    return (
        <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex flex-col gap-4"
            loading={<div className="h-[800px] w-[600px] animate-pulse bg-slate-800/20 rounded-lg" />}
        >
            {Array.from(new Array(numPages), (el, index) => (
                <div key={`page_${index + 1}`} data-page-index={index} className="pdf-view-page shadow-xl">
                    <Page
                        pageNumber={index + 1}
                        width={width}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="bg-white"
                    />
                </div>
            ))}
        </Document>
    );
}
