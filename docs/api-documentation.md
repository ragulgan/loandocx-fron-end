
# LoanDocX API Documentation (v1.0)

## Authentication
- `POST /api/auth/login`: Authenticate user and return JWT.
- `POST /api/auth/refresh`: Get new access token using refresh token.

## Loans & Workflow
- `GET /api/loans`: List loans (filtered by role permissions).
- `POST /api/loans`: Create new application (Agent only).
- `GET /api/loans/:id`: Get full transaction details and document list.
- `PATCH /api/loans/:id/status`: Update workflow state (Transition engine).
- `POST /api/loans/:id/assign`: Assign job to specific Legal/Civil user (Admin only).

## User Management
- `GET /api/users`: List all platform users (Admin only).
- `POST /api/users`: Create new user.
- `PATCH /api/users/:id/status`: Activate/Deactivate user.

## Earnings & Payments
- `GET /api/earnings`: Get dashboard stats and wallet balance for current user.
- `GET /api/payments`: List payout history.
- `POST /api/payments/request`: Request withdrawal to UPI.

## Documents
- `POST /api/docs/upload`: Upload multi-part files for a transaction.
- `GET /api/docs/:id`: Securely download/stream document.
