# Enterprise Car Configuration Platform (ECP)

An industrial-grade car configuration system built for a student-level project. This platform simulates how real-world automotive companies like Tesla or BMW handle complex build rules and pricing.

## Features
- **Dynamic Rule Engine**: Prevents invalid configurations (e.g., Electric cars cannot have manual transmissions).
- **Real-time Pricing**: Automatically calculates the total cost as options are selected.
- **Enterprise UI**: A sleek, dark-themed wizard with smooth transitions using Framer Motion.
- **Quote vs Order**: Simulates the business flow of saving a configuration for comparison versus placing a formal order.
- **Validation Alerts**: Shows real-time warnings when a selection violates a business rule.

## Tech Stack
- **Frontend**: React (Vite), Axios, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express.
- **Database**: JSON-based persistent storage (simulating a NoSQL/SQL environment).

## Architecture & Logic Flow
1. **Frontend Request**: The React app fetches all available options from the backend.
2. **User Interaction**: As the user selects parts, the frontend sends the current configuration to the `/api/validate` and `/api/price` endpoints.
3. **Rule Engine**: The backend iterates through the `rules` array in the database. If a condition matches (e.g., `modelId: m1`), it checks if the selected transmission/engine is restricted.
4. **Price Engine**: The backend sums the base price of the model and the price of each selected component.
5. **Persistence**: Saved configurations are stored in the `savedConfigurations` array in `database.json`.

## How to Run
1. **Backend**:
   ```bash
   cd server
   npm install
   node server.js
   ```
2. **Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Key Learning Points for Viva
- **Component-Based Architecture**: How React manages complex UI states.
- **RESTful API Design**: Communication between client and server.
- **State Management**: Handling selections across multiple steps.
- **Business Rule Segregation**: Keeping logic on the backend so rules can be updated without redeploying the frontend.
