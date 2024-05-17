let currentPage = 1;
let pdfDocument = null;
let dragCount = 0;
let startX, startY, endX, endY;
let isDragging = false;
let isSettingEnd = false; // Flag to indicate if we are waiting for the end coordinates after an accidental click
let canvas = document.getElementById('pdf-canvas');
let context = canvas.getContext('2d');
let renderedPage = null;
let originalWidth, originalHeight;
let pdfPath = '';  // Global variable to store the PDF path
let ocrResults = []; // Array to store OCR results for each page

canvas.addEventListener('mousedown', function(event) {
    const rect = canvas.getBoundingClientRect();
    const clickX = (event.clientX - rect.left) * (originalWidth / rect.width);
    const clickY = (event.clientY - rect.top) * (originalHeight / rect.height);

    if (isSettingEnd) {
        // Setting the end coordinates after an accidental click
        endX = clickX;
        endY = clickY;
        isSettingEnd = false;
        completeSelection();
    } else {
        // Starting a new selection
        startX = clickX;
        startY = clickY;
        isDragging = true;
    }
});

document.addEventListener('mousemove', function(event) {
    if (isDragging || isSettingEnd) {
        const rect = canvas.getBoundingClientRect();
        let mouseX = (event.clientX - rect.left) * (originalWidth / rect.width);
        let mouseY = (event.clientY - rect.top) * (originalHeight / rect.height);

        drawSelectionBox(startX, startY, mouseX, mouseY);
    }
});

document.addEventListener('mouseup', function(event) {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const releaseX = (event.clientX - rect.left) * (originalWidth / rect.width);
        const releaseY = (event.clientY - rect.top) * (originalHeight / rect.height);

        const distance = Math.sqrt(Math.pow(releaseX - startX, 2) + Math.pow(releaseY - startY, 2));
        if (distance < 10) {
            // Accidental click detected
            isSettingEnd = true;
        } else {
            // Valid selection
            endX = releaseX;
            endY = releaseY;
            completeSelection();
        }
        isDragging = false;
    }
});

function drawSelectionBox(x1, y1, x2, y2) {
    // Clear only the selection box area
    context.drawImage(renderedPage, 0, 0, canvas.width, canvas.height);

    context.strokeStyle = 'rgba(0, 0, 0, 0.8)'; // Dark outline
    context.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Light transparent fill
    context.lineWidth = 1;

    const rectX = Math.min(x1, x2);
    const rectY = Math.min(y1, y2);
    const rectWidth = Math.abs(x1 - x2);
    const rectHeight = Math.abs(y1 - y2);

    context.strokeRect(rectX * (canvas.width / originalWidth), rectY * (canvas.height / originalHeight), rectWidth * (canvas.width / originalWidth), rectHeight * (canvas.height / originalHeight));
    context.fillRect(rectX * (canvas.width / originalWidth), rectY * (canvas.height / originalHeight), rectWidth * (canvas.width / originalWidth), rectHeight * (canvas.height / originalHeight));
}

function renderPage(pageNumber) {
    pdfDocument.getPage(pageNumber).then(function(page) {
        const container = document.getElementById('pdf-container');

        // Calculate scale to fit the page within the container
        const viewport = page.getViewport({ scale: 1 });
        originalWidth = viewport.width;
        originalHeight = viewport.height;
        const scale = Math.min(container.clientWidth / viewport.width, container.clientHeight / viewport.height);
        const scaledViewport = page.getViewport({ scale: scale });

        // Adjust container width to match PDF width
        container.style.width = `${scaledViewport.width}px`;

        // Prepare canvas using PDF page dimensions
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport
        };
        page.render(renderContext).promise.then(() => {
            renderedPage = document.createElement('canvas');
            renderedPage.width = canvas.width;
            renderedPage.height = canvas.height;
            renderedPage.getContext('2d').drawImage(canvas, 0, 0);
        });
    });
}

function completeSelection() {
    showBoxCoordinates(pdfPath, currentPage, startX, startY, endX, endY);
    context.drawImage(renderedPage, 0, 0, canvas.width, canvas.height); // Clear selection box
    dragCount++;

    if (dragCount === 2) {
        // Two drags detected, go to the next page
        if (pdfDocument && currentPage < pdfDocument.numPages) {
            currentPage++;
            // Call determinePageDimensionsAndRender function
            determinePageDimensionsAndRender(currentPage);
            dragCount = 0; // Reset drag count after navigating to the next page
        }
    }
}

function saveOCRResultsToCSV() {
    let csvContent = "Total,Invoice Number\n"; // Add headers
    ocrResults.forEach(function(resultPair) {
        let row = resultPair.join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'output.csv');
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
}

function saveResults() {
    saveOCRResultsToCSV();
}
