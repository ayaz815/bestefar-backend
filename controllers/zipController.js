// const JSZip = require("jszip");
// const fs = require("fs");
// const path = require("path");

// const generateZip = async (req, res) => {
//   try {
//     const zip = new JSZip();
//     // const htmlFolderPath = path.join(__dirname, "../../html");
//     const htmlFolderPath = "/var/www/bestefar-html";

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

const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");
const util = require("util");

const pipelineAsync = util.promisify(pipeline);

const generateZip = async (req, res) => {
  try {
    const zip = new JSZip();
    const htmlFolderPath = "/var/www/bestefar-html"; // Ensure this path is correct

    // Function to recursively add files to the ZIP asynchronously
    const addFolderToZip = async (folderPath, zipFolder) => {
      const items = await fs.promises.readdir(folderPath);
      for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stat = await fs.promises.stat(itemPath);
        if (stat.isDirectory()) {
          await addFolderToZip(itemPath, zipFolder.folder(item));
        } else {
          const fileData = await fs.promises.readFile(itemPath);
          zipFolder.file(item, fileData);
        }
      }
    };

    // Add the `html` folder to the ZIP asynchronously
    await addFolderToZip(htmlFolderPath, zip.folder("bestefar-html"));

    // Generate the ZIP file asynchronously as a stream
    const zipStream = zip.generateNodeStream({
      type: "nodebuffer",
      streamFiles: true,
    });

    // Set headers for ZIP download
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="bestefar-html.zip"'
    );
    res.setHeader("Content-Type", "application/zip");

    // Pipe the ZIP stream to the response
    await pipelineAsync(zipStream, res);
  } catch (error) {
    console.error("❌ Error generating ZIP file:", error);
    res.status(500).send("Failed to generate ZIP file.");
  }
};

module.exports = { generateZip };
