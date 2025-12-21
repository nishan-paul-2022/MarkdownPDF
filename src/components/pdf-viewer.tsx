'use client';

import React, { useState, useEffect } from 'react';
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
    onRenderSuccess?: () => void;
}

export default function PdfViewer({ url, width, onLoadSuccess, onRenderSuccess }: PdfViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());

    const onDocumentLoadSuccess = (data: { numPages: number }) => {
        setNumPages(data.numPages);
        onLoadSuccess(data);
    };

    const handlePageRenderSuccess = (pageNum: number) => {
        setRenderedPages(prev => {
            const next = new Set(prev);
            next.add(pageNum);
            return next;
        });
    };

    useEffect(() => {
        if (renderedPages.size > 0 && onRenderSuccess) {
            onRenderSuccess();
        }
    }, [renderedPages.size, onRenderSuccess]);

    return (
        <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex flex-col gap-4"
            loading={null} // Handle loading in parent for better control
        >
            {Array.from(new Array(numPages), (el, index) => (
                <div key={`page_${index + 1}`} data-page-index={index} className="pdf-view-page shadow-xl transition-opacity duration-300">
                    <Page
                        pageNumber={index + 1}
                        width={width}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onRenderSuccess={() => handlePageRenderSuccess(index + 1)}
                        className="bg-white"
                        loading={null}
                    />
                </div>
            ))}
        </Document>
    );
}
