import html2canvas from "html2canvas";

export const scrollToHighlight = (highlight: number) => {
    const highlights = document.querySelectorAll('span[style*="background-color: yellow"]');

    // Check if there are any highlights and if the index is within bounds
    if (highlights.length > 0 && highlight >= 0 && highlight < highlights.length) {
        // Remove the highlight class from previously highlighted elements
        document.querySelectorAll('.current-highlight').forEach(el => {
            el.classList.remove('bg-yellow-400');
        });

        // Update current match


        // Add a class to indicate the currently focused highlight
        const currentHighlight = highlights[highlight] as HTMLElement;
        currentHighlight.classList.add('current-highlight');

        // Scroll to the current highlight
        currentHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        console.warn("Invalid highlight index or no highlights available");
    }
};






const CHUNK_SIZE = 500;
const DELAY_BETWEEN_CHUNKS = 10;

export const initiateCapture = async (type: "full" | "pdf", rectangle: any) => {
    const element = document.getElementById(type === "pdf" ? "pdfViewer" : "pdf-container");

    const { left, top, width, height } = rectangle.getBoundingRect();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    const complexElements = hideComplexElements(element);

    const horizontalChunks = Math.ceil(width / CHUNK_SIZE);
    const verticalChunks = Math.ceil(height / CHUNK_SIZE);

    const loadingIndicator = createLoadingIndicator();
    document.body.appendChild(loadingIndicator);

    try {
        for (let y = 0; y < verticalChunks; y++) {
            for (let x = 0; x < horizontalChunks; x++) {
                const chunk = await captureChunk(element, left + (x * CHUNK_SIZE), top + (y * CHUNK_SIZE), Math.min(CHUNK_SIZE, width - (x * CHUNK_SIZE)), Math.min(CHUNK_SIZE, height - (y * CHUNK_SIZE)));

                context?.drawImage(chunk, x * CHUNK_SIZE, y * CHUNK_SIZE);
                updateLoadingIndicator(loadingIndicator, ((y * horizontalChunks + x) / (horizontalChunks * verticalChunks)) * 100);

                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHUNKS));
            }
        }

        document.body.removeChild(loadingIndicator);
        restoreComplexElements(complexElements);

        return { dataURL: canvas.toDataURL('image/jpeg', 0.85), left, top };
    } catch (error) {
        console.error("Error capturing screenshot:", error);
        throw error;
    }
};

const captureChunk = async (element, x, y, width, height) => {
    const canvas = await html2canvas(element, {
        x, y, width, height, scrollX: 0, scrollY: 0, scale: 1, logging: false, removeContainer: true, backgroundColor: null,
        foreignObjectRendering: true, useCORS: true, allowTaint: true, imageTimeout: 0, onclone: (doc) => {
            doc.querySelectorAll('style, script').forEach(el => el.remove());
        }
    });
    return canvas;
};

const hideComplexElements = (container) => {
    const complexElements = [];
    container.querySelectorAll('iframe, video, canvas, [style*="transform"], [style*="animation"]').forEach(el => {
        if (el.style.display !== 'none') {
            complexElements.push({ element: el, display: el.style.display });
            el.style.display = 'none';
        }
    });
    return complexElements;
};

const restoreComplexElements = (elements) => {
    elements.forEach(({ element, display }) => element.style.display = display);
};

const createLoadingIndicator = () => {
    const indicator = document.createElement('div');
    indicator.style.cssText = `position: fixed; bottom: 20px; right: 20px; background: rgba(0, 0, 0, 0.8); color: white; padding: 10px 20px; border-radius: 5px; z-index: 9999;`;
    return indicator;
};

const updateLoadingIndicator = (indicator, progress) => {
    indicator.textContent = `Capturing: ${Math.round(progress)}%`;
};
