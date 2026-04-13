const http = require('http');
const fs = require('fs');

async function testApi() {
  try {
    const email = `test_subj_${Date.now()}@test.com`;
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
    console.log("Token:", token ? "Got" : "Fail");

    // Let's list subjects to get a subjectId
    const nullRes = await fetch("http://localhost:4500/api/chat/sessions", {
       headers: { "Authorization": `Bearer ${token}` }
    });
    
    // Actually we can create session by guessing a subjectId, but let's query the DB or use a hardcoded one.
    // Wait, let's just make a script to query prisma using an eval.
  } catch(e) {}
}
testApi();
