
# refresh-your-readme-img

## How it works

This workflow does the following:

1. Finds `https://github.com/${repoPath}/blob/${branch}/README.md`.
2. Selects all images in `article.markdown-body img`.
3. For each image whose `src` starts with `https://camo.githubusercontent.com/`,
4. Sends a cache purge request:
    ```bash
    curl -X PURGE "https://camo.githubusercontent.com/..."
   ```

> [!NOTE]
> **In summary:**  
> When GitHub proxies external images via camo for caching/security,  
> changes to the original image may not update immediately.  
> This workflow forces camo to refresh the image cache on demand.
>
> Reference: [GitHub Camo Documentation][github-camo-docs]




[github-camo-docs]: https://docs.github.com/ko/enterprise-cloud@latest/authentication/keeping-your-account-and-data-secure/about-anonymized-urls#removing-an-image-from-camos-cache

## Example

<p align="center">
  <img height="160px" src="https://github-readme-stats.vercel.app/api?username=NERDHEAD-lab&theme=vue-dark&show_icons=true&hide_border=false&count_private=true" />
  <img height="160px" src="https://github-readme-stats.vercel.app/api/top-langs/?username=NERDHEAD-lab&theme=vue-dark&show_icons=true&hide_border=false&layout=compact" />
</p>

- **In your README:**
  You enter the image source URL directly, such as:
    ```html
      <img src="https://github-readme-stats.vercel.app/api?username=NERDHEAD-lab&theme=vue-dark&show_icons=true&hide_border=false&count_private=true" />
    ```

- **But when viewing your README on GitHub:**
  GitHub proxies the image through their own CDN (camo.githubusercontent.com) for security and caching.<br>
  You can see the real displayed URL by right-clicking the image and copying its address.<br>
  It will look like:
```html
        <img src="https://camo.githubusercontent.com/bf5db.../68747...">
```

<br><br><br><br>
***PS. Solves the impatience of Koreans.
Because cache issues usually go away with time.***