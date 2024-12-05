function handleFileUpload(event, filePurpose) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    const messageDiv = document.getElementById(`${filePurpose}Message`);

    if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('purpose', filePurpose);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                messageDiv.textContent = `File "${file.name}" uploaded successfully.`;
                messageDiv.style.color = 'green';

                if (data.datasetSrc !== undefined) {
                    window.localStorage.setItem(filePurpose, data.datasetSrc)
                }
            } else {
                messageDiv.textContent = `Failed to upload file: ${data.message}`;
                messageDiv.style.color = 'red';
            }
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            messageDiv.textContent = 'Error uploading file. Please try again.';
            messageDiv.style.color = 'red';
        });
    } else {
        messageDiv.textContent = 'No file selected.';
        messageDiv.style.color = 'red';
    }
}

async function generate() {
    const promptInput = document.getElementById('promptInput').value;
    const promptOutput = document.getElementById('promptOutput');
    if (promptInput.trim() === '') {
        promptOutput.textContent = 'Please enter a prompt.';
        promptOutput.style.color = 'red';
        resultSection.style.display = 'none';
    } else {
        await fetchPredictionData(promptInput);
    }
}

async function obtainTargetInstructions(prompt) {
    const response = await fetch(
        'http://localhost:8080/generate',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        }
    )
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json()
}

async function gqlRequest(queryRef, variables) {
    const response = await fetch("http://localhost:3000/gql", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queryRef, variables }),
    })
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json()
}

async function generateExperimentVersion(trainingDatasetSrc, target, columns) {
    const newExperiment = await gqlRequest('newExperimentMutation', {
        input: {
            name: `experiment-${getRandomId}`,
            spaceId: '',
        }
    });
    console.log("Created new experiment info: " + JSON.stringify(newExperiment));
    const newExperimentVersion = await gqlRequest('newExperimentVersionMutation', {
        input: {
            experimentId: newExperiment.info.id,
            target,
            datasetSrc: trainingDatasetSrc,
            columns,
            experimentType: 'binary', // TODO: can be inferred elsewhere or by prompt processing??
            experimentMode: 'auto_quick',
            datasetOrigin: 'new',
        }
    })
    console.log("Created new experiment version " + JSON.stringify(newExperimentVersion))
    return newExperimentVersion;
}

async function runTrainingAndGetPredictionOutput(trainingDatasetSrc, predictionDatasetSrc, target, columns) {
    const experimentVersion = await generateExperimentVersion(trainingDatasetSrc, target, columns);
    // TODO periodically query and sleep in between until experimentVersion.info.status == 'ready'
    // TODO grab `topModelId`

    // TODO ensure the corresponding Model is in the proper state for the deployment to allow predictions, if not, then PatchModel
    // TODO trigger NewDeployment mutation with predictions already enabled

    // TODO invoke RTP with our same API key and forward response and replace dummy data
    const rtpOutput = {
        data: [
            ['ID', 'Prediction', 'Score'],
            ['1', 'Positive', '0.95'],
            ['2', 'Negative', '0.85'],
            ['3', 'Positive', '0.90'],
            ['4', 'Neutral', '0.75']
        ],
    }
    return rtpOutput;
}

async function fetchPredictionData(prompt) {
    const promptOutput = document.getElementById('promptOutput');
    try {
        const trainingDatasetSrc = window.localStorage.getItem('training');
        const predictionDatasetSrc = window.localStorage.getItem('prediction');
        if (!trainingDatasetSrc || trainingDatasetSrc == 'undefined' || !predictionDatasetSrc || predictionDatasetSrc == 'undefined') {
            promptOutput.textContent = "It looks like I have no training and prediction data to work with.";
            promptOutput.style.color = 'red';
        }
        // TODO get columns from the tempfile csv or parquet or otherwise have the prompt processor do it
        let columns = [];

        // TODO parse columns from the training dataset saved to temp file storage
        const instructions = await obtainTargetInstructions(prompt);
        
        const target = instructions.target;

        // // assumes the prompt processing will extract columns for us
        // columns = instructions.columns;

        const predColumn = instructions.predColumn;

        // TODO get catalog dataset src QRI for 'training' dataset using corresponding file path variable above
        // TODO get catalog dataset src QRI for 'predictions' dataset using corresponding file path variable above

        const data = await runTrainingAndGetPredictionOutput(trainingDatasetSrc, predictionDatasetSrc, target, columns);
        // TODO extract predicted value specifically for the 'preColumn' we care about
        const predictedValue = data[predColumn];

        // TODO replace dummy successful response
        promptOutput.textContent = `Based on the data provided, we expect ${predColumn} to have ${target}: ${predictedValue}.`;
        promptOutput.style.color = 'red';
        
        // const predictionData = data.getPrediction.map(item => [item.id, item.prediction]);

        // const table = document.getElementById('predictionResultsTable');
        // const thead = table.querySelector('thead');
        // const tbody = table.querySelector('tbody');

        // // Clear existing table data
        // thead.innerHTML = '';
        // tbody.innerHTML = '';

        // // Populate table headers
        // const headers = ['ID', 'Prediction'];
        // const headerRow = document.createElement('tr');
        // headers.forEach(header => {
        //     const th = document.createElement('th');
        //     th.textContent = header;
        //     headerRow.appendChild(th);
        // });
        // thead.appendChild(headerRow);

        // // Populate table rows
        // predictionData.forEach(row => {
        //     const tr = document.createElement('tr');
        //     row.forEach(cell => {
        //         const td = document.createElement('td');
        //         td.textContent = cell;
        //         tr.appendChild(td);
        //     });
        //     tbody.appendChild(tr);
        // });

        // // Show the result section
        // const resultSection = document.getElementById('resultSection');
        // resultSection.style.display = 'block';
    } catch (error) {
        console.error('Error fetching prediction data:', error);
        promptOutput.textContent = 'Error fetching prediction data. Please try again.';
        promptOutput.style.color = 'red';
    }
}

// Generate a random number between 0 (inclusive) and 1 (exclusive)
const randomDecimal = Math.random(); 

// Generate a random integer between 1 and 10 (inclusive)
const randomInteger = Math.floor(Math.random() * 10) + 1; 

// Generate a random number between min (inclusive) and max (inclusive)
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; 
}

function getRandomId() {
    return getRandomInt(1000000, 9999999).toString();
}