function handleFileUpload(event, sectionId) {
    const file = event.target.files[0];
    const messageDiv = document.getElementById(`${sectionId}Message`);
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const contents = e.target.result;
            if (file.name.endsWith('.csv')) {
                messageDiv.textContent = `CSV file "${file.name}" uploaded successfully.`;
                messageDiv.style.color = 'green';
            } else if (file.name.endsWith('.parquet')) {
                messageDiv.textContent = `Parquet file "${file.name}" uploaded successfully.`;
                messageDiv.style.color = 'green';
            } else {
                messageDiv.textContent = `Unsupported file type. Please upload a .csv or .parquet file.`;
                messageDiv.style.color = 'red';
            }
        };
        reader.readAsText(file);
    } else {
        messageDiv.textContent = 'No file selected.';
        messageDiv.style.color = 'red';
    }
}

function generate() {
    const promptInput = document.getElementById('promptInput').value;
    const promptOutput = document.getElementById('promptOutput');
    const resultSection = document.getElementById('resultSection');

    if (promptInput.trim() === '') {
        promptOutput.textContent = 'Please enter a prompt.';
        promptOutput.style.color = 'red';
        resultSection.style.display = 'none';
    } else {
        // Simulate a response from a server or processing
        const response = `Generated response for prompt: "${promptInput}"`;
        promptOutput.textContent = response;
        promptOutput.style.color = 'black';

        // Simulate fetching prediction dataset
        fetchPredictionData();
    }
}

function fetchPredictionData() {
    // Simulated prediction data
    const predictionData = [
        ['ID', 'Prediction'],
        ['1', 'Positive'],
        ['2', 'Negative'],
        ['3', 'Positive'],
        ['4', 'Neutral']
    ];

    const table = document.getElementById('predictionResultsTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    // Clear existing table data
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Populate table headers
    const headers = predictionData[0];
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Populate table rows
    predictionData.slice(1).forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    // Show the result section
    const resultSection = document.getElementById('resultSection');
    resultSection.style.display = 'block';
}