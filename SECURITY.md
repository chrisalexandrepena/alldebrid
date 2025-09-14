# Security Policy

## Supported Versions

We actively support the following versions of the AllDebrid SDK + CLI:

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | ✅ Yes             |
| 1.x.x   | ❌ No              |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### 🔒 Private Disclosure

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security issues privately by:

1. **Email**: Send details to the repository owner
2. **GitHub Security Advisories**: Use GitHub's private vulnerability reporting feature
3. **Direct Contact**: Reach out through the contact information in the package.json

### 📝 What to Include

When reporting a security vulnerability, please include:

- **Description**: Clear description of the vulnerability
- **Impact**: Potential impact and affected components
- **Steps**: Step-by-step instructions to reproduce the issue
- **Environment**: 
  - Node.js version
  - Package version
  - Operating system
  - Installation method (global/local)
- **Proof of Concept**: If applicable, provide a minimal reproduction case
- **Suggested Fix**: If you have ideas for a fix, please share them

### 🕒 Response Timeline

We aim to respond to security reports within:

- **Initial Response**: 48 hours
- **Assessment**: 7 days
- **Fix Timeline**: 30 days for critical issues, 90 days for others
- **Public Disclosure**: After fix is released and users have time to update

### 🏆 Recognition

We appreciate responsible disclosure. Security researchers who report valid vulnerabilities will be:

- Acknowledged in the security advisory (unless you prefer to remain anonymous)
- Listed in our security hall of fame
- Credited in release notes

## Security Best Practices

### For Users

When using the AllDebrid SDK + CLI:

1. **Keep Updated**: Always use the latest version
2. **Secure API Keys**: 
   - Store API keys securely (config files with restricted permissions)
   - Never commit API keys to version control
   - Use environment variables in production
3. **Network Security**: Use HTTPS endpoints (default behavior)
4. **Input Validation**: Validate user inputs before passing to SDK methods
5. **Error Handling**: Don't expose sensitive information in error messages

### Configuration Security

- **File Permissions**: Set config files to `600` (owner read/write only)
- **Environment Variables**: Use secure methods to inject API keys in CI/CD
- **Logging**: Be careful not to log sensitive information

### Example Secure Usage

```typescript
// ✅ Good: Secure API key handling
const client = new Alldebrid({
  apiKey: process.env.ALLDEBRID_API_KEY, // From environment
  logLevel: 'error' // Don't log sensitive data
});

// ❌ Bad: Hardcoded API key
const client = new Alldebrid({
  apiKey: 'your-actual-api-key-here' // Never do this!
});
```

```bash
# ✅ Good: Secure config file
chmod 600 ~/.config/alldebrid/config.yml

# ✅ Good: Environment variable
export ALLDEBRID_API_KEY="your-key"
alldebrid user info
```

## Known Security Considerations

### API Key Security
- API keys are transmitted to AllDebrid's servers over HTTPS
- Keys are never logged by default (set `logLevel: 'error'` or higher)
- Configuration files should have restrictive permissions

### Network Requests
- All requests use HTTPS by default
- Certificate validation is enabled
- Request/response data is handled securely

### CLI Security
- Configuration files are loaded with appropriate security checks
- No shell injection vulnerabilities in command parsing
- User inputs are validated before processing

## Security Updates

Security updates will be:

1. **Released immediately** for critical vulnerabilities
2. **Clearly marked** in release notes and changelogs
3. **Announced** through GitHub security advisories
4. **Backported** to supported versions when possible

## Dependencies

We regularly audit and update dependencies:

- **Automated**: Dependabot updates for security patches
- **Manual Review**: Major version updates are reviewed manually
- **Security Scanning**: GitHub security advisories and `npm audit`

## Contact

For security-related questions or concerns:

- **Non-sensitive questions**: Create a public GitHub issue
- **Security vulnerabilities**: Use private reporting methods described above
- **General security guidance**: Check this document first, then ask publicly

---

Thank you for helping keep the AllDebrid SDK + CLI secure! 🔒