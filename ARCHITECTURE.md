# Architecture Overview

## System Architecture

The LyKos Wallet Backend is built as a microservices architecture with the following components:

```
┌─────────────────┐
│   API Gateway   │  Port 3000 - Main entry point
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┬──────────┬──────────┐
    │         │          │          │          │          │
┌───▼───┐ ┌──▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│  ID   │ │  G0  │ │Paymstr│ │ Alias │ │Recovery│
│Service│ │Service│ │Service│ │Service│ │Service│
└───┬───┘ └───┬──┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
    │         │          │          │          │          │
    └─────────┴──────────┴──────────┴──────────┴──────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
    ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
    │Postgres│  │ Redis │  │ Vault │
    └────────┘  └───────┘  └───────┘
```

## Services

### API Gateway (Port 3000)
- Main entry point for all API requests
- Routes requests to appropriate microservices
- Handles CORS, rate limiting, security headers
- Health check endpoint

### ID Service (Port 3001)
**Responsibilities:**
- User authentication (WebAuthn/Passkeys)
- User management
- Wallet management
- Session management
- JWT token generation

**Key Features:**
- WebAuthn registration and authentication
- Smart account creation
- Device management
- Rewards tracking

### G0 Security Service (Port 3002)
**Responsibilities:**
- Transaction simulation
- Risk scoring
- Security scanning
- Threat detection

**Key Features:**
- Tenderly integration for transaction simulation
- Multi-factor risk assessment
- Real-time threat analysis
- Security warnings

### Paymaster Service (Port 3003)
**Responsibilities:**
- ERC-4337 gas sponsorship
- Transaction execution
- Swap operations
- Bridge operations
- User operation building

**Key Features:**
- Bundler integration (Stackup, Alchemy)
- Paymaster contract interaction
- Gas sponsorship for new users
- Multi-chain support

### Alias Service (Port 3004)
**Responsibilities:**
- Email/phone to address resolution
- Contact management
- Alias verification

**Key Features:**
- Privacy-preserving identifier hashing
- Multi-chain alias support
- Verification system

### Recovery Service (Port 3005)
**Responsibilities:**
- Guardian management
- Recovery request processing
- Threshold signature verification
- Account recovery execution

**Key Features:**
- Social recovery with guardians
- Threshold-based approval
- On-chain recovery execution

## Data Flow

### Authentication Flow
1. User initiates WebAuthn registration
2. ID Service generates challenge
3. Browser creates credential
4. ID Service verifies credential
5. Smart account created
6. JWT token issued

### Transaction Flow
1. User submits transaction
2. Paymaster Service builds UserOperation
3. G0 Service simulates transaction
4. Risk assessment performed
5. If approved, Paymaster sponsors gas (if eligible)
6. UserOperation submitted to Bundler
7. Bundler submits to EntryPoint
8. Transaction executed on-chain

### Recovery Flow
1. User initiates recovery request
2. Recovery Service creates request
3. Guardians notified
4. Guardians approve with signatures
5. When threshold reached, recovery executed
6. New account ownership transferred

## Database Schema

### Core Models
- **User**: Base user account
- **Account**: Smart accounts and EOAs
- **Device**: WebAuthn devices
- **Session**: Active sessions
- **Transaction**: Transaction history
- **TransactionSimulation**: Simulation results
- **Alias**: Email/phone aliases
- **Guardian**: Recovery guardians
- **RecoveryRequest**: Recovery requests

## Security

### Authentication
- WebAuthn/Passkeys (passwordless)
- JWT tokens for session management
- Device binding

### Transaction Security
- Pre-execution simulation
- Risk scoring
- Multi-factor analysis
- Threat detection

### Data Privacy
- Identifier hashing (email/phone)
- Salt + pepper for aliases
- Secure secret storage (Vault)

## ERC-4337 Integration

### Components
1. **EntryPoint**: Core contract for user operations
2. **Smart Account**: User's smart contract wallet
3. **Bundler**: Aggregates and submits user operations
4. **Paymaster**: Sponsors gas for eligible users

### User Operation Flow
1. Build UserOperation with call data
2. Sign with WebAuthn credential
3. Request paymaster sponsorship
4. Submit to bundler
5. Bundler validates and submits to EntryPoint
6. EntryPoint executes transaction

## Technology Choices

### Fastify
- High performance
- Low overhead
- Plugin ecosystem
- TypeScript support

### Prisma
- Type-safe database access
- Migration system
- Excellent DX

### viem
- Modern Ethereum library
- TypeScript-first
- ERC-4337 support

### Redis
- Session storage
- Caching
- Rate limiting

### PostgreSQL
- Relational data
- ACID compliance
- JSON support

## Scalability

### Horizontal Scaling
- Stateless services
- Load balancer ready
- Database connection pooling

### Caching Strategy
- Redis for sessions
- Cache simulation results
- Rate limiting

### Performance
- Fastify for speed
- Connection pooling
- Efficient queries

## Monitoring & Observability

### Logging
- Structured logging with Pino
- Request/response logging
- Error tracking

### Health Checks
- Service health endpoints
- Database connectivity
- Redis connectivity

## Deployment

### Development
- Docker Compose for infrastructure
- Hot reload with tsx
- Local development setup

### Production
- Containerized services
- Environment-based configuration
- Secrets management (Vault)
- Monitoring and alerting
