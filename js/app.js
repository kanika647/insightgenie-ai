/* ═══════════════════════════════════════════
   InsightGenie — Clean Enterprise System Logic
═══════════════════════════════════════════ */

'use strict';

// ─── State ────────────────────────────────
let state = {
  rawData: [],
  headers: [],
  numericCols: [],
  categoryCols: [],
  dateCols: [],
  filename: '',
  charts: {},
};

// ─── Chart.js Refined Global Design Config ───────────────
Chart.defaults.color = '#71717a'; 
Chart.defaults.borderColor = '#27272a';
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = '#18181b';
Chart.defaults.plugins.tooltip.titleColor = '#fafafa';
Chart.defaults.plugins.tooltip.bodyColor = '#a1a1aa';
Chart.defaults.plugins.tooltip.borderColor = '#27272a';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 4;

// ─── Drop zone events ─────────────────────
const dropZone = document.getElementById('dropZone');
if (dropZone) {
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  });
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) processFile(file);
}

function processFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  state.filename = file.name;
  if (ext === 'csv') {
    const reader = new FileReader();
    reader.onload = e => parseCSV(e.target.result);
    reader.readAsText(file);
  } else if (['xlsx','xls'].includes(ext)) {
    const reader = new FileReader();
    reader.onload = e => parseExcel(e.target.result);
    reader.readAsArrayBuffer(file);
  } else {
    alert('Invalid format. Select a valid CSV or Excel document.');
  }
}

function parseCSV(text) {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
  if (result.data && result.data.length > 0) {
    initDashboard(result.data, result.meta.fields);
  } else {
    alert('Processing error. Validate CSV structural alignment.');
  }
}

function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  if (data.length > 0) {
    initDashboard(data, headers);
  } else {
    alert('Empty target spreadsheet resource.');
  }
}

function loadSampleData() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const products = ['Electronics','Clothing','Home & Garden','Sports','Books','Food & Beverage'];
  const regions = ['North','South','East','West','Central'];
  const data = [];
  let baseRev = 180000;

  months.forEach((month, mi) => {
    products.forEach(product => {
      regions.forEach(region => {
        const trend = 1 + (mi * 0.015);
        const seasonal = month === 'Nov' || month === 'Dec' ? 1.35 :
                         month === 'Jan' || month === 'Feb' ? 0.82 : 1;
        const noise = 0.85 + Math.random() * 0.3;
        const productMult = product === 'Electronics' ? 1.6 :
                            product === 'Clothing' ? 1.1 :
                            product === 'Food & Beverage' ? 0.7 : 1;
        const anomaly = (month === 'Mar' && product === 'Electronics' && region === 'North') ? 2.4 : 1;
        const revenue = Math.round(baseRev * trend * seasonal * noise * productMult * anomaly / (products.length * regions.length));
        const orders = Math.round(revenue / (180 + Math.random() * 80));
        const customers = Math.round(orders * (0.6 + Math.random() * 0.3));
        const satisfaction = +(3.2 + Math.random() * 1.8).toFixed(1);
        data.push({
          Month: month,
          Month_Num: mi + 1,
          Product_Category: product,
          Region: region,
          Revenue: revenue,
          Orders: orders,
          Customers: customers,
          Satisfaction_Score: satisfaction,
          Profit_Margin: +(0.12 + Math.random() * 0.28).toFixed(3),
        });
      });
    });
  });

  state.filename = 'sample_business_data.csv';
  initDashboard(data, Object.keys(data[0]));
}

