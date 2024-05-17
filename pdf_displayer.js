document.getElementById('file-input').addEventListener('change', function(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    if (file && file.type === 'application/pdf') {
        showSpinner();
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const typedarray = new Uint8Array(this.result);

            // PDF.js setup
            const loadingTask = pdfjsLib.getDocument({ data: typedarray });
            loadingTask.promise.then(function(pdf) {
                pdfDocument = pdf;
                currentPage = 1;
                pdfPath = URL.createObjectURL(file);  // Set the global PDF path
                determinePageDimensionsAndRender(currentPage);

                // Blur the file input and focus on the canvas
                fileInput.blur();
                document.getElementById('pdf-canvas').focus();
                hideSpinner();
            }, function(reason) {
                // PDF loading error
                console.error(reason);
                hideSpinner();
            });
        };
        fileReader.readAsArrayBuffer(file);
    }
});

function determinePageDimensionsAndRender(pageNumber) {
    pdfDocument.getPage(pageNumber).then(function(page) {
        const viewport = page.getViewport({ scale: 1 });

        // Calculate scale to fit the page height into the available height
        const buttonsHeight = document.getElementById('button-container').offsetHeight;
        const availableHeight = window.innerHeight - buttonsHeight;
        const scale = availableHeight / viewport.height;

        // Calculate the scaled dimensions
        const scaledWidth = viewport.width * scale;
        const scaledHeight = viewport.height * scale;

        // Set the dimensions for the container and canvas
        const container = document.getElementById('pdf-container');
        const canvas = document.getElementById('pdf-canvas');
        container.style.width = `${scaledWidth}px`;
        container.style.height = `${scaledHeight}px`;
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        // Now render the page
        renderPage(pageNumber, scale);
    });
}

function renderPage(pageNumber, scale) {
    showSpinner();
    pdfDocument.getPage(pageNumber).then(function(page) {
        const canvas = document.getElementById('pdf-canvas');
        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: scale });

        // Render the page into the canvas context
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        page.render(renderContext).promise.then(() => {
            hideSpinner();
        });
    }).catch(function(error) {
        console.error("Error rendering page: ", error);
        hideSpinner();
    });
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowRight') {
        nextPage();
    } else if (event.key === 'ArrowLeft') {
        prevPage();
    }
});

function showSpinner() {
    document.getElementById('loading-spinner').style.display = 'block';
}

function hideSpinner() {
    document.getElementById('loading-spinner').style.display = 'none';
}

function nextPage() {
    if (pdfDocument && currentPage < pdfDocument.numPages) {
        currentPage++;
        determinePageDimensionsAndRender(currentPage);
    } else if (currentPage === pdfDocument.numPages) {
        alert("No more pages");
    }
}

function prevPage() {
    if (pdfDocument && currentPage > 1) {
        currentPage--;
        determinePageDimensionsAndRender(currentPage);
    }
}