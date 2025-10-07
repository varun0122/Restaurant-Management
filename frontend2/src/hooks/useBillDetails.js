import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import toast from 'react-hot-toast';

export const useBillDetails = (billId, onUpdate) => {
    const [bill, setBill] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getAuthConfig = () => {
        const token = localStorage.getItem('customer_access_token');
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    };

    const fetchDetails = useCallback(async () => {
        if (!billId) return;
        setLoading(true);
        try {
            const config = getAuthConfig();
            const [billRes, customerRes] = await Promise.all([
                apiClient.get(`/billing/customer/${billId}/`, config),
                apiClient.get('/customers/me/', config),
            ]);
            setBill(billRes.data);
            setCustomer(customerRes.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Could not fetch your bill details.');
        } finally {
            setLoading(false);
        }
    }, [billId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleApiAction = async (actionPromise, successMessage, errorMessage) => {
        try {
            await actionPromise;
            await fetchDetails();
            toast.success(successMessage);
            if (onUpdate) onUpdate();
        } catch (err) {
            toast.error(err?.response?.data?.error || errorMessage);
            throw err; 
        }
    };

    const applyCoins = (coins) => {
        const promise = apiClient.post(`/billing/bills/${billId}/apply-coins/`, { coins }, getAuthConfig());
        return handleApiAction(promise, 'Coins applied!', 'Failed to apply coins.');
    };

    const removeCoins = () => {
        const promise = apiClient.post(`/billing/bills/${billId}/remove-coins/`, {}, getAuthConfig());
        return handleApiAction(promise, 'Coins removed!', 'Failed to remove coins.');
    };

    const applyDiscount = (code) => {
        const promise = apiClient.post(`/billing/customer/${billId}/apply-discount/`, { code }, getAuthConfig());
        return handleApiAction(promise, 'Discount applied!', 'Failed to apply discount.');
    };

    const removeDiscount = () => {
        const promise = apiClient.post(`/billing/customer/${billId}/remove-discount/`, {}, getAuthConfig());
        return handleApiAction(promise, 'Discount removed!', 'Failed to remove discount.');
    };

    return { bill, setBill, customer, loading, error, fetchDetails, applyCoins, removeCoins, applyDiscount, removeDiscount };
};