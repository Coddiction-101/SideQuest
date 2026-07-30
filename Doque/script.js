import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.worker.min.mjs";

const pdfUrlInput = document.getElementById("pdf-url");
const openButton = document.getElementById("open-btn");

const canvas = document.getElementById("pdf-canvas");
const context = canvas.getContext("2d");

const emptyState = document.querySelector(".empty-state");

const prevButton = document.getElementById("prev-page");
const nextButton = document.getElementById("next-page");

const zoomInButton = document.getElementById("zoom-in");
const zoomOutButton = document.getElementById("zoom-out");

const fullscreenButton = document.getElementById("fullscreen-btn");
const downloadButton = document.getElementById("download-btn");

const pageInfo = document.getElementById("page-info");

let pdfDocument = null;
let currentPage = 1;
let currentScale = 1.5;
let currentUrl = "";

async function renderPage(pageNumber) {
    const page = await pdfDocument.getPage(pageNumber);

    const viewport = page.getViewport({
        scale: currentScale
    });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
        canvasContext: context,
        viewport
    };

    await page.render(renderContext).promise;

    emptyState.style.display = "none";
    canvas.style.display = "block";

    pageInfo.textContent = `Page ${currentPage} / ${pdfDocument.numPages}`;
}

async function loadPDF(url) {
    try {
        currentUrl = url;

        const loadingTask = pdfjsLib.getDocument(url);

        pdfDocument = await loadingTask.promise;

        currentPage = 1;

        await renderPage(currentPage);

    } catch (error) {
        console.error(error);
        alert("Unable to load this PDF.");
    }
}

openButton.addEventListener("click", () => {

    const url = pdfUrlInput.value.trim();

    if (!url) {
        alert("Please enter a PDF URL.");
        return;
    }

    loadPDF(url);

});

// prevvButton
prevButton.addEventListener("click", async () => {
    if (!pdfDocument) return;

    if (currentPage <= 1) return;

    currentPage--;
    await renderPage(currentPage);
});


//nextPage

nextButton.addEventListener("click", async () => {
    if (!pdfDocument) return;

    if (currentPage >= pdfDocument.numPages) return;

    currentPage++;
    await renderPage(currentPage);

});


zoomInButton.addEventListener("click", async () => {
    if (!pdfDocument) return;
    currentScale += 0.2;

    await renderPage(currentPage);
});


zoomOutButton.addEventListener("click", async () => {
    if (!pdfDocument) return;

    if (currentScale <= 0.6) return;
    currentScale -= 0.2;

    await renderPage(currentPage);
});

downloadButton.addEventListener("click", () => {

    if (!currentUrl) return;

    const link = document.createElement("a");

    link.href = currentUrl;

    link.target = "_blank";

    link.download = "";

    link.click();

});

fullscreenButton.addEventListener("click", () => {

    const viewer = document.querySelector(".viewer-content");

    if (!document.fullscreenElement) {

        viewer.requestFullscreen();

    } else {

        document.exitFullscreen();

    }

});
