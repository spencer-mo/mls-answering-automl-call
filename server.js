import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import os from 'os';
import { GraphQLClient } from 'graphql-request';
import gqlQueries from './gql/automl.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const graphQLClient = new GraphQLClient(process.env.GRAPHQL_ENDPOINT, {
    headers: {
        authorization: `Bearer ${process.env.API_KEY}`,
    },
});

const app = express();
const port = 3000;

// Middleware to serve static files
app.use(express.static(path.join(__dirname)));

// Middleware to handle file uploads
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: os.tmpdir()
}));

// Endpoint to handle file uploads
app.post('/upload', (req, res) => {
    if (!req.body.purpose) {
        return res.status(400).json({ success: false, message: 'File Purpose is required.' });
    }

    // NOTE: req.body.purpose is one of 'training' or 'prediction'

    const file = req.files.file;
    const purpose = req.body.purpose;
    const tempPath = file.tempFilePath;
    const baseName = path.basename(file.name);
    const targetDir = path.join(os.tmpdir(), purpose);
    const targetPath = path.join(targetDir, baseName);

    // Create the target directory if it doesn't exist
    fs.mkdir(targetDir, { recursive: true }, err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error creating directory.' });
        }

        // Move the file from temp directory to the target path
        fs.rename(tempPath, targetPath, err => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error uploading file.' });
            }
            res.json({ success: true, message: 'File uploaded successfully.' });
        });
    });
});

app.post('/gql', async (req, res) => {
    if (!req.body.queryRef || !req.body.variables) {
        return res.status(400).json({ success: false, message: 'Query and variables are required.' });
    }
    const queryRef = req.body.queryRef;
    const variables = req.body.variables;

    const query = gqlQueries[queryRef];

    if (!query) {
        return res.status(400).json({ success: false, message: 'Invalid query reference.' });
    }

    try {
        const response = await graphQLClient.request(query, variables);
        console.log("response: " + JSON.stringify(response));
        res.json(response);
    } catch (error) {
        console.error('GraphQL request failed:', error);
        res.status(500).json({ success: false, message: 'GraphQL request failed.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});