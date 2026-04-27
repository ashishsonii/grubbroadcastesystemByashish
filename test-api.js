const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log("🚀 Starting API Tests...\n");

  try {
    // 1. Register a new teacher
    const teacherId = "teacher_" + Date.now();
    const teacherEmail = `${teacherId}@school.com`;
    console.log(`👤 Registering Teacher: ${teacherEmail}`);
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Teacher',
        email: teacherEmail,
        password: 'Password123'
      })
    });
    const regData = await regRes.json();
    console.log("Register Response:", regData.success ? "✅ Success" : "❌ Failed", regData.message);
    const teacherToken = regData.data.token;
    const teacherUUID = regData.data.user.id;

    // 2. Login as Principal (using seeded credentials)
    console.log(`\n👑 Logging in as Principal: principal@school.com`);
    const prinRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'principal@school.com',
        password: 'Admin@123'
      })
    });
    const prinData = await prinRes.json();
    console.log("Principal Login:", prinData.success ? "✅ Success" : "❌ Failed", prinData.message);
    const principalToken = prinData.data.token;

    // 3. Teacher uploads content
    console.log(`\n📤 Teacher uploading content...`);
    // Create a dummy image file
    const dummyImagePath = path.join(__dirname, 'dummy.jpg');
    fs.writeFileSync(dummyImagePath, 'dummy content');
    
    // We need to use FormData for file upload, since we're in Node we can construct a multipart/form-data body manually or use a FormData polyfill. 
    // Actually, Node 18 has FormData built-in.
    const formData = new FormData();
    formData.append('title', 'Test API Upload');
    formData.append('subject', 'maths');
    formData.append('description', 'Test Description');
    formData.append('start_time', new Date().toISOString());
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 24);
    formData.append('end_time', endDate.toISOString());
    formData.append('rotation_duration', '5');
    
    const blob = new Blob([fs.readFileSync(dummyImagePath)], { type: 'image/jpeg' });
    formData.append('file', blob, 'dummy.jpg');

    const uploadRes = await fetch(`${BASE_URL}/content/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${teacherToken}`
      },
      body: formData
    });
    const uploadData = await uploadRes.json();
    console.log("Upload Response:", uploadData.success ? "✅ Success" : "❌ Failed", uploadData.message);
    const contentId = uploadData.data?.id;

    // Clean up dummy file
    fs.unlinkSync(dummyImagePath);

    if (!contentId) {
       console.log("❌ Cannot proceed without content ID");
       return;
    }

    // 4. Principal approves content
    console.log(`\n✅ Principal approving content (ID: ${contentId})...`);
    const approveRes = await fetch(`${BASE_URL}/approval/${contentId}/approve`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${principalToken}`
      }
    });
    const approveData = await approveRes.json();
    console.log("Approve Response:", approveData.success ? "✅ Success" : "❌ Failed", approveData.message);

    // 5. Fetch live content
    console.log(`\n📡 Fetching Live Content for Teacher (ID: ${teacherUUID})...`);
    const liveRes = await fetch(`${BASE_URL}/content/live/${teacherUUID}`);
    const liveData = await liveRes.json();
    console.log("Live Content Response:", liveData.success ? "✅ Success" : "❌ Failed");
    console.log(JSON.stringify(liveData.data, null, 2));

    console.log("\n🎉 API Test completed!");

  } catch (err) {
    console.error("❌ Test Failed:", err);
  }
}

runTests();
