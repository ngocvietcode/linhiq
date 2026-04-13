const fs = require('fs');

async function testApi() {
  try {
    const email = `test_subj_${Date.now()}@test.com`;
    const regRes = await fetch("http://localhost:4500/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123", name: "Test User", role: "STUDENT" })
    });
    
    const regData = await regRes.json();
    const token = regData.token || regData.accessToken;
    
    const sessRes = await fetch("http://localhost:4500/api/chat/sessions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ subjectId: "cmnl9g0uk0000la3cn8d1lg8q" }) // Pass subject ID!
    });
    
    const sessData = await sessRes.json();
    console.log("Created session:", sessData.id, sessData.subjectId);
    
    const msgRes = await fetch(`http://localhost:4500/api/chat/sessions/${sessData.id}/message`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ content: "Trondheim", hintLevel: 1 })
    });
    
    console.log("Message Status:", msgRes.status);
    const text = await msgRes.text();
    console.log("Response:", text.substring(0, 500));
  } catch (err) {
    console.error(err);
  }
}
testApi();
