import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminQRDownload = () => {
  const [tables, setTables] = useState([]);

  useEffect(() => {
    axios.get('/api/admin/tables/')
      .then(res => setTables(res.data))
      .catch(err => console.error('Failed to load table QR codes'));
  }, []);

  return (
    <div className="container mt-4">
      <h4>QR Codes for Tables</h4>
      <div className="row">
        {tables.map(table => (
          <div key={table.table_number} className="col-6 col-md-3 mb-4 text-center">
            <p><strong>Table {table.table_number}</strong></p>
            <img
              src={table.qr_image}
              alt={`QR Table ${table.table_number}`}
              className="img-fluid border"
            />
            <a
              href={table.qr_image}
              download={`table_${table.table_number}.png`}
              className="btn btn-sm btn-outline-primary mt-2"
            >
              Download QR
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQRDownload;
