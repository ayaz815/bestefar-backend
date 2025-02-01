// const fs = require("fs");
// const path = require("path");

// // Safely read a file
// const readFileSafe = (filePath) => {
//   try {
//     return fs.readFileSync(filePath, "utf8");
//   } catch (error) {
//     console.error(`Error reading file at ${filePath}:`, error);
//     throw new Error("File not found");
//   }
// };

// // Safely write a file
// const writeFileSafe = (filePath, data) => {
//   try {
//     fs.writeFileSync(filePath, data, "utf8");
//     console.log(`File written successfully: ${filePath}`);
//   } catch (error) {
//     console.error(`Error writing file at ${filePath}:`, error);
//     throw new Error("Failed to write file");
//   }
// };

// module.exports = { readFileSafe, writeFileSafe };
