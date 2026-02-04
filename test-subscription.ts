/**
 * Quick test script to verify SDK subscription API works with deployed backend
 *
 * Usage:
 *   npx ts-node test-subscription.ts
 *
 * Or after building:
 *   node -e "import('./dist/index.mjs').then(m => { ... })"
 */

import { MQL } from './src/index';

// Replace with your actual token from the browser (localStorage -> sb-xxx-auth-token)
const SUPABASE_TOKEN = process.env.MQL_TOKEN || 'YOUR_SUPABASE_JWT_TOKEN';
const API_URL = process.env.MQL_API_URL || 'https://api.metriqual.com';

async function testSubscriptionAPI() {
  console.log('🧪 Testing MQL SDK Subscription API\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Token: ${SUPABASE_TOKEN.substring(0, 20)}...\n`);

  const mql = new MQL({
    baseUrl: API_URL,
    token: SUPABASE_TOKEN,
  });

  try {
    // Test 1: Get subscription status
    console.log('1️⃣ Testing getStatus()...');
    const status = await mql.subscription.getStatus();
    console.log('   ✅ Subscription Status:');
    console.log(`      Tier: ${status.tier}`);
    console.log(`      Trial Active: ${status.trial.isActive}`);
    console.log(`      Trial Days Remaining: ${status.trial.daysRemaining}`);
    console.log(`      Has Used Trial: ${status.trial.hasUsedTrial}`);
    console.log(`      Proxy Keys: ${status.usage.proxyKeys}/${status.limits.maxProxyKeys === -1 ? '∞' : status.limits.maxProxyKeys}`);
    console.log('');

    // Test 2: Get trial status
    console.log('2️⃣ Testing getTrialStatus()...');
    const trial = await mql.subscription.getTrialStatus();
    console.log('   ✅ Trial Status:');
    console.log(`      Active: ${trial.isActive}`);
    console.log(`      Days Remaining: ${trial.daysRemaining}`);
    console.log(`      Started At: ${trial.startedAt || 'N/A'}`);
    console.log(`      Ends At: ${trial.endsAt || 'N/A'}`);
    console.log('');

    // Test 3: Check if can start trial
    console.log('3️⃣ Testing canStartTrial()...');
    const canTrial = await mql.subscription.canStartTrial();
    console.log(`   ✅ Can Start Trial: ${canTrial}`);
    console.log('');

    // Test 4: Get features
    console.log('4️⃣ Testing getFeatures()...');
    const features = await mql.subscription.getFeatures();
    console.log('   ✅ Features:');
    console.log(`      Teams: ${features.teams ? '✓' : '✗'}`);
    console.log(`      Webhooks: ${features.webhooks ? '✓' : '✗'}`);
    console.log(`      SSO: ${features.sso ? '✓' : '✗'}`);
    console.log(`      Analytics: ${features.analytics ? '✓' : '✗'}`);
    console.log('');

    // Test 5: Check limits
    console.log('5️⃣ Testing getLimits()...');
    const limits = await mql.subscription.getLimits();
    console.log('   ✅ Limits:');
    console.log(`      Max Proxy Keys: ${limits.maxProxyKeys === -1 ? 'Unlimited' : limits.maxProxyKeys}`);
    console.log(`      Max Providers/Key: ${limits.maxProvidersPerKey === -1 ? 'Unlimited' : limits.maxProvidersPerKey}`);
    console.log(`      Max Filters: ${limits.maxFilters === -1 ? 'Unlimited' : limits.maxFilters}`);
    console.log('');

    // Test 6: Check remaining quota
    console.log('6️⃣ Testing getRemainingQuota()...');
    const remainingKeys = await mql.subscription.getRemainingQuota('proxyKeys');
    console.log(`   ✅ Remaining Proxy Keys: ${remainingKeys}`);
    console.log('');

    console.log('✅ All SDK subscription tests passed!\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.status === 401) {
      console.error('   → Token may be expired or invalid');
      console.error('   → Get a fresh token from your browser localStorage');
    }
    process.exit(1);
  }
}

// Run if called directly
testSubscriptionAPI();
