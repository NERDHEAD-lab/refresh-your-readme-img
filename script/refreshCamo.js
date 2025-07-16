import puppeteer from "puppeteer";
import {execSync} from "child_process";

const url = process.env.README_URL || process.argv[2] || getDefaultReadmeUrl();
printPriority();
console.log(`Using README URL: ${url}`);

(async () => {
    console.log(`Refreshing camo images from ${url}...`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: 'networkidle0'});

    // camo 이미지 src 추출
    const camoUrls = await page.$$eval('article.markdown-body img', imgs =>
        imgs.map(img => img.src).filter(src => src.startsWith('https://camo.githubusercontent.com/'))
    );

    await browser.close();

    console.log(`Found ${camoUrls.length} camo images`);

    printCamoUrlCachedAge(camoUrls);
    purgeTargetCamoUrls(camoUrls);
})();

function purgeTargetCamoUrls(camoUrls) {
    if (camoUrls.length !== 0) {
        console.log('Purging camo images...');
    }
    for (const camoUrl of camoUrls) {
        try {
            console.log(`- PURGE: ${camoUrl}`);
            const result = execSync(`curl -s -X PURGE ${camoUrl}`);
            const status = result.toString().trim();
            console.log(`    → HTTP status: ${status}`);
        } catch (e) {
            console.error(`    failed: ${camoUrl}`, e.message);
            throw e;
        }
    }
    console.log('\nAll camo images purged successfully.');
}

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

function printCamoUrlCachedAge(camoUrls) {
    if (camoUrls.length !== 0) {
        console.log('\nCamo image cache age:');
    }
    for (const camoUrl of camoUrls) {
        let ageSec = null;
        let dateStr = null;
        try {
            const header = execSync(`curl -sI "${camoUrl}"`).toString();
            const ageMatch = header.match(/age: (\d+)/i);
            if (ageMatch) ageSec = parseInt(ageMatch[1], 10);
            const dateMatch = header.match(/date: (.+)/i);
            if (dateMatch) dateStr = dateMatch[1].trim();
        } catch (e) {
            console.log(`- Failed to fetch headers: ${camoUrl}`);
        }

        let ageMsg = '';
        if (ageSec != null) {
            const hours = Math.floor(ageSec / 3600);
            const mins = Math.floor((ageSec % 3600) / 60);
            const secs = ageSec % 60;
            ageMsg = `Cached ${hours}h ${mins}m ${secs}s ago`;
            if (dateStr) {
                const cachedDate = new Date(new Date(dateStr).getTime() - ageSec * 1000);
                ageMsg += ` (cached at: ${cachedDate.toISOString().replace('T', ' ').slice(0, 19)})`;
            }
        } else {
            ageMsg = 'No cache age info found';
        }

        console.log(`- Image: ${camoUrl}`);
        console.log(`  ${ageMsg}`);
    }
    if (camoUrls.length !== 0) {
        console.log('');
    }
}

function printPriority() {
    let selected = 'default [current Repository README.md]';
    if (process.env.README_URL) {
        selected = 'env variable [README_URL]';
    } else if (process.argv[2]) {
        selected = 'command line argument [0]';
    }

    console.log(`Using ${selected} for README URL`);
}