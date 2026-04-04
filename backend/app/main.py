# Import necessary libraries
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sdv.lite import SingleTablePreset
from sdv.metadata import SingleTableMetadata
import os
from pydantic import BaseModel, Field
from typing import Dict, Any
from faker import Faker

# Initialize Faker
fake = Faker()

# Create the output directory if it doesn't exist
os.makedirs("backend/output", exist_ok=True)

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

# Create a root endpoint for a simple health check
# @app.get("/")
# def read_root():
#     """A simple endpoint to check if the API is running."""
#     return {"message": "Welcome to the Synthetic Data Generator API!"}


# Define the endpoint for generating data from a sample file
@app.post("/generate-from-sample/")
async def generate_from_sample(file: UploadFile = File(...)):
    """
    Accepts a CSV file, trains a model, generates synthetic data,
    and saves it to the 'output' folder.
    """
    # Ensure the uploaded file is a CSV
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")

    try:
        # Define the path for the output file
        output_filename = f"synthetic_{file.filename}"
        output_filepath = os.path.join("backend/output", output_filename)

        # Read the uploaded CSV file into a pandas DataFrame
        # We use the file's temporary memory buffer to read it directly
        df = pd.read_csv(file.file)

        # Create metadata for the table
        metadata = SingleTableMetadata()
        metadata.detect_from_dataframe(df)

        # Initialize and train the SDV synthesizer
        # SingleTablePreset is a good choice for quickly modeling single tables.
        synthesizer = SingleTablePreset(name='FAST_ML', metadata=metadata)
        synthesizer.fit(data=df)

        # Generate synthetic data
        # Let's generate the same number of rows as the original data
        synthetic_data = synthesizer.sample(num_rows=len(df))

        # Save the synthetic data to a CSV file
        synthetic_data.to_csv(output_filepath, index=False)

        # Return a success message
        return {
            "message": "Synthetic data generated successfully!",
            "output_file": output_filepath
        }

    except Exception as e:
        # Handle potential errors during the process
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    
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
# it should look for a matching file in the 'static' directory.
# This will be used AFTER you build your React app for production.
app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")