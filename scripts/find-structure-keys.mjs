import fs from "fs";
const raw = fs.readFileSync("D:/TypeArena/scripts/learntyping-site-structure.js", "utf8");
const startStruct = raw.indexOf('"pagesStructures":');
let iStruct = raw.indexOf("{", startStruct);
let depthStruct = 0;
let endStruct = iStruct;
for (; endStruct < raw.length; endStruct++) {
  if (raw[endStruct] === "{") depthStruct++;
  else if (raw[endStruct] === "}") {
    depthStruct--;
    if (depthStruct === 0) {
      endStruct++;
      break;
    }
  }
}
const pagesStructures = JSON.parse(raw.slice(iStruct, endStruct));
console.log("PagesStructures keys:", Object.keys(pagesStructures));