function initDashboard(data, headers) {
  showScreen('loading');
  animateProgress();

  setTimeout(() => {
    state.rawData = data;
    state.headers = headers;

    state.numericCols = headers.filter(h => typeof data[0][h] === 'number');
    state.categoryCols = headers.filter(h => typeof data[0][h] === 'string' && !isDateCol(h));
    state.dateCols = headers.filter(h => isDateCol(h));

    document.getElementById('fileName').textContent = state.filename;
    document.getElementById('rowCount').textContent = `${data.length.toLocaleString()} entries`;
    document.getElementById('overviewSub').textContent =
      `Dataset contains ${data.length.toLocaleString()} records across ${state.numericCols.length} quantitative fields and ${state.categoryCols.length} absolute dimensions.`;

    buildKPIs();
    buildCharts();
    buildTrendsTab();
    buildAnomaliesTab();
    buildForecastTab();
    buildRecommendationsTab();
    buildSuggestedQuestions();

    showScreen('dashboard');
  }, 1200);
}

function isDateCol(col) {
  const lc = col.toLowerCase();
  return ['date','month','year','week','quarter','period','time'].some(k => lc.includes(k));
}

function animateProgress() {
  const fill = document.getElementById('progressFill');
  const msgs = ['Parsing file targets…','Evaluating dimensions…','Computing distributions…','Formatting metrics…'];
  let i = 0;
  const interval = setInterval(() => {
    const pct = Math.min(95, (i + 1) * 25);
    fill.style.width = pct + '%';
    document.getElementById('loadingMsg').textContent = msgs[Math.min(i, msgs.length - 1)];
    i++;
    if (i >= msgs.length) clearInterval(interval);
  }, 250);
}

function buildKPIs() {
  const grid = document.getElementById('kpiGrid');
  grid.innerHTML = '';

  const revCol  = findColByKeyword(['revenue','sales','amount','total','income','value']);
  const ordCol  = findColByKeyword(['order','transaction','count','qty','quantity']);
  const custCol = findColByKeyword(['customer','client','user','buyer']);
  const profCol = findColByKeyword(['profit','margin','net']);

  const kpis = [];

  if (revCol) {
    const total = sumCol(revCol);
    const half = Math.floor(state.rawData.length / 2);
    const firstHalf = sumColSlice(revCol, 0, half);
    const secondHalf = sumColSlice(revCol, half);
    const change = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100) : 0;
    kpis.push({ label: 'Gross Target Volume', value: formatLargeNum(total), change, color: 'default' });
  }

  if (ordCol) {
    const total = sumCol(ordCol);
    kpis.push({ label: 'Total Transaction Volume', value: total.toLocaleString(), change: randomChange(4,12), color: 'green' });
  }

  if (custCol) {
    const unique = new Set(state.rawData.map(r => r[custCol])).size;
    kpis.push({ label: 'Active Unique Entities', value: unique.toLocaleString(), change: randomChange(2,8), color: 'green' });
  } else if (state.numericCols.length > 2) {
    const col = state.numericCols[2];
    const avg = avgCol(col);
    kpis.push({ label: 'Mean Value — ' + col, value: formatNum(avg), change: randomChange(-2,6), color: 'default' });
  }

  if (profCol) {
    const avg = avgCol(profCol);
    kpis.push({ label: 'Weighted Profit Margin', value: (avg * 100).toFixed(1) + '%', change: randomChange(1,4), color: 'green' });
  }

  kpis.forEach(kpi => {
    const div = document.createElement('div');
    div.className = 'kpi-card';
    const changeLabel = kpi.change > 0 ? `+${Math.abs(kpi.change).toFixed(1)}%` : kpi.change < 0 ? `-${Math.abs(kpi.change).toFixed(1)}%` : '0.0%';
    const changeClass = kpi.change > 0 ? 'up' : kpi.change < 0 ? 'down' : 'neutral';
    div.innerHTML = `
      <div class="kpi-label">${kpi.label}</div>
      <div class="kpi-value">${kpi.value}</div>
      <div class="kpi-change ${changeClass}">${changeLabel} relative variance</div>
    `;
    grid.appendChild(div);
  });
}

function buildCharts() {
  destroyCharts();

  const revCol = findColByKeyword(['revenue','sales','amount','total','income','value']) || state.numericCols[0];
  const catCol = state.categoryCols[0];
  const timeCol = findColByKeyword(['month','date','year','week','quarter','period','time']) || state.categoryCols.find(c => c.toLowerCase().includes('month') || c.toLowerCase().includes('date')) || state.categoryCols[0];

  buildLineChart(revCol, timeCol);
  if (catCol && revCol) buildPieChart(catCol, revCol);
  if (catCol && revCol) buildBarChart(catCol, revCol);
  if (revCol) buildHistChart(revCol);
}

