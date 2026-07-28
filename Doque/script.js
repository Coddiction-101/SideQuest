import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.min.mjs";
import { createContext } from "react";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.149/build/pdf.worker.min.mjs";

console.log("PDF.js Loaded Successfully");

const pdfUrlInput = document.getElementById("pdf-url");
const openButton = document.getElementById("open-btn");

const canvas = document.getElementById("pdf-canvas");
const context = canvas.getContext("2d");

const emptyState = document.querySelector(".empty-state");

console.log(pdfUrlInput);
console.log(openButton);
console.log(canvas);
console.log(context);
console.log(emptyState);

async function renderPDF (url) {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;

    const page = await pdf.getPage(1);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {

        createContext = context,
        viewport = viewport,
    };

    await page.render(renderContext).promise;
}
