# Google reCAPTCHA Setup Guide

This application uses Google reCAPTCHA v2 for bot protection on the registration form.

## Setup Instructions

### 1. Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" to add a new site
3. Fill in the form:
   - **Label**: Your application name (e.g., "Recruitment Platform")
   - **reCAPTCHA type**: Select "reCAPTCHA v2" → "I'm not a robot" Checkbox
   - **Domains**: Add your domains:
     - `localhost` (for development)
     - Your production domain (e.g., `yourdomain.com`)
4. Accept the reCAPTCHA Terms of Service
5. Click "Submit"

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your reCAPTCHA site key:
   ```env
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_actual_site_key_here
   ```

### 3. Server-Side Verification (Optional)

For enhanced security, you should verify the reCAPTCHA token on your server:

1. Add your secret key to `.env.local`:
   ```env
   RECAPTCHA_SECRET_KEY=your_secret_key_here
   ```

2. In your API route, verify the token:
   ```javascript
   const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
     method: 'POST',
     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
     body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
   });
   
   const data = await response.json();
   if (!data.success) {
     return res.status(400).json({ error: 'reCAPTCHA verification failed' });
   }
   ```

## Testing

- The current implementation uses Google's test keys for development
- Test keys will always pass verification but show a warning
- Replace with your actual keys for production

## Troubleshooting

- **reCAPTCHA not loading**: Check if your domain is added to the allowed domains list
- **Verification failing**: Ensure you're using the correct site key (public) and secret key (private)
- **Dark theme issues**: The reCAPTCHA is configured with `theme="dark"` to match the application design