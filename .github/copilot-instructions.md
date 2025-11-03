# Bytsea Ledger - AI Coding Agent Instructions

## Project Overview
Bytsea Ledger is a React/TypeScript web application for AI-powered transaction categorization. It processes bank/credit card statements (CSV/Excel) and uses a hierarchical pipeline to classify transactions into Chart of Accounts categories. The app runs entirely in the browser using localStorage for data persistence.

## Architecture & Data Flow

### Core Pipeline (Hierarchical Categorization)
Transactions flow through this exact sequence in `transactionService.ts`:
1. **Book History** - Match against training data for current Client/Book
2. **Client History** - Match training data from other Books of same Client  
3. **Industry Rules** - Apply rules from Client's selected Industry
4. **Global Rules** - Apply general accounting rules
5. **Rule-Based Fallback** - Apply pattern-based categorization rules
6. **AI Fallback** - Google Gemini API categorization (only if enabled and API key provided)

### Key Components
- `App.tsx` - Main state container and UI orchestration
- `services/transactionService.ts` - Core business logic and pipeline orchestration
- `services/dataService.ts` - localStorage abstraction layer
- `services/geminiService.ts` - Google Gemini API integration
- `services/accountingRulesService.ts` - Rule management and normalization
- `services/historicalDataMatcher.ts` - Training data matching logic
- `services/ruleBasedCategorizer.ts` - Pattern-based categorization fallback
- `hooks/` - Custom hooks for state management (useJobManager, useApiKeyManager, etc.)
- `WelcomeDashboard.tsx` - Progressive onboarding and quick actions

### Data Storage Pattern
All data persists in browser localStorage with these keys (from `constants.ts`):
- `STORAGE_KEYS.CLIENTS` - Client list
- `STORAGE_KEYS.BOOKS` - Book list  
- `STORAGE_KEYS.INDUSTRIES` - Industry list
- `STORAGE_KEYS.COLUMN_MAPPINGS_PREFIX + client_book_id` - Column mappings
- `STORAGE_KEYS.TRAINING_DATA_PREFIX + client_book_id` - Training transactions
- `STORAGE_KEYS.CUSTOM_*` - User-uploaded rule overrides
- `STORAGE_KEYS.COLUMN_MAPPING_TEMPLATES` - Saved mapping templates
- `STORAGE_KEYS.CLIENT_CONFIG_TEMPLATES` - Saved client configuration templates

## Development Workflow

### Essential Commands
```bash
npm run dev      # Start Vite dev server
npm run build    # Production build to dist/
npm run preview  # Preview production build
npm run test     # Run Vitest tests
npm run lint     # Run ESLint
npm run type-check # TypeScript type checking
```

### File Processing Flow
1. **Upload** → `FileUpload.tsx` uses xlsx library to convert Excel to CSV-like format
2. **Column Mapping** → `ColumnMappingModal.tsx` maps file headers to app fields (supports templates)
3. **Parsing** → `transactionService.ts` validates and parses based on mapping with real-time validation
4. **Categorization** → Hierarchical pipeline in `categorizeBatchTransactions()`
5. **Review** → `TransactionTable.tsx` shows results with override capability, bulk operations, and advanced filtering

### Training vs Processing Data
**Training Mode** (`isTrainingData: true`):
- Requires: Date, Description, Chart of Account, Vendor/Customer Name, Transaction Type
- Stores in localStorage for future matching
- Uses `TARGET_TRAINING_FIELDS` from constants.ts

**Processing Mode** (`isTrainingData: false`):  
- Requires: Date, Description, Amount
- Runs full categorization pipeline
- Uses `TARGET_STANDARD_PROCESSING_FIELDS` from constants.ts

## Critical Patterns & Conventions

### State Management Architecture
- **Single Source of Truth**: All state managed in `App.tsx` with useState hooks
- **Custom Hooks**: Encapsulate complex state logic in `hooks/` directory:
  - `useJobManager` - Processing job lifecycle management
  - `useApiKeyManager` - API key validation and storage
  - `useEntityManager` - CRUD operations for clients/books/industries
  - `useFileProcessor` - File upload and processing coordination
  - `useSettingsManager` - Settings modal and rule customization
