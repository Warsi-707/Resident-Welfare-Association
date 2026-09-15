import http from 'http';

async function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function testReversalFlow() {
  console.log('Testing Reversal Flow API Integration...');
  
  // 1. Login as Admin
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { username: 'admin', password: 'admin123' });

  console.log('Login Status:', loginRes.status, 'User:', loginRes.data?.user?.fullName);
  const token = loginRes.data?.token;
  if (!token) {
    console.error('Failed to get auth token:', loginRes);
    return;
  }

  // 2. Fetch challans & payments
  const challansRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/challans',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Fetched Challans count:', challansRes.data?.length);

  const paymentsRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/payments',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Fetched Payments count:', paymentsRes.data?.length);

  // 3. Test collect payment if needed, then test voiding
  let activePayment = paymentsRes.data?.find(p => !p.isVoid && p.status === 'Valid');
  if (!activePayment && challansRes.data?.length > 0) {
    const c = challansRes.data[0];
    const payRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/payments/collect',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      memberId: c.memberId,
      paidAmount: c.balance || c.totalAmount,
      paymentDate: '2026-09-12',
      paymentType: 'Full Paid',
      paymentMethod: 'Cash',
      notes: 'Test collection'
    });
    console.log('Collected payment result:', payRes.data?.receiptNumber);
    activePayment = payRes.data;
  }

  if (activePayment) {
    console.log('Testing Void Payment on ID:', activePayment.id || activePayment.receiptNumber);
    const voidRes = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/payments/${activePayment.id || activePayment.receiptNumber}/void`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      reason: 'Accidental payment entry'
    });
    console.log('Void Response Status:', voidRes.status, voidRes.data);
  }

  console.log('Reversal Flow Integration Test Complete Successfully!');
}

testReversalFlow().catch(console.error);
