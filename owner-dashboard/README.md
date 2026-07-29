# GreenLife Owner Dashboard deployment

This folder is a standalone Netlify publish directory for the owner dashboard.

In a separate Netlify project, select the `owner-dashboard-v2` branch, leave the build command blank, and set the publish directory to `owner-dashboard`.

The dashboard will open directly at that new site's root URL. It uses the same Firebase project and owner sign-in as the driver application.

When `admin.html` changes, copy the approved dashboard changes into `owner-dashboard/index.html` before publishing this standalone site.
