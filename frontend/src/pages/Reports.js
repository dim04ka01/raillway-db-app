import { useState } from 'react';
import axios from 'axios';

function Reports() {
    const [reportType, setReportType] = useState('employees');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (userRole !== 'Администрация') {
        return <div className="error">Доступ запрещён. Только для администрации.</div>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(
                '/api/reports/generate',
                {
                    reportType,
                    periodStart,
                    periodEnd,
                    departmentId: departmentId || undefined
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report_${reportType}_${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка генерации отчёта');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Генерация отчётов (Excel)</h1>
            <form onSubmit={handleSubmit} className="report-form" style={{ maxWidth: '500px', marginTop: '20px' }}>
                <div className="form-group">
                    <label>Тип отчёта*</label>
                    <select className="form-input" value={reportType} onChange={(e) => setReportType(e.target.value)} required>
                        <option value="employees">Сотрудники</option>
                        <option value="rollingStock">Подвижной состав (локомотивы и вагоны)</option>
                        <option value="maintenance">История обслуживания</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Период с (дата начала)</label>
                    <input type="date" className="form-input" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Период по (дата окончания)</label>
                    <input type="date" className="form-input" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Отдел (для отчёта по сотрудникам)</label>
                    <input type="text" className="form-input" placeholder="ID отдела (необязательно)" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} />
                </div>
                {error && <div className="error-message">{error}</div>}
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Генерация...' : 'Скачать отчёт (Excel)'}
                </button>
            </form>
        </div>
    );
}

export default Reports;