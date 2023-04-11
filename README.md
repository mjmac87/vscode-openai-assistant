# OpenAI Assistant Extension for Visual Studio Code

This extension allows you to interact with the OpenAI Chat API directly within Visual Studio Code. It uses the contents of the current file as the prompt for the OpenAI API and displays the response in an output channel called OpenAI Coder.

## Features

- Send the contents of the current file as a prompt to the OpenAI API.
- Display the API response in an Output channel.

## Requirements

- An OpenAI API key is required to use this extension. If you don't have an API key, you can obtain one by signing up at [https://beta.openai.com/signup](https://beta.openai.com/signup).

## Getting Started

1. Install the extension from the Visual Studio Code marketplace or by using the `.vsix` file provided in the project folder.

2. Open a file in Visual Studio Code.

3. Press `Ctrl+Shift+P` or `Cmd+Shift+P` to open the Command Palette.

4. Type `OpenAI Assistant` in the Command Palette and press Enter.

5. If you haven't entered your API key yet, you will be prompted to do so. The extension will store the API key for future use.

6. The contents of the current file will be sent as a prompt to the OpenAI API, and the response will be displayed in an information message.

## Extension Settings

This extension contributes the following settings:

- `openaiAPI.apiKey`: Your OpenAI API key. This setting is used to authenticate with the OpenAI API.

## Known Issues

None.

## Release Notes

### 1.0.0

Initial release of the OpenAI API Interaction extension.

## Contributing

If you'd like to contribute to the development of this extension, please submit issues and/or pull requests on the GitHub repository.

## License

This extension is released under the [MIT License](https://opensource.org/licenses/MIT).
