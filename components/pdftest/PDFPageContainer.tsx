"use client";
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useInView } from "react-intersection-observer";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
const Loading = ({ message }) => (
  <div className="text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
    <p className="mt-2 text-gray-600">{message}</p>
  </div>
);
const ErrorComponent = ({ message }) => (
  <div className="text-red-500 text-center">{message}</div>
);
const ViewMode = {
  SINGLE: "single",
  DOUBLE: "double",
  CAROUSEL: "carousel",
};

// Memoized PDFPageView component
const PDFPageView = React.memo(({ pageNumber, zoom, onLoad }) => (
  <div >
    <Page
      pageNumber={pageNumber}
      scale={zoom}
      onLoadSuccess={onLoad}
      className="mx-auto rounded-md overflow-hidden"
      renderTextLayer={true}
      renderAnnotationLayer={false}
      loading={<Loading message={`Loading page ${pageNumber}...`} />}
      error={<ErrorComponent message={`Error loading page ${pageNumber}`} />}
    />
  </div>
));



// Memoized PDFPageContainer component
const PDFPageContainer = ({
  pageNumber,
  zoom,
  setZoom,
  pageWidth,
  viewMode,
  fitToWidth,
  isExpanded,
  scaledWidth,
  onPageInView
}) => {
  const containerRef = useRef(null);
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: "100px 0px",
    triggerOnce: false,
  });
  const [pageView, setPageView] = useState();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  useEffect(() => {
    if (inView) {
      onPageInView(pageNumber);
      console.log(pageNumber)
    }
  }, [inView, pageNumber, onPageInView]);

  // Combine refs
  const setRefs = useCallback((node) => {
    containerRef.current = node;
    inViewRef(node);
  }, [inViewRef]);

  // Memoized load success handler
  const handleLoadSuccess = useCallback((page) => {
    setPageView(page);
    setIsPageLoaded(true);
  }, []);


  // Only render content when in view or nearby
  return (
    <div ref={setRefs} className="scrollbar-hidden max-w-full relative"
    >
      {(true) && (
        <div className="w-full">
          <PDFPageView
            pageNumber={pageNumber}
            zoom={zoom}
            scaledWidth={scaledWidth}
            onLoad={handleLoadSuccess}
          />
        </div>
      )}
    </div>
  );
};


export default React.memo(PDFPageContainer);