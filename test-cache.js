const fs = require('fs');


async function testCache() {
  console.log("Testing Cache Hit/Miss...");
  // teacherId from previous test: 243e237b-32d1-469e-80a4-fc50945f0f6b
  const teacherId = "243e237b-32d1-469e-80a4-fc50945f0f6b";
  const url = `http://localhost:3000/api/content/live/${teacherId}`;
  
  console.log("\n1. First Request (Should be MISS)");
  const start1 = Date.now();
  let res = await fetch(url);
  await res.json();
  console.log(`Time taken: ${Date.now() - start1}ms`);

  console.log("\n2. Second Request (Should be HIT)");
  const start2 = Date.now();
  res = await fetch(url);
  await res.json();
  console.log(`Time taken: ${Date.now() - start2}ms`);
}

testCache().catch(console.error);
