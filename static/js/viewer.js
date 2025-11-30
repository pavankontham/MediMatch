// Global variables
let currentMolecule = null;
let drugList = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    loadDrugList();
    initializeViewers();
});

// Load the list of available drugs
async function loadDrugList() {
    try {
        const response = await fetch('/api/drugs');
        drugList = await response.json();

        // Populate dropdowns
        const drugSelect = document.getElementById('drug-select');
        const drug1Select = document.getElementById('drug1-select');
        const drug2Select = document.getElementById('drug2-select');

        drugList.forEach(drug => {
            const option = new Option(drug, drug);
            drugSelect.add(option.cloneNode(true));
            drug1Select.add(option.cloneNode(true));
            drug2Select.add(option.cloneNode(true));
        });
    } catch (error) {
        console.error('Error loading drug list:', error);
        showError('Failed to load drug list');
    }
}

// Initialize 3D molecule viewers
function initializeViewers() {
    // Initialize main viewer
    const viewer = $3Dmol.createViewer('molecule-viewer', {
        backgroundColor: 'white'
    });

    // Initialize comparison viewers
    const viewer1 = $3Dmol.createViewer('molecule-viewer1', {
        backgroundColor: 'white'
    });

    const viewer2 = $3Dmol.createViewer('molecule-viewer2', {
        backgroundColor: 'white'
    });

    // Store viewers globally
    window.mainViewer = viewer;
    window.viewer1 = viewer1;
    window.viewer2 = viewer2;
}

