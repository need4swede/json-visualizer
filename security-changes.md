# JSON Visualizer Security Enhancement Plan

## Current Security Analysis

### Existing Security Features ✅
1. **Client-Side Only Processing**: JSON data is processed entirely in the browser - no automatic server transmission during parsing/visualization
2. **Temporary Server Storage**: When users create shareable links, data is stored with 9-digit random IDs (not sequential/guessable)
3. **In-Memory Storage**: Currently uses `MemStorage` class - data only exists in server RAM, not persisted to disk
4. **No Authentication Required**: No user accounts means no risk of data being tied to identifiable users
5. **Local Fallback**: If server storage fails, data falls back to browser localStorage (stays on user's device)

### Current Security Gaps ⚠️
1. **Server Storage Without Encryption**: When users create shareable URLs, JSON data is stored in plain text on your server
2. **No Data Expiration**: Stored JSON data persists indefinitely in server memory
3. **No Access Controls**: Anyone with a 9-digit ID can access the stored JSON
4. **No HTTPS Enforcement**: No explicit HTTPS-only policies in the code
5. **No Content Sanitization**: Raw JSON is stored and served without sanitization
6. **Memory Persistence**: Server restart loses all data, but during runtime, sensitive data remains in memory

### Risk Assessment
- **Low Risk**: Basic JSON parsing and visualization (data never leaves user's browser)
- **Medium Risk**: Creating shareable links (data gets stored on your server)
- **High Risk**: If someone accidentally shares a URL containing sensitive data

## Security Enhancement Implementation Plan

### Step 1: Automatic Data Expiration (24-48 hours) ✅ COMPLETED

**Objective**: Automatically remove stored JSON data after a specified time period to minimize exposure window.

**Implementation Details:**
- ✅ Added `expiresAt` field to storage schema
- ✅ Background cleanup process runs every hour to remove expired data
- ✅ Default 48-hour expiration with user selection (24h, 48h, 7 days)
- ✅ Graceful handling of expired links with fallback to localStorage
- ✅ Fixed anchor link highlighting functionality

**Files Modified:**
- ✅ `shared/schema.ts` - Added expiration field to jsonData table
- ✅ `server/storage.ts` - Added expiration logic and cleanup methods
- ✅ `server/routes.ts` - Added expiration checking on data retrieval
- ✅ `server/index.ts` - Added background cleanup process (runs every hour)
- ✅ `client/src/pages/json-parser.tsx` - Added expiration selection UI
- ✅ `client/src/lib/json-utils.ts` - Updated storage functions with expiration
- ✅ `client/src/index.css` - Fixed highlighting CSS for better UX

**Benefits:**
- ✅ Reduces data exposure window significantly
- ✅ Automatic cleanup prevents indefinite storage of sensitive data
- ✅ User control over data lifetime based on sensitivity
- ✅ Server logs cleanup activity for monitoring

### Step 2: Client-Side Encryption for Shareable URLs 🔐 PENDING APPROVAL

**Objective**: Encrypt JSON data client-side before sending to server, keeping decryption keys in URL fragments.

**Implementation Details:**
- Add AES-256-GCM encryption using Web Crypto API
- Generate random encryption keys client-side
- Store encrypted data on server, keep decryption key in URL fragment (#key)
- URL format: `/{id}#key={base64EncodedKey}`

**Files to Modify:**
- `client/src/lib/json-utils.ts` - Add encryption/decryption functions
- `client/src/pages/fullscreen-json.tsx` - Handle key extraction from URL
- `client/src/pages/json-parser.tsx` - Update sharing logic

**Benefits:**
- Server never sees unencrypted sensitive data
- Decryption keys never transmitted to server
- Zero-knowledge architecture for shared data

### Step 3: HTTPS Enforcement and Security Headers 🛡️ PENDING APPROVAL

**Objective**: Implement comprehensive security headers and HTTPS enforcement.

**Implementation Details:**
- Helmet.js for security headers
- HTTPS redirect middleware
- CSP (Content Security Policy) headers
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options, X-Content-Type-Options

**Files to Modify:**
- `server/index.ts` - Add security middleware
- `package.json` - Add helmet dependency
- New file: `server/security.ts` - Security configuration

**Benefits:**
- Prevents man-in-the-middle attacks
- Protects against XSS and clickjacking
- Enforces secure communication

### Step 4: Data Sanitization and Content Filtering 🧹 PENDING APPROVAL

**Objective**: Sanitize and validate JSON content to prevent malicious data storage and XSS attacks.

**Implementation Details:**
- Server-side JSON validation and sanitization
- Remove potentially dangerous content (scripts, URLs, etc.)
- Size limits (e.g., 10MB max)
- Content-type validation
- XSS prevention in rendered output

**Files to Modify:**
- `server/routes.ts` - Add sanitization middleware
- New file: `server/sanitizer.ts` - Sanitization logic
- `client/src/components/json-renderer.tsx` - Safe rendering
- `shared/schema.ts` - Add validation rules

**Benefits:**
- Prevents storage of malicious content
- Protects against XSS attacks
- Enforces data quality standards

### Step 5: Optional Password Protection for Shared Links 🔒 PENDING APPROVAL

**Objective**: Allow users to optionally password-protect their shared JSON data.

**Implementation Details:**
- Optional password field in sharing dialog
- PBKDF2 key derivation for password-based encryption
- Dual encryption: base encryption + optional password layer
- Password prompt on protected link access

**Files to Modify:**
- Client sharing UI - Add password option
- `client/src/lib/json-utils.ts` - Password-based encryption
- `client/src/pages/fullscreen-json.tsx` - Password prompt dialog
- `shared/schema.ts` - Add password protection flag

**Benefits:**
- Additional layer of protection for sensitive data
- User control over access restrictions
- Defense against accidental sharing

## Implementation Timeline

1. ✅ **Step 1: Data Expiration** - Foundational security improvement
2. ⏳ **Step 2: Client-Side Encryption** - Core security feature (awaiting approval)
3. ⏳ **Step 3: HTTPS/Security Headers** - Infrastructure security (awaiting approval)
4. ⏳ **Step 4: Data Sanitization** - Content security (awaiting approval)
5. ⏳ **Step 5: Password Protection** - Advanced feature (awaiting approval)

## User Experience Considerations

- **Sharing Dialog**: New modal with encryption options, expiration settings, and optional password
- **Link Access**: Automatic decryption for standard links, password prompt for protected ones
- **Error Handling**: Clear messages for expired/invalid/corrupted links
- **Performance**: Encryption/decryption happens client-side, minimal server impact

## Backward Compatibility

- Existing unencrypted links will continue to work during transition period
- Gradual migration strategy for existing stored data
- Fallback mechanisms for older browsers
- Clear deprecation notices for legacy features

## Testing Strategy

- Unit tests for encryption/decryption functions
- Integration tests for expiration cleanup
- Security testing for header configurations
- User acceptance testing for new UI features
- Performance testing for encryption overhead

---

*This document serves as the roadmap for enhancing the security posture of the JSON Visualizer application. Each step builds upon the previous ones to create a comprehensive security framework while maintaining usability and performance.*
