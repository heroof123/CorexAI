# Security Policy

## Supported Versions

Currently supported versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

1. **Do NOT** open a public issue
2. Email the details to: [your-email@example.com] (or create a private security advisory on GitHub)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- We will acknowledge receipt within 48 hours
- We will provide a detailed response within 7 days
- We will work on a fix and keep you updated on progress

## Security Best Practices

When using Corex IDE:

- Keep your installation up to date
- Only install trusted extensions/plugins
- Review OAuth permissions before granting access
- Use strong passwords for any integrated services
- Keep your local AI models from trusted sources only

## Known Security Considerations

- OAuth tokens are stored in OS keychain (secure)
- All AI processing is local (no data sent to external servers)
- File system access is sandboxed by Tauri
- No telemetry or tracking

## Disclosure Policy

- Security issues will be disclosed after a fix is available
- Credit will be given to reporters (unless they prefer to remain anonymous)
- CVE IDs will be requested for significant vulnerabilities
