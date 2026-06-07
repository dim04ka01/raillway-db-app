import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

function Profile() {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        lastName: '', firstName: '', middleName: '',
        birthDate: '', phone: '', email: ''
    });
    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
    const [passwordMessage, setPasswordMessage] = useState('');
    const token = localStorage.getItem('token');
    const employeeId = localStorage.getItem('employeeId');

    const fetchProfile = useCallback(async () => {
        try {
            const response = await axios.get(`/api/employees/${employeeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployee(response.data);
            setFormData({
                lastName: response.data.lastName || '',
                firstName: response.data.firstName || '',
                middleName: response.data.middleName || '',
                birthDate: response.data.birthDate || '',
                phone: response.data.phone || '',
                email: response.data.email || ''
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка загрузки профиля');
        } finally {
            setLoading(false);
        }
    }, [employeeId, token]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`/api/employees/${employeeId}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployee(response.data);
            setEditMode(false);
            alert('Данные обновлены');
        } catch (err) {
            alert(err.response?.data?.error || 'Ошибка обновления');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage('Пароли не совпадают');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setPasswordMessage('Пароль должен содержать не менее 6 символов');
            return;
        }
        try {
            await axios.put(`/api/user-data/${employeeId}`, { password: passwordData.newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPasswordMessage('Пароль успешно изменён');
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPasswordMessage(err.response?.data?.error || 'Ошибка смены пароля');
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!employee) return null;

    return (
        <div>
            <h1>Мой профиль</h1>
            <div className="profile-card">
                {!editMode ? (
                    <div>
                        <p><strong>ФИО:</strong> {employee.lastName} {employee.firstName} {employee.middleName}</p>
                        <p><strong>Дата рождения:</strong> {employee.birthDate || '—'}</p>
                        <p><strong>Должность:</strong> {employee.Position?.name || '—'}</p>
                        <p><strong>Бригада:</strong> {employee.Brigade?.name || '—'}</p>
                        <p><strong>Отдел:</strong> {employee.Brigade?.Department?.name || '—'}</p>
                        <p><strong>Телефон:</strong> {employee.phone || '—'}</p>
                        <p><strong>Email:</strong> {employee.email || '—'}</p>
                        <button className="btn btn-primary" onClick={() => setEditMode(true)}>Редактировать</button>
                    </div>
                ) : (
                    <form onSubmit={handleProfileUpdate}>
                        <div className="form-group">
                            <label>Фамилия</label>
                            <input name="lastName" className="form-input" value={formData.lastName} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                            <label>Имя</label>
                            <input name="firstName" className="form-input" value={formData.firstName} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                            <label>Отчество</label>
                            <input name="middleName" className="form-input" value={formData.middleName} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                            <label>Дата рождения</label>
                            <input type="date" name="birthDate" className="form-input" value={formData.birthDate} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                            <label>Телефон</label>
                            <input name="phone" className="form-input" value={formData.phone} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" className="form-input" value={formData.email} onChange={handleFormChange} />
                        </div>
                        <div className="modal-buttons">
                            <button type="button" className="btn" onClick={() => setEditMode(false)}>Отмена</button>
                            <button type="submit" className="btn btn-primary">Сохранить</button>
                        </div>
                    </form>
                )}
            </div>

            <div className="profile-card" style={{ marginTop: '20px' }}>
                <h3>Смена пароля</h3>
                <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                        <label>Новый пароль</label>
                        <input type="password" className="form-input" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Подтверждение пароля</label>
                        <input type="password" className="form-input" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required />
                    </div>
                    {passwordMessage && <div className="error-message">{passwordMessage}</div>}
                    <button type="submit" className="btn btn-primary">Изменить пароль</button>
                </form>
            </div>
        </div>
    );
}

export default Profile;