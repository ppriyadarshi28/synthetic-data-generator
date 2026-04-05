# Import necessary libraries
import os
from typing import Any, Dict, Optional

import numpy as np
import pandas as pd
from faker import Faker
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sdv.evaluation.single_table import evaluate_quality, run_diagnostic
from sdv.metadata import SingleTableMetadata
from sdv.single_table import GaussianCopulaSynthesizer, CTGANSynthesizer

# Initialize Faker
fake = Faker()

# Create the output directory if it doesn't exist
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUTPUT_DIR = os.path.join(BASE_DIR, 'backend', 'output')
os.makedirs(OUTPUT_DIR, exist_ok=True)

SUPPORTED_SAMPLE_FILE_TYPES = {'.csv', '.xlsx', '.xls'}
SYNTHESIZER_LABELS = {
    'gaussian_copula': 'Gaussian Copula',
    'ctgan': 'CTGAN',
}

# Initialize the FastAPI app
app = FastAPI(
    title="Synthetic Data Generator API",
    description="An API to generate synthetic data",
    version="1.0.0",
)

# --- 1. CORS (Cross-Origin Resource Sharing) Configuration ---
# This is crucial for allowing the React dev server (e.g., on localhost:3000)
# to make requests to the FastAPI server (e.g., on localhost:8000).
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Common port for Vite React apps
    # Add other origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for schema definition
class SchemaDefinition(BaseModel):
    table_name: str = Field("fabricated_data", example="user_data")
    columns: Dict[str, str] = Field(..., example={
        "name": "name",
        "email": "email",
        "address": "address",
        "age": "random_int",
        "signup_date": "date_this_decade"
    })
    num_rows: int = Field(100, gt=0)


