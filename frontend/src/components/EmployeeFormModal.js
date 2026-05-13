import { useState, useEffect } from 'react';
import axios from 'axios';

function EmployeeFormModal({ employee, onClose, onSaved }) {
    const [formData, setFormData] = useState({
        lastName: '',
        firstName: '',
        middleName: '',
        birthDate: '',
        phone: '',
        email: '',
        positionId: '',
        brigadeId: ''
    });
    const [positions, setPositions] = useState([]);
    const [brigades, setBrigades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');
    const isEdit = !!employee;

    useEffect(() => {
        // Загружаем справочники
        const fetchSelects = async () => {
            try {
                const [posRes, brigRes] = await Promise.all([
                    axios.get('/api/positions', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('/api/brigades', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setPositions(posRes.data);
                setBrigades(brigRes.data);
            } catch (err) {
                console.error('Ошибка загрузки справочников', err);
            }
        };
        fetchSelects();

        if (employee) {
            setFormData({
                lastName: employee.lastName || '',
                firstName: employee.firstName || '',
                middleName: employee.middleName || '',
                birthDate: employee.birthDate || '',
                phone: employee.phone || '',
                email: employee.email || '',
                positionId: employee.positionId || '',
                brigadeId: employee.brigadeId || ''
            });
        }
    }, [employee, token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const url = isEdit ? `/api/employees/${employee.id}` : '/api/employees';
            const method = isEdit ? 'put' : 'post';
            await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSaved();
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{isEdit ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Фамилия*</label>
                        <input name="lastName" className="form-input" value={formData.lastName} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Имя*</label>
                        <input name="firstName" className="form-input" value={formData.firstName} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Отчество</label>
                        <input name="middleName" className="form-input" value={formData.middleName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Дата рождения</label>
                        <input type="date" name="birthDate" className="form-input" value={formData.birthDate} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Телефон</label>
                        <input name="phone" className="form-input" value={formData.phone} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Должность</label>
                        <select name="positionId" className="form-input" value={formData.positionId} onChange={handleChange} required>
                            <option value="">Выберите</option>
                            {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Бригада</label>
                        <select name="brigadeId" className="form-input" value={formData.brigadeId} onChange={handleChange} required>
                            <option value="">Выберите</option>
                            {brigades.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="modal-buttons">
                        <button type="button" className="btn" onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EmployeeFormModal;