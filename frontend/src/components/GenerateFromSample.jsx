import React, { useEffect, useMemo, useState } from 'react';
import SvgIcon from '@mui/material/SvgIcon';

const UploadStageIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M19 20H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.2L10 4h4l1.8 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2ZM12 9l-3 3h2v4h2v-4h2l-3-3Z" />
  </SvgIcon>
);

const SynthStageIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M12 2 4 6v5c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V6l-8-4Zm0 2.2 5.8 2.9v3.8c0 3.9-2.4 7.6-5.8 8.8-3.4-1.2-5.8-4.9-5.8-8.8V7.1L12 4.2Zm-1 3.3v5l4.2 2.5 1-1.7-3.2-1.9V7.5H11Z" />
  </SvgIcon>
);

const ParametersStageIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M19.14 12.94a7.49 7.49 0 0 0 .05-.94 7.49 7.49 0 0 0-.05-.94l2.03-1.58-1.92-3.32-2.39.96a7.7 7.7 0 0 0-1.63-.94L14.5 2h-5l-.73 4.18c-.58.23-1.12.54-1.63.94l-2.39-.96-1.92 3.32 2.03 1.58a7.49 7.49 0 0 0-.05.94c0 .32.02.63.05.94l-2.03 1.58 1.92 3.32 2.39-.96c.5.4 1.05.72 1.63.94L9.5 22h5l.73-4.18c.58-.23 1.12-.54 1.63-.94l2.39.96 1.92-3.32-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
  </SvgIcon>
);

const GenerateStageIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" />
  </SvgIcon>
);

const EvaluateStageIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M4 5h16v2H4V5Zm0 6h10v2H4v-2Zm0 6h7v2H4v-2Zm12.3 1.7-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4-6 6Z" />
  </SvgIcon>
);

const VisualizeStageIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M5 19h14v2H3V5h2v14Zm2-2V9h2v8H7Zm4 0V5h2v12h-2Zm4 0v-6h2v6h-2Z" />
  </SvgIcon>
);

const SYNTHESIZER_OPTIONS = [
  {
    value: 'gaussian_copula',
    label: 'Gaussian Copula',
    description: 'Fast baseline for structured single-table datasets.',
  },
  {
    value: 'ctgan',
    label: 'CTGAN',
    description: 'Neural synthesizer for richer and more complex tabular patterns.',
  },
];

const DEFAULT_PREVIEW_ROWS = 10;
const MAX_PREVIEW_ROWS = 50;

function clampPreviewRows(value, totalRows) {
  const safeMax = Math.max(1, Math.min(MAX_PREVIEW_ROWS, totalRows || MAX_PREVIEW_ROWS));
  const numericValue = Number(value) || 1;
  return Math.min(Math.max(numericValue, 1), safeMax);
}

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function formatDetailRow(row) {
  return Object.entries(row || {})
    .map(([key, value]) => `${key}: ${String(value ?? '—')}`)
    .join(' • ');
}

