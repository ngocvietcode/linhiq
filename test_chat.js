const http = require('http');
const fs = require('fs');

async function testApi() {
  try {
    const email = `test_${Date.now()}@test.com`;
    const regRes = await fetch("http://localhost:4500/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "password123",
        name: "Test User",
        role: "STUDENT"
      })
    });
    
    const regData = await regRes.json();
    const token = regData.token || regData.accessToken;
    
    const sessRes = await fetch("http://localhost:4500/api/chat/sessions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    
    const sessData = await sessRes.json();
    const sessionId = sessData.id;
    
    const msgRes = await fetch(`http://localhost:4500/api/chat/sessions/${sessionId}/message`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        content: "What is osmosis?",
        hintLevel: 1
      })
    });
    
    const msgText = await msgRes.text();
    fs.writeFileSync('msg_result.json', JSON.stringify({
      status: msgRes.status,
      body: msgText
    }, null, 2), 'utf8');

  } catch (err) {
    fs.writeFileSync('msg_result.json', String(err));
  }
}

testApi();