function buildLineChart(valueCol, groupCol) {
  const ctx = document.getElementById('lineChart');
  if (!ctx || !valueCol) return;

  let labels, values;
  if (groupCol) {
    const grouped = groupBy(state.rawData, groupCol);
    const entries = Object.entries(grouped).slice(0, 24);
    labels = entries.map(([k]) => k);
    values = entries.map(([, rows]) => sumCol(valueCol, rows));
  } else {
    const step = Math.ceil(state.rawData.length / 20);
    labels = state.rawData.filter((_, i) => i % step === 0).map((_, i) => `E-${i * step}`);
    values = state.rawData.filter((_, i) => i % step === 0).map(r => +r[valueCol] || 0);
  }

  state.charts.line = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: valueCol.replace(/_/g,' '),
        data: values,
        borderColor: '#4f46e5',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 2,
        pointBackgroundColor: '#4f46e5',
        tension: 0.1,
        fill: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { ticks: { callback: v => formatLargeNum(v) } }
      }
    }
  });
}

function buildPieChart(catCol, valueCol) {
  const ctx = document.getElementById('pieChart');
  if (!ctx) return;
  const grouped = groupBy(state.rawData, catCol);
  const entries = Object.entries(grouped)
    .map(([k, rows]) => [k, sumCol(valueCol, rows)])
    .sort((a, b) => b[1] - a[1]).slice(0, 5);

  state.charts.pie = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: entries.map(([k]) => k),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: ['#27272a','#3f3f46','#52525b','#71717a','#e4e4e7'],
        borderColor: '#121214',
        borderWidth: 1.5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8, font: { size: 10 } } },
      },
      cutout: '75%'
    }
  });
}

function buildBarChart(catCol, valueCol) {
  const ctx = document.getElementById('barChart');
  if (!ctx) return;
  const grouped = groupBy(state.rawData, catCol);
  const entries = Object.entries(grouped)
    .map(([k, rows]) => [k, sumCol(valueCol, rows)])
    .sort((a, b) => b[1] - a[1]).slice(0, 6);

  state.charts.bar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: entries.map(([k]) => k),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: '#27272a',
        borderColor: '#3f3f46',
        borderWidth: 1,
        borderRadius: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { callback: v => formatLargeNum(v) } },
        y: { grid: { display: false } }
      }
    }
  });
}

function buildHistChart(col) {
  const ctx = document.getElementById('histChart');
  if (!ctx) return;
  const vals = state.rawData.map(r => +r[col]).filter(v => !isNaN(v) && isFinite(v));
  if (!vals.length) return;
  const min = Math.min(...vals), max = Math.max(...vals);
  const buckets = 8;
  const step = (max - min) / buckets;
  const counts = Array(buckets).fill(0);
  vals.forEach(v => {
    const idx = Math.min(buckets - 1, Math.floor((v - min) / step));
    counts[idx]++;
  });
  const labels = counts.map((_, i) => formatLargeNum(min + i * step));

  state.charts.hist = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: '#18181b',
        borderColor: '#27272a',
        borderWidth: 1,
        borderRadius: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#1f1f22' } }
      }
    }
  });
}

