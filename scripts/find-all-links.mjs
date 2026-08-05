async function findAllLinks() {
  try {
    const res = await fetch("https://www.learntyping.org/");
    const html = await res.text();
    
    const hrefRegex = /href=["']([^"']+)["']/g;
    let match;
    const links = new Set();
    while ((match = hrefRegex.exec(html)) !== null) {
      const url = match[1];
      if (url && !url.startsWith("#") && !url.startsWith("javascript:") && !url.includes("google") && !url.includes("facebook") && !url.includes("skype")) {
        links.add(url);
      }
    }
    
    console.log("All Links Found:", Array.from(links));
  } catch (err) {
    console.error("Error finding links:", err);
  }
}

findAllLinks();
