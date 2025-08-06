import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../api/axiosConfig';
import styles from './SalesChart.module.css';

const SalesChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await apiClient.get('/orders/daily-sales-chart/');
        // Format the date for better display on the chart's X-axis
        const formattedData = response.data.map(item => ({
          ...item,
          // Takes a date like "2025-07-18" and turns it into "Jul 18"
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));
        setData(formattedData);
      } catch (error) {
        console.error("Failed to fetch sales chart data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, []);

  if (loading) {
    return <div className={styles.chartContainer}>Loading chart...</div>;
  }

  return (
    <div className={styles.chartContainer}>
      <h3>Last 7 Days Sales</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
          <Legend />
          <Bar dataKey="revenue" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;