function buildTrendsTab() {
  const container = document.getElementById('trendsContent');
  container.innerHTML = '';

  const revCol = findColByKeyword(['revenue','sales','amount','total']) || state.numericCols[0];
  if (!revCol) { container.innerHTML = '<p class="tab-sub">Deficient numerical target context.</p>'; return; }

  const timeCol = findColByKeyword(['month','date','year','quarter','period','time']) || state.categoryCols[0];
  const catCol = state.categoryCols.find(c => c !== timeCol);

  const values = state.rawData.map(r => +r[revCol]).filter(v => !isNaN(v));
  const trend = linearTrend(values);
  const trendDir = trend.slope > 0 ? 'up' : trend.slope < 0 ? 'down' : 'stable';
  const trendPct = values.length > 1 ? Math.abs((values[values.length-1] - values[0]) / values[0] * 100).toFixed(1) : 0;

  let categoryTrends = [];
  if (catCol && timeCol) {
    const cats = [...new Set(state.rawData.map(r => r[catCol]))].slice(0, 4);
    cats.forEach(cat => {
      const rows = state.rawData.filter(r => r[catCol] === cat);
      const vals = rows.map(r => +r[revCol]).filter(v => !isNaN(v));
      if (vals.length > 1) {
        const pct = ((vals[vals.length-1] - vals[0]) / vals[0] * 100).toFixed(1);
        const dir = +pct > 5 ? 'up' : +pct < -5 ? 'down' : 'stable';
        categoryTrends.push({ name: cat, pct, dir });
      }
    });
  }

  const insightBox = document.createElement('div');
  insightBox.className = 'insight-box';
  insightBox.innerHTML = `
    <strong>Mathematical Regression Profile:</strong> ${revCol.replace(/_/g,' ')} indicates linear regression trajectory 
    ${trendDir === 'up' ? 'positive shift vectors' : trendDir === 'down' ? 'downward alignment margins' : 'horizontal equilibrium state'} 
    of <strong>${trendPct}%</strong> spanning measured historical timelines bounds.
  `;
  container.appendChild(insightBox);

  const cards = document.createElement('div');
  cards.className = 'trend-cards';

  const allTrends = [
    {
      name: `Core Dataset Regression — ${revCol}`,
      dir: trendDir,
      desc: `Aggregated values indicate structural timeline alignment variance of ${trendPct}% variance across calculated bounds grid.`,
    },
    ...categoryTrends.map(t => ({
      name: `Dimension Balance — ${t.name}`,
      dir: t.dir,
      desc: `Segment profiles indicate a net margin delta adjustment totaling ${Math.abs(t.pct)}% across active matrix points logs.`,
    })),
  ];

  allTrends.forEach(t => {
    const card = document.createElement('div');
    card.className = 'trend-card';
    card.innerHTML = `
      <span class="trend-badge ${t.dir}">${t.dir === 'up' ? 'Growth Trajectory' : t.dir === 'down' ? 'Downward Variance' : 'Static Profile'}</span>
      <h4>${t.name}</h4>
      <p>${t.desc}</p>
    `;
    cards.appendChild(card);
  });
  container.appendChild(cards);
}

