"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { List } from "react-virtualized";
import { getPdfById } from "@/db/pdf/docs";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { AppState, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
);

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
  const [pageHeight, setPageHeight] = useState<number>(900); // Default height
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<any>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI>();

  // Callback for setting dynamic height
  const onLoadPageSuccess = useCallback((page) => {
    const viewport = page.getViewport({ scale: 1 });
    setPageHeight(viewport.height + 10); // Add spacing
  }, []);

  const initialAppState: AppState = {
    zoom: { value: 1 },
    scrollX: 0,
    scrollY: 0,
  };

  const handleChange = (
    elements: readonly ExcalidrawElement[],
    state: AppState
  ) => {
    if (!excalidrawAPI) return;
    let shouldUpdateScene = false;
    const newAppState: Pick<AppState, keyof AppState> = { ...state };
    const appstate = excalidrawAPI.getAppState();
    // console.log(elements);

    if (state.zoom.value !== initialAppState.zoom.value) {
      newAppState.zoom = { value: initialAppState.zoom.value };
      shouldUpdateScene = true;
      console.log("should update")
    }

    if (state.scrollX !== initialAppState.scrollX) {
      newAppState.scrollX = initialAppState.scrollX;
      shouldUpdateScene = true;
      console.log("should update")
    }

    if (state.scrollY !== initialAppState.scrollY) {
      newAppState.scrollY = initialAppState.scrollY;
      shouldUpdateScene = true;
      console.log("should update")
    }

    if (shouldUpdateScene) {
      excalidrawAPI.updateScene({
        appState: {
          ...appstate,
          ...newAppState,
        },
      });
    }
  };

  const renderRow = useCallback(
    ({ index, key, style }) => (
      <div
        key={key}
        style={{
          ...style,
          display: "flex",
          justifyContent: "center",
          paddingBottom: "10px",
        }}
        className="relative overflow-hidden  bg-black"
      >
        <div className="relative">
        <Page
          pageNumber={index + 1}
          width={600}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          onLoadSuccess={onLoadPageSuccess} // Capture dynamic height
        />
        <div className="absolute top-0 left-0 w-full h-full " style={{pointerEvents:"auto"}}>
          <Excalidraw
            onChange={handleChange}
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            initialData={{
              appState: {
                viewBackgroundColor: "transparent",
                currentItemStrokeColor: "#000000",
                currentItemBackgroundColor: "transparent",
                scrollX: 0,
                scrollY: 0,
                theme: "light",
              },
            }}
          />
        </div>
        </div>
      </div>
    ),
    [onLoadPageSuccess]
  );

  return (
    <div className="flex h-full max-w-full overflow-hidden">
      <div className="flex-1 flex flex-col">
        <div ref={containerRef} className="flex-1 p-4 overflow-auto relative ">
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<Loading message="Loading PDF..." />}
            error={<ErrorComponent message="Failed to load PDF" />}
            className={"w-[100vw] flex items-center justify-center"}
          >
            {numPages && (
              <List
                ref={listRef}
                width={window.innerWidth}
                height={window.innerHeight}
                rowCount={numPages}
                rowHeight={pageHeight} // Dynamically updated
                rowRenderer={renderRow}
                overscanRowCount={2}
              />
            )}
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
    const fetchPdf = async (pdfId: string) => {
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
      fetchPdf(id);
    }
  }, [id]);

  return (
    <div className="h-screen w-full overflow-auto bg-gray-200">
      {pdfData ? (
        <PDFViewer url={pdfData} />
      ) : (
        <Loading message="Fetching PDF..." />
      )}
    </div>
  );
};

export default PdfViewer;