def _read_uploaded_dataframe(file: UploadFile) -> pd.DataFrame:
    """Read CSV or Excel sample data into a cleaned dataframe."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Please choose a CSV or Excel file to continue.")

    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in SUPPORTED_SAMPLE_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls)."
        )

    file.file.seek(0)

    try:
        if extension == '.csv':
            dataframe = pd.read_csv(file.file)
        else:
            dataframe = pd.read_excel(file.file)
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="Excel support requires the 'openpyxl' or 'xlrd' package to be installed."
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to read the uploaded file: {exc}") from exc

    dataframe = dataframe.dropna(how='all').copy()
    if dataframe.empty:
        raise HTTPException(status_code=400, detail="The uploaded dataset is empty or only contains blank rows.")

    dataframe.columns = [
        str(column).strip() or f"column_{index}"
        for index, column in enumerate(dataframe.columns, start=1)
    ]
    return dataframe


def _create_metadata(dataframe: pd.DataFrame) -> SingleTableMetadata:
    metadata = SingleTableMetadata()
    metadata.detect_from_dataframe(dataframe)
    return metadata


def _serialize_value(value: Any):
    if pd.isna(value):
        return None
    if hasattr(value, 'item'):
        try:
            value = value.item()
        except Exception:
            pass
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    return value


def _records_from_dataframe(dataframe: pd.DataFrame, limit: Optional[int] = None):
    records_frame = dataframe.copy()
    if limit is not None:
        safe_limit = max(1, min(limit, len(records_frame)))
        records_frame = records_frame.head(safe_limit)

    records_frame = records_frame.astype(object).where(pd.notnull(records_frame), None)

    return [
        {column: _serialize_value(value) for column, value in row.items()}
        for row in records_frame.to_dict(orient='records')
    ]


def _serialize_preview(dataframe: pd.DataFrame, limit: int = 50):
    safe_limit = max(1, min(limit, 50, len(dataframe)))
    return _records_from_dataframe(dataframe, limit=safe_limit)


def _build_single_table_synthesizer(
    synthesizer_name: str,
    metadata: SingleTableMetadata,
    ctgan_epochs: int,
    enforce_min_max_values: bool,
    enforce_rounding: bool,
):
    normalized_name = (synthesizer_name or '').strip().lower()

    if normalized_name == 'gaussian_copula':
        return GaussianCopulaSynthesizer(
            metadata=metadata,
            enforce_min_max_values=enforce_min_max_values,
            enforce_rounding=enforce_rounding,
        )

    if normalized_name == 'ctgan':
        return CTGANSynthesizer(
            metadata=metadata,
            epochs=ctgan_epochs,
            verbose=False,
            enforce_min_max_values=enforce_min_max_values,
            enforce_rounding=enforce_rounding,
        )

    raise HTTPException(
        status_code=400,
        detail=f"Unsupported synthesizer '{synthesizer_name}'. Choose Gaussian Copula or CTGAN."
    )


def _load_generated_dataframe(output_file: str) -> pd.DataFrame:
    normalized_output_path = os.path.abspath(output_file)
    allowed_root = os.path.abspath(OUTPUT_DIR)

    if not normalized_output_path.startswith(allowed_root):
        raise HTTPException(status_code=400, detail="The requested synthetic output file is outside the allowed output directory.")

    if not os.path.exists(normalized_output_path):
        raise HTTPException(status_code=404, detail="The synthetic output file could not be found. Please generate data again.")

    try:
        dataframe = pd.read_csv(normalized_output_path)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to read the synthetic output file: {exc}") from exc

    if dataframe.empty:
        raise HTTPException(status_code=400, detail="The generated synthetic dataset is empty.")

    return dataframe


def _build_report_payload(report, detail_limit: int = 10):
    property_frame = report.get_properties().copy()
    properties = []
    details = {}

    for _, row in property_frame.iterrows():
        property_name = str(row.get('Property'))
        score = round(float(row.get('Score', 0)) * 100, 1)
        properties.append({
            'name': property_name,
            'score': score,
        })

        try:
            details[property_name] = _records_from_dataframe(report.get_details(property_name), limit=detail_limit)
        except Exception:
            details[property_name] = []

    return {
        'score': round(float(report.get_score()) * 100, 1),
        'properties': properties,
        'details': details,
    }


def _build_1d_chart_payload(real_series: pd.Series, synthetic_series: pd.Series, column_name: str):
    real_clean = real_series.dropna()
    synthetic_clean = synthetic_series.dropna()
    combined = pd.concat([real_clean, synthetic_clean], ignore_index=True)

    if combined.empty:
        raise HTTPException(status_code=400, detail=f"The selected column '{column_name}' does not contain values for charting.")

    if pd.api.types.is_numeric_dtype(combined):
        minimum = float(combined.min())
        maximum = float(combined.max())

        if minimum == maximum:
            series = [{
                'label': f"{minimum:.2f}",
                'real': int(real_clean.count()),
                'synthetic': int(synthetic_clean.count()),
            }]
        else:
            bin_count = min(8, max(4, combined.nunique()))
            bins = np.linspace(minimum, maximum, num=bin_count + 1)
            bins = np.unique(bins)
            if len(bins) < 2:
                bins = np.array([minimum, maximum + 1])

            real_binned = pd.cut(real_clean, bins=bins, include_lowest=True, duplicates='drop')
            synthetic_binned = pd.cut(synthetic_clean, bins=bins, include_lowest=True, duplicates='drop')
            ordered_bins = list(real_binned.cat.categories if hasattr(real_binned, 'cat') else [])
            if hasattr(synthetic_binned, 'cat'):
                for interval in synthetic_binned.cat.categories:
                    if interval not in ordered_bins:
                        ordered_bins.append(interval)

            series = []
            for interval in ordered_bins:
                label = f"{float(interval.left):.1f} to {float(interval.right):.1f}"
                series.append({
                    'label': label,
                    'real': int((real_binned == interval).sum()),
                    'synthetic': int((synthetic_binned == interval).sum()),
                })

        return {
            'mode': '1d',
            'chart_type': 'bar',
            'kind': 'numeric',
            'primary_column': column_name,
            'series': series,
        }

    real_strings = real_clean.astype(str)
    synthetic_strings = synthetic_clean.astype(str)
    top_categories = pd.concat([real_strings, synthetic_strings]).value_counts().head(8).index.tolist()

    series = [
        {
            'label': category,
            'real': int((real_strings == category).sum()),
            'synthetic': int((synthetic_strings == category).sum()),
        }
        for category in top_categories
    ]

    return {
        'mode': '1d',
        'chart_type': 'bar',
        'kind': 'categorical',
        'primary_column': column_name,
        'series': series,
    }


def _build_2d_chart_payload(real_dataframe: pd.DataFrame, synthetic_dataframe: pd.DataFrame, primary_column: str, secondary_column: str):
    real_pair = real_dataframe[[primary_column, secondary_column]].dropna().copy()
    synthetic_pair = synthetic_dataframe[[primary_column, secondary_column]].dropna().copy()

    if real_pair.empty and synthetic_pair.empty:
        raise HTTPException(status_code=400, detail="The selected column combination does not contain enough values for a 2D comparison.")

    both_numeric = (
        pd.api.types.is_numeric_dtype(real_pair[primary_column])
        and pd.api.types.is_numeric_dtype(real_pair[secondary_column])
        and pd.api.types.is_numeric_dtype(synthetic_pair[primary_column])
        and pd.api.types.is_numeric_dtype(synthetic_pair[secondary_column])
    )

    if both_numeric:
        real_points = _records_from_dataframe(real_pair.sample(n=min(len(real_pair), 120), random_state=42))
        synthetic_points = _records_from_dataframe(synthetic_pair.sample(n=min(len(synthetic_pair), 120), random_state=42))

        return {
            'mode': '2d',
            'chart_type': 'scatter',
            'primary_column': primary_column,
            'secondary_column': secondary_column,
            'real_points': real_points,
            'synthetic_points': synthetic_points,
        }

    real_pairs = real_pair.astype(str).agg(' • '.join, axis=1)
    synthetic_pairs = synthetic_pair.astype(str).agg(' • '.join, axis=1)
    top_pairs = pd.concat([real_pairs, synthetic_pairs]).value_counts().head(10).index.tolist()

    series = [
        {
            'label': label,
            'real': int((real_pairs == label).sum()),
            'synthetic': int((synthetic_pairs == label).sum()),
        }
        for label in top_pairs
    ]

    return {
        'mode': '2d',
        'chart_type': 'pair-bar',
        'primary_column': primary_column,
        'secondary_column': secondary_column,
        'series': series,
    }


# Create a root endpoint for a simple health check
# @app.get("/")
# def read_root():
#     """A simple endpoint to check if the API is running."""
#     return {"message": "Welcome to the Synthetic Data Generator API!"}


# Define endpoints for generating data from a sample file
@app.post("/generate-from-sample/preview-input")
async def preview_input_sample(file: UploadFile = File(...)):
    """Return a quick preview of the uploaded CSV or Excel sample file."""
    dataframe = _read_uploaded_dataframe(file)

    return {
        "file_name": file.filename,
        "row_count": int(len(dataframe)),
        "column_count": int(len(dataframe.columns)),
        "columns": list(dataframe.columns),
        "preview": _serialize_preview(dataframe),
    }


@app.post("/generate-from-sample/")
async def generate_from_sample(
    file: UploadFile = File(...),
    synthesizer_name: str = Form("gaussian_copula"),
    num_rows: Optional[int] = Form(None),
    ctgan_epochs: int = Form(300),
    enforce_min_max_values: bool = Form(True),
    enforce_rounding: bool = Form(True),
):
    """Accept sample data, train the selected synthesizer, and return preview-friendly results."""
    dataframe = _read_uploaded_dataframe(file)

    requested_rows = num_rows or len(dataframe)
    if requested_rows <= 0:
        raise HTTPException(status_code=400, detail="Number of synthetic rows must be greater than zero.")

    if ctgan_epochs <= 0:
        raise HTTPException(status_code=400, detail="CTGAN epochs must be greater than zero.")

    try:
        metadata = _create_metadata(dataframe)
        synthesizer = _build_single_table_synthesizer(
            synthesizer_name=synthesizer_name,
            metadata=metadata,
            ctgan_epochs=ctgan_epochs,
            enforce_min_max_values=enforce_min_max_values,
            enforce_rounding=enforce_rounding,
        )

        synthesizer.fit(dataframe)
        synthetic_data = synthesizer.sample(num_rows=requested_rows)

        safe_stem = os.path.splitext(os.path.basename(file.filename))[0].replace(' ', '_')
        normalized_name = synthesizer_name.strip().lower()
        output_filename = f"synthetic_{safe_stem}_{normalized_name}.csv"
        output_filepath = os.path.join(OUTPUT_DIR, output_filename)
        synthetic_data.to_csv(output_filepath, index=False)

        return {
            "message": "Synthetic data generated successfully!",
            "output_file": output_filepath,
            "synthesizer": SYNTHESIZER_LABELS.get(normalized_name, normalized_name),
            "num_rows_generated": int(len(synthetic_data)),
            "input_summary": {
                "row_count": int(len(dataframe)),
                "column_count": int(len(dataframe.columns)),
                "columns": list(dataframe.columns),
            },
            "real_preview": _serialize_preview(dataframe),
            "synthetic_preview": _serialize_preview(synthetic_data),
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"An error occurred: {exc}") from exc


@app.post("/generate-from-sample/evaluate")
async def evaluate_generated_sample(
    file: UploadFile = File(...),
    output_file: str = Form(...),
    report_type: str = Form("both"),
):
    """Run SDV diagnostic and quality evaluation against the generated synthetic dataset."""
    normalized_report_type = (report_type or 'both').strip().lower()
    if normalized_report_type not in {'diagnostic', 'quality', 'both'}:
        raise HTTPException(status_code=400, detail="report_type must be one of: diagnostic, quality, both.")

    real_dataframe = _read_uploaded_dataframe(file)
    synthetic_dataframe = _load_generated_dataframe(output_file)
    metadata = _create_metadata(real_dataframe)

    result = {
        'report_type': normalized_report_type,
    }

    try:
        if normalized_report_type in {'diagnostic', 'both'}:
            diagnostic_report = run_diagnostic(real_dataframe, synthetic_dataframe, metadata)
            result['diagnostic'] = _build_report_payload(diagnostic_report)

        if normalized_report_type in {'quality', 'both'}:
            quality_report = evaluate_quality(real_dataframe, synthetic_dataframe, metadata)
            result['quality'] = _build_report_payload(quality_report)

        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to evaluate the datasets: {exc}") from exc


@app.post("/generate-from-sample/visualize")
async def visualize_generated_sample(
    file: UploadFile = File(...),
    output_file: str = Form(...),
    chart_mode: str = Form('1d'),
    primary_column: str = Form(...),
    secondary_column: Optional[str] = Form(None),
):
    """Build chart-ready comparison data for 1D and 2D real vs synthetic visualizations."""
    normalized_mode = (chart_mode or '1d').strip().lower()
    if normalized_mode not in {'1d', '2d'}:
        raise HTTPException(status_code=400, detail="chart_mode must be '1d' or '2d'.")

    real_dataframe = _read_uploaded_dataframe(file)
    synthetic_dataframe = _load_generated_dataframe(output_file)

    if primary_column not in real_dataframe.columns or primary_column not in synthetic_dataframe.columns:
        raise HTTPException(status_code=400, detail=f"The selected column '{primary_column}' is not available in both datasets.")

    if normalized_mode == '1d':
        return _build_1d_chart_payload(real_dataframe[primary_column], synthetic_dataframe[primary_column], primary_column)

    if not secondary_column:
        raise HTTPException(status_code=400, detail="Please select a secondary column for 2D visualizations.")

    if secondary_column not in real_dataframe.columns or secondary_column not in synthetic_dataframe.columns:
        raise HTTPException(status_code=400, detail=f"The selected column '{secondary_column}' is not available in both datasets.")

    return _build_2d_chart_payload(real_dataframe, synthetic_dataframe, primary_column, secondary_column)
    
# --- Endpoint 2: Fabricate Data from Schema (CORRECTED WITH FAKER) ---
@app.post("/fabricate-from-schema/")
def fabricate_from_schema(schema: SchemaDefinition):
    """
    Fabricates mock data based on a user-defined schema using the Faker library.
    The 'columns' object should map your desired column name to a valid Faker provider.
    """
    fabricated_data = {}
    
    for col_name, provider_name in schema.columns.items():
        # Check if the requested provider is a valid method in Faker
        if not hasattr(fake, provider_name):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid Faker provider: '{provider_name}'. Please see Faker documentation for a list of valid providers."
            )
        
        # Generate a list of fake data for the column
        try:
            provider = getattr(fake, provider_name)
            fabricated_data[col_name] = [provider() for _ in range(schema.num_rows)]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating data for provider '{provider_name}': {e}")

    # Convert the dictionary to a pandas DataFrame
    df = pd.DataFrame(fabricated_data)

    # Save the data to a file
    output_filename = f"{schema.table_name}.csv"
    output_filepath = os.path.join("backend/output", output_filename)
    df.to_csv(output_filepath, index=False)

    return {
        "message": "Mock data fabricated successfully!",
        "output_file": output_filepath,
        "num_rows_generated": schema.num_rows
    }

# --- Static Files Mount (for Production) ---
# This line tells FastAPI that for any path that is not an API endpoint,
# it should look for a matching file in the built React dist folder.
# This will be used AFTER you build your React app for production.
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist'))
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")