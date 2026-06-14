# InsightGenie AI 🔮
### AI-Powered Business Intelligence Dashboard

> **HackGenome 2026 · Track 1: Talking Rabbitt · Team KPTechz 2.O**  
> Pragati Gupta & Kanika Verma

---

## What is InsightGenie AI?

InsightGenie AI transforms raw Excel and CSV business data into interactive dashboards, actionable insights, and intelligent recommendations — no technical expertise required.

Upload your data. Ask questions in plain English. Get answers in seconds.

---

## Features

| Feature | Description |
|---|---|
| 📊 **Auto KPI Dashboard** | Revenue, orders, customers, margins — extracted and displayed automatically |
| 🔍 **Anomaly Detection** | Z-score analysis flags unusual spikes and drops |
| 📈 **Trend Analysis** | Linear trend detection per category with visual trend lines |
| 🔮 **Forecasting** | Next-period predictions with confidence intervals |
| 💬 **Conversational AI** | Ask questions like "What caused the sales drop?" in plain English |
| 🎯 **Smart Recommendations** | Prioritised, data-driven strategic action items |

---

## Getting Started

### Option 1 — Open directly in browser

```bash
git clone https://github.com/your-repo/insightgenie-ai.git
cd insightgenie-ai
open index.html    # macOS
# or double-click index.html on Windows/Linux
```

No build step, no npm install, no server required.

### Option 2 — Serve locally (recommended for file upload)

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

Then visit `http://localhost:8080`

---

## How to Use

1. **Upload** a `.csv` or `.xlsx` file (or click **"Try sample dataset"**)
2. The dashboard auto-generates KPIs and charts
3. Navigate tabs: **Overview → Trends → Anomalies → Forecast → Recommendations**
4. Click **"Ask InsightGenie"** to chat with the AI assistant
5. Ask natural questions about your data

### Sample Questions
- *"What are the top product categories?"*
- *"Is there any anomaly in revenue?"*
- *"What is the overall trend?"*
- *"What should we focus on next quarter?"*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| Charts | Chart.js 4.4 |
| CSV Parsing | PapaParse 5.4 |
| Excel Parsing | SheetJS (xlsx) 0.18 |
| AI Analysis | Client-side statistical engine (Z-score, linear regression) |

> **Note:** All analysis runs client-side — no data is sent to any server. Your data stays in your browser.

---

## Project Structure

```
insightgenie-ai/
├── index.html          # Main application
├── css/
│   └── style.css       # All styles
├── js/
│   └── app.js          # Application logic
└── README.md
```

---

## Roadmap (Phase 2)

- [ ] Real-time data streaming integration
- [ ] Voice-based analytics assistant
- [ ] Multi-language support (Hindi, Tamil, etc.)
- [ ] ERP & CRM integration (Tally, Zoho, Salesforce)
- [ ] Automated PDF report generation
- [ ] Industry-specific templates (Retail, Finance, E-commerce)
- [ ] Mobile application (React Native)
- [ ] Cloud data connectors (Google Sheets, Airtable)

---

## Team

**Pragati Gupta** · pragatigupta02508@gmail.com  
**Kanika Verma**  · kanikaverma1811@gmail.com  


---

## License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ for HackGenome 2026*
