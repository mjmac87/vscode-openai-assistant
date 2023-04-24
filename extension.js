const vscode = require('vscode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**

Retrieves the text content of the currently active editor in VSCode.
If no active editor is found or the content is empty, an error message is displayed and null is returned.
@returns {string|null} The content of the currently active editor, or null if there is no active editor or the content is empty. */
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

/**
 * Displays a prompt to the user and returns their input as a string.
 * @param {string} placeholderText - The placeholder text to display in the input box.
 * @returns {Promise<string>} A promise that resolves with the user's input as a string.
 */
async function getUserInput(placeholderText) {
    const userInput = await vscode.window.showInputBox({
        prompt: placeholderText,
    });

    return userInput;
}

/**
 * Sends a prompt to the OpenAI API for completion using the GPT-3.5 Turbo model.
 * The user's OpenAI API key is obtained from the VSCode configuration.
 * If the key is not found, the user is prompted to enter it and it is saved in the configuration for future use.
 * The completed response is saved to a file in a folder named 'ai_responses' in the workspace directory and opened in an editor and previewed as markdown.
 * @param {string} prompt - The prompt to send to the OpenAI API.
 * @returns {Promise<void>}
 */
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
        
		const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor found.');
            return null;
        }

        const document = activeEditor.document;
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

/**
 * Retrieves the content of the active editor and sends a prompt to the OpenAI API for optimization.
 * If no content is found, the function returns without performing any other actions.
 * @returns {Promise<void>}
 */
async function optimizeFile() {
    const content = getActiveEditorContent();
    if (!content) {
        return;
    }

    const prompt = "Optimize the following code: " + content;
    await sendPromptToOpenAI(prompt);
}

/**
 * Retrieves the content of the active editor and sends a prompt to the OpenAI API for writing doc comments for each method.
 * If no content is found, the function returns without performing any other actions.
 * @returns {Promise<void>}
 */
async function addComments() {
    const content = getActiveEditorContent();
    if (!content) {
        return;
    }

    const prompt = "Write doc comments (XML for C# for example, TSDoc for TypeScript and so on) for each method in the following code: " + content;
    await sendPromptToOpenAI(prompt);
}

/**
 * Retrieves the content of the active editor and sends a prompt to the OpenAI API for writing tests.
 * If no content is found, the function returns without performing any other actions.
 * @returns {Promise<void>}
 */
async function writeTests() {
    const content = getActiveEditorContent();
    if (!content) {
        return;
    }

    const prompt = "Write tests for the following code: " + content;
    await sendPromptToOpenAI(prompt);
}

/**
 * Retrieves the content of the active editor and prompts the user for additional instructions for optimization.
 * Then sends a prompt including the user's instructions to the OpenAI API for optimization.
 * If no content is found, the function returns without performing any other actions.
 * @returns {Promise<void>}
 */
async function howCanI() {
    const content = getActiveEditorContent();
    if (!content) {
        return;
    }

    const userInput = await getUserInput('Enter any additional instructions for optimization:');

    const prompt = "With the following code, how can I " + userInput + ": " + content;
    await sendPromptToOpenAI(prompt);
}

/**
 * Registers a VSCode command with a given name and function and adds the disposable to the given context's subscription array.
 * @param {vscode.ExtensionContext} context - The context in which to register the command.
 * @param {string} commandName - The name of the command.
 * @param {Function} commandFunction - The function to execute when the command is called.
 */
function registerCommand(context, commandName, commandFunction) {
    const disposable = vscode.commands.registerCommand(commandName, commandFunction);
    context.subscriptions.push(disposable);
}

/**
 * Activates the extension by registering the commands with VSCode.
 * @param {vscode.ExtensionContext} context - The context in which the extension is activated.
 */
function activate(context) {
    registerCommand(context, 'extension.optimizeFile', optimizeFile);
    registerCommand(context, 'extension.addComments', addComments);
    registerCommand(context, 'extension.writeTests', writeTests);
    registerCommand(context, 'extension.howCanI', howCanI);
}

/**
 * Deactivates the extension.
 */
function deactivate() {}

// Exports the activate and deactivate functions so VSCode can initialize and deactivate the extension.
module.exports = {
    activate,
    deactivate,
};