function PreviewTable({ title, rows, emptyMessage, rowLimit, onRowLimitChange, totalRows }) {
  if (!rows?.length) {
    return (
      <section className="preview-panel">
        <div className="preview-panel-head">
          <h3>{title}</h3>
        </div>
        <div className="empty-preview">{emptyMessage}</div>
      </section>
    );
  }

  const columns = Object.keys(rows[0] ?? {});
  const safeMax = Math.max(1, Math.min(MAX_PREVIEW_ROWS, totalRows || rows.length));
  const safeRowLimit = clampPreviewRows(rowLimit, safeMax);
  const visibleRows = rows.slice(0, Math.min(safeRowLimit, rows.length));

  return (
    <section className="preview-panel">
      <div className="preview-panel-head">
        <div>
          <h3>{title}</h3>
          <span>{visibleRows.length} of {safeMax} row(s) shown</span>
        </div>

        <label className="row-limit-control">
          <span>Rows to preview</span>
          <input
            className="row-limit-input"
            type="number"
            min="1"
            max={safeMax}
            value={safeRowLimit}
            onChange={(event) => onRowLimitChange(clampPreviewRows(event.target.value, safeMax))}
          />
        </label>
      </div>

      <div className="preview-table-wrapper">
        <table className="preview-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`}>
                {columns.map((column) => (
                  <td key={`${title}-${rowIndex}-${column}`}>{String(row[column] ?? '—')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EvaluationReportCard({ title, report, emptyMessage }) {
  if (!report) {
    return (
      <section className="report-card empty">
        <div className="empty-preview">{emptyMessage}</div>
      </section>
    );
  }

  const detailEntries = Object.entries(report.details || {}).slice(0, 2);

  return (
    <section className="report-card">
      <div className="report-card-head">
        <div>
          <span className="status-eyebrow">On-demand report</span>
          <h4>{title}</h4>
        </div>
        <strong className="report-score">{formatPercent(report.score)}</strong>
      </div>

      <div className="report-property-grid">
        {(report.properties || []).map((property) => (
          <div className="report-property-row" key={property.name}>
            <div className="report-property-meta">
              <span>{property.name}</span>
              <strong>{formatPercent(property.score)}</strong>
            </div>
            <div className="metric-track">
              <div className="metric-fill" style={{ width: `${Math.max(0, Math.min(property.score, 100))}%` }} />
            </div>
          </div>
        ))}
      </div>

      {detailEntries.length > 0 && detailEntries.map(([sectionName, rows]) => (
        <div className="report-detail-block" key={sectionName}>
          <h5>{sectionName}</h5>
          {rows?.length ? (
            <ul className="report-detail-list">
              {rows.slice(0, 4).map((row, index) => (
                <li key={`${sectionName}-${index}`}>{formatDetailRow(row)}</li>
              ))}
            </ul>
          ) : (
            <p className="helper-text">No detailed findings were returned for this section.</p>
          )}
        </div>
      ))}
    </section>
  );
}

function VisualizationChart({ chartData, emptyMessage }) {
  if (!chartData) {
    return <div className="empty-preview chart-empty">{emptyMessage}</div>;
  }

  if (chartData.chart_type === 'scatter') {
    const allPoints = [...(chartData.real_points || []), ...(chartData.synthetic_points || [])];
    const xValues = allPoints.map((point) => Number(point[chartData.primary_column])).filter((value) => Number.isFinite(value));
    const yValues = allPoints.map((point) => Number(point[chartData.secondary_column])).filter((value) => Number.isFinite(value));

    if (!xValues.length || !yValues.length) {
      return <div className="empty-preview chart-empty">Not enough numeric values are available for a scatter comparison.</div>;
    }

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    const normalize = (value, min, max) => {
      if (max === min) return 50;
      return ((value - min) / (max - min)) * 100;
    };

    return (
      <section className="chart-card">
        <div className="chart-card-head">
          <div>
            <h4>{chartData.primary_column} vs {chartData.secondary_column}</h4>
            <p>Scatter comparison across sampled real and synthetic points.</p>
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-swatch real" />Real</span>
            <span className="legend-item"><span className="legend-swatch synthetic" />Synthetic</span>
          </div>
        </div>

        <div className="scatter-plot" aria-label="Scatter plot comparison">
          {(chartData.real_points || []).map((point, index) => (
            <span
              key={`real-${index}`}
              className="plot-point real"
              style={{
                left: `${normalize(Number(point[chartData.primary_column]), minX, maxX)}%`,
                bottom: `${normalize(Number(point[chartData.secondary_column]), minY, maxY)}%`,
              }}
              title={`Real • ${chartData.primary_column}: ${point[chartData.primary_column]} • ${chartData.secondary_column}: ${point[chartData.secondary_column]}`}
            />
          ))}
          {(chartData.synthetic_points || []).map((point, index) => (
            <span
              key={`synthetic-${index}`}
              className="plot-point synthetic"
              style={{
                left: `${normalize(Number(point[chartData.primary_column]), minX, maxX)}%`,
                bottom: `${normalize(Number(point[chartData.secondary_column]), minY, maxY)}%`,
              }}
              title={`Synthetic • ${chartData.primary_column}: ${point[chartData.primary_column]} • ${chartData.secondary_column}: ${point[chartData.secondary_column]}`}
            />
          ))}
        </div>

        <div className="scatter-axis-note">
          <span>{chartData.primary_column}</span>
          <span>{chartData.secondary_column}</span>
        </div>
      </section>
    );
  }

  const series = chartData.series || [];
  const maxValue = Math.max(1, ...series.map((item) => Math.max(item.real || 0, item.synthetic || 0)));

  return (
    <section className="chart-card">
      <div className="chart-card-head">
        <div>
          <h4>{chartData.primary_column}</h4>
          <p>
            {chartData.kind === 'numeric'
              ? 'Binned distribution comparison for numeric values.'
              : 'Category frequency comparison for the selected field.'}
          </p>
        </div>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-swatch real" />Real</span>
          <span className="legend-item"><span className="legend-swatch synthetic" />Synthetic</span>
        </div>
      </div>

      <div className="chart-bars">
        {series.map((item) => (
          <div className="chart-bar-row" key={item.label}>
            <span className="chart-bar-label">{item.label}</span>
            <div className="chart-bar-stack">
              <div className="chart-bar-track">
                <div className="chart-bar-shell">
                  <div className="chart-bar-fill real" style={{ width: `${((item.real || 0) / maxValue) * 100}%` }} />
                </div>
                <span className="chart-bar-value">{item.real || 0}</span>
              </div>
              <div className="chart-bar-track">
                <div className="chart-bar-shell">
                  <div className="chart-bar-fill synthetic" style={{ width: `${((item.synthetic || 0) / maxValue) * 100}%` }} />
                </div>
                <span className="chart-bar-value">{item.synthetic || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GenerateFromSample() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [synthesizer, setSynthesizer] = useState('gaussian_copula');
  const [numRows, setNumRows] = useState(100);
  const [ctganEpochs, setCtganEpochs] = useState(300);
  const [enforceMinMax, setEnforceMinMax] = useState(true);
  const [enforceRounding, setEnforceRounding] = useState(true);
  const [inputPreview, setInputPreview] = useState([]);
  const [syntheticPreview, setSyntheticPreview] = useState([]);
  const [inputSummary, setInputSummary] = useState(null);
  const [generatedSummary, setGeneratedSummary] = useState(null);
  const [statusCard, setStatusCard] = useState(null);
  const [inputPreviewRows, setInputPreviewRows] = useState(DEFAULT_PREVIEW_ROWS);
  const [outputPreviewRows, setOutputPreviewRows] = useState(DEFAULT_PREVIEW_ROWS);
  const [progressPercent, setProgressPercent] = useState(0);
  const [evaluationResults, setEvaluationResults] = useState({ diagnostic: null, quality: null });
  const [visualizationResult, setVisualizationResult] = useState(null);
  const [chartMode, setChartMode] = useState('1d');
  const [primaryColumn, setPrimaryColumn] = useState('');
  const [secondaryColumn, setSecondaryColumn] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [isRunningQuality, setIsRunningQuality] = useState(false);
  const [isBuildingChart, setIsBuildingChart] = useState(false);

  const selectedSynthesizer = useMemo(
    () => SYNTHESIZER_OPTIONS.find((option) => option.value === synthesizer) ?? SYNTHESIZER_OPTIONS[0],
    [synthesizer]
  );

  const hasValidParameters = numRows > 0 && (synthesizer !== 'ctgan' || ctganEpochs > 0);
  const availableColumns = inputSummary?.columns || [];
  const canRunInsights = Boolean(selectedFile && generatedSummary?.output_file);

  useEffect(() => {
    if (!availableColumns.length) {
      setPrimaryColumn('');
      setSecondaryColumn('');
      return;
    }

    setPrimaryColumn((current) => (availableColumns.includes(current) ? current : availableColumns[0]));
  }, [availableColumns]);

  useEffect(() => {
    if (!availableColumns.length) {
      setSecondaryColumn('');
      return;
    }

    const fallbackSecondary = availableColumns.find((column) => column !== primaryColumn) || availableColumns[0];
    setSecondaryColumn((current) => (
      current && availableColumns.includes(current) && current !== primaryColumn ? current : fallbackSecondary
    ));
  }, [availableColumns, primaryColumn]);

  const progressLabel = useMemo(() => {
    if (progressPercent <= 0) return '';
    if (progressPercent < 25) return 'Uploading sample data';
    if (progressPercent < 50) return 'Inspecting table structure';
    if (progressPercent < 80) return `Training ${selectedSynthesizer.label}`;
    if (progressPercent < 100) return 'Sampling synthetic rows';
    return 'Generation complete';
  }, [progressPercent, selectedSynthesizer.label]);

  const stageItems = useMemo(() => {
    const hasGeneratedOutput = Boolean(generatedSummary?.output_file || syntheticPreview.length);
    const hasEvaluatedOutput = Boolean(evaluationResults.diagnostic || evaluationResults.quality);
    const hasVisualizedOutput = Boolean(visualizationResult);

    return [
      {
        key: 'upload',
        label: 'File Upload',
        status: selectedFile ? 'complete' : 'current',
        Icon: UploadStageIcon,
      },
      {
        key: 'synthesizer',
        label: 'Select Synthesizer',
        status: !selectedFile ? 'pending' : 'complete',
        Icon: SynthStageIcon,
      },
      {
        key: 'parameters',
        label: 'Select Parameters',
        status: !selectedFile ? 'pending' : hasValidParameters ? 'complete' : 'current',
        Icon: ParametersStageIcon,
      },
      {
        key: 'generate',
        label: 'Generate',
        status: !selectedFile || !hasValidParameters ? 'pending' : hasGeneratedOutput ? 'complete' : 'current',
        Icon: GenerateStageIcon,
      },
      {
        key: 'evaluate',
        label: 'Evaluate',
        status: !hasGeneratedOutput ? 'pending' : hasEvaluatedOutput ? 'complete' : (isRunningDiagnostic || isRunningQuality ? 'current' : 'current'),
        Icon: EvaluateStageIcon,
      },
      {
        key: 'visualize',
        label: 'Visualize',
        status: !hasGeneratedOutput ? 'pending' : hasVisualizedOutput ? 'complete' : (isBuildingChart || hasEvaluatedOutput ? 'current' : 'pending'),
        Icon: VisualizeStageIcon,
      },
    ];
  }, [
    selectedFile,
    hasValidParameters,
    syntheticPreview.length,
    generatedSummary,
    evaluationResults,
    visualizationResult,
    isRunningDiagnostic,
    isRunningQuality,
    isBuildingChart,
  ]);

  const resetPreviewState = () => {
    setInputPreview([]);
    setSyntheticPreview([]);
    setInputSummary(null);
    setGeneratedSummary(null);
    setEvaluationResults({ diagnostic: null, quality: null });
    setVisualizationResult(null);
    setPrimaryColumn('');
    setSecondaryColumn('');
    setInputPreviewRows(DEFAULT_PREVIEW_ROWS);
    setOutputPreviewRows(DEFAULT_PREVIEW_ROWS);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    resetPreviewState();

    setStatusCard(
      file
        ? {
            type: 'info',
            title: 'Sample file ready',
            description: `${file.name} is selected. Preview the input or continue to generation when ready.`,
            items: [{ label: 'Selected file', value: file.name }],
          }
        : null
    );
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      setStatusCard({
        type: 'error',
        title: 'No file selected',
        description: 'Please choose a CSV or Excel file before previewing the input data.',
      });
      return;
    }

    setIsPreviewLoading(true);
    setStatusCard({
      type: 'info',
      title: 'Preparing preview',
      description: 'Inspecting the uploaded sample data and building a preview for review.',
    });

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/generate-from-sample/preview-input', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to preview the input data.');
      }

      setInputPreview(data.preview || []);
      setInputSummary({
        row_count: data.row_count,
        column_count: data.column_count,
        columns: data.columns || [],
      });
      setInputPreviewRows(Math.min(DEFAULT_PREVIEW_ROWS, data.row_count, MAX_PREVIEW_ROWS));

      setStatusCard({
        type: 'success',
        title: 'Preview ready',
        description: `The uploaded dataset has been profiled successfully and is ready for generation.`,
        items: [
          { label: 'File name', value: data.file_name },
          { label: 'Rows detected', value: String(data.row_count) },
          { label: 'Columns detected', value: String(data.column_count) },
        ],
      });
    } catch (error) {
      setStatusCard({
        type: 'error',
        title: 'Preview failed',
        description: error.message,
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setStatusCard({
        type: 'error',
        title: 'No file selected',
        description: 'Please choose a CSV or Excel file before generating synthetic data.',
      });
      return;
    }

    setIsGenerating(true);
    setProgressPercent(8);
    setEvaluationResults({ diagnostic: null, quality: null });
    setVisualizationResult(null);
    setStatusCard({
      type: 'info',
      title: 'Generation in progress',
      description: `Training ${selectedSynthesizer.label}. This can take a moment depending on the file size and synthesizer settings.`,
    });

    const progressTimer = window.setInterval(() => {
      setProgressPercent((current) => {
        if (current >= 92) {
          return current;
        }

        if (current < 25) return current + 9;
        if (current < 55) return current + 6;
        if (current < 80) return current + 4;
        return current + 2;
      });
    }, 450);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('synthesizer_name', synthesizer);
    formData.append('num_rows', String(numRows));
    formData.append('ctgan_epochs', String(ctganEpochs));
    formData.append('enforce_min_max_values', String(enforceMinMax));
    formData.append('enforce_rounding', String(enforceRounding));

    try {
      const response = await fetch('/generate-from-sample/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Synthetic data generation failed.');
      }

      setProgressPercent(100);
      setInputPreview(data.real_preview || []);
      setSyntheticPreview(data.synthetic_preview || []);
      setInputSummary(data.input_summary || null);
      setGeneratedSummary({
        row_count: data.num_rows_generated,
        output_file: data.output_file,
        synthesizer: data.synthesizer,
      });
      setInputPreviewRows(Math.min(DEFAULT_PREVIEW_ROWS, data.input_summary?.row_count || DEFAULT_PREVIEW_ROWS, MAX_PREVIEW_ROWS));
      setOutputPreviewRows(Math.min(DEFAULT_PREVIEW_ROWS, data.num_rows_generated || DEFAULT_PREVIEW_ROWS, MAX_PREVIEW_ROWS));

      setStatusCard({
        type: 'success',
        title: 'Synthetic data generated',
        description: `${data.synthesizer} completed successfully and the generated dataset is ready for review, evaluation, and visual comparison.`,
        items: [
          { label: 'Generated rows', value: String(data.num_rows_generated) },
          { label: 'Synthesizer', value: data.synthesizer },
          { label: 'Output file', value: data.output_file },
        ],
      });
    } catch (error) {
      setStatusCard({
        type: 'error',
        title: 'Generation failed',
        description: error.message,
      });
    } finally {
      window.clearInterval(progressTimer);
      setIsGenerating(false);
      window.setTimeout(() => setProgressPercent(0), 1200);
    }
  };

  const handleRunEvaluation = async (reportType) => {
    if (!selectedFile || !generatedSummary?.output_file) {
      setStatusCard({
        type: 'error',
        title: 'Synthetic output required',
        description: 'Generate synthetic data first, then run diagnostics or quality scoring.',
      });
      return;
    }

    const setLoadingState = reportType === 'diagnostic' ? setIsRunningDiagnostic : setIsRunningQuality;
    const friendlyLabel = reportType === 'diagnostic' ? 'diagnostic checks' : 'data quality scoring';

    setLoadingState(true);
    setStatusCard({
      type: 'info',
      title: 'Evaluation in progress',
      description: `Running ${friendlyLabel} against the real and synthetic datasets.`,
    });

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('output_file', generatedSummary.output_file);
    formData.append('report_type', reportType);

    try {
      const response = await fetch('/generate-from-sample/evaluate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to run the requested evaluation report.');
      }

      setEvaluationResults((current) => ({
        diagnostic: data.diagnostic ?? current.diagnostic,
        quality: data.quality ?? current.quality,
      }));

      const report = data[reportType];
      setStatusCard({
        type: 'success',
        title: reportType === 'diagnostic' ? 'Diagnostics complete' : 'Quality report complete',
        description: `The ${friendlyLabel} finished successfully and the results are now available below.`,
        items: report
          ? [
              { label: 'Overall score', value: formatPercent(report.score) },
              { label: 'Report type', value: reportType === 'diagnostic' ? 'Diagnostic' : 'Quality' },
            ]
          : [],
      });
    } catch (error) {
      setStatusCard({
        type: 'error',
        title: 'Evaluation failed',
        description: error.message,
      });
    } finally {
      setLoadingState(false);
    }
  };

  const handleBuildVisualization = async () => {
    if (!selectedFile || !generatedSummary?.output_file) {
      setStatusCard({
        type: 'error',
        title: 'Synthetic output required',
        description: 'Generate synthetic data first, then request a comparison chart.',
      });
      return;
    }

    if (!primaryColumn) {
      setStatusCard({
        type: 'error',
        title: 'Primary column required',
        description: 'Choose at least one column for the comparison chart.',
      });
      return;
    }

    if (chartMode === '2d' && (!secondaryColumn || primaryColumn === secondaryColumn)) {
      setStatusCard({
        type: 'error',
        title: 'Two distinct columns required',
        description: 'Pick a different secondary column for the 2D relationship view.',
      });
      return;
    }

    setIsBuildingChart(true);
    setStatusCard({
      type: 'info',
      title: 'Building visualization',
      description: 'Preparing the real-versus-synthetic chart for the selected columns.',
    });

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('output_file', generatedSummary.output_file);
    formData.append('chart_mode', chartMode);
    formData.append('primary_column', primaryColumn);
    if (chartMode === '2d' && secondaryColumn) {
      formData.append('secondary_column', secondaryColumn);
    }

    try {
      const response = await fetch('/generate-from-sample/visualize', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to build the comparison chart.');
      }

      setVisualizationResult(data);
      setStatusCard({
        type: 'success',
        title: 'Visualization ready',
        description: 'The comparison chart has been prepared and is ready for review below.',
        items: [
          { label: 'Mode', value: chartMode === '2d' ? '2D relationship' : '1D distribution' },
          { label: 'Primary column', value: primaryColumn },
          ...(chartMode === '2d' ? [{ label: 'Secondary column', value: secondaryColumn }] : []),
        ],
      });
    } catch (error) {
      setStatusCard({
        type: 'error',
        title: 'Visualization failed',
        description: error.message,
      });
    } finally {
      setIsBuildingChart(false);
    }
  };

  return (
    <section className="card sample-workspace">
      <section className="progress-journey-panel" aria-label="Sample workflow progress tracker">
        <div className="progress-journey-head">
          <div>
            <span className="status-eyebrow">Workflow Progress</span>
            <h3>Sample workflow stages</h3>
            <p>These stages update automatically as you move through the process. They are progress indicators, not buttons.</p>
          </div>

          <div className="journey-legend" aria-hidden="true">
            <span className="legend-chip pending">Pending</span>
            <span className="legend-chip current">Active</span>
            <span className="legend-chip complete">Done</span>
          </div>
        </div>

        <section className="journey-stages" aria-label="Sample generation progress stages">
          {stageItems.map((stage) => {
            const StageIcon = stage.Icon;
            const statusText = stage.status === 'complete' ? 'Done' : stage.status === 'current' ? 'Active' : 'Pending';

            return (
              <div key={stage.key} className={`journey-stage ${stage.status}`}>
                <span className="journey-stage-icon" aria-hidden="true">
                  <StageIcon fontSize="small" />
                </span>
                <span className="journey-stage-copy">
                  <strong>{stage.label}</strong>
                  <small>{statusText}</small>
                </span>
              </div>
            );
          })}
        </section>
      </section>

      <div className="section-heading">
        <div>
          <h2>Generate from Sample Data</h2>
          <p>
            Upload CSV or Excel data, choose a single-table synthesizer, and preview both the original and
            generated sample rows.
          </p>
        </div>
      </div>

      <form className="sample-form" onSubmit={handleSubmit}>
        <div className="options-grid">
          <div className="form-group">
            <label htmlFor="file-upload">Upload sample file</label>
            <input
              id="file-upload"
              className="themed-file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
            />
            <div className="file-upload-meta">
              <span className={`file-selection-chip ${selectedFile ? 'selected' : ''}`}>
                {selectedFile ? `Selected: ${selectedFile.name}` : 'No file selected yet'}
              </span>
            </div>
            <p className="helper-text file-input-helper">Accepted formats: `.csv`, `.xlsx`, `.xls`</p>
          </div>

          <div className="form-group">
            <label htmlFor="synthesizer-select">Choose synthesizer</label>
            <select
              id="synthesizer-select"
              value={synthesizer}
              onChange={(event) => setSynthesizer(event.target.value)}
            >
              {SYNTHESIZER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="helper-text">{selectedSynthesizer.description}</p>
          </div>

          <div className="form-group">
            <label htmlFor="num-rows">Rows to generate</label>
            <input
              id="num-rows"
              type="number"
              min="1"
              value={numRows}
              onChange={(event) => setNumRows(Number(event.target.value) || 0)}
              required
            />
            <p className="helper-text">Controls the size of the generated synthetic dataset.</p>
          </div>

          <div className="form-group">
            <label htmlFor="ctgan-epochs">CTGAN epochs</label>
            <input
              id="ctgan-epochs"
              type="number"
              min="1"
              value={ctganEpochs}
              onChange={(event) => setCtganEpochs(Number(event.target.value) || 1)}
              disabled={synthesizer !== 'ctgan'}
            />
            <p className="helper-text">Used only when CTGAN is selected.</p>
          </div>
        </div>

        <div className="toggle-grid">
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={enforceMinMax}
              onChange={(event) => setEnforceMinMax(event.target.checked)}
            />
            <span>Enforce min/max values</span>
          </label>

          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={enforceRounding}
              onChange={(event) => setEnforceRounding(event.target.checked)}
            />
            <span>Enforce rounding</span>
          </label>
        </div>

        <div className="inline-actions">
          <button type="button" className="secondary-button" onClick={handlePreview} disabled={isPreviewLoading || isGenerating}>
            {isPreviewLoading ? 'Previewing...' : 'Preview Input'}
          </button>
          <button type="submit" disabled={isGenerating || isPreviewLoading}>
            {isGenerating ? 'Generating...' : 'Generate Synthetic Data'}
          </button>
        </div>
      </form>

      {progressPercent > 0 && (
        <section className="progress-card" aria-live="polite">
          <div className="progress-meta">
            <div>
              <strong>{progressLabel}</strong>
              <p>{isGenerating ? 'Please keep this page open while the synthetic data is being prepared.' : 'Completed.'}</p>
            </div>
            <span>{progressPercent}%</span>
          </div>
          <div className="progress-bar-shell">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </section>
      )}

      {inputSummary && (
        <div className="summary-grid">
          <div className="summary-card">
            <span className="summary-label">Source rows</span>
            <strong className="summary-value">{inputSummary.row_count}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Columns detected</span>
            <strong className="summary-value">{inputSummary.column_count}</strong>
          </div>
          <div className="summary-card">
            <span className="summary-label">Active synthesizer</span>
            <strong className="summary-value">{selectedSynthesizer.label}</strong>
          </div>
        </div>
      )}

      {inputSummary?.columns?.length > 0 && (
        <p className="helper-text">Columns: {inputSummary.columns.join(', ')}</p>
      )}

      {statusCard && (
        <section className={`status-card ${statusCard.type}`}>
          <div className="status-card-head">
            <div>
              <span className="status-eyebrow">Workflow status</span>
              <h3>{statusCard.title}</h3>
            </div>
          </div>

          <p className="status-description">{statusCard.description}</p>

          {statusCard.items?.length > 0 && (
            <div className="status-meta-grid">
              {statusCard.items.map((item) => (
                <div className="status-meta-item" key={`${item.label}-${item.value}`}>
                  <span className="status-meta-label">{item.label}</span>
                  <strong className={`status-meta-value ${item.label === 'Output file' ? 'path-value' : ''}`}>
                    {item.value}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="data-preview-grid">
        <PreviewTable
          title="Real Data Preview"
          rows={inputPreview}
          rowLimit={inputPreviewRows}
          onRowLimitChange={setInputPreviewRows}
          totalRows={inputSummary?.row_count || inputPreview.length}
          emptyMessage="Preview the uploaded file to inspect the real data before generation."
        />
        <PreviewTable
          title="Synthetic Data Preview"
          rows={syntheticPreview}
          rowLimit={outputPreviewRows}
          onRowLimitChange={setOutputPreviewRows}
          totalRows={generatedSummary?.row_count || syntheticPreview.length}
          emptyMessage="Generate synthetic data to see the sampled output here."
        />
      </div>

      <div className="insight-workspace">
        <section className="insight-panel">
          <div className="insight-panel-head">
            <div>
              <h3>Evaluate Synthetic Fidelity</h3>
              <p>Run SDV diagnostics or quality scoring only when you want a deeper review.</p>
            </div>
            <div className="inline-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleRunEvaluation('diagnostic')}
                disabled={!canRunInsights || isRunningDiagnostic || isRunningQuality || isBuildingChart}
              >
                {isRunningDiagnostic ? 'Running diagnostics...' : 'Run Diagnostics'}
              </button>
              <button
                type="button"
                onClick={() => handleRunEvaluation('quality')}
                disabled={!canRunInsights || isRunningDiagnostic || isRunningQuality || isBuildingChart}
              >
                {isRunningQuality ? 'Running quality...' : 'Run Data Quality'}
              </button>
            </div>
          </div>

          {!canRunInsights && (
            <p className="helper-text">Generate a synthetic dataset first to unlock diagnostics and quality scoring.</p>
          )}

          <div className="report-grid">
            <EvaluationReportCard
              title="Diagnostic Report"
              report={evaluationResults.diagnostic}
              emptyMessage="Run diagnostics to validate data structure, adherence, and boundary checks."
            />
            <EvaluationReportCard
              title="Quality Report"
              report={evaluationResults.quality}
              emptyMessage="Run data quality scoring to compare column shapes and pairwise trends."
            />
          </div>
        </section>

        <section className="insight-panel">
          <div className="insight-panel-head">
            <div>
              <h3>Visualize Similarity</h3>
              <p>Build a simple in-page 1D or 2D comparison chart for selected columns.</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={handleBuildVisualization}
              disabled={!canRunInsights || isBuildingChart || isRunningDiagnostic || isRunningQuality || !primaryColumn || (chartMode === '2d' && availableColumns.length < 2)}
            >
              {isBuildingChart ? 'Building chart...' : 'Generate Chart'}
            </button>
          </div>

          <div className="options-grid chart-config-grid">
            <div className="form-group">
              <label htmlFor="chart-mode">Visualization</label>
              <select id="chart-mode" value={chartMode} onChange={(event) => setChartMode(event.target.value)}>
                <option value="1d">1D distribution</option>
                <option value="2d" disabled={availableColumns.length < 2}>2D relationship</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="primary-column">Primary column</label>
              <select id="primary-column" value={primaryColumn} onChange={(event) => setPrimaryColumn(event.target.value)} disabled={!availableColumns.length}>
                {availableColumns.length ? (
                  availableColumns.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))
                ) : (
                  <option value="">Select a column</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="secondary-column">Secondary column</label>
              <select
                id="secondary-column"
                value={secondaryColumn}
                onChange={(event) => setSecondaryColumn(event.target.value)}
                disabled={chartMode !== '2d' || availableColumns.length < 2}
              >
                {availableColumns.length > 1 ? (
                  availableColumns
                    .filter((column) => column !== primaryColumn)
                    .map((column) => (
                      <option key={column} value={column}>{column}</option>
                    ))
                ) : (
                  <option value="">Select another column</option>
                )}
              </select>
            </div>
          </div>

          <VisualizationChart
            chartData={visualizationResult}
            emptyMessage="Generate a chart to compare how the real and synthetic datasets align for the selected columns."
          />
        </section>
      </div>
    </section>
  );
}

export default GenerateFromSample;
