async function checkSite() {
  try {
    const res = await fetch("https://www.learntyping.org/");
    const html = await res.text();
    console.log("HTML length:", html.length);
    console.log("Sample HTML:", html.slice(0, 1000));
  } catch (err) {
    console.error("Error fetching site:", err);
  }
}

checkSite();
