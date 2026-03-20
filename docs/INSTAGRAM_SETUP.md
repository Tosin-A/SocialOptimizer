# Instagram OAuth Setup

To enable users to connect their Instagram accounts, you need a Meta (Facebook) Developer app configured for Instagram.

## 1. Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Sign in with your Facebook account
3. Click **My Apps** → **Create App** → **Other** → **Business** (or use an existing app)
4. Name your app (e.g. "SocialOptimizer") and create it

## 2. Add Instagram to Your App

1. In the app dashboard, go to **App Settings** → **Basic**
2. Note your **App ID** and **App Secret** — these become `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` in `.env.local`

## 3. Add Instagram Product

1. In the left sidebar, click **Add Products**
2. Find **Instagram** and click **Set Up**
3. Choose **Instagram API with Instagram Login** (or **Instagram API with Facebook Login** if you prefer)
4. Complete the setup wizard

## 4. Configure OAuth Redirect URIs

1. Go to **Instagram** → **Basic Display** (or **Instagram Graph API** → **Settings**, depending on your product)
2. Add your redirect URI(s):
   - **Local:** `http://localhost:3000/api/connect/instagram/callback`
   - **Production:** `https://yourdomain.com/api/connect/instagram/callback`
3. Save changes

## 5. Environment Variables

Add to `.env.local`:

```env
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
```

## 6. App Modes & Permissions

- **Development mode:** You can test with your own Instagram account and up to 5 test users
- **Live mode:** Requires [App Review](https://developers.facebook.com/docs/app-review) for `instagram_basic` and `instagram_manage_insights` if you want any user to connect

For development, add yourself (and teammates) as **Test Users** or **Roles** → **Administrators** so you can connect without App Review.

## 7. Account Requirements

- **Instagram Creator** or **Business** accounts work with the Graph API
- Personal accounts may need to be converted to Creator in Instagram settings
- The account must be connected to a Facebook Page for some flows (Instagram API with Facebook Login)

## 8. Verify It Works

1. Restart your Next.js dev server after adding env vars
2. Go to **Dashboard** → **Connect account** (or **Settings** → Connected platforms)
3. Click **Connect Instagram**
4. Authorize the app — you should be redirected back with the account connected

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Token exchange failed` | Check `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET`; ensure redirect URI matches exactly |
| `invalid redirect_uri` | Add the exact callback URL to Meta app settings (no trailing slash) |
| `OAuthException` | Verify the Instagram product is added and configured; check App Review status for live apps |
| `connection_failed` | Check server logs; ensure the user has a Creator/Business account |
