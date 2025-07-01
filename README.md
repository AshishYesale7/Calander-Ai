# Calendar.ai

This is a Next.js starter project for an AI-powered calendar and planning application.

## Getting Started

To get started with local development, first install the dependencies:

```bash
npm install
```

Next, create a `.env` file in the root of your project. You can see all the required variables in the "Environment Variables" section below.

Finally, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Environment Variables

To run this project, you will need to create a `.env` file and add the following variables. The `app.json` file in this repository also serves as a reference.

```
# Google AI/Gemini API Key
GEMINI_API_KEY=

# Google OAuth for Calendar/Gmail Sync (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Razorpay for Subscriptions (Optional)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_PLAN_ID_MONTHLY=
RAZORPAY_PLAN_ID_YEARLY=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# The public URL of your deployed application
# e.g., https://your-app-name.web.app
NEXT_PUBLIC_BASE_URL=
```

## Deployment

### Firebase App Hosting

This application is pre-configured for deployment on **Firebase App Hosting**.

The `apphosting.yaml` file is already set up. To deploy your app, you will need to have the Firebase CLI installed and be logged into your Firebase account. You can then follow the [official Firebase App Hosting documentation](https://firebase.google.com/docs/app-hosting/deploy-nextjs) to get your site live.

### Heroku Deployment

You can also deploy this application to Heroku with a single click using the button below. Heroku will automatically detect the `app.json` file and guide you through setting up the required environment variables.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/AshishYesale7/FutureSight/tree/master)