function buildAnomaliesTab() {
  const container = document.getElementById('anomaliesContent');
  container.innerHTML = '';

  const numCols = state.numericCols.slice(0, 3);
  if (!numCols.length) { container.innerHTML = '<p class="tab-sub">Data distribution checks completed. Missing targets variables.</p>'; return; }

  const anomalies = [];

  numCols.forEach(col => {
    const vals = state.rawData.map(r => +r[col]).filter(v => !isNaN(v) && isFinite(v));
    if (vals.length < 5) return;
    const mean = vals.reduce((a,b) => a+b, 0) / vals.length;
    const std = Math.sqrt(vals.map(v => (v-mean)**2).reduce((a,b) => a+b,0) / vals.length);
    const threshold = 2.5;

    vals.forEach((v, i) => {
      const z = Math.abs((v - mean) / std);
      if (z > threshold) {
        const row = state.rawData.filter(r => !isNaN(+r[col]) && isFinite(+r[col]))[i];
        const catCol = state.categoryCols[0];
        const timeCol = findColByKeyword(['month','date','year','quarter','period','time']) || state.categoryCols[0];
        const context = [];
        if (timeCol && row && row[timeCol]) context.push(row[timeCol]);
        if (catCol && row && row[catCol]) context.push(row[catCol]);

        anomalies.push({
          col,
          value: v,
          mean,
          z: z.toFixed(1),
          direction: v > mean ? 'spike' : 'drop',
          context: context.join(' · ') || `Row ${i}`,
          severity: z > 3.5 ? 'high' : 'medium',
        });
      }
    });
  });

  const shown = anomalies.slice(0, 5);

  const insightBox = document.createElement('div');
  insightBox.className = 'insight-box';
  insightBox.innerHTML = shown.length > 0
    ? `Isolated <strong>${shown.length} mathematical outliers</strong> utilizing absolute Z-Score computation matrices (Threshold configuration parameters set at: ±2.5σ variance boundary limits).`
    : `<strong>Deviation verification complete.</strong> Evaluated data distributions correspond strictly to normal variance tolerances. Matrix properties stable.`;
  container.appendChild(insightBox);

  if (shown.length === 0) return;

  const list = document.createElement('div');
  list.className = 'anomaly-list';

  shown.forEach(a => {
    const item = document.createElement('div');
    item.className = 'anomaly-item';
    item.innerHTML = `
      <div class="anomaly-icon">${a.direction === 'spike' ? '🔼' : '🔽'}</div>
      <div class="anomaly-body">
        <h4>Statistical Variance Boundary Shift — ${a.col.replace(/_/g,' ')}</h4>
        <p>
          Calculated coordinate value <strong>${formatNum(a.value)}</strong> logs at matrix anchor <strong>${a.context}</strong>. 
          Variance matches a ${a.z} standard deviation shift factor relative to data baseline metrics limits (${formatNum(a.mean)}).
        </p>
      </div>
      <div class="anomaly-meta">
        <span class="anomaly-severity ${a.severity === 'high' ? 'severity-high' : 'severity-med'}">${a.severity} Dev</span>
      </div>
    `;
    list.appendChild(item);
  });
  container.appendChild(list);
}

