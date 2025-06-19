
# Bytsea Ledger - AI-Powered Transaction Categorization

Bytsea Ledger is a sophisticated web application designed to automate the categorization of financial transactions from bank and credit card statements. It leverages AI, historical data, and customizable accounting rules to classify transactions into standard Chart of Accounts (CoA), streamlining the bookkeeping process.

## Table of Contents

1.  [Project Overview](#project-overview)
2.  [Core Features](#core-features)
3.  [Application Flow](#application-flow)
    *   [1. API Key Setup](#1-api-key-setup)
    *   [2. Define Context & Data Type](#2-define-context--data-type)
    *   [3. Upload File & Specify Start Row](#3-upload-file--specify-start-row)
    *   [4. Map Columns](#4-map-columns)
    *   [5. Data Parsing & Validation](#5-data-parsing--validation)
    *   [6. Transaction Categorization](#6-transaction-categorization)
    *   [7. Review & Finalize](#7-review--finalize)
4.  [Usage Guidelines](#usage-guidelines)
    *   [Initial Setup](#initial-setup)
    *   [Processing Transactions](#processing-transactions)
    *   [Managing Training Data](#managing-training-data)
    *   [Customizing Accounting Rules](#customizing-accounting-rules)
5.  [Alignment with Application Layer Requirements & Future Improvements](#alignment-with-application-layer-requirements--future-improvements)
6.  [Project Structure](#project-structure)
7.  [Key Services & Logic](#key-services--logic)
8.  [Dependencies](#dependencies)
9.  [Setup & Running the Application](#setup--running-the-application)
10. [Contributing & Future Enhancements](#contributing--future-enhancements)

## Project Overview

The primary goal of Bytsea Ledger is to reduce manual effort in financial data entry and categorization. Users can upload transaction files (CSV/Excel), define their business context, and let the application, powered by Google's Gemini API and a hierarchical rule engine, suggest appropriate accounting categories. The system learns from user-provided training data and allows extensive customization of its underlying accounting logic.

All data, including API keys, client information, training data, and custom rules, is stored locally in the user's browser (`localStorage`).

## Core Features

*   **User-Configurable API Key**: Securely store Google Gemini API key in `localStorage`.
*   **Context Management**: Define and select Clients, Books (ledgers per client), and Industries.
*   **Training Data Mode**: Designate uploads as "Training Data" to teach the system.
*   **Flexible File Upload**: Supports CSV, XLS, and XLSX files.
*   **Header Row Offset**: Users can specify the actual starting row of headers in their files.
*   **Dynamic Column Mapping**:
    *   Intuitive UI to map file columns to required application fields.
    *   Separate mapping configurations for Training Data and Standard Processing.
*   **Hierarchical Categorization Engine**:
    1.  **Book History**: Matches against training data for the current Client & Book.
    2.  **Client History**: Matches against training data from other Books of the same Client.
    3.  **Industry Rules**: Applies rules based on the selected Client's industry.
    4.  **Global Rules**: Applies general accounting rules.
    5.  **AI Fallback (Google Gemini)**: Uses AI for categorization if no prior match.
*   **Detailed Transaction Review**:
    *   Displays specific Chart of Account (e.g., "Service Fee Income") and its broad category (e.g., "Income").
    *   Shows AI-detected Transaction Type and Vendor/Customer Name.
    *   Indicates Prediction Factor (source of categorization) and Confidence Score.
    *   Suggests alternative categories for low-confidence AI predictions.
    *   Allows users to override AI suggestions.
*   **Export to Excel**: Export reviewed and categorized transactions to an XLSX file.
*   **Data Management CRUD**: Add, view (implicitly) Clients, Books, and Industries.
*   **Training Data Portability**:
    *   Export all training data (Clients, Books, Industries, Transactions) and custom accounting rules to a single JSON file.
    *   Import this JSON file to restore data across sessions or browsers.
*   **Customizable Accounting Rules**:
    *   Upload custom JSON files for:
        *   General Accounting Rules (`accountingRules`)
        *   Chart of Accounts Validation Rules (`coaValidationRules`)
        *   Chart of Accounts Alternate Names & Aliases (`coaAlternateNames`)
    *   Custom rules override built-in defaults and are stored locally.
    *   Option to reset individual or all rules to application defaults.
*   **Modern Dark Theme UI**: Responsive and aesthetically pleasing user interface.
*   **Progress & Feedback**: Clear job progress indicators and feedback messages.

## Application Flow

The application guides the user through a series of steps:

### 1. API Key Setup
*   On first use, or if the API key is cleared, the user is prompted to enter their Google Gemini API key.
*   The key is validated (basic initialization) and stored in `localStorage`.
*   The main application UI is unlocked only after a valid key is provided.

### 2. Define Context & Data Type
*   **Select/Add Client**: Choose an existing client or add a new one.
*   **Select/Add Book**: Choose an existing book for the selected client or add a new one.
*   **Select/Add Industry (Optional)**: Assigning an industry can improve categorization accuracy.
*   **Designate as Training Data**: Check this box if the uploaded file is meant to train the system. Uncheck for standard transaction processing.

### 3. Upload File & Specify Start Row
*   Upload a CSV, XLS, or XLSX file containing transactions.
*   **Actual Header Row Number**: Specify the row number in the original file where the table headers begin. The system adjusts the data accordingly for processing.
*   A preview of the raw file (first few rows) is shown to help confirm the start row.

### 4. Map Columns
*   Triggered after file upload and start row confirmation.
*   A modal appears, showing application target fields and dropdowns for each, populated with headers from the uploaded file.
*   The **target fields change** based on whether "Designate as Training Data" is checked:
    *   **Training Data**: Requires mapping fields like `Date`, `Description`, `Chart of Account` (the correct category), `Vendor/Customer Name`, `Transaction Type`, and an `Amount` representation.
    *   **Standard Processing**: Requires mapping `Date`, `Description`, and an `Amount` representation. Other fields like `Currency`, `Transaction Type`, `Reference Number` are optional.
*   Users map their file's columns to the application's expected fields.
*   The system attempts to auto-suggest mappings based on header names.

### 5. Data Parsing & Validation
*   **Training Data**:
    *   If "Designate as Training Data" is checked, after mapping, the system parses the file according to the `UserColumnMapping`.
    *   Validates mandatory fields and data types (especially amounts).
    *   The parsed `MappedTrainingTransaction` data is saved to `localStorage` associated with the selected Client and Book.
    *   A validation report is shown if issues are found.
*   **Standard Processing Data**:
    *   If not training data, the system parses the file using the `standardProcessingMapping` into `RawTransactionData`.
    *   Validates mandatory fields and amounts.
    *   If validation issues (e.g., missing mandatory data in mapped columns, unparseable amounts), a warning is shown, allowing the user to proceed with valid rows or cancel.

### 6. Transaction Categorization (for Standard Processing)
*   If parsing is successful (or the user proceeds past warnings), the `RawTransactionData` is sent for categorization.
*   The system uses a **hierarchical lookup**:
    1.  **Book History**: Checks for similar transactions (description, vendor) in the training data of the current Client & Book.
    2.  **Client History**: Checks training data from other Books of the same Client.
    3.  **Industry Rules**: Applies rules from `accountingRulesService` relevant to the Client's industry.
    4.  **Global Rules**: Applies general rules from `accountingRulesService`.
    5.  **AI Fallback (Gemini)**: If no confident match is found, the transaction description (and optional industry context) is sent to the Google Gemini API. The AI returns a specific CoA, confidence, transaction type, vendor/customer, and a suggested alternative if confidence is low.
*   The `accountingRulesService` is used to normalize category names (e.g., "Bank A/C" -> "Bank Account") and determine the broad category (Assets, Liabilities, etc.).

### 7. Review & Finalize (for Standard Processing)
*   Categorized transactions are displayed in a table.
*   Users can review:
    *   `Date`, `AI Transaction Type`, `Description`
    *   `Chart of Accounts (AI)` (specific CoA name)
    *   `Broad Category (AI)` (e.g., Income, Expenses)
    *   `Vendor/Customer Name (AI)`
    *   `Amount`, `Currency`
    *   `Prediction Factor` (e.g., Book History, AI Model)
    *   `Confidence Score`
    *   `Suggested Alternative (AI)` (if primary AI confidence < 90%)
*   Users can **override** the `Final Category` using a dropdown populated with all known specific CoAs.
*   The reviewed data can be **exported to an XLSX file**.

## Usage Guidelines

### Initial Setup
1.  **API Key**: Upon first launch, enter your Google Gemini API key. You can obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey). The key is stored locally and securely.
2.  **Create Context**:
    *   Add at least one **Client**.
    *   For each Client, add at least one **Book** (e.g., "Operating Account 2023").
    *   Optionally, add **Industries** and associate them with clients to improve AI accuracy.

### Processing Transactions
1.  **Select Context**: Choose the Client, Book, and optionally, Industry.
2.  **Data Type**:
    *   **For Training**: Check "Designate as Training Data".
    *   **For Categorization**: Uncheck "Designate as Training Data".
3.  **Upload File**: Upload your CSV/Excel statement. Specify the row number where your actual data headers start (e.g., if there are 3 junk rows before headers, enter 4. If headers are on row 1, enter 1).
4.  **Confirm Start Row**: Review the preview and click "Apply Start Row & Continue".
5.  **Map Columns**: Click "Proceed to Map Columns". In the modal:
    *   Select the corresponding column from your file for each Bytsea Ledger field.
    *   Mandatory fields are marked with `*`.
    *   For amounts, map either a single 'Amount' column (negative for debits/expenses) OR separate 'Debit Amount' and 'Credit Amount' columns.
    *   Click "Save Mapping & Continue".
6.  **Processing**:
    *   **Training Data**: The file is parsed, validated, and saved as training material for the selected Client/Book.
    *   **Standard Processing**: Transactions are parsed, validated. If issues, a warning allows you to proceed with valid rows. Valid transactions then go through the hierarchical categorization engine.
7.  **Review (Standard Processing)**: Examine the categorized transactions in the table. Override categories as needed.
8.  **Export (Standard Processing)**: Click "Export to Excel (XLSX)" to download the results.

### Managing Training Data
*   **Export**: Navigate to "Data Management" -> "Export Training Data & Rules". This downloads a JSON file containing all clients, books, industries, training transactions, and any custom accounting rules you've uploaded.
*   **Import**: In "Data Management" -> "Import Training Data & Rules", select the exported JSON file. This will add the data to your current application state. It appends to existing data where possible (e.g., adds new clients, or adds training transactions to existing books).

### Customizing Accounting Rules
*   Navigate to "Customize Accounting Rules".
*   For each rule type (General Accounting, CoA Validation, CoA Alternate Names):
    *   You can see if a custom version or the application default is active.
    *   Upload your own valid JSON file to replace the default for that rule type.
    *   Reset individual rules or all rules to their application defaults.
*   Custom rules are stored locally and are included in the "Export All Data" feature.

## Alignment with Application Layer Requirements & Future Improvements

This section evaluates the current application's alignment with a conceptual layered architecture and identifies potential areas for future enhancement.

### 1. Input Layer
*   **Sources**:
    *   **Current**: Supports CSV, XLS, XLSX files via `FileUpload.tsx`.
    *   **Alignment**: Meets requirement.
*   **Metadata**:
    *   **Current**: Client Name, Book Name, Industry provided by user via `ContextSelector.tsx`.
    *   **Alignment**: Meets requirement.

### 2. Ingestion & Normalization
*   **Document Conversion**:
    *   **Current**: `FileUpload.tsx` uses `xlsx` library to convert Excel files to an in-memory CSV-like representation (first sheet only). Column mapping is then applied.
    *   **Alignment**: Good.
    *   **Future Improvements**:
        *   More robust Excel handling: support for selecting specific sheets, handling merged cells or complex layouts.
        *   Direct PDF parsing capabilities (would require additional libraries and more complex logic).
*   **Record Parsing**:
    *   **Normalize date formats → ISO‑8601**:
        *   **Current**: Excel dates are parsed to `yyyy-mm-dd` by `xlsx` during conversion in `FileUpload.tsx`. CSV date handling is less explicit and depends on the raw string data.
        *   **Alignment**: Partially met.
        *   **Future Improvements**: Implement robust date parsing for all mapped date columns (from CSVs or already converted Excel data) to normalize various formats to ISO-8601 consistently within `transactionService.ts`.
    *   **Standardize amounts (debits as negative, credits positive)**:
        *   **Current**: `transactionService.ts` correctly handles single amount columns (expecting negatives for debits) and separate debit/credit columns, standardizing to a single numeric amount.
        *   **Alignment**: Meets requirement.
    *   **Clean text (remove card numbers, generic noise tokens)**:
        *   **Current**: Basic trimming of values during CSV parsing. No specific PII (Personally Identifiable Information) scrubbing or advanced noise removal.
        *   **Alignment**: Basic.
        *   **Future Improvements**: Introduce a text pre-processing step to:
            *   Identify and mask/remove potential PII (e.g., card numbers, social security numbers) using regex.
            *   Remove common "noise" tokens from descriptions (e.g., "AUTH#", "REF:", transaction IDs) to improve matching accuracy.

### 3. Feature Extraction
*   **Tokenization of “Memo/Description”**:
    *   **Current**: Basic word splitting in `historicalDataMatcher.ts` for similarity calculation.
    *   **Alignment**: Rudimentary.
    *   **Future Improvements**: Implement a more formal text processing module for:
        *   Advanced tokenization (handling punctuation, special characters).
        *   Stemming/Lemmatization to normalize words.
        *   Stop-word removal. This would enhance the quality of input for matching algorithms and potential future ML models.
*   **Regex Patterns for known noise, vendor identifiers**:
    *   **Current**: No configurable regex engine. Vendor matching is primarily string-based.
    *   **Alignment**: Not explicitly implemented.
    *   **Future Improvements**:
        *   Allow users to define custom regex patterns via `accountingRulesService.ts` for identifying and extracting vendor names or other structured information from descriptions.
        *   Use these patterns to pre-process descriptions or as features for categorization.
*   **Statistical Features: amount size, frequency, time of day**:
    *   **Current**: Amount size is used. Transaction frequency or time of day are not explicitly extracted or utilized as features.
    *   **Alignment**: Partially met (amount).
    *   **Future Improvements**:
        *   If date parsing includes time, extract time of day.
        *   Analyze transaction frequency for specific descriptions/amounts.
        *   These features could feed into a more advanced rule engine or an ML classifier.
*   **Contextual Features: previous categorization count, book‑level usage**:
    *   **Current**: Book-level history is prioritized in `historicalDataMatcher.ts`. No explicit "categorization count" feature is maintained or used.
    *   **Alignment**: Partially met.
    *   **Future Improvements**: Track frequencies of (description -> category) mappings at book and client levels to assign dynamic weights or confidence scores to historical matches.

### 4. Categorization Engine (Modular Pipeline)
*   **Rule‑Based Matcher**:
    *   **Current**: `transactionService.ts` (`getHierarchicalCategorization`) implements a pipeline: Book History -> Client History -> Industry Rules -> Global Rules. `historicalDataMatcher.ts` handles the lookups using data from `dataService.ts` (localStorage) and rules from `accountingRulesService.ts`.
    *   **Alignment**: Meets requirement.
*   **Machine‑Learning Classifier (Optional)**:
    *   **Current**: No in-browser ML classifier. Similarity matching against historical data acts as a form of instance-based learning.
    *   **Alignment**: Not implemented.
    *   **Future Improvements**: A significant area for enhancement.
        *   Explore client-side ML libraries (TensorFlow.js, ONNX.js).
        *   Train a simple classifier (e.g., Naive Bayes, Logistic Regression) on the user's `MappedTrainingTransaction` data.
        *   This could be an intermediate step in the pipeline for fuzzy matches before falling back to the LLM.
*   **AI Augmentation (LLM)**:
    *   **Current**: `geminiService.ts` calls the Google Gemini API as the final step if no confident match is found by prior methods. The prompt includes transaction memo and client industry.
    *   **Alignment**: Meets requirement.
*   **Confidence Scoring & Thresholding**:
    *   **Current**: Gemini provides a confidence score. Heuristic scores are assigned by historical/rule matchers. The UI displays confidence and suggests alternatives if AI confidence is low.
    *   **Alignment**: Good.
    *   **Future Improvements**:
        *   Standardize confidence scoring across all pipeline stages.
        *   Implement an explicit "Needs Review" status or flag for transactions falling below a user-defined global confidence threshold.

### 5. Validation & Enrichment
*   **Accounting Rules Engine**:
    *   **Current**: `accountingRulesService.ts` loads and manages rule JSONs. These rules are currently used by `historicalDataMatcher.ts` primarily for *category suggestion* (e.g., keyword matching for industry/global rules).
    *   **Alignment**: Partially met for suggestion; less so for post-categorization validation.
    *   **Future Improvements**: Expand the rule engine's role to perform *post-categorization validation and enrichment*. Examples:
        *   "If category is 'Office Supplies' and amount > $2,500, flag for review or suggest re-categorizing to 'Fixed Asset - Office Equipment'."
        *   Automatically populate certain fields based on category and other transaction data.
*   **Multi‑step validations (payroll reconciliation, deposit vs. refund logic)**:
    *   **Current**: No such cross-transaction validation logic. Processing is per-transaction.
    *   **Alignment**: Not implemented.
    *   **Future Improvements**: This is an advanced feature set.
        *   Would require a mechanism to analyze groups of related transactions.
        *   Could involve pattern detection for payroll runs (e.g., one net pay matching multiple tax/deduction payments) or identifying offsetting debit/credit transactions for refund/reversal logic.
*   **User‑Interaction Hook**:
    *   **Current**: The `TransactionTable.tsx` allows users to review AI/rule-suggested categories and override them.
    *   **Alignment**: Meets requirement.

### 6. Mapping & Export
*   **COA Code Resolver**:
    *   **Current**: The system focuses on specific CoA *names* and their broad categories. There's no explicit mapping to numerical CoA *codes* based on client/book-specific templates. The `coaAlternateNamesData` in `accountingRulesService.ts` defines a hierarchy of names, which is a foundational step.
    *   **Alignment**: Rudimentary (name resolution exists).
    *   **Future Improvements**:
        *   Allow users to define a full Chart of Accounts template for each Client/Book, including account codes, names, and types.
        *   Implement a resolver to map the final specific category name to its corresponding CoA code from the user's template.
        *   The `output_mappings` section in the default `accounting_rules_dataset.json` hints at this but needs full implementation.
*   **Formatter (for system-specific export)**:
    *   **Current**: Training data is stored as JSON in `localStorage`. Reviewed transactions are held in component state and can be exported.
    *   **Alignment**: Basic local storage.
    *   **Future Improvements**: If direct integration with accounting software (QuickBooks, Xero, etc.) is desired, this layer would need to format the categorized data into the specific API request format or import file structure (e.g., IIF, specific CSV/XML).
*   **Allow export in CSV and Excel**:
    *   **Current**: `TransactionTable.tsx` allows export of reviewed transactions to Excel (XLSX). Training data (including custom rules) is exported as JSON.
    *   **Alignment**: Partially met (Excel for reviewed, JSON for training).
    *   **Future Improvements**: Add a CSV export option for reviewed transactions in `TransactionTable.tsx`.

Overall, the current client-side architecture provides a solid foundation. Future improvements would likely focus on more sophisticated data processing, a more powerful rule engine for validation/enrichment, deeper integration of CoA codes, and potentially client-side ML for enhanced categorization before LLM fallback.

## Project Structure

The application is organized into the following main directories and files:

*   `index.html`: Main HTML file, includes Tailwind CSS CDN and import maps for JS modules.
*   `index.tsx`: Entry point for the React application.
*   `App.tsx`: Main application component, orchestrates state and UI.
*   `types.ts`: TypeScript type definitions and enums.
*   `constants.ts`: Application-wide constants (initial data, storage keys, field configurations).
*   `metadata.json`: Application metadata.
*   `components/`: Contains all React UI components.
    *   `ApiKeySetup.tsx`: UI for API key input.
    *   `ContextSelector.tsx`: For Client, Book, Industry selection.
    *   `FileUpload.tsx`: Handles file uploads and start row selection.
    *   `ColumnMappingModal.tsx`: UI for mapping CSV/Excel columns.
    *   `JobProgress.tsx`: Displays the status of the current processing job.
    *   `TransactionTable.tsx`: Displays categorized transactions for review.
    *   `AddEntityModal.tsx`: Modal for adding new Clients, Books, Industries.
    *   `StatusBadge.tsx`: Reusable badge for displaying status.
    *   `LoadingSpinner.tsx`: Reusable loading spinner.
    *   `icons.tsx`: SVG icons used in the application.
*   `services/`: Contains business logic and interactions with external services/localStorage.
    *   `geminiService.ts`: Handles communication with the Google Gemini API.
    *   `transactionService.ts`: Core logic for parsing files, validating data, and orchestrating transaction categorization.
    *   `dataService.ts`: Manages CRUD operations for clients, books, industries, training data, and column mappings in `localStorage`. Handles data export/import.
    *   `accountingRulesService.ts`: Manages default and user-customized accounting rule JSON files (loading from `localStorage` or defaults). Provides rule data to other services.
    *   `historicalDataMatcher.ts`: Implements logic for matching transactions against historical training data and basic rule sets.
*   `rules/` (Conceptual - data is embedded in `accountingRulesService.ts` as defaults):
    *   `accounting_rules_dataset.json`: Default general accounting rules.
    *   `coa_validation_dataset.json`: Default CoA validation logic.
    *   `coa_alternateNames_dataset.json`: Default CoA names, aliases, and hierarchy.

## Key Services & Logic

*   **`geminiService.ts`**:
    *   Initializes the Google GenAI client with a user-provided API key.
    *   Constructs prompts for the Gemini API to categorize transactions, requesting specific CoA, confidence, transaction type, vendor/customer, and suggested alternatives.
    *   Parses the JSON response from Gemini.
*   **`transactionService.ts`**:
    *   `parseCSVPreview`: Extracts headers and sample rows from uploaded files.
    *   `parseTransactionsWithDynamicMapping`: Parses standard processing files based on user-defined column mappings, performs validation.
    *   `parseTrainingDataWithMapping`: Parses training data files based on specific training mappings.
    *   `categorizeBatchTransactions`: Orchestrates the hierarchical categorization for a batch of transactions, calling historical matchers and `geminiService` as needed.
*   **`dataService.ts`**:
    *   Acts as an abstraction layer for `localStorage`.
    *   Manages lists of Clients, Books, and Industries.
    *   Stores and retrieves `UserColumnMapping` for training data and `MappedTrainingTransaction[]` (training data itself) per Client/Book.
    *   Implements `exportAllTrainingData` (compiling all relevant local data) and `importAllTrainingData` (parsing and storing imported data, including custom rules).
*   **`accountingRulesService.ts`**:
    *   Manages the three core rule JSONs: `accountingRules`, `coaValidationRules`, `coaAlternateNames`.
    *   `getRuleFiles()`: Returns the active rule set (custom from `localStorage` if available, otherwise internal defaults).
    *   `saveCustomRuleFile()`, `resetCustomRule()`, `resetAllCustomRules()`: Manage user-uploaded custom rule files in `localStorage`.
    *   `normalizeCategoryFromString()`: Maps a string category name to a standardized specific CoA name and its broad `AccountingCategory` enum, using the `coaAlternateNames` data.
    *   `getAllSpecificCoANames()`: Provides a list of all known specific CoA names for UI dropdowns.
*   **`historicalDataMatcher.ts`**:
    *   `findMatchInTrainingData`: Compares a new transaction (description, vendor) against stored training data for similarity.
    *   `findMatchViaIndustryRules`, `findMatchViaGlobalRules`: Implements basic keyword matching against rule sets provided by `accountingRulesService`.

## Dependencies

The project relies on the following main external libraries, loaded via CDN in `index.html`:

*   **React (`react`, `react-dom`)**: For building the user interface.
*   **@google/genai**: The official Google Gemini API SDK for JavaScript.
*   **uuid**: For generating unique IDs.
*   **xlsx**: For parsing Excel files (XLS, XLSX) and exporting data to XLSX.
*   **Tailwind CSS**: A utility-first CSS framework for styling (used via CDN).

## Setup & Running the Application

Since this is a frontend-only application using CDNs for its major dependencies, there's no complex build process required to run it.

1.  **Clone/Download**: Get the project files onto your local machine.
2.  **Open `index.html`**: Simply open the `index.html` file in a modern web browser (e.g., Chrome, Firefox, Edge, Safari).
3.  **API Key**: The application will prompt you to enter your Google Gemini API key to enable AI features.

The application uses `localStorage` to store user data, so data will persist within the same browser unless cleared.

## Contributing & Future Enhancements

This project serves as a strong foundation. Besides the layer-specific improvements mentioned above, potential areas for future development include:

*   **Backend Integration**: For persistent storage of user data, shared access, and more robust data management beyond `localStorage`.
*   **Advanced RAG (Retrieval Augmented Generation)**: More sophisticated methods for leveraging training data and accounting rules with the LLM.
*   **Enhanced Rule Engine UI**: A UI for creating/editing custom rules directly in the application instead of JSON uploads.
*   **Automated Testing**: Implementation of unit and integration tests.
*   **OAuth for API Key**: Instead of manual key entry, integrate OAuth for Google services.
*   **Direct Bank Connections (Plaid/Teller)**: To fetch transactions automatically.
*   **Multi-User Support**: With a backend, allow multiple users and organizations.
*   **Performance Optimization**: For very large transaction files.
*   **Light/Dark Theme Toggler**: Allow users to switch themes.
*   **Internationalization (i18n)**: Support for multiple languages.
*   **Improved Error Handling & User Guidance**: More granular error messages and in-app tutorials.

Contributions are welcome! Please follow standard Git practices (fork, branch, pull request).
Ensure any new features or changes are well-documented.
