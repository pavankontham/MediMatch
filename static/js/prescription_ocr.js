// Prescription OCR functionality
(function () {
    let selectedFile = null;

    // Get DOM elements
    const uploadZone = document.getElementById('ocr-upload-zone');
    const fileInput = document.getElementById('ocr-file-input');
    const browseBtn = document.getElementById('ocr-browse-btn');
    const previewContainer = document.getElementById('ocr-preview-container');
    const imagePreview = document.getElementById('ocr-image-preview');
    const fileNameEl = document.getElementById('ocr-file-name');
    const processBtn = document.getElementById('ocr-process-btn');
    const engineSelect = document.getElementById('ocr-engine-select');
    const progressDiv = document.getElementById('ocr-progress');
    const progressText = document.getElementById('ocr-progress-text');
    const resultsContainer = document.getElementById('ocr-results-container');
    const noResults = document.getElementById('ocr-no-results');
    const errorDiv = document.getElementById('ocr-error');
    const errorMessage = document.getElementById('ocr-error-message');

    // Drag and drop
    if (uploadZone) {
        uploadZone.addEventListener('click', () => fileInput.click());

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#3498db';
            uploadZone.style.background = '#eef2ff';
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.style.borderColor = '#cbd5e0';
            uploadZone.style.background = 'transparent';
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#cbd5e0';
            uploadZone.style.background = 'transparent';

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
    }

    if (browseBtn) {
        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }

    function handleFile(file) {
        selectedFile = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
            fileNameEl.textContent = file.name;
            processBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    // Process prescription
    if (processBtn) {
        processBtn.addEventListener('click', async () => {
            if (!selectedFile) return;

            const formData = new FormData();
            formData.append('prescription_image', selectedFile);
            formData.append('ocr_engine', engineSelect.value);

            // Show progress
            progressDiv.style.display = 'block';
            resultsContainer.style.display = 'none';
            noResults.style.display = 'none';
            errorDiv.style.display = 'none';
            processBtn.disabled = true;

            try {
                const response = await fetch('/api/prescription/upload', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.error) {
                    showError(result.error);
                    return;
                }

                // Display results
                displayResults(result);

            } catch (error) {
                showError('Failed to process prescription: ' + error.message);
            } finally {
                progressDiv.style.display = 'none';
                processBtn.disabled = false;
            }
        });
    }

    function displayResults(result) {
        resultsContainer.style.display = 'block';
        noResults.style.display = 'none';

        // Overall confidence
        const confidence = (result.overall_confidence * 100).toFixed(0);
        document.getElementById('ocr-overall-confidence').textContent = confidence + '%';
        document.getElementById('ocr-confidence-bar').style.width = confidence + '%';

        // Extracted text - HIDDEN as per user request
        // const correctedText = result.stages?.correction?.corrected_text ||
        //     result.stages?.ocr?.raw_text ||
        //     result.raw_text ||
        //     'No text extracted';
        // document.getElementById('ocr-extracted-text').textContent = correctedText;
        // Hide the container if it exists
        const textContainer = document.getElementById('ocr-extracted-text')?.parentElement;
        if (textContainer) textContainer.style.display = 'none';

        // Prescription items
        const itemsContainer = document.getElementById('ocr-prescription-items');
        itemsContainer.innerHTML = '';

        if (result.prescription_items && result.prescription_items.length > 0) {
            result.prescription_items.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'mb-3 p-3';
                itemDiv.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
                itemDiv.style.borderRadius = '10px';
                itemDiv.style.border = '2px solid #27ae60';

                let itemHTML = `
                    <h6 style="font-weight: 700; color: #155724; margin-bottom: 0.75rem;">
                        <i class="bi bi-capsule-pill me-2"></i>
                        Medicine ${index + 1}: ${item.drug_name || 'Unknown'}
                    </h6>
                    <div style="font-size: 0.9rem; color: #155724;">
                `;

                if (item.dosage) itemHTML += `<p style="margin-bottom: 0.25rem;"><strong>Dosage:</strong> ${item.dosage}</p>`;
                if (item.frequency) itemHTML += `<p style="margin-bottom: 0.25rem;"><strong>Frequency:</strong> ${item.frequency}</p>`;
                if (item.duration) itemHTML += `<p style="margin-bottom: 0.25rem;"><strong>Duration:</strong> ${item.duration}</p>`;
                if (item.route) itemHTML += `<p style="margin-bottom: 0.25rem;"><strong>Route:</strong> ${item.route}</p>`;

                // Handle instructions (array or string)
                if (item.instructions) {
                    const instructionsText = Array.isArray(item.instructions)
                        ? item.instructions.join(', ')
                        : item.instructions;
                    itemHTML += `<p style="margin-bottom: 0;"><strong>Instructions:</strong> ${instructionsText}</p>`;
                }

                // Add Insights Button
                itemHTML += `
                    <button class="btn btn-sm btn-outline-success mt-2 w-100" onclick="fetchDrugInsights('${item.drug_name}', 'insight-${index}')">
                        <i class="bi bi-stars me-1"></i> Get Clinical Insights (Web RAG)
                    </button>
                    <div id="insight-${index}" class="mt-2" style="display:none; font-size: 0.85rem; background: rgba(255,255,255,0.7); padding: 10px; border-radius: 5px;">
                        <div class="spinner-border spinner-border-sm text-success" role="status"></div> Loading scientific data...
                    </div>
                `;

                itemHTML += '</div>';
                itemDiv.innerHTML = itemHTML;
                itemsContainer.appendChild(itemDiv);
            });

            // Check for interactions
            checkInteractions(result.prescription_items.map(item => item.drug_name));
        } else {
            itemsContainer.innerHTML = '<p class="text-muted" style="font-size: 0.9rem;">No prescription items extracted. Try uploading a clearer image or using ensemble mode.</p>';
        }
    }

    async function checkInteractions(drugs) {
        if (drugs.length < 2) return;

        try {
            const response = await fetch('/api/prescription/check-interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ drugs })
            });

            const result = await response.json();

            if (result.interactions && result.interactions.length > 0) {
                const interactionsDiv = document.getElementById('ocr-interactions');
                const interactionsList = document.getElementById('ocr-interactions-list');

                interactionsList.innerHTML = result.interactions.map(interaction => `
                    <div style="font-size: 0.9rem; color: #721c24; margin-bottom: 0.5rem;">
                        <strong>${interaction.drug1} + ${interaction.drug2}:</strong> ${interaction.description}
                    </div>
                `).join('');

                interactionsDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Failed to check interactions:', error);
        }
    }

    function showError(message) {
        errorDiv.style.display = 'block';
        errorMessage.textContent = message;
        resultsContainer.style.display = 'none';
        noResults.style.display = 'none';
    }

    // Global function for insights
    window.fetchDrugInsights = async function (drugName, elementId) {
        const container = document.getElementById(elementId);
        container.style.display = 'block';
        container.innerHTML = '<div class="spinner-border spinner-border-sm text-success" role="status"></div> Searching PubMed & Scientific Sources...';

        try {
            const response = await fetch('/api/drug/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ drug_name: drugName })
            });

            const data = await response.json();

            if (data.error) {
                container.innerHTML = `<span class="text-danger"><i class="bi bi-exclamation-triangle"></i> ${data.error}</span>`;
                return;
            }

            container.innerHTML = `
                <div style="border-left: 3px solid #28a745; padding-left: 10px;">
                    <p><strong><i class="bi bi-info-circle"></i> Description:</strong> ${data.description || 'N/A'}</p>
                    <p><strong><i class="bi bi-gear"></i> Mechanism:</strong> ${data.mechanism_of_action || 'N/A'}</p>
                    <p><strong><i class="bi bi-exclamation-circle"></i> Side Effects:</strong> ${data.common_side_effects || 'N/A'}</p>
                    <p><strong><i class="bi bi-shield-exclamation"></i> Contraindications:</strong> ${data.contraindications || 'N/A'}</p>
                    <p class="mb-0"><strong><i class="bi bi-lightbulb"></i> Clinical Pearl:</strong> ${data.clinical_pearls || 'N/A'}</p>
                </div>
            `;

        } catch (error) {
            container.innerHTML = `<span class="text-danger">Failed to fetch insights: ${error.message}</span>`;
        }
    };

    console.log('✅ Prescription OCR JavaScript loaded');
})();
