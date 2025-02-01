// const JSZip = require("jszip");
// const fs = require("fs");
// const path = require("path");

// const generateZip = async (req, res) => {
//   try {
//     const zip = new JSZip();
//     const htmlFolderPath = path.join(__dirname, "../../html");

//     // Function to recursively add files and folders to the ZIP
//     const addFolderToZip = (folderPath, zipFolder) => {
//       const items = fs.readdirSync(folderPath);
//       items.forEach((item) => {
//         const itemPath = path.join(folderPath, item);
//         if (fs.statSync(itemPath).isDirectory()) {
//           // Add subfolder
//           addFolderToZip(itemPath, zipFolder.folder(item));
//         } else {
//           // Add file
//           zipFolder.file(item, fs.readFileSync(itemPath));
//         }
//       });
//     };

//     // Add the `html` folder to the ZIP
//     addFolderToZip(htmlFolderPath, zip);

//     // Generate the ZIP file and send it as a response
//     const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=html_project.zip"
//     );
//     res.setHeader("Content-Type", "application/zip");
//     res.send(zipBuffer);
//   } catch (error) {
//     console.error("Error generating ZIP file:", error);
//     res.status(500).send("Failed to generate ZIP file.");
//   }
// };

// module.exports = { generateZip };
