// global chrome 

export const CLERK_CONFIG = {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  
  // chrome extension specific config
  afterSignInUrl: '/src/pages/privacy/index.html',
  afterSignUpUrl: '/src/pages/privacy/index.html',
}

// helper function => init Clerk 
export async function initializeClerk() {
  try {
    // await the key from clerk setup
    const { Clerk } = await import('@clerk/chrome-extension')
    
    const clerk = new Clerk(CLERK_CONFIG.publishableKey)
    await clerk.load()
    
    return clerk
  } catch (error) {
    console.error('Failed to initialize Clerk via key:', error)
    throw error
  }
}