const path = require("path");
const fs = require("fs");
const https = require("https");
const PptxGenJS = require("pptxgenjs");
const { GoogleGenAI } = require("@google/genai");

/* =========================================================
   GEMINI CONFIGURATION
========================================================= */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash-lite"
];

/* =========================================================
   OFFICIAL IARE LOGO
========================================================= */

const IARE_LOGO_URL =
  "https://www.iare.ac.in/sites/default/files/design_templates/IARE_Logo_Academic.png";

/* =========================================================
   DOWNLOAD IMAGE AS DATA URI
========================================================= */

function downloadImageAsDataUri(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {

        // Handle redirect
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          return downloadImageAsDataUri(response.headers.location)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Logo download failed: HTTP ${response.statusCode}`
            )
          );
          return;
        }

        const chunks = [];

        response.on("data", (chunk) => {
          chunks.push(chunk);
        });

        response.on("end", () => {
          const buffer = Buffer.concat(chunks);

          resolve(
            `data:image/png;base64,${buffer.toString("base64")}`
          );
        });

        response.on("error", reject);
      })
      .on("error", reject);
  });
}

/* =========================================================
   WAIT FUNCTION
========================================================= */

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/* =========================================================
   GEMINI GENERATION
========================================================= */

async function generateWithGemini(prompt) {

  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing in backend .env file."
    );
  }

  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
  });

  let lastError = null;

  for (const model of GEMINI_MODELS) {

    try {

      console.log(`Trying Gemini model: ${model}`);

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.4
        }
      });

      let text = response.text;

      if (!text) {
        throw new Error("Gemini returned empty response.");
      }

      text = text.trim();

      // Remove markdown code block if Gemini adds it
      text = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(text);

      if (!parsed.slides || !Array.isArray(parsed.slides)) {
        throw new Error(
          "Gemini response does not contain a valid slides array."
        );
      }

      console.log(
        `Gemini generation successful using ${model}`
      );

      return parsed;

    } catch (error) {

      lastError = error;

      console.error(
        `Gemini model ${model} failed:`,
        error.message
      );

      // Wait briefly before trying next model
      await wait(800);
    }
  }

  throw lastError || new Error("Gemini generation failed.");
}

/* =========================================================
   FALLBACK CONTENT
========================================================= */

function createFallbackSlides(
  courseTitle,
  topicTitle,
  numberOfSlides,
  difficulty
) {

  const slides = [];

  const topic = topicTitle || "Computer Science Topic";

  // Title slide
  slides.push({
    type: "title",
    title: topic,
    subtitle: `${courseTitle} • ${difficulty} Level`
  });

  const contentTemplates = [
    {
      title: "Introduction",
      body: `This presentation introduces ${topic} and explains its importance in the field of ${courseTitle}. The topic provides a foundation for understanding important concepts, applications, and practical uses. It is useful for students because it connects theoretical knowledge with real-world computing systems. Understanding the basic principles makes it easier to study advanced concepts and apply them in projects.`
    },
    {
      title: "Key Concepts",
      body: `${topic} consists of several important concepts that work together to solve practical problems. These concepts provide the foundation for understanding how the technology or method operates. Students should focus on the purpose of each component, how the components interact, and why they are required. A clear understanding of these concepts helps in designing efficient and reliable solutions.`
    },
    {
      title: "Working Principle",
      body: `The working process of ${topic} can be understood as a sequence of related steps. Input information is processed according to defined rules, algorithms, or system operations. Each stage contributes to producing the expected result. Understanding this flow helps students identify how the system behaves under different conditions and how its components cooperate to achieve the required objective.`
    },
    {
      title: "Applications",
      body: `${topic} has applications in education, software development, business systems, research, and modern digital services. Depending on the implementation, it can improve efficiency, reliability, automation, security, or decision-making. Real-world applications demonstrate why the topic is important and provide opportunities for students to develop practical projects based on the concepts learned in the classroom.`
    },
    {
      title: "Advantages",
      body: `The major advantages of ${topic} include improved efficiency, better organization, automation of repetitive activities, and support for reliable solutions. Proper implementation can reduce manual effort and improve the quality of results. Another important advantage is that the concepts can often be integrated with other technologies, allowing developers and organizations to create larger and more useful systems.`
    },
    {
      title: "Challenges",
      body: `Although ${topic} provides several benefits, its implementation may involve challenges. These can include complexity, resource requirements, security concerns, maintenance, scalability, and the need for skilled users. Understanding these limitations is important because a good solution should not only provide useful features but should also consider reliability, performance, cost, usability, and future requirements.`
    },
    {
      title: "Future Scope",
      body: `The future scope of ${topic} is closely connected with the continuous development of computing technologies. Improvements in artificial intelligence, cloud computing, automation, data processing, and cybersecurity can create new opportunities. Students can explore these areas through academic projects and practical experiments. Future implementations may become more intelligent, efficient, scalable, secure, and easier to use.`
    }
  ];

  const contentSlideCount = Math.max(
    1,
    numberOfSlides - 2
  );

  for (
    let i = 0;
    i < contentSlideCount;
    i++
  ) {

    const template =
      contentTemplates[i % contentTemplates.length];

    slides.push({
      type: "content",
      title: template.title,
      body: template.body,
      bullets: [
        `Understanding ${topic}`,
        "Important concepts and principles",
        "Practical applications and benefits",
        "Challenges and future possibilities"
      ]
    });
  }

  // Thank-you slide
  slides.push({
    type: "thankyou",
    title: "Thank You",
    subtitle: "Questions & Discussion"
  });

  return {
    slides
  };
}

/* =========================================================
   CREATE GEMINI PROMPT
========================================================= */

function createPrompt(
  courseTitle,
  topicTitle,
  numberOfSlides,
  difficulty
) {

  return `
You are an expert academic presentation designer.

Create a professional PowerPoint presentation for a B.Tech Computer Science student.

Course / Subject:
${courseTitle}

Presentation Topic:
${topicTitle}

Difficulty:
${difficulty}

Number of Slides:
${numberOfSlides}

IMPORTANT REQUIREMENTS:

1. Generate exactly ${numberOfSlides} slides.
2. The first slide must be a title slide.
3. The last slide must be a Thank You / Questions slide.
4. All middle slides must contain useful academic content.
5. Content should be directly related to the topic.
6. Use simple, clear language suitable for B.Tech students.
7. Avoid unnecessary repetition.
8. Each content slide should contain approximately 100-150 words.
9. Each content slide should contain 4 concise bullet points.
10. Include practical examples wherever appropriate.
11. Include applications and real-world relevance.
12. Include advantages, limitations/challenges, and future scope where appropriate.
13. Do not include speaker notes.
14. Do not include markdown.
15. Return ONLY valid JSON.

Use this exact JSON structure:

{
  "slides": [
    {
      "type": "title",
      "title": "Presentation Topic",
      "subtitle": "Short subtitle"
    },
    {
      "type": "content",
      "title": "Slide Title",
      "body": "Approximately 100-150 words of content.",
      "bullets": [
        "Point 1",
        "Point 2",
        "Point 3",
        "Point 4"
      ]
    },
    {
      "type": "thankyou",
      "title": "Thank You",
      "subtitle": "Questions & Discussion"
    }
  ]
}

Return exactly ${numberOfSlides} slide objects.
`;
}

/* =========================================================
   FORMAT TEXT
========================================================= */

function cleanText(value) {

  if (!value) {
    return "";
  }

  return String(value)
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .trim();
}

/* =========================================================
   GENERATE PPT
========================================================= */

async function generatePPT(req, res) {

  try {

    console.log("--------------------------------------");
    console.log("PPT GENERATION REQUEST");
    console.log("--------------------------------------");

    const {
      courseTitle,
      topicTitle,
      numberOfSlides,
      difficulty
    } = req.body;

    /* --------------------------------------
       VALIDATION
    -------------------------------------- */

    const finalCourseTitle =
      cleanText(courseTitle) ||
      "Computer Science and Engineering";

    const finalTopicTitle =
      cleanText(topicTitle) ||
      "Computer Science Topic";

    const finalNumberOfSlides =
      Math.min(
        Math.max(
          Number(numberOfSlides) || 8,
          5
        ),
        15
      );

    const finalDifficulty =
      cleanText(difficulty) ||
      "Medium";

    console.log("Course:", finalCourseTitle);
    console.log("Topic:", finalTopicTitle);
    console.log("Slides:", finalNumberOfSlides);
    console.log("Difficulty:", finalDifficulty);

    /* --------------------------------------
       DOWNLOAD OFFICIAL IARE LOGO
    -------------------------------------- */

    let iareLogo = null;

    try {

      console.log("Downloading official IARE logo...");

      iareLogo =
        await downloadImageAsDataUri(
          IARE_LOGO_URL
        );

      console.log(
        "Official IARE logo downloaded successfully."
      );

    } catch (error) {

      console.error(
        "Could not download IARE logo:",
        error.message
      );

      iareLogo = null;
    }

    /* --------------------------------------
       GENERATE CONTENT WITH GEMINI
    -------------------------------------- */

    let generatedData = null;

    try {

      const prompt = createPrompt(
        finalCourseTitle,
        finalTopicTitle,
        finalNumberOfSlides,
        finalDifficulty
      );

      generatedData =
        await generateWithGemini(prompt);

    } catch (error) {

      console.error(
        "Gemini unavailable. Using fallback content."
      );

      console.error(error.message);

      generatedData =
        createFallbackSlides(
          finalCourseTitle,
          finalTopicTitle,
          finalNumberOfSlides,
          finalDifficulty
        );
    }

    /* --------------------------------------
       VALIDATE SLIDE COUNT
    -------------------------------------- */

    let slides =
      Array.isArray(generatedData.slides)
        ? generatedData.slides
        : [];

    if (
      slides.length !== finalNumberOfSlides
    ) {

      console.log(
        `Gemini returned ${slides.length} slides. Creating fallback presentation.`
      );

      slides =
        createFallbackSlides(
          finalCourseTitle,
          finalTopicTitle,
          finalNumberOfSlides,
          finalDifficulty
        ).slides;
    }

    /* --------------------------------------
       CREATE POWERPOINT
    -------------------------------------- */

    const pptx = new PptxGenJS();

    pptx.layout = "LAYOUT_WIDE";

    pptx.author =
      "SlidesMakerIARE";

    pptx.subject =
      finalTopicTitle;

    pptx.title =
      finalTopicTitle;

    pptx.company =
      "Institute of Aeronautical Engineering";

    pptx.lang = "en-US";

    pptx.theme = {
      headFontFace: "Aptos Display",
      bodyFontFace: "Aptos",
      lang: "en-US"
    };

    /* --------------------------------------
       COLORS
    -------------------------------------- */

    const NAVY = "063970";
    const BLUE = "1469AA";
    const LIGHT_BLUE = "EAF4FB";
    const DARK = "202020";
    const GREY = "666666";
    const WHITE = "FFFFFF";
    const LIGHT_GREY = "F5F7FA";

    /* --------------------------------------
       SLIDE SIZE
    -------------------------------------- */

    const SLIDE_WIDTH = 13.333;
    const SLIDE_HEIGHT = 7.5;

    /* =====================================================
       CREATE EACH SLIDE
    ===================================================== */

    slides.forEach((slideData, index) => {

      const slide =
        pptx.addSlide();

      const type =
        slideData.type || "content";

      /* ===================================================
         TITLE SLIDE
      =================================================== */

      if (
        index === 0 ||
        type === "title"
      ) {

        slide.background = {
          color: WHITE
        };

        /* --------------------------------
           OFFICIAL IARE LOGO
           TOP CENTER
        -------------------------------- */

        if (iareLogo) {

          slide.addImage({
            data: iareLogo,
            x: 2.2,
            y: 0.15,
            w: 9.0,
            h: 1.55
          });

        }

        /* --------------------------------
           TOP LINE
        -------------------------------- */

        slide.addShape(
          pptx.ShapeType.line,
          {
            x: 0.75,
            y: 1.95,
            w: 11.85,
            h: 0,
            line: {
              color: BLUE,
              width: 1.5
            }
          }
        );

        /* --------------------------------
           COURSE
        -------------------------------- */

        slide.addText(
          finalCourseTitle,
          {
            x: 1.0,
            y: 2.25,
            w: 11.3,
            h: 0.45,
            fontFace: "Aptos",
            fontSize: 18,
            bold: true,
            color: BLUE,
            align: "center",
            margin: 0
          }
        );

        /* --------------------------------
           PRESENTATION TITLE
        -------------------------------- */

        slide.addText(
          cleanText(
            slideData.title ||
            finalTopicTitle
          ),
          {
            x: 1.0,
            y: 3.0,
            w: 11.3,
            h: 1.25,
            fontFace: "Aptos Display",
            fontSize: 34,
            bold: true,
            color: NAVY,
            align: "center",
            valign: "mid",
            margin: 0.05
          }
        );

        /* --------------------------------
           SUBTITLE
        -------------------------------- */

        slide.addText(
          cleanText(
            slideData.subtitle ||
            `${finalDifficulty} Level`
          ),
          {
            x: 2.0,
            y: 4.45,
            w: 9.3,
            h: 0.5,
            fontSize: 16,
            color: GREY,
            align: "center",
            margin: 0
          }
        );

        /* --------------------------------
           FOOTER
        -------------------------------- */

        slide.addText(
          "SlidesMakerIARE",
          {
            x: 0.7,
            y: 6.85,
            w: 11.9,
            h: 0.25,
            fontSize: 10,
            color: GREY,
            align: "center",
            margin: 0
          }
        );

        return;
      }

      /* ===================================================
         THANK YOU SLIDE
      =================================================== */

      if (
        index === slides.length - 1 ||
        type === "thankyou"
      ) {

        slide.background = {
          color: NAVY
        };

        slide.addText(
          cleanText(
            slideData.title ||
            "Thank You"
          ),
          {
            x: 1,
            y: 2.35,
            w: 11.3,
            h: 0.9,
            fontFace: "Aptos Display",
            fontSize: 40,
            bold: true,
            color: WHITE,
            align: "center",
            margin: 0
          }
        );

        slide.addText(
          cleanText(
            slideData.subtitle ||
            "Questions & Discussion"
          ),
          {
            x: 2,
            y: 3.45,
            w: 9.3,
            h: 0.5,
            fontSize: 18,
            color: WHITE,
            align: "center",
            margin: 0
          }
        );

        slide.addText(
          finalTopicTitle,
          {
            x: 1.5,
            y: 5.25,
            w: 10.3,
            h: 0.35,
            fontSize: 12,
            color: "D9EAF7",
            align: "center",
            margin: 0
          }
        );

        slide.addText(
          "SlidesMakerIARE",
          {
            x: 1,
            y: 6.8,
            w: 11.3,
            h: 0.25,
            fontSize: 10,
            color: "D9EAF7",
            align: "center",
            margin: 0
          }
        );

        return;
      }

      /* ===================================================
         CONTENT SLIDE
      =================================================== */

      slide.background = {
        color: WHITE
      };

      /* --------------------------------
         HEADER
      -------------------------------- */

      slide.addShape(
        pptx.ShapeType.rect,
        {
          x: 0,
          y: 0,
          w: SLIDE_WIDTH,
          h: 0.75,
          fill: {
            color: NAVY
          },
          line: {
            color: NAVY
          }
        }
      );

      /* --------------------------------
         SLIDE NUMBER
      -------------------------------- */

      slide.addText(
        `${index + 1}`,
        {
          x: 12.15,
          y: 0.19,
          w: 0.5,
          h: 0.25,
          fontSize: 11,
          bold: true,
          color: WHITE,
          align: "center",
          margin: 0
        }
      );

      /* --------------------------------
         TITLE
      -------------------------------- */

      slide.addText(
        cleanText(
          slideData.title ||
          `Slide ${index + 1}`
        ),
        {
          x: 0.65,
          y: 1.05,
          w: 12.0,
          h: 0.6,
          fontFace: "Aptos Display",
          fontSize: 27,
          bold: true,
          color: NAVY,
          margin: 0
        }
      );

      /* --------------------------------
         TITLE UNDERLINE
      -------------------------------- */

      slide.addShape(
        pptx.ShapeType.line,
        {
          x: 0.68,
          y: 1.72,
          w: 1.2,
          h: 0,
          line: {
            color: BLUE,
            width: 3
          }
        }
      );

      /* --------------------------------
         BODY CONTENT
      -------------------------------- */

      const body =
        cleanText(slideData.body);

      if (body) {

        slide.addText(
          body,
          {
            x: 0.75,
            y: 2.0,
            w: 7.2,
            h: 2.75,
            fontFace: "Aptos",
            fontSize: 15,
            color: DARK,
            breakLine: false,
            valign: "top",
            margin: 0.05,
            fit: "shrink"
          }
        );
      }

      /* --------------------------------
         BULLET BOX
      -------------------------------- */

      const bullets =
        Array.isArray(slideData.bullets)
          ? slideData.bullets
          : [];

      if (bullets.length > 0) {

        slide.addShape(
          pptx.ShapeType.roundRect,
          {
            x: 8.35,
            y: 1.95,
            w: 4.25,
            h: 3.65,
            rectRadius: 0.08,
            fill: {
              color: LIGHT_BLUE
            },
            line: {
              color: "C7DFEF",
              width: 1
            }
          }
        );

        slide.addText(
          "KEY POINTS",
          {
            x: 8.7,
            y: 2.25,
            w: 3.5,
            h: 0.3,
            fontSize: 12,
            bold: true,
            color: BLUE,
            charSpacing: 1,
            margin: 0
          }
        );

        const bulletText =
          bullets
            .slice(0, 4)
            .map(
              (bullet) =>
                `• ${cleanText(bullet)}`
            )
            .join("\n");

        slide.addText(
          bulletText,
          {
            x: 8.7,
            y: 2.75,
            w: 3.45,
            h: 2.45,
            fontSize: 14,
            color: DARK,
            breakLine: false,
            valign: "top",
            margin: 0.02,
            fit: "shrink"
          }
        );
      }

      /* --------------------------------
         BOTTOM TOPIC LABEL
      -------------------------------- */

      slide.addShape(
        pptx.ShapeType.line,
        {
          x: 0.7,
          y: 6.45,
          w: 11.9,
          h: 0,
          line: {
            color: "D9E1E8",
            width: 1
          }
        }
      );

      slide.addText(
        finalTopicTitle,
        {
          x: 0.7,
          y: 6.62,
          w: 8.5,
          h: 0.25,
          fontSize: 9,
          color: GREY,
          margin: 0
        }
      );

      slide.addText(
        `SlidesMakerIARE • ${index + 1}/${slides.length}`,
        {
          x: 9.2,
          y: 6.62,
          w: 3.4,
          h: 0.25,
          fontSize: 9,
          color: GREY,
          align: "right",
          margin: 0
        }
      );
    });

    /* =====================================================
       SAVE POWERPOINT
    ===================================================== */

    const generatedDir =
      path.join(__dirname, "../generated");

    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, {
        recursive: true
      });
    }

    const safeTopic =
      finalTopicTitle
        .replace(/[^a-zA-Z0-9-_]/g, "_")
        .replace(/_+/g, "_")
        .substring(0, 80);

    const timestamp =
      Date.now();

    const fileName =
      `${safeTopic}_${timestamp}.pptx`;

    const filePath =
      path.join(
        generatedDir,
        fileName
      );

    await pptx.writeFile({
      fileName: filePath
    });

    console.log("--------------------------------------");
    console.log("PPT GENERATED SUCCESSFULLY");
    console.log(`File: ${filePath}`);
    console.log("--------------------------------------");

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.json({
      success: true,
      message: "PowerPoint generated successfully.",
      file: `/generated/${fileName}`,
      fileName,
      courseTitle: finalCourseTitle,
      topicTitle: finalTopicTitle,
      numberOfSlides: finalNumberOfSlides,
      difficulty: finalDifficulty
    });

  } catch (error) {

    console.error("--------------------------------------");
    console.error("PPT GENERATION ERROR");
    console.error(error);
    console.error("--------------------------------------");

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Could not generate PowerPoint."
    });
  }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  generatePPT
};