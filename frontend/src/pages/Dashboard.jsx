import React, { useEffect, useState } from "react";
import {
  FilePlus2,
  LayoutTemplate,
  LogOut,
  MoreHorizontal,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { request } from "../api";

export function Dashboard({ user, onEdit, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Presentation Details screen
  const [showDetails, setShowDetails] = useState(false);

  const [courseTitle, setCourseTitle] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [numberOfSlides, setNumberOfSlides] = useState(10);
  const [difficulty, setDifficulty] = useState("Medium");

  async function load() {
    try {
      setItems(await request("/presentations"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Open Presentation Details
  function openDetails() {
    setCourseTitle("");
    setTopicTitle("");
    setNumberOfSlides(10);
    setDifficulty("Medium");
    setShowDetails(true);
  }

  // Create presentation after details are entered
  async function createPresentation() {
    if (!topicTitle.trim()) {
      alert("Please enter a presentation topic.");
      return;
    }

    try {
      const slides = [
        {
          id: 1,
          title: topicTitle,
          body: `Course: ${courseTitle || "Computer Science and Engineering"}`
        }
      ];

      // Add additional blank slides
      for (let i = 2; i <= Number(numberOfSlides); i++) {
        slides.push({
          id: Date.now() + i,
          title: `Slide ${i}`,
          body: "Add your content here."
        });
      }

      const data = await request("/presentations", {
        method: "POST",
        body: JSON.stringify({
          title: topicTitle,
          data: {
            courseTitle,
            topicTitle,
            numberOfSlides: Number(numberOfSlides),
            difficulty,
            slides
          }
        })
      });

      setShowDetails(false);

      onEdit({
        id: data.id,
        title: data.title,
        data: {
          courseTitle,
          topicTitle,
          numberOfSlides: Number(numberOfSlides),
          difficulty,
          slides
        }
      });

      load();
    } catch (error) {
      console.error("Create presentation failed:", error);
      alert("Could not create the presentation.");
    }
  }

  // Presentation Details screen
  if (showDetails) {
    return (
      <div className="details-page">

        <header className="topbar">
          <div className="logo">
            <span className="logo-mark">
              <Sparkles size={16} />
            </span>
            SlidesMakerIARE
          </div>

          <div className="top-actions">
            <span className="user-chip">{user.name}</span>

            <button
              className="icon-btn"
              onClick={onLogout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="details-container">

          <button
            className="back-details"
            onClick={() => setShowDetails(false)}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="details-card">

            <div className="details-header">
              <span className="details-icon">
                <Sparkles size={22} />
              </span>

              <div>
                <h1>Create Presentation</h1>
                <p>
                  Enter the details for your presentation.
                </p>
              </div>
            </div>

            {/* Course Title */}
            <label>
              Course / Subject
            </label>

            <input
              type="text"
              className="details-input"
              placeholder="Example: Operating Systems"
              value={courseTitle}
              onChange={(e) =>
                setCourseTitle(e.target.value)
              }
            />

            {/* Topic Title */}
            <label>
              Presentation Topic *
            </label>

            <input
              type="text"
              className="details-input"
              placeholder="Example: Operating System Security"
              value={topicTitle}
              onChange={(e) =>
                setTopicTitle(e.target.value)
              }
            />

            {/* Number of Slides */}
            <label>
              Number of Slides
            </label>

            <select
              className="details-input"
              value={numberOfSlides}
              onChange={(e) =>
                setNumberOfSlides(e.target.value)
              }
            >
              <option value="5">5 Slides</option>
              <option value="6">6 Slides</option>
              <option value="7">7 Slides</option>
              <option value="8">8 Slides</option>
              <option value="9">9 Slides</option>
              <option value="10">10 Slides</option>
              <option value="12">12 Slides</option>
              <option value="15">15 Slides</option>
            </select>

            {/* Difficulty */}
            <label>
              Difficulty Level
            </label>

            <div className="difficulty-options">

              {["Basic", "Medium", "Advanced"].map(
                (level) => (
                  <button
                    key={level}
                    type="button"
                    className={
                      "difficulty-btn " +
                      (difficulty === level
                        ? "selected"
                        : "")
                    }
                    onClick={() =>
                      setDifficulty(level)
                    }
                  >
                    {level}
                  </button>
                )
              )}

            </div>

            {/* Create Button */}
            <button
              className="create-presentation-btn"
              onClick={createPresentation}
            >
              <FilePlus2 size={18} />
              Create Presentation
            </button>

          </div>

        </main>

      </div>
    );
  }

  // Dashboard
  return (
    <div className="app-shell">

      <header className="topbar">

        <div className="logo">
          <span className="logo-mark">
            <Sparkles size={16} />
          </span>

          SlidesMakerIARE
        </div>

        <div className="top-actions">

          <span className="user-chip">
            {user.name}
          </span>

          <button
            className="icon-btn"
            onClick={onLogout}
          >
            <LogOut size={17} />
          </button>

        </div>

      </header>

      <main className="dashboard">

        <div className="hero-row">

          <div>
            <div className="eyebrow">
              WORKSPACE
            </div>

            <h1>
              Your presentations
            </h1>

            <p className="muted">
              Create something worth sharing.
            </p>
          </div>

          <button
            className="primary create"
            onClick={openDetails}
          >
            <FilePlus2 size={18} />
            New presentation
          </button>

        </div>

        <div className="quick-grid">

          <button
            className="template-card blank"
            onClick={openDetails}
          >
            <div className="template-plus">
              +
            </div>

            <strong>
              Start from scratch
            </strong>

            <span>
              Blank presentation
            </span>
          </button>

          <button
            className="template-card purple"
            onClick={() => {
              setCourseTitle("");
              setTopicTitle("Pitch Deck");
              setNumberOfSlides(10);
              setDifficulty("Medium");
              setShowDetails(true);
            }}
          >
            <span className="mini-label">
              PITCH
            </span>

            <strong>
              Pitch deck
            </strong>

            <span>
              Clean and focused
            </span>
          </button>

          <button
            className="template-card dark"
            onClick={() => {
              setCourseTitle("");
              setTopicTitle("Project Report");
              setNumberOfSlides(10);
              setDifficulty("Medium");
              setShowDetails(true);
            }}
          >
            <span className="mini-label">
              REPORT
            </span>

            <strong>
              Project report
            </strong>

            <span>
              Structured storytelling
            </span>
          </button>

        </div>

        <div className="section-head">

          <h2>
            Recent
          </h2>

          <LayoutTemplate size={19} />

        </div>

        {loading ? (
          <p className="muted">
            Loading…
          </p>
        ) : (
          <div className="presentation-grid">

            {items.length === 0 && (
              <div className="empty">
                No presentations yet.
                Create your first one.
              </div>
            )}

            {items.map((p) => (
              <button
                className="presentation-card"
                key={p.id}
                onClick={() => onEdit(p)}
              >

                <div className="preview">

                  <div className="preview-line"></div>

                  <div className="preview-title">
                    {p.title}
                  </div>

                  <div className="preview-small"></div>

                </div>

                <div className="card-meta">

                  <strong>
                    {p.title}
                  </strong>

                  <MoreHorizontal size={17} />

                </div>

              </button>
            ))}

          </div>
        )}

      </main>

    </div>
  );
}