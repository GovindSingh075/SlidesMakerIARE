import React, { useState } from "react";
import {
  ArrowLeft,
  Bold,
  Image,
  LayoutGrid,
  Save,
  Sparkles,
  Square,
  Type,
  Undo2,
  Download
} from "lucide-react";

import { request } from "../api";

export function Editor({ presentation, onBack }) {

  // -----------------------------------------
  // GET PRESENTATION DATA
  // -----------------------------------------

  const presentationData =
    typeof presentation.data === "string"
      ? JSON.parse(presentation.data || "{}")
      : presentation.data || {};

  const initialSlides =
    presentationData.slides ||
    [
      {
        id: 1,
        title: "Introduction",
        body: "Double-click and start writing."
      }
    ];

  const [slides, setSlides] = useState(initialSlides);

  const [active, setActive] = useState(0);

  const [title, setTitle] = useState(
    presentation.title || "Untitled Presentation"
  );

  const [saved, setSaved] = useState(false);

  const [generatingPPT, setGeneratingPPT] =
    useState(false);

  const current = slides[active];

  // -----------------------------------------
  // UPDATE SLIDE
  // -----------------------------------------

  function update(key, value) {

    setSlides((oldSlides) =>
      oldSlides.map((slide, index) =>
        index === active
          ? {
              ...slide,
              [key]: value
            }
          : slide
      )
    );

    setSaved(false);
  }

  // -----------------------------------------
  // ADD NEW SLIDE
  // -----------------------------------------

  function addSlide() {

    const newSlide = {
      id: Date.now(),
      title: "New Slide",
      body: "Add your content here."
    };

    setSlides((oldSlides) => [
      ...oldSlides,
      newSlide
    ]);

    setActive(slides.length);

    setSaved(false);
  }

  // -----------------------------------------
  // SAVE PRESENTATION
  // -----------------------------------------

  async function save() {

    try {

      // Keep course/topic/difficulty information
      // instead of replacing it with only slides.

      const updatedData = {
        ...presentationData,
        slides
      };

      await request(
        `/presentations/${presentation.id}`,
        {
          method: "PUT",

          body: JSON.stringify({
            title,
            data: updatedData
          })
        }
      );

      setSaved(true);

    } catch (error) {

      console.error(
        "Save failed:",
        error
      );

      alert(
        "Could not save the presentation."
      );
    }
  }

  // -----------------------------------------
  // GENERATE POWERPOINT
  // -----------------------------------------

  async function generatePPT() {

    try {

      setGeneratingPPT(true);

      // Save latest editor changes first
      await save();

      // Get values from Presentation Details
      const courseTitle =
        presentationData.courseTitle ||
        "Computer Science and Engineering";

      const topicTitle =
        presentationData.topicTitle ||
        title;

      const numberOfSlides =
        Number(
          presentationData.numberOfSlides ||
          slides.length
        );

      const difficulty =
        presentationData.difficulty ||
        "Medium";

      console.log(
        "Sending presentation information:"
      );

      console.log({
        courseTitle,
        topicTitle,
        numberOfSlides,
        difficulty
      });

      // ---------------------------------------
      // CALL BACKEND
      // ---------------------------------------

      const response = await request(
        "/ppt/generate",
        {
          method: "POST",

          body: JSON.stringify({

            courseTitle,

            topicTitle,

            numberOfSlides,

            difficulty

          })
        }
      );

      if (!response.success) {

        throw new Error(
          response.message ||
          "PPT generation failed"
        );
      }

      // ---------------------------------------
      // OPEN GENERATED PPT
      // ---------------------------------------

      const downloadURL =
        `http://localhost:5000${response.file}`;

      window.open(
        downloadURL,
        "_blank"
      );

    } catch (error) {

      console.error(
        "PPT generation error:",
        error
      );

      alert(
        error.message ||
        "Could not generate PowerPoint."
      );

    } finally {

      setGeneratingPPT(false);
    }
  }

  // -----------------------------------------
  // UI
  // -----------------------------------------

  return (

    <div className="editor">

      {/* -------------------------------- */}
      {/* TOP BAR */}
      {/* -------------------------------- */}

      <header className="editor-bar">

        <button
          className="back"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="editor-brand">

          <span className="logo-mark">
            <Sparkles size={14} />
          </span>

          SlidesMakerIARE

        </div>

        <input
          className="doc-title"

          value={title}

          onChange={(e) => {

            setTitle(e.target.value);

            setSaved(false);

          }}
        />

        <div className="editor-actions">

          <span className="saved">

            {saved
              ? "Saved"
              : "Unsaved"}

          </span>

          {/* SAVE */}

          <button
            className="save"
            onClick={save}
          >

            <Save size={16} />

            Save

          </button>

          {/* GENERATE PPT */}

          <button
            className="generate-ppt-btn"
            onClick={generatePPT}
            disabled={generatingPPT}
          >

            <Download size={16} />

            {generatingPPT
              ? "Generating..."
              : "Generate PPT"}

          </button>

        </div>

      </header>


      {/* -------------------------------- */}
      {/* EDITOR BODY */}
      {/* -------------------------------- */}

      <div className="editor-body">


        {/* -------------------------------- */}
        {/* SLIDE LIST */}
        {/* -------------------------------- */}

        <aside className="slide-strip">

          {slides.map((slide, index) => (

            <button
              className={
                "thumb " +
                (
                  index === active
                    ? "active"
                    : ""
                )
              }

              key={slide.id}

              onClick={() =>
                setActive(index)
              }
            >

              <span>
                {index + 1}
              </span>

              <div>

                <b>
                  {slide.title}
                </b>

                <small>
                  {slide.body}
                </small>

              </div>

            </button>

          ))}


          {/* ADD SLIDE */}

          <button
            className="add-slide"
            onClick={addSlide}
          >

            + Add slide

          </button>

        </aside>


        {/* -------------------------------- */}
        {/* MAIN CANVAS */}
        {/* -------------------------------- */}

        <section className="canvas-area">


          {/* TOOLBAR */}

          <div className="toolbar">

            <button>
              <Undo2 size={17} />
            </button>

            <i></i>

            <button>
              <Type size={17} />
            </button>

            <button>
              <Bold size={17} />
            </button>

            <button>
              <Image size={17} />
            </button>

            <button>
              <Square size={17} />
            </button>

            <button>
              <LayoutGrid size={17} />
            </button>

          </div>


          {/* SLIDE */}

          <div className="slide-canvas">

            <div className="slide-number">

              {active + 1}

            </div>


            {/* TITLE */}

            <input
              className="slide-title"

              value={
                current?.title || ""
              }

              onChange={(e) =>
                update(
                  "title",
                  e.target.value
                )
              }

              placeholder="Slide title"
            />


            {/* BODY */}

            <textarea
              className="slide-body"

              value={
                current?.body || ""
              }

              onChange={(e) =>
                update(
                  "body",
                  e.target.value
                )
              }

              placeholder="Write your slide content here..."
            />


            <div className="canvas-decoration"></div>

          </div>

        </section>

      </div>

    </div>
  );
}