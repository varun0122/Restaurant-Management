import React, { useEffect, useState } from 'react';
import apiClient from '../api/axiosConfig';
import styles from './AdminQRDownload.module.css';
import { FiEye, FiDownload } from 'react-icons/fi'; // Import icons

// A new component for the full-screen preview modal
const PreviewModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="QR Code Preview" className={styles.modalImage} />
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
      </div>
    </div>
  );
};

const AdminQRDownload = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null); // State to manage the modal

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await apiClient.get('/tables/');
        setTables(response.data);
      } catch (err) {
        console.error('Failed to load table QR codes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  // This function forces the browser to download the file
  const handleDownload = (imageUrl, filename) => {
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(() => alert('Failed to download file.'));
  };

  if (loading) {
    return <div className={styles.container}><h4>Loading QR Codes...</h4></div>;
  }

  return (
    <>
      <div className={styles.container}>
        <h4>Download Table QR Codes</h4>
        <p>Preview the QR code or download it directly to your device.</p>
        <div className={styles.grid}>
          {tables.map(table => (
            <div key={table.id} className={styles.card}>
              <h5>Table {table.table_number}</h5>
              <img
                src={table.qr_code_url}
                alt={`QR Code for Table ${table.table_number}`}
                className={styles.qrImage}
                onClick={() => setPreviewImage(table.qr_code_url)} // Click image to preview
              />
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.actionButton} 
                  onClick={() => setPreviewImage(table.qr_code_url)}
                >
                  <FiEye /> Preview
                </button>
                <button 
                  className={`${styles.actionButton} ${styles.downloadButton}`}
                  onClick={() => handleDownload(table.qr_code_url, `table_${table.table_number}_qr.png`)}
                >
                  <FiDownload /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <PreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </>
  );
};

export default AdminQRDownload;