- **Props Drilling**: State passed down through component hierarchy
- **No External State Libraries**: Pure React state management

### Amount Handling
- Single `Amount` column: Negative = debit/expense, Positive = credit/income
- Separate `DebitAmount`/`CreditAmount`: Always positive values, logic determines sign
- Parsing in `transactionService.ts` standardizes to single numeric amount

### Rule System Architecture
Three JSON rule files in `rules/` directory:
- `accounting_rules_dataset.json` - Industry-specific categorization rules
- `coa_validation_dataset.json` - Chart of Accounts validation logic  
- `coa_alternateNames_dataset.json` - Category name normalization and hierarchy

Users can upload custom versions stored in localStorage, overriding defaults.

### Template System
- **Column Mapping Templates**: Save/load reusable column mappings via `TemplateManager.tsx`
- **Client Config Templates**: Save/load client, book, and industry combinations
- Stored in localStorage under `STORAGE_KEYS.COLUMN_MAPPING_TEMPLATES` and `STORAGE_KEYS.CLIENT_CONFIG_TEMPLATES`

### Bulk Operations & Advanced Filtering
- **Bulk Overrides**: Multi-select transactions in `TransactionTable.tsx` for batch categorization
- **Advanced Search**: Filter by date range, amount, category, confidence score, vendor
- **Real-time Filtering**: Immediate UI updates without server round-trips

### Error Handling
- Validation errors collected in `DataValidationReport` with row-level details
- UI shows warnings but allows proceeding with valid rows
- Global errors displayed via `globalError` state in App.tsx
- Real-time validation during column mapping and data processing

### Onboarding & UX Patterns
- **WelcomeDashboard**: Progressive onboarding with quick action buttons
- **Privacy Policy Modal**: First-time user agreement requirement
- **Contextual Help**: Tooltips and guided workflows
- **Job Progress Tracking**: Real-time progress bars and status updates

## Integration Points

### Google Gemini API
- Initialize with user API key in `geminiService.ts`
- Prompt includes transaction description + optional industry context
- Returns: specific CoA, confidence score, transaction type, vendor/customer, alternative suggestion

### Excel Processing
- `xlsx` library converts Excel to in-memory CSV representation
- Only processes first sheet
- Dates normalized to YYYY-MM-DD format

### Export/Import System
- Training data + custom rules exported as single JSON via `dataService.exportAllTrainingData()`
- Import merges with existing data (no overwrites)
- Template system for configuration portability

## Common Gotchas

### File Parsing
- Header row offset handled by skipping rows in `FileUpload.tsx`
- CSV parsing uses regex to handle quoted fields
- Empty/missing values become `undefined` in `RawTransactionData`

### Category Normalization  
- Always use `accountingRulesService.normalizeCategoryFromString()` for user inputs
- Maps aliases to canonical CoA names and determines broad category (Assets/Income/etc.)

### Training Data Matching
- Similarity scoring in `historicalDataMatcher.ts` uses basic text comparison
- Prioritizes exact matches, then fuzzy matching on description + vendor

### UI State Coordination
- Job status drives UI flow (see `JobStatus` enum)
- `isProcessingBlocked` prevents concurrent operations
- Progress tracking via `processedRows` / `totalRows`

### Template & Configuration Management
- Templates stored as JSON objects with metadata (name, description, created date)
- Always validate template compatibility when loading (field mappings may change)
- Custom rules override defaults but maintain backward compatibility

## Testing & Validation
- **Vitest** for unit testing with JSDOM environment
- Basic test setup in `src/test/` directory
- No automated tests currently implemented beyond basic configuration
- Validate manually by:
  1. Processing sample CSV with known categories
  2. Checking localStorage persistence
  3. Verifying Excel export functionality
  4. Testing Gemini API integration with valid key

## Deployment
- Static site hosted on custom domain (CNAME present)
- No server-side components
- All dependencies loaded via CDN in `index.html`
- Vite build outputs to `dist/` directory