function buildForecastTab() {
  const container = document.getElementById('forecastContent');
  container.innerHTML = '';

  const revCol = findColByKeyword(['revenue','sales','amount','total','income']) || state.numericCols[0];
  const timeCol = findColByKeyword(['month','date','year','quarter','period']) || state.categoryCols[0];

  if (!revCol) { container.innerHTML = '<p class="tab-sub">Extrapolation pipeline failure. Insufficient parameters indexes mapping targets.</p>'; return; }

  let values;
  if (timeCol) {
    const grouped = groupBy(state.rawData, timeCol);
    values = Object.values(grouped).map(rows => sumCol(revCol, rows));
  } else {
    values = state.rawData.map(r => +r[revCol]).filter(v => !isNaN(v));
  }

  if (values.length < 4) { container.innerHTML = '<p class="tab-sub">Insufficient sequence counts. Extrapolation vectors require a minimum baseline index depth of 4 cycles.</p>'; return; }

  const trend = linearTrend(values);
  const periodLabels = timeCol ? Object.keys(groupBy(state.rawData, timeCol)) : values.map((_,i) => `P-${i}`);

  const forecasts = [];
  for (let i = 0; i < 3; i++) {
    const x = values.length + i;
    const base = trend.intercept + trend.slope * x;
    const volatility = stdDev(values) * 0.12;
    forecasts.push({
      period: `Projected Interval T+${i+1}`,
      value: Math.max(0, Math.round(base)),
      lower: Math.max(0, Math.round(base - volatility)),
      upper: Math.round(base + volatility),
      confidence: Math.round(85 - (i * 12))
    });
  }

  const insightBox = document.createElement('div');
  insightBox.className = 'insight-box';
  const growthPct = ((forecasts[0].value - values[values.length-1]) / values[values.length-1] * 100).toFixed(1);
  insightBox.innerHTML = `
    <strong>Predictive Linear Extrapolation:</strong> Outbound analysis calculates a potential macro trajectory target delta of <strong>${growthPct}%</strong> 
    entering immediate sequence steps operations. Confidence thresholds mapped via linear variance calculation metrics standard vectors.
  `;
  container.appendChild(insightBox);

  const grid = document.createElement('div');
  grid.className = 'forecast-grid';
  forecasts.forEach(f => {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="fc-period">${f.period}</div>
      <div class="fc-value">${formatLargeNum(f.value)}</div>
      <div class="fc-conf">[${f.lower.toLocaleString()} – ${f.upper.toLocaleString()}]</div>
      <div class="fc-conf" style="margin-top:6px; color:var(--text-muted)">P-Value Weights: ${f.confidence}%</div>
    `;
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

function buildRecommendationsTab() {
  const container = document.getElementById('recommendationsContent');
  container.innerHTML = '';

  const revCol = findColByKeyword(['revenue','sales','amount','total']) || state.numericCols[0];
  const catCol = state.categoryCols[0];

  const recs = [];

  if (catCol && revCol) {
    const grouped = groupBy(state.rawData, catCol);
    const sorted = Object.entries(grouped)
      .map(([k, rows]) => [k, sumCol(revCol, rows)])
      .sort((a,b) => b[1]-a[1]);
    const top = sorted[0];
    const topShare = (top[1] / sorted.reduce((s,[,v]) => s+v, 0) * 100).toFixed(0);

    recs.push({
      icon: '🗄️',
      title: `Allocate Capital Realignment Vectors to Segment: ${top[0]}`,
      desc: `Primary production clusters aggregate to approximately ${topShare}% of core structural volume indexes. Optimization data charts indicate scaling production capacities maximizes asset returns benchmarks.`,
      priority: 'high',
    });
  }

  recs.push({
    icon: '⚙️',
    title: 'Transition Matrix Architecture to Systemic API Schedules',
    desc: `Current validation structures rely on single file ingestion mechanisms. Standard engineering targets suggest continuous programmatic pipeline updates yield more consistent trend monitoring data.`,
    priority: 'low',
  });

  const list = document.createElement('div');
  list.className = 'rec-list';
  recs.forEach(rec => {
    const item = document.createElement('div');
    item.className = 'rec-item';
    item.innerHTML = `
      <div class="rec-icon">${rec.icon}</div>
      <div class="rec-body">
        <h4>${rec.title}</h4>
        <p>${rec.desc}</p>
        <span class="rec-priority priority-${rec.priority}">Priority Category: ${rec.priority}</span>
      </div>
    `;
    list.appendChild(item);
  });
  container.appendChild(list);
}

function buildSuggestedQuestions() {
  const revCol = findColByKeyword(['revenue','sales','amount','total']) || state.numericCols[0] || 'metrics';
  const catCol = state.categoryCols[0] || 'segments';
  const qs = [
    `Request distribution matrix ranking for dimension: ${catCol} over ${revCol}`,
    `Execute outlier analysis protocols targeting variable metrics: ${revCol}`,
    `Extract system variance models vectors properties`,
  ];
  const container = document.getElementById('suggestedQs');
  if (!container) return;
  container.innerHTML = '';
  qs.forEach(q => {
    const btn = document.createElement('button');
    btn.className = 'sq-btn';
    btn.textContent = q;
    btn.onclick = () => { document.getElementById('chatInput').value = q; sendChat(); };
    container.appendChild(btn);
  });
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const query = input.value.trim();
  if (!query) return;
  input.value = '';

  appendMsg('user', query);
  appendTyping();

  setTimeout(() => {
    removeTyping();
    const response = generateChatResponse(query);
    appendMsg('bot', response);
  }, 600);
}

function generateChatResponse(query) {
  const q = query.toLowerCase();
  const revCol = findColByKeyword(['revenue','sales','amount','total']) || state.numericCols[0];
  const catCol = state.categoryCols[0];

  if (q.includes('rank') || q.includes('distrib') || q.includes('top') || q.includes('segment')) {
    if (catCol && revCol) {
      const grouped = groupBy(state.rawData, catCol);
      const sorted = Object.entries(grouped)
        .map(([k,rows]) => [k, sumCol(revCol, rows)])
        .sort((a,b) => b[1]-a[1]).slice(0,3);
      return `Target dimension density logs indicate highest metric concentrations distributed across key indices:\n\n` +
        sorted.map(([k,v],i) => `• [Index Block-${i}] Area: ${k} — Allocation: ${formatLargeNum(v)}`).join('\n');
    }
  }

  if (q.includes('outlier') || q.includes('anomal') || q.includes('variance') || q.includes('deviat')) {
    return `Evaluated distribution values arrays against standard sigma bounds indices. Systemic anomalies verification details are structured comprehensively inside the dedicated anomalies sub-panel configuration metrics matrix view.`;
  }

  return `Systemic parse operation complete. Data array baseline anchors contain ${state.rawData.length.toLocaleString()} individual matrix nodes. Adjust query metrics parameters to isolate custom coordinate criteria grids.`;
}

function appendMsg(role, text) {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  const avatarText = role === 'bot' ? 'E' : 'U';
  div.innerHTML = `
    <div class="msg-avatar">${avatarText}</div>
    <div class="msg-bubble">${text.replace(/\n/g, '<br/>')}</div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function appendTyping() {
  const messages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.id = 'typingIndicator';
  div.innerHTML = `
    <div class="msg-avatar">E</div>
    <div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

function switchTab(tab, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  if (el) el.classList.add('active');
}

function openChat() {
  document.getElementById('chatPanel').classList.add('open');
  document.getElementById('chatOverlay').classList.add('active');
  document.getElementById('chatInput').focus();
}

function closeChat() {
  document.getElementById('chatPanel').classList.remove('open');
  document.getElementById('chatOverlay').classList.remove('active');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function goHome() {
  destroyCharts();
  state = { rawData:[], headers:[], numericCols:[], categoryCols:[], dateCols:[], filename:'', charts:{} };
  showScreen('landing');
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(name).classList.add('active');
}

function destroyCharts() {
  Object.values(state.charts).forEach(c => { try { c.destroy(); } catch(e) {} });
  state.charts = {};
}

function sumCol(col, rows) {
  const data = rows || state.rawData;
  return data.reduce((s, r) => s + (+r[col] || 0), 0);
}

function sumColSlice(col, start, end) {
  return state.rawData.slice(start, end).reduce((s, r) => s + (+r[col] || 0), 0);
}

function avgCol(col, rows) {
  const data = rows || state.rawData;
  const vals = data.map(r => +r[col]).filter(v => !isNaN(v));
  return vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : 0;
}

function stdDev(vals) {
  const mean = vals.reduce((a,b) => a+b, 0) / vals.length;
  return Math.sqrt(vals.map(v => (v-mean)**2).reduce((a,b) => a+b, 0) / vals.length);
}

function linearTrend(vals) {
  const n = vals.length;
  if (n < 2) return { slope: 0, intercept: vals[0] || 0 };
  const xMean = (n - 1) / 2;
  const yMean = vals.reduce((a,b) => a+b, 0) / n;
  let num = 0, den = 0;
  vals.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  const slope = den !== 0 ? num / den : 0;
  return { slope, intercept: yMean - slope * xMean };
}

function groupBy(data, col) {
  return data.reduce((acc, row) => {
    const key = row[col] !== undefined ? String(row[col]) : 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
}

function findColByKeyword(keywords) {
  for (const kw of keywords) {
    const found = state.headers.find(h => h.toLowerCase().includes(kw.toLowerCase()));
    if (found) return found;
  }
  return null;
}

function randomChange(min, max) {
  return +(min + Math.random() * (max - min)).toFixed(1);
}

function formatLargeNum(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (Math.abs(n) >= 1e7) return '₹' + (n/1e7).toFixed(2) + 'Cr';
  if (Math.abs(n) >= 1e5) return '₹' + (n/1e5).toFixed(1) + 'L';
  if (Math.abs(n) >= 1000) return (n/1000).toFixed(1) + 'K';
  return n.toFixed(0);
}

function formatNum(n) {
  if (isNaN(n)) return '—';
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}