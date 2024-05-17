document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('instruction-modal');
    const closeBtn = document.getElementById('close-instructions');

    // Show the modal on page load
    modal.style.display = 'flex';

    // Hide the modal when the close button is clicked
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
});
