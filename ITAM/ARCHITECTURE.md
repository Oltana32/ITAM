# Architecture Overview

## Project Structure

Asset-Buddy is a modern full-stack web application with clear separation between frontend and backend:

```
asset-buddy/
├── django-backend/           # Django REST API
│   ├── apps/                 # Core application modules
│   │   ├── users/           # User management
│   │   ├── assets/          # Asset management
│   │   ├── assignments/     # Assignment tracking
│   │   ├── licenses/        # License management
│   │   ├── locations/       # Location/facility management
│   │   ├── maintenance/     # Maintenance tracking
│   │   ├── manufacturers/   # Manufacturer data
│   │   ├── notifications/   # Notification system
│   │   └── reports/         # Report generation
│   ├── config/              # Django configuration
│   ├── manage.py            # Django CLI
│   └── requirements.txt      # Dependencies
├── frontend/                 # React web application
│   ├── src/                 # Source code
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utilities
│   │   └── styles/         # Global styles
│   ├── package.json         # Dependencies
│   └── vite.config.ts       # Vite configuration
├── .github/                 # GitHub configuration
│   └── workflows/          # CI/CD pipelines
├── README.md               # Project documentation
├── CONTRIBUTING.md         # Contribution guide
├── TESTING.md             # Testing guide
└── Makefile               # Development commands
```

## Technology Stack

### Backend

| Technology | Purpose | Version |
|---|---|---|
| **Django** | Web framework | 5.0+ |
| **Django REST Framework** | API framework | 3.15+ |
| **PostgreSQL** | Database | 14+ |
| **JWT** | Authentication | simplejwt 5.3+ |
| **Redis** | Caching | 5.0+ (optional) |
| **Celery** | Task queue | (optional) |

### Frontend

| Technology | Purpose | Version |
|---|---|---|
| **React** | UI framework | 18.3+ |
| **TypeScript** | Type safety | 5.8+ |
| **Vite** | Build tool | 5.4+ |
| **Tailwind CSS** | Styling | 3.4+ |
| **shadcn/ui** | Component library | Latest |
| **React Query** | Data fetching | 5.8+ |
| **React Hook Form** | Form handling | 7.6+ |

## Architecture Patterns

### Backend Architecture

#### Django App Structure

Each Django app follows this pattern:

```
app_name/
├── migrations/        # Database migrations
├── __init__.py
├── admin.py          # Django admin configuration
├── apps.py           # App configuration
├── models.py         # Database models
├── views.py          # API views
├── serializers.py    # DRF serializers
├── permissions.py    # Custom permissions
├── filters.py        # Query filters
├── urls.py           # URL routing
├── test_*.py         # Tests
└── services.py       # Business logic (optional)
```

#### API Layer

- **Models**: Database schema definitions
- **Serializers**: Data serialization/validation (DRF)
- **Views**: API endpoints (ViewSets)
- **Permissions**: Access control
- **Filters**: Query filtering and search
- **Services**: Reusable business logic

#### Authentication & Authorization

- **Authentication**: JWT tokens (djangorestframework-simplejwt)
- **Authorization**: Custom permission classes
- **Roles**: Based on Django user groups

### Frontend Architecture

#### Component Structure

```
src/
├── components/
│   ├── common/           # Shared components
│   ├── layouts/          # Layout components
│   ├── ui/              # shadcn/ui wrapper components
│   └── forms/           # Form components
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── services/            # API services
├── types/               # TypeScript types
└── styles/              # Global styles
```

#### State Management

- **React Query**: Server state management (data fetching, caching)
- **React Context**: Global UI state
- **React Hooks**: Local component state

#### API Integration

- **Axios/Fetch**: HTTP client
- **React Query**: Automatic caching and synchronization
- **Type Safety**: TypeScript types for API responses

## Data Flow

### Request/Response Flow

