# Azure Menubar Extension

This Chrome extension is designed to enhance the user experience on the Azure DevOps website (https://dev.azure.com/). It automatically detects when the user navigates to this page and modifies the menubar by appending a GIF image.

## Features

- Listens for navigation events to detect when the user enters the Azure DevOps page.
- Searches for the menubar element and appends a specified GIF image if found.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/azure-menubar-extension.git
   ```

2. Navigate to the extension directory:
   ```
   cd azure-menubar-extension
   ```

3. Open Chrome and go to `chrome://extensions/`.

4. Enable "Developer mode" by toggling the switch in the top right corner.

5. Click on "Load unpacked" and select the `azure-menubar-extension` directory.

6. The extension should now be installed and active.

## Usage

- Navigate to https://dev.azure.com/ in your Chrome browser.
- The extension will automatically search for the menubar element and append the GIF image to it.

## Contributing

Feel free to submit issues or pull requests if you have suggestions or improvements for the extension.

## License

This project is licensed under the MIT License. See the LICENSE file for details.