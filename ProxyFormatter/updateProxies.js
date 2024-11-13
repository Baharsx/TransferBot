const fs = require('fs').promises;

async function processProxies() {
  try {
    console.log("Starting to read proxies.txt...");
    const data = await fs.readFile('proxies.txt', 'utf8');
    console.log("Successfully read proxies.txt");

    console.log("Filtering HTTP proxies...");
    const httpProxies = data
      .split('\n')
      .filter(line => line.trim().toLowerCase().startsWith('http'))
      .map(line => `  "${line.trim()}",`);
    console.log("Filtered HTTP proxies:", httpProxies);

    console.log("Generating content for proxies.js...");
    const outputContent = `module.exports = [
${httpProxies.join('\n')}
];\n`;
    console.log("Generated content for proxies.js:", outputContent);

    console.log("Writing to proxies.js...");
    await fs.writeFile('proxies.js', outputContent, 'utf8');
    console.log("HTTP proxies successfully added to proxies.js");
  } catch (err) {
    console.error("Error processing proxies:", err);
    process.exit(1);
  }
}

processProxies();
