import React from 'react';
import { createRoot } from 'react-dom/client';
import Calibration from './Calibration';
import { ClerkProvider } from '@clerk/chrome-extension';

const root = createRoot(document.getElementById('root'));
root.render(
<ClerkProvider publishableKey={process.env.CLERK_PUBLISHABLE_KEY}>
    <Calibration />
</ClerkProvider>
);