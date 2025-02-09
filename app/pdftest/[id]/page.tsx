"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { getPdfById } from "@/db/pdf/docs";
import PDFPageContainer from "@/components/pdftest/PDFPageContainer";
import { useParams } from "next/navigation";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

const Loading = ({ message }: { message: string }) => (
  <div className="text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
    <p className="mt-2 text-gray-600">{message}</p>
  </div>
);

const ErrorComponent = ({ message }: { message: string }) => (
  <div className="text-red-500 text-center">{message}</div>
);

const PDFViewer = ({ url }: { url: string }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [fitToWidth, setFitToWidth] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1); // Added missing state
  const [viewMode, setViewMode] = useState<string>("single"); // Placeholder
  const [isExpanded, setIsExpanded] = useState<boolean>(false); // Placeholder
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="flex h-full max-w-full scrollbar-hidden">
      <div className="flex-1 flex flex-col">
        <div ref={containerRef} className="flex-1 p-4 overflow-auto scrollbar-hidden relative">
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<Loading message="Loading PDF..." />}
            error={<ErrorComponent message="Failed to load PDF" />}
          >
            <div className="flex flex-col gap-4 items-center">
              {numPages &&
                Array.from({ length: numPages }, (_, index) => (
                  // <PDFPageContainer
                  //   key={index + 1}
                  //   pageNumber={index + 1}
                  //   isVisible={index + 1 === currentPage}
                  //   zoom={zoom}
                  //   setZoom={setZoom}
                  //   pageWidth={containerRef?.current?.offsetWidth || 800}
                  //   viewMode={viewMode}
                  //   fitToWidth={fitToWidth}
                  //   setFitToWidth={setFitToWidth}
                  //   isExpanded={isExpanded}
                  //   onPageInView={handlePageChange}
                  // />
                  <Page pageNumber={index}/>
                ))}
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
};

const PdfViewer = () => {
  const [pdfData, setPdfData] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const handleFetchPdf = async (pdfId: string) => {
      try {
        const pdf = await getPdfById(pdfId);
        if (pdf?.base64) {
          setPdfData(pdf.base64);
        }
      } catch (error) {
        console.error("Error fetching PDF:", error);
      }
    };

    if (id) {
      handleFetchPdf(id);
    }
  }, [id]);

  return (
    <div className="h-screen w-full overflow-auto bg-slate-400">
      {pdfData ? <PDFViewer url={pdfData} /> : <Loading message="Fetching PDF..." />}
    </div>
  );
};

export default PdfViewer;
