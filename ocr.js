function showBoxCoordinates(pdfPath, currentPage, startX, startY, endX, endY) {
    extractSelectedArea(pdfPath, currentPage, startX, startY, endX, endY);
}

async function extractSelectedArea(pdfPath, pageNumber, startX, startY, endX, endY) {
    const loadingTask = pdfjsLib.getDocument(pdfPath);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 }); // Adjust scale as needed

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
        canvasContext: context,
        viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Ensure coordinates are properly transformed
    const scale = viewport.scale;
    const rectX = startX * scale;
    const rectY = startY * scale;
    const rectWidth = (endX - startX) * scale;
    const rectHeight = (endY - startY) * scale;

    const selectedCanvas = document.createElement('canvas');
    selectedCanvas.width = rectWidth;
    selectedCanvas.height = rectHeight;
    const selectedContext = selectedCanvas.getContext('2d');
    selectedContext.drawImage(canvas, rectX, rectY, rectWidth, rectHeight, 0, 0, rectWidth, rectHeight);

    const dataURL = selectedCanvas.toDataURL('image/png');

    // Perform OCR on the selected area
    performOCR(dataURL);
}

function performOCR(imageData) {
    Tesseract.recognize(
        imageData,
        'eng',
    ).then(({ data: { text } }) => {
        // Remove commas and newline characters from the OCR result
        text = text.replace(/,/g, '').replace(/\n/g, '').replace(/\r/g, '');
        storeOCRResult(text);
    });
}

function storeOCRResult(text) {
    // Ensure we have pairs of results for each page
    if (ocrResults.length === 0 || ocrResults[ocrResults.length - 1].length === 2) {
        ocrResults.push([text]);
    } else {
        ocrResults[ocrResults.length - 1].push(text);
    }

    // Check if we have 2 results for the current page
    if (ocrResults[ocrResults.length - 1].length === 2) {
        // Do nothing here; results will be saved at the end
    }
}
