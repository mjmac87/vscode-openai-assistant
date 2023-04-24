const vscode = require('vscode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

function getActiveEditorContent() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showErrorMessage('No active editor found.');
        return null;
    }

    const document = activeEditor.document;
    const content = document.getText();

    if (!content) {
        vscode.window.showErrorMessage('The current file is empty.');
        return null;
    }

    return content;
}

async function getUserInput(placeholderText) {
    const userInput = await vscode.window.showInputBox({
        prompt: placeholderText,
    });

    return userInput;
}

async function sendPromptToOpenAI(prompt) {
    const config = vscode.workspace.getConfiguration('openaiAPI');
	let apiKey = config.get('apiKey');
    let openaiAPIoutput = vscode.window.createOutputChannel("OpenAI Assistant");

    if (!apiKey) {
        apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API key:',
        });

        if (!apiKey) {
            vscode.window.showErrorMessage('API key not provided.');
            return;
        }

        await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
    }

    try {

		openaiAPIoutput.appendLine("Prompt sent.");

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
			{
				model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: prompt }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
            }
		);

		let completion = response.data.choices[0].message.content;
		
		const workspaceFolder = path.dirname(document.uri.fsPath);
		const aiResponsesFolder = path.join(workspaceFolder, 'ai_responses');
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const responseFilename = `response_${timestamp}.md`;
		const responsePath = path.join(aiResponsesFolder, responseFilename);

		openaiAPIoutput.appendLine("Response received.");

		try {
			fs.mkdirSync(aiResponsesFolder, { recursive: true });
			fs.writeFileSync(responsePath, completion, 'utf-8');
			vscode.window.showInformationMessage(`OpenAI Response saved to: ${responsePath}`);

			const responseUri = vscode.Uri.file(responsePath);
            await vscode.commands.executeCommand('vscode.open', responseUri);
            await vscode.commands.executeCommand('markdown.showPreview', responseUri);
		} catch (err) {
			vscode.window.showErrorMessage(`Error saving OpenAI Response: ${err.message}`);
		}
    } catch (error) {
		vscode.window.showErrorMessage('Error interacting with the OpenAI API.');
        openaiAPIoutput.appendLine(error);
		
    }
}

async function optimizeFile() {
    const content = getActiveEditorContent();
    if (!content) {
        return;
    }

    const prompt = "Optimize the following code: " + content;
    await sendPromptToOpenAI(prompt);    
}

async function addComments() {
    const content = getActiveEditorContent();
    if (!content) {
        return;
    }

    const prompt = "Add comments to the following code: " + content;
    await sendPromptToOpenAI(prompt);
}

async function writeTests() {
    const content = getActiveEditorContent();
    if (!content) {
        return;
    }

    const prompt = "Write tests for the following code: " + content;
    await sendPromptToOpenAI(prompt);
}

async function howCanI() {
    const content = getActiveEditorContent();
    if (!content) {
        return;
    }

    const userInput = await getUserInput('Enter any additional instructions for optimization:');

    const prompt = "With the following code, how can I " + userInput + ": " + content;
    await sendPromptToOpenAI(prompt);
}

function registerCommand(context, commandName, commandFunction) {
    const disposable = vscode.commands.registerCommand(commandName, commandFunction);
    context.subscriptions.push(disposable);
}

function activate(context) {
    registerCommand(context, 'extension.optimizeFile', optimizeFile);
    registerCommand(context, 'extension.addComments', addComments);
    registerCommand(context, 'extension.writeTests', writeTests);
    registerCommand(context, 'extension.howCanI', howCanI);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};