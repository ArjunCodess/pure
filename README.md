# PURE: Product Understanding & Review Engine

A mobile application built with Expo and React Native for analyzing product ingredients using Google Gemini AI.  PURE allows users to scan product labels, extract text, and receive a comprehensive analysis of ingredients, allergens, and potential health and environmental impacts.

## Features

*   **Image Upload and Analysis:** Upload product images directly from the device's camera or gallery. The app extracts text from the image and sends it to Google Gemini AI for analysis.
*   **Detailed Ingredient Analysis:** Receive a structured JSON response from the Gemini API containing detailed ingredient information, including purpose, description, and safety information.
*   **Allergen Detection:**  Identifies potential allergens present in the product.
*   **Dietary Information:** Determines if the product is vegan or vegetarian, along with other dietary restrictions it might violate.
*   **Harmful Ingredient Identification:** Highlights potentially harmful ingredients and their associated risks.
*   **Environmental Impact Assessment:** Provides an assessment of the product's environmental impact.
*   **Scan History:** Stores a history of previous scans with analysis results for easy access.

## Usage

1.  Open the PURE application on your mobile device.
2.  Tap the "Scan" button to either take a photo of a product label or select an image from your gallery.
3.  The app will upload the image, extract the text, and send it for analysis.
4.  View the detailed analysis results, including ingredient information, allergens, dietary information, harmful ingredients, and environmental impact.
5.  Access your scan history from the "History" tab.

## Installation

PURE is built using Expo, therefore installation is straightforward:

1.  Clone the repository: `git clone <repository_url>`
2.  Navigate to the project directory: `cd mobile`
3.  Install dependencies: `npm install` or `yarn install`
4.  Start the development server: `npm start` or `yarn start`
5.  Scan the QR code that appears in the Expo Go app or use a simulator/emulator

## Technologies Used

*   **Expo:** Framework for building cross-platform mobile applications (iOS and Android).
*   **React Native:** JavaScript framework for building native-like mobile apps.
*   **Expo Router:** A router for Expo applications. Used for navigation between screens.
*   **Nativewind:** Tailwind CSS implementation for React Native. Enables styling with utility-first CSS.
*   **Google Generative AI (Gemini):**  Used for analyzing product ingredient text and providing detailed analysis.
*   **@react-native-ml-kit/text-recognition:**  Provides the ML kit text recognition functionalities used to extract text from uploaded images.
*   **Cloudinary:** Used for image storage and hosting.
*   **AsyncStorage:** React Native API for storing data locally within the app.
*   **TypeScript:** Provides static typing for improved code maintainability.

## API Documentation

### `/api/upload` (POST)

**Request:**

```json
{
  "base64": "<base64_encoded_image_data>" 
}
```

**Response (Success):**

```json
{
  "success": true,
  "secure_url": "<cloudinary_secure_url>"
}
```

**Response (Error):**

```json
{
  "error": "<error_message>"
}
```

### `/api/extract-text` (POST)

**Request:**

```json
{
  "imageUrl": "<image_url>"
}
```

**Response (Success):**

```json
{
  "success": true,
  "text": "<extracted_text>"
}
```

**Response (Error):**

```json
{
  "error": "<error_message>"
}
```

### `/api/analyze-product` (POST)

**Request:**

```json
{
  "extractedText": "<extracted_product_text>"
}
```

**Response (Success):**

```json
{
  "success": true,
  "analysis": { /* Detailed product analysis JSON as defined in app/api/analyze-product+api.ts */ }
}
```

**Response (Error):**

```json
{
  "error": "<error_message>"
}
```

## Dependencies

The project dependencies are managed using `npm` and are listed in the `package.json` file.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Testing

Testing is currently not implemented.  Future improvements could include unit and integration tests.


*README.md was made with [Etchr](https://etchr.dev)*