```
Frontend
  ↓
[HTTP Request] → Backend
  ↓
[URL Router] → [Middleware] → [View/ViewSet]
  ↓
[Serializer] → [Model/Database]
  ↓
[Serializer] → [Response]
  ↓
[HTTP Response] ← Frontend
```

### Authentication Flow

```
User Login
  ↓
[POST /api/token/] → Backend
  ↓
[Generate JWT Tokens] (access + refresh)
  ↓
[Store in localStorage] → Frontend
  ↓
[Include in Headers] → Subsequent Requests
```

## Security Considerations

### Backend Security

1. **Authentication**
   - JWT tokens with expiration
   - Refresh token rotation

2. **Authorization**
   - User-based permissions
   - Group-based roles
   - Object-level permissions

3. **Data Protection**
   - CSRF protection
   - CORS restrictions
   - Secure headers (HTTPS, HSTS)

4. **Input Validation**
   - DRF serializer validation
   - Type checking with mypy
   - SQL injection protection (ORM)

5. **Secrets Management**
   - Environment variables (.env)
   - No hardcoded credentials
   - Secret key rotation

### Frontend Security

1. **Data Validation**
   - TypeScript type checking
   - Form validation (React Hook Form)
   - Zod schema validation

2. **XSS Prevention**
   - React auto-escaping
   - No innerHTML usage

3. **CSRF Protection**
   - CSRF tokens in requests

4. **Secure Storage**
   - Tokens in localStorage (consider httpOnly)
   - No sensitive data in localStorage

## Performance Optimization

### Backend

1. **Database**
   - Query optimization (select_related, prefetch_related)
   - Indexing on frequently queried fields
   - Connection pooling

2. **Caching**
   - Redis for session and data caching
   - API response caching
   - Query result caching

3. **Pagination**
   - Limit default page size
   - Cursor-based pagination for large datasets

4. **Async Tasks**
   - Celery for long-running tasks
   - Background email sending

### Frontend

1. **Code Splitting**
   - Route-based code splitting
   - Lazy loading components

2. **Bundling**
   - Vite tree-shaking
   - Minification

3. **Caching**
   - HTTP cache headers
   - Service workers

4. **State Management**
   - React Query caching
   - Memoization (React.memo, useMemo)

## Deployment Architecture

### Development

```
localhost:5173 (Frontend)
	 ↓
localhost:8000 (Backend API)
	 ↓
sqlite3 (Local Database)
```

### Production

```
CDN/Nginx (Frontend - Static)
	 ↓
API Gateway
	 ↓
Kubernetes/Docker (Backend Services)
	 ↓
PostgreSQL (RDS)
Redis (Cache)
S3 (File Storage)
```

## Error Handling

### Backend

- Structured error responses
- HTTP status codes
- Detailed error messages (development only)
- Error logging with context

### Frontend

- Global error boundary
- User-friendly error messages
- Error logging/tracking
- Retry mechanisms

## Testing Strategy

### Backend

- **Unit Tests**: 60%+ coverage
- **Integration Tests**: Critical paths
- **API Tests**: All endpoints

### Frontend

- **Unit Tests**: 50%+ coverage
- **Component Tests**: Visual components
- **E2E Tests**: User workflows

## Monitoring & Logging

### Logging

- **Level**: DEBUG, INFO, WARNING, ERROR
- **Format**: JSON for structured logs
- **Destinations**: Console, File, ELK Stack

### Monitoring

- Application health checks
- Error tracking (Sentry)
- Performance monitoring (New Relic/DataDog)
- Log aggregation (ELK)

## Scaling Considerations

1. **Horizontal Scaling**
   - Stateless API servers
   - Load balancing
   - Database replication

2. **Vertical Scaling**
   - Optimize queries
   - Increase cache layer
   - Database indexing

3. **Microservices** (future)
   - Split large apps into services
   - API gateway
   - Message queue (RabbitMQ, Kafka)

---

For implementation details, see:
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [DRF Documentation](https://www.django-rest-framework.org/)
