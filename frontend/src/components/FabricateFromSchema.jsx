import React, { useState } from 'react';

function FabricateFromSchema() {
  const [tableName, setTableName] = useState('fabricated_data');
  const [columns, setColumns] = useState([{ name: '', type: '' }]);
  const [numRows, setNumRows] = useState(100);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleColumnChange = (index, field, value) => {
    const newColumns = [...columns];
    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  const addColumn = () => {
    setColumns([...columns, { name: '', type: '' }]);
  };

  const removeColumn = (index) => {
    const newColumns = columns.filter((_, i) => i !== index);
    setColumns(newColumns);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const schema = {
      table_name: tableName,
      columns: columns.reduce((acc, col) => {
        if (col.name && col.type) acc[col.name] = col.type;
        return acc;
      }, {}),
      num_rows: numRows
    };

    if (Object.keys(schema.columns).length === 0) {
      setMessage('Please add at least one column.');
      return;
    }

    setIsLoading(true);
    setMessage('Fabricating data... this may take a moment.');

    try {
      const response = await fetch('/fabricate-from-schema/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong');
      }

      setMessage(`Success! Fabricated data saved to: ${data.output_file}`);

    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>2. Fabricate Data from Schema</h2>
      <p>Define a schema with column names and types. The system will generate synthetic data based on the schema.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="table-name">Table Name:</label>
          <input
            id="table-name"
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Columns:</label>
          {columns.map((col, index) => (
            <div key={index} className="column-row">
              <input
                type="text"
                placeholder="Column name"
                value={col.name}
                onChange={(e) => handleColumnChange(index, 'name', e.target.value)}
                required
              />
              <select
                value={col.type}
                onChange={(e) => handleColumnChange(index, 'type', e.target.value)}
                required
              >
                <option value="">Select type</option>
                <option value="name">name</option>
                <option value="email">email</option>
                <option value="address">address</option>
                <option value="random_int">random_int</option>
                <option value="date_this_decade">date_this_decade</option>
                {/* Add more options as needed */}
              </select>
              <button type="button" onClick={() => removeColumn(index)}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={addColumn}>Add Column</button>
        </div>

        <div className="form-group">
          <label htmlFor="num-rows">Number of Rows:</label>
          <input
            id="num-rows"
            type="number"
            value={numRows}
            onChange={(e) => setNumRows(parseInt(e.target.value))}
            min="1"
            required
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Fabricating...' : 'Fabricate Data'}
        </button>
      </form>

      {message && <p className="message">{message}</p>}
    </section>
  );
}

export default FabricateFromSchema;