// Load molecule for visualization
async function loadMolecule() {
    const drugSelect = document.getElementById('drug-select');
    const drugSearch = document.getElementById('drug-search');

    let drugName = drugSelect ? drugSelect.value : '';

    // If no drug selected from dropdown, try search input
    if (!drugName && drugSearch) {
        drugName = drugSearch.value.trim();
    }

    if (!drugName) {
        showError('Please select a drug or enter a drug name/SMILES');
        return;
    }

    showLoading(true);

    try {
        // Always use search endpoint for better compatibility
        const response = await fetch(`/api/search_drug?query=${encodeURIComponent(drugName)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const drugData = await response.json();

        if (drugData.error) {
            showError(drugData.error);
            showLoading(false);
            return;
        }

        if (!drugData.drug_name) {
            showError('Drug not found. Please check the name or SMILES.');
            showLoading(false);
            return;
        }

        if (!drugData.SMILES) {
            showError('No molecular structure available for this drug.');
            showLoading(false);
            return;
        }

        // Get MOL block from backend
        const molRes = await fetch('/api/molblock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ smiles: drugData.SMILES })
        });
        
        if (!molRes.ok) {
            throw new Error(`HTTP error! status: ${molRes.status}`);
        }

        const molData = await molRes.json();

        if (molData.error) {
            showError(molData.error);
            showLoading(false);
            return;
        }

        if (!molData.molblock) {
            showError('Could not generate molecule structure.');
            showLoading(false);
            return;
        }

        // Render molecule
        renderMolecule(window.mainViewer, molData.molblock, drugData.drug_name);
        
        // Set name below image
        const nameElement = document.getElementById('main-molecule-name');
        if (nameElement) {
            nameElement.textContent = drugData.drug_name || '';
        }

        // Display properties
        displayProperties(drugData, 'properties-content');
        const propsCard = document.getElementById('properties-card');
        if (propsCard) {
            propsCard.style.display = 'block';
        }

        currentMolecule = drugData;

    } catch (error) {
        console.error('Error loading molecule:', error);
        showError('Failed to load molecule data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Compare two drugs with improved side-by-side display
async function compareDrugs() {
    // Get drug names from either dropdown or text input
    let drug1Name = document.getElementById('drug1-select').value;
    let drug2Name = document.getElementById('drug2-select').value;

    // If no dropdown selection, try text input
    const drug1Input = document.getElementById('drug1-input');
    const drug2Input = document.getElementById('drug2-input');

    if (!drug1Name && drug1Input) {
        drug1Name = drug1Input.value.trim();
    }
    if (!drug2Name && drug2Input) {
        drug2Name = drug2Input.value.trim();
    }

    if (!drug1Name || !drug2Name) {
        showError('Please select or enter both drugs for comparison');
        return;
    }
    if (drug1Name.toLowerCase() === drug2Name.toLowerCase()) {
        showError('Please select two different drugs for comparison');
        return;
    }
    showLoading(true);
    try {
        // Fetch both drugs' info and summary in one call
        const response = await fetch(`/api/compare_drugs?drug1=${encodeURIComponent(drug1Name)}&drug2=${encodeURIComponent(drug2Name)}`);
        const data = await response.json();
        if (data.error || !data.drug1 || !data.drug2) {
            showError(data.error || 'Failed to fetch drug comparison data.');
            showLoading(false);
            return;
        }
        // Fetch molblocks for both drugs using their SMILES from compare_drugs
        const [mol1, mol2] = await Promise.all([
            fetch('/api/molblock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ smiles: data.drug1.SMILES })
            }).then(res => res.json()),
            fetch('/api/molblock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ smiles: data.drug2.SMILES })
            }).then(res => res.json())
        ]);
        if (mol1.error || mol2.error || !mol1.molblock || !mol2.molblock) {
            showError(mol1.error || mol2.error || 'Could not generate 3D structure for one or both drugs.');
            showLoading(false);
            return;
        }
        // Render molecules
        renderMolecule(window.viewer1, mol1.molblock, data.drug1.drug_name);
        document.getElementById('drug1-name-below').textContent = data.drug1.drug_name || '';
        renderMolecule(window.viewer2, mol2.molblock, data.drug2.drug_name);
        document.getElementById('drug2-name-below').textContent = data.drug2.drug_name || '';

        // Display toxicity alerts
        displayToxicityAlert(data.drug1, 'drug1-toxicity');
        displayToxicityAlert(data.drug2, 'drug2-toxicity');

        // Display side-by-side properties comparison
        displaySideBySideComparison(data.drug1, data.drug2);

        // Show names
        document.getElementById('drug1-name').textContent = data.drug1.drug_name;
        document.getElementById('drug2-name').textContent = data.drug2.drug_name;

        // Show summary
        displayComparisonSummary(data.comparison_summary || 'No comparison summary available.', data.comparison_summary_points);
        document.getElementById('comparison-results').style.display = 'block';
    } catch (error) {
        console.error('Error comparing drugs:', error);
        showError('Failed to compare drugs');
    } finally {
        showLoading(false);
    }
}

// Render molecule in 3D viewer (now takes MOL block)
function renderMolecule(viewer, molblock, drugName) {
    viewer.clear();
    try {
        viewer.addModel(molblock, "mol");
        viewer.setStyle({}, { stick: { colorscheme: 'default' } });
        viewer.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.1, color: 'lightgray' });

        // Center and zoom properly
        viewer.zoomTo();
        viewer.zoom(0.8); // Zoom out slightly to ensure molecule fits
        viewer.center();
        viewer.render();

        // Ensure the viewer fits the frame
        setTimeout(() => {
            if (viewer.resize) viewer.resize();
            viewer.render();
        }, 100);
    } catch (e) {
        console.error('Error rendering molecule:', e);
    }
}

// Display molecular properties, highlight differences if comparatorDrug provided
function displayProperties(drugData, containerId, comparatorDrug = null) {
    const container = document.getElementById(containerId);
    // Compose properties, including solubility
    const properties = [
        { label: 'Drug ID', value: drugData.drug_id, icon: 'bi-hash', key: 'drug_id' },
        { label: 'LogP', value: formatNumber(drugData.logP), icon: 'bi-droplet', key: 'logP' },
        { label: 'LogD', value: formatNumber(drugData.logD), icon: 'bi-droplet-fill', key: 'logD' },
        { label: 'PSA', value: formatNumber(drugData.psa), icon: 'bi-bounding-box', key: 'psa' },
        { label: 'Solubility', value: drugData.solubility, icon: 'bi-water', key: 'solubility' },
        { label: 'Toxicity', value: drugData.toxicity_alert, icon: 'bi-exclamation-triangle', key: 'toxicity_alert' },
        { label: 'IC50', value: formatNumber(drugData.IC50), icon: 'bi-activity', key: 'IC50' },
        { label: 'pIC50', value: formatNumber(drugData.pIC50), icon: 'bi-activity', key: 'pIC50' },
        { label: 'Target', value: drugData.target, icon: 'bi-bullseye', key: 'target' },
        { label: 'Organism', value: drugData.organism, icon: 'bi-bug', key: 'organism' },
        { label: 'Target Type', value: drugData.target_type, icon: 'bi-diagram-3', key: 'target_type' },
        { label: 'Mechanism', value: drugData.mechanism_of_action, icon: 'bi-gear', key: 'mechanism_of_action' },
        { label: 'Drug-likeness', value: drugData.drug_likeness, icon: 'bi-check-circle', key: 'drug_likeness' },
        { label: 'Max Phase', value: drugData.max_phase, icon: 'bi-flag', key: 'max_phase' },
        { label: 'EFO Term', value: drugData.efo_term, icon: 'bi-journal', key: 'efo_term' },
        { label: 'MeSH Heading', value: drugData.mesh_heading, icon: 'bi-journal-text', key: 'mesh_heading' },
    ];
    let html = '<div class="d-grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">';
    properties.forEach(prop => {
        if (prop.value !== undefined && prop.value !== null && prop.value !== '' && prop.value !== 'N/A') {
            let className = 'property-card';
            if (comparatorDrug) {
                if (String(prop.value) !== String(comparatorDrug[prop.key])) {
                    className += ' bg-danger-subtle text-danger fw-bold';
                } else {
                    className += ' bg-success-subtle text-success';
                }
            }
            html += `
                <div class="${className}">
                    <div class="property-label">
                        <i class="${prop.icon} me-2"></i>
                        ${prop.label}
                    </div>
                    <div class="property-value">${prop.value}</div>
                </div>
            `;
        }
    });
    html += '</div>';
    container.innerHTML = html;
}

// Display toxicity alert with red styling
function displayToxicityAlert(drugData, containerId) {
    const container = document.getElementById(containerId);
    const toxicity = drugData.toxicity_alert;

    if (toxicity && toxicity !== 'N/A' && toxicity !== '') {
        container.innerHTML = `
            <div class="toxicity-alert">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <strong>TOXICITY ALERT:</strong> ${toxicity}
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="no-toxicity">
                <i class="bi bi-check-circle-fill"></i>
                No toxicity alerts detected
            </div>
        `;
    }
}

// Display side-by-side properties comparison
function displaySideBySideComparison(drug1, drug2) {
    const container = document.getElementById('side-by-side-properties');

    const properties = [
        { key: 'drug_id', label: 'Drug ID', icon: 'bi-hash' },
        { key: 'logP', label: 'LogP', icon: 'bi-droplet' },
        { key: 'logD', label: 'LogD', icon: 'bi-droplet-fill' },
        { key: 'psa', label: 'PSA', icon: 'bi-bounding-box' },
        { key: 'solubility', label: 'Solubility', icon: 'bi-water' },
        { key: 'drug_likeness', label: 'Drug-likeness', icon: 'bi-check-circle' },
        { key: 'max_phase', label: 'Max Phase', icon: 'bi-flag' },
        { key: 'IC50', label: 'IC50', icon: 'bi-activity' },
        { key: 'pIC50', label: 'pIC50', icon: 'bi-activity' },
        { key: 'target', label: 'Target', icon: 'bi-bullseye' },
        { key: 'organism', label: 'Organism', icon: 'bi-bug' },
        { key: 'target_type', label: 'Target Type', icon: 'bi-diagram-3' },
        { key: 'mechanism_of_action', label: 'Mechanism', icon: 'bi-gear' },
        { key: 'efo_term', label: 'EFO Term', icon: 'bi-journal' },
        { key: 'mesh_heading', label: 'MeSH Heading', icon: 'bi-journal-text' }
    ];

    let html = '<div class="side-by-side-comparison">';

    // Add header row
    html += `
        <div class="comparison-row" style="background: linear-gradient(135deg, var(--secondary-color), var(--primary-color)); color: white; font-weight: 700;">
            <div class="comparison-label" style="background: transparent; color: white; border: none;">
                <i class="bi bi-capsule me-2"></i>${drug1.drug_name}
            </div>
            <div class="comparison-label" style="background: transparent; color: white; border: none;">
                <i class="bi bi-capsule me-2"></i>${drug2.drug_name}
            </div>
        </div>
    `;

    properties.forEach(prop => {
        const value1 = drug1[prop.key];
        const value2 = drug2[prop.key];

        if (value1 !== undefined && value1 !== null && value1 !== '' && value1 !== 'N/A' ||
            value2 !== undefined && value2 !== null && value2 !== '' && value2 !== 'N/A') {

            const formattedValue1 = formatNumber(value1);
            const formattedValue2 = formatNumber(value2);

            let value1Class = 'comparison-value';
            let value2Class = 'comparison-value';

            // Highlight differences
            if (formattedValue1 !== formattedValue2 && formattedValue1 !== 'N/A' && formattedValue2 !== 'N/A') {
                value1Class += ' bg-warning-subtle';
                value2Class += ' bg-warning-subtle';
            } else if (formattedValue1 === formattedValue2 && formattedValue1 !== 'N/A') {
                value1Class += ' bg-success-subtle';
                value2Class += ' bg-success-subtle';
            }

            html += `
                <div class="comparison-row">
                    <div class="comparison-label">
                        <i class="${prop.icon} me-2"></i>${prop.label}
                    </div>
                    <div class="${value1Class}">${formattedValue1}</div>
                    <div class="${value2Class}">${formattedValue2}</div>
                </div>
            `;
        }
    });

    html += '</div>';
    container.innerHTML = html;
}

// Display comparison summary
function displayComparisonSummary(summary, summaryPoints) {
    const container = document.getElementById('comparison-summary');
    if (Array.isArray(summaryPoints) && summaryPoints.length > 0) {
        container.innerHTML = `
            <h5><i class="bi bi-clipboard-data me-2"></i>Comparison Summary</h5>
            <ul style="margin-bottom:0; padding-left:1.5em;">
                ${summaryPoints.map(point => `<li style='margin-bottom: 0.5em;'>${point}</li>`).join('')}
            </ul>
        `;
    } else {
        container.innerHTML = `
            <h5><i class="bi bi-clipboard-data me-2"></i>Comparison Summary</h5>
            <p class="mb-0">${summary}</p>
        `;
    }
}

// Format numbers for display
function formatNumber(value) {
    if (value === null || value === undefined || value === 'nan' || value === 'None') {
        return 'N/A';
    }

    const num = parseFloat(value);
    if (isNaN(num)) {
        return value;
    }

    return num.toFixed(3);
}

// Show/hide loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = show ? 'block' : 'none';
}

// Show error message
function showError(message) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error-message, .alert-danger');
    existingErrors.forEach(error => error.remove());
    // Create Bootstrap 5 alert
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger error-message';
    errorDiv.role = 'alert';
    errorDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle me-2"></i>
        ${message}
    `;
    // Insert error message after the main container
    const mainContainer = document.querySelector('.main-container');
    mainContainer.parentNode.insertBefore(errorDiv, mainContainer.nextSibling);
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// Add event listeners for search functionality
document.addEventListener('DOMContentLoaded', function () {
    const drugSearch = document.getElementById('drug-search');

    // Auto-search on Enter key
    if (drugSearch) {
        drugSearch.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                loadMolecule();
            }
        });
    }

    // Auto-search on dropdown change
    const drugSelect = document.getElementById('drug-select');
    if (drugSelect) {
        drugSelect.addEventListener('change', function () {
            if (this.value) {
                loadMolecule();
            }
        });
    }

    // Drug comparison - clear text input when dropdown is selected
    const drug1Select = document.getElementById('drug1-select');
    const drug1Input = document.getElementById('drug1-input');
    const drug2Select = document.getElementById('drug2-select');
    const drug2Input = document.getElementById('drug2-input');

    if (drug1Select && drug1Input) {
        drug1Select.addEventListener('change', function() {
            if (this.value) drug1Input.value = '';
        });
        drug1Input.addEventListener('input', function() {
            if (this.value.trim()) drug1Select.value = '';
        });
        drug1Input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') compareDrugs();
        });
    }

    if (drug2Select && drug2Input) {
        drug2Select.addEventListener('change', function() {
            if (this.value) drug2Input.value = '';
        });
        drug2Input.addEventListener('input', function() {
            if (this.value.trim()) drug2Select.value = '';
        });
        drug2Input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') compareDrugs();
        });
    }
});