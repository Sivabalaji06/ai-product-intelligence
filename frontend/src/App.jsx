import { useMemo, useState } from "react";
import "./App.css";

const API_URL = "https://ai-product-intelligence-y37e.onrender.com/analyze";

function App() {

  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setData(null);
    setError("");
  };

  const analyzeFile = async () => {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.detail ||
            "Something went wrong while analyzing the file."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err.message || "Unable to analyze the CSV file."
      );
    } finally {
      setLoading(false);
    }
  };

  const exportAnalysis = () => {
    if (!data) return;

    const exportData = {
      filename: data.filename,
      total_feedback: data.total_feedback,
      executive_summary: data.executive_summary,
      themes: data.themes,
      priorities: data.priorities,
      feedback: data.items,
    };

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-product-analysis.json";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const items = data?.items || [];
  const themes = data?.themes || [];
  const priorities = data?.priorities || [];

  const sentimentCounts = useMemo(() => {
    const counts = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    items.forEach((item) => {
      const sentiment = String(
        item.sentiment || ""
      ).toLowerCase();

      if (sentiment.includes("positive")) {
        counts.positive++;
      } else if (sentiment.includes("negative")) {
        counts.negative++;
      } else {
        counts.neutral++;
      }
    });

    return counts;
  }, [items]);

  const categoryCounts = useMemo(() => {
    const counts = {};

    items.forEach((item) => {
      const category = item.category || "Other";
      counts[category] =
        (counts[category] || 0) + 1;
    });

    return Object.entries(counts).sort(
      (a, b) => b[1] - a[1]
    );
  }, [items]);

  const topCategory =
    categoryCounts[0]?.[0] || "—";

  const topCategoryCount =
    categoryCounts[0]?.[1] || 0;

  const filteredItems = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    return items.filter((item) => {
      const text = String(
        item.text || ""
      ).toLowerCase();

      const summary = String(
        item.summary || ""
      ).toLowerCase();

      const category = String(
        item.category || ""
      ).toLowerCase();

      const sentiment = String(
        item.sentiment || ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        text.includes(query) ||
        summary.includes(query) ||
        category.includes(query);

      const matchesSentiment =
        sentimentFilter === "all" ||
        sentiment.includes(sentimentFilter);

      return (
        matchesSearch &&
        matchesSentiment
      );
    });
  }, [
    items,
    searchTerm,
    sentimentFilter,
  ]);

  const sortedPriorities = useMemo(() => {
    const order = {
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };

    return priorities
      .slice()
      .sort((a, b) => {
        const aPriority =
          order[
            String(
              a.priority || "MEDIUM"
            ).toUpperCase()
          ] || 2;

        const bPriority =
          order[
            String(
              b.priority || "MEDIUM"
            ).toUpperCase()
          ] || 2;

        return aPriority - bPriority;
      });
  }, [priorities]);

  const getDescription = (item) => {
    return (
      item.description ||
      item.summary ||
      item.rationale ||
      "Customer feedback indicates an important area for product improvement."
    );
  };

  const getAction = (item) => {
    return (
      item.action ||
      item.recommendation ||
      item.recommended_action ||
      item.recommendedAction ||
      "Review this issue with the product team and prioritize it based on customer impact and implementation effort."
    );
  };

  return (
    <div className="app">

      {/* HEADER */}

      <header className="top-header">
        <div className="header-inner">

          <div className="brand">
            <h1>Product Intelligence</h1>

            <span>
              Customer feedback → product decisions
            </span>
          </div>

          <div className="status">
            <span className="status-dot" />
            AI Analysis Ready
          </div>

        </div>
      </header>


      <main className="container">

        {/* HERO */}

        <section className="hero">

          <p className="eyebrow">
            PRODUCT ANALYTICS
          </p>

          <h2>
            Turn customer feedback
            <br />
            into product decisions.
          </h2>

          <p className="hero-description">
            Upload customer feedback and use AI to
            uncover sentiment, themes, product issues,
            and actionable priorities.
          </p>


          {/* CSV UPLOAD */}

<div className="upload-card">

  <div className="upload-content">

    <div className="upload-icon">
      ↑
    </div>

    <div className="upload-text">

      <h3>
        Upload customer feedback
      </h3>

      <p>
        CSV files with a <strong>feedback</strong>,{" "}
        <strong>text</strong>, <strong>review</strong>,{" "}
        <strong>comment</strong>, or <strong>message</strong> column.
      </p>

      <input
        id="csv-upload"
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        className="hidden-file-input"
      />

      <label
        htmlFor="csv-upload"
        className="file-button"
      >
        Choose CSV
      </label>

      {file && (
        <span className="selected-file">
          {file.name}
        </span>
      )}

    </div>

    <button
      type="button"
      className="analyze-button"
      onClick={analyzeFile}
      disabled={!file || loading}
    >
      {loading
        ? "Analyzing..."
        : "Analyze Feedback →"}
    </button>

  </div>

  {error && (
    <div className="error">
      {error}
    </div>
  )}

</div>

        </section>


        {data && (
          <>

            {/* ANALYSIS OVERVIEW */}

            <section className="analysis-section">

              <div className="section-heading">

                <div>
                  <p className="eyebrow">
                    ANALYSIS OVERVIEW
                  </p>

                  <h2>
                    What customers are saying
                  </h2>
                </div>

                <div className="analysis-actions">

                  <span className="filename">
                    {data.filename}
                  </span>

                  <button
                    className="export-button"
                    onClick={exportAnalysis}
                  >
                    Export Analysis
                  </button>

                </div>

              </div>


              {/* EXECUTIVE SUMMARY */}

              <section className="executive-summary">

                <div className="executive-summary-header">

                  <div>
                    <p className="eyebrow">
                      AI EXECUTIVE SUMMARY
                    </p>

                    <h3>
                      What product leaders should know
                    </h3>
                  </div>

                  <span className="ai-badge">
                    AI Generated
                  </span>

                </div>

                <p className="executive-summary-text">
                  {data.executive_summary ||
                    "No executive summary was generated."}
                </p>

              </section>




              {/* STATS */}

              <section className="stats-grid">

                <div className="stat-card">
                  <span className="stat-label">
                    Total Feedback
                  </span>

                  <strong>
                    {items.length}
                  </strong>

                  <span className="stat-description">
                    Customer responses analyzed
                  </span>
                </div>


                <div className="stat-card">
                  <span className="stat-label">
                    Positive
                  </span>

                  <strong>
                    {sentimentCounts.positive}
                  </strong>

                  <span className="stat-description">
                    {items.length
                      ? Math.round(
                          (sentimentCounts.positive /
                            items.length) *
                            100
                        )
                      : 0}
                    % of feedback
                  </span>
                </div>


                <div className="stat-card">
                  <span className="stat-label">
                    Negative
                  </span>

                  <strong>
                    {sentimentCounts.negative}
                  </strong>

                  <span className="stat-description">
                    {items.length
                      ? Math.round(
                          (sentimentCounts.negative /
                            items.length) *
                            100
                        )
                      : 0}
                    % of feedback
                  </span>
                </div>


                <div className="stat-card">
                  <span className="stat-label">
                    Top Category
                  </span>

                  <strong className="stat-category">
                    {topCategory}
                  </strong>

                  <span className="stat-description">
                    {topCategoryCount} mentions
                  </span>
                </div>

              </section>


              {/* SENTIMENT + CATEGORIES */}

              <section className="dashboard-grid">

                <div className="dashboard-card">

                  <p className="eyebrow">
                    SENTIMENT
                  </p>

                  <h3>
                    Customer sentiment
                  </h3>

                  {[
                    [
                      "Positive",
                      sentimentCounts.positive,
                      "positive",
                    ],
                    [
                      "Neutral",
                      sentimentCounts.neutral,
                      "neutral",
                    ],
                    [
                      "Negative",
                      sentimentCounts.negative,
                      "negative",
                    ],
                  ].map(
                    ([label, count, type]) => (

                      <div
                        className="sentiment-row"
                        key={type}
                      >

                        <span>
                          {label}
                        </span>

                        <strong>
                          {count}
                        </strong>

                        <div className="sentiment-bar">

                          <div
                            className={`sentiment-fill ${type}`}
                            style={{
                              width: `${
                                items.length
                                  ? (count /
                                      items.length) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />

                        </div>

                        <span>
                          {items.length
                            ? Math.round(
                                (count /
                                  items.length) *
                                  100
                              )
                            : 0}
                          %
                        </span>

                      </div>

                    )
                  )}

                </div>


                <div className="dashboard-card">

                  <p className="eyebrow">
                    CATEGORIES
                  </p>

                  <h3>
                    Feedback distribution
                  </h3>

                  {categoryCounts.map(
                    ([category, count]) => (

                      <div
                        className="category-row"
                        key={category}
                      >

                        <span>
                          {category}
                        </span>

                        <div className="category-bar">

                          <div
                            className="category-fill"
                            style={{
                              width: `${
                                items.length
                                  ? (count /
                                      items.length) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />

                        </div>

                        <strong>
                          {count}
                        </strong>

                      </div>

                    )
                  )}

                </div>

              </section>


              {/* AI THEMES */}

              <section className="themes-section">

                <div className="section-heading">

                  <div>
                    <p className="eyebrow">
                      AI THEME DETECTION
                    </p>

                    <h2>
                      What patterns are emerging?
                    </h2>
                  </div>

                  <span className="theme-count">
                    {themes.length} themes
                  </span>

                </div>


                <div className="themes-grid">

                  {themes.map(
                    (theme, index) => (

                      <div
                        className="theme-card"
                        key={`${theme.theme_name || "theme"}-${index}`}
                      >

                        <div className="theme-card-top">

                          <span className="theme-number">
                            #{index + 1}
                          </span>

                          <span className="theme-count-badge">
                            {theme.count || 0} mentions
                          </span>

                        </div>

                        <h3>
                          {theme.theme_name ||
                            "Customer Theme"}
                        </h3>

                        <p>
                          {theme.description ||
                            "Customer feedback indicates a recurring product theme."}
                        </p>

                        <div className="theme-meta">

                          <span>
                            Sentiment
                          </span>

                          <strong>
                            {theme.dominant_sentiment ||
                              "Mixed"}
                          </strong>

                        </div>

                        {theme.example_quote && (
                          <div className="theme-quote">
                            "{theme.example_quote}"
                          </div>
                        )}

                      </div>

                    )
                  )}

                </div>

              </section>


              {/* PRODUCT PRIORITIZATION */}

              <section className="section-heading">

                <div>

                  <p className="eyebrow">
                    AI PRODUCT PRIORITIZATION
                  </p>

                  <h2>
                    What should we build first?
                  </h2>

                </div>

                <span className="theme-count">
                  {priorities.length} priorities
                </span>

              </section>


              <section className="priorities-grid">

                {sortedPriorities.map(
                  (priority, index) => (

                    <div
                      className="priority-card"
                      key={`${priority.theme_name || "priority"}-${index}`}
                    >

                      <div className="priority-top">

                        <span className="priority-number">
                          #{index + 1}
                        </span>

                        <span
                          className={`priority-badge ${
                            String(
                              priority.priority ||
                                "MEDIUM"
                            ).toLowerCase()
                          }`}
                        >
                          {priority.priority ||
                            "MEDIUM"}
                        </span>

                      </div>

                      <h3>
                        {priority.theme_name ||
                          "Product Improvement"}
                      </h3>

                      <p>
                        {getDescription(priority)}
                      </p>

                      <div className="priority-meta">

                        <div className="priority-meta-box">

                          <span>
                            IMPACT
                          </span>

                          <strong>
                            {priority.impact ||
                              "Medium"}
                          </strong>

                        </div>

                        <div className="priority-meta-box">

                          <span>
                            EFFORT
                          </span>

                          <strong>
                            {priority.effort ||
                              "Medium"}
                          </strong>

                        </div>

                      </div>

                      <div className="priority-action">

                        <span>
                          RECOMMENDED ACTION
                        </span>

                        <p>
                          {getAction(priority)}
                        </p>

                      </div>

                    </div>

                  )
                )}

              </section>


              {/* TOP PRODUCT ISSUES */}

              <section className="section-heading">

                <div>

                  <p className="eyebrow">
                    TOP PRODUCT ISSUES
                  </p>

                  <h2>
                    What needs attention first?
                  </h2>

                </div>

                <span className="theme-count">
                  Top 3 issues
                </span>

              </section>


              <section className="issues-grid">

                {sortedPriorities
                  .slice(0, 3)
                  .map((issue, index) => (

                    <div
                      className="issue-card"
                      key={`${issue.theme_name || "issue"}-${index}`}
                    >

                      <div className="issue-number">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </div>

                      <div className="issue-content">

                        <div className="issue-top">

                          <span className="issue-label">
                            PRODUCT ISSUE
                          </span>

                          <span
                            className={`priority-badge ${
                              String(
                                issue.priority ||
                                  "MEDIUM"
                              ).toLowerCase()
                            }`}
                          >
                            {issue.priority ||
                              "MEDIUM"}
                          </span>

                        </div>

                        <h3>
                          {issue.theme_name ||
                            "Product Improvement"}
                        </h3>

                        <p>
                          {getDescription(issue)}
                        </p>

                        <div className="issue-action">

                          <span>
                            RECOMMENDED ACTION
                          </span>

                          <strong>
                            {getAction(issue)}
                          </strong>

                        </div>

                      </div>

                    </div>

                  ))}

              </section>


              {/* FEEDBACK EXPLORER */}

              <section className="feedback-section">

                <div className="section-heading">

                  <div>

                    <p className="eyebrow">
                      FEEDBACK EXPLORER
                    </p>

                    <h2>
                      Customer feedback
                    </h2>

                  </div>

                  <span className="theme-count">
                    {filteredItems.length} of{" "}
                    {items.length} shown
                  </span>

                </div>


                <div className="feedback-controls">

                  <input
                    className="feedback-search"
                    type="text"
                    placeholder="Search feedback..."
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value
                      )
                    }
                  />

                  <div className="sentiment-filters">

                    {[
                      "all",
                      "positive",
                      "neutral",
                      "negative",
                    ].map((filter) => (

                      <button
                        key={filter}
                        className={`filter-button ${
                          sentimentFilter === filter
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setSentimentFilter(
                            filter
                          )
                        }
                      >
                        {filter
                          .charAt(0)
                          .toUpperCase() +
                          filter.slice(1)}
                      </button>

                    ))}

                  </div>

                </div>


                <div className="feedback-table-wrapper">

                  <table className="feedback-table">

                    <thead>

                      <tr>
                        <th>FEEDBACK</th>
                        <th>CATEGORY</th>
                        <th>SENTIMENT</th>
                        <th>SUMMARY</th>
                      </tr>

                    </thead>

                    <tbody>

                      {filteredItems.map(
                        (item, index) => (

                          <tr key={index}>

                            <td>
                              {item.text || "—"}
                            </td>

                            <td>
                              <span className="category-pill">
                                {item.category ||
                                  "Other"}
                              </span>
                            </td>

                            <td>

                              <span
                                className={`sentiment-pill ${
                                  String(
                                    item.sentiment ||
                                      "neutral"
                                  ).toLowerCase()
                                }`}
                              >
                                {item.sentiment ||
                                  "Neutral"}
                              </span>

                            </td>

                            <td>
                              {item.summary || "—"}
                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>


                  {filteredItems.length === 0 && (
                    <div className="empty-state">
                      No feedback matches your search.
                    </div>
                  )}

                </div>

              </section>

            </section>

          </>
        )}

      </main>


      <footer>
        AI Product Intelligence Platform
      </footer>

    </div>
  );
}

export default App;