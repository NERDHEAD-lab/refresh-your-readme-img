const puppeteer = require('puppeteer');
const { execSync } = require('child_process');

const url = process.argv[2] || getDefaultReadmeUrl();


(async () => {
  // const url = 'https://github.com/NERDHEAD-lab/NERDHEAD-lab/blob/master/README.md';
  console.log(`Refreshing camo images from ${url}...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });

  // camo 이미지 src 추출
  const camoUrls = await page.$$eval('article.markdown-body img', imgs =>
    imgs.map(img => img.src).filter(src => src.startsWith('https://camo.githubusercontent.com/'))
  );

  await browser.close();

  console.log(`Found ${camoUrls.length} camo images`);
  for (const camoUrl of camoUrls) {
    try {
      console.log(`PURGE: ${camoUrl}`);
      // curl -X PURGE 실행
      const result = execSync(`curl -X PURGE ${camoUrl}`);
      const status = result.toString().trim();
      console.log(`    → HTTP status: ${status}`);
    } catch (e) {
      console.error(`    failed: ${camoUrl}`, e.message);
      throw e;
    }
  }
})();


function getDefaultReadmeUrl() {
  try {
    const originUrl = execSync('git config --get remote.origin.url').toString().trim();

    let match = originUrl.match(/github\.com[/:](.+\/.+?)(\.git)?$/);
    if (!match) throw new Error('Not a github.com remote');

    const repoPath = match[1].replace(/\.git$/, '');

    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

    return `https://github.com/${repoPath}/blob/${branch}/README.md`;
  } catch (e) {
    console.error('Cannot get origin URL or branch. Please specify url manually.');
    process.exit(1);
  }
}