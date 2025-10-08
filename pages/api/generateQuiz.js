import { generateQuizFromText } from "../../lib/llm";
import fs from "fs";
import path from "path";
import PDFParser from "pdf2json";

export default async function handler(req, res) {
  try {
    const { pdf } = req.body;
    let text = "";

    if (pdf) {
      // Extract text from the specified PDF
      const filePath = path.join(process.cwd(), "public", pdf);
      if (fs.existsSync(filePath)) {
        // Use pdf2json for text extraction
        const pdfParser = new PDFParser(null, 1);

        text = await new Promise((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", (errData) => {
            console.error("PDF parsing error:", errData.parserError);
            reject(new Error("Failed to parse PDF"));
          });

          pdfParser.on("pdfParser_dataReady", () => {
            try {
              const parsedText = pdfParser.getRawTextContent();
              resolve(parsedText);
            } catch (error) {
              console.error("Error extracting text:", error);
              reject(new Error("Failed to extract text from PDF"));
            }
          });

          pdfParser.loadPDF(filePath);
        });
      } else {
        return res.status(404).json({ error: "PDF not found" });
      }
    } else {
      // For "All uploaded PDFs", use sample text for now
      text = `
Motion in a straight line: The motion of a body is said to be rectilinear if its path is a straight line.
If the body covers equal displacements in equal intervals of time, the motion is uniform.
Velocity is the rate of change of displacement.
`;
    }

    const quiz = await generateQuizFromText(text);
    res.status(200).json({ quiz });
  } catch (error) {
    console.error("Error in quiz API:", error);
    res.status(500).json({ error: "Quiz generation failed" });
  }
}
