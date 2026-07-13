const axios = require("axios");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { db } = require("../config/firebase");

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MAX_CHARS = 20000;

// ================= EXTRACT TEXT =================
const extractText = async (fileUrl, format) => {

  const response = await axios.get(fileUrl, {
    responseType: "arraybuffer",
  });

 

  const buffer = Buffer.from(response.data);

  const type = ((format || "") + " " + fileUrl).toLowerCase();



  // ---------- PDF ----------
  if (type.includes("pdf")) {
    const parsed = await pdfParse(buffer);



    return parsed.text;
  }

  // ---------- DOC / DOCX ----------
  if (
    type.includes("docx") ||
    type.includes(".docx") ||
    type.includes(".doc") ||
    type.includes("word")
  ) {
    const result = await mammoth.extractRawText({
      buffer,
    });

  

    return result.value;
  }

  throw new Error("Unsupported file type");
};

// ================= AI SUMMARY =================
const summarizeDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection("documents").doc(id);

    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        error: "Document not found",
      });
    }

    const docData = docSnap.data();

    // Already generated
    if (docData.aiSummary) {
      return res.json({
        summary: docData.aiSummary,
        cached: true,
      });
    }

    const text = await extractText(
      docData.fileUrl,
      docData.format
    );

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Could not extract text.",
      });
    }

    const trimmed = text.slice(0, MAX_CHARS);



    const prompt = `
You are an academic assistant.

Summarize this document.

Return:

Summary:
(5-8 lines)

Key Topics:
• Topic 1
• Topic 2
• Topic 3
• Topic 4
• Topic 5

Document:

${trimmed}
`;

  const result = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
});

const summary = result.text;

    await docRef.update({
      aiSummary: summary,
    });

    return res.json({
      summary,
      cached: false,
    });
  } catch (err) {
    console.error("===== AI SUMMARY ERROR =====");
    console.error(err);
    console.error("============================");

    return res.status(500).json({
      error: err.message,
    });
  }
};

module.exports = {
  summarizeDocument,
};