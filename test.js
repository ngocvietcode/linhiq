const fetch = require('node-fetch'); // we can just use native fetch in node 18+

async function test() {
  try {
    // 1. Login
    console.log("Logging in...");
    const res = await fetch('http://localhost:4500/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@javirs.io', password: 'admin123' })
    });
    
    if (!res.ok) {
      console.log("Login failed!", await res.text());
      return;
    }
    
    const data = await res.json();
    const token = data.accessToken;
    console.log("Got token!", token.substring(0, 15) + "...");

    // 2. Create Session or Get existing
    const dashRes = await fetch('http://localhost:4500/api/chat/sessions', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const sessions = await dashRes.json();
    const sessionId = sessions.length > 0 ? sessions[0].id : null;
    
    if (!sessionId) {
      console.log("No sessions found");
      return;
    }
    
    console.log("Using session:", sessionId);

    // 3. Send Message
    console.log("Sending message...");
    const msgRes = await fetch(`http://localhost:4500/api/chat/sessions/${sessionId}/message`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content: "hello world", hintLevel: 1 })
    });
    
    console.log("Status:", msgRes.status);
    console.log("Headers:", Object.fromEntries(msgRes.headers.entries()));
    if (!msgRes.ok) {
      console.log("ERROR BODY:", await msgRes.text());
    } else {
      console.log("It worked!");
      const reader = msgRes.body;
      const chunks = [];
      for await (const chunk of reader) {
        chunks.push(chunk);
      }
      console.log("Stream output:", Buffer.concat(chunks).toString('utf-8').substring(0, 200));
    }
  } catch (e) {
    console.error("Fetch threw an error:", e);
  }
}
test();
